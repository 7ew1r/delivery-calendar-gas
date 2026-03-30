// -----------------------------------------------
// 無印良品
// -----------------------------------------------

function parseMujiEmail(body: string, receivedAt: Date): DeliveryInfo | null {
  const trackingNumber = extractMujiOrderNumber(body);
  if (!trackingNumber) {
    console.log("[無印良品] 注文番号が見つかりませんでした");
    return null;
  }

  const deliveryDate = extractMujiDeliveryDate(body, receivedAt);
  if (!deliveryDate) {
    console.log(`[無印良品:${trackingNumber}] お届け予定日が見つかりませんでした`);
    return null;
  }

  return {
    carrier: "無印良品",
    trackingNumber,
    deliveryDate,
    senderName: null,
    productName: null,
  };
}

/** 注文番号（例: 401467821267）を抽出 */
function extractMujiOrderNumber(body: string): string | null {
  const match = body.match(/【注文番号】[\s　]*([0-9]+)/);
  return match ? match[1].trim() : null;
}

/**
 * 【お届け予定日時】から配達予定日を抽出する。
 * 例: 「【お届け予定日時】　2026年04月05日　希望無し」
 */
function extractMujiDeliveryDate(body: string, receivedAt: Date): Date | null {
  const match = body.match(/【お届け予定日時】[\s　]*(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  return new Date(year, month, day);
}
