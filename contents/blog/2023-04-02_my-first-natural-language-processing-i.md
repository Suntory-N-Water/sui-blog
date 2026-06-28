---
title: 【Python】初めての自然言語処理？discord.pyでネガティブな単語に反応するbotを作ってみた。
slug: my-first-natural-language-processing-i
date: 2023-04-02
modified_time: 2023-04-02
description: Pythonとdiscord.pyを使ってネガティブな単語に反応するbotを作成。自然言語処理と形態素解析の入門。
icon: 🤖
icon_url: /icons/robot_flat.svg
tags:
  - Python
  - mecab
  - 自然言語処理
  - 形態素解析
  - Discord
---
## まえがき

自然言語処理、形態素解析について理解できていない部分が多いです。

誤った解釈をしていたら、ご指摘ください。

## 目的

友人同士でTwitterのように使っているdiscord鯖で「**ネガティブな発言って、自分にも周りにも良くないよな**」といった話になった。

私が以前からdiscordのbotと自然言語処理に興味があったので、ネガティブな単語に反応し気づきを得てもらう目的でbotを作成した。

## 実施方法

Pythonでdiscord.pyを用いてbotを作成し、文体を形態素解析してネガティブな単語を発見したら反応させるようにした。

ネガティブな単語の要件として、日本語評価極性辞書を用いる。

## ソースコード

``` python source.py
import os
import discord
import MeCab
from collections import defaultdict

## 日本語評価極性辞書の読み込み
polarity_dict = defaultdict(lambda: 0)
with open('pn_ja_dic.txt', 'r', encoding='utf-8') as f:
    for line in f:
        word, _, _, polarity = line.strip().split(':')
        polarity_dict[word] = float(polarity)

## MeCabの設定
tagger = MeCab.Tagger()

## Bot のアクセストークン
DISCORD_BOT_TOKEN = os.environ.get("MY_DISCORD_BOT_TOKEN")

## 接続に必要な設定/オブジェクト
intents = discord.Intents.all()
client = discord.Client(intents=intents)

## 起動時に動作する処理
@client.event
async def on_ready():
    # 起動したらターミナルに通知する
    print("YOUR DISCORD BOT is ACTIVE now!")

## メッセージ受信時に動作する処理
@client.event
async def on_message(message):
    print(f"Received message: {message.content}")  # Debug message

    # Botからのメッセージは無視する
    if message.author == client.user:
        return

    # メッセージの感情分析を行う
    node = tagger.parseToNode(message.content)
    sentiment = 0
    while node:
        sentiment += polarity_dict[node.surface]
        node = node.next

    # ネガティブな雰囲気を感じる場合、返信を送信する
    # 閾値は要調整
    if sentiment < -0.7:
        await message.channel.send("ピピーっ！👮👮ネガティブ警察です🚨🚨🚨🙅🙅🙅🙅\nそのつぶやきは❗❗❗ネガティブな考えになるゾ😤😤😤💢💢💢")

## Bot の起動と Discord サーバーへの接続
client.run(DISCORD_BOT_TOKEN)
```

``` text pn_ja_dic.txt
優れる:すぐれる:動詞:1
良い:よい:形容詞:0.999995
喜ぶ:よろこぶ:動詞:0.999979
褒める:ほめる:動詞:0.999979
めでたい:めでたい:形容詞:0.999645

(中略)

ない:ない:助動詞:-0.999997
酷い:ひどい:形容詞:-0.999997
病気:びょうき:名詞:-0.999998
死ぬ:しぬ:動詞:-0.999999
悪い:わるい:形容詞:-1
```

## 実際の挙動と課題

![ネガちゃん.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/837411/e633dc31-2147-4557-ad5a-1a430bfc3da4.png)


現在のソースコードだと、極性値を加算しているため各品詞の極性値を計算した後にネガポジ判定をしている。

そのため**今日は誕生日です。** は反応しないが、**今日は水瀬いのりさんの誕生日です。** になると反応する。

各品詞の極性値を算出すると、**日**や**さ**で極性値がマイナスに向かうことが分かった。

```bash 今日は誕生日です。
今日: 0.172375
Sentiment:0.172375
は: 0
Sentiment:0.172375
誕生: 0.396127
Sentiment:0.5685020000000001
日: -0.903573
Sentiment:-0.3350709999999999
です: 0
Sentiment:-0.3350709999999999
。: 0
Sentiment:-0.3350709999999999
: 0
Sentiment:-0.3350709999999999
Total Sentiment:-0.3350709999999999
```

```bash 今日は水瀬いのりさんの誕生日です。
今日: 0.172375
Sentiment:0.172375
は: 0
Sentiment:0.172375
水: 0
Sentiment:0.172375
瀬: -0.273752
Sentiment:-0.101377
いのり: 0
Sentiment:-0.101377
さ: -0.93584
Sentiment:-1.037217
ん: 0
Sentiment:-1.037217
の: 0
Sentiment:-1.037217
誕生: 0.396127
Sentiment:-0.64109
日: -0.903573
Sentiment:-1.544663
です: 0
Sentiment:-1.544663
。: 0
Sentiment:-1.544663
: 0
Sentiment:-1.544663
Total Sentiment:-1.544663
Received message: ピピーっ！👮👮ネガティブ警察です🚨🚨🚨🙅🙅🙅🙅
そのつぶやきは❗❗❗ネガティブな考えになるゾ😤😤😤💢💢💢
```

## 今後の改善

- 極性値を判定する品詞を限定する
- どうにかこうにかして、文体からネガティブ要素を抜き出して反映させる

[こちらのブログ](https://nanjamonja.net/archives/766)に記載されているとおりですが、極性辞書にない単語は判定できないし、文脈によって異なる単語は誤って判定されます。

日本語って難しい…

## その他

github → https://github.com/Suntory-N-Water/NegativeCommentsCheck
