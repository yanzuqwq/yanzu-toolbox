/* ============================================================
 * 彦祖工具箱 · 交互逻辑
 * 版本数据来自 assets/releases.js（window.RELEASES）
 * ============================================================ */

(function () {
  "use strict";

  var R = window.RELEASES || {};
  var $ = function (sel) { return document.querySelector(sel); };

  /* ---------- 轻提示 ---------- */
  var toastTimer = null;
  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  /* ---------- 渲染版本信息 ---------- */
  function renderRelease() {
    var v = "v" + (R.latest || "—");

    $("#hero-version").textContent = v;
    $("#nav-version").textContent = v;
    $("#dl-version-big").textContent = v;
    $("#hero-size").textContent = R.size || "—";

    // 事实清单：平台 / 日期 / 大小 / SHA-256
    var facts = $("#dl-facts");
    facts.innerHTML = "";
    [
      ["平台 / PLATFORM", R.platform || "—"],
      ["发布日期 / DATE", R.date || "—"],
      ["文件大小 / SIZE", R.size || "—"]
    ].forEach(function (pair) {
      var li = document.createElement("li");
      var k = document.createElement("span");
      k.textContent = pair[0];
      var val = document.createElement("b");
      val.textContent = pair[1];
      li.appendChild(k);
      li.appendChild(val);
      facts.appendChild(li);
    });
    var liSha = document.createElement("li");
    var kSha = document.createElement("span");
    kSha.textContent = "校验值 / SHA-256";
    var valSha = document.createElement("b");
    valSha.className = "sha-val";
    valSha.id = "sha-value";
    valSha.textContent = R.sha256 || "—";
    var btn = document.createElement("button");
    btn.className = "sha-copy";
    btn.id = "sha-copy";
    btn.type = "button";
    btn.textContent = "COPY";
    liSha.appendChild(kSha);
    liSha.appendChild(valSha);
    liSha.appendChild(btn);
    facts.appendChild(liSha);

    // 下载行（交错入场：每行比上一行晚 90ms 浮现）
    var box = $("#dl-rows");
    box.innerHTML = "";
    (R.downloads || []).forEach(function (d, i) {
      var a = document.createElement("a");
      a.className = "dl-row reveal" + (d.primary ? " primary" : "");
      a.style.transitionDelay = (i * 90) + "ms";
      a.href = d.url || "#";

      var ico = document.createElement("span");
      ico.className = "dl-row-ico";
      ico.innerHTML =
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><polyline points="6 11 12 17 18 11"/><path d="M4 21h16"/></svg>';

      var name = document.createElement("span");
      name.className = "dl-row-name";
      name.textContent = d.label;
      if (d.primary) {
        var tag = document.createElement("em");
        tag.className = "dl-row-tag";
        tag.textContent = "推荐";
        name.appendChild(document.createTextNode(" "));
        name.appendChild(tag);
      }

      var sub = document.createElement("span");
      sub.className = "dl-row-sub";
      sub.textContent = d.file || d.sub || "";

      var arrow = document.createElement("span");
      arrow.className = "dl-row-arrow";
      arrow.textContent = "→";

      a.appendChild(ico);
      a.appendChild(name);
      a.appendChild(sub);
      a.appendChild(arrow);

      if (!d.url || d.url === "#") {
        a.addEventListener("click", function (e) {
          e.preventDefault();
          toast("下载链接尚未配置 — 请在 assets/releases.js 中填写真实地址");
        });
      } else if (/^https?:/i.test(d.url)) {
        // 外链（网盘等）在新标签页打开
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      box.appendChild(a);
    });
  }

  /* ---------- 渲染更新日志 ---------- */
  function renderTimeline() {
    var box = $("#timeline");
    box.innerHTML = "";
    (R.history || []).forEach(function (item) {
      var row = document.createElement("div");
      row.className = "log-row reveal";

      var ver = document.createElement("span");
      ver.className = "log-ver";
      var sq = document.createElement("span");
      sq.className = "sq";
      sq.textContent = "■";
      ver.appendChild(sq);
      ver.appendChild(document.createTextNode("v" + item.version));
      if (item.tag) {
        var tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = item.tag;
        ver.appendChild(tag);
      }

      var date = document.createElement("span");
      date.className = "log-date";
      date.textContent = item.date;

      var ul = document.createElement("ul");
      ul.className = "log-notes";
      (item.notes || []).forEach(function (note) {
        var li = document.createElement("li");
        li.textContent = note;
        ul.appendChild(li);
      });

      row.appendChild(ver);
      row.appendChild(date);
      row.appendChild(ul);
      box.appendChild(row);
    });
  }

  /* ---------- 复制 SHA-256（事件委托，元素由 JS 生成） ---------- */
  function bindCopy() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("#sha-copy");
      if (!btn) return;
      var text = $("#sha-value").textContent;
      if (!text || text === "—") return;
      var done = function () {
        toast("SHA-256 已复制到剪贴板");
        btn.classList.add("copied");
        btn.textContent = "✓ 已复制";
        setTimeout(function () {
          btn.classList.remove("copied");
          btn.textContent = "COPY";
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
      } else {
        fallbackCopy(text, done);
      }
    });
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); }
    catch (e) { toast("复制失败，请手动选择复制"); }
    document.body.removeChild(ta);
  }

  /* ---------- 明暗主题切换（与软件的双主题呼应） ---------- */
  function bindTheme() {
    var root = document.documentElement;
    var saved = null;
    try { saved = localStorage.getItem("yz-theme"); } catch (e) {}
    if (saved) root.setAttribute("data-theme", saved);
    var btn = $("#theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "" : "light";
      if (next) root.setAttribute("data-theme", next);
      else root.removeAttribute("data-theme");
      try { localStorage.setItem("yz-theme", next || "dark"); } catch (e) {}
    });
  }

  /* ---------- 惯性倾斜（阻尼缓动，通用） ---------- */
  function makeTilt(el, opts) {
    var maxY = opts.maxY, maxX = opts.maxX, liftMax = opts.lift;
    var damp = opts.damp || 0.075;
    var perspective = opts.perspective || 0;   // 0 = 依赖父级 perspective
    var rx = 0, ry = 0, lift = 0;
    var tx = 0, ty = 0, tLift = 0;
    var raf = null;

    function frame() {
      rx += (tx - rx) * damp;
      ry += (ty - ry) * damp;
      lift += (tLift - lift) * damp;
      el.style.transform =
        (perspective ? "perspective(" + perspective + "px) " : "") +
        "rotateY(" + rx.toFixed(3) + "deg) rotateX(" + ry.toFixed(3) +
        "deg) translateY(" + lift.toFixed(2) + "px)";
      if (Math.abs(tx - rx) > 0.01 || Math.abs(ty - ry) > 0.01 || Math.abs(tLift - lift) > 0.01) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = null;
      }
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }

    el.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;   // 只响应鼠标
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 ~ 0.5
      var py = (e.clientY - r.top) / r.height - 0.5;
      tx = px * maxY;
      ty = -py * maxX;
      tLift = liftMax;
      kick();
    });
    el.addEventListener("pointerleave", function () {
      tx = 0; ty = 0; tLift = 0;
      kick();
    });
  }

  /* 首屏界面模型：大幅、缓慢 */
  function bindMockTilt() {
    var win = document.querySelector(".mock-window");
    if (win) makeTilt(win, { maxY: 10, maxX: 8, lift: -4, damp: 0.075 });
  }

  /* 功能卡片：小幅、跟手 */
  function bindCardTilt() {
    document.querySelectorAll(".feature").forEach(function (card) {
      makeTilt(card, { maxY: 6, maxX: 5, lift: -5, damp: 0.14, perspective: 700 });
    });
  }

  /* ---------- 回到顶部：滚动一段后浮现 ---------- */
  function bindToTop() {
    var btn = $("#to-top");
    if (!btn) return;
    var onScroll = function () {
      btn.classList.toggle("show", window.scrollY > 420);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- 入场动效（下滑浮现，上滑返回不重演） ---------- */
  function bindReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("visible"); el.classList.add("settled"); });
      return;
    }

    // 跟踪滚动方向
    var lastY = window.scrollY;
    var goingUp = false;
    window.addEventListener("scroll", function () {
      goingUp = window.scrollY < lastY;
      lastY = window.scrollY;
    }, { passive: true });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        if (entry.isIntersecting) {
          if (goingUp) {
            // 向上返回：瞬间到位，跳过动画
            clearTimeout(el._settleTimer);
            el.classList.add("visible");
            el.classList.add("settled");
            el.style.transitionDelay = "";
          } else {
            // 向下推进：正常浮现
            el.classList.add("visible");
            // 入场动画结束后移除过渡，避免拖慢悬停倾斜的逐帧更新
            var delayStr = el.style.transitionDelay || "0";
            var delay = delayStr.indexOf("ms") > -1 ? parseFloat(delayStr) : parseFloat(delayStr) * 1000;
            clearTimeout(el._settleTimer);
            el._settleTimer = setTimeout(function () {
              el.classList.add("settled");
              el.style.transitionDelay = "";
            }, 900 + delay);
          }
        } else {
          // 离开视野后复位
          el.classList.remove("visible");
          el.classList.remove("settled");
          el.style.transform = "";   // 清掉倾斜留下的内联 transform
          clearTimeout(el._settleTimer);
        }
      });
    }, { threshold: 0.1 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 启动 ---------- */
  renderRelease();
  renderTimeline();
  bindCopy();
  bindTheme();
  bindMockTilt();
  bindCardTilt();
  bindToTop();
  bindReveal();      // 放在渲染之后，保证动态生成的元素也有动效
  $("#year").textContent = new Date().getFullYear();
})();
