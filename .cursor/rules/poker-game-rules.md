# ポーカーゲーム実装ルール

## ベッティングラウンドの共通ルール

各ラウンドは、以下のいずれかの条件が満たされるまで継続します。

1. **生存している全プレイヤーの場に出したチップ額が一致したとき**（かつ、全員がアクションを完了している）。
2. **一人のプレイヤーを除いて全員がフォールドしたとき**（その時点でそのプレイヤーの勝利となり、以降のラウンドはスキップ）。

## ベッティングラウンドの完了条件（重要）

### 最後のレイザーを追跡する仕組み

**基本原則**: レイズした人以外の全員に順番を回す必要がある。

1. **`last_raiser_index`の追跡**
   - ベット、レイズ、オールイン（ベット額を上げる場合）のたびに、そのプレイヤーのインデックスを`last_raiser_index`に記録する
   - レイズが発生するたびに**上書き更新**する（後からレイズした人を基準にする）
   - 新しいベッティングラウンド開始時は`None`にリセット

2. **完了判定の基準位置**
   - レイズが発生した場合: `completion_index = last_raiser_index`（最後にレイズした人）
   - レイズが発生していない場合: `completion_index = betting_round_start_index`（ラウンド開始位置）

3. **完了条件**
   ```python
   # 以下の3つが全て満たされた時に完了:
   1. 全アクティブプレイヤーのベットが一致している
   2. 次のプレイヤー（current_player_index）が completion_index に戻ってきた
   3. プリフロップの場合、BBがアクションを取っている（ブラインドポストだけでは不十分）
   ```

### プリフロップ

**初期設定**:
- `betting_round_start_index = BB のインデックス`（dealer + 2）
- `last_raiser_index = BB のインデックス`（BBがブラインドをポストしているため、初期レイザーとして扱う）
- `bb_has_acted_preflop = False`

**完了条件**:
1. 全アクティブプレイヤーのベットが一致している
2. `current_player_index == completion_index`（最後のレイザー、または誰もレイズしていなければBB）
3. `bb_has_acted_preflop == True`（BBがアクションを取った）

**動作例**:
- **ケース1: SB raise → BB call**
  - SB レイズ → `last_raiser_index = SB`
  - BB コール → `bb_has_acted_preflop = True`
  - 次のプレイヤーに移動 → SB に戻る
  - `current_player_index == last_raiser_index (SB)` → **完了、フロップへ**

- **ケース2: UTG raise → CO reraise → BTN call → UTG call → CO に戻る**
  - UTG レイズ → `last_raiser_index = UTG`
  - CO リレイズ → `last_raiser_index = CO`（上書き更新）
  - BTN コール
  - UTG コール
  - 次のプレイヤーに移動 → CO に戻る
  - `current_player_index == last_raiser_index (CO)` → **完了、フロップへ**

- **ケース3: 全員リンプ（誰もレイズしない）**
  - 全員コール → `last_raiser_index = BB`（初期値のまま）
  - BB に戻る → BBがチェックまたはレイズを選択
  - BBがチェック → `bb_has_acted_preflop = True`
  - 次のプレイヤーに移動 → BB に戻る
  - `current_player_index == last_raiser_index (BB)` → **完了、フロップへ**

### フロップ以降（フロップ、ターン、リバー）

**初期設定**:
- `betting_round_start_index = ディーラーの左隣のインデックス`（dealer + 1、通常はSB）
- `last_raiser_index = None`（各ラウンド開始時にリセット）

**完了条件**:
1. 全アクティブプレイヤーのベットが一致している
2. `current_player_index == completion_index`
   - レイズがあった場合: 最後のレイザーに戻った
   - レイズがない場合: 開始位置（dealer + 1）に戻った

**動作例**:
- **ケース1: SB check → BB bet → SB call**
  - SB チェック → `last_raiser_index = None`（そのまま）
  - BB ベット → `last_raiser_index = BB`
  - SB コール
  - 次のプレイヤーに移動 → BB に戻る
  - `current_player_index == last_raiser_index (BB)` → **完了、次のラウンドへ**

- **ケース2: SB bet → BB raise → SB call**
  - SB ベット → `last_raiser_index = SB`
  - BB レイズ → `last_raiser_index = BB`（上書き更新）
  - SB コール
  - 次のプレイヤーに移動 → BB に戻る
  - `current_player_index == last_raiser_index (BB)` → **完了、次のラウンドへ**

- **ケース3: 全員チェック**
  - 全員チェック → `last_raiser_index = None`（そのまま）
  - 開始位置（SB）に戻る
  - `current_player_index == betting_round_start_index (SB)` → **完了、次のラウンドへ**

## 最小レイズ額の計算

- **計算式**: `min_raise_amount = max(現在のベット額 + 直前のレイズ幅, 現在のベット額 × 2)`
- **レイズ幅の追跡**: 各ベッティングラウンドで`last_raise_size`を追跡する
- **プリフロップ**: ビッグブラインドが最初のレイズ幅となる

## フォールドのルール

### 基本ルール
- **自分がチップを追加しなくてもコールできる時（つまり、チェックできる時）はフォールドできない**
- フォールドできるのは、コールするために追加のチップが必要な場合のみ
- 実装: `player.bet >= current_bet` の場合はフォールド不可

## アクションの処理順序（実装用）

### 各アクション処理時
1. **アクションを処理**（フォールド、チェック、コール、ベット、レイズ、オールイン）
2. **フォールドのルールをチェック**（`player.bet >= current_bet`の場合はフォールド不可）
3. **ベット/レイズ/オールイン時の処理**:
   - ベット額が`current_bet`より大きい場合:
     - `last_raise_size`を更新
     - `current_bet`を更新
     - **`last_raiser_index = current_player_index`を設定**（重要！）
4. **プリフロップでのBBアクション追跡**:
   - BBがアクション（チェック、コール、レイズ、フォールド、オールイン）を取った場合:
     - `bb_has_acted_preflop = True`を設定
5. **アクション履歴に記録**
6. **次のアクティブプレイヤーに移動**:
   - フォールド/オールインしたプレイヤーはスキップ
7. **ベッティングラウンドの完了条件をチェック**:
   - `_is_betting_round_complete()`を呼び出し
8. **完了していれば次のフェーズに進む**:
   - `_advance_phase()`を呼び出し

### 各ベッティングラウンド開始時
1. **各プレイヤーのbet額を0にリセット**
2. **`current_bet = 0`にリセット**
3. **`last_raise_size = 0`にリセット**
4. **`last_raiser_index = None`にリセット**
5. **プリフロップの場合のみ**:
   - ブラインドをポスト
   - `last_raise_size = big_blind`を設定
   - `last_raiser_index = BB のインデックス`を設定（BBが初期レイザー）
   - `betting_round_start_index = BB のインデックス`を設定
   - `bb_has_acted_preflop = False`を設定
6. **フロップ以降の場合**:
   - `betting_round_start_index = ディーラーの左隣のインデックス`を設定

## 実装時の注意点

### 必須の状態変数
- **`last_raiser_index`**: 最後にレイズ/ベットした人のインデックス（Noneまたは整数）
- **`betting_round_start_index`**: ベッティングラウンドの開始位置（整数）
- **`bb_has_acted_preflop`**: プリフロップでBBがアクションを取ったか（Boolean）
- **`last_raise_size`**: 直前のレイズ幅（整数、最小レイズ額計算用）
- **`current_bet`**: 現在のベット額（整数）

### 完了判定ロジック
```python
def _is_betting_round_complete(self) -> bool:
    # 1. アクティブプレイヤーが1人以下の場合は完了
    active_players = [p for p in self.players if not p.has_folded and not p.is_all_in]
    if len(active_players) <= 1:
        return True

    # 2. 全員のベットが一致していない場合は未完了
    if not all(p.bet == self.current_bet for p in active_players):
        return False

    # 3. 完了判定の基準位置を決定
    completion_index = self.last_raiser_index if self.last_raiser_index is not None else self.betting_round_start_index

    # 4. プリフロップの特殊条件: BBがアクションを取っている必要がある
    if self.phase == GamePhase.PREFLOP:
        bb_index = (self.dealer_position + 2) % len(self.players)
        if completion_index == bb_index and not self.bb_has_acted_preflop:
            return False

    # 5. 現在のプレイヤーが基準位置に戻ってきたら完了
    if self.current_player_index == completion_index:
        return True

    return False
```

### _advance_action()の呼び出しタイミング
- **アクション処理後**に呼び出す
- **次のプレイヤーに移動してから**完了判定を行う（移動前ではない）
- これにより、全員がアクションを取ってから完了判定が行われる

## 実装時に定義すべきアクションの流れ（ロジック用）

### 1. 現在の手番プレイヤー (Current Player) の特定
- アクティブなプレイヤーの中で、現在アクションを取るべきプレイヤーを特定する
- フォールド/オールインしたプレイヤーはスキップする

### 2. 可能なアクション (Legal Moves) の抽出
- **前のプレイヤーがベットしているか？**
  - Yes → チェック不可、フォールド/コール/レイズ/オールインが可能
  - No → チェック/ベット/オールインが可能
- **現在のベット額と自分のベット額の関係**
  - `player.bet >= current_bet` → チェック可能、フォールド不可
  - `player.bet < current_bet` → フォールド/コール/レイズ/オールインが可能

### 3. アクション実行後のポット合計と残チップの更新
- プレイヤーのスタックからベット額を減算
- ポットにベット額を加算
- プレイヤーのベット額を更新
- 現在のベット額を更新（レイズ/ベット/オールインの場合）
- **重要**: ベット額が上がった場合は`last_raiser_index`を更新

### 4. ラウンド終了判定
- **全員の賭け金が一致しているか？**
  - `all(p.bet == current_bet for p in active_players)`
- **最後にレイズした人に順番が戻ってきたか？**
  - `current_player_index == completion_index`
  - `completion_index = last_raiser_index`（レイズがあった場合）
  - `completion_index = betting_round_start_index`（レイズがない場合）
- **プリフロップの場合: BBがアクションを取ったか？**
  - `bb_has_acted_preflop == True`（BBが基準位置の場合のみチェック）

### 5. 完了後の処理
- 各プレイヤーの`bet`を0にリセット
- `current_bet`を0にリセット
- `last_raise_size`を0にリセット
- `last_raiser_index`をNoneにリセット
- 次のフェーズ（フロップ/ターン/リバー/ショーダウン）に進む

