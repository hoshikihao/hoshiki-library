// 站点级常量与栏目定义

export const SITE = {
  title: '星树文库',
  slogan: '甄选天下好文好书',
  description: '星树浩的私人文库：收藏的好文与好书，每篇附一段点评，附原文跳转。',
  url: 'https://read.hoshikihao.com',
  author: '星树浩',
  authorUrl: 'https://hoshikihao.com',
  repoUrl: 'https://github.com/hoshikihao/hoshiki-library',
  xUrl: 'https://x.com/hoshikihao',
} as const;

export type CategoryId = 'gumu' | 'xinzhi' | 'shixing';

interface CategoryMeta {
  id: CategoryId;
  name: string;
  blurb: string;
}

// 顺序即导航与首页入口顺序
export const CATEGORIES: CategoryMeta[] = [
  { id: 'gumu', name: '古木', blurb: '古文' },
  { id: 'xinzhi', name: '新枝', blurb: '随笔' },
  { id: 'shixing', name: '摘星', blurb: '时文选粹' },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryMeta>;

export type BookStatus = 'reading' | 'read' | 'want';

export const BOOK_STATUS: { id: BookStatus; name: string }[] = [
  { id: 'reading', name: '在读' },
  { id: 'read', name: '读完' },
  { id: 'want', name: '想读' },
];

// Telegram 找书 bot（书架页入口）
export const BOOK_BOT = {
  name: '小树',
  url: 'https://t.me/HoshikiBot',
  hint: '我的随身小书童',
} as const;

export type FilmType = 'anime' | 'series' | 'movie' | 'doc';

export const FILM_TYPE: { id: FilmType; name: string }[] = [
  { id: 'anime', name: '动漫' },
  { id: 'series', name: '剧集' },
  { id: 'movie', name: '电影' },
  { id: 'doc', name: '纪录片' },
];

// 首页入口：路径 + 展示名 + 一对配色（浅底/深字），首页专用
export const ENTRY_LINKS = [
  { href: '/gumu', name: '古木', bg: '#e8f3e7', fg: '#2f6b2c' },
  { href: '/xinzhi', name: '新枝', bg: '#e5f0fc', fg: '#1a56c4' },
  { href: '/shixing', name: '摘星', bg: '#fdf3dc', fg: '#a8730a' },
  { href: '/books', name: '书林', bg: '#fce8e5', fg: '#c1432a' },
  { href: '/films', name: '光影', bg: '#f1e7fa', fg: '#7a3fb8' },
] as const;
