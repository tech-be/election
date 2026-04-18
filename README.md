# funsite

PC/Mobileで参照するWebシステム（LP + 管理画面 + API + PostgreSQL）。

## 構成

- `frontend/`: Next.js（LP `/{code}` / 管理画面 `/admin/*`）
- `backend/`: FastAPI（企画CRUD API）
- `db`: PostgreSQL

## ローカルデプロイ（Docker）

開発DB・API・フロントをまとめて起動します。**リポジトリのルート**（この `README.md` と同じ階層）で実行してください。

### 前提

- [Docker](https://docs.docker.com/get-docker/) が使えること（macOS/Windows は Docker Desktop など）

### 手順（いつもこれ）

1. ターミナルを開き、この `README.md` と同じフォルダ（リポジトリのルート）に移動する
2. 次を実行する（ビルド込み・バックグラウンド起動）

```bash
docker compose up --build -d
```

3. 初回や `--build` 時はイメージ取得・ビルドに数分かかることがあります。完了を待つ。
4. 動作確認する  
   - ブラウザ: フロント [http://localhost:3001](http://localhost:3001)  
   - または API ヘルス: `curl -s http://localhost:8001/health`（応答があれば OK）

### よく使うコマンド

| 用途 | コマンド |
|------|----------|
| ログを流し見する | `docker compose logs -f` |
| 停止する | `docker compose down` |
| DB ボリュームも消して初期化する | `docker compose down -v`（**データが消えます**） |
| フォアグラウンド（端末にログを出し続ける） | `docker compose up --build`（Ctrl+C で停止） |

### URL（ポート）

- フロント: `http://localhost:3001`
- API: `http://localhost:8001`（疎通例: `/health`）
- DB: Compose 内のみ（ホストからはポート公開しません）

環境変数やパスワードは `docker-compose.yml` を参照してください。

## 管理画面

- ログイン: `http://localhost:3001/admin/login`
- 初期パスワード: `admin`
  - `docker-compose.yml` の `backend.environment.ADMIN_PASSWORD` で変更できます

## 企画（Campaign）

- 各企画は **必ず1つのテナント（`tenant_id`）に紐づいて** DB に保存されます（テナント配下のユーザが作る場合は自動で紐づきます）。
- シスアドで「企画新規登録」を行う場合は、画面で **紐づけるテナントを選択**してから登録します。
- **コード番号**（`code`）を持ち、LPのURLサブディレクトリ名になります
  - 例: `code=ABC001` → LPは `http://localhost:3001/ABC001`
- 管理画面の「企画新規登録」から以下を登録できます
  - KeyVisual URL
  - KeyText
  - アイテム（JSON配列文字列、`products_json`）
  - サンキューメッセージ

