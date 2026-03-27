// -----------------------------------------------
// Amazon
// -----------------------------------------------

const WEEKDAY_MAP: Record<string, number> = {
  日: 0, 月: 1, 火: 2, 水: 3, 木: 4, 金: 5, 土: 6,
};

function parseAmazonEmail(body: string, receivedAt: Date): DeliveryInfo | null {
  const trackingNumber = extractAmazonTrackingNumber(body);
  if (!trackingNumber) {
    console.log("[Amazon] 注文番号が見つかりませんでした");
    return null;
  }

  const deliveryDate = extractAmazonDeliveryDate(body, receivedAt);
  if (!deliveryDate) {
    console.log(`[Amazon:${trackingNumber}] 配達予定日が見つかりませんでした`);
    return null;
  }

  return {
    carrier: "Amazon",
    trackingNumber,
    deliveryDate,
    senderName: null,
    productName: extractAmazonProductName(body),
  };
}

/**
 * Amazonメール本文から配達予定日を抽出する。
 * 以下のパターンに対応:
 *   - 「水曜日にお届け」などの曜日指定
 *   - 「本日到着予定」「今日到着予定」
 *   - 「明日到着予定」「明日5:00～13:00に到着予定」
 *   - 「3月28日」などの絶対日付（フォールバック）
 */
function extractAmazonDeliveryDate(body: string, receivedAt: Date): Date | null {
  const today = new Date(receivedAt);
  today.setHours(0, 0, 0, 0);

  for (const line of body.split(/\r?\n/)) {
    const t = line.trim();

    // 本日・今日
    if (/(?:本日|今日)(?:.*?)(?:到着予定|お届け)/.test(t) ||
        /(?:到着予定|お届け)(?:.*?)(?:本日|今日)/.test(t)) {
      return new Date(today);
    }

    // 明日・あす（時間帯付き「明日5:00～13:00に到着予定」も含む）
    if (/(?:明日|あす)(?:.*?)(?:到着予定|お届け|に到着)/.test(t) ||
        /(?:到着予定|お届け)(?:.*?)(?:明日|あす)/.test(t)) {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      return d;
    }

    // 曜日指定「〇曜日にお届け」
    const weekdayMatch = t.match(/([月火水木金土日])曜日/);
    if (weekdayMatch && /お届け|到着/.test(t)) {
      const targetDay = WEEKDAY_MAP[weekdayMatch[1]];
      const diff = (targetDay - today.getDay() + 7) % 7;
      const d = new Date(today);
      d.setDate(d.getDate() + diff);
      return d;
    }

    // M月D日 形式（フォールバック）
    if (/お届け|到着予定/.test(t)) {
      const match = t.match(/(\d{1,2})月(\d{1,2})日/);
      if (match) {
        const month = parseInt(match[1], 10) - 1;
        const day = parseInt(match[2], 10);
        const year =
          today.getMonth() > month ||
          (today.getMonth() === month && today.getDate() > day)
            ? today.getFullYear() + 1
            : today.getFullYear();
        return new Date(year, month, day);
      }
    }
  }
  return null;
}

/**
 * Amazonメール本文から商品名を抽出する。
 * 「注文内容の表示と変更」の直後に現れる最初の非空行を商品名とみなす。
 * 末尾が「...」で切れている省略行はスキップする。
 */
function extractAmazonProductName(body: string): string | null {
  const lines = body.split(/\r?\n/);
  let foundAnchor = false;
  for (const line of lines) {
    const t = line.trim();
    if (!foundAnchor) {
      if (t === "注文内容の表示と変更") foundAnchor = true;
      continue;
    }
    if (t === "" || t.endsWith("...") || t.endsWith("…") || /^https?:\/\//.test(t)) continue;
    return t;
  }
  return null;
}

/**
 * Amazon注文番号（例: 503-6042215-0275810）を抽出。
 * 注文番号の直前にUnicode制御文字（U+202B等）が入る場合があるため考慮する。
 */
function extractAmazonTrackingNumber(body: string): string | null {
  const match = body.match(/注文番号[\s\u200b-\u200f\u202a-\u202e]*([0-9]{3}-[0-9]{7}-[0-9]{7})/);
  return match ? match[1] : null;
}
