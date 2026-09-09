import { getCollection, type CollectionEntry } from 'astro:content';

// 一个标签下的三类内容；articles 已按收录日期倒序，books/films 保持 YAML 顺序
export interface TagBucket {
  tag: string;
  articles: CollectionEntry<'articles'>[];
  books: CollectionEntry<'books'>[];
  films: CollectionEntry<'films'>[];
  total: number;
}

export async function getTagBuckets(): Promise<TagBucket[]> {
  const articles = (await getCollection('articles', (e) => !e.data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
  const books = await getCollection('books');
  const films = await getCollection('films');

  const map = new Map<string, TagBucket>();
  const at = (t: string): TagBucket => {
    let b = map.get(t);
    if (!b) {
      b = { tag: t, articles: [], books: [], films: [], total: 0 };
      map.set(t, b);
    }
    return b;
  };

  for (const a of articles) for (const t of a.data.tags) at(t).articles.push(a);
  for (const bk of books) for (const t of bk.data.tags) at(t).books.push(bk);
  for (const f of films) for (const t of f.data.tags) at(t).films.push(f);

  const buckets = [...map.values()];
  for (const b of buckets) {
    b.total = b.articles.length + b.books.length + b.films.length;
  }
  buckets.sort((a, b) => b.total - a.total || a.tag.localeCompare(b.tag, 'zh'));

  return buckets;
}

export async function getTagBucket(tag: string): Promise<TagBucket | undefined> {
  return (await getTagBuckets()).find((b) => b.tag === tag);
}
