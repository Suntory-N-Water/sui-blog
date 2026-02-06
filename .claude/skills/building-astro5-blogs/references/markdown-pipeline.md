# Markdownパイプラインのカスタマイズ

## 目次
- [Markdownパイプラインの仕組み](#markdownパイプラインの仕組み)
- [Remarkプラグイン(Markdown AST処理)](#remarkプラグインmarkdown-ast処理)
- [Rehypeプラグイン(HTML AST処理)](#rehypeプラグインhtml-ast処理)
- [カスタムRemarkプラグインの作成](#カスタムremarkプラグインの作成)
- [カスタムRehypeプラグインの作成](#カスタムrehypeプラグインの作成)
- [プラグインの組み合わせ](#プラグインの組み合わせ)
- [ベストプラクティス](#ベストプラクティス)
- [アンチパターン](#アンチパターン)

## Markdownパイプラインの仕組み

```
Markdown
  ↓
remark (Markdown AST処理)
  ↓
rehype (HTML AST処理)
  ↓
HTML生成
```

## Remarkプラグイン(Markdown AST処理)

Remarkプラグインは、Markdown ASTを処理してMarkdown構文を拡張する。

### 基本設定

`astro.config.mjs`でRemarkプラグインを設定：

```javascript
import { defineConfig } from 'astro/config';
import remarkToc from 'remark-toc';
import remarkGfm from 'remark-gfm';

export default defineConfig({
  markdown: {
    remarkPlugins: [
      remarkGfm,
      [remarkToc, { heading: 'toc', maxDepth: 3 }]
    ],
  },
});
```

### よく使われるRemarkプラグイン

#### `remark-gfm` - GitHub Flavored Markdown
```javascript
import remarkGfm from 'remark-gfm';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkGfm],
  },
});
```

**有効化される機能**:
- テーブル
- タスクリスト
- 打ち消し線
- 自動リンク

#### `remark-toc` - 目次の自動生成
```javascript
import remarkToc from 'remark-toc';

export default defineConfig({
  markdown: {
    remarkPlugins: [
      [remarkToc, {
        heading: 'toc',      // 目次を挿入する見出し
        maxDepth: 3,         // 最大深度
        tight: true          // リスト項目間のスペース
      }]
    ],
  },
});
```

**Markdownでの使用**:
```markdown
# My Post

## toc

## Introduction
## Features
### Feature 1
### Feature 2
## Conclusion
```

#### `remark-math` - 数式サポート
```javascript
import remarkMath from 'remark-math';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMath],
  },
});
```

#### `remark-emoji` - 絵文字変換
```javascript
import remarkEmoji from 'remark-emoji';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkEmoji],
  },
});
```

## Rehypeプラグイン(HTML AST処理)

RehypeプラグインはHTML ASTを処理してHTML出力をカスタマイズする。

### 基本設定

```javascript
import { defineConfig } from 'astro/config';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

export default defineConfig({
  markdown: {
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append' }],
    ],
  },
});
```

### よく使われるRehypeプラグイン

#### `rehype-slug` - 見出しにIDを自動付与
```javascript
import rehypeSlug from 'rehype-slug';

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeSlug],
  },
});
```

**変換例**:
```markdown
## Introduction
```
↓
```html
<h2 id="introduction">Introduction</h2>
```

#### `rehype-autolink-headings` - 見出しへのアンカーリンク生成
```javascript
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

export default defineConfig({
  markdown: {
    rehypePlugins: [
      [rehypeAutolinkHeadings, {
        behavior: 'append',  // リンクを追加する位置
        properties: {
          class: 'heading-link',
          ariaLabel: 'Link to this section'
        }
      }]
    ],
  },
});
```

**behaviorオプション**:
- `prepend`: 見出しの前にリンクを追加
- `append`: 見出しの後にリンクを追加
- `wrap`: 見出し全体をリンクで囲む
- `before`: 見出しの前の兄弟要素として追加
- `after`: 見出しの後の兄弟要素として追加

#### `rehype-accessible-emojis` - アクセシブルな絵文字変換
```javascript
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis';

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeAccessibleEmojis],
  },
});
```

**変換例**:
```html
<!-- Before -->
🎉

<!-- After -->
<span role="img" aria-label="party popper">🎉</span>
```

#### `rehype-preset-minify` - HTML圧縮
```javascript
import rehypePresetMinify from 'rehype-preset-minify';

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypePresetMinify],
  },
});
```

## カスタムRemarkプラグインの作成

### 基本構造

```javascript
// example-remark-plugin.mjs
import { visit } from 'unist-util-visit';

export function exampleRemarkPlugin() {
  return function (tree, file) {
    // frontmatterにカスタムプロパティを追加
    file.data.astro.frontmatter.customProperty = 'Generated property';

    // ASTを操作してコンテンツを変更
    visit(tree, 'text', (node) => {
      // テキストノードを処理
      node.value = node.value.replace(/foo/g, 'bar');
    });
  }
}
```

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { exampleRemarkPlugin } from './example-remark-plugin.mjs';

export default defineConfig({
  markdown: {
    remarkPlugins: [exampleRemarkPlugin]
  },
});
```

### 実用的な例：読了時間の計算

```javascript
// remark-reading-time.mjs
import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

export function remarkReadingTime() {
  return function (tree, file) {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    file.data.astro.frontmatter.minutesRead = readingTime.text;
  };
}
```

```javascript
// astro.config.mjs
import { remarkReadingTime } from './remark-reading-time.mjs';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkReadingTime]
  },
});
```

```astro
---
import { getCollection, render } from 'astro:content';

const { post } = Astro.props;
const { Content } = await render(post);
---

<article>
  <h1>{post.data.title}</h1>
  <p>読了時間: {post.data.minutesRead}</p>
  <Content />
</article>
```

## カスタムRehypeプラグインの作成

### 基本構造

```javascript
// rehype-example.mjs
import { visit } from 'unist-util-visit';

export function rehypeExample() {
  return function (tree) {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img') {
        // 画像要素を処理
        node.properties.loading = 'lazy';
        node.properties.decoding = 'async';
      }
    });
  };
}
```

### 実用的な例：外部リンクの処理

```javascript
// rehype-external-links.mjs
import { visit } from 'unist-util-visit';

export function rehypeExternalLinks() {
  return function (tree) {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'a' && node.properties?.href) {
        const href = node.properties.href;

        // 外部リンクの判定
        if (href.startsWith('http://') || href.startsWith('https://')) {
          node.properties.target = '_blank';
          node.properties.rel = 'noopener noreferrer';

          // アイコンを追加
          node.children.push({
            type: 'element',
            tagName: 'span',
            properties: { className: ['external-link-icon'] },
            children: [{ type: 'text', value: ' ↗' }]
          });
        }
      }
    });
  };
}
```

## プラグインの組み合わせ

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';

// Remark
import remarkGfm from 'remark-gfm';
import remarkToc from 'remark-toc';
import { remarkReadingTime } from './remark-reading-time.mjs';

// Rehype
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { rehypeExternalLinks } from './rehype-external-links.mjs';

export default defineConfig({
  markdown: {
    // Remarkプラグイン(実行順序重要)
    remarkPlugins: [
      remarkGfm,
      remarkToc,
      remarkReadingTime,
    ],
    // Rehypeプラグイン(実行順序重要)
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append' }],
      rehypeExternalLinks,
    ],
  },
});
```

**重要**: プラグインは配列の順序で実行されるため、依存関係に注意。

例：`rehype-slug`は`rehype-autolink-headings`の前に実行する必要がある。

## ベストプラクティス

1. ✅ remarkプラグインでMarkdown構文を拡張
2. ✅ rehypeプラグインでHTML出力をカスタマイズ
3. ✅ カスタムプラグインで独自の処理を追加
4. ✅ プラグインは関数としてインポート(文字列ではない)
5. ✅ プラグインの実行順序に注意
6. ✅ 必要なプラグインのみ追加(パフォーマンス)
7. ✅ カスタムプラグインは別ファイルに分離

## アンチパターン

```javascript
// ❌ 悪い例: 文字列でプラグインを指定
export default defineConfig({
  markdown: {
    remarkPlugins: ['remark-gfm'], // 動作しない
  },
});

// ✅ 良い例: 関数としてインポート
import remarkGfm from 'remark-gfm';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkGfm],
  },
});
```
