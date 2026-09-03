import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { SITE } from '../consts';
import { excerpt } from '../lib/excerpt';

export async function GET(context: APIContext) {
  const articles = (await getCollection('articles', (e) => !e.data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  return rss({
    title: `${SITE.title} · ${SITE.slogan}`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: articles.map((e) => ({
      title: e.data.title,
      pubDate: e.data.date,
      description: excerpt(e.body ?? '', 200),
      link: `/${e.data.category}/${e.id}/`,
      categories: e.data.tags,
    })),
    customData: `<language>zh-Hans</language>`,
  });
}
