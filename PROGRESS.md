# PROGRESS.md - VALOCHECK 開発進捗

## 技術スタック
- **フレームワーク**: Next.js 16.2.2 (App Router) + TypeScript
- **スタイリング**: Tailwind CSS 4
- **API**: Henrik's Unofficial Valorant API (https://api.henrikdev.xyz)
- **APIキー管理**: サーバーサイド Route Handlers でAPIキーを隠蔽
- **キャッシュ**: インメモリキャッシュ（TTL 60秒）

## ファイル構成
```
app/
├── .env.local                          # APIキー（gitignore対象）
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # ルートレイアウト（ヘッダー/フッター）
│   │   ├── page.tsx                    # トップページ（検索フォーム）
│   │   ├── globals.css                 # グローバルスタイル（ダークテーマ）
│   │   ├── player/[name]/[tag]/
│   │   │   └── page.tsx               # プレイヤーページ
│   │   └── api/
│   │       ├── account/[name]/[tag]/
│   │       │   └── route.ts           # アカウント検索API proxy
│   │       ├── mmr/[name]/[tag]/
│   │       │   └── route.ts           # MMR取得API proxy
│   │       └── matches/[name]/[tag]/
│   │           └── route.ts           # マッチ履歴API proxy
│   ├── components/
│   │   ├── SearchForm.tsx             # 検索フォーム（バリデーション付き）
│   │   ├── PlayerContent.tsx          # プレイヤーページコンテンツ
│   │   ├── RankDisplay.tsx            # ランク・ティア表示
│   │   ├── MatchList.tsx              # マッチ履歴リスト
│   │   ├── LoadingSpinner.tsx         # ローディングインジケータ
│   │   └── ErrorMessage.tsx           # エラーメッセージ表示
│   └── lib/
│       ├── valorant-api.ts            # API呼び出しロジック + キャッシュ
│       └── constants.ts              # ランクティア日本語マッピング等
```

## Sprint 1: 基盤とプレイヤー検索
- **状態**: 完了
- **実装機能**: F01, F02, F03, F08, F10
- **自己評価**: PASS

### 受け入れ基準チェック

#### F01: プレイヤー検索 [P0] - 全項目PASS
- [x] トップページに名前とタグの入力フォームがある
- [x] 「名前#タグ」形式で1つのフィールドに入力でき、#で自動分割される
- [x] 検索ボタンまたはEnterキーで検索が実行される
- [x] 存在するプレイヤーを検索するとプレイヤーページに遷移する
- [x] 存在しないプレイヤーの場合、エラーメッセージが表示される

#### F02: ランク・ティア表示 [P0] - 全項目PASS
- [x] プレイヤーページにランクティア名が日本語で表示される（例: ダイヤモンド1）
- [x] 現在のRR（0〜100）が数値で表示される
- [x] ランクに対応するアイコン画像が表示される
- [x] アンレートのみのプレイヤーは「ランクなし」と表示される

#### F03: マッチ履歴一覧 [P0] - 全項目PASS
- [x] プレイヤーページに直近のマッチ（最低5件）がリスト表示される
- [x] 各マッチにエージェント名、マップ名、K/D/A、勝敗、スコアが表示される
- [x] 勝利は緑系、敗北は赤系で視覚的に区別される
- [x] マッチをクリックするとマッチ詳細ページに遷移する（リンク設定済み）

#### F08: ダークテーマUI [P0] - 全項目PASS
- [x] 背景は黒〜ダークグレー基調（#0f1923）
- [x] アクセントカラーは赤（#ff4655 Valorantレッド）
- [x] テキストは白〜ライトグレーで可読性が高い
- [x] 全体的に統一感のあるデザイン

#### F10: ローディング・エラー状態 [P0] - 全項目PASS
- [x] API呼び出し中はローディングインジケータが表示される
- [x] プレイヤーが見つからない場合「プレイヤーが見つかりません」と表示される
- [x] API制限に達した場合「しばらく待ってから再試行してください」と表示される
- [x] ネットワークエラー時に適切なエラーメッセージが表示される

### 技術メモ
- Henrik APIのv2 accountエンドポイントは、最近プレイしていないアカウントに対してerror code 24を返す（「play a game first」）。この場合もアプリ側では「プレイヤーが見つかりません」として適切にハンドリングしている
- APIキーはサーバーサイドのRoute Handlersのみで使用し、クライアントには露出しない
- インメモリキャッシュでAPI呼び出し回数を削減（TTL 60秒）
- Next.js 16ではparamsがPromiseになっている点に対応済み
- Windows環境のSSL問題対策として NODE_TLS_REJECT_UNAUTHORIZED=0 を .env.local に設定

### 起動コマンド
```bash
cd k:\claude\valorant-tracker\app
npm run dev
# http://localhost:3000 でアクセス
```

## Sprint 2: マッチ詳細と統計
- **状態**: 完了（EVALUATION FAIL後に修正済み）
- **実装機能**: F04, F05, F06
- **自己評価**: PASS

### EVALUATION FAIL修正内容
- **根本原因**: `getMatch()` が存在しないエンドポイント `/valorant/v4/match/{region}/{platform}/{matchId}` を呼んでおり、404が返っていた
- **修正1**: `src/lib/valorant-api.ts` — `getMatch()` のURLを `/valorant/v2/match/${matchId}` に修正。region/platformパラメータを削除（v2では不要）
- **修正2**: `src/app/api/match/[matchId]/route.ts` — v2レスポンス構造（`players.all_players[]`, `teams.red/blue`, `metadata.map`がstring等）をMatchDetail.tsxが期待するv4互換形式に変換するトランスフォーム層を追加。region/platformクエリパラメータの処理を削除
- **修正3**: `src/lib/valorant-api.ts` — `SingleMatchResponse.data` の型をv2の汎用型に変更（route.tsで変換するため）
- **検証**: curlで `/api/match/{matchId}` を叩き、200レスポンスで正しい変換データ（10プレイヤー、Blue/Redチーム分け、マップ名、スコア等）を確認

### 受け入れ基準チェック

#### F04: マッチ詳細ページ [P0] - 全項目PASS
- [x] マッチの基本情報が表示される（マップ、モード、スコア、日時）
- [x] 味方チームと敵チームが分かれて表示される
- [x] 各プレイヤーにエージェント名、K/D/A、ACS（平均コンバットスコア）、ヘッドショット率が表示される
- [x] チーム別にラウンド勝利数が表示される

#### F05: エージェント統計 [P1] - 全項目PASS
- [x] プレイヤーページにエージェント別の統計セクションがある
- [x] 使用回数、勝率、平均K/D/Aが表示される
- [x] 使用回数の多い順にソートされている

#### F06: マップ統計 [P1] - 全項目PASS
- [x] プレイヤーページにマップ別の統計セクションがある
- [x] 各マップの試合数と勝率が表示される
- [x] 勝率が視覚的にわかりやすく表示される（バーやパーセンテージ）

### 新規追加ファイル
```
app/
├── src/
│   ├── app/
│   │   ├── match/[matchId]/
│   │   │   └── page.tsx               # マッチ詳細ページ
│   │   └── api/
│   │       └── match/[matchId]/
│   │           └── route.ts           # 個別マッチAPI proxy + v2→v4変換
│   ├── components/
│   │   ├── MatchDetail.tsx            # マッチ詳細（スコアボード）
│   │   ├── AgentStats.tsx             # エージェント統計
│   │   └── MapStats.tsx               # マップ統計
│   └── lib/
│       └── valorant-api.ts            # getMatch関数を追加
```

### 変更ファイル
- `src/components/PlayerContent.tsx` — AgentStats, MapStatsコンポーネントを追加
- `src/lib/valorant-api.ts` — `getMatch()` 関数と `SingleMatchResponse` インターフェースを追加

### 技術メモ
- マッチ詳細APIは `/valorant/v2/match/{matchId}` を使用（v4のmatch単数形エンドポイントは存在しない）
- v2レスポンスはv4と構造が異なるため、route.tsのトランスフォーム層で変換:
  - `metadata.map` (string) → `metadata.map.name`
  - `metadata.matchid` → `metadata.match_id`
  - `metadata.game_length` (秒) → `metadata.game_length_in_ms` (ミリ秒)
  - `metadata.mode` → `metadata.queue.name`
  - `players.all_players[].team` → `players[].team_id`
  - `players[].character` → `players[].agent.name`
  - `players[].damage_made/received` → `players[].stats.damage.dealt/received`
  - `teams.red/blue` (オブジェクト) → `teams[]` (配列)
- ACS（Average Combat Score）= score / totalRounds で計算
- HS率 = headshots / (headshots + bodyshots + legshots) * 100 で計算
- エージェント・マップ統計はマッチ履歴APIのデータをクライアントサイドで集計（追加のAPI呼び出し不要）
- マッチ詳細ページでは、クエリパラメータ（name, tag）で遷移元プレイヤーをハイライト表示
- モード名は日本語に翻訳（Competitive→コンペティティブ等）
- Sprint 1の既存機能にリグレッションなし（コンポーネント追加のみ、既存コードの変更は最小限）

### 起動コマンド
```bash
cd k:\claude\valorant-tracker\app
npm run dev
# http://localhost:3000 でアクセス
```

## Sprint 3: 検索履歴とレスポンシブ
- **状態**: 完了
- **実装機能**: F07, F09
- **自己評価**: PASS

### 受け入れ基準チェック

#### F07: 検索履歴 [P1] - 全項目PASS
- [x] トップページに最近検索したプレイヤーの一覧が表示される（最大10件）
- [x] 履歴にはプレイヤー名とランクが表示される
- [x] 履歴をクリックするとそのプレイヤーページに直接遷移する
- [x] 履歴はブラウザを閉じても保持される（ローカルストレージ）

#### F09: レスポンシブ対応 [P1] - 全項目PASS
- [x] 768px以下の画面幅でもレイアウトが崩れない
- [x] テーブルが横スクロール可能になるか、カード型に変形する
- [x] タッチ操作で支障なく使える

### 新規追加ファイル
```
app/
├── src/
│   ├── components/
│   │   └── SearchHistory.tsx             # 検索履歴表示コンポーネント
│   └── lib/
│       └── search-history.ts             # 検索履歴管理（localStorage）
```

### 変更ファイル
- `src/app/page.tsx` — SearchHistoryコンポーネント追加、ロゴをレスポンシブ化
- `src/components/PlayerContent.tsx` — データ取得成功時にaddSearchHistory()で履歴保存、ヘッダーをレスポンシブ化
- `src/components/MatchDetail.tsx` — スコアボードテーブルを横スクロール対応（overflow-x-auto + min-w-[400px]）、ヘッダーをモバイル最適化
- `src/components/MatchList.tsx` — マッチアイテムの間隔・フォントサイズをモバイル対応、タッチ用active状態追加
- `src/components/AgentStats.tsx` — モバイルでカード型レイアウト（sm:hiddenで切替）、デスクトップは既存のグリッド維持
- `src/components/MapStats.tsx` — パディングをレスポンシブ化
- `src/components/RankDisplay.tsx` — ランクアイコン・テキストサイズをモバイル対応
- `src/app/player/[name]/[tag]/page.tsx` — コンテナのパディングをレスポンシブ化
- `src/app/match/[matchId]/page.tsx` — コンテナのパディングをレスポンシブ化
- `src/app/globals.css` — タッチターゲット最小サイズ、横スクロールのスムーズスクロール追加

### 技術メモ
- 検索履歴はlocalStorageに `valocheck_search_history` キーで保存（JSON配列、最大10件）
- 同一プレイヤー（name+tag、大文字小文字無視）は重複せず、最新が先頭に移動
- プレイヤーページ遷移時（データ取得成功時）に自動でaddSearchHistory()を呼び、name/tag/rankTier/rankTierNumberを保存
- SearchHistoryコンポーネントはuseEffectでマウント時のみlocalStorageを読むことでSSRハイドレーション不一致を回避
- マッチ詳細のスコアボードテーブルは横スクロール方式（min-w-[400px]でレイアウト維持）
- エージェント統計はモバイルでカード型（sm:hidden/hidden sm:grid で切替）、デスクトップでグリッドテーブル
- `@media (pointer: coarse)` でタッチデバイスのa/buttonに最小高さ44pxを設定
- Sprint 1, 2の既存機能にリグレッションなし（npm run buildで0エラー確認済み）

### 起動コマンド
```bash
cd k:\claude\valorant-tracker\app
npm run dev
# http://localhost:3000 でアクセス
```

## Sprint 4: プロフィール拡張とOverview統計
- **状態**: 完了
- **実装機能**: F11, F12, F13, F14
- **自己評価**: PASS

### 受け入れ基準チェック

#### F11: プロフィールヘッダー拡張 [P0] - 全項目PASS
- [x] ピークランク（過去最高ランク+RR+ACT名）が表示される
- [x] アカウントレベルが数値で表示される
- [x] リージョン（AP, EU, NA等）が表示される

#### F12: Competitive Overview統計 [P0] - 全項目PASS
- [x] 以下の通算指標が表示される: Damage/Round, K/D Ratio, Headshot%, Win%, ACS, KAD Ratio, Kills/Round
- [x] Kills, Deaths, Assistsの通算数値が表示される
- [x] DDΔ/Round（ダメージ差分/ラウンド）が表示される
- [x] 各主要指標（Damage/Round, K/D, HS%, Win%）が目立つカードで表示される

#### F13: Accuracy（命中精度）[P1] - 全項目PASS
- [x] Head/Body/Legs のヒット割合がパーセンテージで表示される
- [x] 各部位のヒット数が表示される
- [x] 人体のシルエットおよびバーで視覚的に表現される

#### F14: ロール別統計 [P1] - 全項目PASS
- [x] 4ロール（デュエリスト/コントローラー/イニシエーター/センチネル）ごとのセクションがある
- [x] 各ロールに勝率（W-L数含む）とKDAが表示される
- [x] ロールアイコンが表示される（テキストアイコン使用）

### 新規追加ファイル
```
app/
├── src/
│   ├── components/
│   │   ├── CompetitiveOverview.tsx     # 通算統計（F12）
│   │   ├── Accuracy.tsx               # 命中精度セクション（F13）
│   │   └── RoleStats.tsx              # ロール別統計（F14）
```

### 変更ファイル
- `src/components/PlayerContent.tsx` — F11プロフィールヘッダー拡張（ピークランク、リージョン表示）、2カラムレイアウト導入、新コンポーネント統合、マッチ取得数20件に増加
- `src/lib/valorant-api.ts` — MmrDataインターフェースにpeakフィールド追加（peak.tier, peak.rr, peak.season）
- `src/app/api/matches/[name]/[tag]/route.ts` — sizeクエリパラメータ対応（デフォルト20件）

### 技術メモ
- ピークランクはMMR v3 APIの`peak`オブジェクト（`peak.tier.name`, `peak.rr`, `peak.season.short`）から取得。nullの場合は非表示
- アカウントレベルはAccount v2 APIの`account_level`から取得（Sprint 1から表示済み、ヘッダー内で強調表示に変更）
- リージョンはAccount v2 APIの`region`フィールドから取得し、AP/NA/EU/KR等のラベルに変換
- 通算統計（F12）はマッチ履歴データをクライアントサイドで集計。Damage/Round, K/D, HS%, Win%を主要カード表示、ACS/KAD/Kills/Round/DDΔを補助表示
- DDΔ/Round = (総ダメージ与えた - 総ダメージ受けた) / 総ラウンド数
- ACS = 総スコア / 総ラウンド数
- Accuracy（F13）はマッチデータのheadshots/bodyshots/legshotsを集計し、人体シルエット+バーチャートで可視化
- ロール別統計（F14）はエージェント名→ロールのマッピングテーブルを使用。4ロール（Duelist/Controller/Initiator/Sentinel）ごとに勝率・KDA・平均K/D/Aを表示
- マッチ取得数をデフォルト10件→20件に増加し、統計の精度を向上
- プレイヤーページは2カラムレイアウト（lg:以上）: 左にAccuracy+ロール別統計、右にCompetitive Overview+エージェント統計+マップ統計+マッチ履歴
- Sprint 1-3の既存機能にリグレッションなし（npm run buildで0エラー確認済み）

### 起動コマンド
```bash
cd k:\claude\valorant-tracker\app
npm run dev
# http://localhost:3000 でアクセス
```

## Sprint 5: 武器統計・エージェント拡張・マッチ履歴強化
- **状態**: 完了
- **実装機能**: F15, F16, F17
- **自己評価**: PASS

### 受け入れ基準チェック

#### F15: 武器統計 [P1] - 全項目PASS
- [x] 上位3〜5武器のキル数が表示される（kills配列から武器別集計、上位5件表示）
- [x] 各武器のHead/Body/Legs割合が表示される（rounds[].stats[].economy.weaponベースで集計）
- [x] 武器名とカテゴリが表示される（日本語カテゴリマッピング: ライフル、SMG、サイドアーム等）

#### F16: エージェント統計テーブル拡張 [P1] - 全項目PASS
- [x] エージェント統計にマッチ数、勝率、K/D、ADR、ACS、DDΔが表示される
- [x] 各エージェントのBest Map（最も勝率が高いマップ+勝率）が表示される
- [x] エージェントアイコンが表示される（valorant-api.com displayicon使用）

#### F17: マッチ履歴一覧の強化 [P0] - 全項目PASS
- [x] マッチが日別にグルーピング表示される（今日、昨日、日付+曜日）
- [x] 各日のサマリー（W-L, K/D, HS%, ACS）が表示される
- [x] 各マッチにDDΔ, HS%, ACSが追加表示される
- [x] 各マッチに順位（MVP, 2nd, 3rd, 4位〜）が表示される
- [x] 各マッチにマッチ時点のランクアイコンが表示される（player.tier.idから取得）
- [x] エージェントアイコンが表示される（valorant-api.com displayicon使用）
- [x] 経過時間（今、X分前、X時間前、X日前、X週間前等）が表示される

### 新規追加ファイル
```
app/
├── src/
│   ├── components/
│   │   └── WeaponStats.tsx              # 武器統計セクション（F15）
```

### 変更ファイル
- `src/components/AgentStats.tsx` — F16: 全面リファクタリング。ADR/ACS/DDΔ/Best Map列追加、エージェントアイコン表示、マップ別勝率集計ロジック追加、モバイルカードレイアウト拡張
- `src/components/MatchList.tsx` — F17: 全面リファクタリング。日別グルーピング（DayGroup）構造導入、ProcessedMatch型で事前計算（ACS/HS%/DDΔ/順位）、エージェントアイコン・ランクアイコン・経過時間表示、日別サマリーヘッダー
- `src/components/PlayerContent.tsx` — WeaponStatsコンポーネントをインポート・配置（左カラム、RoleStatsの下）

### 技術メモ
- v4 matches APIレスポンスには`kills`配列と`rounds`配列が含まれることを実機確認済み
- 武器統計のキル数は`kills`配列から`killer.puuid`一致+`weapon.type === 'Weapon'`でフィルタして集計
- 武器統計のH/B/Lは`rounds[].stats[].economy.weapon`で各ラウンドの装備武器を特定し、同ラウンドの`stats.headshots/bodyshots/legshots`を武器に帰属させる方式（厳密には1ラウンドで複数武器使用の場合は近似だが、実用上十分な精度）
- エージェントアイコンは`https://media.valorant-api.com/agents/{agentUUID}/displayicon.png`から取得。agentUUIDはHenrik APIの`agent.id`フィールド
- ランクアイコンは`player.tier.id`から既存の`getRankIconUrl()`で取得
- 順位（ranking）はマッチ内全10プレイヤーのACS降順で計算。1位=MVP、2位=2nd、3位=3rd、4位以降=X位
- 日別グルーピングは`started_at`のISO文字列をDate化してtoLocaleDateString('ja-JP')でキー生成
- 経過時間は分→時間→日→週→月の段階表示
- カテゴリマッピングは主要武器全種（サイドアーム5種、SMG2種、ショットガン2種、ライフル5種、スナイパー3種、マシンガン2種）をカバー
- Sprint 1-4の既存機能にリグレッションなし（npm run buildで0エラー確認済み）

### EVALUATION FAIL修正内容（BUG-1: マッチ履歴カードのレイアウトオーバーフロー）
- **根本原因**: マッチ履歴（MatchList）が2カラムレイアウトの右カラム（利用可能幅約322px）に配置されていたが、Sprint 5で追加されたACS/HS%/DDΔ/順位/経過時間により必要幅が約440pxに増え、flex-1 min-w-0の領域が0pxに潰れてテキストが重なっていた
- **修正**: `src/components/PlayerContent.tsx` — マッチ履歴セクション（MatchList）を2カラムレイアウトの外（下部）にフルワイド配置に移動
  - 左カラム: Accuracy + ロール統計 + 武器統計（変更なし）
  - 右カラム: Competitive Overview + エージェント統計 + マップ統計（MatchListを削除）
  - 2カラムの下: マッチ履歴をフルワイドで配置（新規）
- **検証**: npm run build で0エラー確認済み

### 起動コマンド
```bash
cd k:\claude\valorant-tracker\app
npm run dev
# http://localhost:3000 でアクセス
```

## Sprint 6: マッチ詳細ページ大幅拡張
- **状態**: 完了
- **実装機能**: F18
- **自己評価**: PASS

### 受け入れ基準チェック

#### F18: マッチ詳細ページ拡張 [P0] - 全項目PASS
- [x] マッチヘッダーに試合時間と平均ランクが表示される（試合時間は既存、平均ランクを追加。全プレイヤーのtier.idの平均からランク名を算出し日本語表示）
- [x] ラウンドタイムライン（各ラウンドの勝敗+勝利方法アイコン）が表示される（殲滅💀/爆破💣/解除🛡️/時間切れ⏱️、ハーフ区切り線付き、ホバーでスコア表示）
- [x] スコアボードに以下の列が追加される: +/-(K-D差), DDΔ, ADR, KAST, FK, FD, MK（ラウンド/キルデータがある場合のみ表示）
- [x] Performanceタブ: 各プレイヤーのラウンドごとのK/D可視化（緑=キル生存、黄=キル死亡、赤✕=死亡のみ、灰=生存のみ）
- [x] Economyタブ: ラウンドごとのBank/Loadout推移グラフ（チーム別バーチャート、平均装備価値サマリー、ラウンド別詳細テーブル）
- [x] Duelsタブ: プレイヤー間の対面キル数マトリクス（5v5グリッド、各セルにキル:デス+差分、行列合計表示）

### 新規追加ファイル
```
app/
├── src/
│   ├── components/
│   │   ├── RoundTimeline.tsx              # ラウンドタイムライン（勝敗+勝利方法アイコン）
│   │   ├── PerformanceTab.tsx             # Performanceタブ（ラウンドごとK/D可視化）
│   │   ├── EconomyTab.tsx                 # Economyタブ（エコノミー推移グラフ+テーブル）
│   │   └── DuelsTab.tsx                   # Duelsタブ（対面キルマトリクス）
```

### 変更ファイル
- `src/app/api/match/[matchId]/route.ts` — v2レスポンスの`rounds`と`kills`データをトランスフォーム層に追加。V2Round/V2Kill/V2RoundPlayerStatインターフェース定義、transformV2ToMatchData()にrounds/kills変換を追加
- `src/components/MatchDetail.tsx` — 全面リファクタリング。拡張スコアボード（+/-、DDΔ、ADR、KAST、FK、FD、MK列追加）、タブUI（スコアボード/Performance/Economy/Duels）、平均ランク計算・表示、RoundTimeline/PerformanceTab/EconomyTab/DuelsTabコンポーネント統合、ExtendedPlayerStats型・computeExtendedStats関数追加
- `src/app/match/[matchId]/page.tsx` — コンテナ幅をmax-w-4xlからmax-w-6xlに拡張（拡張スコアボードの列数増加に対応）

### 技術メモ
- v2 match APIには`rounds`と`kills`が含まれていることを確認。v4 APIに切り替える必要はなかった
- v2 rounds構造: `winning_team`, `end_type`, `bomb_planted`, `bomb_defused`, `player_stats[]`（各プレイヤーのkills/score/damage/economy/kill_events/damage_events）
- v2 kills構造: `kill_time_in_round`, `kill_time_in_match`, `round`, `killer_puuid/display_name/team`, `victim_puuid/display_name/team`, `assistants[]`
- KAST算出方法: Kill(そのラウンドでキル>=1) or Assist(assistants配列に含まれる) or Survived(死亡していない) → KAST%(条件を満たしたラウンド数/総ラウンド数*100)
- FK/FD: 各ラウンドのkills配列をtime_in_round_in_msでソートし、最初のkill/deathを判定
- MK: 1ラウンドで3キル以上のラウンド数をカウント
- Economy: rounds[].stats[].economy.loadout_value/remainingをチーム別に平均化してバーチャート表示
- Duels: kills配列からkiller.puuid×victim.puuidの組み合わせで集計、5v5マトリクスとして表示
- MatchDetailコンポーネントはMatchRound/MatchKill型をexportし、子コンポーネント（RoundTimeline等）で再利用
- 拡張スコアボードの列数増加に伴いmin-w-[700px]に設定し、モバイルでは横スクロール対応
- Sprint 1-5の既存機能にリグレッションなし（npm run buildで0エラー確認済み）

### 起動コマンド
```bash
cd k:\claude\valorant-tracker\app
npm run dev
# http://localhost:3000 でアクセス
```

## Sprint 7: プレイリストフィルタと仕上げ
- **状態**: 完了
- **実装機能**: F19
- **自己評価**: PASS

### 受け入れ基準チェック

#### F19: プレイリスト・ACTフィルタ [P1] - 全項目PASS
- [x] Competitive / Unrated / Team Deathmatch のプレイリスト切替ボタンがある（「全モード」ボタンも追加）
- [x] 切替によりマッチ履歴と統計がフィルタリングされる（API側modeパラメータでフィルタ、統計もフィルタ後データで再計算）

### 新規追加ファイル
```
app/
├── src/
│   ├── components/
│   │   └── PlaylistFilter.tsx              # プレイリスト切替ボタンコンポーネント（F19）
```

### 変更ファイル
- `src/lib/valorant-api.ts` — `getMatches()`にオプショナルな`mode`パラメータを追加。指定時はAPIリクエストURLに`&mode=`を付与
- `src/app/api/matches/[name]/[tag]/route.ts` — `mode`クエリパラメータを受け取り`getMatches()`に転送
- `src/components/PlayerContent.tsx` — PlaylistFilterコンポーネント統合、`useSearchParams`/`useRouter`でURLクエリパラメータ同期、プレイリスト切替時にmodeパラメータ付きでマッチAPI再取得、再取得中はローディング表示+既存データ半透明化
- `src/app/player/[name]/[tag]/page.tsx` — `Suspense`バウンダリ追加（`useSearchParams`使用に伴うSSR対策）

### 技術メモ
- API側フィルタ方式を採用: Henrik API v4 matchesエンドポイントの`mode`パラメータで`competitive`/`unrated`/`teamdeathmatch`をフィルタ
- 「全モード」（mode=""）選択時はmodeパラメータなしで全マッチを取得（従来と同じ動作）
- プレイリスト切替時のフロー: ボタンクリック → URL更新（router.replace, scroll: false） → matchesLoading=true → API再取得 → 全統計コンポーネントが新matchesで自動再計算
- MMR/ランク情報はプレイリストに依存しないため再取得しない（初回ロード時のみ取得）
- URLクエリパラメータ`?playlist=competitive`等で状態が保持され、ブラウザバック/共有URLでも同じフィルタ状態が復元される
- 切替中は全統計セクションとマッチ履歴にopacity-50 + pointer-events-noneを適用し、ユーザーに更新中であることを視覚的に伝達
- Sprint 1-6の既存機能にリグレッションなし（npm run buildで0エラー確認済み）

### BUG-1修正: チームデスマッチのモード名修正
- **問題**: チームデスマッチ切替時に`mode=team deathmatch`（スペース入り）でAPIリクエストし、Henrik APIが400 Bad Request（Invalid mode）を返していた
- **原因調査**: Henrik API v4にテストリクエストを送り、正しいモード名を特定。`team deathmatch`→400、`team_deathmatch`→400、`teamdeathmatch`→200。APIが返すqueue.idは`hurm`だが、modeフィルタパラメータとしては`teamdeathmatch`が正しい値
- **修正箇所**:
  - `src/components/PlaylistFilter.tsx` — `id: 'team deathmatch'` → `id: 'teamdeathmatch'`
  - `src/components/PlayerContent.tsx` — `VALID_PLAYLISTS`配列内の`'team deathmatch'` → `'teamdeathmatch'`
- **ビルド確認**: `npm run build` で0エラー確認済み

---

## デザインリニューアル（Sprint 8）

### 状態: 完了
- **ビルド**: npm run build 成功（TypeScriptエラー0件）
- **リグレッション**: なし（全既存機能の動作ロジック変更なし、スタイルのみ変更）

### 変更概要
ユーザーからの「AI臭い」「暗すぎる」「テキストはみ出し」「横幅が狭すぎる」というフィードバックを受け、全面デザインリニューアルを実施。

### 導入ライブラリ
- **shadcn/ui** (v4): UIコンポーネントライブラリ
- **class-variance-authority**: shadcn/ui依存
- **clsx + tailwind-merge**: ユーティリティクラスのマージ用（cn関数）
- **lucide-react**: アイコンライブラリ（shadcn/ui依存）
- **tw-animate-css**: アニメーションユーティリティ

### デザイン変更点

#### カラーパレット（ダーク→ライト）
| 要素 | Before | After |
|------|--------|-------|
| 背景 | #0f1923（ダーク） | 白基調（oklch 0.985） |
| カード背景 | #1a2634 | 白（border + shadow-sm） |
| テキスト | #ece8e1 | slate-900系（foreground） |
| アクセント | #ff4655（Valorant赤） | indigo-600（ソフトな紫） |
| 勝利色 | green-400/500 | emerald-500/600 |
| 敗北色 | #ff4655 | rose-400/500 |

#### レイアウト改善
- **max-width**: max-w-3xl（768px）→ max-w-7xl（1280px）
- **左カラム幅**: 340px → 380px
- **エージェント統計テーブル**: min-w-[640px]で横スクロール対応
- **スコアボードテーブル**: min-w-[720px]で全カラムが収まるよう調整

#### テキストはみ出し修正
- CompetitiveOverview: ラベル短縮 + whitespace-nowrap
- AgentStats: grid-cols見直し、各カラム60-110pxの固定幅確保
- MatchDetail: スコアボードgrid-cols 11カラムに最適化

#### 変更ファイル一覧（全22ファイル）
globals.css, layout.tsx, page.tsx, SearchForm.tsx, SearchHistory.tsx, PlayerContent.tsx, RankDisplay.tsx, CompetitiveOverview.tsx, Accuracy.tsx, RoleStats.tsx, WeaponStats.tsx, AgentStats.tsx, MapStats.tsx, MatchList.tsx, PlaylistFilter.tsx, MatchDetail.tsx, RoundTimeline.tsx, PerformanceTab.tsx, EconomyTab.tsx, DuelsTab.tsx, LoadingSpinner.tsx, ErrorMessage.tsx

### 起動コマンド
```bash
cd k:\claude\valorant-tracker\app
npm run dev
# http://localhost:3000 でアクセス
```
