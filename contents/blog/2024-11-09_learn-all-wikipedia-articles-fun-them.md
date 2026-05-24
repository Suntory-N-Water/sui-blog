---
title: Wikipediaの全記事を学習させて、日本語で遊んでみる
slug: learn-all-wikipedia-articles-fun-them
date: 2024-11-09
modified_time: 2024-11-09
description: Wikipediaの全記事をWord2Vecに学習させて、単語同士の足し算や引き算を行うことができるWebサイトを作成しました。FastAPIの復習も兼ねた実装を紹介します。
icon: 🟰
icon_url: /icons/heavy_equals_sign_flat.svg
tags:
  - Python
  - 個人開発
  - Word2Vec
  - Wikipedia
---

## 元ネタ

https://www.youtube.com/watch?v=sK3HqLwag_w&list=WL&index=38

見てておもろそうだなーと思ったので、FastAPI の復習も兼ねて作ってみました。
動画に全て内容が載っていますが一応記載すると、Wikipedia の全記事内の文章を word2vec に学習させて単語を数値化することで、単語同士の足し算や引き算を行うことができます。

## できたもの

https://github.com/Suntory-N-Water/word-vectors-api

API にして公開したら面白そうだな～と思いましたが、Render だと学習データの容量が重くて NG な点とできる限り無料で運用したかったのでやめました🤔
学習させた model データもありますのでぜひ遊んでみてください。

> [!NOTE]
> 実際に外部公開するなら License 表記が必要になると思います。
> [コンテンツの二次利用に関して](https://ja.wikipedia.org/wiki/Wikipedia:%E3%83%87%E3%83%BC%E3%82%BF%E3%83%99%E3%83%BC%E3%82%B9%E3%83%80%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%89#%E3%82%B3%E3%83%B3%E3%83%86%E3%83%B3%E3%83%84%E3%81%AE%E4%BA%8C%E6%AC%A1%E5%88%A9%E7%94%A8%E3%81%AB%E9%96%A2%E3%81%97%E3%81%A6)

## 遊んでみる

## セットアップ

パッケージのインストール

```bash
poetry install
```

開発サーバーの起動

```bash
uvicorn api.main:app --reload --port 8000 --host 0.0.0.0
```

起動を確認後、`http://localhost:8000/docs` にアクセスします。

## 実行例

`水瀬いのり` から近い単語を得るために `http://localhost:8000/api/vectors?positive=水瀬いのり` で実行します。
すると声優に関連のワードを得ることができますね。

```json
{
  "positive_words": [
    {
      "word": "水瀬いのり"
    }
  ],
  "negative_words": [],
  "word_list": [
    {
      "word": "水樹",
      "similarity": 0.745496988296509
    },
    {
      "word": "裕香",
      "similarity": 0.732845783233643
    },
    {
      "word": "奈々",
      "similarity": 0.722927331924439
    },
    {
      "word": "愛美",
      "similarity": 0.713139891624451
    },
    {
      "word": "咲",
      "similarity": 0.69900643825531
    }
  ]
}
```

動画でも紹介されている「円 + 韓国 - 日本」で計算すると、やはりウォンが出力できます。
```json
// http://localhost:8000/api/vectors?positive=円,韓国&negative=日本
{
  "positive_words": [
    {
      "word": "円"
    },
    {
      "word": "韓国"
    }
  ],
  "negative_words": [
    {
      "word": "日本"
    }
  ],
  "word_list": [
    {
      "word": "ウォン",
      "similarity": 0.6519988775253296
    },
    {
      "word": "億",
      "similarity": 0.5680368542671204
    },
    {
      "word": "ドル",
      "similarity": 0.5642450451850891
    },
    {
      "word": "万",
      "similarity": 0.5566189885139465
    },
    {
      "word": "額",
      "similarity": 0.5470199584960938
    }
  ]
}
```

API は足し算したい単語であれば `positive`、引き算したい単語であれば `negative` にカンマ区切りで設定します。
クエリパラメータに入力された値を一度分かち書きしてから、モデルに入力を行います。

```py router/vectors.py
@router.get(
    "/vectors",
    response_model=vectors_schema.WordVectorResponse,
    responses={
        400: {"model": BadRequestError, "description": "入力値が不正な場合のエラー"},
        404: {"model": NotFoundError, "description": "類似する単語が見つからなかった場合のエラー"},
        500: {"description": "サーバー内部エラー"},
    },
    response_description="単語ベクトルの計算結果",
    summary="単語ベクトルの計算",
    description="単語同士の足し算・引き算を行い、類似する単語を返却します",
)
async def calculate_vectors(
    positive: str | None = Query(
        default=None, description="足し算したい単語(カンマ区切り。例：Python,プログラミング)"
    ),
    negative: str | None = Query(default=None, description="引き算したい単語(カンマ区切り。例：パソコン)"),
    topn: int = Query(default=5, ge=1, le=20),
) -> vectors_schema.WordVectorResponse:
    try:
        if positive is None and negative is None:
            raise TypedHTTPException(
                error_response=BadRequestError(message="positiveまたはnegativeワードのいずれかは必須です。")
            )

        _positive_terms = positive.split(",") if positive else []
        _negative_terms = negative.split(",") if negative else []

        # 各単語を分かち書きする
        wakati_positive_terms = mecab.tokenize_list(_positive_terms)
        wakati_negative_terms = mecab.tokenize_list(_negative_terms)

        similar_words = vector.most_similar(positive=wakati_positive_terms, negative=wakati_negative_terms, topn=topn)

        if not similar_words:
            raise TypedHTTPException(
                error_response=NotFoundError(message="類似する単語が見つかりませんでした。別の単語で試してください。")
            )
        # 省略
```

```py services/tokenizer.py
import MeCab
from typing import List


class Tokenizer:
    def __init__(self):
        self.mecab = MeCab.Tagger("-Owakati")

    def tokenize(self, text: str) -> List[str]:
        # MeCabで形態素解析
        node = self.mecab.parseToNode(text)
        tokens = []

        while node:
            # 表層形を取得(実際の単語)
            surface = node.surface
            # 品詞情報を取得
            features = node.feature.split(",")

            # 空白と記号は除外
            if surface and features[0] not in ["記号", "BOS/EOS"]:
                tokens.append(surface)

            node = node.next

        return tokens

    def tokenize_list(self, texts: List[str]) -> List[str]:
        all_tokens = []
        for text in texts:
            tokens = self.tokenize(text)
            all_tokens.extend(tokens)
        return all_tokens
```

`positive` または `negative` が設定されていない場合は `400` エラーを返却します。
入力値によっては計算結果を得ることができないこともあったため、そのときは `404` エラーを返却します。

## おわりに
なにかおもしろい案が思いついたらアプリケーションにしていきたいですね。
動画で紹介されていたときと比べて年月が経過している影響か分かりませんが、同じ入力をしても同様の結果を得ることができなかったです。
記事の内容や学習させたデータの数によって変わるものなんでしょうかね？

## 他、参考にさせていたもの

https://zenn.dev/haru330/articles/503c217c3cda1e

https://qiita.com/hoppiece_/items/72753b7ac08f0bd4993f