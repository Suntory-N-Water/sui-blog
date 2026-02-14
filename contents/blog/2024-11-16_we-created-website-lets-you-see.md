---
title: 住んでいる地域の人口増減を一目でわかるWebサイトをつくった
slug: we-created-website-lets-you-see
date: 2024-11-16
modified_time: 2024-11-16
description: 都道府県と市区町村を選択するだけで、その地域の人口動態を可視化できるWebサイトを作成しました。Next.js、Recharts、shadcn/uiを使用した実装を紹介します。
icon: 🗾
icon_url: /icons/map_of_japan_flat.svg
tags:
  - Next.js
  - 個人開発
  - Recharts
  - shadcn/ui
---

## 概要

都道府県を選択して市区町村を選ぶだけで、その地域の人口動態(生産年齢人口、老年人口、年少人口)を可視化できるサイトを作成しました。

https://population-trend-graph.pages.dev/

引っ越しやお住まいの地域で人口の変化を気にしている方は、ぜひ試してみてください！😄

![人口動態グラフサイトのトップページで都道府県と市区町村の選択UIが表示されている](https://storage.googleapis.com/zenn-user-upload/8ef470b1fff9-20241113.png)


## 技術的なこと

## フレームワーク(Next.js)

インタラクティブな操作が多いので Vite + React の採用も考えましたが、OGP 対応などを考慮すると Next.js のほうがさまざまな点で便利であり、今後改修する際にファイルベースルーティングが魅力的であるため採用しました。

## デザイン(Tailwind CSS + shadcn/ui)

https://ui.shadcn.com/charts

shadcn/ui の Charts を実装してみたいと考え、何かグラフで比較するデータを探し始めたことがこのサイトを作成するきっかけとなりました。

今まで Chart.js しか使ったことはなかったのですが、カスタマイズ性が非常に高いと感じました。
shadcn/ui のグラフは recharts を使用しており、公式ドキュメントが充実している点も魅力的です。

https://recharts.org/en-US/

## デプロイ(Cloudflare Pages)

なんだかんだ使ったことなかったので、触ってみようと思ったのがきっかけです。
デプロイは Cloudflare のコンソール上でリポジトリを紐づけ、`@cloudflare/next-on-pages` を使用しています。

push or マージ時に `pnpm next-on-pages` が走ってデプロイまで自動で行ってくれます。

## その他実装で工夫したところ

## グラフのレスポンシブデザイン
スマートフォンでは画面の横幅が小さいため、グラフを縦長にして変化量を分かりやすくするように工夫しました。
```tsx
      <ChartContainer config={chartParamsConfig} className='w-full h-[500px] md:h-[500px] py-2'>
        <LineChart
          accessibilityLayer
          data={chartParams}
          margin={{
            top: 36,
            left: 24,
            right: 36,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey='year'
            tick={{ fontSize: 12, style: { fill: '#333' } }}
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            label={{ value: '(年)', position: 'insideRight', offset: -35, style: { fill: '#333' } }}
            padding={{ left: 20, right: 20 }}
          />
          <YAxis
            width={40}
            tick={{ fontSize: 12, style: { fill: '#333' } }}
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            label={{ value: '(人)', position: 'top', offset: 15, style: { fill: '#333' } }}
            tickFormatter={(tick: number) => tick.toLocaleString()}
            tickCount={6}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator='line' labelKey={'none'} />}
          />
          {selectedMunicipalities.map((municipalityName, index) => (
            <Line
              key={municipalityName}
              dataKey={municipalityName}
              type='natural'
              stroke={colorPalette[index % colorPalette.length]}
              strokeWidth={2}
              dot={{ fill: colorPalette[index % colorPalette.length] }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ChartContainer>
```

画像は東京都千代田区と中央区を比較した結果です。
![Rechartsで東京都千代田区と中央区の人口動態を比較した折れ線グラフ](https://storage.googleapis.com/zenn-user-upload/acb92fc484ff-20241113.png)

## DBを使用しない

人口データは政府統計の総合窓口(e-Stat)(https://www.e-stat.go.jp/)の住民基本台帳に基づく人口、人口動態及び世帯数調査(政府統計コード:00200241)を加工して作成しています。

使用したデータは DB を使用せずにソースコードに直接ハードコーディングする形で実装しました。

理由は以下の 4 つです。

1. 基本的にデータは 1 年に 1 度しか更新されない
2. 各地域の 2019 年~2024 年のデータだけでも 2MB 弱にしかならない(比較年が多いとグラフが逆に見づらい)
3. 動的データではない
4. API で取得する場合、先にデータを取得しておかないとボタン押下時にラグがある

2.で過去 5 年に絞った理由は、直近の人口が減少しているか増加しているかが分かれば十分と考えたためです。

下記は作成したデータの一例で `municipalities` は市区町村の一覧データで別れており、実際に人口データを取得するときは `municipalityCode` をキーにして `populations` を検索します。

```tsx
export const municipalities = [
  {
    municipalityCode: '011002',
    prefectureCode: '01',
    prefectureName: '北海道',
    municipalityName: '札幌市',
  },
  {
    municipalityCode: '011011',
    prefectureCode: '01',
    prefectureName: '北海道',
    municipalityName: '札幌市中央区',
  },
  ...
]

export const populations = [
  {
    year: 2024,
    municipalityCode: '011002',
    youngPopulation: 206184,
    workingPopulation: 1192995,
    elderlyPopulation: 557749,
  },
  {
    year: 2024,
    municipalityCode: '011011',
    youngPopulation: 22971,
    workingPopulation: 161543,
    elderlyPopulation: 60509,
  },
  ...
]
```

## 全部CSRにしない

ささやかながら SSG を取り入れたいと思い、都道府県の変更はクエリパラメータで設定して SSG でできそうな箇所と CSR で行うべき箇所を明確に分けて実装を行いました。

URL の `prefecture=` に無効な値(hogehoge 県)を指定しても初期値に戻るだけです。

## 改修するなら？

もしデータ量が増えて改修するならハードコードしている部分を DB に移す想定です。
現在は 2MB 程度なので操作に影響はありませんが、データが数 MB になると動作が重くなると考えられるため、最も現実的な対応としては県の選択時に対象の県のデータを DB から SELECT する実装を検討することです。

## おわりに
試しに 5 年分のみのデータを掲載していますが、それでも人口が増加している地区と減少している地区の違いが明確に分かります。
グラフの良いレイアウト案が思いついた場合は、10 年、20 年とデータ量を増やすことを検討したいと思います。