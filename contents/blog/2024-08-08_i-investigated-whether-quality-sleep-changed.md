---
title: ニート→社会人になって睡眠の質は変化したのか調べてみた
slug: i-investigated-whether-quality-sleep-changed
date: 2024-08-08
modified_time: 2024-08-08
description: ニートから社会人になって睡眠の質がどう変化したのか、iPhoneのヘルスケアアプリのデータを使って定量的に分析しました。睡眠に関するデータ解析の方法を紹介します。
icon: 🛌
icon_url: /icons/person_in_bed_flat_default.svg
tags:
  - ヘルスケア
  - 睡眠
---

## はじめに

皆さんは睡眠にどの程度気を使っておりますでしょうか？
この記事では iPhone のヘルスケアアプリのデータを使って、睡眠の質を比較分析します。

私は人並み以上には気にしており、ちょっと良い寝具への投資や部屋のライトや室温、就寝前行動について見直してきました。
というのも、私は大学を卒業した 2021 年 3 月から 2022 年 2 月迄の間ニートでした。

ニート時に読み漁った健康本の知識が今の私を形成しているといっても過言ではないのですが、ふと過去の睡眠と今の睡眠でどれくらい質が変わっているか定量的に調査したいと思い、この投稿をするに至りました。

## 概要

iPhone のヘルスケアアプリからデータをエクスポートして、睡眠に関するデータを解析します。

## 使用するデータ

計測元の日数は合わせたいので、下記期間から睡眠計測をしている(1 ヶ月のうち 25 回以上)月を対象に実施します。 
計測をしなかった月や社会人期間中に睡眠計測をし始めたのが 2023 年の 11 月末という観点から、連続して 7 ヶ月程度が計測期間になると思います。

ニート期間 : 2021 年 4 月 1 日~2021 年 1 月 31 日までで睡眠計測をしている月

社会人期間 : 2023 年 11 月 22 日~2024 年 8 月 1 日までで睡眠計測をしている月

## 実践

## 手を動かす前に

iPhone のヘルスケアデータを解析するにあたって、どのように解析すれば良いか考えます。
目的は睡眠の質(睡眠時間や睡眠効率、深い睡眠の量)が変化しているかなので、関連しなさそうなデータの分析は省略したいと思います。

まずはエクスポートした XML で関連しそうなデータだけを取得していきます。
ヘルスケアのデータはヘルスケアアプリを開いた後、画面右上のアイコンを選択します。

画面下部に「すべてのヘルスケアデータを書き出す」ボタンがあるので選択して、ご自身の PC やアップロードしてください(ファイルが重たいので時間かかります)
![iPhoneヘルスケアアプリのデータ書き出しボタンの画面](https://storage.googleapis.com/zenn-user-upload/c82ae47776cc-20240808.jpeg)

## エクスポートしたファイルの確認

Apple Developer によると `HKCategoryValueSleepAnalysisAsleepDeep` という項目が深い睡眠を表しているようです。

https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis?changes=lat_3_1_4_6_7_1&language=objc

ですが私が取得したヘルスケアデータには詳細な深い睡眠を示す `HKCategoryValueSleepAnalysisAsleepDeep` やレム睡眠時間を表す `HKCategoryValueSleepAnalysisAsleepREM` がありません😭

XML を見たところ、`HKCategoryValueSleepAnalysisInBed`(ユーザーはベッドにいます)という項目は両者に設定されていました。
この値を取得して睡眠分析をしたいと思います。

```xml
<Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="AutoSleep" sourceVersion="6.7.40" creationDate="2022-07-04 09:21:33 +0900" startDate="2022-07-03 23:03:00 +0900" endDate="2022-07-04 06:22:00 +0900" value="HKCategoryValueSleepAnalysisInBed">
 ...(中略)
<Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="SOXAI" sourceVersion="2" creationDate="2024-01-03 07:55:23 +0900" startDate="2024-01-01 23:12:00 +0900" endDate="2024-01-02 07:49:00 +0900" value="HKCategoryValueSleepAnalysisInBed"/>
```

## PythonでXMLを整形する

やりたいことは以下です。

1. 下記データ期間(有効そうなデータがある 7 ヶ月間)の平均睡眠時間、中央値を取得する
    1. 2021 年 4 月 1 日~2021 年 10 月 31 日(ニート期間)
    2. 2023 年 11 月 22 日~2024 年 6 月 21 日(社会人期間)
2. 取得したデータから外れ値を計算対象から除外する
3. あまり変化が見られなかった場合、運動(1 日の歩数)との相関関係を確認する

ニート期間は AutoSleep で取得した睡眠時間をもとにします。
社会人期間は SOXAI で取得した睡眠時間をもとにします。

まずは平均睡眠時間と、睡眠時間の中央値を出力していきます。

```python data_processor.py
import pandas as pd

def calculate_sleep_metrics(df, start_date, end_date):
    # タイムゾーンを合わせる
    start_date = pd.to_datetime(start_date).tz_localize('Asia/Tokyo')
    end_date = pd.to_datetime(end_date).tz_localize('Asia/Tokyo')
    
    # 指定期間のデータをフィルタリング
    mask = (df['Start'] >= start_date) & (df['End'] <= end_date)
    period_df = df[mask]

    # 外れ値を除外
    period_df = remove_outliers(period_df, 'Duration')

    # 平均睡眠時間と中央値を計算
    mean_duration = period_df['Duration'].mean()
    median_duration = period_df['Duration'].median()
    
    return mean_duration, median_duration
```

```python data_loader.py
import pandas as pd
import xml.etree.ElementTree as ET

def load_sleep_data(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()
    
    sleep_data = []
    for record in root.findall('.//Record'):
        if record.get('type') == 'HKCategoryTypeIdentifierSleepAnalysis' and record.get('value') == 'HKCategoryValueSleepAnalysisInBed':
            start_date = record.get('startDate')
            end_date = record.get('endDate')
            source_name = record.get('sourceName')
            sleep_data.append([start_date, end_date, source_name])
    
    df = pd.DataFrame(sleep_data, columns=['Start', 'End', 'SourceName'])
    df['Start'] = pd.to_datetime(df['Start'])
    df['End'] = pd.to_datetime(df['End'])
    df['Duration'] = df['End'] - df['Start']
    
    return df
```

```python sleep_analysis.py
from analysis.data_loader import load_sleep_data
from analysis.data_processor import calculate_sleep_metrics
import pandas as pd

def main():
    DATA_FILE_PATH = "./data/export.xml"
    
    # XMLデータを読み込み
    df = load_sleep_data(DATA_FILE_PATH)
    
    # ニート期間の睡眠データを計算
    neet_start = pd.to_datetime('2021-04-01')
    neet_end = pd.to_datetime('2021-10-31')
    neet_mean, neet_median = calculate_sleep_metrics(df, neet_start, neet_end)
    
    # 社会人期間の睡眠データを計算
    work_start = pd.to_datetime('2023-11-22')
    work_end = pd.to_datetime('2024-06-21')
    work_mean, work_median = calculate_sleep_metrics(df, work_start, work_end)
    
    print(f"ニート期間の平均睡眠時間: {neet_mean}")
    print(f"ニート期間の睡眠時間の中央値: {neet_median}")
    print(f"社会人期間の平均睡眠時間: {work_mean}")
    print(f"社会人期間の睡眠時間の中央値: {work_median}")

if __name__ == "__main__":
    main()
```

結果は以下の通りでした。

```bash
ニート期間の平均睡眠時間: 0 days 07:33:41.607329842
ニート期間の睡眠時間の中央値: 0 days 07:36:15
社会人期間の平均睡眠時間: 0 days 07:06:45.348571428
社会人期間の睡眠時間の中央値: 0 days 07:06:09
```

ニート期間中は必ず生活習慣が乱れると思ったので、逆張りで健康的な生活をしていたことがひと目で分かりました。

社会人生活になって平均睡眠時間(中央値も)が 30 分減っているのは少し問題ですが、平均して 7 時間以上眠ることができているので、抜本的な対策は不要かもしれません。

次に運動との相関を調べていきましょう！
分かりやすい指標として 1 日の歩数と睡眠の相関を調べます。

歩数は `HKQuantityTypeIdentifierStepCount` という項目から取得できるそうなので、ソースコードを修正していきます。

歩数は 1 日たくさん歩いた日や、ほとんど動かなかった日もあるため、外れ値の除外は実施しません。
結果を見ると-0.114 程度なので相関は無いことが確認できます。

```bash
睡眠時間と歩数の相関関係: -0.11459083041585821
```
![睡眠時間と歩数の相関関係を示す散布図で相関がほぼないことが可視化されている](https://storage.googleapis.com/zenn-user-upload/ecc812496c20-20240808.png)


## 考察

ニート期間より社会人期間のほうが睡眠時間が減っているのは、平日毎日決まった時間に起きる必要があることや、金曜日・土曜日など次の日が休みの日の場合、夜ふかししていることが考えられます。

休日 = 次の日が仕事休みの金曜日・土曜日・祝日に絞って実行してみましたが、社会人期間ではほとんど変化がない(平均値・中央値 1 分ずつ増加)ことが分かりました。

ニート期間のみ平均睡眠時間が下がっていることが確認できます。

```bash
ニート期間の次の日が休日の平均睡眠時間: 0 days 07:19:18.015151515
ニート期間の次の日が休日の睡眠時間の中央値: 0 days 07:28:22.500000
社会人期間の次の日が休日の平均睡眠時間: 0 days 07:07:31.350000
社会人期間の次の日が休日の睡眠時間の中央値: 0 days 07:08:30
```

## おわりに
今回の分析では、睡眠の質や深い睡眠などをヘルスケアから取得できなかったため、大雑把な分析になってしまった部分がありました。
睡眠時間という観点から見た場合、運動との相関はあまり見られないことが確認できました。

この結果から、睡眠時間の改善を目指す場合には、運動だけでなく、他の要因も考慮する必要があることが考えられます。
例えば、ストレス管理や食事、就寝環境の改善など複数の要因を絡めた分析を行うことで詳細な分析ができると感じました。

## その他
## 参考資料

https://qiita.com/onodes/items/5720518939e55dc05b18

https://developer.apple.com/documentation/healthkit


## 使用したソースコード

https://github.com/Suntory-N-Water/healthcare-sleep-analysis





