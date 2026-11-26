(function () {
  'use strict';
  var CFG = window.RIWAQ || {};
  var API = (CFG.SUPABASE_URL || '').replace(/\/$/, '');
  var KEY = CFG.SUPABASE_ANON_KEY || '';
  var KINDS = [['lectures', 'المحاضرات'], ['summaries', 'الملخصات'], ['exams', 'الامتحانات']];

  // Hierarchy: from Mariam's original message (spelling kept as she wrote it).
  var madhhabs = function (id) { return ['فقة حنفي', 'فقة شافي', 'فقة حنبلي', 'فقة مالكي'].map(function (n, i) { return { id: id + '-m' + i, name: n }; }); };
  var subj = function (id, name, fiqh) { return { id: id, name: name, children: fiqh ? madhhabs(id) : undefined }; };
  var levelSubjects = function (n, hist) { return [subj('l' + n + '-a', 'العقيدة'), subj('l' + n + '-t', 'التفسير'), subj('l' + n + '-h', 'الحديث'), subj('l' + n + '-f', 'الفقه', true), subj('l' + n + '-s', hist), subj('l' + n + '-ar', 'اللغة العربية')]; };
  var levelNames = ['', 'المستوى الأول', 'المستوى الثاني', 'المستوى الثالث', 'المستوى الرابع', 'المستوى الخامس', 'المستوى السادس'];
  var specialties = function (n) { return [subj('l' + n + '-sp0', 'تخصص العقيدة'), subj('l' + n + '-sp1', 'تخصص التفسير والحديث'), subj('l' + n + '-sp2', 'تخصص الفقه وأصوله', true), subj('l' + n + '-sp3', 'تخصص اللغة العربية')]; };
  var lvl = function (n, ch) { return { id: 'l' + n, name: levelNames[n], children: ch }; };
  var stages = [
    { id: 's1', name: 'المرحلة التمهيدية', children: [lvl(1, levelSubjects(1, 'السيرة النبوية')), lvl(2, levelSubjects(2, 'السيرة النبوية'))] },
    { id: 's2', name: 'المرحلة المتوسطة', children: [lvl(3, levelSubjects(3, 'السيرة والتاريخ')), lvl(4, levelSubjects(4, 'السيرة والتاريخ'))] },
    { id: 's3', name: 'المرحلة التخصصية', children: [lvl(5, specialties(5)), lvl(6, specialties(6))] }
  ];
  var stageNote = { s3: 'بيتم اختيار مسار واحد فقط من التخصصات' };
  var all = [], byId = {};
  stages.forEach(function (s) { (function walk(n, p) { n.parent = p; all.push(n); byId[n.id] = n; (n.children || []).forEach(function (c) { walk(c, n); }); })(s, null); });
  var crumb = function (n) { var o = []; for (var p = n.parent; p; p = p.parent) o.push(p.name); return o.join(' · '); };
  var searchable = all.filter(function (n) { return n.parent && n.parent.parent; });

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
    if (!enabled()) return Promise.reject(new Error('not configured'));
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
