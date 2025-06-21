以下では、uv の「ワークスペース（workspace）」機能を使ってリポジトリ内に複数のサブプロジェクト（モノレポ）を構成する方法と、簡易的にパス依存で管理する方法をまとめます。

## 概要

uv は Rust 製の高速な Python パッケージ＆プロジェクト管理ツールで、Cargo スタイルのワークスペースをサポートしています ([gihyo.jp][1], [github.com][2])。
ワークスペース機能を使うと、リポジトリ配下の複数パッケージを単一の `uv.lock` と共通の仮想環境で一元管理できます ([zenn.dev][3], [docs.astral.sh][4])。
この機能を使ってサブディレクトリをサブプロジェクト化するのが基本的な実装方法です ([docs.astral.sh][4])。

---

## uv ワークスペースによるサブプロジェクト化

### 1. \[tool.uv.workspace] を定義する

`pyproject.toml` の `[tool]` テーブルは各種ツール固有の設定を保持でき、uv も同じく `[tool.uv.workspace]` サブテーブルでワークスペースを定義します ([packaging.python.org][5])。

```toml
[tool.uv.workspace]
members = ["packages/*"]
exclude = ["packages/seeds"]
```

### 2. members / exclude の設定

* `members` にはサブプロジェクトのディレクトリを glob 形式で指定します ([docs.astral.sh][4])。
* `exclude` で除外したいパスを指定し、メンバーから除くことができます ([docs.astral.sh][4])。
* この結果、指定ディレクトリ配下にある全ての `pyproject.toml` がワークスペースメンバーとして認識されます ([docs.astral.sh][4])。

### 3. 各サブプロジェクトの pyproject.toml

* サブプロジェクト（ワークスペースメンバー）はそれぞれ独立した `pyproject.toml` を持ち、通常のパッケージと同様に `[project]`／`[build-system]` を定義します ([docs.astral.sh][4])。

### 4. サブプロジェクト間の依存関係設定

* ワークスペース内で他メンバーを依存関係として使う場合、ルートの `pyproject.toml` にて `[tool.uv.sources]` で `workspace = true` を指定します ([docs.astral.sh][4])。

```toml
[tool.uv.sources]
bird-feeder = { workspace = true }
```

### 5. uv init で自動追加

* 既存プロジェクトのディレクトリで `uv init` を実行すると、自動的にワークスペース定義が生成され、そのディレクトリがメンバーに追加されます ([docs.astral.sh][4])。

### 6. コマンド実行時の挙動

* `uv lock` はワークスペース全体の依存解決結果を一括でロックファイルに書き込みます ([docs.astral.sh][4])。
* `uv run`／`uv sync` はデフォルトでワークスペースのルートを対象に動作し、`--package <名前>` で特定メンバーを指定可能です ([docs.astral.sh][4])。

---

## パス依存による簡易サブプロジェクト化

ワークスペースを使わず、単一のプロジェクトから別ディレクトリをパス依存として参照する方法もあります ([docs.astral.sh][4])。
ルートの `pyproject.toml` で `[tool.uv.sources]` に `path` を指定すると、そのパッケージを外部モジュールのように扱えます ([docs.astral.sh][4])。

```toml
[tool.uv.sources]
bird-feeder = { path = "packages/bird-feeder" }
```

この場合、ワークスペースコマンド（`--package` など）は使えませんが、個別プロジェクトとして自由に環境を分けて管理できます ([docs.astral.sh][4])。

---

## まとめ

* **基本** はワークスペース機能を使い、`[tool.uv.workspace]` でメンバーを定義すること ([docs.astral.sh][4])。
* ワークスペース内の依存は `[tool.uv.sources]` で `workspace = true` を指定してつなげます ([docs.astral.sh][4])。
* 軽量に管理したい場合はパス依存を使う方法も選択肢です ([docs.astral.sh][4])。

これらを組み合わせて、シンプルかつ拡張しやすいモノレポ構成を実現してください。

[1]: https://gihyo.jp/article/2024/03/monthly-python-2403?utm_source=chatgpt.com "Rust製のPythonパッケージ管理ツール「uv」を使ってみよう"
[2]: https://github.com/astral-sh/uv "GitHub - astral-sh/uv: An extremely fast Python package and project manager, written in Rust."
[3]: https://zenn.dev/diia/articles/ec436940bef30a "uvのworkspace機能を活用した複数のPythonパッケージの管理について"
[4]: https://docs.astral.sh/uv/concepts/projects/workspaces/ "Using workspaces | uv"
[5]: https://packaging.python.org/en/latest/guides/writing-pyproject-toml/?utm_source=chatgpt.com "Writing your pyproject.toml - Python Packaging User Guide"
