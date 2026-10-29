/* 本地搜索：数据源为 Hugo 首页附带的 /search.json，全部匹配在前端完成。
   结果卡结构与类名照官方 Next 版 Header/components/SearchModal（6rem 封面 + 标题·类型徽章 + 两行摘要 +
   作者·日期·标签元信息行 + hover 右箭头），与官方的差异只在数据面：
   · 本地索引没有逐篇作者，作者取站点 params.author（由 baseof.html 注入 localSearchConfig）；
   · 官方是服务端分页，本地一次列全，超长靠弹窗 .search-wrap 自身滚动，故不搬分页。
   无 pjax，点结果卡直接整页跳转。 */
(function () {
  var cfg = window.localSearchConfig || { path: '/search.json', preload: true, author: '' };
  var dataObj = null;
  var isOpen = false;

  /* 官方用 gsap 时间线（遮罩 0.3s power2.out 淡入 + 弹窗 0.35s power3.out 从 y:24/scale:.98 落位，
     出场 0.25s power2.inOut 到 y:16/scale:.98），这里用等价的 CSS 动画，keyframes 见 butterfly.css */
  var DIALOG_IN = 'searchDialogIn .35s cubic-bezier(.215,.61,.355,1)';
  var DIALOG_OUT = 'searchDialogOut .25s cubic-bezier(.32,.08,.24,1)';
  var MASK_IN = 'searchMaskIn .3s cubic-bezier(.25,.46,.45,.94)';
  var MASK_OUT = 'searchMaskOut .3s cubic-bezier(.32,.08,.24,1)';

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  // 官方 formatDate：zh-CN 短日期（2024年3月5日）
  var formatDate = function (value) {
    try {
      var d = new Date(value);
      if (isNaN(d.getTime())) return value;
      return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return value;
    }
  };

  var reveal = function (elem, display, animation) {
    elem.style.display = display;
    /* #search-mask 基态 opacity:0，animationend 里清掉 style.animation 后要靠这条内联值维持可见态 */
    elem.style.opacity = '1';
    elem.style.animation = animation;
    var done = function () {
      elem.style.animation = '';
      elem.removeEventListener('animationend', done);
    };
    elem.addEventListener('animationend', done);
  };

  var dismiss = function (elem, animation) {
    elem.style.animation = animation;
    var done = function () {
      elem.style.animation = '';
      elem.style.opacity = '';
      elem.style.display = 'none';
      elem.removeEventListener('animationend', done);
    };
    elem.addEventListener('animationend', done);
    // 兜底：标签页在后台不跑动画时也要收干净
    setTimeout(done, 500);
  };

  document.addEventListener('DOMContentLoaded', function () {
    var $mask = document.getElementById('search-mask');
    var $dialog = document.querySelector('#local-search .search-dialog');
    var $closeBtn = document.querySelector('#local-search .search-close-button');
    var $input = document.getElementById('search-input');
    var $tips = document.getElementById('search-tips');
    var $results = document.getElementById('local-search-results');
    var $loadingDb = document.getElementById('loading-database');
    if (!$mask || !$dialog || !$input || !$results) return;

    var openSearch = function () {
      if (isOpen) return;
      isOpen = true;
      var bodyStyle = document.body.style;
      bodyStyle.width = '100%';
      bodyStyle.overflow = 'hidden';
      reveal($mask, 'block', MASK_IN);
      reveal($dialog, 'flex', DIALOG_IN);
      setTimeout(function () { $input.focus(); }, 100);
      if (!dataObj) dataObj = fetchData(cfg.path);
    };

    var closeSearch = function () {
      if (!isOpen) return;
      isOpen = false;
      var bodyStyle = document.body.style;
      bodyStyle.width = '';
      bodyStyle.overflow = '';
      dismiss($dialog, DIALOG_OUT);
      dismiss($mask, MASK_OUT);
    };

    var fetchData = function (path) {
      return fetch(path).then(function (response) {
        if (!response.ok) return [];
        // 索引到位即撤掉弹窗里的「数据库加载中」块（官方 .loading 的同位替换）
        if ($loadingDb) $loadingDb.remove();
        return response.json();
      });
    };

    /* 单条结果卡：结构对齐官方 .resultItem
       （result-thumbnail / result-details > result-content + result-footer，关键词命中用 .search-keyword 包住） */
    var buildItem = function (data, keywords, dataContent, titleHtml) {
      var dataUrl = (data.url || '').startsWith('/') ? data.url : (cfg.root || '/') + (data.url || '');
      var cover = data.cover || '/img/default_cover.jpg';
      var tags = data.tags || [];
      var str = '<div class="result-item" data-url="' + esc(dataUrl) + '">';
      str += '<div class="result-thumbnail"><img src="' + esc(cover) + '" alt="' + esc(data.title) + '"';
      str += ' onerror="this.onerror=null;this.src=\'/img/404.jpg\'"></div>';
      str += '<div class="result-details"><div class="result-content">';
      str += '<div class="result-title-wrapper"><div class="result-title">' + titleHtml + '</div>';
      str += '<span class="result-type-badge"><i class="anzhiyufont anzhiyu-icon-file-lines"></i>' + esc(data.type || '文章') + '</span>';
      str += '</div>';
      if (dataContent !== '') {
        str += '<div class="result-snippet">' + highlight(esc(dataContent), keywords) + '</div>';
      }
      str += '</div><div class="result-footer"><div class="result-meta">';
      if (cfg.author) str += '<span class="result-author">' + esc(cfg.author) + '</span>';
      if (data.date) str += '<span class="result-date">' + esc(formatDate(data.date)) + '</span>';
      if (tags.length) {
        str += '<span class="result-tags">';
        tags.slice(0, 3).forEach(function (t) {
          str += '<a class="tag" href="' + esc(t.url || '/tags/') + '" one-link-mark="yes">' + esc(t.label) + '</a>';
        });
        str += '</span>';
      }
      str += '</div><div class="result-arrow"><i class="anzhiyufont anzhiyu-icon-arrow-right"></i></div>';
      str += '</div></div></div>';
      return str;
    };

    /* 关键词高亮：传进来的 text 必须已经 esc 过，回调里直接回填命中原串 m
       （不能塞 keyword——keyword 是被 lower 过的，会把「Hugo」压成小写） */
    var highlight = function (text, keywords) {
      var out = text;
      keywords.forEach(function (keyword) {
        var regS = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        out = out.replace(regS, function (m) {
          return '<span class="search-keyword">' + m + '</span>';
        });
      });
      return out;
    };

    var performSearch = function (keywords) {
      var items = [];
      // Hugo .Plain 保留了渲染时的 HTML 实体（如 &#34;），先剥标签再解码，避免摘要显示实体码
      return dataObj.then(function (data) {
        data.forEach(function (entry) {
          var dataTitleRaw = entry.title ? String(entry.title) : '';
          var dataTitle = dataTitleRaw.trim().toLowerCase();
          var decoded = entry.content
            ? String(entry.content).trim().replace(/<[^>]+>/g, '')
              .replace(/&#34;/g, '"').replace(/&#39;/g, "'")
              .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
            : '';
          // 命中位置在小写串上算，展示用原串（官方摘要保留英文大小写）；
          // toLowerCase 对个别 Unicode 会改变长度，长度不等时退回小写串以免错位
          var dataContent = decoded.toLowerCase();
          var dataContentRaw = decoded.length === dataContent.length ? decoded : dataContent;
          var isMatch = dataTitle !== '' || dataContent !== '';
          var firstOccur = -1;
          if (isMatch) {
            keywords.forEach(function (keyword, i) {
              var indexTitle = dataTitle.indexOf(keyword);
              var indexContent = dataContent.indexOf(keyword);
              if (indexTitle < 0 && indexContent < 0) {
                isMatch = false;
              } else {
                if (indexContent < 0) indexContent = 0;
                if (i === 0) firstOccur = indexContent;
              }
            });
          }
          if (!isMatch) return;

          // 官方摘要口径：截取命中位置前后各约 30/100 字，两端按需要加省略号
          var start = firstOccur - 30;
          var end = firstOccur + 100;
          if (start < 0) start = 0;
          if (start === 0) end = 100;
          if (end > dataContent.length) end = dataContent.length;
          var snippet = dataContentRaw.substring(start, end);
          var pre = start > 0 ? '...' : '';
          var post = end < dataContent.length ? '...' : '';
          var entryForCard = {
            title: dataTitleRaw,
            url: entry.url,
            cover: entry.cover,
            date: entry.date,
            type: entry.type,
            tags: entry.tags
          };
          // 标题在原文上高亮（原版直接拿小写后的标题渲染，会把英文标题压成小写，这里修掉）
          var titleHtml = highlight(esc(dataTitleRaw), keywords);
          items.push({ entry: entryForCard, snippet: snippet, pre: pre, post: post, titleHtml: titleHtml });
        });

        if (!items.length) {
          // 官方 .noResults 两行文案（原版是「找不到您查询的内容：<关键字>」）
          $results.innerHTML = '<div class="no-results"><div class="no-results-text">未找到相关结果</div>' +
            '<div class="no-results-tip">尝试使用其他关键词或检查拼写</div></div>';
          return;
        }
        var str = '<div class="search-results">';
        str += '<div class="results-header"><span class="results-count">找到 ' + items.length + ' 条结果</span></div>';
        str += '<div class="results-list">';
        items.forEach(function (item) {
          str += buildItem(item.entry, keywords, item.pre + item.snippet + item.post, item.titleHtml);
        });
        str += '</div></div>';
        $results.innerHTML = str;
      });
    };

    // 结果卡整体可点（官方 onClick 挂在 .resultItem 上），标签胶囊自身是链接不拦截
    $results.addEventListener('click', function (e) {
      var tag = e.target.closest('.tag');
      if (tag) return;
      var item = e.target.closest('.result-item');
      if (item && item.getAttribute('data-url')) window.location.href = item.getAttribute('data-url');
    });

    $input.addEventListener('input', function () {
      var value = this.value;
      var trimmed = value.trim();
      // 官方：关键字为空时只剩快捷键提示，结果区整个撤掉
      if ($tips) $tips.style.display = trimmed ? 'none' : 'flex';
      if (!trimmed) {
        $results.innerHTML = '';
        return;
      }
      var keywords = trimmed.toLowerCase().split(/[\s]+/);
      if ($loadingDb) $loadingDb.remove();
      $results.innerHTML = '<div class="search-loading"><div class="search-loading-spinner"></div>' +
        '<div class="search-loading-text">搜索中...</div></div>';
      performSearch(keywords);
    });

    // 入口：导航搜索按钮 + 官方快捷键 Ctrl/⌘ + K 开、Esc 关
    var searchBtn = document.querySelector('#search-button > .search');
    if (searchBtn) searchBtn.addEventListener('click', openSearch);
    var menuSearch = document.getElementById('menu-search');
    if (menuSearch) menuSearch.addEventListener('click', openSearch);
    if ($closeBtn) $closeBtn.addEventListener('click', closeSearch);
    $mask.addEventListener('click', closeSearch);

    document.addEventListener('keydown', function (e) {
      var key = (e.key || '').toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'k') {
        e.preventDefault();
        if (!isOpen) openSearch();
        return;
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeSearch();
      }
    });

    // preload：与原版一致，进页面就取索引
    if (cfg.preload) dataObj = fetchData(cfg.path);
  });
})();
