# コードスタイルとベストプラクティス

## Python (Backend)

- **型ヒント**: すべての関数に型ヒントを付ける
- **Docstring**: すべてのクラスと関数にdocstringを記述
- **命名規則**: 
  - クラス: `PascalCase`
  - 関数・変数: `snake_case`
  - 定数: `UPPER_SNAKE_CASE`
- **エラーハンドリング**: 適切な例外を発生させる（`ValueError`など）
- **非同期処理**: FastAPIエンドポイントは`async`を使用

## TypeScript (Frontend)

- **型定義**: すべてのコンポーネントと関数に型を定義
- **命名規則**:
  - コンポーネント: `PascalCase`
  - 関数・変数: `camelCase`
  - 定数: `UPPER_SNAKE_CASE`
- **React Hooks**: 適切に使用し、依存配列を正しく設定

## ファイル構造

- **Backend**: `backend/game/`にゲームロジック、`backend/models/`にデータモデル
- **Frontend**: `frontend/components/`にコンポーネント、`frontend/lib/`に型定義

## コミットメッセージ

- 日本語または英語で記述
- 変更内容を明確に記述
- 例: "プリフロップのベッティングラウンド完了条件を修正"

