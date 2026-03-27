/**
 * メインエントリーポイント: Gmailを監視してカレンダーに配送予定を登録する
 * トリガーで1時間ごとに実行する
 */
function checkAndRegisterDeliveries(): void {
  const threadMap = new Map<string, GoogleAppsScript.Gmail.GmailThread>();
  for (const thread of [
    ...GmailApp.search(CONFIG.GMAIL_QUERY_YAMATO),
    ...GmailApp.search(CONFIG.GMAIL_QUERY_AMAZON),
  ]) {
    threadMap.set(thread.getId(), thread);
  }
  const threads = [...threadMap.values()];
  console.log(`対象メール: ${threads.length}件`);

  if (threads.length === 0) return;

  const processedLabel = getOrCreateLabel(CONFIG.PROCESSED_LABEL);

  let registeredCount = 0;
  let skippedCount = 0;

  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const message of messages) {
      const from = message.getFrom();
      const subject = message.getSubject();
      const body = message.getPlainBody();
      const receivedAt = message.getDate();

      try {
        const info = parseEmail(from, subject, body, receivedAt);
        if (!info) {
          console.log(`解析失敗: ${subject}`);
          continue;
        }

        const registered = registerDeliveryEvent(info);
        if (registered) {
          registeredCount++;
        } else {
          skippedCount++;
        }
      } catch (e) {
        console.error(`エラー (${subject}): ${e}`);
      }
    }

    // 処理済みラベルを付与してGmailクエリから除外
    thread.addLabel(processedLabel);
  }

  console.log(`完了: 登録=${registeredCount}件, スキップ=${skippedCount}件`);
}

/**
 * 配達完了メールを検知してカレンダーイベントに✅を付ける
 * トリガーで1時間ごとに実行する
 */
function checkAndMarkDeliveries(): void {
  const threads = GmailApp.search(CONFIG.GMAIL_QUERY_AMAZON_DELIVERED);
  console.log(`配達完了メール: ${threads.length}件`);

  if (threads.length === 0) return;

  const processedLabel = getOrCreateLabel(CONFIG.PROCESSED_LABEL);
  let markedCount = 0;

  for (const thread of threads) {
    for (const message of thread.getMessages()) {
      const subject = message.getSubject();
      // 件名例: 「配達済み:3点の商品 | 注文番号 503-7960125-2917453」
      const match = subject.match(/注文番号[\s\u200b-\u200f\u202a-\u202e]*([0-9]{3}-[0-9]{7}-[0-9]{7})/);
      if (!match) {
        console.log(`注文番号が件名から取得できません: ${subject}`);
        continue;
      }
      const orderNumber = match[1];
      try {
        const count = markEventAsDelivered(orderNumber);
        if (count > 0) {
          console.log(`[Amazon:${orderNumber}] カレンダーイベントを配達済みにしました`);
          markedCount += count;
        } else {
          console.log(`[Amazon:${orderNumber}] 対応するカレンダーイベントが見つかりませんでした`);
        }
      } catch (e) {
        console.error(`エラー (${subject}): ${e}`);
      }
    }
    thread.addLabel(processedLabel);
  }

  console.log(`完了: 配達済みマーク=${markedCount}件`);
}

/**
 * 1時間ごとのトリガーをセットアップする（初回のみ手動実行）
 */
function setupTrigger(): void {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (
      trigger.getHandlerFunction() === "checkAndRegisterDeliveries" ||
      trigger.getHandlerFunction() === "checkAndMarkDeliveries"
    ) {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  ScriptApp.newTrigger("checkAndRegisterDeliveries")
    .timeBased()
    .everyHours(1)
    .create();

  ScriptApp.newTrigger("checkAndMarkDeliveries")
    .timeBased()
    .everyHours(1)
    .create();

  console.log("トリガーをセットアップしました（1時間ごとに実行）");
}

/** ラベルを取得または作成する */
function getOrCreateLabel(
  labelName: string
): GoogleAppsScript.Gmail.GmailLabel {
  return (
    GmailApp.getUserLabelByName(labelName) ?? GmailApp.createLabel(labelName)
  );
}
