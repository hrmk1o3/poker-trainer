# アーキテクチャ理解ガイド

## システム構成

- **Frontend**: Next.js (React + TypeScript)
- **Backend**: FastAPI (Python)
- **通信**: WebSocket (リアルタイム更新) + REST API

## 主要コンポーネント

### Backend
- `PokerGame`: ゲームロジックの中核クラス
- `process_action()`: プレイヤーのアクションを処理
- `_advance_action()`: 次のプレイヤーに移動またはフェーズを進める
- `_is_betting_round_complete()`: ベッティングラウンドの完了判定

### Frontend
- `PokerTable`: メインテーブルコンポーネント
- `PlayerSeat`: プレイヤー席コンポーネント
- `ActionButtons`: アクションボタンコンポーネント

## データフロー

1. プレイヤーがアクションを選択
2. Frontend → Backend (REST API or WebSocket)
3. Backendでゲームロジックを処理
4. 状態を更新
5. Backend → Frontend (WebSocket broadcast)
6. Frontendで状態を更新して表示

## 状態管理

- **Backend**: `PokerGame`クラスがゲーム状態を管理
- **Frontend**: Reactの`useState`でゲーム状態を管理
- **同期**: WebSocketでリアルタイムに同期

