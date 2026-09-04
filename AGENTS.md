# 星树文库 — 项目规则

## 项目

- 站点:星树文库,读书与好文库,公开站,域名 `read.hoshikihao.com`
- 技术:Astro 静态站(`output: 'static'`),Cloudflare Workers(静态资源托管)部署
- 仓库:`github.com/hoshikihao/hoshiki-library`(public)
- Slogan:星树文库 · 甄选天下好文好书

## 技术约束

- 不引入前端框架(React / Vue / Svelte 等)
- 不引入 SSR / adapter,保持纯静态
- 新增依赖前按用户全局规则先说明用途、风险、替代方案并等确认
- 客户端 JS 仅允许 Pagefind 搜索

## 目录

- 文章:`src/content/articles/<slug>.md`,一篇一个文件
- 书籍:`src/data/books.yaml`,全部集中一个文件
- 书籍封面:`public/covers/`,或用远程 URL
- 首页门户图等大图资源:`src/assets/`
- 设计 token:`src/styles/tokens.css`,全局样式:`src/styles/global.css`

## 文章 frontmatter

- `title` 必填
- `category` 必填,取值 `gumu` | `xinzhi` | `shixing`
- `tags` 必填,字符串数组
- `date` 必填,收录日期(非原文发表日期)
- `sourceUrl`:`category: shixing` 时必填,其余可空
- `author` 可选
- `commentary` 可选,Markdown,渲染到文末点评块
- `draft` 可选,默认 `false`
- 正文文件只放原文,不写点评、不写摘要

## 书籍字段

`src/data/books.yaml` 顶层是 `id: {书}` 的映射,不是数组。id 用英文/拼音短横线。

- `title` `author` `cover` `status` `note` 全部必填
- `status` 取值 `reading` | `read` | `want`
- `note` 一句话短评
- `cover` 用 `/covers/xxx`(放 `public/covers/`)或远程图片 URL
- 不提供每本书的下载链接;书籍页只放 Telegram bot 入口 + 获取电子书的简短说明

## 命名

- 文章文件名:英文或拼音,短横线分隔
- 变量、函数:英文;注释:中文
- 页面路径、栏目 slug 用 `gumu` / `xinzhi` / `shixing`

## 内容维护流程

- 加文章:建 `src/content/articles/<slug>.md` → 填 frontmatter → 粘正文 → 可选写 `commentary`
- 加书:`src/data/books.yaml` 追加一条
- push 到 `main` 即触发 Cloudflare Workers Builds 构建部署

## 部署

- Cloudflare Workers,静态资源模式,配置见 `wrangler.jsonc`(`assets.directory: ./dist`,无 Worker 代码)
- CI:Cloudflare Workers Builds 连 GitHub,build command `npm run build`,deploy command `npx wrangler deploy`
- 本地手动部署:`npm run deploy`(需先 `wrangler login`)
- 以后要 SSR / API:装 `@astrojs/cloudflare`,`wrangler.jsonc` 加 `main` 指向 Worker 入口,`astro.config` 改 `output: 'server'`

## 开发与验证

- 本地开发:`npm run dev`(端口 4321)。搜索(Pagefind)在 dev 下不可用
- 改动后跑 `npm run build`,必须通过且生成 `dist/pagefind/`
- `npm run preview` 检查受影响页面、搜索、`/rss.xml`、`/sitemap-index.xml`
- 不跑验证时说明未跑什么、为什么、剩余风险
- 搜索索引依赖页面上的 `data-pagefind-body`(文章正文、书架容器已加)

## 字体

- 中文正文用霞鹜文楷(LXGW WenKai,OFL,免费可商用),经 ZeoSeven CDN 加载,见 `BaseLayout.astro`
- 字体栈变量在 `src/styles/tokens.css`;换字体只改 `--font-serif-cjk` + 视情况加 `@font-face`

## 待办(上线前处理)

- 占位内容替换:`sample-shixing.md` 假 sourceUrl、`consts.ts` 的 `BOOK_BOT.url`(真实 bot)、`about.md` 联系方式、书籍封面(现为占位 SVG)
