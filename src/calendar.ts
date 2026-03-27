const CARRIER_CONFIG: Record<string, { emoji: string; trackingUrl: (id: string) => string }> = {
  "ヤマト運輸": {
    emoji: "📦",
    trackingUrl: (id) => `https://jizen.kuronekoyamato.co.jp/jizen/servlet/crjz.b.CRJZ0001?id=${id}`,
  },
  "Amazon": {
    emoji: "📦",
    trackingUrl: (id) => `https://www.amazon.co.jp/your-orders/order-details?orderID=${id}`,
  },
};

/**
 * 配送情報をGoogleカレンダーに終日イベントとして登録する
 * 同一追跡番号のイベントが既に存在する場合はスキップ
 */
function registerDeliveryEvent(info: DeliveryInfo): boolean {
  const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
  if (!calendar) {
    throw new Error(`カレンダーが見つかりません: ${CONFIG.CALENDAR_ID}`);
  }

  if (isDuplicateEvent(calendar, info)) {
    console.log(`[${info.carrier}:${info.trackingNumber}] 既にカレンダーに登録済みのためスキップします`);
    return false;
  }

  const title = buildEventTitle(info);
  const description = buildEventDescription(info);

  const event = calendar.createAllDayEvent(title, info.deliveryDate, { description });
  event.setColor(CONFIG.EVENT_COLOR);

  console.log(`[${info.carrier}:${info.trackingNumber}] カレンダーに登録しました: ${title}`);
  return true;
}

/** 同一追跡番号のイベントが既に存在するか確認 */
function isDuplicateEvent(
  calendar: GoogleAppsScript.Calendar.Calendar,
  info: DeliveryInfo
): boolean {
  const searchStart = new Date(info.deliveryDate);
  searchStart.setDate(searchStart.getDate() - 3);
  const searchEnd = new Date(info.deliveryDate);
  searchEnd.setDate(searchEnd.getDate() + 3);

  const events = calendar.getEvents(searchStart, searchEnd);
  return events.some((event) =>
    event.getDescription().includes(info.trackingNumber)
  );
}

/** イベントタイトルを生成 */
function buildEventTitle(info: DeliveryInfo): string {
  const { emoji } = CARRIER_CONFIG[info.carrier] ?? { emoji: "📦" };
  const sender = info.senderName ? `（${info.senderName}）` : "";
  return `${emoji} ${info.carrier}配達${sender}`;
}

/** イベント説明文を生成 */
function buildEventDescription(info: DeliveryInfo): string {
  const { trackingUrl } = CARRIER_CONFIG[info.carrier] ?? { trackingUrl: () => "" };
  const lines = [
    `追跡番号: ${info.trackingNumber}`,
    `配達業者: ${info.carrier}`,
  ];
  if (info.senderName) lines.push(`送り主: ${info.senderName}`);
  const url = trackingUrl(info.trackingNumber);
  if (url) lines.push(`追跡URL: ${url}`);
  return lines.join("\n");
}
