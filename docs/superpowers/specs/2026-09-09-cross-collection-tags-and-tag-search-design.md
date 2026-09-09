# 跨集合标签 + 标签搜索 — 设计

## 背景与问题

- 全站搜索只有一个入口:首页及各处搜索框都跳到 `/search?q=`,由 Pagefind 做全文检索。
- `data-pagefind-body` 只加在文章正文和书林/光影书架容器上。Pagefind 的规则是:一旦站内出现 `data-pagefind-body`,就只索引带该标记的页面。因此 `/tags/*` 页面未进索引,搜「小说」只能命中正文里出现的「小说」二字,搜不到「小说」这个标签本身。
- `/tags/[tag]` 页面已存在且可用(列出该标签下全部文章),但只能间接抵达(搜到文章 → 打开 → 文末标签链接 → 标签页);搜索结果里不会把标签本身作为一条结果直接列出。
- `/tags` 全部标签页有 121 个标签,平铺无过滤,只能逐个找。
- 标签目前只从 `articles` 的 frontmatter 统计。`books` / `films` 的 schema 无 `tags` 字段,书林、光影两栏未来填内容后也要加标签。

## 目标

1. 在 `/search` 搜标签词时,把匹配的标签作为独立结果呈现,点击进入该标签的聚合页。
2. `/tags` 全部标签页加过滤框,按标签名实时筛选。
3. 标签系统打通文章、书籍、影视三类内容:`/tags/[tag]` 能同时列出三类,标签云统计三类。

## 非目标

- 不改 Pagefind 配置、索引范围、UI 主题变量。
- 不改 RSS、sitemap、各栏目视觉 token、首页布局。
- 不给现有 7 条 books/films 占位数据补标签(留待日后填真实内容时按需加)。
- 不新建 `/books/[id]` `/films/[id]` 详情页。

## 方案

### 组件 1:跨集合标签数据层 `src/lib/tags.ts`（新文件）

单一职责:把三个集合的标签汇总成一份结构,供 `/tags`、`/tags/[tag]`、`/search` 复用。

导出:

```ts
export interface TagBucket {
  tag: string;
  articles: CollectionEntry<'articles'>[]; // 已按 date 倒序
  books: CollectionEntry<'books'>[];
  films: CollectionEntry<'films'>[];
  total: number; // articles + books + films 条数
}

// 全部标签，按 total 倒序、同数按 localeCompare('zh')
export async function getTagBuckets(): Promise<TagBucket[]>;

// 单个标签；不存在返回 undefined
export async function getTagBucket(tag: string): Promise<TagBucket | undefined>;
```

实现要点:

- 内部 `getCollection('articles', (e) => !e.data.draft)`、`getCollection('books')`、`getCollection('films')`。
- 文章列表按 `b.data.date.valueOf() - a.data.date.valueOf()` 倒序;books/films 保持 YAML 中的声明顺序。
- `books` / `films` 的 `data.tags` 在 schema 里 `.default([])`,可直接 `for...of`。
- `getTagBucket` 复用 `getTagBuckets` 的结果做查找,避免两套统计逻辑。

### 组件 2:schema 加 `tags` 字段（数据格式变更）

`src/content.config.ts`:`books`、`films` 两个 collection 的 schema 各加

```ts
tags: z.array(z.string()).default([]),
```

同步更新的说明性文字(先改文档、再改实践):

- `src/content.config.ts` 内 books/films 的注释,补 `tags` 字段。
- `src/data/books.yaml` 头部字段注释:`# 字段：title / author / cover / status(...) / note / tags(可选，字符串数组)`。
- `src/data/films.yaml` 头部字段注释同理。
- `AGENTS.md`「书籍字段」节:`tags` 列为可选字段,字符串数组,用途同文章标签。
- `AGENTS.md`「影视字段」节同理。

现有 7 条 YAML 数据不加 `tags` 键,靠 `.default([])` 落为空数组。

### 组件 3:`/tags/[tag].astro` 列出三类内容

`getStaticPaths` 改用 `getTagBuckets()`,为每个 bucket 生成一条路径,props 传整个 bucket。

页面渲染:按 `bucket.articles` / `bucket.books` / `bucket.films` 非空与否,依次渲染最多三段。每段一个小标题(`文章` / `书` / `影视`),下面:

- 文章段:沿用 `ArticleCard`(`showCategory` 传 `true`)。
- 书段:复用 `BookShelf`,`books={bucket.books}`。
- 影视段:复用 `FilmShelf`,`films={bucket.films}`。

复用 `BookShelf` / `FilmShelf` 会带上它们内部的「在读/读完/想读」「动漫/剧集/电影/纪录片」小分组标题。在标签聚合页保留这层分组是可接受的(信息量正向),不为此另写卡片组件。

`header` 的「共 N 篇」改为「共 {bucket.total} 项」(混合三类,用「项」)。页面标题 / description 里的数量同步用 `total`。

### 组件 4:`/tags/index.astro` 加过滤框

`getCollection` + 手工统计改为 `getTagBuckets()`,`n` 用 `bucket.total`。

DOM 结构在 `<ul class="tag-cloud">` 上方加一个输入框,默认 `hidden`:

```html
<input type="search" class="tag-filter" placeholder="筛选标签…" hidden autocomplete="off" />
```

页面内 `<script>`(非 inline,走 Astro 打包):

- 拿到 input、全部 `<li>`、计数节点。
- `input.hidden = false` 显形(渐进增强:无 JS 时输入框不出现,完整列表照常渲染可读)。
- `input` 事件:取 `value.trim().toLowerCase()`,对每个 `<li>` 取其 `<a>` 的标签文本(去掉计数 `<span>` 的数字),`textContent.includes(q)` 决定 `li.hidden`。
- 更新计数节点为当前可见条数;空查询时恢复「共 N 个标签」。

样式:`.tag-filter` 复用现有输入框视觉(参照 `SearchBox.astro` 的 `.search input` 与 `:focus`),放进该页 `<style>`。

### 组件 5:`/search.astro` 顶部「相关标签」区

**数据注入**:frontmatter 调 `getTagBuckets()`,映射成 `const tagList = buckets.map(b => ({ name: b.tag, count: b.total }))`,通过 `define:vars` 传进一段 inline script。清单约 121 条 `{name, count}`,体积可忽略,构建时内联,不发额外请求、不依赖 Pagefind。

**DOM**:`#search` 容器上方加

```html
<section class="tag-hits" hidden aria-label="相关标签">
  <p class="tag-hits__label">相关标签</p>
  <ul class="tag-hits__list"></ul>
</section>
```

**脚本**(`<script is:inline define:vars={{ tagList }}>`):

- `render(q)`:`q` 为空 → `section.hidden = true`;否则按 `name.toLowerCase().includes(q.toLowerCase())` 过滤,最多取前若干条(上限 12,避免刷屏),渲染成 `<li><a href="/tags/{encodeURIComponent(name)}">#{name} <span>{count}</span></a></li>`;命中 0 条也隐藏整个 section。
- 初始:读 `new URLSearchParams(location.search).get('q')`,调 `render`。
- 与 Pagefind 联动:在现有 `start()` 里 `new PagefindUI(...)` 之后,`document.querySelector('#search input')` 若存在则挂 `input` 监听,防抖(约 120ms)后 `render(inputEl.value)`。`dev` 下无 Pagefind、无该输入框,只走初始 `?q=` 分支,不报错。

**样式**:该页 `<style>` 内加 `.tag-hits` 相关规则,胶囊风格参考 `[category]/[slug].astro` 里 `.article__tags .tag` 的现有样式,与 Kami 主题一致。

## 数据流

```
content.config.ts (schema: articles.tags / books.tags / films.tags)
        │
        ▼
src/lib/tags.ts  getTagBuckets() ──┬─→ /tags/index.astro     标签云 + 过滤框
                                    ├─→ /tags/[tag].astro     三段聚合 (Article/Book/Film Shelf)
                                    └─→ /search.astro         define:vars → inline script → 「相关标签」区
```

搜索页运行时:

```
进入 /search?q=小说
  ├─ inline script: render('小说') → 「相关标签」区显示 #小说
  └─ Pagefind: 全文检索「小说」→ #search 内文章结果
用户在 Pagefind 输入框继续打字
  └─ input 监听 → 防抖 → render(新值) → 「相关标签」区刷新
```

## 错误处理与边界

- 某标签只属于一类内容:另两段不渲染。
- books/films 全部未加标签:`getTagBuckets` 结果与当前纯文章版一致,`/tags` 与 `/tags/[tag]` 行为不变。
- `/search` inline script 里 `tagList` 为空数组:`render` 永远隐藏 section,无副作用。
- 标签名含特殊字符:链接一律 `encodeURIComponent`,`getStaticPaths` 的 `params.tag` 传原始串(Astro 自行编码),与现状一致。
- 无 JS:`/tags` 过滤框不出现,完整标签云可读;`/search` 依赖 JS(现状即如此),「相关标签」区保持 `hidden`。

## 测试与验证

worktree 内开发,合并 `main` 前:

1. `npm run build` 通过,生成 `dist/pagefind/`。
2. `npm run preview`:
   - `/tags` — 过滤框出现,输入「诗」只留含「诗」的标签,计数同步;清空恢复。
   - `/tags/小说` — 文章段正常;临时给一条 books.yaml / films.yaml 加 `tags: [小说]` 验证书/影视段渲染与 Shelf 分组,验证后回退。
   - `/search?q=小说` — 顶部「相关标签」出现 `#小说`,点击进 `/tags/小说`;下方 Pagefind 文章结果照常。
   - 在搜索框改字为「诗」,「相关标签」区跟随刷新。
   - `/rss.xml`、`/sitemap-index.xml` 正常,标签页在 sitemap 中。
3. `npm run dev` 下打开 `/search?q=小说`:Pagefind 提示不可用,但「相关标签」区仍显示 `#小说`(附带收益,验证不依赖 Pagefind)。

若某步无法执行,说明未跑什么、为什么、剩余风险。
