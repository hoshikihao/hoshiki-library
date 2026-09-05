import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// 文章：一篇一个 Markdown 文件
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z
    .object({
      title: z.string(),
      category: z.enum(['gumu', 'xinzhi', 'shixing']),
      tags: z.array(z.string()).default([]),
      date: z.coerce.date(), // 收录日期
      author: z.string().optional(),
      sourceUrl: z.string().url().optional(), // 原文链接
      commentary: z.string().optional(), // 文末点评，Markdown
      draft: z.boolean().default(false),
    })
    .refine((d) => d.category !== 'shixing' || Boolean(d.sourceUrl), {
      message: '摘星（shixing）文章必须填 sourceUrl',
      path: ['sourceUrl'],
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
