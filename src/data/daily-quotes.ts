// 首页「日签」的图 + 一句话池子。
// id 对应 src/assets/daily/<id>.(jpg|png|webp) 的文件名。
// 按「今天是这一年的第几天 % 池子长度」轮换，池子里加新条目就自动参与轮换，无需改逻辑。

export interface DailyQuote {
  id: string;
  quote: string;
}

export const DAILY_QUOTES: DailyQuote[] = [
  { id: 'xunmeng', quote: '寻梦，撑一支长篙，向青草更青处漫溯。' },
];
