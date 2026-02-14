---
title: 【MySQL】CSVファイルをDBにインポートする
slug: importing-csv-file-into-database
date: 2022-11-11
modified_time: 2022-11-11
description: MySQLにCSVファイルをインポートする際に躓いた点と解決方法をまとめた備忘録。データベース、テーブル、権限設定について。
icon: 💾
icon_url: /icons/floppy_disk_flat.svg
tags:
  - MySQL
  - CSV
---
## 目的
MySQLにCSVファイルをインポートするときに少々躓いたので、解決方法を備忘録として投稿します。

## 流れ

- データベース、テーブル、ユーザーを作成
- 権限の確認と付与
- CSVファイルのインポート
- 躓いた箇所
- 解決策

## 作成
### データベースを作成

```sql 
create database coffeetypes;
```
### テーブルを作成
```sql 
create table testtable (
    store_name varchar(50) primary key,
    address varchar(50) not null,
    postal_code varchar(50)
);
```
### ユーザーを作成
```sql 
create user test@localhost identified by 'test0000';
```

## 権限
### 権限を付与
```sql 
show grants for test@localhost;
```
この時点では作成直後のためなにも権限は付与していない
```sql 
+------------------------------------------+
| Grants for test@localhost                |
+------------------------------------------+
| GRANT USAGE ON *.* TO `test`@`localhost` |
+------------------------------------------+
```

下記のコードですべての権限を与える
```sql
grant all on *.* to test@localhost;
```

## CSVファイルのインポート
### ユーザーを切り替える

先ほど作成したユーザーに切り替えて、CSVファイルのインポートを行う

```sql
load data local
    infile 'C:/Users/Users/Documents/Programming/Java/DB/javalesson/locationDoutor.csv'
    into table coffeetypes.testtable
    fields
    terminated by ','
;
```

入力をするとこのようなエラーが発生する

```sql
ERROR 2068 (HY000): LOAD DATA LOCAL INFILE file request rejected due to restrictions on access.
```

DeepLに聞いてみた
```
エラー 2068 (HY000)。LOAD DATA LOCAL INFILE ファイルリクエストは、アクセス制限のため拒否されました。
```


ぼく「権限与えたのにアクセス制限あるのか」


## 解決策
### エラーの原因を探る

MySQLのログイン時にオプションでローカルの入力ファイルを許可する必要があり、オプションの書き方は以下2通りある
```
--enable-local-infile
--local_infile=1 またはon
```

今回は上記の `--enable-local-infile` を検証する

### 一度ログアウトし、再度インポートを試みる

```terminal
mysql -u test -p --enable-local-infile
```

先程と同様に入力

```sql
load data local
    infile 'C:/Users/Users/Documents/Programming/Java/DB/javalesson/locationDoutor.csv'
    into table coffeetypes.testtable
    fields
    terminated by ','
;
```

結果
```sql
Query OK, 300 rows affected (0.04 sec)
Records: 300  Deleted: 0  Skipped: 0  Warnings: 0
```

できた！

## 結論

- csvファイルをインポートするときはログイン時に `--enable-local-infile` を忘れない

## 参考資料

- [MySQL ユーザを作成して権限を設定・削除する](https://qiita.com/miriwo/items/899c06fdc91beb2f6d62)
- [【MySQL】csvファイルをDBにインポートする方法](https://qiita.com/oden141/items/239a7ce3cfe3197a3ba7)
- [MySQL – CSVファイルのインポートでエラー](https://taustation.com/mysql-csv-file-import-error/)

