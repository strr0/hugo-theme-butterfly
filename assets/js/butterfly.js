/**
 * Butterfly Hugo Port 轻量脚本
 * 覆盖首页交互：滚动百分比、深色模式切换、副标题打字机、
 * 返回顶部、随机文章、移动端菜单、右下角按钮显隐、运行时间统计
 * （导航本体常驻 fixed，向下滚动只做「中部菜单淡出 + 页面名进场」与回顶按钮显隐）
 */

// ---------- 深色模式 ----------
function switchTheme() {
  var html = document.documentElement;
  var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon();
}
function updateThemeIcon() {
  // 原版图标库中没有 sun，与原版一致固定使用 moon
  document.querySelectorAll('#toggle-mode i').forEach(function (el) {
    el.className = 'anzhiyufont anzhiyu-icon-moon';
  });
}

// ---------- 滚动相关 ----------
function getHeaderHeight() {
  var header = document.getElementById('page-header');
  return header ? header.offsetHeight : 0;
}

// ---------- 滚动处理（移植原版 main.js scrollTask：节流） ----------
function throttle(fn, wait) {
  var timer = null;
  var pending = null;
  function invoke(ctx, args) {
    fn.apply(ctx, args);
    timer = setTimeout(function () {
      timer = null;
      // 尾沿补跑：窗口期内被丢弃的最后一次调用补执行一次，避免停止滚动后停在旧值（按钮显隐/百分比不准的根因）
      if (pending) { var p = pending; pending = null; invoke(p.ctx, p.args); }
    }, wait);
  }
  return function () {
    if (timer) { pending = { ctx: this, args: arguments }; return; }
    invoke(this, arguments);
  };
}

// 回顶按钮（官方 HeaderRight + scroll-store）：footer 进入视口时拉长并显示“返回顶部”，
// 否则显示滚动百分比数字（官方 String(scrollPercent)，不带 %）；scrollableHeight>10 且 scrollY>1 才计入
var updatePercent = function (currentTop) {
  var percentEl = document.getElementById('percent');
  var totopEl = document.getElementById('nav-totop');
  if (!percentEl || !totopEl) return;
  var total = document.documentElement.scrollHeight - window.innerHeight;
  var percent = (total > 10 && currentTop > 1) ? Math.round((currentTop / total) * 100) : 0;
  var footer = document.getElementById('footer');
  var footerVisible = !!footer && (currentTop + window.innerHeight >= footer.offsetTop);
  totopEl.classList.toggle('long', footerVisible);
  percentEl.textContent = footerVisible ? '返回顶部' : String(percent);
};

// 上一次滚动位置，用于判定方向（官方 _lastScrollY，每个节流周期更新一次）
var lastTop = 0;

var scrollTask = throttle(function () {
  var currentTop = Math.max(0, window.scrollY || document.documentElement.scrollTop);

  var header = document.getElementById('page-header');
  if (header) {
    // 离开顶部即显示回顶按钮（官方 showToTopButton = !isAtTop，即 scrollY > 0）
    header.classList.toggle('has-scroll', currentTop > 0);
    // 官方 isScrolled = scrollY > 60 且本次比上次更低（向下滚）：菜单上移淡出、页面名进场；
    // 向上滚动则 isScrolled=false，菜单与页面名反向复原
    header.classList.toggle('nav-menu-scrolled', currentTop > 60 && currentTop > lastTop);
  }
  lastTop = currentTop;

  updatePercent(currentTop);

  // 目录高亮（原版 scrollFnToDo 同一节流框架内执行）
  findHeadPosition(currentTop);

  // 右下角按钮显隐
  var rightside = document.getElementById('rightside');
  if (rightside) rightside.classList.toggle('rightside-show', currentTop > 300);
}, 96);

function onScroll() { scrollTask(); }

function scrollToTop() { scrollToDest(0, 500); }
function scrollToContent() {
  var target = document.getElementById('home_top') || document.getElementById('content-inner');
  if (target) scrollToDest(target.offsetTop - 60, 500);
}
function scrollToDest(pos, time) {
  var start = window.scrollY;
  var distance = pos - start;
  var startTime = null;
  function step(ts) {
    if (!startTime) startTime = ts;
    var progress = Math.min((ts - startTime) / time, 1);
    var ease = 0.5 - Math.cos(progress * Math.PI) / 2;
    window.scrollTo(0, start + distance * ease);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ---------- 随机文章（随便逛逛） ----------
function toRandomPost() {
  if (typeof postList !== 'undefined' && postList.length > 0) {
    location.href = postList[Math.floor(Math.random() * postList.length)];
  }
}

// ---------- 副标题打字机 ----------
function initSubtitle() {
  var el = document.getElementById('subtitle');
  if (!el || typeof butterflyConfig === 'undefined') return;
  var lines = (butterflyConfig.subtitleLines || []).filter(Boolean);
  if (lines.length === 0) return;
  var lineIdx = 0, charIdx = 0, deleting = false;
  (function tick() {
    var text = lines[lineIdx];
    if (!deleting) {
      charIdx++;
      el.textContent = text.slice(0, charIdx);
      if (charIdx === text.length) {
        deleting = true;
        setTimeout(tick, 2500);
        return;
      }
      setTimeout(tick, 120);
    } else {
      charIdx--;
      el.textContent = text.slice(0, charIdx);
      if (charIdx === 0) {
        deleting = false;
        lineIdx = (lineIdx + 1) % lines.length;
      }
      setTimeout(tick, 60);
    }
  })();
}

// ---------- 移动端菜单 ----------
function initToggleMenu() {
  var btn = document.getElementById('toggle-menu');
  var menus = document.getElementById('menus');
  if (!btn || !menus) return;
  btn.addEventListener('click', function () {
    menus.classList.toggle('menus-show');
  });
  // 点击菜单项后自动收起
  menus.addEventListener('click', function (e) {
    if (e.target.closest('a')) menus.classList.remove('menus-show');
  });
}

// ---------- 建站天数（原版 main.js addRuntime：读 data-publishDate，显示“X 天”） ----------
function initRunTime() {
  var el = document.getElementById('webinfo-runtime');
  if (!el) return;
  var publishDate = el.getAttribute('data-publishDate');
  if (!publishDate) return;
  var start = new Date(publishDate.replace(/-/g, '/'));
  if (isNaN(start.getTime())) return;
  var days = parseInt(Math.abs(Date.now() - start.getTime()) / 1000 / 60 / 60 / 24);
  el.textContent = days + ' 天';
}

// ---------- todayCard 收起（与原版一致：加 .hide 淡出，鼠标离开 topGroup 后恢复） ----------
function hideTodayCard() {
  var card = document.getElementById('todayCard');
  if (card) card.classList.add('hide');
}
function mouseleaveHomeCard() {
  var topGroup = document.querySelector('.topGroup');
  if (!topGroup) return;
  topGroup.addEventListener('mouseleave', function () {
    var card = document.getElementById('todayCard');
    if (card) {
      card.classList.remove('hide');
      card.style.zIndex = '1';
    }
  });
}

// ---------- 首页分类导航条（官方预览站 blog.anheyu.com：列表溢出才出现翻页按钮，滚到末端箭头翻转） ----------
function scrollCategoryBarToRight() {
  var items = document.getElementById('catalog-list');
  if (!items) return;
  var atEnd = items.scrollLeft + items.clientWidth + 1 >= items.scrollWidth;
  // 已在最右侧则回到开头，否则翻一页（官方 .isRotated 同款行为）
  items.scroll({ left: atEnd ? 0 : items.scrollLeft + items.clientWidth, behavior: 'smooth' });
}
// 分类全部能放下时不渲染按钮（官方站该元素直接不存在），溢出时才显示
function updateCategoryBarNext() {
  var items = document.getElementById('catalog-list');
  var btn = document.getElementById('category-bar-next');
  if (!items || !btn) return;
  var overflow = items.scrollWidth - items.clientWidth > 1;
  btn.style.display = overflow ? 'flex' : 'none';
  var atEnd = items.scrollLeft + items.clientWidth + 1 >= items.scrollWidth;
  btn.classList.toggle('is-rotated', overflow && atEnd);
}
// 分类条当前项高亮（原 categoriesBarActive）已改由 partials/category_bar.html 在构建期直接输出 .select：
// JS 拿 URL 段查 id="分类标题" 的口径不成立（Hugo 会把 term URL 小写化），且首页判定条件对未编码地址恒真。

// ---------- 首页「即刻」说说条（官方 EssayBar：每 3s 上移一条，行高 30px，到底后回到第一条） ----------
function initEssayCarousel() {
  var box = document.getElementById('essay-carousel');
  if (!box) return;
  var total = box.children.length;
  if (total < 2) return;
  var idx = 0;
  setInterval(function () {
    idx = (idx + 1) % total;
    box.style.transform = 'translateY(-' + idx * 30 + 'px)';
  }, 3000);
}

// ---------- 文章目录卡（移植原版 main.js scrollFnToDo toc 部分 + rightSideFn.mobile-toc-button） ----------
var tocState = { layout: null, content: null, links: null, isExpand: false, detectIndex: '' };
function initToc() {
  var cardLayout = document.getElementById('card-toc');
  if (!cardLayout) return;
  tocState.layout = cardLayout;
  tocState.content = cardLayout.querySelector('.toc-content');
  tocState.links = tocState.content.querySelectorAll('a');
  tocState.isExpand = tocState.content.classList.contains('is-expand');
  // 点击目录项：平滑滚动到标题（原版 -60 偏移），移动端点完收起抽屉
  tocState.content.addEventListener('click', function (e) {
    var target = e.target.closest('a');
    if (!target) return;
    var href = target.getAttribute('href') || '';
    if (href.charAt(0) !== '#') return;
    e.preventDefault();
    var el = document.getElementById(decodeURI(href.replace('#', '')));
    if (el) scrollToDest(el.getBoundingClientRect().top + (window.scrollY || document.documentElement.scrollTop) - 60, 300);
    if (window.innerWidth < 1200) cardLayout.classList.remove('open');
  });
}
function toggleToc(btn) {
  var card = document.getElementById('card-toc');
  if (!card) return;
  card.style.transformOrigin = 'right ' + (btn.getBoundingClientRect().top + 17) + 'px';
  card.style.transition = 'transform 0.3s ease-in-out';
  card.classList.toggle('open');
}
// 滚动时定位当前标题并高亮目录项（对应原版 findHeadPosition，TOC 深度同 markup.tableOfContents h2-h3）
function findHeadPosition(top) {
  if (!tocState.links || top === 0) return;
  var list = document.querySelectorAll('#article-container h2, #article-container h3');
  var scrollY = window.scrollY || document.documentElement.scrollTop;
  var currentId = '';
  var currentIndex = '';
  Array.prototype.forEach.call(list, function (ele, index) {
    if (ele.id === 'CrawlerTitle') return;
    if (top > ele.getBoundingClientRect().top + scrollY - 80) {
      currentId = ele.id ? '#' + ele.id : '';
      currentIndex = index;
    }
  });
  if (tocState.detectIndex === currentIndex) return;
  tocState.detectIndex = currentIndex;
  tocState.content.querySelectorAll('.active').forEach(function (i) { i.classList.remove('active'); });
  if (!currentId) return;
  var currentActive = tocState.links[currentIndex];
  if (!currentActive) return;
  currentActive.classList.add('active');
  // 目录列表自滚动：活跃项超出可视区则滚动 150px（原版 autoScrollToc）
  var activePosition = currentActive.getBoundingClientRect().top;
  var sidebarScrollTop = tocState.content.scrollTop;
  if (activePosition > document.documentElement.clientHeight - 100) tocState.content.scrollTop = sidebarScrollTop + 150;
  if (activePosition < 100) tocState.content.scrollTop = sidebarScrollTop - 150;
  if (tocState.isExpand) return;
  // 折叠态下逐级点亮父 li，让子链可见（CSS li.active > ul 展开）
  var parent = currentActive.parentNode;
  for (; parent && !parent.matches('.toc-content'); parent = parent.parentNode) {
    if (parent.matches('li')) parent.classList.add('active');
  }
}

// ---------- 作者卡片问候气泡（原版 utils.js sayhi / changeSayHelloText） ----------
function getTimeState() {
  var hour = new Date().getHours();
  if (hour >= 0 && hour <= 5) return '睡个好觉，保证精力充沛';
  if (hour > 5 && hour <= 10) return '一日之计在于晨';
  if (hour > 10 && hour <= 14) return '吃饱了才有力气干活';
  if (hour > 14 && hour <= 18) return '集中精力，攻克难关';
  return '不要太劳累了，早睡更健康';
}
function changeSayHelloText() {
  var el = document.getElementById('author-info__sayhi');
  if (!el) return;
  var greetings = window.authorStatusSkills || [];
  if (!greetings.length) return;
  if (greetings.length === 1) { el.textContent = greetings[0]; return; }
  var last = el.textContent, next = last;
  while (next === last) next = greetings[Math.floor(Math.random() * greetings.length)];
  el.textContent = next;
}

document.addEventListener('DOMContentLoaded', function () {
  window.addEventListener('scroll', onScroll, { passive: true });
  scrollTask();
  updateThemeIcon();
  initSubtitle();
  initToggleMenu();
  initRunTime();
  mouseleaveHomeCard();
  updateCategoryBarNext();
  var catalogList = document.getElementById('catalog-list');
  if (catalogList) {
    catalogList.addEventListener('scroll', updateCategoryBarNext, { passive: true });
    window.addEventListener('resize', updateCategoryBarNext);
    window.addEventListener('load', updateCategoryBarNext);
  }
  initToc();
  initEssayCarousel();
  var $sayhi = document.getElementById('author-info__sayhi');
  if ($sayhi) $sayhi.textContent = getTimeState();
});

