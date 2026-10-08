/* ==========================================================================
   Chúc mừng sinh nhật · 生日快乐 — script.js
   --------------------------------------------------------------------------
   Toàn bộ tương tác của trang, viết bằng JavaScript thuần (không cần build).

   Triết lý: TRANG KHÔNG PHỤ THUỘC VÀO FILE NÀY.
   Toàn bộ nội dung (tiêu đề, ảnh, lá thư) đã nằm sẵn trong HTML và CSS.
   script.js chỉ THÊM hiệu ứng. Nếu file này không chạy, hoặc GSAP không tải
   được, trang vẫn hiển thị đầy đủ nội dung — chỉ mất phần chuyển động.

   Chỉ animate transform/opacity. Không dùng sự kiện cuộn (scroll) thủ công.
   ========================================================================== */
(function () {
  'use strict';

  var docEl = document.documentElement;

  // Người dùng có bật "giảm chuyển động" trong hệ điều hành không?
  // (giúp người bị chóng mặt / nhạy cảm với chuyển động)
  var reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Đánh dấu "JS đã chạy" -> CSS mới hiện bảng nhạc (.dock).
  // Nhờ vậy nếu file này lỗi, người xem không thấy một nút nhạc chết.
  docEl.classList.remove('no-js');
  docEl.classList.add('js', 'js-ready');

  function $(sel) { return document.querySelector(sel); }

  /* ======================================================================
     1. HIỆN DẦN KHI CUỘN
     ----------------------------------------------------------------------
     Dùng GSAP + ScrollTrigger. Class .gsap-ready chỉ được thêm SAU KHI GSAP
     tải xong, và chính class đó mới là thứ làm các khối .reveal mờ đi ban đầu.
     Nghĩa là: GSAP lỗi -> không có class -> mọi thứ vẫn hiện bình thường.
     ====================================================================== */
  (function revealOnScroll() {
    var reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;

    if (reduceMotion || !gsap || !ScrollTrigger) return; // để CSS lo phần hiện

    gsap.registerPlugin(ScrollTrigger);
    docEl.classList.add('gsap-ready');

    ScrollTrigger.batch(reveals, {
      once: true,
      start: 'top 88%',
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.09,
          overwrite: true,
          onComplete: function () {
            batch.forEach(function (el) { el.style.willChange = 'auto'; });
          }
        });
      }
    });

    // Lưới an toàn: nếu vì bất kỳ lý do gì sau 2,5 giây vẫn còn khối đang
    // nằm trong màn hình mà độ mờ = 0, ép hiện nó lên. Không bao giờ để
    // người xem nhìn vào một khoảng trắng.
    window.setTimeout(function () {
      var vh = window.innerHeight || docEl.clientHeight;
      Array.prototype.forEach.call(reveals, function (el) {
        var r = el.getBoundingClientRect();
        var inView = r.top < vh * 0.95 && r.bottom > 0;
        if (!inView) return;
        if (window.getComputedStyle(el).opacity === '0') {
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.willChange = 'auto';
        }
      });
    }, 2500);

    // Bóng bay lắc lư nhẹ. Lưu ý: bóng bay KHÔNG có animation transform nào
    // trong CSS, nên GSAP là nguồn duy nhất điều khiển transform của chúng.
    if (!reduceMotion) {
      gsap.to('.deco--balloon-a', { y: -16, duration: 3.6, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.to('.deco--balloon-b', { y: 12, duration: 4.4, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.5 });
    }
  }());

  /* ======================================================================
     2. PHÁO HOA TRÊN CANVAS (dải trời đêm)
     ----------------------------------------------------------------------
     Canvas chỉ chạy khi phần "Điều ước" đang nằm trong màn hình — không đốt
     CPU cho một khu vực người xem không nhìn thấy.
     ====================================================================== */
  var fireworks = (function () {
    var canvas = document.getElementById('fx');
    var section = document.getElementById('wish');
    if (!canvas || !section || reduceMotion) return { celebrate: function () {} };

    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return { celebrate: function () {} };

    var COLORS = ['#e44545', '#e5ae41', '#4cc9f3', '#f6d99a', '#fff1d6', '#ffffff'];
    var parts = [];
    var rafId = null;
    var visible = false;
    var pending = false;
    var w = 1, h = 1, dpr = 1;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = section.clientWidth || 1;
      h = section.clientHeight || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function burst(cx, cy, count, power) {
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = power * (0.28 + Math.random() * 0.72);
        parts.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - power * 0.16,
          life: 1,
          decay: 0.008 + Math.random() * 0.012,
          size: 1.1 + Math.random() * 2.3,
          color: COLORS[(Math.random() * COLORS.length) | 0]
        });
      }
    }

    function frame() {
      // Mờ dần khung trước đó để tạo vệt sáng, rồi vẽ đè bằng chế độ cộng sáng.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.vy += 0.035;        // trọng lực
        p.vx *= 0.985;        // ma sát không khí
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0 || p.y > h + 40) { parts.splice(i, 1); continue; }

        ctx.globalAlpha = Math.max(p.life, 0) * 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + p.life * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (parts.length && visible) {
        rafId = window.requestAnimationFrame(frame);
      } else {
        rafId = null;
        if (!parts.length) ctx.clearRect(0, 0, w, h);
      }
    }

    function ensureLoop() {
      if (rafId === null && parts.length && visible) {
        rafId = window.requestAnimationFrame(frame);
      }
    }

    function celebrate() {
      if (!visible) { pending = true; return; }
      resize();
      var cx, cy;
      for (var k = 0; k < 3; k++) {
        cx = w * (0.2 + Math.random() * 0.6);
        cy = h * (0.16 + Math.random() * 0.34);
        burst(cx, cy, 46 + ((Math.random() * 26) | 0), 4.6 + Math.random() * 3.2);
      }
      ensureLoop();
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          visible = entry.isIntersecting;
          if (visible && pending) { pending = false; celebrate(); }
          ensureLoop();
        });
      }, { threshold: 0.08 }).observe(section);
    } else {
      visible = true;
    }

    return { celebrate: celebrate };
  }());

  /* ======================================================================
     3. CHIẾC BÁNH — thổi nến / thắp lại
     ====================================================================== */
  (function cake() {
    var btn = document.getElementById('cakeBtn');
    var cta = document.getElementById('cakeCta');
    var status = document.getElementById('wishStatus');
    if (!btn) return;

    function say(msg) { if (status) status.textContent = msg; }

    btn.addEventListener('click', function () {
      var blown = btn.classList.toggle('is-blown');
      btn.setAttribute('aria-pressed', blown ? 'true' : 'false');
      if (cta) cta.textContent = blown ? '再吹一次 🕯️' : '吹蜡烛';

      if (blown) {
        say('愿望已经送出。祝你新的一年里快乐又平安。');
        fireworks.celebrate();
      } else {
        say('蜡烛又亮起来了，你可以再许一个愿望。');
      }
    });
  }());

  /* ======================================================================
     4. LÁ THƯ — mở phong bì, hiện chữ dần, có thể bỏ qua
     ----------------------------------------------------------------------
     Khác bản gốc ở ba điểm:
       • không chờ 4 giây vô ích trước khi bắt đầu;
       • tốc độ nhanh hơn nhiều và có nút "Hiện toàn bộ";
       • đóng được bằng nút, bằng phím Esc, và bằng cách bấm ra ngoài.
     Toàn bộ chữ Hán lấy nguyên văn từ HTML, chỉ hiện dần chứ không sửa.
     ====================================================================== */
  (function letter() {
    var box = document.getElementById('letterbox');
    var card = document.getElementById('lettercard');
    var body = document.getElementById('letterBody');
    var closeBtn = document.getElementById('letterClose');
    var skipBtn = document.getElementById('letterSkip');
    var progress = document.getElementById('letterProgress');
    if (!box || !body) return;

    // Bật chế độ "có JS": các nút đóng / bỏ qua chỉ có ý nghĩa khi JS chạy.
    box.classList.add('is-enhanced');

    var fullHTML = body.innerHTML;
    var tokens = tokenize(body);
    var typing = false;
    var started = false;
    var idx = 0;
    var timer = null;
    var currentP = null;
    var lastPct = -1;
    var returnFocusTo = null;

    // Biến nội dung HTML thành danh sách "viên gạch" để gõ lần lượt:
    // từng ký tự, từng thẻ <br>, và mỗi đoạn văn là một viên gạch ngắt đoạn.
    function tokenize(root) {
      var list = [];
      var paragraphs = root.querySelectorAll('p');
      Array.prototype.forEach.call(paragraphs, function (p, pIndex) {
        if (pIndex > 0) list.push({ k: 'p' });
        Array.prototype.forEach.call(p.childNodes, function (node) {
          if (node.nodeType === 3) {
            var text = node.nodeValue;
            for (var i = 0; i < text.length; i++) list.push({ k: 'c', v: text.charAt(i) });
          } else if (node.nodeType === 1 && node.nodeName === 'BR') {
            list.push({ k: 'b' });
          } else if (node.nodeType === 1) {
            list.push({ k: 'n', v: node.cloneNode(true) }); // phòng trường hợp có thẻ lạ
          }
        });
      });
      return list;
    }

    function setProgress(ratio, finished) {
      if (!progress) return;
      if (finished) {
        if (lastPct !== 100) { progress.textContent = '信已经写完了。'; lastPct = 100; }
        return;
      }
      var pct = Math.floor(ratio * 100 / 10) * 10; // cập nhật từng 10% cho khỏi ồn
      if (pct === lastPct) return;
      lastPct = pct;
      progress.textContent = '正在书写… ' + pct + '%';
    }

    function scrollToEnd() {
      try { body.scrollTop = body.scrollHeight; } catch (e) { /* bỏ qua */ }
    }

    function finish() {
      if (timer) { window.clearTimeout(timer); timer = null; }
      if (finished()) return;
      typing = false;
      body.innerHTML = fullHTML;          // khôi phục nguyên văn, không thiếu chữ nào
      body.classList.remove('is-typing');
      if (skipBtn) skipBtn.hidden = true;
      setProgress(1, true);
    }

    function finished() {
      return !typing && lastPct === 100;
    }

    function step() {
      if (idx >= tokens.length) { finish(); return; }

      var token = tokens[idx++];
      var extraDelay = 0;

      if (token.k === 'c') {
        currentP.appendChild(document.createTextNode(token.v));
      } else if (token.k === 'b') {
        currentP.appendChild(document.createElement('br'));
        extraDelay = 70;                  // nghỉ một nhịp ở chỗ xuống dòng
      } else if (token.k === 'p') {
        currentP = document.createElement('p');
        body.appendChild(currentP);
        extraDelay = 160;                 // nghỉ lâu hơn giữa hai đoạn
      } else {
        currentP.appendChild(token.v);
      }

      scrollToEnd();
      if (idx % 4 === 0 || idx === tokens.length) setProgress(idx / tokens.length, false);

      // Tốc độ: nhanh hơn bản gốc (50ms/ký tự) rất nhiều — khoảng 15ms/ký tự.
      var base = Math.max(9, 26 - tokens.length / 26);
      timer = window.setTimeout(step, base + extraDelay);
    }

    function start() {
      if (started) return;
      started = true;

      if (reduceMotion) {                  // không gõ chữ: hiện thẳng toàn bộ
        setProgress(1, true);
        if (skipBtn) skipBtn.hidden = true;
        return;
      }

      typing = true;
      body.innerHTML = '';
      body.classList.add('is-typing');
      currentP = document.createElement('p');
      body.appendChild(currentP);
      idx = 0;
      lastPct = -1;
      if (skipBtn) skipBtn.hidden = false;
      setProgress(0, false);
      step();
    }

    function close() { if (box.open) box.open = false; }

    box.addEventListener('toggle', function () {
      if (box.open) {
        returnFocusTo = document.activeElement;
        document.body.classList.add('has-modal');
        start();
        var target = (closeBtn && closeBtn.offsetParent !== null) ? closeBtn : body;
        try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
      } else {
        document.body.classList.remove('has-modal');
        if (typing) finish();              // đóng giữa chừng thì hoàn tất luôn, không mất chữ
        if (returnFocusTo && returnFocusTo.focus) {
          try { returnFocusTo.focus({ preventScroll: true }); } catch (e) { returnFocusTo.focus(); }
        }
        returnFocusTo = null;
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.preventDefault(); close(); });
    if (skipBtn) skipBtn.addEventListener('click', function (e) { e.preventDefault(); finish(); });

    // Bấm ra vùng nền tối (ngoài tờ giấy) để đóng
    if (card) card.addEventListener('click', function (e) { if (e.target === card) close(); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.open) close();
    });
  }());

  /* ======================================================================
     5. NHẠC NỀN
     ----------------------------------------------------------------------
     Trình duyệt chỉ cho phát nhạc sau một cú bấm của người dùng, nên nhạc
     KHÔNG tự chạy. Đường dẫn được đặt tương đối (nhac1.mp3) để trang chạy
     được cả khi mở trực tiếp từ ổ đĩa hoặc trên tên miền khác bản gốc.
     ====================================================================== */
  (function music() {
    var audio = document.getElementById('audio');
    var playBtn = document.getElementById('playBtn');
    var trackBtn = document.getElementById('trackBtn');
    var playLabel = document.getElementById('playLabel');
    var status = document.getElementById('musicStatus');
    if (!audio || !playBtn) return;

    var TRACKS = [
      { src: 'nhac1.mp3', name: '音乐 1' },
      { src: 'nhac_cmsn.mp3', name: '生日快乐歌' }
    ];
    var index = 0;
    var ready = false;

    function say(msg) { if (status) status.textContent = msg; }

    function setPlaying(isPlaying) {
      playBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      if (playLabel) playLabel.textContent = isPlaying ? '暂停' : '播放音乐';
    }

    function load(i) {
      index = i;
      audio.src = TRACKS[index].src;
      ready = true;
      audio.load();
    }

    function fadeIn() {
      audio.volume = 0;
      var target = 0.85;
      var fade = window.setInterval(function () {
        audio.volume = Math.min(target, audio.volume + 0.07);
        if (audio.volume >= target) window.clearInterval(fade);
      }, 70);
    }

    playBtn.addEventListener('click', function () {
      if (!ready) { load(index); fadeIn(); }
      if (audio.paused) {
        var promise = audio.play();
        if (promise && promise.catch) {
          promise.catch(function () {
            setPlaying(false);
            say('浏览器暂时不让播放音乐，请再点一次。');
          });
        }
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play', function () {
      setPlaying(true);
      if (trackBtn) trackBtn.hidden = false;
      say('正在播放：' + TRACKS[index].name + '。');
    });

    audio.addEventListener('pause', function () {
      setPlaying(false);
      say('音乐已暂停。');
    });

    audio.addEventListener('error', function () {
      setPlaying(false);
      say('打不开音乐文件 “' + TRACKS[index].src + '”。');
    });

    if (trackBtn) {
      trackBtn.addEventListener('click', function () {
        var wasPlaying = !audio.paused;
        load((index + 1) % TRACKS.length);
        say('正在播放：' + TRACKS[index].name + '。');
        if (wasPlaying) {
          var promise = audio.play();
          if (promise && promise.catch) promise.catch(function () { setPlaying(false); });
        }
      });
    }

    setPlaying(false);
    say('音乐只在你点击按钮后才播放。');
  }());

  /* ======================================================================
     6. NHỎ NHẶT
     ====================================================================== */
  // Nếu người dùng đổi cài đặt "giảm chuyển động" giữa chừng, tải lại trang
  // là cách đơn giản và chắc chắn nhất để mọi thứ nhất quán.
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    var onChange = function () { window.location.reload(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
}());
