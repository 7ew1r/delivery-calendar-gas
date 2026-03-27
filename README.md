# delivery-calendar-gas

Gmail の配送通知メールを監視し、配達予定日を自動的に Google カレンダーへ登録する Google Apps Script (GAS) プロジェクトです。

## 機能

- **配送予定の登録**: ヤマト運輸・Amazon の配送通知メールを検知し、配達予定日をカレンダーに終日イベントとして登録
- **商品名の表示**: Amazon メールから商品名を抽出できる場合、イベント名に商品名を表示
- **配達完了の検知**: Amazon の配達完了メールを検知し、カレンダーイベントの 📦 を ✅ に更新
- **重複防止**: 同一追跡番号のイベントは登録済みラベルで除外

## 対応業者

| 業者 | 配送予定 | 配達完了 |
|---|---|---|
| ヤマト運輸 | ✅ | - |
| Amazon | ✅ | ✅ |

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. clasp の設定

`.clasp.json.template` をコピーして `.clasp.json` を作成し、GAS のスクリプト ID を設定します。

```bash
cp .clasp.json.template .clasp.json
```

```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "./src"
}
```

スクリプト ID は GAS エディタの URL（`https://script.google.com/d/<scriptId>/edit`）から確認できます。

### 3. スクリプトプロパティの設定

GAS エディタで **プロジェクト設定 → スクリプトプロパティ** を開き、以下を追加します。

| プロパティ名 | 値 |
|---|---|
| `CALENDAR_ID` | 登録先カレンダーの ID（Google カレンダーの設定から確認） |

### 4. GAS へのデプロイ

```bash
npm run push
```

### 5. トリガーの設定

GAS エディタでスクリプトを開き、`setupTrigger` を手動で1回実行します。以下の2つのトリガーが1時間ごとに登録されます。

- `checkAndRegisterDeliveries` — 配送通知メールを処理してカレンダーに登録
- `checkAndMarkDeliveries` — 配達完了メールを処理してイベントを ✅ に更新

## 開発コマンド

```bash
npm run push   # GAS にデプロイ
npm run pull   # GAS からソースを取得
npm run logs   # 実行ログを確認
npm run open   # GAS エディタをブラウザで開く
```
