/**
 * メインエントリーポイント: Gmailを監視してカレンダーに配送予定を登録する
 * トリガーで1時間ごとに実行する
 */
function checkAndRegisterDeliveries(): void {
  const threads = GmailApp.search(CONFIG.GMAIL_QUERY);
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

      try {
        const info = parseEmail(from, subject, body);
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
 * 1時間ごとのトリガーをセットアップする（初回のみ手動実行）
 */
function setupTrigger(): void {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === "checkAndRegisterDeliveries") {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  ScriptApp.newTrigger("checkAndRegisterDeliveries")
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
