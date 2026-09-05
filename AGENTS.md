# 星树文库 — 项目规则

## 项目

- 站点:星树文库,读书、观影与好文库,公开站,域名 `read.hoshikihao.com`
- 技术:Astro 静态站(`output: 'static'`),Cloudflare Workers(静态资源托管)部署
- 仓库:`github.com/hoshikihao/hoshiki-library`(public)
- 五个栏目:古木(古文)/ 新枝(随笔)/ 星雨(时文选粹)/ 书林(书籍)/ 光影(影视)
- Slogan:星树文库 · 甄选天下好文好书

## 技术约束

- 不引入前端框架(React / Vue / Svelte 等)
- 不引入 SSR / adapter,保持纯静态
- 新增依赖前按用户全局规则先说明用途、风险、替代方案并等确认
- 客户端 JS 克制:只写原生小脚本,无 JS 时页面主要内容仍可读(渐进增强);用于 Pagefind 搜索、书林/光影页筛选、首页日签轮换

## 视觉:全站 Kami + 各栏目独立主题

- 古木 / 新枝 / 星雨 / 关于 / 搜索:统一走 Kami Parchment(暖米白、霞鹜文楷、靛蓝强调),定义在 `src/styles/tokens.css`,不要改这份全局默认值
- 首页、书林、光影三页各有独立视觉,做法是给 `BaseLayout` 传 `bodyClass`,再在页面内用 `<style is:global>` 针对 `body.<class>` 覆盖设计 token(`--c-canvas` `--c-accent` `--font-serif-*` 等),只在该页生效,不污染别处
  - 首页:`bodyClass="google-home"`,Google 首页风(白底、多色马卡龙入口、呼吸感、色斑背景)
  - 书林:`bodyClass="readwise-books"`,Readwise 风(白底、珊瑚橙 `#ff5a36`、无衬线、卡片式书目)
  - 光影:`bodyClass="bilibili-films"`,bilibili 风(白底、粉色 `#fb7299`、圆润海报卡、悬停放大)
- 新增/调整某一栏目的视觉,只改该页面自己的 token 覆盖块,不要动 `tokens.css`

## 布局:粘性页脚(footer 贴底)

- 机制(定义在 `global.css`,不要改):`body`(`display:flex;flex-direction:column;min-height:100vh`)→ `main`(`flex:1 0 auto;display:flex;flex-direction:column`)。内容矮于视口时 `main` 撑满剩余空间、页脚贴视口底部;内容超出视口时正常滚动。
- 某页面根节点想撑满 `main` 的可用高度(比如首页色斑背景要通到页脚),在该节点上写 `flex: 1`,**不要**用 `min-height: calc(100vh - 若干px)` 这类估算值——header/footer 实际高度一变,估算值就和视口对不上,会在页脚前留出一段空白(踩过这个坑)。
- `Footer.astro` 本身不要加 `margin-top` 之类外边距,间距靠自己的 `padding` + `border-top`,否则会在"贴底"之外再叠加一段强制滚动距离(也踩过)。

## 图标

- 统一用 `astro-icon`(`import { Icon } from 'astro-icon/components'`),不手画 SVG path
- 品牌 logo 先查 `simple-icons:*`(如 `simple-icons:github`、`simple-icons:netflix`);通用 UI 图标用 `lucide:*`
- 两个库都没有的品牌(如 Anna's Archive、Z-Library)用语义相近的 lucide 图标代替,不要手绘凑一个近似 logo
- 构建时内联成 SVG,零客户端 JS、零运行时体积

## 目录

- 文章:`src/content/articles/<slug>.md`,一篇一个文件;正文配图放 `public/articles/<slug>/`,正文里用 `/articles/<slug>/xxx.jpg` 引用(外站图先落本地,防盗链热链加载不出)
- 书籍:`src/data/books.yaml`,全部集中一个文件;封面 `public/covers/` 或远程 URL
- 影视:`src/data/films.yaml`,结构同 books;海报 `public/posters/` 或远程 URL
- 首页日签图池:`src/assets/daily/<id>.(jpg|png|webp)`,id 对应 `src/data/daily-quotes.ts`
- 设计 token:`src/styles/tokens.css`,全局样式:`src/styles/global.css`
- 页眉头像:`src/assets/avatar.png`(星树浩本人头像,`Header.astro` 引用);原来的树形 SVG logo 组件已删除,不要再找 `StarTree.astro`

## 文章 frontmatter

- `title` 必填
- `category` 必填,取值 `gumu` | `xinzhi` | `shixing`
- `tags` 必填,字符串数组
- `date` 必填,收录日期(非原文发表日期),用于列表排序与 RSS
- `written` 可选,原文写作时间,自由文本(如「北宋嘉佑二年（1057）」);填了就替代 byline 里的「收录于 …」
- `sourceUrl`:可选,有原文链接就填(渲染成文末「读原文」按钮)
- `author` 可选
- `commentary` 可选,Markdown,渲染到文末点评块
- `related` 可选,相关阅读,`{ title, url, source? }` 数组,渲染到文末链接列表
- `draft` 可选,默认 `false`
- 正文文件只放原文,不写点评、不写摘要

## 书籍字段

`src/data/books.yaml` 顶层是 `id: {书}` 的映射,不是数组。id 用英文/拼音短横线。

- `title` `author` `cover` `status` `note` 全部必填
- `status` 取值 `reading` | `read` | `want`
- `note` 一句话短评
- 不提供每本书的下载链接;书林页顶部是 Anna's Archive / Z-Library / Telegram bot 小树 三个统一入口,不针对单本书

## 影视字段

`src/data/films.yaml` 结构同 books.yaml,顶层 `id: {片}` 映射。

- `title` `director` `poster` `type` `note` 全部必填
- `type` 取值 `anime` | `series` | `movie` | `doc`,按类型分组(不追踪观看进度)

## 首页日签

- `src/data/daily-quotes.ts`:`{ id, quote }` 数组,是一个池子
- `id` 对应 `src/assets/daily/` 下的图片文件名(去扩展名)
- 按「今年第几天 % 池子长度」在浏览器里选今天该显示哪条,逐日自动轮换、无需重新构建;往池子里加新条目即可参与轮换
- 日签图目前用的是 Anato Finnstark 的画(`xunmeng.jpg`),未取得授权,用户知情并接受风险

## 首页顶部留白(窄屏)

`.ghome__center` 的 `margin-top` 在桌面是 `min(18vh, 160px)`,窄屏(`max-width:480px`)单独覆盖成 `var(--s-8)`——手机浏览器地址栏占掉的空间比例更大,18vh 会把标题挤得离色斑区顶部很远。**这个覆盖只改 `margin-top` 这一项**,标题字号、栏目胶囊、日签卡片尺寸都刻意保持桌面同款大小,用户明确要求过手机上不要因为屏幕矮就把这些也缩小(哪怕因此首次打开看不到页脚)。改这块之前请先确认这个前提没变。

## 命名

- 文章文件名:英文或拼音,短横线分隔
- 变量、函数:英文;注释:中文
- 页面路径、栏目 slug 用 `gumu` / `xinzhi` / `shixing` / `books` / `films`
- 首页入口的显示名与顺序:改 `consts.ts` 的 `ENTRY_LINKS`

## 内容维护流程

- 加文章:建 `src/content/articles/<slug>.md` → 填 frontmatter → 粘正文 → 可选写 `commentary`
- 加书:`src/data/books.yaml` 追加一条
- 加片:`src/data/films.yaml` 追加一条
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
- 搜索索引依赖页面上的 `data-pagefind-body`(文章正文、书林/光影的书架容器已加)
- 较大的视觉/结构改动(比如首页/书林/光影三套主题那次)在 git worktree 里做完、本地验证过再合并到 `main`;小的单文件调整直接在 `main` 上改

## 字体

- 全站默认(Kami 页面):霞鹜文楷(LXGW WenKai,OFL,免费可商用),经 ZeoSeven CDN 加载,见 `BaseLayout.astro`
- 书林页覆盖为系统无衬线(见"视觉"一节的 token 覆盖机制),首页/光影页保留默认字体
- 字体栈变量在 `src/styles/tokens.css`;换字体改 `--font-serif-cjk` / `--font-serif-latin`

## 待办(上线前处理)

- 书籍封面 / 影视海报走远程图源(NeoDB / TMDB 热链),未落本地
- 微信群入口现在是个人微信号(`hoshikihao`),等有不过期的入群方式(如永久群二维码、公众号自动回复)再换成扫码
