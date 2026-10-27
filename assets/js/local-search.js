/* 本地搜索（原版 source/js/search/local-search.js 移植）：
   数据源为 Hugo 首页附带的 /search.json；无 pjax，结果点击直接跳页；标签链接用索引内的真实 url */
(function () {
  var cfg = window.localSearchConfig || { path: '/search.json', preload: true, hitsEmpty: '找不到您查询的内容：' };
  var loadFlag = false;
  var dataObj = null;

  var animateIn = function (elem, animation) {
    elem.style.display = 'block';
    elem.style.animation = animation;
    elem.addEventListener('animationend', function handler() {
      elem.style.animation = '';
      elem.removeEventListener('animationend', handler);
    });
  };
  var animateOut = function (elem, animation) {
    elem.style.animation = animation;
    var finish = function () {
      elem.style.animation = '';
      elem.style.display = 'none';
      elem.removeEventListener('animationend', finish);
    };
    elem.addEventListener('animationend', finish);
    // 兜底：动画未触发（极端环境/标签页后台）时到时直接收起，与原版视觉一致
    setTimeout(finish, 600);
  };

  document.addEventListener('DOMContentLoaded', function () {
    var $searchMask = document.getElementById('search-mask');
    var $dialog = document.querySelector('#local-search .search-dialog');
    if (!$searchMask || !$dialog) return;

    var openSearch = function () {
      var bodyStyle = document.body.style;
      bodyStyle.width = '100%';
      bodyStyle.overflow = 'hidden';
      animateIn($searchMask, 'to_show 0.5s');
      animateIn($dialog, 'titleScale 0.5s');
      setTimeout(function () {
        var input = document.querySelector('#local-search-input input');
        if (input) input.focus();
      }, 100);
      if (!loadFlag) {
        search();
        loadFlag = true;
      }
      // shortcut: ESC
      document.addEventListener('keydown', function f(event) {
        if (event.code === 'Escape') {
          closeSearch();
          document.removeEventListener('keydown', f);
        }
      });
    };

    var closeSearch = function () {
      var bodyStyle = document.body.style;
      bodyStyle.width = '';
      bodyStyle.overflow = '';
      animateOut($dialog, 'search_close .5s');
      animateOut($searchMask, 'to_hide 0.5s');
    };

    var fetchData = async function (path) {
      var response = await fetch(path);
      var data = response.ok ? await response.json() : [];
      if (response.ok) {
        var $loadDataItem = document.getElementById('loading-database');
        if ($loadDataItem && $loadDataItem.nextElementSibling) {
          $loadDataItem.nextElementSibling.style.display = 'block';
          $loadDataItem.remove();
        }
      }
      return data;
    };

    var search = function () {
      if (!dataObj) dataObj = fetchData(cfg.path);
      var $input = document.querySelector('#local-search-input input');
      var $resultContent = document.getElementById('local-search-results');
      var $loadingStatus = document.getElementById('loading-status');

      // 摘要区点击跳页（原版为 pjax.loadUrl，移植版直接跳转）
      $resultContent.addEventListener('click', function (e) {
        var hit = e.target.closest('.search-result');
        if (hit && hit.getAttribute('data-url')) window.location.href = hit.getAttribute('data-url');
      });

      $input.addEventListener('input', function () {
        var keywords = this.value.trim().toLowerCase().split(/[\s]+/);
        if (keywords[0] !== '') {
          $loadingStatus.innerHTML = '<i class="anzhiyufont anzhiyu-icon-spinner anzhiyu-pulse-icon"></i>';
        }

        $resultContent.innerHTML = '';
        var str = '<div class="search-result-list">';
        if (keywords.length <= 0) return;
        var count = 0;
        // perform local searching
        dataObj.then(function (data) {
          data.forEach(function (data) {
            var isMatch = true;
            var dataTitle = data.title ? data.title.trim().toLowerCase() : '';
            var dataTags = data.tags || [];
            var oneImage = data.cover || '';
            // Hugo .Plain 保留了渲染时的 HTML 实体（如 &#34;），先剥标签再解码，避免摘要显示实体码
            var dataContent = data.content ? data.content.trim().replace(/<[^>]+>/g, '').replace(/&#34;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').toLowerCase() : '';
            var dataUrl = data.url.startsWith('/') ? data.url : (cfg.root || '/') + data.url;
            var indexTitle = -1;
            var indexContent = -1;
            var firstOccur = -1;
            // only match articles with not empty titles and contents
            if (dataTitle !== '' || dataContent !== '') {
              keywords.forEach(function (keyword, i) {
                indexTitle = dataTitle.indexOf(keyword);
                indexContent = dataContent.indexOf(keyword);
                if (indexTitle < 0 && indexContent < 0) {
                  isMatch = false;
                } else {
                  if (indexContent < 0) indexContent = 0;
                  if (i === 0) firstOccur = indexContent;
                }
              });
            } else {
              isMatch = false;
            }

            // show search results
            if (isMatch) {
              if (firstOccur >= 0) {
                // cut out 130 characters
                var start = firstOccur - 30;
                var end = firstOccur + 100;
                var pre = '';
                var post = '';

                if (start < 0) start = 0;
                if (start === 0) { end = 100; } else { pre = '...'; }
                if (end > dataContent.length) { end = dataContent.length; } else { post = '...'; }

                var matchContent = dataContent.substring(start, end);

                // highlight all keywords
                keywords.forEach(function (keyword) {
                  var regS = new RegExp(keyword, 'gi');
                  matchContent = matchContent.replace(regS, '<span class="search-keyword">' + keyword + '</span>');
                  dataTitle = dataTitle.replace(regS, '<span class="search-keyword">' + keyword + '</span>');
                });

                str += '<div class="local-search__hit-item">';
                if (oneImage) {
                  str += '<div class="search-left"><img src=' + oneImage + ' alt="' + dataTitle + '" data-fancybox="gallery">';
                  str += '</div>';
                  str += '<div class="search-right"><a href="' + dataUrl + '" class="search-result-title">' + dataTitle + '</a>';
                } else {
                  str += '<div class="search-left" style="width:0"></div>';
                  str += '<div class="search-right" style="width: 100%"><a href="' + dataUrl + '" class="search-result-title">' + dataTitle + '</a>';
                }

                count += 1;

                if (dataContent !== '') {
                  str += '<p class="search-result" data-url="' + dataUrl + '">' + pre + matchContent + post + '</p>';
                }
                if (dataTags.length) {
                  str += '<div class="search-result-tags">';
                  for (var i = 0; i < dataTags.length; i++) {
                    var element = dataTags[i];
                    str += '<a class="tag-list" href="' + (element.url || '/tags/') + '" one-link-mark="yes">#' + element.label + '</a>';
                  }
                  str += '</div>';
                }
              }
              str += '</div></div>';
            }
          });
          if (count === 0) {
            str += '<div id="local-search__hits-empty">' + (cfg.hitsEmpty || '找不到您查询的内容：') + this.value.trim() + '</div>';
          }
          str += '</div>';
          $resultContent.innerHTML = str;
          if (keywords[0] !== '') $loadingStatus.innerHTML = '';
        }.bind(this));
      });
    };

    // 入口：导航搜索按钮
    var searchBtn = document.querySelector('#search-button > .search');
    if (searchBtn) searchBtn.addEventListener('click', openSearch);
    var menuSearch = document.getElementById('menu-search');
    if (menuSearch) menuSearch.addEventListener('click', openSearch);
    document.querySelector('#local-search .search-close-button').addEventListener('click', closeSearch);
    $searchMask.addEventListener('click', closeSearch);

    // preload：与原版一致，预取索引
    if (cfg.preload) dataObj = fetchData(cfg.path);
  });
})();
