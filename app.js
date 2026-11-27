(function () {
  'use strict';
  var CFG = window.RIWAQ || {};
  var API = (CFG.SUPABASE_URL || '').replace(/\/$/, '');
  var KEY = CFG.SUPABASE_ANON_KEY || '';
  var KINDS = [['lectures', 'المحاضرات'], ['summaries', 'الملخصات'], ['exams', 'الامتحانات']];

  // Hierarchy from the 23 Riwaq exam timetables: stage > (track, advanced only) > level > subject > (madhhab, for fiqh madhhabi only).
  var MADH = ['حنفي', 'شافعي', 'حنبلي', 'مالكي'];
  var LV = ['', 'المستوى الأول', 'المستوى الثاني', 'المستوى الثالث', 'المستوى الرابع'];
  var DATA = [{"id": "s1", "name": "المرحلة التمهيدية", "levels": {"1": ["قرآن وتجويد", "فقه مذهبي", "تفسير", "نحو وصرف", "عقيدة وتصوف", "حديث"], "2": ["عقيدة وتصوف", "فقه مذهبي", "تاريخ تشريع", "نحو وصرف", "علوم قرآن", "مصطلح حديث", "سيرة"]}}, {"id": "s2", "name": "المرحلة المتوسطة", "levels": {"1": ["فقه مذهبي", "حديث", "تفسير", "عقيدة", "قرآن كريم", "أدب"], "2": ["أصول فقه", "فقه مذهبي", "فرق ومذاهب", "قضايا فكرية معاصرة", "بلاغة", "تاريخ الحضارة", "تصوف"]}}, {"id": "s3", "name": "المرحلة المتقدمة", "tracks": [{"id": "fq", "name": "شعبة الفقه", "levels": {"1": ["قرآن كريم وتجويد", "فقه مقارن", "تفسير آيات الأحكام", "أصول فقه", "عقيدة", "فقه مذهبي", "أحاديث الأحكام", "قضايا فقهية"], "2": ["فقه مذهبي", "أصول فقه", "قضايا فقهية معاصرة", "أدب المفتي والمستفتي", "تفسير آيات الأحكام", "فقه مقارن", "تصوف", "أحاديث الأحكام"], "3": ["فقه مذهبي", "فقه مقارن", "أحوال شخصية", "تفسير آيات الأحكام", "مناهج بحث فقهي", "أحاديث الأحكام", "أصول فقه", "قضايا فقهية معاصرة", "منطق"], "4": ["فقه مذهبي", "فقه المواريث", "فقه مقارن", "قواعد فقهية", "مقاصد الشريعة", "علم الاجتماع", "نحو"]}}, {"id": "aq", "name": "شعبة العقيدة", "levels": {"1": ["قرآن كريم وتجويد", "فقه مقارن", "فرق ومذاهب", "ملل ونحل", "عقيدة", "منطق", "علوم قرآن"], "2": ["عقيدة", "فلسفة", "منطق", "ملل ونحل", "سيرة", "تصوف", "فرق ومذاهب"], "3": ["منهجية الرد على الشبهات", "عقيدة", "تيارات فكرية معاصرة", "منطق", "ملل ونحل", "تفسير"], "4": ["عقيدة", "منهجية التفكير النقدي", "منطق", "ملل ونحل", "نحو", "تيارات فكرية"]}}, {"id": "tf", "name": "شعبة التفسير والحديث", "levels": {"1": ["قرآن كريم وتجويد", "علوم قرآن", "تفسير تحليلي", "فقه مقارن", "مناهج مفسرين", "عقيدة", "حديث تحليلي", "تفسير موضوعي"], "2": ["بلاغة", "شبهات حول القرآن الكريم", "حديث تحليلي", "مناهج مفسرين", "تفسير تحليلي", "تفسير موضوعي", "سيرة", "تصوف", "علوم قرآن"], "3": ["جرح وتعديل", "دفاع عن السنة", "حديث تحليلي", "مناهج محدثين", "تخريج", "مصطلح حديث", "تفسير تحليلي"], "4": ["دراسة الأسانيد", "دفاع عن السنة", "حديث تحليلي", "مناهج محدثين", "جرح وتعديل", "مصطلح حديث", "نحو", "تفسير تحليلي"]}}, {"id": "ar", "name": "شعبة اللغة العربية", "levels": {"1": ["قرآن كريم وتجويد", "صرف", "تطبيقات إعرابية", "عقيدة", "تفسير", "نحو", "أدب"], "2": ["تطبيقات إعرابية", "نحو", "صرف", "بلاغة", "أصول لغة", "أدب", "سيرة"], "3": ["تطبيقات إعرابية", "نحو", "فقه مقارن", "عروض", "بلاغة", "مناهج بحث لغوي"], "4": ["نحو وصرف", "تطبيقات إعرابية", "مناهج البحث النحوي", "بلاغة", "تصوف", "منطق"]}}, {"id": "gn", "name": "الشعبة العامة", "levels": {"1": ["فقه مذهبي", "أصول فقه", "نحو", "تفسير آيات الأحكام", "فرق ومذاهب", "علوم قرآن", "مصطلح حديث", "تجويد", "عقيدة"], "2": ["فقه مذهبي", "فقه مقارن", "حديث", "نحو", "عقيدة", "ملل ونحل", "أصول فقه", "تفسير", "علوم قرآن"], "3": ["فقه مذهبي", "حديث تحليلي", "تيارات فكرية", "عقيدة", "نحو", "بلاغة", "فقه مقارن", "قضايا فقهية معاصرة", "تفسير موضوعي"]}}]}];
  var stageNote = { s3: 'اختاري الشعبة الأول، وبعدها المستوى.' };
  var mkSubjects = function (pid, list) { return list.map(function (name, i) { var id = pid + '-s' + i; var n = { id: id, name: name, subject: true }; if (name === 'فقه مذهبي') n.children = MADH.map(function (m, j) { return { id: id + '-m' + j, name: m, subject: true }; }); return n; }); };
  var mkLevels = function (pid, levels) { return Object.keys(levels).map(function (k) { return { id: pid + '-l' + k, name: LV[+k], children: mkSubjects(pid + '-l' + k, levels[k]) }; }); };
  var stages = DATA.map(function (s) {
    var o = { id: s.id, name: s.name };
    o.children = s.tracks ? s.tracks.map(function (t) { return { id: s.id + '-' + t.id, name: t.name, children: mkLevels(s.id + '-' + t.id, t.levels) }; }) : mkLevels(s.id, s.levels);
    return o;
  });
  var all = [], byId = {};
  stages.forEach(function (s) { (function walk(n, p) { n.parent = p; all.push(n); byId[n.id] = n; (n.children || []).forEach(function (c) { walk(c, n); }); })(s, null); });
  var crumb = function (n) { var o = []; for (var p = n.parent; p; p = p.parent) o.push(p.name); return o.join(' · '); };
  var searchable = all.filter(function (n) { return n.subject; });

  function h(tag, attrs) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null) continue; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }
    return e;
  }

  // ---- data (Supabase REST; readers need no account) ----
  var session = null;
  try { session = JSON.parse(localStorage.getItem('riwaq.session') || 'null'); } catch (e) {}
  function saveSession(s) { session = s; try { if (s) localStorage.setItem('riwaq.session', JSON.stringify(s)); else localStorage.removeItem('riwaq.session'); } catch (e) {} }
  function enabled() { return !!(API && KEY); }
  function hdr(auth) { var x = { apikey: KEY, 'Content-Type': 'application/json' }; x.Authorization = 'Bearer ' + (auth && session ? session.access_token : KEY); return x; }
  function refresh() {
    if (!session || !session.refresh_token) return Promise.reject(new Error('no session'));
    return fetch(API + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: session.refresh_token }) })
      .then(function (r) { if (!r.ok) throw new Error('expired'); return r.json(); }).then(function (j) { saveSession(j); });
  }
  function call(path, opts, auth) {
    opts = opts || {}; opts.headers = Object.assign(hdr(auth), opts.headers || {});
    return fetch(API + path, opts).then(function (r) {
      if (r.status === 401 && auth && session) return refresh().then(function () { opts.headers = Object.assign(opts.headers, hdr(true)); return fetch(API + path, opts); });
      return r;
    });
  }
  var cache = {};
  function loadItems(subjectId, kind) {
    if (!enabled()) return Promise.resolve([]);
    return call('/rest/v1/materials?subject_id=eq.' + encodeURIComponent(subjectId) + '&kind=eq.' + kind + '&select=id,title,detail,url,created_at&order=created_at.asc', {}, false)
      .then(function (r) { if (!r.ok) throw new Error('load'); return r.json(); });
  }
  function isOwner() { return !!(session && session.access_token); }

  // ---- views ----
  var app = document.getElementById('app');
  function shell(children) {
    var cur = location.hash || '#/';
    var tab = function (href, label, on) { return h('a', { class: 'tab' + (on ? ' active' : ''), href: href }, label); };
    return [
      h('div', { class: 'appbar', style: 'background-image:url(banner.jpg)' }, h('div', { class: 'shade' }), h('div', { class: 'appbar-text' }, h('span', { class: 'appbar-name', text: 'سَند' }), h('span', { class: 'appbar-sub', text: 'مكتبة دراسية لطلاب رواق الأزهر' }))),
      h('nav', { class: 'tabbar', 'aria-label': 'التنقل' }, tab('#/', 'الرئيسية', cur === '#/' || cur === ''), tab('#/n/s1', 'المراحل', cur.indexOf('#/n/') === 0), tab('#/about', 'عن المكتبة', cur === '#/about')),
      h.apply(null, ['div', { class: 'body', style: 'display:flex;flex-direction:column;gap:12px' }].concat(children))
    ];
  }
  function render(children) { app.replaceChildren.apply(app, shell(children)); window.scrollTo(0, 0); }
  function back(n) { var p = n.parent; return h('div', null, h('a', { class: 'back', href: p ? '#/n/' + p.id : '#/' }, '› ', p ? p.name : 'الرئيسية')); }
  function linkRows(items) { return h.apply(null, ['div', null].concat(items.map(function (i) { return h('a', { class: 'row', href: i.href }, h('span', null, h('span', { class: 'row-name', text: i.name }), i.detail ? h('span', { class: 'row-detail', text: i.detail }) : null), h('span', { class: 'chev', text: '‹' })); }))); }

  function home() {
    var results = h('div'); var input = h('input', { class: 'search', type: 'search', placeholder: 'ابحثي عن مادة', 'aria-label': 'ابحثي عن مادة' });
    input.addEventListener('input', function () {
      var q = input.value.trim(); results.replaceChildren();
      if (!q) return;
      var r = searchable.filter(function (n) { return n.name.indexOf(q) >= 0; });
      results.appendChild(r.length ? linkRows(r.map(function (n) { return { name: n.name, href: '#/n/' + n.id, detail: crumb(n) }; })) : h('p', { class: 'empty', text: 'مفيش مادة بالاسم ده.' }));
    });
    render([h('label', { class: 'label' }, 'ابحثي عن مادة'), input, results,
      h.apply(null, ['div', { class: 'stages' }].concat(stages.map(function (s) { return h('a', { class: 'stage', href: '#/n/' + s.id }, h('img', { class: 'stage-edge', src: 'edge.jpg', alt: '' }), h('span', { class: 'stage-name', text: s.name }), h('span', { class: 'stage-desc', text: s.children.map(function (l) { return l.name; }).join(' و') })); }))),
      h('p', { class: 'note', text: 'نسخة قيد الإعداد، والمحتوى هيتضاف تباعًا. مبادرة مستقلة مش تابعة للأزهر.' })]);
  }

  function about() {
    var kids = [h('h1', { text: 'عن المكتبة' }), h('p', { class: 'fact', text: 'الفكرة وحدودها باختصار.' }),
      h('p', { text: '«سَند» مكتبة دراسية لطلاب رواق الأزهر، من إعداد مريم رضا، هدفها تجميع محاضرات رواق الأزهر للعلوم الشرعية والعربية في مكان واحد منظم: متقسمة بالمراحل والمستويات، ومع كل مادة ملخصات الدروس وامتحانات السنين اللي فاتت، عشان أي طالب يرجعلها في أي وقت وبضغطة زر.' }),
      h('p', { text: 'المكتبة مبادرة مستقلة لتنظيم المحتوى المنشور، مش تطبيق رسمي ولا تابعة للأزهر الشريف أو إدارة رواق الأزهر. المواد هتتضاف من مصادرها المنشورة بعد مراجعة شروط إعادة المشاركة، مع نسبة كل مادة لمصدرها.' }),
      h('div', null, h('a', { class: 'back', href: '#/' }, '› الرئيسية')),
      h('div', null, h('a', { class: 'row-detail', href: '#/admin' }, isOwner() ? 'دخول المشرفة (مسجّلة)' : 'دخول المشرفة'))];
    render(kids);
  }

  function admin() {
    var msg = h('p', { class: 'err' });
    if (isOwner()) {
      render([h('h1', { text: 'المشرفة' }), h('p', { class: 'ok', text: 'مسجّلة الدخول. افتحي أي مادة وأضيفي الروابط من تحت.' }),
        h('button', { class: 'btn ghost', type: 'button', onclick: function () { saveSession(null); location.hash = '#/'; } }, 'تسجيل الخروج'), h('div', null, h('a', { class: 'back', href: '#/' }, '› الرئيسية'))]);
      return;
    }
    var email = h('input', { type: 'email', autocomplete: 'username', placeholder: 'الإيميل', 'aria-label': 'الإيميل', dir: 'ltr' });
    var pass = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'كلمة السر', 'aria-label': 'كلمة السر', dir: 'ltr' });
    var go = function () {
      msg.textContent = '';
      if (!enabled()) { msg.textContent = 'الخدمة لسه مش متوصلة.'; return; }
      fetch(API + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.value.trim(), password: pass.value }) })
        .then(function (r) { if (!r.ok) throw new Error('bad'); return r.json(); })
        .then(function (j) { saveSession(j); pass.value = ''; location.hash = '#/'; route(); })
        .catch(function () { msg.textContent = 'الإيميل أو كلمة السر غلط.'; });
    };
    pass.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    render([h('h1', { text: 'دخول المشرفة' }), h('p', { class: 'fact', text: 'الإضافة والتعديل لصاحبة المكتبة فقط. القراءة من غير حساب.' }),
      h('div', { class: 'card' }, email, pass, h('button', { class: 'btn', type: 'button', onclick: go }, 'دخول'), msg), h('div', null, h('a', { class: 'back', href: '#/' }, '› الرئيسية'))]);
  }

  function safeUrl(u) { try { var x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch (e) { return null; } }

  function leaf(n) {
    var kind = 'lectures';
    var box = h('div'); var chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'نوع المحتوى' });
    function drawChips() { chips.replaceChildren.apply(chips, KINDS.map(function (k) { return h('button', { class: 'chip' + (k[0] === kind ? ' on' : ''), type: 'button', onclick: function () { kind = k[0]; drawChips(); load(); } }, k[1]); })); }
    function load() {
      box.replaceChildren(h('p', { class: 'empty', text: 'بحمّل…' }));
      var mine = kind;
      loadItems(n.id, kind).then(function (items) {
        if (mine !== kind) return;
        cache[n.id + ':' + kind] = items;
        box.replaceChildren();
        if (!items.length) box.appendChild(h('p', { class: 'empty', text: 'لسه مفيش محتوى هنا. بيتضاف تباعًا من مصادره.' }));
        items.forEach(function (it) {
          var u = safeUrl(it.url);
          var el = h(u ? 'a' : 'div', u ? { class: 'item', href: u, target: '_blank', rel: 'noopener noreferrer' } : { class: 'item' }, h('b', { text: it.title }), it.detail ? h('span', { class: 'row-detail', text: it.detail }) : null, u ? h('small', { text: u }) : null);
          if (isOwner()) {
            var wrap = h('div', null, el, h('div', { class: 'owner-row' },
              h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
                if (!confirm('حذف «' + it.title + '»؟')) return;
                call('/rest/v1/materials?id=eq.' + encodeURIComponent(it.id), { method: 'DELETE' }, true).then(function (r) { if (!r.ok) throw 0; load(); }).catch(function () { alert('ماتحذفش، جرّبي تاني.'); });
              } }, 'حذف')));
            box.appendChild(wrap);
          } else box.appendChild(el);
        });
        if (isOwner()) box.appendChild(addForm());
      }).catch(function () {
        if (mine !== kind) return;
        var c = cache[n.id + ':' + kind];
        box.replaceChildren(h('p', { class: 'err', text: c ? 'مفيش اتصال. ده آخر محتوى اتحمّل.' : 'تعذّر تحميل المحتوى. تأكدي من الإنترنت وجرّبي تاني.' }));
      });
    }
    function addForm() {
      var t = h('input', { placeholder: 'العنوان', 'aria-label': 'العنوان' });
      var d = h('input', { placeholder: 'سطر توضيحي (اختياري)', 'aria-label': 'سطر توضيحي' });
      var u = h('input', { placeholder: 'الرابط (https://...)', 'aria-label': 'الرابط', dir: 'ltr', type: 'url' });
      var m = h('p', { class: 'err' });
      return h('div', { class: 'card' }, h('b', { text: 'إضافة جديدة' }), t, d, u, m, h('button', { class: 'btn', type: 'button', onclick: function () {
        m.textContent = '';
        var url = safeUrl(u.value.trim());
        if (!t.value.trim()) { m.textContent = 'اكتبي العنوان.'; return; }
        if (!url) { m.textContent = 'الرابط لازم يبدأ بـ https://'; return; }
        call('/rest/v1/materials', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ subject_id: n.id, kind: kind, title: t.value.trim(), detail: d.value.trim() || null, url: url }) }, true)
          .then(function (r) { if (!r.ok) throw 0; load(); }).catch(function () { m.textContent = 'ماتضافتش. سجّلي الدخول تاني وجرّبي.'; });
      } }, 'إضافة'));
    }
    drawChips(); load();
    render([h('h1', { text: n.name }), h('p', { class: 'fact', text: crumb(n) }), h('div', { class: 'label', text: 'نوع المحتوى' }), chips, box, back(n)]);
  }

  function node(n) {
    if (!n) return home();
    if (n.children) {
      var kids = [h('h1', { text: n.name })]; var c = crumb(n); if (c) kids.push(h('p', { class: 'fact', text: c }));
      if (stageNote[n.id]) kids.push(h('p', { class: 'note', text: stageNote[n.id] }));
      kids.push(linkRows(n.children.map(function (x) { return { name: x.name, href: '#/n/' + x.id }; }))); kids.push(back(n)); render(kids);
    } else leaf(n);
  }

  function route() {
    var hs = location.hash || '#/';
    if (hs === '#/about') return about();
    if (hs === '#/admin') return admin();
    if (hs.indexOf('#/n/') === 0) return node(byId[hs.slice(4)]);
    home();
  }
  window.addEventListener('hashchange', route);
  route();
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
})();
