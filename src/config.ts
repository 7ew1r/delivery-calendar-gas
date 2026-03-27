/** スクリプトプロパティから設定値を取得する */
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  const calendarId = props.getProperty("CALENDAR_ID");
  if (!calendarId) {
    throw new Error("スクリプトプロパティ CALENDAR_ID が設定されていません");
  }
  return {
    CALENDAR_ID: calendarId,
    PROCESSED_LABEL: "配送カレンダー登録済み",
    GMAIL_QUERY_YAMATO: 'from:mail@kuronekoyamato.co.jp subject:"お荷物お届けのお知らせ" newer_than:1m -label:配送カレンダー登録済み',
    GMAIL_QUERY_AMAZON: 'from:(auto-confirm@amazon.co.jp) subject:"注文済み" newer_than:1m -label:配送カレンダー登録済み',
    EVENT_COLOR: CalendarApp.EventColor.RED,
  } as const;
}

const CONFIG = getConfig();
