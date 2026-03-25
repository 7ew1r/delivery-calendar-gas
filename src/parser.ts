/** ヤマト運輸メールから抽出した配送情報 */
interface DeliveryInfo {
  trackingNumber: string;
  deliveryDate: Date;
  senderName: string | null;
}

/**
 * ヤマト運輸の配達通知メール本文を解析して配送情報を抽出する
 */
function parseYamatoEmail(subject: string, body: string): DeliveryInfo | null {
  const trackingNumber = extractTrackingNumber(body);
  if (!trackingNumber) {
    console.log("送り状番号が見つかりませんでした");
    return null;
  }

  const deliveryDate = extractDeliveryDate(body);
  if (!deliveryDate) {
    console.log(`[${trackingNumber}] 配達予定日が見つかりませんでした`);
    return null;
  }

  return {
    trackingNumber,
    deliveryDate,
    senderName: extractSenderName(body),
  };
}

/** 送り状番号（4-4-4形式）を抽出 */
function extractTrackingNumber(body: string): string | null {
  const match = body.match(/送り状番号\s*[：:]\s*([0-9]{4}-[0-9]{4}-[0-9]{4}|[0-9]{12})/);
  return match ? match[1].replace(/-/g, "") : null;
}

/** 「お届け予定」を含む行から M月DD日 を抽出 */
function extractDeliveryDate(body: string): Date | null {
  for (const line of body.split(/\r?\n/)) {
    if (!line.includes("お届け予定")) continue;
    const match = line.match(/(\d{1,2})月(\d{1,2})日/);
    if (!match) continue;

    const month = parseInt(match[1], 10) - 1;
    const day = parseInt(match[2], 10);
    const now = new Date();
    // 月が過去になる場合は翌年とみなす
    const year =
      now.getMonth() > month ||
      (now.getMonth() === month && now.getDate() > day)
        ? now.getFullYear() + 1
        : now.getFullYear();
    return new Date(year, month, day);
  }
  return null;
}

/** 送り主名を抽出 */
function extractSenderName(body: string): string | null {
  const match = body.match(/(?:送り主|発送元|差出人)\s*[：:]\s*([^\n\r]+)/);
  return match ? match[1].trim() : null;
}
