---
title: 手を動かして理解するBranded Type
slug: branded-type-learn-doing
date: 2024-12-31
modified_time: 2024-12-31
description: Branded Typeの概要と実装方法を手を動かして理解します。プリミティブ型に目印を付与して型安全性を高めるテクニックを、既存リポジトリへの適用を通じて学びます。
icon: 🫠
icon_url: /icons/melting_face_flat.svg
tags:
  - TypeScript
---

## この記事の内容

- Branded Type の概要を知ることができる。
- 実際に Branded Type を作成済みのソースコードに適用することで、手を動かして理解する。

## はじめに

Branded Type とは、TypeScript における型の安全性を高めるためのテクニックの 1 つです。基本的には、プリミティブ型にブランド(目印)を付与することで、同じプリミティブ型でも異なる型として扱うことを可能にします。

この記事では私が文章読んでいるだけだと腹落ちできなかったので、実際に既存のリポジトリを Branded Type に適用することでありがたみを理解しようとする試みです。

## Branded Typeを使う背景と目的

JavaScript/TypeScript では、文字列や数値などのプリミティブ型は互換性があり、型安全性を損なう場合があります。

例えば、次のようなケースです。

```tsx
type UserId = {
  id: string;
};
type PostId = {
  id: string;
};

const userId: UserId = {
  id: 'user123',
};
const postId: PostId = {
  id: 'post456',
};

// ポストIDからポストを取得する
function getPost(id: PostId): void {
  console.log(`Fetching post with ID: ${id}`);
}

// ユーザーIDを取得するのに間違えて渡してもエラーにならない
getPost(userId);
```

実務では同じ `string型` だけど `UserId` と `PostId` のように異なる意味を持つ ID があります。

何も設定をしていないと異なる意味なのにも関わらず、型として区別されません。これを防ぐために、Branded Type を使用します。

---

## Branded Typeの基本的な実装

Branded Type では、既存のプリミティブ型にブランド(独自の目印)を付与して、新しい型を定義します。

```tsx
const userIdBrand = Symbol();
const postIdBrand = Symbol();

// Branded Typeの定義
export type UserId = { id: string } & { [userIdBrand]: unknown };
export type PostId = { id: string } & { [postIdBrand]: unknown };

// Branded Typeを生成する関数
export function createUserId(id: string): UserId {
  return { id } as UserId;
}

export function createPostId(id: string): PostId {
  return { id } as PostId;
}

// Branded Typeを利用
const userId: UserId = createUserId('user123');
const postId: PostId = createPostId('post456');

// ポストIDからポストを取得する
function getPost(id: PostId): void {
  console.log(`Fetching post with ID: ${id.id}`);
}

// 型エラーが発生する
getPost(userId); // Error: 'UserId' 型を 'PostId' 型に割り当てることはできません

// 正常に動作
getPost(postId);
```

これにより、`UserId` と `PostId` はどちらもランタイムでは文字列として扱われますが、型システム上では別の型として区別されます。

上記の例では `createPostId()` がない場合「ユーザーの ID を渡すべきところに、誤って別の値を渡した」場合でもコンパイルエラーになりません。
Branded Type を導入し、「`PostId` は単なる number ではない」として表現することによって、「誤った型を渡している」というバグをコンパイル時に発見できるようになります。

## 作成済みのコードをBranded Type 対応に修正する

下記リポジトリにある `findPost()` を Branded Type 対応に修正したいと思います。

作成したソースコードは `branded-type-lesson` ブランチで確認できます。

https://github.com/Suntory-N-Water/di-lesson-with-hono

既存の `postRepository.ts` では `findPost(id: number)` を定義していますが、これを Branded Type を使って `findPost(id: PostId)` として扱うように修正します。

合わせて、関連する `postService.ts` や `index.ts` などでも変更が必要なので、以下の流れで修正してみましょう。

---

## `PostId` の定義を確認

まず、`post.ts` にある Branded Type を追加します。

```tsx post.ts
// post.ts
const postIdBrand = Symbol();

export type PostId = number & { [postIdBrand]: unknown };

export function createPostId(id: number): PostId {
  return id as PostId;
}
```

- **`PostId`**:「number だけれども `postIdBrand` が付いた特別な型」
- **`createPostId`**: `number` を受け取って `PostId` に変換するヘルパー関数

---

## `postRepository.ts` の修正

`IPostRepository` の `findPost` を Branded 化します。

```diff postRepository.ts
 import 'reflect-metadata';
 import { injectable } from 'inversify';
-import { Post, PostCreate } from './post';
+import { Post, PostCreate, PostId } from './post';
 
 export interface IPostRepository {
-  findPost(id: number): Promise<Post>;
+  findPost(id: PostId): Promise<Post>;
   findAllPosts(): Promise<Post[]>;
   createPost(post: PostCreate): Promise<Post>;
 }
 export class PostRepository implements IPostRepository {
   private readonly apiUrl = 'https://jsonplaceholder.typicode.com/posts';
 
-  async findPost(id: number): Promise<Post> {
+  async findPost(id: PostId): Promise<Post> {
     const response = await fetch(`${this.apiUrl}/${id}`);
     if (!response.ok) {
       throw new Error(`Failed to fetch post with id ${id}`);
```

実行時には `PostId` は単なる `number` として扱われますが、コンパイル時には「投稿用の ID」であると型チェックしてくれるようになります。

---

## `postService.ts` の修正

`postService.ts` でも `getPost(id: number)` の定義を修正して、`getPost(id: PostId)` に対応させます。

先にレポジトリから修正したので、Branded Type になっていない `this.postRepository.findPost(id);` の部分がコンパイルエラーになっていることが確認できます。

![PostServiceのfindPost呼び出しでTypeScriptコンパイルエラーが発生している画面](https://storage.googleapis.com/zenn-user-upload/ea294c6c13cb-20241231.png)


レポジトリと同様に修正し、引数と返却値を Branded Type 対応にします。

```diff postService.ts
 import 'reflect-metadata';
 import { injectable, inject } from 'inversify';
-import { Post, PostCreate } from './post';
+import { Post, PostCreate, PostId } from './post';
 import { IPostRepository } from './postRepository';
 import { TYPES } from './types';
 
 export interface IPostService {
-  getPost(id: number): Promise<Post>;
+  getPost(id: PostId): Promise<Post>;
   getAllPosts(): Promise<Post[]>;
   createPost(post: PostCreate): Promise<Post>;
   search(keyword: string, posts: Post[]): Post[] | null;

 export class PostService implements IPostService {
   constructor(@inject(TYPES.PostRepository) private postRepository: IPostRepository) {}
 
-  getPost(id: number): Promise<Post> {
+  getPost(id: PostId): Promise<Post> {
     return this.postRepository.findPost(id);
   }
 
```

---

## `index.ts` での利用

最後に、API の呼び出し元となる `index.ts` でクエリパラメータから受け取った値を `PostId` に変換して `postService` に渡すようにします。

```diff index.ts
 import { Hono } from 'hono';
 import { diContainer } from './diConfig';
-import { PostCreate } from './post';
+import { createPostId, PostCreate } from './post';
 import { IPostService } from './postService';
 import { injectDependencies } from './middleware/injectDependencies';
 
 app.get('/posts/:id', async (c) => {
   const id = parseInt(c.req.param('id'));
+  const postId = createPostId(id);
   const postService = c.get('postService');
-  const post = await postService.getPost(id);
+  const post = await postService.getPost(postId);
   return c.json(post);
 });
```

クエリパラメータから受け取った id を直接 `getPost()` に渡そうとすると、`型 'number' の引数を型 'PostId' のパラメーターに割り当てることはできません。` となりコンパイルエラーになります。

このように変更することで、パラメータをしっかりと `PostId` として扱うことができ、数値 ID の取り違えを型レベルで防ぐことが可能になります。

## 参考にさせていただいた記事

https://qiita.com/uhyo/items/de4cb2085fdbdf484b83

https://typescriptbook.jp/reference/values-types-variables/primitive-types