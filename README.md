# Butterfly (Hugo Port)

基于 [AnZhiYu Hexo 主题](https://github.com/anzhiyu-c/hexo-theme-anzhiyu) 移植的 Hugo 主题，
目标是在 Hugo 静态站点上复刻官方预览站 [blog.anheyu.com](https://blog.anheyu.com) 的观感与交互。

当前已覆盖：首页（说说条 / 顶部卡片区 / 分类导航条 / 文章卡片流 / 分页 / 侧边栏 / 页脚 / 悬浮按钮）、
分类与标签总览页、分类与标签列表页、全部文章页、文章详情页、独立页面（如 `/about/`）、
本地搜索、深浅色模式、移动端响应式。

首页顶部卡片区具体包含：随机文章 banner（背景为创意图标无限滚动带，悬停浮出「随便逛逛」遮罩）、
banner 左下角的彩色分类胶囊、右栏三列两行的推荐卡组，以及覆盖在推荐卡之上的 todayCard 大卡
（`banner.image` 留空时背景为官方的「hello」书写动画；点「更多推荐」收起大卡露出推荐卡，鼠标移出自动复原）。

> **命名约定**：原版主题的 `anzhiyufont` / `anzhiyu-icon-*` 是远程图标字体库定义的类名，为保证图标正常显示而保留；
> 其余主题自身的命名（CSS 变量、文件、配置键、品牌文案）均已统一为 `butterfly`。

## 环境要求

- Hugo **extended** ≥ 0.156（实际下限由模板里的 `hugo.Data` 写法决定，`theme.toml` 的 `min_version` 还写着 0.120.0）；
  开发与验证环境为 0.168.0
- 联网加载图标字体 CSS（可自建镜像后改 `params.iconfont_css`）
- **Hugo ≥ v0.156.0 弃用了 `.Site.Data`**：模板读取站点 `data/` 目录统一写 `hugo.Data.xxx`（写 `site.Data.xxx` 同样会报
  `WARN deprecated: .Site.Data ... Use hugo.Data instead.`），主题内已按此实现，构建应无 deprecated 告警。
  若必须停在 0.156 以下，得把 `partials/home_top.html`、`partials/essay_bar.html` 里的 `hugo.Data.*` 改回 `site.Data.*`
  （旧版本未实测）

## 快速开始

在站点根目录 `hugo.toml` 中启用主题：

```toml
theme = "butterfly"

[pagination]
# 首页为双列卡片布局，每页数量建议取偶数，避免末行留空洞
pagerSize = 10
```

启用本地搜索还需要在站点配置里声明输出格式（主题会在首页额外产出 `search.json`）：

```toml
[outputFormats]
  [outputFormats.SEARCH]
    mediaType = "application/json"
    baseName = "search"
    isPlainText = true
[outputs]
  home = ["HTML", "RSS", "SEARCH"]
```

构建与预览：

```bash
hugo server -D                    # 开发预览（含草稿），默认 http://localhost:1313
hugo server -D -p 1317            # 本仓库做像素比对取证时统一用 1317
hugo --gc --cleanDestinationDir   # 生产构建，产物在 public/
```

新增文章用 `hugo new posts/<slug>.md`。**注意** `hugo new` 优先取**站点根** `archetypes/`，只有站点没有同名模板时
才回退到主题的 `themes/butterfly/archetypes/default.md`——本仓库站点根那份是只有 `title/date/draft` 的极简模板，
想要 `cover` / `top` / `topGroup` 脚手架需把主题版本复制到站点根，或在文章里手写（字段见下文）。

生产构建应当**零 deprecated 告警**：Hugo ≥ 0.156 起模板读 `data/` 目录必须写 `hugo.Data.xxx`（见「环境要求」）。

## 页面与模板对应关系

| 页面 | 访问路径 | 模板 | 说明 |
|---|---|---|---|
| 首页 | `/` | `index.html` + `baseof.html` | 说说条 → 顶部卡片区 → 分类导航条 → 卡片流 → 分页 |
| 文章详情 | `/posts/<slug>/` | `_default/single.html` + `partials/header.html` | 顶部 banner 信息卡（原创标 / 分类 / 标签 / 标题 / 日期 / 字数 / 阅读时长，**仅在有头图时渲染**）+ 正文 + 版权声明卡 + 分类标签盒 + 相关文章；目录在侧栏 |
| 独立页面 | `/about/` 等根目录 page | `_default/single.html` | 与文章详情共用同一模板；无头图时只剩正文，但版权声明卡仍会渲染（模板未按页面类型过滤） |
| 全部文章 | `/posts/` | `_default/section.html` | 顶部「文章 N」计数 + 按**年份**分组的时间线列表（分页） |
| 分类总览 | `/categories/` | `_default/taxonomy.html` | 居中标题 + 换行的文件夹图标胶囊（按官方不加文章数） |
| 标签总览 | `/tags/` | `_default/taxonomy.html` | 居中标题 + `#` 胶囊，带文章数角标 |
| 分类列表页 | `/categories/<名称>/` | `_default/taxonomy.html` | 顶部分类条（当前项高亮）+ 卡片流 + 侧栏 |
| 标签列表页 | `/tags/<名称>/` | `_default/taxonomy.html` | 顶部标签条（当前项高亮）+ 卡片流 + 侧栏 |
| 其它列表页 | 自定义 section 的列表页 | `_default/list.html` | 带标题卡的通用卡片流 |

> Hugo 的 `_default/taxonomy.html` 会同时命中「分类/标签总览页」与「单个 term 页」，
> 因此模板内部按 `.Kind`（`taxonomy` / `term`）与 `.Data.Plural`（`categories` / `tags`）分四个分支处理，
> 修改时务必保留这层判断，否则一个分支的改动会牵连其它页面。

> **文章目录约定**：首页 feed、侧栏统计、搜索索引与相关文章均只取 `content/posts/` 下的文章
> （模板里统一用 `where site.RegularPages "Type" "posts"` 过滤），`about.md` 这类独立页不会出现在首页列表中。

## 目录结构

```
themes/butterfly/
├── layouts/
│   ├── baseof.html              # 全局骨架（body-wrap / 导航 / 主区 / 侧栏 / 页脚 / 悬浮按钮）
│   ├── index.html               # 首页（置顶排序 + 文章卡片流 + 分页）
│   ├── index.search.json        # 本地搜索索引输出模板（产出 /search.json）
│   ├── _default/
│   │   ├── list.html            # 通用列表页
│   │   ├── section.html         # 全部文章页（时间线）
│   │   ├── single.html          # 文章详情页
│   │   └── taxonomy.html        # 分类/标签总览页 + term 页（按 .Kind 分支）
│   └── partials/
│       ├── head.html            # meta / 资源 / 深浅色预初始化 / 主题配置注入
│       ├── header.html          # 顶部导航（含搜索入口、随机文章、移动端汉堡菜单）
│       ├── essay_bar.html       # 首页「即刻」说说条
│       ├── home_top.html        # 首页顶部卡片区 #home_top
│       ├── category_bar.html    # 首页与分类列表页顶部的分类导航条
│       ├── tag_bar.html         # 标签列表页顶部的标签条
│       ├── post_cards.html      # 文章卡片流 + 分页（首页 / term 页 / 列表页共用）
│       ├── post-item.html       # 单篇文章卡片
│       ├── list-body.html       # 通用列表页主体（标题卡 + 卡片流）
│       ├── aside.html           # 侧边栏卡片组（作者/公告/分类/标签/归档/站点信息/目录）
│       ├── search.html          # 本地搜索弹窗
│       ├── pagination.html      # 分页
│       ├── footer.html          # 页脚（社交条 + footer-bar）
│       ├── rightside.html       # 右下角悬浮按钮
│       └── social.html          # 社交图标
├── assets/
│   ├── css/butterfly.css        # 全站唯一样式文件，按注释分块；设计令牌复刻自原版 styl 源码
│   ├── img/
│   │   └── hello-lottie.svg     # todayCard「hello」动画终帧 SVG（由官方 lottie 离线转换，配合 CSS 书写动画）
│   └── js/
│       ├── butterfly.js         # 交互（导航/滚动百分比/深浅色/打字机/随机文章/分类条/目录/说说轮播等）
│       └── local-search.js      # 本地搜索（拉取 search.json 做前端匹配）
├── static/img/                  # 兜底与图标资源：default_cover.jpg（banner 无封面时）、404.jpg（封面 onerror）、
│                                #   friend_404.gif（头像 onerror）、siteicon/（favicon 及 apple / manifest 图标）
│                                #   loading.gif 是上游遗留，加载动画未移植故当前无引用方
├── archetypes/default.md        # 主题侧文章模板（含 cover / top / topGroup 示例）；站点根 archetypes/ 优先级更高
├── .gitignore                   # 忽略 public/、resources/_gen/、构建锁与本地覆盖配置 hugo.local.toml
├── LICENSE                      # GPL-3.0
└── theme.toml
```

## 站点配置（hugo.toml）

### 基础

| 参数 | 说明 |
|---|---|
| `title` / `locale` | 站点名 / 语言 |
| `params.author` | 作者名（侧边栏作者卡、文章版权卡） |
| `params.subtitle` / `params.description` | 副标题 / 站点描述 |
| `params.avatar` / `params.favicon` | 头像 / 站点图标 |
| `params.index_img` | 首页 Hero 大图，留空为无头图模式（原版默认） |
| `params.default_top_img` | 内页默认头图 |
| `params.iconfont_css` | 远程图标字体 CSS 地址 |
| `params.site_start_time` | 建站时间（`2006-01-02`），侧栏「运行天数」与站点信息卡据此计算；**必须写在 `[params]` 下**，站点配置顶层的同名键模板读不到 |
| `pagination.pagerSize` | 每页文章数，建议偶数 |

### 首页卡片流与封面

| 参数 | 说明 |
|---|---|
| `params.cover.index_enable` | 首页卡片是否显示封面 |
| `params.cover.position` | 封面位置 `left` / `right` / `both`（`both` 为左右交替） |
| `params.post_meta.date_type` | 卡片日期取 `created` 或 `updated` |
| `params.post_meta.date_format` | 默认 `simple`（不显示日期图标），设为其它值则显示日历 / 历史图标 |
| `params.post_meta.categories` / `tags` | 卡片是否显示分类 / 标签 |

### 首页顶部卡片区 `[params.home_top]`

| 参数 | 说明 |
|---|---|
| `enable` | 总开关 |
| `title` / `subTitle` / `siteText` | banner 卡两行大标题与底部站点名 |
| `random_btn_text` | 「随便逛逛」按钮文案（点击随机跳转文章） |
| `top_group` | 是否显示推荐文章大卡；推荐来源为 front matter 中 `topGroup: true` 的文章，无匹配时回退取最新 6 篇 |
| `[[params.home_top.category]]` | banner 卡左下角的彩色分类按钮，字段：`name` `path` `class`（`blue`/`red`/`green`/`yellow`）`icon`；`shadow` 字段当前由 CSS 按 `class` 提供，配置项保留兼容 |
| *数据* | banner 卡背景的创意图标滚动带取自**站点根目录** `data/creativity.yml` 的 `list`，每项字段 `name` `color` `icon`；`list` 缺失或为空时不渲染该图标带 |
| `[params.home_top.banner]` | todayCard 大卡：`tips` `title` `image` `link`。`image` **留空**时背景为官方的「hello」书写动画（渐变底 + 彩虹描边，纯 SVG/CSS 实现，不引入 lottie）；填图片路径则改显示封面图。该表存在即渲染，`enable` 字段当前未被模板读取 |

banner 卡背景的创意图标带靠单独的数据文件：

```yaml
# data/creativity.yml
list:
  - name: Java                    # 悬停标题
    color: "#fff"                 # 图标方块底色
    icon: "https://.../java.jpg"  # 图标 URL，绝对地址或本站相对路径均可
  - name: Docker
    color: "#57b6e6"
    icon: "/img/creativity/docker.png"
```

模板会把整份列表复制一遍做无缝横向滚动，并按偶数项做上下错位，因此**条目数取偶数**观感最佳；`list` 缺失或为空时
不渲染该图标带。本仓库这份是官方预览站的快照，图标指向远程图床，失效时换成自己的图标即可。

### 首页说说条

| 参数 | 说明 |
|---|---|
| `params.essay.enable` | 总开关 |
| `params.essay.link` | 点击跳转的页面（原版固定 `/essay/`，留空则渲染为不可点击文本） |
| *数据* | 轮播文案放在**站点根目录** `data/essay.yml` 的 `list` 中，每项一个 `text`；`list` 为空时整条不渲染 |

```yaml
# data/essay.yml
list:
  - text: 快写一首情歌，雅俗共赏～
  - text: 深圳欢乐谷是真好玩!!!
```

### 搜索 / 目录 / 其它模块

| 参数 | 说明 |
|---|---|
| `params.search.enable` | 本地搜索开关（需同时配置 `outputFormats.SEARCH`） |
| `params.search.preload` | 首次打开即拉取索引，否则首次使用才加载 |
| `params.toc.enable` | 文章目录卡（桌面在侧栏，移动端为右下角抽屉） |
| `params.toc.expand` | 目录是否默认全部展开 |
| `markup.tableOfContents.startLevel` / `endLevel` | 建议 `2` / `3`，与目录高亮脚本的匹配范围保持一致 |
| `params.post_copyright.enable` | 文章版权声明卡 |
| `params.post_copyright.license` / `license_url` | 许可协议名称与链接 |
| `params.subtitle_js.lines` | Hero 副标题打字机的轮播文案数组，未设置时退回 `params.subtitle`（`subtitle_js.enable` 当前未被模板读取） |
| `params.author_status.enable` | 作者卡问候气泡（按时段生成，点击随机切换） |
| `params.author_status.skills` | 气泡随机切换的内容池 |
| `params.aside.enable` | 侧栏总开关 |
| `params.aside.card_author` / `card_categories` / `card_tags` / `card_archives` / `card_webinfo` | 各卡片开关；判断均为 `ne ... false`，即**不写配置就是开启**，要关必须显式写 `false` |
| `params.aside.card_announcement` | 公告卡文案，留空则不渲染 |
| `params.footer.custom_text` | 页脚自定义文案（支持 HTML） |
| `params.footer.owner.since` | 版权起始年 |
| `params.footer.linkList` | 页脚链接数组，字段 `text` `link` |
| `params.social` + `params.social_icons` | 社交链接与同名键的图标类名 |

### 相关文章

由 Hugo 内置的 Related 机制驱动，需在站点配置中声明索引：

```toml
[related]
  threshold = 1
  includeNewer = true
[[related.indices]]
  name = "tags"
  weight = 100
```

文章需带 `tags` 才会出现「喜欢这篇文章的人也看了」区块，无匹配时整块不渲染。

### 顶部菜单

```toml
[[menu.main]]
  name = "首页"
  url = "/"
  weight = 1
  [menu.main.params]
    icon = "anzhiyu-icon-house-chimney"
```

`weight` 控制顺序，`params.icon` 为图标字体类名。

菜单列表末尾还会固定追加一个「随机文章」入口（`#randomPost_button`，文案与图标写死为「文章」/ `anzhiyu-icon-dice`，
点击调 `toRandomPost()`），它**不参与** `menu.main` 配置，故导航会比菜单项多出一个。

## 文章 Front Matter

```yaml
---
title: "文章标题"
date: 2026-10-20T10:00:00+08:00
updated: 2026-10-21T14:30:00+08:00
tags: ["Hugo", "博客"]
categories: ["前端"]
cover: "/img/default_cover.jpg"   # 卡片封面，缺省则全宽无图
top: true                         # 置顶（首页排最前，卡片显示图钉 +「置顶」）
topGroup: true                    # 进入首页顶部推荐卡组（带「荐」角标）
top_img: ""                       # 仅页面使用：单独设置内页头图
description: "本页 SEO 描述"       # 缺省回退 params.description
---

正文摘要……

<!--more-->

正文其余部分（不出现在首页摘要中）。
```

- 首页卡片摘要取 `.Summary`（纯文本，超 200 字截断），因此 `<!--more-->` 之前的内容即为摘要；未写 `<!--more-->` 时取全文前段。
- 全站发布日期最新的一篇文章，卡片会自动带上「最新」角标。
- `cover` 同时是文章页头图的来源之一，回退链为 `top_img → cover → params.default_top_img`；三者皆空则文章页不渲染顶部信息卡。

## 首页尺寸对齐基准

首页各卡片的宽高与间距按官方 Next 前端（`anheyu-app-frontend-main`，即 blog.anheyu.com 实际渲染的版本）
1:1 对齐，并以 1920×1080 视口下的像素扫描做过复核。下表为两边的实测值，改动首页布局时请以此为基准：

| 区域 | 官方规格 | 说明 |
| --- | --- | --- |
| 容器 | `max-width:1400px; padding:0 1.5rem` | `#home_top`、`#content-inner.layout` 同宽 |
| 「即刻」说说条 | y 60–109，`margin:0 auto` | 与页面无额外上边距 |
| HomeTop 整体 | y 118–457（高 340），`gap:.5rem` | `.swiper_container_card{margin:.5rem auto 0}` |
| 左右两栏 | 各 672px（284–955 / 964–1635），栏间距 8px | 两边都是 `flex:1; min-width:0; height:340px`，**不是** Hexo 的「左 `calc(100% - 600px)` / 右固定 600px」 |
| banner 卡 | 高 258（= 340 的 76%） | `#random-banner{height:76%}` |
| 随便逛逛浮层 | 纸飞机 72×72 在上、文字行 56px/行高 84 在下，整组居中（实测 plane y=168.6、x=317） | 官方 `.randomHover > svg:first-child{4.5rem + margin-right:1rem}`、`.bannerText{3.5rem + bold}`、`.bannerText > svg{4.5rem + margin-left:1rem}`；Hexo 原版是一条 `#random-hover i{font-size:80px;margin-left:10px}`，与官方差 8px 且多 10px 左边距 |
| 分类胶囊 | 高 74，单枚 219，间距 8 | `a.categoryButton{padding:1.5rem 1.2rem; line-height:1.4}` 由内容撑出；`line-height` 必须收紧，否则继承 body 的 `2` 会把胶囊撑到 86px，多出的 12px 会被 flex 从 banner 身上扣走 |
| 推荐小卡 | 三列两行，宽 `calc(33.333% - .5rem*2/3)`、高 `calc(50% - .25rem)` | 始终参与布局，由绝对定位的 `.todayCard` 覆盖；点「更多推荐」只加 `.hide`（Hexo 版靠 JS 改 `display`，此处不移植） |
| 主列 / 侧栏 | 主列 284–1325（1042），侧栏 1336–1635（300），间隙 10 | `#content-inner.layout{gap:.625rem}` + `.main-content{flex:1; min-width:0}`，侧栏不可再加 `padding-left` |
| 分类导航条 | y 466–515（高 50） | 首页 `#content-inner` 的 `padding-top` 是 `.5rem`（非 1.25rem） |
| 文章卡（双列） | 单卡 516 宽、353 高（封面 225 + 信息区 126），行间距 10 | 信息区高度由 `padding:18px 32px` + 内容撑出，勿沿用单列的 174px |

- 993–1200px 区间仍是 Hexo 原版的「横向滚动卡片流」，而官方该区间保持上面的 50/50 桌面布局，属已知的有意分歧。
- ≤1200 的滚动模式里推荐卡要退回固定 `200×168`，百分比宽在 `width:auto` 的滚动容器中会塌成 0。

## 参照文件速查（原版 ↔ 移植版）

补功能或改样式时先在上游找到对应文件，不要凭记忆猜结构。**观感/几何以 Next 版为准，DOM 结构以 Hexo 版为旁证**。

| 模块 | 本移植版 | Hexo 原版（`hexo-theme-anzhiyu`） | 官方 Next 版（`anheyu-app-frontend`） |
|---|---|---|---|
| 全局骨架 | `layouts/baseof.html` | `layout/includes/layout.pug` | `src/app/layout.tsx` |
| 顶部导航 | `partials/header.html` | `layout/includes/header/{index,nav,menu_item,social}.pug` | `src/components/layout/Header/` |
| 文章页 banner 信息卡 | `partials/header.html`（`$isPost` 分支） | `layout/includes/header/post-info.pug` | `src/components/post/**` |
| 「即刻」说说条 | `partials/essay_bar.html` | `layout/includes/bbTimeList.pug` | `src/components/home/HomeTop/`（`EssayBar.module.css`） |
| 首页顶部卡片区 | `partials/home_top.html` | `layout/includes/categoryGroup.pug`、`source/css/_layout/home_top.styl` | `src/components/home/HomeTop/{HomeTop.tsx,HomeTop.module.css}`、`HelloLottie.tsx`（**几何真值**） |
| 分类条 / 标签条 | `partials/category_bar.html`、`tag_bar.html` | `layout/includes/page/{categories,tags}.pug` | `src/components/home/HomeTop/{CategoryBar,TagBar}.tsx` |
| 文章卡片流 | `partials/post_cards.html`、`post-item.html` | `layout/index.pug`（卡片内联） | `src/components/home/FeedArticleList/` |
| 分页 | `partials/pagination.html` | `layout/includes/pagination.pug` | `src/components/home/Pagination/` |
| 侧边栏 | `partials/aside.html` | `layout/includes/sidebar.pug`、`includes/widget/card_*.pug` | `src/components/home/Sidebar/` |
| 页脚 / 悬浮按钮 | `partials/footer.html`、`rightside.html` | `layout/includes/{footer,rightside}.pug` | `src/components/layout/Footer/` |
| 文章详情附属 | `_default/single.html` | `layout/includes/post/{post-copyright,ptool,reward}.pug`（后两者未移植） | `src/components/post/**` |
| 全部文章 / 时间线 | `_default/section.html` | `layout/archive.pug` | `src/components/archives/ArchiveList.tsx` |
| 分类 / 标签总览与 term 页 | `_default/taxonomy.html` | `layout/{category,tag}.pug` + `includes/page/*` | `src/components/{categories,tags}/*PageContent.tsx` |
| 本地搜索 | `layouts/index.search.json` + `assets/js/local-search.js` | `source/js/search/local-search.js` | `src/components/layout/Header/components/SearchModal/` |
| 样式 | `assets/css/butterfly.css`（令牌在文件头 `:root`） | `source/css/{var,_global,_layout,_page,_mode}/**.styl` | `*.module.css` + Tailwind 工具类 |
| 交互 | `assets/js/butterfly.js` | `source/js/{main,utils,tw_cn}.js`、`source/js/anzhiyu/*.js` | `src/hooks/**`、组件内事件 |

## 开发约定

- **参照系**：观感一律以官方 Next 前端 `anheyu-app-frontend`（blog.anheyu.com 实际渲染的版本）为准，
  `hexo-theme-anzhiyu` 只作结构与配色令牌的旁证——两者并不总是一致
  （例：HomeTop 左右栏 50/50 等分 vs Hexo 的固定 600px 右栏）。各模块对应的上游文件见「参照文件速查」。
- **样式**：全部集中在 `assets/css/butterfly.css`，按 `/* ==== 区块 ==== */` 注释分块；深色模式用
  `[data-theme="dark"]` 前缀覆盖。设 `line-height` 时注意本主题 body 是 `2`（远大于 Tailwind 的 1.5），
  从官方搬过来的「内容撑高」规则需显式收紧行高，否则会被 flex 收缩连带影响兄弟元素。
- **图标**：远程 iconfont 的 CDN 自带 `.anzhiyufont{font-size:16px}`，会截断字号继承——要放大图标必须用
  高于该选择器的规则**直接命中 `i` 元素**，只改父级字号无效。
- **布局校验**：改首页几何后，用 headless Edge 对本地站与官方站各出一张 1920×1080 截图，再做像素扫描比对
  （非底色扫描取整卡 bbox，`#e3e8f7` 描边扫描取 1px 精度边界），具体实测值见「首页尺寸对齐基准」。
  测 hover 态（如「随便逛逛」浮层）时 headless 无法真实悬停，需临时放一个同源 iframe 探针页注入 inline style，
  且**必须先 `transition = 'none'`**——`--virtual-time-budget` 不推进 CSS 过渡的动画时钟，否则量到的仍是过渡起始值。
  探针页属临时取证产物，用完即删。
- **Hugo 模板**：读 `data/` 目录统一用 `hugo.Data`（见「环境要求」）；`_default/taxonomy.html` 内按 `.Kind` +
  `.Data.Plural` 分四个分支，改前先确认自己命中的是哪一类页面。

## 已知限制

- **中文分类 / 标签名**会经 URL 编码，`params.home_top.category.path` 等配置里直接写中文路径即可，
  当前项高亮逻辑已按解码后的路径匹配。
- **图标依赖远程图标字体**：离线环境或镜像失效时图标会缺失，可自建镜像后替换 `params.iconfont_css`。
- **未移植模块**：评论区、音乐播放器、图片 Lightbox、右键菜单、PWA、加载动画（`static/img/loading.gif` 已就位但无调用方）、
  简繁切换、友链 / 朋友圈 / 说说等特色页面、文章上下篇导航、`404.html` 页面（主题没有 404 模板，需自行补）。
- **代码高亮**：走 Hugo 内置 chroma。站点未配置 `[markup.highlight]` 时输出的是**内联样式**，主题只继承原版
  `pre` 的圆角与底色，hexo-highlight 那多套配色方案未移植。
- 文章页的「字数 / 阅读时长」已实现（`.WordCount` / `.ReadingTime`），但整块顶部信息卡只在有头图时渲染
  （见上文回退链），无头图时连同日期一起隐藏。
- 首页分类导航条用横向滚动实现，未引入原版依赖的 swiper。
- **配置了但当前未被模板读取的参数**：`params.aside.position`（侧栏固定右侧）、`params.home_top.banner.enable`
  （`[banner]` 表存在即渲染）、`params.home_top.default_descr`、`params.subtitle_js.enable`（只看 `lines`）、
  以及站点配置里顶层的 `site_start_time`（`params.` 下的那一项才生效）。

## 致谢与许可

视觉与交互设计源自 [anzhiyu-c/hexo-theme-anzhiyu](https://github.com/anzhiyu-c/hexo-theme-anzhiyu)，
上游以 **GPL-3.0** 授权；本移植版同样以 **GPL-3.0** 发布，详见 [LICENSE](LICENSE)。
`anzhiyufont` 图标字体由上游通过阿里 iconfont 提供，其授权独立于本主题。
