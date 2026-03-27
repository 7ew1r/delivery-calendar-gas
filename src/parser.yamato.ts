// -----------------------------------------------
// ヤマト運輸
// -----------------------------------------------

function parseYamatoEmail(body: string, receivedAt: Date): DeliveryInfo | null {
  const trackingNumber = extractYamatoTrackingNumber(body);
  if (!trackingNumber) {
    console.log("[ヤマト] 送り状番号が見つかりませんでした");
    return null;
  }

  const deliveryDate = extractDeliveryDateFromLine(body, "お届け予定", receivedAt);
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
