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

- Hugo **extended** ≥ 0.156（实际下限由模板里的 `hugo.Data` 写法决定，`theme.toml` 的 `min_version` 已对齐为 `0.156.0`）；
  开发与验证环境为 0.168.0
- 联网加载图标字体 CSS（可自建镜像后改 `params.iconfont_css`）；用了数学公式的文章还要联网加载 KaTeX 样式表（见「数学公式」）
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

要用数学公式需要两步：上面那句站点配置（主题的 passthrough 默认值才进得来），加上文章 front matter 的 `math: true`（逐篇开关，原因见「数学公式」）：

```toml
[markup]
  _merge = 'shallow'
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

> **文章目录约定**：首页 feed、侧栏统计与相关文章均只取 `content/posts/` 下的文章
> （模板里统一用 `where site.RegularPages "Type" "posts"` 过滤），`about.md` 这类独立页不会出现在首页列表中。
> 例外是本地搜索索引 `/search.json`：它取全部 RegularPages，`about.md` 也能被搜到（结果卡标「页面」，见「本地搜索弹窗」）。

## 目录结构

```
themes/butterfly/
├── layouts/
│   ├── baseof.html              # 全局骨架（body-wrap / 导航 / 主区 / 侧栏 / 页脚 / 悬浮按钮）
│   ├── index.html               # 首页（置顶排序 + 文章卡片流 + 分页）
│   ├── index.search.json        # 本地搜索索引输出模板（产出 /search.json，字段 title/url/content/tags/cover/date/type）
│   ├── _markup/
│   │   └── render-passthrough.html # 数学公式渲染钩子：文章开了 math 才交给 Hugo 内嵌 KaTeX，否则按原文显示
│   ├── _default/
│   │   ├── list.html            # 通用列表页
│   │   ├── section.html         # 全部文章页（时间线）
│   │   ├── single.html          # 文章详情页
│   │   └── taxonomy.html        # 分类/标签总览页 + term 页（按 .Kind 分支）
│   └── partials/
│       ├── head.html            # meta / 资源 / 深浅色预初始化 / 主题配置注入（含 KaTeX 样式表按需引入）
│       ├── math-enabled.html    # 数学公式开关判定（渲染钩子与 head 共用）
│       ├── header.html          # 顶部导航（含搜索入口、随机文章、移动端汉堡菜单）
│       ├── essay_bar.html       # 首页「即刻」说说条
│       ├── home_top.html        # 首页顶部卡片区 #home_top
│       ├── category_bar.html    # 首页与分类列表页顶部的分类导航条
│       ├── tag_bar.html         # 标签列表页顶部的标签条
│       ├── post_cards.html      # 文章卡片流 + 分页（首页 / term 页 / 列表页共用）
│       ├── post-item.html       # 单篇文章卡片
│       ├── list-body.html       # 通用列表页主体（标题卡 + 卡片流）
│       ├── aside.html           # 侧边栏卡片组（作者/公告/分类/标签/归档/站点信息/目录）
│       ├── search.html          # 本地搜索弹窗（DOM 照官方 SearchModal）
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
│       └── local-search.js      # 本地搜索（拉 search.json 做前端匹配，按官方结构渲染结果卡；Ctrl/⌘ + K 开、Esc 关）
├── static/img/                  # 兜底与图标资源：default_cover.jpg（banner 无封面时）、404.jpg（封面 onerror）、
│                                #   friend_404.gif（头像 onerror）、siteicon/（favicon 及 apple / manifest 图标）
│                                #   loading.gif 是上游遗留，加载动画未移植故当前无引用方
├── archetypes/default.md        # 主题侧文章模板（含 cover / top / topGroup 示例）；站点根 archetypes/ 优先级更高
├── hugo.toml                    # 主题默认配置：目前只有数学公式的 passthrough 定界符（需站点 [markup] _merge 才生效）
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
| `params.index_img` | 首页 Hero 大图，留空为无头图模式（原版默认）；非空时导航走「透明 + 反白」态，见「导航滚动动效」 |
| `params.default_top_img` | 内页默认头图（文章页回退链的最后一环），同样触发导航的反白态 |
| `params.iconfont_css` | 远程图标字体 CSS 地址 |
| `params.math` | 数学公式的全站默认开关（逐篇 front matter 的 `math` 优先，见「数学公式」） |
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
| `params.search.enable` | 本地搜索开关（需同时配置 `outputFormats.SEARCH`），弹窗样式与交互见下节「本地搜索弹窗」 |
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

### 本地搜索弹窗

DOM 在 `partials/search.html`、结果卡由 `assets/js/local-search.js` 填充、样式在 `butterfly.css` 的「本地搜索」区块，
三者均照官方 Next 版 `SearchModal`：

- **弹窗**：`width:40rem; max-width:90vw; margin:5rem auto; max-height:80dvh`，圆角 16px + 1px 描边，
  **无投影**（官方 `--anzhiyu-shadow-lightblack` 的 alpha 恒为 0），滚动交给 `.search-wrap`。
  官方 CSS 里没有任何 `@media`，窄屏靠 `max-width:90vw` 自适应，因此不再沿用 Hexo 的「≤768px 全屏无圆角」。
- **遮罩**：`--butterfly-maskbg-deep`（浅色 85% 白 / 深色 85% 黑）+ `backdrop-filter: blur(12px)`，不是黑色半透明。
- **快捷键**：`Ctrl/⌘ + K` 开、`Esc` 关；空关键字时显示官方提示行「按 Esc 关闭 · 按 Ctrl/⌘ + K 打开」，
  一旦输入就隐藏（同官方 `tipsVisible && !keyword.trim()`）。
- **结果卡**：6rem 方封面 + 标题（命中词主色高亮）+ 类型徽章 + 两行摘要 + 底部「作者 · 日期 · 标签」，
  hover 上抬 2px、换主色描边并露出右箭头。字段来自 `/search.json` 的 `cover` / `date` / `type` / `tags`，
  作者统一取 `params.author`（本地索引没有逐篇作者），封面缺省为 `/img/default_cover.jpg`、加载失败回退 `/img/404.jpg`。
- **与官方的差异**：官方是服务端分页 + 逐篇作者，本地搜索一次列全部结果、靠弹窗滚动，**未移植分页**；
  类型徽章按 section 判定（`content/posts/` 下为「文章」，其余为「页面」）。
- 索引加载与逐次搜索的转圈块复用官方 `.loading`（2rem 细环 + 主色起边），替掉原版「数据库加载中 + 脉冲图标」；
  输入框从一开始就可用，不再等索引到位才显示 `.search-wrap`。

### 数学公式（KaTeX，构建期渲染）

LaTeX 由 **Hugo 内嵌的 KaTeX 引擎在构建期**渲染成 HTML（`transform.ToMath`），页面里没有数学相关的 JS，也不引 MathJax。
**默认关**：文章 front matter 写 `math: true` 才渲染。五处配合：

| 文件 | 作用 |
| --- | --- |
| `hugo.toml`（主题） | 声明 goldmark passthrough 扩展与定界符默认值 |
| `layouts/partials/math-enabled.html` | 开关判定（渲染钩子与 head 共用，不会出现「引了样式没渲染」或反之） |
| `layouts/_markup/render-passthrough.html` | 渲染钩子：开着才把捕获的原文交给 `transform.ToMath`，关着按原文显示 |
| `partials/head.html` | 开关开着才补一份 KaTeX 样式表 |
| `assets/css/butterfly.css`「数学公式」区块 | 公式字号 1.1、块级公式横向滚动 |

```yaml
# content/posts/<slug>.md
---
title: "文章标题"
math: true          # 不加则正文里的 $$ … $$ 只当普通文字显示
---
```

两级开关（对齐原版 Hexo 的 `enable` + `per_page`）：

| 写法 | 效果 |
| --- | --- |
| 文章 `math: true` | 仅该页渲染公式并加载样式表，其它页一律不引（首页 / 分类页 / 未开的文章都不带） |
| 文章 `math: false` | 即使站点开了默认值，这一页也不渲染 |
| 站点 `[params] math = true` | 全站默认开（每页都引样式表，与原版非 per_page 模式一致），逐篇可用 `math: false` 关掉 |
| 两者都不写 | 全关（默认） |

未开启的页面里定界符内容按原文显示（块级统一补成 `$$ … $$`，行内补 `\( … \)`），与未接数学功能时一致。
实现里两个 Hugo 细节（都实测过）：

- 站点 `[params]` **不会**合并进 `.Page.Params`，默认值得自己兜；也不能写
  `.Page.Params.math | default site.Params.math` —— 页面显式 `math: false` 会被当空值漏给站点。
- 判「键是否存在」不能用 `in`（`in hmaps.Params "math"` 两种参数顺序都返回 false），
  要 `index` 取值再与 `nil` 比：没写过的键取出来是 nil，显式写的 false 不是。

**站点必配一行**：Hugo 对 `[markup]` 这一类的默认合并策略是 `_merge = 'none'`，而且策略**只能由站点声明**
（主题自己写 `_merge` 无效，实测如此）。站点 `hugo.toml` 里要保留：

```toml
[markup]
  _merge = 'shallow'
```

少了它，主题里的 passthrough 定界符根本不会进配置，正文的公式会原样输出成纯文本（构建不报错，属于静默失效）。
`shallow` 只补站点没定义的键，站点自己写的 `[markup.goldmark]`、`[markup.tableOfContents]` 仍以站点为准。

定界符（**行内只开 `\(...\)`**，这是刻意取舍）：

| 类型 | 写法 | 说明 |
| --- | --- | --- |
| 块级 | `$$…$$`、`\[…\]` | 居中独立成行 |
| 行内 | `\(…\)` | 随文字排版 |
| 行内（默认不开） | `$…$` | 不开是因为正文里「$5」这类金额会被当成公式起点；要用就在站点配置里加 `inline = [['$','$']]`，并记得正文的美元符号写成 `\$` |

代码块与行内代码里的定界符**不会**被解析（passthrough 只作用于正文），贴 LaTeX 源码是安全的。

`transform.ToMath` 的选项与理由：

- `output="htmlAndMathml"`：可读性与复制语义都更好，代价是**必须**配 KaTeX 样式表，于是才有 head 里的按需引入；
  另一个代价是纯文本里一份公式会变成三层拷贝，所以 `index.search.json` 先剔掉 `<math>…</math>` 再 `plainify`。
- `displayMode = (eq .Type "block")`：块级定界符走居中显示模式，行内随文。
- `throwOnError = false`：对齐官方 Next 版 `src/lib/katex-render.ts`，单条公式写错只渲染成红色错误文本，不炸整站构建。
- `strict = "warn"`：KaTeX 默认把「数学模式里出现中文」当错误（`unicodeTextInMathMode`），配合上一条就落成红字。
  中文博客写反应条件、`\text{其中}` 很容易撞上，改 `warn` 后照样渲染、构建时只出一条警告指认是哪个字符；想静音改 `ignore`。
  更干净的写法是把中文塞进 `\text{…}`（text 模式不告警），速查文里就是这么写的。

样式逐条取自官方 Next 版 `PostContent.module.css` L3093-3123 的 KaTeX 段：`.katex{font-size:1.1em}`（与 Hexo
`mathjax.pug` 的 `chtml.scale: 1.1` 同值）、`.katex-display{overflow-x:auto;overflow-y:hidden;padding:.5em 0}`、
`.katex-display > .katex{white-space:nowrap}`；`line-height:normal` 与隐藏滚动条来自 Hexo
`_extra/**/third-party.styl` L74-84（`.katex-wrap` + `katex.hide_scrollbar` 默认 true）。
headless 实测：公式 15.4px / 正文 14px（正好 1.10 倍），块级公式宽 962 = 容器 962（宽屏不溢出、无滚动条），
390px 窄屏 `scrollWidth 453 > clientWidth 330`，在卡片内横滚且不撑破容器。

**未移植**：官方 `.md-editor-katex-block` / `.math-block` 是编辑器产物专属类名（本地走 passthrough 没有这层 DOM）；
Hexo 的 `katex_copytex` 右键复制源码；MathJax `tags:'ams'` 的自动编号（KaTeX 用 `\tag{…}` 手动编号）。

写作时的三条约束（都是实测撞到的）：

1. 公式**不要写进标题**（侧栏目录取标题纯文本，会显示成 `\( … \)` 源码）。
2. 从 Hexo / MathJax 站点搬旧文时，`$…$` 行内定界符默认不认（改成 `\( … \)` 或整行 `$$ … $$`），
   换行分隔符要写 `\\` 而不是 `\\\\`。
3. 公式编号用 `\tag{N}`（整条块级公式）或行末 `\quad (N)`（`cases` 逐行编号，`\tag` 放进会报错），
   不要用 ①②③ 这类带圈数字（KaTeX 无对应字形，每个字符一行告警）。

语法与效果对照、开关写法见站点文章 `content/posts/latex-math-syntax.md`。

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
  name = "文章"
  url = "/posts/"
  weight = 2
  [menu.main.params]
    icon = "anzhiyu-icon-box-archive"
```

`weight` 控制顺序，`params.icon` 为图标字体类名（只写 `anzhiyu-icon-*` 那一段，模板会补上 `anzhiyufont`）。

- **桌面端菜单是纯文字**（官方 `.menuTitle{font-size:1rem; letter-spacing:.3rem}`），`params.icon` 只在
  ≤768px 的汉堡抽屉里出现——DOM 里照常渲染 `<i>`，由 `@media (min-width:769px)` 隐藏，改菜单时两边都会跟着变。
- 顶部**不配「首页」菜单项**（左侧站名就是回首页入口），当前为「文章 / 分类 / 标签 / 关于」；
  官方示例站顶部只放「文库 / 友链 / 我的 / 关于」，具体条目属于站点 `[menu.main]` 的内容配置，不是主题差异。
- 随机文章入口**不在菜单里**：它固定在右侧 `#nav-right #random-post-button`（`anzhiyu-icon-dice`，
  调 `toRandomPost()`，`accesskey="r"`），与官方右侧按钮顺序「骰子 → 搜索 → 回顶」一致。
- 导航里**没有深浅色切换按钮**：月亮在右下角 `#rightside #toggle-mode`（官方把主题切换放在中控台，导航内也没有）。

### 导航滚动动效

导航本体常驻 `position:fixed`，不做整体隐藏 / 位移；向下滚动只做中部菜单与页面名的替换：

| 状态类 | 触发条件（照官方 `src/store/scroll-store.ts`） | 表现 |
| --- | --- | --- |
| `has-scroll` | `scrollY > 0` | 导航背景由页面底色抬成卡片色并显出描边（见下）；右侧回顶 / 百分比按钮从 `width:0 + scale(0)` 展开 |
| `nav-menu-scrolled` | `scrollY > 60` **且本次比上次更低** | `.menus_items` 上移淡出（`translateY(-50px) scale(1.1)`），`#page-name-container` 从导航下方 `top:62` 上移 52px，落到 60px 高的导航正中 |

向上滚动时方向判定为假，菜单与页面名反向复原。页面名由 `partials/header.html` 的 `$pageTitle` 渲染：首页取
`site.Title` + `params.subtitle`，分类 / 标签 term 页固定为「分类」/「标签」，其余页面取 `.Title`。
百分比文本与官方一致为**纯数字**（不拼 `%`），页脚进入视口后换成「返回顶部」并把按钮拉长到 80px。

导航背景与文字颜色共**三态**（官方 `.headerWrapper` / `.isTransparent` / `.isTransparent.textIsWhite`）：

| 场景 | 条件 | 表现 |
| --- | --- | --- |
| 无头图页顶部 | `#page-header.not-top-img` 且无 `has-scroll` | 底色用页面底色 `--butterfly-background`、`outline-color: transparent`，与下方内容无缝 |
| 有头图页顶部 | `#page-header:not(.not-top-img)` 且无 `has-scroll` | 导航**完全透明**，站名 / 菜单 / 右侧图标 / 汉堡按钮**反白**，hover 为半透明白底胶囊 `rgba(255,255,255,.2)`（而非默认的实心主色胶囊） |
| 已滚动 | `has-scroll` | 换成 `--butterfly-card-bg` + `--butterfly-card-border` 描边，文字回普通色 |

“有头图”即 `#page-header` 带 `full_page`（首页 `index_img`）/ `not-home-page`（内页 `top_img` 或
`default_top_img`）/ `post-bg`（文章页）三种 class 之一，CSS 直接用 `:not(.not-top-img)` 判定。官方只对
文章详情 / 音乐 / 一图流页开白字，本站其余头图页同样是头图铺到导航背后，不反白就读不了，因此放宽到“有头图”统一判定。
“在顶部”用 `:not(.has-scroll)`（官方 `isTransparent` 即 `scrollY === 0`），滚 1px 就整体回到卡片态；两态过渡 0.3s。
移动端展开的抽屉 `#menus.menus-show` 自带卡片底色，用 `:not(.menus-show)` 排除，不参与反白。

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
math: true                        # 仅含公式的文章需要：开本页的 LaTeX 渲染（见「数学公式」）
description: "本页 SEO 描述"       # 缺省回退 params.description；写了还会同时作为首页卡片摘要（见下）
---

正文摘要……

<!--more-->

正文其余部分（不出现在首页摘要中）。
```

- 首页卡片摘要取 `.Summary`（纯文本，超 200 字截断），因此 `<!--more-->` 之前的内容即为摘要；未写 `<!--more-->` 时取全文前段。
- 摘要默认取纯文本，可用 front matter `description` 覆盖（`partials/post-item.html` 里 `$article.Description | default $plain`）——
  首段就含公式的文章必须覆盖，否则纯文本会把 MathML 字符、TeX 源码与 HTML 三层拼在一起（见「数学公式」）。
- 全站发布日期最新的一篇文章，卡片会自动带上「最新」角标。
- `cover` 同时是文章页头图的来源之一，回退链为 `top_img → cover → params.default_top_img`；三者皆空则文章页不渲染顶部信息卡。

## 首页尺寸对齐基准

首页各卡片的宽高与间距按官方 Next 前端（`anheyu-app-frontend-main`，即 blog.anheyu.com 实际渲染的版本）
1:1 对齐，并以 1920×1080 视口下的像素扫描做过复核。下表为两边的实测值，改动首页布局时请以此为基准：

| 区域 | 官方规格 | 说明 |
| --- | --- | --- |
| 容器 | `max-width:1400px; padding:0 1.5rem` | `#home_top`、`#content-inner.layout` 同宽；**导航也一样**：padding 挂在 `#nav-group` 上（不是 `#nav`），`#nav-right` 因绝对定位需自带 `padding-right:1.5rem` |
| 顶部导航 | 60px 高，1920 视口下内容盒 271–1623 | 实测墨迹：站名 x=291、菜单 775–1137（中心 956）、右侧图标末端 1629；官方对应 297 / 816–1095（中心 955）/ 1635，差值均为字形内边距。顶部态导航底色实测 (247,249,254) = `--butterfly-background`，滚动后 (255,255,255) + y=60 处 (227,232,247) 描边 |
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
- **双列断点（≥1201px）下 `#recent-posts` 是 `flex-wrap` 容器，term 页顶部的标签条 / 分类条也是它的 flex item**，
  必须占满整行：标签条靠 `#recent-posts > .tag-bar-container{flex:0 0 100%}` 钉住，否则它按内容收缩、与首篇文章卡
  挤在同一条 flex line，并被默认的 `align-items:stretch` 拉到与卡片等高（标签 ≤3 个时胶囊变成竖长条；标签多时
  标签条自身已有几行高，所以一直看不出来）。分类条不受影响是因为 `#category-bar` 写死了 `width:100%` + `height:50px`。

## 参照文件速查（原版 ↔ 移植版）

补功能或改样式时先在上游找到对应文件，不要凭记忆猜结构。**观感/几何以 Next 版为准，DOM 结构以 Hexo 版为旁证**。

| 模块 | 本移植版 | Hexo 原版（`hexo-theme-anzhiyu`） | 官方 Next 版（`anheyu-app-frontend`） |
|---|---|---|---|
| 全局骨架 | `layouts/baseof.html` | `layout/includes/layout.pug` | `src/app/layout.tsx` |
| 顶部导航 | `partials/header.html` | `layout/includes/header/{index,nav,menu_item,social}.pug` | `src/components/layout/Header/`、滚动状态在 `src/store/scroll-store.ts` |
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
| 本地搜索 | `partials/search.html` + `layouts/index.search.json` + `assets/js/local-search.js` | `layout/includes/third-party/search/local-search.pug`、`source/js/search/local-search.js`、`source/css/_search/**` | `src/components/layout/Header/components/SearchModal/{index.tsx,styles.module.css}`（**观感真值**） |
| 数学公式 | `layouts/partials/math-enabled.html`（开关）+ `layouts/_markup/render-passthrough.html` + 主题 `hugo.toml` + `head.html` 按需引 CSS + `butterfly.css`「数学公式」区块 | `layout/includes/third-party/math/{katex,mathjax}.pug`、`_config.yml` 的 `mathjax/katex` 段、`_extra/**/third-party.styl` L74-84 | `src/lib/katex-render.ts`、`PostContent.module.css` L3093-3123（**观感真值**） |
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
- **内联 `style` 属性里的 CSS 必须过 `safeCSS`**：Go 的 html/template 会对 `style="..."` 插入值跑 CSS  sanitizer，
  `background: url('/x.jpg') top / cover no-repeat fixed;` 这种简写会被判为不安全而整条替成 `style="ZgotmplZ"`（头图
  静默不渲染，构建不报错），模板里写 `style="{{ . | safeCSS }}"`。
- **布局校验**：改首页几何后，用 headless Edge 对本地站与官方站各出一张 1920×1080 截图，再做像素扫描比对
  （非底色扫描取整卡 bbox，`#e3e8f7` 描边扫描取 1px 精度边界），具体实测值见「首页尺寸对齐基准」。
  测 hover 态（如「随便逛逛」浮层）时 headless 无法真实悬停，需临时放一个同源 iframe 探针页注入 inline style，
  且**必须先 `transition = 'none'`**——`--virtual-time-budget` 不推进 CSS 过渡的动画时钟，否则量到的仍是过渡起始值。
  探针页属临时取证产物，用完即删。
  **量移动端几何不要用 `--window-size=390/420`**：Chromium 有约 500px 的最小窗口宽度，写小了仍按 500 布局，
  截图只截到左边那一段，看起来像「右侧被裁、整页横向溢出」的假 bug（实测同一页 420 窗口截图被裁，
  而同源 iframe 探针里 `vw=390`、`docScrollW=390` 完全正常）。窄视口一律改用 iframe 探针量。
  headless 快照时机有三条规律（探针实验证实，别再靠猜）：`--dump-dom` / `--screenshot` 都在**主文档 load**
  时取快照，plain 与 `--timeout=N` 都**不推进**定时器，只有 `--virtual-time-budget` 会让 `setTimeout` 真正触发；
  虚拟时间会被**真实网络请求消耗**（CDN 字体、远程图床），预算给到 40s 也可能只跑到第 60 个 tick；
  同源 iframe 的 `onload` 会被页面内远程图片拖住，快照时常常还没触发，改用 `setInterval` 轮询，
  并分两轮测量（先读结构与计算样式，字体就绪后再复测依赖宽度的结论）。
  测滚动态（如 `nav-menu-scrolled`）时用 `document.scrollingElement.scrollTop = 600` +
  `dispatchEvent(new Event('scroll'))` 驱动（headless 虚拟时间下 `window.scrollTo()` 不生效），再读
  `getComputedStyle` 与 `getBoundingClientRect()`。另注意图标字体由远程 CDN 加载，`--virtual-time-budget`
  给小了会拍到「布局已在、墨迹为 0」的假象，不能当成样式 bug。验证导航反白态需要一个能真的加载下来的头图：
  文章页封面是远程图床，headless 下常拿不到，可临时把 `params.default_top_img` 指向主题自带的
  `static/img/404.jpg`（内页即变成 `not-home-page` 头图页），取证完再改回空串。
  测搜索弹窗这类「点了才出现」的浮层，同样用同源 iframe 探针：往 iframe 的 document
  `dispatchEvent(new KeyboardEvent('keydown', {key:'k', ctrlKey:true}))` 就能开弹窗（不必去点按钮），
  再给 `#search-input` 赋 `value` 并 `dispatchEvent(new Event('input', {bubbles:true}))` 触发结果渲染。
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
- **公式进纯文本会重复**：`output=htmlAndMathml` 的公式经 `plainify` 会把 MathML 语义字符、`<annotation>`
  里的 TeX 源码与 HTML 三层文本拼在一起（`E=mc2E = mc^2E=mc2`）。首页卡片摘要已留 `description` 出口规避；
  `/search.json` 取全文，但 `index.search.json` 会先用 `replaceRE` 剔掉 `<math>…</math>` 再 `plainify`，
  只剩读者实际看到的那一份（实测两篇公式密集的笔记：索引 28.4KB → 12.9KB，单篇 5440/10345 → 1186/2759 字）。
- **公式不能写进标题**：侧栏「文章目录」（`.TableOfContents`）取的是标题的**纯文本**，`### 3.1 \(\frac{dy}{dx}\)`
  会在目录里原样显示成源码（正文标题本身渲染正常）。公式请放到标题下方单独一段。
- KaTeX 字体没有带圈数字（①②③）与中文类字符，写进公式（即使包在 `\text{}` 里）会各触发行
  `WARN transform.ToMath`；靠浏览器回退字体能正常显示，但复制不出 LaTeX。公式编号请改用
  `\tag{N}` 或 `\quad (N)`（本站两篇数学笔记已这样改完，构建已做到包 `transform.ToMath` 在内的零告警）；
  其余中文场景想静默就把渲染钩子里的 `strict` 改成 `"ignore"`。
- **KaTeX 样式表走 jsDelivr**：`katex@0.18.4/dist/katex.min.css` 带 SRI，与图标字体同理依赖联网；
  离线时公式结构仍在但排版退化。自建镜像后替换 `partials/head.html` 里的那条链接即可。
- **配置了但当前未被模板读取的参数**：`params.aside.position`（侧栏固定右侧）、`params.home_top.banner.enable`
  （`[banner]` 表存在即渲染）、`params.home_top.default_descr`、`params.subtitle_js.enable`（只看 `lines`）、
  `params.home_top.category[].shadow`（阴影由 CSS 按 `.blue/.red/.green` 类提供，内联 `box-shadow` 会被消毒）。
  建站时间只认 `params.site_start_time`，写在顶层 `[params]` 外面不生效（站点配置已清掉这一项）。

## 致谢与许可

视觉与交互设计源自 [anzhiyu-c/hexo-theme-anzhiyu](https://github.com/anzhiyu-c/hexo-theme-anzhiyu)，
上游以 **GPL-3.0** 授权；本移植版同样以 **GPL-3.0** 发布，详见 [LICENSE](LICENSE)。
`anzhiyufont` 图标字体由上游通过阿里 iconfont 提供，其授权独立于本主题。
