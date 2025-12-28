# ルール定義と実装の不一致点

RULES.mdのルール定義と現在の実装を比較して発見した問題点をまとめます。

## 1. 最小レイズ額の計算が不完全 ✅ 修正済み

### 問題点
**RULES.md**: 「最小レイズ額: そのラウンドにおける直前のレイズ幅以上」

**以前の実装** (`backend/game/poker_game.py:215-217`):
```python
if amount < self.current_bet * 2:
    raise ValueError(f"Raise must be at least {self.current_bet * 2}")
```

### 問題の詳細
- 以前の実装は常に「現在のベット額の2倍」をチェックしていた
- 2回目以降のレイズでは、前のレイズ幅を追跡する必要がある
- 例：BB=$10、誰かが$20にレイズした場合、次のレイズは最低$30（$20 + $10のレイズ幅）または$40（$20の2倍）のどちらか大きい方

### 修正内容 ✅
- `last_raise_size`変数を追加してレイズ幅を追跡
- 最小レイズ額の計算を「前のベット額 + 前のレイズ幅」または「前のベット額の2倍」のどちらか大きい方に修正
- 各ベッティングラウンドの開始時にレイズ幅をリセット
- プリフロップ開始時にレイズ幅をビッグブラインドに初期化
- オールイン時にもレイズ幅を更新

## 2. 勝敗判定が実装されていない

### 問題点
**RULES.md**: 「勝敗判定: 7枚（手札2枚＋場札5枚）から最高の5枚を選出するロジックを実装すること」

**現在の実装** (`backend/game/poker_game.py:350-362`):
```python
def _complete_hand(self):
    """Complete the hand and determine winner."""
    self.phase = GamePhase.SHOWDOWN
    
    # Simple winner determination (first active player wins for now)
    # In a full implementation, this would evaluate hand strength
    active_players = [p for p in self.players if not p.has_folded]
    if active_players:
        winner = active_players[0]
        winner.stack += self.pot
        self.pot = 0
```

### 問題の詳細
- 現在は単に最初のアクティブプレイヤーが勝つだけ
- 役の強さ（ハンドランク）の判定が実装されていない
- 7枚から最高の5枚を選出するロジックがない

### 修正が必要
- 役の判定ロジックを実装（ロイヤルフラッシュ、ストレートフラッシュ、フォーカード、フルハウス、フラッシュ、ストレート、スリーカード、ツーペア、ワンペア、ハイカード）
- 7枚から最高の5枚を選出するアルゴリズムを実装
- 勝敗判定ロジックを実装

## 3. キッカーの判定が実装されていない

### 問題点
**RULES.md**: 「キッカー: 同じ役（ワンペアなど）の場合、残りのカード（キッカー）の強さで勝敗を決める」

**現在の実装**: なし

### 修正が必要
- 同じ役の場合、キッカー（残りのカード）の強さで勝敗を判定するロジックを実装

## 4. スプリットポットが実装されていない

### 問題点
**RULES.md**: 「スプリットポット: 役とキッカーが完全に同等の場合、ポットを等分する」

**現在の実装**: なし

### 修正が必要
- 役とキッカーが完全に同等の場合、ポットを等分するロジックを実装

## 5. サイドポットが実装されていない

### 問題点
**RULES.md**: 「サイドポット: 特定のプレイヤーがオールインし、他のプレイヤーがさらに賭けを続けた場合、オールインしたプレイヤーが関与できないサイドポットが形成される」

**現在の実装**: なし

### 修正が必要
- オールインしたプレイヤーと他のプレイヤーのポットを分離
- サイドポットの形成と分配ロジックを実装

## 6. レイズ幅の追跡が実装されていない ✅ 修正済み

### 問題点
**RULES.md**: 「最小レイズ額: そのラウンドにおける直前のレイズ幅以上」

**以前の実装**: レイズ幅を追跡する変数がなかった

### 修正内容 ✅
- `last_raise_size`変数を追加してレイズ幅を追跡
- 各ベッティングラウンドの開始時にレイズ幅をリセット
- レイズ/ベット/オールイン時にレイズ幅を更新

## 7. プリフロップのアクション開始位置の確認

### 確認結果
**RULES.md**: 「BBの左隣（UTG）からアクションを開始する」

**現在の実装** (`backend/game/poker_game.py:150`):
```python
self.current_player_index = (self.dealer_position + 3) % len(self.players)
```

✅ **正しい**: dealer + 1 = SB, dealer + 2 = BB, dealer + 3 = UTG

## 8. フロップ以降のアクション開始位置の確認

### 確認結果
**RULES.md**: 「SB（またはBTNの左隣の生存プレイヤー）からアクションを開始する」

**現在の実装** (`backend/game/poker_game.py:342-345`):
```python
self.current_player_index = (self.dealer_position + 1) % len(self.players)
while self.players[self.current_player_index].has_folded or \
      self.players[self.current_player_index].is_all_in:
    self.current_player_index = (self.current_player_index + 1) % len(self.players)
```

✅ **正しい**: dealer + 1から開始し、フォールド/オールインしたプレイヤーをスキップ

## 優先度の高い修正項目

1. **高優先度**: 勝敗判定の実装（ゲームの核心機能）
2. **高優先度**: 最小レイズ額の計算修正（ベッティングルールの正確性）
3. **中優先度**: キッカーの判定実装
4. **中優先度**: スプリットポットの実装
5. **低優先度**: サイドポットの実装（オールインが頻繁に発生する場合に重要）

