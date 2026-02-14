---
title: 手を動かして理解するクリーンアーキテクチャ
slug: learn-clean-architecture-through-hands-on-experience
date: 2025-01-02
modified_time: 2025-01-02
description: クリーンアーキテクチャの概要をざっくり理解し、実際に手を動かして実装することで腹落ちを目指します。関心ごとの分離と依存関係の方向性について解説します。
icon: 🎼
icon_url: /icons/musical_score_flat.svg
tags:
  - TypeScript
  - クリーンアーキテクチャ
  - SOLID原則
  - Hono
---

## この記事の内容

- クリーンアーキテクチャの概要をざっくり知ることができる。
- クリーンアーキテクチャを実際に手を動かして実装することで、腹落ちする。

## クリーンアーキテクチャとはなんですか？

この画像はクリーンアーキテクチャの代表的な概念図です。
クリーンアーキテクチャの基本的な考え方は、関心ごとの分離を徹底し、依存関係をビジネスロジック側に向けることです。
中心にいくにつれてそのシステム特有のビジネスルールがあり、外側に技術的な関心(UI、データベースなど)が配置されています。

以下では、この図の各層について、外側から内側に向かって順に説明していきます。
![クリーンアーキテクチャの同心円図で各層の責務が示されている](https://storage.googleapis.com/zenn-user-upload/8ad12e7d4584-20250102.jpg)


## Frameworks & Drivers(フレームワークとドライバ)

- **役割**:
    - システムを動作させるために必要な技術的な基盤を提供する層です。この層は具体的な技術やツールに強く依存しています。
    - Web フレームワーク、データベース、外部 API など、特定の技術やプラットフォームに依存する部分を指します。
- **処理例**:
    - データベース接続や HTTP リクエストを受け取り、インターフェースアダプターやその他の層にデータを渡します。また、レスポンスをクライアントに送信します。
    - Web サーバーや UI フレームワーク(例: React, Angular)。
- **ポイント**:
    - フレームワークやドライバは交換可能であるべきです。システムの核心ロジックには影響を与えません。

## Interface Adapters(インターフェースアダプタ)

- **役割**:
    - 外部からのリクエストデータを、ユースケースやエンティティが扱いやすい形式に変換します。
    - 逆に、ユースケースの結果を外部(例えば JSON 形式のレスポンス)で扱いやすい形式に変換します。
- **処理例**:
    - Controller(例: REST API のエンドポイント)でリクエストを受け取り、アプリケーション内部で扱いやすい形に「変換」して Use Case に渡す。
    - Use Case の出力を整形して UI に渡す(例: JSON 形式に変換)。
- **ポイント**:
    - フレームワークや外部の仕様(例: HTTP リクエストやレスポンス形式)を直接アプリケーションロジックに影響させないように、境界を作る役割を担います。

## Application Business Rules(アプリケーションビジネスルール / Use Cases)

- **役割**: アプリケーションの具体的なユースケース(システムが「何をするか」)を表現します。業務ロジックやプロセスが該当します。
- **処理例**:
    - 「注文の作成」や「商品の検索」など、特定のユースケースを実現するロジック。
    - 複数のエンティティを使用して業務ルールを実行。
- **ポイント**: この層はフレームワークや技術に依存せず、純粋に業務ルールを記述します。

## Enterprise Business Rules(エンタープライズビジネスルール / Entities)

- **役割**: システムのもっとも核心的な部分です。アプリケーションや業務全体において普遍的で再利用可能なビジネスルールを定義します。
- **処理例**:
    - 「ユーザー」という概念を表すエンティティクラス。
    - ドメインモデルの設計(例: 値オブジェクトやエンティティ)。
- **ポイント**: 他のどの層にも依存せず、独立性が非常に高い層です。この部分の変更が他の部分に影響を与えてはなりません。

### 依存関係のルール

図の矢印が示すように、依存方向は内側へ向かいます。外側の層は内側の層を参照できますが、その逆はありません。このルールにより、システムの中心部分を安定した状態に保つことが可能です。

## その他

またこのような絵もよく見られますね。

これは実際にクリーンアーキテクチャのクラス図を表現しています。

![クリーンアーキテクチャのクラス図でインターフェースと実装の依存関係が示されている](https://storage.googleapis.com/zenn-user-upload/36f4251e3543-20250102.png)


この 2 つの図は、[Clean Architecture 達人に学ぶソフトウェアの構造と設計](https://www.amazon.co.jp/dp/4048930656)の著者 Robert C. Martin 氏がクリーンアーキテクチャを説明する際に用いている図です。

## ざっくり読んでみたけど。。。

先程の円とクラス図の合計 2 つの図と説明を読んだとき、私はこう思いました。

＿人人人人人人人人人人人人人人人人人人人人人人＿
＞　ぶっちゃけ何言ってるのかよく分からん！！　＜
￣Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^￣

となったのでもう少し簡単かつ噛み砕いて説明をしているものはないかと探していたところ、Zenn でこのような記事を発見しました。

https://zenn.dev/sre_holdings/articles/a57f088e9ca07d

この記事ではクリーンアーキテクチャの内容がかなり平易に書かれているので、正直なところ今すぐ私の記事を閉じてこの記事を見ていただきたいです。

サンプルコードも用意されており、記事を読み終えた後には、難しく感じていた内容が少し理解できたような気分になりました。

とはいえ、実際に頭の中ではどういった構成でクリーンアーキテクチャを作成していけばよいのかピンと来ない部分がまだ残っていたので、今回は過去に作成したソースコードをクリーンアーキテクチャを用いて再構築していきたいと思います。

## 実践編

今回クリーンアーキテクチャにしていくソースコードと、元になったリポジトリの両方掲載します
元のソースコードも DI を使ってある程度見通しが良い構成になっていますが、サンプルコードがなかったのでこのまま使用します。
ブログ投稿サイトの簡易 API で、json-server を使い TypeScript(Hono)で作成していきます。

元

https://github.com/Suntory-N-Water/di-lesson-with-hono/tree/branded-type-lesson

クリーンアーキテクチャ後

https://github.com/Suntory-N-Water/hono-clean-architecture

## フォルダ構成

なるべく三層アーキテクチャやレイヤードアーキテクチャの構成から大きく変えることなく作成しています。

```bash
.
├── application
│   └── usecases
│       ├── models
│       │   ├── get-all-post.model.ts
│       │   └── get-post.model.ts
│       └── post
│           ├── create-post.usecase.ts
│           ├── get-all-posts.usecase.ts
│           └── get-posts.usecase.ts
├── data
│   └── db.json
├── domain
│   ├── models
│   │   └── posts.ts
│   └── valueObjects
│       └── post-title.ts
├── index.ts
├── infrastructure
│   ├── controllers
│   │   ├── base.controller.ts
│   │   ├── create-post.controller.ts
│   │   ├── get-all-post.controller.ts
│   │   └── get-post.controller.ts
│   ├── di
│   │   └── container.ts
│   └── repositories
│       ├── i-post-repository.ts
│       └── post-repository.ts
├── keys.ts
├── mocks
│   ├── container.ts
│   └── mock-post-repository.ts
├── router
│   ├── routing.config.ts
│   └── routing.ts
└── tests
    ├── create-post.usecase.test.ts
    ├── get-all-posts.usecase.test.ts
    ├── get-post.usecase.test.ts
    └── post-repository.test.ts
```

## repositories

`repositories` では SOLID の原則の D、依存性逆転の原則(Dependency Inversion Principle)に従い後に説明する usecase などの高レイヤーの `GetAllPostsUseCase` が抽象(`IPostRepository` )に依存し、具象(`PostRepository`)には直接依存しないようにしています。

依存先がインタフェースであるため、`PostRepository` の実装が変わったとしても、`GetAllPostsUseCase` は影響を最小限に抑えられます。

```tsx i-post-repository.ts
import type { Message, Post, PostId } from '../../domain/models/Post';

export interface IPostRepository {
  findPost(id: PostId): Promise<Post>;
  findAllPosts(): Promise<Post[]>;
  createPost(post: Post): Promise<Message>;
}
```

```tsx post-repository.ts
import { injectable } from 'inversify';
import type { Message, Post, PostId } from '../../domain/models/Post';
import type { IPostRepository } from './IPostRepository';

@injectable()
export class PostRepository implements IPostRepository {
  private readonly apiUrl = 'http://localhost:3000/posts';

  async findPost(id: PostId): Promise<Post> {
    try {
      const response = await fetch(`${this.apiUrl}?id=${id}`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch post with id ${id}. Status: ${response.status}`,
        );
      }
      return (await response.json()) as Post;
    } catch (error) {
      console.error('Error in findPost:', error);
      throw error;
    }
  }

  async findAllPosts(): Promise<Post[]> {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch posts. Status: ${response.status}`);
      }
      return (await response.json()) as Post[];
    } catch (error) {
      console.error('Error in findAllPosts:', error);
      throw error;
    }
  }

  async createPost(post: Post): Promise<Message> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });
      if (!response.ok) {
        throw new Error(`Failed to create post. Status: ${response.status}`);
      }
      return { message: 'Post created successfully!' };
    } catch (error) {
      console.error('Error in createPost:', error);
      throw error;
    }
  }
}

```

依存性逆転の原則についてはこちらの記事が参考になるかと思います。

https://zenn.dev/yoshinani_dev/articles/c743a3d046fa78

## usecases

各ユースケースごとにファイルを分けて実装をしています。

下記は DB から posts を全件取得する `GetAllPostsUseCase` です。

```tsx get-all-posts.usecase.ts
import { inject, injectable } from 'inversify';
import type { IPostRepository } from '../../../infrastructure/repositories/IPostRepository';
import { REPOSITORY_BINDINGS } from '../../../keys';
import { GetAllPostsUseCaseDto } from '../models/get-all-post.model';

@injectable()
export class GetAllPostsUseCase {
  constructor(
    @inject(REPOSITORY_BINDINGS.PostRepository) private repository: IPostRepository,
  ) {}

  async execute(): Promise<GetAllPostsUseCaseDto> {
    const posts = await this.repository.findAllPosts();
    return new GetAllPostsUseCaseDto(posts);
  }
}
```

```tsx get-all-post.model.ts
export class GetAllPostsUseCaseOutputDto {
  constructor(public posts: PostDto[]) {}
}

export class PostDto {
  constructor(
    public id: number,
    public userId: number,
    public title: string,
    public body: string,
  ) {}
}
```

それぞれのユースケースをエンドポイントごとに作成しています。ファイル数が多くなってしまいますが、プロジェクトの規模や適切なディレクトリ構成、命名規則によってある程度緩和できると思っています。

今回は以下の観点でユースケースをファイルごとに分離しました。

- **単一責任の原則(SRP)の遵守:**
    - 各ユースケースが単一の責務(特定のビジネスロジックの実行)を持つため、変更やテストが容易になります。
    - ユースケースの変更が他のユースケースに影響を与える可能性が低くなります。
- **高い凝集度(High Cohesion):**
    - 各ファイルは特定の機能に焦点を当てているため、コードの関連性が高く理解しやすくなります。
- **低い結合度(Low Coupling):**
    - ユースケース間の依存関係が少ないため、一方の変更が他方に与える影響が小さく変更に強いコードになります。
- **テストの容易性:**
    - 各ユースケースが独立しているため、モックなどを使用して単体テストが容易になります。

後ほど解説しますが、コントローラーを作成するときにも分離したことによって拡張がしやすくなっています。

ユースケース層ではインフラ層から取得したレスポンスの値を、プレゼンテーション層に返却する前に DTO へ変換してから渡します。
ここでの DTO 変換は、プレゼンテーション層の要件に合わせたデータ整形(例えば、日付フォーマットの変更、数値の単位変換、表示に必要な情報のみの抽出など)を行う役割も担います。
プレゼンテーション層は UI フレームワークや表示要件に大きく依存するため、ユースケース層のデータ構造をそのまま使用すると、結合度が高くなり、変更に弱くなります。
DTO を使ってデータを変換することで、プレゼンテーション層の変更がユースケース層に影響を与えるのを防ぎます。

インフラストラクチャ層からユースケース層への変換は、個人的な意見ですが必要最低限のもの(API や DB から取得した値の型定義など)にのみとどめておくのが、開発コストもかからないため良いかなと思っています。

## controllers & Presenter

コントローラーの実装はこちらのリポジトリを参考に作成しました。

https://github.com/kbkn3/hono-bun-cleanArchitecture

```tsx base.controller.ts
import type { Context } from 'hono';

export type Route = {
  /** ルート名 */
  name: string;
  /** サービス名 */
  serviceName: symbol;
  /** 受け入れるメソッド */
  methods: Method[];
  /** ルートのパス */
  path: string;
};

type Method = 'get' | 'post';

export interface BaseController {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  main(c: Context): Promise<any>;
}
```

```tsx get-all-post.controller.ts
import type { Context } from 'hono';
import { inject, injectable } from 'inversify';
import type { GetAllPostsUseCase } from '../../application/usecases/post/get-all-posts.usecase';
import { USECASE_BINDINGS } from '../../keys';
import type { BaseController } from './base.controller';

@injectable()
export class GetAllPostsController implements BaseController {
  constructor(
    @inject(USECASE_BINDINGS.GetAllPostsUseCase) private usecase: GetAllPostsUseCase,
  ) {}

  async main(c: Context) {
    const posts = await this.usecase.execute();
    return c.json(posts);
  }
}
```

今回の実装では、プレゼンテーション層(Controller + Router) を最小限の責務に抑えています。

### プレゼンテーション層の役割

クリーンアーキテクチャでは、アプリケーションのビジネスロジック(UseCase) と UI・リクエスト/レスポンス処理を分離することが推奨されます。

今回の例では、プレゼンテーション層にあたる Controller と Router は以下のような役割を果たしています。

1. クライアントからのリクエストを受け取る (Routing)
2. ビジネスロジックを持つ UseCase の呼び出し (Controller)
3. UseCase の結果をレスポンスとして返却する (Controller)

このように、リクエスト/レスポンスの処理だけを担う構造にすることで、ビジネスロジックとの依存を最小限に抑えています。

### 複雑なロジックを持たせない

例えば `CreatePostController` や `GetAllPostsController` では、HTTP リクエストからデータを取り出し、UseCase の入力形式に合わせて組み立てるだけに留めています。

これにより、Controller はビジネスロジックを一切知らず、テストが容易になります。

### ルーティング設定 (routing.config.ts)

```tsx routing.config.ts
import type { Route } from '../infrastructure/controllers/base.controller';
import { CONTROLLER_BINDINGS } from '../keys';

export const routingConfig: Route[] = [
  {
    name: 'GetAllPosts',
    methods: ['get'],
    path: '/posts',
    serviceName: CONTROLLER_BINDINGS.GetAllPostsController,
  },
  {
    name: 'GetPost',
    methods: ['get'],
    path: '/posts/:id',
    serviceName: CONTROLLER_BINDINGS.GetPostController,
  },
  {
    name: 'CreatePostUseCase',
    methods: ['post'],
    path: '/posts',
    serviceName: CONTROLLER_BINDINGS.CreatePostController,
  },
];

```

ルーティング設定を設定ファイル化したことでルートの一覧を整理しやすく可読性を高めることができます。

### ルーター起動部 (routing.ts)

```tsx routing.ts
import { Hono } from 'hono';
import type { BaseController } from '../infrastructure/controllers/base.controller';
import { createContainer } from '../infrastructure/di/container';
import { routingConfig } from './routing.config';

const app = new Hono();

const container = createContainer();

// biome-ignore lint/complexity/noForEach: <explanation>
routingConfig.forEach((route) => {
  const controller = container.get<BaseController>(route.serviceName);
  app.get(route.path, (c) => controller.main(c));
  app.post(route.path, (c) => controller.main(c));
});

export default app;
```

`routing.config.ts` で設定した値をループして各メソッドに当てはめています。

Controller インスタンスは DI コンテナから取得し、その `main()` メソッドを実行するだけ、というシンプルな仕組みです。

> [!NOTE]
> 参考にしたソースコードは GET メソッドしかなかったので、不用意にエンドポイントが作成されてしまっていますが対処法を思いつかなかったのでこのまま運用しています。

今回次のようなメリットを意図してこの構造を採用しています。

1. Controller の責務を単純化
    - コード量が増えても、API のリクエストやレスポンスの処理に集中できる。
    - ビジネスロジックとの境界が明確で、バグの混入や修正リスクを下げられる。
2. DI による疎結合化
    - 依存関係を Inversify Container に集約することで、Controller 自体が軽くなり、モジュールごとの入れ替えがしやすい。
3. 拡張が用意
    - プレゼンテーション層では入力の受け取り・出力の返却という最小限の責務だけを担い、ビジネスロジックとの結合を極力小さくするように設計しています。

## domain/valueObjects

Value Object(値オブジェクト) として、タイトル文字数制限などのビジネスルールを閉じ込めています。
今回は 36 文字を超えるタイトルはエラーにするという仕様により、ドメインルールを明示的に表現しています。

```tsx post-title.ts
export class PostTitle {
  private readonly _value: string;
  public static lengthErrorMessage = 'Title must be 36 characters or less.';

  constructor(value: string) {
    if (value.length > 36) {
      throw new Error(PostTitle.lengthErrorMessage);
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }
}
```

## おまけ(テストコード)

クリーンアーキテクチャでテストがしやすくなったことから、リポジトリ層とユースケース層のテストコードを記載しています。

json-server を使っているので本物としてテストしてもよいのですが、実際は DB 接続や外部 API との通信が発生すると思うのでリポジトリ層はモック化し、各ユースケースはスパイしたモックリポジトリを通じてテストを行いました。

```tsx mock-post-repository.ts
import { injectable } from 'inversify';
import 'reflect-metadata';
import type { Message, Post, PostId } from '../domain/models/posts';

export interface IPostRepository {
  findPost(id: PostId): Promise<Post>;
  findAllPosts(): Promise<Post[]>;
  createPost(post: Post): Promise<Message>;
}

@injectable()
export class MockPostRepository implements IPostRepository {
  private posts: Post[] = [
    { id: 1, userId: 1, title: 'Post 1', body: 'Content of Post 1' },
    { id: 2, userId: 2, title: 'Post 2', body: 'Content of Post 2' },
  ];

  async findPost(id: number): Promise<Post> {
    const post = this.posts.find((p) => p.id === id);
    if (!post) throw new Error('Post not found');
    return post;
  }

  async findAllPosts(): Promise<Post[]> {
    return this.posts;
  }

  async createPost(post: Post) {
    const newPost: Post = { ...post, id: Date.now() };
    this.posts.push(newPost);
    return Promise.resolve({ message: 'Post created successfully!' });
  }
}

```

```tsx post-repository.test.ts
import { createPostId } from '../domain/models/posts';
import type { IPostRepository } from '../infrastructure/repositories/i-post-repository';
import { REPOSITORY_BINDINGS } from '../keys';
import { mockDiContainer } from '../mocks/container';

describe('PostRepository', () => {
  let postRepository: IPostRepository;

  beforeEach(() => {
    postRepository = mockDiContainer.get<IPostRepository>(
      REPOSITORY_BINDINGS.PostRepository,
    );
  });

  it('should find a post by id', async () => {
    const postId = createPostId(1);
    const post = await postRepository.findPost(postId);
    expect(post).toEqual({
      id: 1,
      userId: 1,
      title: 'Post 1',
      body: 'Content of Post 1',
    });
  });

  it('should return all posts', async () => {
    const posts = await postRepository.findAllPosts();
    expect(posts).toHaveLength(2);
    expect(posts).toEqual([
      { id: 1, userId: 1, title: 'Post 1', body: 'Content of Post 1' },
      { id: 2, userId: 2, title: 'Post 2', body: 'Content of Post 2' },
    ]);
  });

  it('should create a new post', async () => {
    const newPost = {
      id: 123,
      userId: 3,
      title: 'Post 3',
      body: 'Content of Post 3',
    };
    const createdPost = await postRepository.createPost(newPost);
    expect(createdPost).toEqual({
      message: 'Post created successfully!',
    });

    const posts = await postRepository.findAllPosts();
    expect(posts).toHaveLength(3);
  });

  it('should throw an error if post not found', async () => {
    const postId = createPostId(999);
    await expect(postRepository.findPost(postId)).rejects.toThrow('Post not found');
  });
});

```

```tsx get-post.usecase.test.ts
import { GetPostUseCase } from '../application/usecases/post/get-posts.usecase';
import { createPostId } from '../domain/models/posts';
import { REPOSITORY_BINDINGS } from '../keys';
import { mockDiContainer } from '../mocks/container';
import type { IPostRepository } from '../mocks/mock-post-repository';

describe('GetPostUseCase', () => {
  let useCase: GetPostUseCase;
  let mockRepository: IPostRepository;

  beforeEach(() => {
    mockRepository = mockDiContainer.get<IPostRepository>(
      REPOSITORY_BINDINGS.PostRepository,
    );
    useCase = new GetPostUseCase(mockRepository);
    vi.clearAllMocks();
  });

  it('指定されたIDの投稿が取得できること', async () => {
    const mockPost = {
      id: 1,
      userId: 1,
      title: 'Post 1',
      body: 'Content of Post 1',
    };

    vi.spyOn(mockRepository, 'findPost').mockResolvedValue(mockPost);
    const postId = createPostId(1);
    const result = await useCase.execute(postId);
    expect(result).toEqual({ posts: mockPost });
  });

  it('指定されたIDの投稿が存在しない場合、エラーが返されること', async () => {
    // findPostメソッドのモックを実装
    vi.spyOn(mockRepository, 'findPost').mockRejectedValue(
      new Error('Post not found'),
    );
    const postId = createPostId(999);
    await expect(useCase.execute(postId)).rejects.toThrow('Post not found');
  });
});
```

## まとめ

手を動かしながら実装したことでクリーンアーキテクチャ何も分からん！状態を少しは抜け出すことができました。
クリーンアーキテクチャはソフトウェアの設計において非常に重要な考え方です。当たり前ですが何も考えずに実装をした場合の改修コストは馬鹿になりません。
ビジネスが拡大していくと同時にシステムも大きくなっていきます。継続的に開発を続けていくにはコードが分かりやすく、修正しやすい状態を保つことが重要です。
第一歩として本を読んだり記事を読むだけではなく、実際に手を動かしてクリーンアーキテクチャを学ぶのは非常に価値があることだと感じました。

以上になります！👌