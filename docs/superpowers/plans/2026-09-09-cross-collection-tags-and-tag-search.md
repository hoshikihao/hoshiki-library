# 跨集合标签 + 标签搜索 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让「标签」在站内搜索里作为独立结果直接出现,给全部标签页加过滤框,并把标签系统打通文章/书籍/影视三类内容。

**Architecture:** 新增 `src/lib/tags.ts` 作为唯一的跨集合标签统计层,`/tags`、`/tags/[tag]`、`/search` 三处共用。`books` / `films` 的 content schema 加可选 `tags` 字段。搜索页顶部的「相关标签」区是构建时内联标签清单 + 纯前端子串匹配,不碰 Pagefind。

**Tech Stack:** Astro 7(`output: 'static'`)、Astro Content Collections + Zod、Pagefind(不改动)、原生 DOM 脚本(无前端框架)。

**Spec:** `docs/superpowers/specs/2026-09-09-cross-collection-tags-and-tag-search-design.md`

## Global Constraints

- 不引入前端框架(React / Vue / Svelte 等),不引入 SSR / adapter。
- 不新增第三方依赖(含测试框架)。本项目无单元测试,验证靠 `npm run build` + `npm run preview` + 浏览器检查。
- 客户端 JS 克制,渐进增强:无 JS 时页面主要内容仍可读。
- 图标统一用 `astro-icon`(`import { Icon } from 'astro-icon/components'`),不手画 SVG。
- 命名:变量 / 函数英文,注释中文。栏目 slug 固定 `gumu` / `xinzhi` / `shixing` / `books` / `films`。
- Kami 页面(含 `/tags`、`/search`)视觉走 `src/styles/tokens.css` 全局默认值,不改这份文件。
- 日期显示用 `src/lib/date.ts` 的 `ymd()`,不要 `toISOString`。
- 较大结构改动在 git worktree 内完成、本地验证过再合并 `main`。
- 每个 Task 结束时 `npm run build` 必须通过且生成 `dist/pagefind/`。

---

## File Structure

| 文件 | 职责 | 动作 |
| --- | --- | --- |
| `src/content.config.ts` | books / films schema 加 `tags` 字段 | Modify |
| `src/data/books.yaml` | 头部字段注释补 `tags` | Modify |
| `src/data/films.yaml` | 头部字段注释补 `tags` | Modify |
| `AGENTS.md` | 「书籍字段」「影视字段」两节补 `tags` | Modify |
| `src/lib/tags.ts` | 唯一的跨集合标签统计层 | Create |
| `src/pages/tags/index.astro` | 标签云用 `getTagBuckets()`;加过滤框 | Modify |
| `src/pages/tags/[tag].astro` | `getStaticPaths` 用 helper;渲染文章/书/影视三段 | Modify |
| `src/pages/search.astro` | 顶部「相关标签」区 + 构建时内联标签清单 | Modify |

任务顺序:Task 1(schema + 文档)→ Task 2(数据层 + 两个 tags 页面)→ Task 3(`/tags` 过滤框)→ Task 4(`/search` 相关标签区)。Task 2 依赖 Task 1;Task 3、Task 4 依赖 Task 2;Task 3 与 Task 4 之间无依赖。

---

### Task 1: books / films schema 加 `tags` 字段

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/data/books.yaml`(仅头部注释)
- Modify: `src/data/films.yaml`(仅头部注释)
- Modify: `AGENTS.md`(「书籍字段」「影视字段」两节)

**Interfaces:**
- Consumes: 无
- Produces: `CollectionEntry<'books'>['data'].tags: string[]` 与 `CollectionEntry<'films'>['data'].tags: string[]`,未在 YAML 中声明时为 `[]`。

- [ ] **Step 1: 给 books schema 加 `tags`**

`src/content.config.ts`,`books` collection 的 schema(当前第 27–33 行 `z.object({...})`),把注释和字段改成:

```ts
// 书籍：src/data/books.yaml，顶层为 id -> 书 的映射
const books = defineCollection({
  loader: file('./src/data/books.yaml'),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    cover: z.string(), // /covers/xxx.jpg 或远程 URL
    status: z.enum(['reading', 'read', 'want']),
    note: z.string(), // 一句话短评
    tags: z.array(z.string()).default([]), // 可选，主题标签，与文章标签共用 /tags 聚合
  }),
});
```

- [ ] **Step 2: 给 films schema 加 `tags`**

同文件 `films` collection：

```ts
// 影视：src/data/films.yaml，按类型分组（不追踪观看状态）
const films = defineCollection({
  loader: file('./src/data/films.yaml'),
  schema: z.object({
    title: z.string(),
    director: z.string(),
    poster: z.string(), // /posters/xxx.jpg 或远程 URL
    type: z.enum(['anime', 'series', 'movie', 'doc']),
    note: z.string(), // 一句话短评
    tags: z.array(z.string()).default([]), // 可选，主题标签，与文章标签共用 /tags 聚合
  }),
});
```

- [ ] **Step 3: 更新 books.yaml / films.yaml 头部注释**

`src/data/books.yaml` 第 2 行改为:

```yaml
# 字段：title / author / cover / status(reading|read|want) / note / tags（可选，字符串数组）
```

`src/data/films.yaml` 第 2 行改为:

```yaml
# 字段：title / director / poster / type(anime|series|movie|doc) / note / tags（可选，字符串数组）
```

不给现有条目加 `tags` 键。

- [ ] **Step 4: 更新 AGENTS.md**

「## 书籍字段」节,在 `- title` `author` `cover` `status` `note` 全部必填 那条之后加一行:

```markdown
- `tags` 可选,字符串数组,与文章标签共用 `/tags` 聚合页
```

「## 影视字段」节同样加一行:

```markdown
- `tags` 可选,字符串数组,与文章标签共用 `/tags` 聚合页
```

- [ ] **Step 5: 构建验证**

Run: `npm run build`
Expected: 退出码 0;`dist/pagefind/` 存在;无 Zod schema 报错。现有页面(`/books`、`/films`、`/tags`)照常生成。

- [ ] **Step 6: Commit**

```bash
git add src/content.config.ts src/data/books.yaml src/data/films.yaml AGENTS.md
git commit -m "feat: books/films schema 加可选 tags 字段"
```

---

### Task 2: 跨集合标签数据层 + 两个 tags 页面

**Files:**
- Create: `src/lib/tags.ts`
- Modify: `src/pages/tags/index.astro`
- Modify: `src/pages/tags/[tag].astro`
- 临时改动(验证用,步骤内回退): `src/data/books.yaml`、`src/data/films.yaml`

**Interfaces:**
- Consumes: Task 1 的 `books.data.tags` / `films.data.tags`
- Produces:
  - `getTagBuckets(): Promise<TagBucket[]>` — 全部标签,按 `total` 倒序、同数按 `tag.localeCompare(other, 'zh')`
  - `getTagBucket(tag: string): Promise<TagBucket | undefined>`
  - `interface TagBucket { tag: string; articles: CollectionEntry<'articles'>[]; books: CollectionEntry<'books'>[]; films: CollectionEntry<'films'>[]; total: number }`
  - `bucket.articles` 按 `data.date` 倒序;`bucket.books` / `bucket.films` 保持 YAML 声明顺序

- [ ] **Step 1: 写 `src/lib/tags.ts`**

```ts
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
```

- [ ] **Step 2: 改写 `src/pages/tags/index.astro` frontmatter**

把当前 frontmatter(第 1–13 行)替换为:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getTagBuckets } from '../../lib/tags';

const buckets = await getTagBuckets();
---
```

模板里的循环改用 `buckets`:

```astro
    <ul class="tag-cloud">
      {
        buckets.map((b) => (
          <li>
            <a class="tag" href={`/tags/${encodeURIComponent(b.tag)}`}>
              {b.tag} <span class="tag-cloud__n">{b.total}</span>
            </a>
          </li>
        ))
      }
    </ul>
```

`<p class="meta">共 {tags.length} 个标签</p>` 改为 `共 {buckets.length} 个标签`。本步不加过滤框(Task 3)。

- [ ] **Step 3: 改写 `src/pages/tags/[tag].astro`**

整文件替换为:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ArticleCard from '../../components/ArticleCard.astro';
import BookShelf from '../../components/BookShelf.astro';
import FilmShelf from '../../components/FilmShelf.astro';
import { getTagBuckets } from '../../lib/tags';

export async function getStaticPaths() {
  const buckets = await getTagBuckets();
  return buckets.map((b) => ({ params: { tag: b.tag }, props: { bucket: b } }));
}

const { bucket } = Astro.props;
---

<BaseLayout
  title={`标签：${bucket.tag}`}
  description={`标签「${bucket.tag}」下的 ${bucket.total} 项内容。`}
>
  <div class="page stack">
    <header>
      <p class="meta"><a href="/tags">← 全部标签</a></p>
      <h1>#{bucket.tag}</h1>
      <p class="meta">共 {bucket.total} 项</p>
    </header>

    {
      bucket.articles.length > 0 && (
        <section class="tag-group">
          <h2 class="tag-group__heading">文章</h2>
          <div>
            {bucket.articles.map((e) => (
              <ArticleCard id={e.id} data={e.data} body={e.body ?? ''} showCategory />
            ))}
          </div>
        </section>
      )
    }

    {
      bucket.books.length > 0 && (
        <section class="tag-group">
          <h2 class="tag-group__heading">书</h2>
          <BookShelf books={bucket.books} />
        </section>
      )
    }

    {
      bucket.films.length > 0 && (
        <section class="tag-group">
          <h2 class="tag-group__heading">影视</h2>
          <FilmShelf films={bucket.films} />
        </section>
      )
    }
  </div>
</BaseLayout>

<style>
  .tag-group + .tag-group {
    margin-top: var(--s-12);
  }
  .tag-group__heading {
    font-size: var(--fs-h3);
    margin-bottom: var(--s-4);
    color: var(--c-ink-faint);
  }
</style>
```

- [ ] **Step 4: 构建验证(纯文章,回归)**

Run: `npm run build`
Expected: 退出码 0。`dist/tags/index.html` 存在;抽查 `dist/tags/%E6%9C%AD%E8%AE%B0/index.html`(标签「札记」)存在且含多张文章卡片。所有标签页因 books/films 尚无 `tags`,只渲染「文章」一段。

- [ ] **Step 5: 临时加标签,验证书 / 影视段**

`src/data/books.yaml` 给 `wan-li`(万历十五年)条目加一行 `  tags: [札记]`。
`src/data/films.yaml` 给 `san_ti`(三体)条目加一行 `  tags: [札记]`。

Run: `npm run build && npm run preview`
用浏览器打开 `http://localhost:4321/tags/%E6%9C%AD%E8%AE%B0`:
Expected: 页面依次出现「文章」段(多张卡)、「书」段(BookShelf,含「在读」小分组 + 《万历十五年》卡)、「影视」段(FilmShelf,含「剧集」小分组 + 《三体》卡)。顶部计数为「共 N 项」,N = 文章数 + 2。

- [ ] **Step 6: 回退临时改动**

从 `src/data/books.yaml`、`src/data/films.yaml` 删掉 Step 5 加的两行 `tags: [札记]`。

Run: `git diff --stat src/data/`
Expected: 无输出(两个 YAML 回到 Task 1 提交后的状态)。

- [ ] **Step 7: Commit**

```bash
git add src/lib/tags.ts src/pages/tags/index.astro src/pages/tags/\[tag\].astro
git commit -m "feat: 标签聚合打通文章/书籍/影视三类内容"
```

---

### Task 3: `/tags` 全部标签页加过滤框

**Files:**
- Modify: `src/pages/tags/index.astro`

**Interfaces:**
- Consumes: Task 2 的 `/tags` 页面结构(`.tag-cloud` 下每个 `<li>` 内一个 `<a class="tag">`,`<a>` 内含标签名文本 + `<span class="tag-cloud__n">` 计数)
- Produces: 无(页面自包含)

- [ ] **Step 1: 加过滤框 DOM 与计数 id**

`src/pages/tags/index.astro` 模板,把 `<header>` 与 `<ul class="tag-cloud">` 之间改成:

```astro
    <header>
      <h1>标签</h1>
      <p class="meta"><span id="tag-count">{buckets.length}</span> 个标签</p>
    </header>

    <input
      type="search"
      id="tag-filter"
      class="tag-filter"
      placeholder="筛选标签…"
      autocomplete="off"
      hidden
    />
```

(原来的 `共 {buckets.length} 个标签` 拆成 `<span id="tag-count">` + ` 个标签`,方便脚本改数字。)

- [ ] **Step 2: 加过滤脚本**

在 `</BaseLayout>` 之后、`<style>` 之前加:

```astro
<script>
  const input = document.querySelector<HTMLInputElement>('#tag-filter');
  const count = document.querySelector<HTMLElement>('#tag-count');
  const items = [...document.querySelectorAll<HTMLLIElement>('.tag-cloud li')];

  if (input && count && items.length) {
    input.hidden = false;
    const total = items.length;

    // 标签名 = <a> 文本去掉计数 <span> 的内容
    const nameOf = (li: HTMLLIElement) => {
      const a = li.querySelector('a')!;
      const n = a.querySelector('.tag-cloud__n')?.textContent ?? '';
      return a.textContent!.replace(n, '').trim().toLowerCase();
    };
    const names = items.map(nameOf);

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      items.forEach((li, i) => {
        const hit = !q || names[i].includes(q);
        li.hidden = !hit;
        if (hit) shown++;
      });
      count.textContent = String(q ? shown : total);
    });
  }
</script>
```

- [ ] **Step 3: 加过滤框样式**

该页 `<style>` 块内追加(参照 `src/components/SearchBox.astro` 的 `.search input`):

```css
  .tag-filter {
    width: 100%;
    max-width: 22rem;
    padding: var(--s-3) var(--s-4);
    font-family: var(--font-serif);
    font-size: var(--fs-body);
    color: var(--c-ink);
    background: var(--c-surface);
    border: 1px solid var(--c-line);
    border-radius: var(--radius-sm);
  }
  .tag-filter:focus {
    outline: 2px solid var(--c-accent-weak);
    border-color: var(--c-accent);
  }
```

- [ ] **Step 4: 构建 + 预览验证**

Run: `npm run build && npm run preview`
用浏览器打开 `http://localhost:4321/tags`:
Expected:
- 过滤框出现在计数下方。
- 输入「诗」→ 只保留标签名含「诗」的项(如「现代诗」「新诗」「古诗词」「散文诗」「诗」),计数变为可见条数。
- 清空输入 → 全部标签恢复,计数回到总数。
- 用 `read_page` 或查看 `dist/tags/index.html`:`<input id="tag-filter" ... hidden>` 在静态 HTML 里带 `hidden` 属性(无 JS 时不显示,标签云完整可读)。

- [ ] **Step 5: Commit**

```bash
git add src/pages/tags/index.astro
git commit -m "feat: 全部标签页加实时过滤框"
```

---

### Task 4: `/search` 顶部「相关标签」区

**Files:**
- Modify: `src/pages/search.astro`

**Interfaces:**
- Consumes: Task 2 的 `getTagBuckets()`
- Produces: 无(页面自包含)

- [ ] **Step 1: frontmatter 内联标签清单**

`src/pages/search.astro` frontmatter(当前第 1–3 行)改为:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getTagBuckets } from '../lib/tags';

const tagList = (await getTagBuckets()).map((b) => ({ name: b.tag, count: b.total }));
---
```

- [ ] **Step 2: 加「相关标签」DOM**

模板里 `<div id="search" data-pagefind-ignore></div>` 之前插入:

```astro
    <section class="tag-hits" hidden aria-label="相关标签">
      <p class="tag-hits__label">相关标签</p>
      <ul class="tag-hits__list"></ul>
    </section>
```

- [ ] **Step 3: 加渲染脚本**

在现有 `<script is:inline src="/pagefind/pagefind-ui.js"></script>` 之后、现有 `<script is:inline>` IIFE 之前,加一段独立脚本:

```astro
<script is:inline define:vars={{ tagList }}>
  (() => {
    const section = document.querySelector('.tag-hits');
    const list = document.querySelector('.tag-hits__list');
    if (!section || !list) return;

    const render = (raw) => {
      const q = (raw || '').trim().toLowerCase();
      const hits = q
        ? tagList.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 12)
        : [];
      if (!hits.length) {
        section.hidden = true;
        list.innerHTML = '';
        return;
      }
      list.innerHTML = hits
        .map(
          (t) =>
            `<li><a class="tag" href="/tags/${encodeURIComponent(t.name)}">#${t.name} <span class="tag-hits__n">${t.count}</span></a></li>`,
        )
        .join('');
      section.hidden = false;
    };

    // 初始：URL 的 ?q=
    render(new URLSearchParams(location.search).get('q') || '');

    // Pagefind 输入框出现后跟随其内容刷新（dev 下无此输入框，仅吃 ?q=）
    let timer;
    const bind = () => {
      const el = document.querySelector('#search input');
      if (!el) return false;
      el.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => render(el.value), 120);
      });
      return true;
    };
    if (!bind()) {
      let tries = 0;
      const iv = setInterval(() => {
        if (bind() || ++tries > 40) clearInterval(iv);
      }, 100);
    }
  })();
</script>
```

- [ ] **Step 4: 加样式**

`<style is:global>` 块之外新增一个页面级 `<style>`(参照 `src/pages/[category]/[slug].astro` 的 `.article__tags`):

```astro
<style>
  .tag-hits {
    margin-bottom: var(--s-8);
  }
  .tag-hits__label {
    margin: 0 0 var(--s-3);
    font-size: var(--fs-label);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--c-ink-faint);
  }
  .tag-hits__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-2);
  }
  .tag-hits__n {
    color: var(--c-ink-faint);
  }
</style>
```

- [ ] **Step 5: 构建 + 预览验证**

Run: `npm run build && npm run preview`
浏览器打开 `http://localhost:4321/search?q=小说`:
Expected:
- 顶部「相关标签」区出现,含 `#小说 4`(数字为该标签 total)。
- 点 `#小说` → 跳到 `/tags/小说`,列出「文章」段全部相关文章。
- 下方 `#search` 里 Pagefind 照常返回正文含「小说」的文章结果。
- 在 Pagefind 输入框把内容改成「诗」→ 约 0.1s 后「相关标签」区刷新为含「诗」的标签;改成「zzz」→ 整个区隐藏。

- [ ] **Step 6: dev 模式验证(附带收益)**

Run: `npm run dev`
浏览器打开 `http://localhost:4321/search?q=小说`:
Expected: `#search` 区显示 Pagefind 不可用提示,但顶部「相关标签」区仍显示 `#小说`,无控制台报错。

- [ ] **Step 7: Commit**

```bash
git add src/pages/search.astro
git commit -m "feat: 搜索页顶部加「相关标签」区"
```

---

## Self-Review

**1. Spec coverage**

| Spec 组件 | 对应 Task |
| --- | --- |
| 1. 数据层 `src/lib/tags.ts` | Task 2 Step 1 |
| 2. schema 加 `tags` + 文档同步(content.config / yaml / AGENTS) | Task 1 全部步骤 |
| 3. `/tags/[tag]` 三段渲染,复用 ArticleCard / BookShelf / FilmShelf,「共 N 项」 | Task 2 Step 3 |
| 4. `/tags` 过滤框,默认 hidden + JS 显形,更新计数 | Task 3 全部步骤 |
| 5. `/search` 相关标签区:define:vars 内联、读 ?q=、Pagefind 输入联动、上限 12、无匹配隐藏、dev 不报错 | Task 4 全部步骤 |
| 非目标:不碰 Pagefind 配置 / RSS / sitemap / 视觉 token / 首页 | 无 Task 触及这些文件 |
| 边界:books/films 全未加标签时行为不变 | Task 2 Step 4 验证 |
| 验证:build + preview + dev 三条 | 各 Task 的验证步骤 + Task 4 Step 6 |

无遗漏。

**2. Placeholder scan**

各步骤均含实际代码或实际命令 + 期望输出。无 TBD / TODO / "类似 Task N" / "加适当错误处理"。

**3. Type consistency**

- `TagBucket` 字段名(`tag` / `articles` / `books` / `films` / `total`)在 Task 2 定义,Task 2 Step 2–3、Task 4 Step 1 使用一致。
- `getTagBuckets()` 返回 `TagBucket[]`;`/tags/index` 用 `buckets`,`/tags/[tag]` 的 `getStaticPaths` 用 `b.tag` 作 `params.tag`、`bucket` 作 prop,一致。
- `/search` 的 `tagList` 元素形状 `{ name, count }` 在 Task 4 Step 1 定义,Step 3 脚本按此消费。
- DOM 契约:Task 3 脚本依赖的 `.tag-cloud li` / `.tag-cloud__n` 与 Task 2 Step 2 模板一致;Task 4 脚本依赖的 `.tag-hits` / `.tag-hits__list` / `#search input` 与 Task 4 Step 2 及既有 Pagefind 挂载点一致。

无冲突。
