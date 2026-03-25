/**
 * 配送情報をGoogleカレンダーに終日イベントとして登録する
 * 同一送り状番号のイベントが既に存在する場合はスキップ
 */
function registerDeliveryEvent(info: DeliveryInfo): boolean {
  const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
  if (!calendar) {
    throw new Error(`カレンダーが見つかりません: ${CONFIG.CALENDAR_ID}`);
  }

  if (isDuplicateEvent(calendar, info)) {
    console.log(`[${info.trackingNumber}] 既にカレンダーに登録済みのためスキップします`);
    return false;
  }

  const title = buildEventTitle(info);
  const description = buildEventDescription(info);

  const event = calendar.createAllDayEvent(title, info.deliveryDate, { description });
  event.setColor(CONFIG.EVENT_COLOR);

  console.log(`[${info.trackingNumber}] カレンダーに登録しました: ${title}`);
  return true;
}

/** 同一送り状番号のイベントが既に存在するか確認 */
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
  const sender = info.senderName ? `（${info.senderName}）` : "";
  return `📦 ヤマト配達${sender}`;
}

/** イベント説明文を生成 */
function buildEventDescription(info: DeliveryInfo): string {
  const lines = [
    `送り状番号: ${info.trackingNumber}`,
    `配達業者: ヤマト運輸`,
  ];
  if (info.senderName) lines.push(`送り主: ${info.senderName}`);
  lines.push(`追跡URL: https://jizen.kuronekoyamato.co.jp/jizen/servlet/crjz.b.CRJZ0001?id=${info.trackingNumber}`);
  return lines.join("\n");
}
