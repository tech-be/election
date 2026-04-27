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

### 環境変数（フロント → API の URL）

クライアントからバックエンド API へアクセスするベース URL などは、リポジトリルートの `.env` で渡します（`.env` は Git に含めません）。

1. ルートで `.env_sample` を `.env` にコピーする。

```bash
cp .env_sample .env
```

2. 必要に応じて `.env` を編集する（開発ではそのままでよいことが多いです）。

Docker Compose はルートの `.env` を読み込み、`NEXT_PUBLIC_API_BASE_URL` と `API_INTERNAL_BASE_URL` を frontend コンテナに渡します。`.env` が無い場合も、Compose ファイル内のデフォルト値で起動できます。

**補足:** `frontend` だけを `npm run dev` で動かす場合は、Next.js の慣例に従い `frontend/.env.local` を作成し、少なくとも `NEXT_PUBLIC_API_BASE_URL` を `.env_sample` と同様に設定してください。

### 手順（いつもこれ）

1. ターミナルを開き、この `README.md` と同じフォルダ（リポジトリのルート）に移動する
2. （初回または `.env` をまだ作っていない場合）上記のとおり `.env_sample` から `.env` を作成する
3. 次を実行する（ビルド込み・バックグラウンド起動）

```bash
docker compose up --build -d
```

4. 初回や `--build` 時はイメージ取得・ビルドに数分かかることがあります。完了を待つ。
5. 動作確認する  
   - ブラウザ: フロント [http://localhost:3001](http://localhost:3001)  
   - または API ヘルス: `curl -s http://localhost:8001/api/health`（応答があれば OK）

### よく使うコマンド

| 用途 | コマンド |
|------|----------|
| ログを流し見する | `docker compose logs -f` |
| 停止する | `docker compose down` |
| DB ボリュームも消して初期化する | `docker compose down -v`（**データが消えます**） |
| フォアグラウンド（端末にログを出し続ける） | `docker compose up --build`（Ctrl+C で停止） |

### URL（ポート）

- フロント: `http://localhost:3001`
- API: `http://localhost:8001`（疎通例: `/api/health`）
- DB: Compose 内のみ（ホストからはポート公開しません）

API のベース URL は `.env_sample` / `.env` を参照してください。その他の環境変数やパスワードは `docker-compose.yml` を参照してください。

## 本番デプロイ（VPS/EC2 等・Docker Compose）

このリポジトリには、サーバ上でそのまま使える本番用 Compose を同梱しています（`docker-compose.prod.yml`）。  
**HTTPS/証明書は L7 ロードバランサ（ALB/CloudFront 等）や外部リバースプロキシ側で終端**し、EC2 上は Next.js（`frontend`）を **ホスト `3001` 番**で待ち受けます（`3001:3000`）。必要に応じて API を直接叩く場合は **ホスト `8001` 番**も公開します（`8001:8000`）。

### 前提

- サーバに Docker / Docker Compose が入っている
- DNS / ロードバランサで、公開URL（例: `https://example.com`）が最終的に `frontend:3000` 相当（EC2 上は `3001`）へ到達する
- セキュリティグループ等で、ALB/ローカル向けの **3001（本番想定）** へ到達できる（運用方針に合わせて限定）

### サーバ手順

1. サーバにこのリポジトリを配置（`git clone` など）
2. リポジトリルートに `.env` を作成し、最低限以下を設定

```bash
POSTGRES_PASSWORD=change_me
ADMIN_PASSWORD=change_me
NEXT_PUBLIC_API_BASE_URL=https://example.com
CORS_ORIGINS=https://example.com
```

3. 起動（初回はビルドに時間がかかります）

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### AWS（ALB 等）で 443 → 3001 転送する典型例

- クライアント → **HTTPS(443) は ALB**（ここで証明書）  
- ALB のターゲットは EC2 の **3001**（`frontend`）  
- 同一オリジンで `/api` を扱う前提なら、**ALBのルーティング（パス）で `/api` → `8001`（`backend`）**も併用します（必須ではありませんが、推奨）。

### 停止・ログ

```bash
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml down
```

## 管理画面

- ログイン: `http://localhost:3001/admin/login`
- 初期パスワード: `Narashino#55`
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

