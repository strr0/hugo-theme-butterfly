---
title: "{{ replace (humanize (trim (path.BaseName .FilePath) "-_")) "-" " " }}"
date: {{ .Date }}
draft: true
tags: []
categories: []
cover: "/img/default_cover.jpg"
# top: true        # 首页置顶
# topGroup: true   # 加入首页顶部推荐卡组
# math: true       # 正文含 LaTeX 公式才打开（不开时 $$ … $$ 按原文显示）
description: ""
---

摘要内容……

<!--more-->

正文内容。
