---
title: React + Flaskを連携させてみる
slug: lets-integrate-react-flask
date: 2023-07-01
modified_time: 2023-07-01
description: ReactとFlaskを連携させたアプリケーション開発の手順。
icon: ⚛️
icon_url: /icons/atom_symbol_flat.svg
tags:
  - Python
  - Flask
  - TypeScript
  - React
---
## 目的

ReactとFlaskを使用したアプリケーションを作りたい。
そのまえに一度連携させて色々反映させてみる。

## フロー

## Projectの作成
ディレクトリ構成はフロントエンドとバックエンドで分けることにしました。
参考記事→https://qiita.com/mihonak/items/91ac9c068831c0a3bb88

## もろもろ起動させる

フロントエンド側ではcreate-react-appでプロジェクトを作成し、動くか確認してみます。
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/837411/de08050d-8729-8763-0035-ba0cd959efe8.png)

~~いつ見てもかっこいいですよね~~

バックエンド側でもFlaskの公式ドキュメントからソースコードを引用して動かしてみます。
公式ドキュメント→https://msiz07-flask-docs-ja.readthedocs.io/ja/latest/quickstart.html#a-minimal-application

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/837411/badcc4f5-292c-0442-97b9-fb62df77f71a.png)

## エンドポイントの作成

Python側から返すデータとして適当な値を考えます。

```python
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/data', methods=['GET'])
def get_data():
    data = {'name': 'tarou', 'age': 30, 'job': 'developer'}
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
```

## Reactの作成

エンドポイントからデータを取得し、表示するアプリケーションを作成します。

``` tsx
import { useEffect, useState } from 'react';
import './App.css';
import axios from "axios";

interface Data {
  name: string;
  age: number;
  job: string;
}

function App() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/api/data')
      .then((response) => setData(response.data))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div>
          {data && (
            <div>
              <p>Name: {data.name}</p>
              <p>Age: {data.age}</p>
              <p>Job: {data.job}</p>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
```

この時点では何も表示されていません。
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/837411/1a4eb118-b961-27b0-e694-0d6def7a8221.png)

## プロキシの設定

調べてもなんとなくしか分からなかったのでChatGPTに��いてみた。

    プロキシの設定: このステップはReactとFlaskが同じマシン上の異なるポートで動作するときに重要です。
    例えば、Reactは通常ポート3000で、Flaskはポート5000で動作します。
    
    異なるポートから来るリクエストは、セキュリティ上の理由からウェブブラウザによってブロックされる可能性があるため、これは問題となります。
    
    これを解決する方法の1つは、CORS (Cross-Origin Resource Sharing)を設定することですが、これは複雑でエラーが発生しやすいです。
    
    その代わりに、Reactの開発サーバーにプロキシを設定することが推奨されます。
    これは、Reactの開発サーバーがFlaskのサーバーに直接リクエストを転送するようにすることです。
    これにより、Reactアプリケーションは自分自身が動作しているポート(通常は3000)からリクエストを送り、これがプロキシによってFlaskのポート(通常は5000)に転送されます。
    結果として、ウェブブラウザはこのリクエストを同一オリジンからのものとして扱い、問題なくリクエストを許可します。
    
    このプロキシを設定するには、Reactアプリケーションのpackage.jsonファイルにproxyフィールドを追加します。

異なるポートからくる通信はセキュリティの観点でブロックされるらしい。
React推奨のやり方で試してみる。

``` json
{
  "proxy": "http://127.0.0.1:5000",
}
```

その後すこしソースコードを修正し、無事反映されました。
<details><summary>React</summary>


```tsx
import { useEffect, useState } from 'react';
import './App.css';
import axios from "axios";

interface Data {
  name: string;
  age: number;
  job: string;
}

function App() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/api/data')
      .then((response) => {setData(response.data)})
      .catch((error) => console.error(error));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div>
          {data && (
            <div>
              <p>Name: {data.name}</p>
              <p>Age: {data.age}</p>
              <p>Job: {data.job}</p>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
```
</details>

<details><summary>Flask</summary>


``` python
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/', methods=['GET'])
def hello():
    return '<p>Hello World</p>'

@app.route('/api/data', methods=['GET'])
def get_data():
    data = {'name': 'tarou', 'age': 30, 'job': 'developer'}
    return jsonify(data)

if __name__ == '__main__':
    app.run()
```
</details>

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/837411/0fa09f6a-068c-810a-2de5-49510c1e6732.png)

