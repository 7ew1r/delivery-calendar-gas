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
function parseEmail(from: string, subject: string, body: string): DeliveryInfo | null {
  if (from.includes("kuronekoyamato.co.jp")) {
    return parseYamatoEmail(body);
  }
  if (from.includes("amazon.co.jp") || from.includes("amazon.com")) {
    return parseAmazonEmail(body);
  }
  console.log(`未対応の送信元: ${from}`);
  return null;
}

// -----------------------------------------------
// ヤマト運輸
// -----------------------------------------------

function parseYamatoEmail(body: string): DeliveryInfo | null {
  const trackingNumber = extractYamatoTrackingNumber(body);
  if (!trackingNumber) {
    console.log("[ヤマト] 送り状番号が見つかりませんでした");
    return null;
  }

  const deliveryDate = extractDeliveryDateFromLine(body, "お届け予定");
  if (!deliveryDate) {
    console.log(`[ヤマト:${trackingNumber}] 配達予定日が見つかりませんでした`);
    return null;
  }

  return {
    carrier: "ヤマト運輸",
    trackingNumber,
    deliveryDate,
    senderName: extractSenderName(body),
  };
}

/** 送り状番号（4-4-4形式）を抽出 */
function extractYamatoTrackingNumber(body: string): string | null {
  const match = body.match(/送り状番号\s*[：:]\s*([0-9]{4}-[0-9]{4}-[0-9]{4}|[0-9]{12})/);
  return match ? match[1].replace(/-/g, "") : null;
}

// -----------------------------------------------
// Amazon
// -----------------------------------------------

function parseAmazonEmail(body: string): DeliveryInfo | null {
  const trackingNumber = extractAmazonTrackingNumber(body);
  if (!trackingNumber) {
    console.log("[Amazon] 注文番号が見つかりませんでした");
    return null;
  }

  const deliveryDate = extractDeliveryDateFromLine(body, "お届け予定");
  if (!deliveryDate) {
    console.log(`[Amazon:${trackingNumber}] 配達予定日が見つかりませんでした`);
    return null;
  }

  return {
    carrier: "Amazon",
    trackingNumber,
    deliveryDate,
    senderName: null,
  };
}

/**
 * Amazon注文番号（例: 249-1234567-1234567）を抽出
 * 注文番号を重複チェックのキーとして使用する
 */
function extractAmazonTrackingNumber(body: string): string | null {
  const match = body.match(/注文番号\s*[：:]\s*([0-9]{3}-[0-9]{7}-[0-9]{7})/);
  return match ? match[1].replace(/-/g, "") : null;
}

// -----------------------------------------------
// 共通ユーティリティ
// -----------------------------------------------

/** 指定キーワードを含む行から M月DD日 を抽出 */
function extractDeliveryDateFromLine(body: string, keyword: string): Date | null {
  for (const line of body.split(/\r?\n/)) {
    if (!line.includes(keyword)) continue;
    const match = line.match(/(\d{1,2})月(\d{1,2})日/);
    if (!match) continue;

    const month = parseInt(match[1], 10) - 1;
    const day = parseInt(match[2], 10);
    const now = new Date();
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
