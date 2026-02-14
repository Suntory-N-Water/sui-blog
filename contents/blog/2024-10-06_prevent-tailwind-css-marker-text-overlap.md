---
title: Tailwind CSS マーカーとテキストの重なりを防ぐ方法
slug: prevent-tailwind-css-marker-text-overlap
date: 2024-10-06
modified_time: 2024-10-06
description: Tailwind CSSでリストアイテムが長くなった場合に、テキストがマーカーと重なってしまう問題の解決方法を解説します。
icon: 😊
icon_url: /icons/smiling_face_with_smiling_eyes_flat.svg
tags:
  - CSS
  - TailwindCSS
---

React を使ってリストを表示する際、ul タグのリストアイテムが長くなった場合、次の行のテキストがリストのマーカー(点や番号)と重なってしまうことがあります。
ここでは解決案の一例を解説します。

## 問題の概要
以下のようにリストを生成するコードがあります。
```jsx
<ul className='list-disc list-inside'>
  {liveNames.map((liveName) => (
    <li key={liveName.id} className='py-2 marker:text-primary'>
      {liveName.name}
    </li>
  ))}
</ul>
```
`list-inside` によって、マーカーをリストアイテムの内側に配置します。
これにより、リストアイテムが複数行に渡った際、改行されたテキストがマーカーと重なりやすくなってしまいます。
![モバイル表示でリストマーカーとテキストが重なっている問題の表示例](https://storage.googleapis.com/zenn-user-upload/73fc21072d92-20241006.png)
*モバイル表示でリストアイテムが複数行に渡ると、2行目以降のテキストがマーカーと重なっています。*

## 解決案
```jsx
<ul className='list-disc list-outside ml-6'>
  {liveNames.map((liveName) => (
    <li key={liveName.id} className='py-2 marker:text-primary'>
      {liveName.name}
    </li>
  ))}
</ul>
```
## リストマーカーを外側に配置する
`list-outside` を使って、マーカーをテキストの外側に配置します。
マーカーとテキストが明確に分離されるため、基本的なレイアウト問題を解消します。

## 適切なマージンを設定する
`ml-6` でリストアイテムの左にマージンを設定して、マーカーとテキストとの間に十分なスペースを確保します。これにより、マーカーとテキストが重ならないようにします。

![list-outside適用後にマーカーとテキストが分離された表示例](https://storage.googleapis.com/zenn-user-upload/215982537b01-20241006.png)
*マーカーとテキストが重ならないようになる*

`list-outside` を使う場合はマーカーがテキストの外側に配置されてしまうため、マージンの設定は必須です。

![ml-6なしでlist-outsideのみ適用した場合の表示例](https://storage.googleapis.com/zenn-user-upload/054d7b12048a-20241006.png)
*ml-6を記載しなかった場合。裏の茶色はDevToolsの背景色*

以上です。