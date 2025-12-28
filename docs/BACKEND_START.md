# バックエンド起動方法

## 方法1: 手動起動（推奨）

### ステップ1: バックエンドディレクトリに移動
```bash
cd backend
```

### ステップ2: 仮想環境の作成（初回のみ）
```bash
python3 -m venv venv
```

### ステップ3: 仮想環境の有効化
```bash
source venv/bin/activate
```

### ステップ4: 依存関係のインストール（初回のみ）
```bash
pip install -r requirements.txt
```

### ステップ5: サーバーの起動
```bash
python main.py
```

または、uvicornを直接使用：
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**起動確認:**
- サーバーは `http://localhost:8000` で起動します
- API ドキュメント: `http://localhost:8000/docs`
- ヘルスチェック: `http://localhost:8000/`

## 方法2: start.shスクリプトを使用

プロジェクトルートから実行：
```bash
./start.sh
```

このスクリプトはバックエンドとフロントエンドの両方を起動します。

## 方法3: Docker Composeを使用

プロジェクトルートから実行：
```bash
docker-compose up
```

または、バックエンドのみ起動：
```bash
docker-compose up backend
```

## トラブルシューティング

### ポート8000が既に使用されている場合
```bash
# ポート8000を使用しているプロセスを確認
lsof -i :8000

# プロセスを終了
kill -9 <PID>
```

### 仮想環境が正しく有効化されていない場合
```bash
# 仮想環境を再作成
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 依存関係のインストールエラー
```bash
# pipをアップグレード
pip install --upgrade pip

# 依存関係を再インストール
pip install -r requirements.txt
```

