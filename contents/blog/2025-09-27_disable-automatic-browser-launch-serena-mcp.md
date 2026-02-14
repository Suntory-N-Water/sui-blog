---
title: Dev Container環境でSerena MCPのブラウザ自動起動を無効化する
slug: disable-automatic-browser-launch-serena-mcp
date: 2025-09-27
modified_time: 2025-09-27
description: Dev Container環境でSerena MCPのブラウザ自動起動を無効化する方法を解説します。グローバル設定ファイルとdevcontainer.jsonの設定でダッシュボードの自動起動を制御します。
icon: 🙆‍♀️
icon_url: /icons/woman_gesturing_ok_flat_default.svg
tags:
  - MCP
  - DevContainer
  - ClaudeCode
  - Serena
---

Serena MCP は MCP サーバー起動時に毎回ダッシュボード画面がブラウザで起動します。

![Serena MCPサーバー起動時に自動表示されるダッシュボード画面](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/dbe1707cf98a1a175d33741b5f1e3e30.png)

こちらの[Zenn記事](https://zenn.dev/soramarjr/articles/c0210f128a4d2a)では、グローバル設定ファイル `~/.serena/serena_config.yml` で以下を設定することが推奨されています。

```yaml
gui_log_window: false
web_dashboard: false
```

しかしグローバル設定ファイルに値を設定しているにも関わらず、Dev Container 環境で毎回ブラウザが開いて困ったことはありませんか？
調べた結果、Dev Container 特有の設定ファイルが原因でした。

この記事では、実際にこの問題を解決した方法を説明します。
Serena MCP や Claude Code を使っている方で、同じ問題で困っている方の役に立てば嬉しいです。

## 問題の概要

ローカル環境では正常に動く web dashboard 無効化設定が、Dev Container 環境では効果がなく、毎回ブラウザが自動で開く問題が起きます。

先述した通り、グローバル設定ファイル `~/.serena/serena_config.yml` で以下を設定すれば解決するかと思っていたら、そもそもの話として設定ファイル `~/.serena/serena_config.yml` が初期セットアップ時に作られていません。
```bash
node ➜ /workspaces/cc-vault (feature-subdomain-routing) $ cat ~/.serena/serena_config.yml
cat: /home/node/.serena/serena_config.yml: No such file or directory
```

一応 `.serena` ディレクトリの中身を確認すると以下のようになっており、設定ファイルがないことが分かります。

```bash
node ➜ ~/.serena $ tree
.
├── language_servers
│   └── static
│       └── TypeScriptLanguageServer
│           └── ts-lsp
│               ├── package.json
│               └── package-lock.json
├── logs
│   └── 2025-09-27
│       ├── mcp_20250927-042226.txt
│       └── mcp_20250927-042419.txt
└── prompt_templates

27 directories, 130 files
```

## 原因の調査

ログファイルを確認すると、Dev Container 環境では別の場所に設定ファイルが作られることが分かりました。

```bash
INFO  2025-09-27 04:22:26,496 [MainThread] serena.config.serena_config:from_config_file:409 - Serena configuration file not found at /home/node/.cache/uv/archive-v0/pv_EtR2hKCenH4xUkANAy/lib/python3.11/serena_config.docker.yml, autogenerating...
INFO  2025-09-27 04:22:26,496 [MainThread] serena.config.serena_config:generate_config_file:374 - Auto-generating Serena configuration file in /home/node/.cache/uv/archive-v0/pv_EtR2hKCenH4xUkANAy/lib/python3.11/serena_config.docker.yml
INFO  2025-09-27 04:22:26,499 [MainThread] serena.config.serena_config:from_config_file:413 - Loading Serena configuration from /home/node/.cache/uv/archive-v0/pv_EtR2hKCenH4xUkANAy/lib/python3.11/serena_config.docker.yml
```

Dev Container 環境では `serena_config.docker.yml` が一時キャッシュディレクトリに作られることが確認できます。

## 解決方法

Dev Container 環境でブラウザの自動起動を無効にする方法は 2 つあります。

### Docker用設定ファイルの直接編集

実際にログで確認したパスの設定ファイルを見ると、`web_dashboard: true` が設定されていました。

```yaml
node ➜ /workspaces/cc-vault (feature-subdomain-routing) $ cat /home/node/.cache/uv/archive-v0/pv_EtR2hKCenH4xUkANAy/lib/python3.11/serena_config.docker.yml
gui_log_window: false
## [コメント部分は省略]

web_dashboard: false
## [以下省略]
```

この設定を `web_dashboard: false` に変更することで、ブラウザの自動起動が止まることを確認しました🎉

ただし、キャッシュディレクトリへの設定は環境を再構築した時に消える可能性があります。
動的にファイルを編集することも可能ですが、設定がとても面倒です…

### MCP起動引数での制御

より確実な方法として、`.mcp.json` ファイルで起動引数を指定できます。

> [!NOTE]
> 重要な注意点として、`".",` の後に `"--enable-web-dashboard=false"` を設定する必要があります。
>
> 私がいろいろ試していたときは最初 `"--project",` の後に設定していたため、設定が反映されませんでした。(途中で諦めて放置してました)

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena",
        "start-mcp-server",
        "--context",
        "ide-assistant",
        "--project",
        ".",
        "--enable-web-dashboard=false"
      ],
      "cwd": "."
    }
  }
}
```

## 参考情報

https://zenn.dev/soramarjr/articles/c0210f128a4d2a


https://github.com/oraios/serena