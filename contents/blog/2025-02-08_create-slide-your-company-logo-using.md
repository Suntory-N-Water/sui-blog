---
title: Marpで企業ロゴが入ったスライドを作成する
slug: create-slide-your-company-logo-using
date: 2025-02-08
modified_time: 2025-02-08
description: "Marpで企業ロゴが入ったスライドを作成する方法を解説します。gaiaテーマとCSSの::after疑似要素を活用してヘッダーの右上にロゴを配置する実装を紹介します。"
icon: 🛝
icon_url: /icons/playground_slide_flat.svg
tags:
  - CSS
  - Marp
---

## ベースレイアウト

gaia テーマと yKicchan 様が作成した marp テンプレートリポジトリを使用しています。

https://github.com/marp-team/marp-core/blob/main/themes/gaia.scss

https://github.com/yKicchan/awesome-marp-template

## 企業ロゴの配置方法

企業ロゴをヘッダーの右上に配置するには、`::after` 疑似要素を活用した CSS を使用します。

## 実装

```css
/* ヘッダーの右上に企業ロゴを配置 */
header::after {
  content: "";
  display: block;
  position: absolute;
  right: 25px; 
  top: 10px; 
  width: 50px;
  height: 50px;
  background: url("./images/icon.png") no-repeat center;
  background-size: contain;
}
```

## 実装イメージ
![Marpスライドのヘッダーに企業ロゴと文字列が表示されている例](https://storage.googleapis.com/zenn-user-upload/ffcff39855a8-20250207.png)
*ヘッダーに文字列あり*

![Marpスライドのヘッダーにロゴのみが表示されている例](https://storage.googleapis.com/zenn-user-upload/8afd3ae147cc-20250207.png)
*ヘッダーを' 'にすることでロゴだけ表示できます*


## 各要素の解説

この CSS では、`header::after` 疑似要素を使用して、企業ロゴを **ヘッダーの右上** に適切に配置しています。

### 1. `header::after` の役割

```css
header::after {
  content: "";
  display: block;
}
```

- `::after` 疑似要素を利用し、`header` 内に追加の要素を作成。
- `content: "";` で要素を有効化。
- `display: block;` を指定し、`width` や `height` を適用可能にする。

### 2. `position: absolute;` でロゴの位置を固定

```css
position: absolute;
```

- `absolute` にすることで、`header` 内の特定の位置にロゴを配置可能。

### 3. ロゴを右上に配置

```css
right: 25px;
top: 10px;
width: 50px;
height: 50px;
```

### 4. `background` プロパティでロゴ画像を設定

```css
background: url("./images/icon.png") no-repeat center;
background-size: contain;
```

- `background` でロゴを適用し、中央に配置。
- `no-repeat` で繰り返しを防ぐ。
- `background-size: contain;` で適切なサイズ調整。

## スライドごとの画像設定方法

`index.md` と同じ階層の `./images` 配下に `icon.png` を格納します。
`./hoge` 配下のスライドではアイコン B、`demo` 配下のスライドではアイコン A ヘッダー部の画像で表示できます。

```bash
.
├── src
│   ├── demo
│   │   ├── images
│   │   │   └── icon.png ← アイコンA
│   │   └── index.md
│   ├── hoge
│   │   ├── images
│   │   │   └── icon.png ← アイコンB
│   │   └── index.md 
│   └── template
│       └── images
└── themes
    ├── global.css
    ├── index.css
    └── utility.css
```

## おわりに

この実装により、Marp のスライドで統一感のあるデザインを維持しつつ、ヘッダーにロゴを固定配置できます。

| プロパティ                                                | 役割                  |
| -------------------------------------------------------- | ----------------------- |
| `header::after`                                          | 疑似要素としてロゴ用のコンテナを作成      |
| `position: absolute;`                                    | `header` 内で右上に固定配置      |
| `right: 25px; top: 10px;`                                | ヘッダーの `padding` に合わせて調整 |
| `width: 50px; height: 50px;`                             | ロゴの大きさを固定               |
| `background: url("./images/icon.png") no-repeat center;` | ロゴ画像を適用                 |
| `background-size: contain;`                              | ロゴの縦横比を維持しながらフィット       |


