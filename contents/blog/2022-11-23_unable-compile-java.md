---
title: Java コンパイルができない
slug: unable-compile-java
date: 2022-11-23
modified_time: 2022-11-23
description: Java学習中にコンパイルができず無駄に時間を浪費した経験からの備忘録。Eclipseを使用したコンパイルエラーの解決方法。
icon: ☕
icon_url: /icons/hot_beverage_flat.svg
tags:
  - Java
  - Eclipse
---
## 目的
Javaを勉強中にコンパイルができず無駄に時間を浪費したので、備忘録として投稿します。

## 流れ

- 階層とやりたいことの確認
- 発生したエラー
- 解消法

## 階層構造
Eclipseを使用

`tree /f` にて階層を確認

```cmd
C:\ocjp\workspace\CoffeeChoiceApp>tree /f
```

```bash
C:.
│  .classpath
│  .project
│
├─.settings
│      org.eclipse.core.resources.prefs
│      org.eclipse.jdt.core.prefs
│
├─bin
│  └─main
│
└─src
    └─main
            BestCoffeeChoiceApp.java
            CheckNumber.java
            CoffeeTasteList.java
            ConnectDatabase.java
            ExecutingClass.java
```

## やりたいこと
`BestCoffeeChoiceApp.java` をコンパイルしたい

## 実際にやったこと
cmdからコンパイルをしようと下記の階層に移動し実行

```bash
C:\ocjp\workspace\CoffeeChoiceApp\src\main>javac BestCoffeeChoiceApp.java
```

## エラー内容
コンパイルしようとすると以下のようなエラーが発生した

```bash
BestCoffeeChoiceApp.java:9: エラー: シンボルを見つけられません
                ConnectDatabase cd = new ConnectDatabase();
                ^
  シンボル:   クラス ConnectDatabase
  場所: クラス BestCoffeeChoiceApp
BestCoffeeChoiceApp.java:9: エラー: シンボルを見つけられません
                ConnectDatabase cd = new ConnectDatabase();
                                         ^
  シンボル:   クラス ConnectDatabase
  場所: クラス BestCoffeeChoiceApp
BestCoffeeChoiceApp.java:10: エラー: シンボルを見つけられません
                CheckNumber cn = new CheckNumber();
                ^
  シンボル:   クラス CheckNumber
  場所: クラス BestCoffeeChoiceApp
BestCoffeeChoiceApp.java:10: エラー: シンボルを見つけられません
                CheckNumber cn = new CheckNumber();
                                     ^
  シンボル:   クラス CheckNumber
  場所: クラス BestCoffeeChoiceApp
BestCoffeeChoiceApp.java:12: エラー: シンボルを見つけられません
                        ExecutingClass ec = new ExecutingClass();
                        ^
  シンボル:   クラス ExecutingClass
  場所: クラス BestCoffeeChoiceApp
BestCoffeeChoiceApp.java:12: エラー: シンボルを見つけられません
                        ExecutingClass ec = new ExecutingClass();
                                                ^
  シンボル:   クラス ExecutingClass
  場所: クラス BestCoffeeChoiceApp
エラー6個
```

**エラー: シンボルを見つけられません**とはなんぞ？

## 調べてみた
> [Java「でシンボルが見つかりません」のエラー原因と対処方法を徹底解説](https://style.potepan.com/articles/32824.html#:~:text=Java%20%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%A0%E3%82%92%E4%BD%9C%E6%88%90%E3%81%97,%E3%81%AA%E3%81%84%E6%99%82%E3%81%AB%E7%99%BA%E7%94%9F%E3%81%97%E3%81%BE%E3%81%99%E3%80%82)

>[Javaでエラー: シンボルを見つけられませんというエラーが発生したがどうすればこのエラーを解決できるか知りたい](https://terakoya.sejuku.net/question/detail/16261)

上記のサイトを参考に原因をまとめた結果、以下の4点が主な原因だと判明した
- 変数やメソッド、クラスなどのスペルミス
- クラスを使用する際に必要なインポートがされていない
- private なのに外部クラスから参照したことによる不可視
- 外部ライブラリやビルドパスなどの誤り

ぼく「Eclipseで実行したときは普通に動くから、どれもありえなくない？？」

## 解消法

> [Java コンパイルに失敗する シンボルを見つけられません](https://teratail.com/questions/161406)

上記のサイトを参考に解消した

`src` をカレントディレクトリとして以下を実行する
```bash
javac main/BestCoffeeChoiceApp.java
```

無事コンパイルが完了した
