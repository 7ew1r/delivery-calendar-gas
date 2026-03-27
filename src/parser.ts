/** 配送情報 */
interface DeliveryInfo {
  carrier: string;
  trackingNumber: string;
  deliveryDate: Date;
  senderName: string | null;
}

/**
 * 送信元アドレスに応じて適切なパーサーへ振り分ける
 */
function parseEmail(from: string, subject: string, body: string, receivedAt: Date): DeliveryInfo | null {
  if (from.includes("kuronekoyamato.co.jp")) {
    return parseYamatoEmail(body, receivedAt);
  }
  if (from.includes("amazon.co.jp") || from.includes("amazon.com")) {
    return parseAmazonEmail(body, receivedAt);
  }
  console.log(`未対応の送信元: ${from}`);
  return null;
}

// -----------------------------------------------
// 共通ユーティリティ
// -----------------------------------------------

/** 指定キーワードを含む行から M月DD日 を抽出 */
function extractDeliveryDateFromLine(body: string, keyword: string, receivedAt: Date): Date | null {
  for (const line of body.split(/\r?\n/)) {
    if (!line.includes(keyword)) continue;
    const match = line.match(/(\d{1,2})月(\d{1,2})日/);
    if (!match) continue;

    const month = parseInt(match[1], 10) - 1;
    const day = parseInt(match[2], 10);
    const year =
      receivedAt.getMonth() > month ||
      (receivedAt.getMonth() === month && receivedAt.getDate() > day)
        ? receivedAt.getFullYear() + 1
        : receivedAt.getFullYear();
    return new Date(year, month, day);
  }
  return null;
}

/** 送り主名を抽出 */
function extractSenderName(body: string): string | null {
  const match = body.match(/(?:送り主|発送元|差出人)\s*[：:]\s*([^\n\r]+)/);
  return match ? match[1].trim() : null;
}
