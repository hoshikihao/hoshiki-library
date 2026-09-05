import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// 文章：一篇一个 Markdown 文件
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['gumu', 'xinzhi', 'shixing']),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date(), // 收录日期，用于排序 / RSS
    author: z.string().optional(),
    written: z.string().optional(), // 原文写作时间，自由文本（如「北宋嘉佑二年（1057）」）；填了就替代 byline 里的「收录于 …」
    sourceUrl: z.string().url().optional(), // 原文链接，有就填，渲染成文末「读原文」按钮
    commentary: z.string().optional(), // 文末点评，Markdown
    draft: z.boolean().default(false),
  }),
});

// 书籍：src/data/books.yaml，顶层为 id -> 书 的映射
const books = defineCollection({
  loader: file('./src/data/books.yaml'),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    cover: z.string(), // /covers/xxx.jpg 或远程 URL
    status: z.enum(['reading', 'read', 'want']),
    note: z.string(), // 一句话短评
  }),
});

// 影视：src/data/films.yaml，按类型分组（不追踪观看状态）
const films = defineCollection({
  loader: file('./src/data/films.yaml'),
  schema: z.object({
    title: z.string(),
    director: z.string(),
    poster: z.string(), // /posters/xxx.jpg 或远程 URL
    type: z.enum(['anime', 'series', 'movie', 'doc']),
    note: z.string(), // 一句话短评
  }),
});

export const collections = { articles, books, films };
