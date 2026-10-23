/* Invitation de mariage — interactions et animations (sans dépendance) */
(() => {
  'use strict';

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = window.WEDDING || {};
  // Version locale : API PHP. Version GitHub (statique) : Google Apps Script défini dans config.js.
  const ENDPOINT = String(window.WEDDING_ENDPOINT || '').trim();
  const API = W.static
    ? (ENDPOINT ? { rsvp: ENDPOINT, guests: ENDPOINT + (ENDPOINT.includes('?') ? '&' : '?') + 'action=guests' } : null)
    : { rsvp: 'api/rsvp.php', guests: 'api/guests.php' };

  /* ── Rideau d'ouverture ─────────────────────────────── */
  const intro = $('#intro');
  if (intro) {
    const t0 = performance.now();
    const close = () => setTimeout(() => intro.classList.add('is-done'), Math.max(0, 1500 - (performance.now() - t0)));
    if (reduced) intro.classList.add('is-done');
    else if (document.readyState === 'complete') close();
    else window.addEventListener('load', close, { once: true });
    setTimeout(() => intro.classList.add('is-done'), 3200); // filet de sécurité
  }

  /* ── Navigation ─────────────────────────────────────── */
  const nav = $('#nav');
  const burger = $('#burger');
  $$('.nav__links li').forEach((li, i) => li.firstElementChild.style.setProperty('--n', i));

  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('.nav__links a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); } });

  let lastY = window.scrollY;
  const heroH = () => $('#accueil').offsetHeight;
  const onScrollNav = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-solid', y > 60);
    if (!nav.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > heroH() && y > lastY + 4);
    if (y < lastY - 4 || y < heroH()) nav.classList.remove('is-hidden');
    lastY = y;
  };

  // Lien actif selon la section visible
  const links = new Map($$('.nav__links a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.remove('is-current'));
      links.get(en.target.id)?.classList.add('is-current');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => spy.observe(s));

  /* ── Révélations au défilement ──────────────────────── */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); revealer.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el) => (reduced ? el.classList.add('is-in') : revealer.observe(el)));

  /* ── Parallaxe + timeline (une seule boucle rAF) ────── */
  const parallax = $$('[data-parallax]');
  const backdrop = $('.backdrop');

  /* ── Poussière dorée ───────────────────────────────── */
  const dust = $('#dust');
  if (dust && !reduced) {
    const n = window.innerWidth < 700 ? 18 : 32;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      const r = (a, b) => a + Math.random() * (b - a);
      p.style.cssText = `--x:${r(0, 100)}%;--s:${r(2, 5).toFixed(1)}px;--t:${r(16, 34).toFixed(1)}s;--dl:${-r(0, 34).toFixed(1)}s;--dx:${r(-80, 80).toFixed(0)}px;--o:${r(.35, .9).toFixed(2)}`;
      dust.appendChild(p);
    }
  }
  const timeline = $('#timeline');
  const fill = $('.timeline__fill');
  let ticking = false;

  const frame = () => {
    ticking = false;
    onScrollNav();
    const vh = window.innerHeight;
    if (!reduced) {
      parallax.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax);
        el.style.transform = `translate3d(0, ${(-offset).toFixed(1)}px, 0)`;
      });
    }
    if (backdrop && !reduced) { // le décor glisse et grossit doucement au fil du défilement
      const max = document.documentElement.scrollHeight - vh;
      const p = max > 0 ? window.scrollY / max : 0;
      backdrop.style.setProperty('--p', p.toFixed(4));
    }
    if (timeline && fill) {
      const r = timeline.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      fill.style.setProperty('--p', p.toFixed(3));
    }
  };
  const requestFrame = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame);
  frame();

  /* ── Galerie : filtres ──────────────────────────────── */
  const items = $$('.masonry__item');
  $$('.chip').forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    $$('.chip').forEach((c) => { c.classList.toggle('is-active', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
    items.forEach((it) => it.classList.add('is-fading'));
    setTimeout(() => {
      items.forEach((it) => {
        const show = f === 'all' || it.dataset.cat === f;
        it.classList.toggle('is-hidden', !show);
        it.classList.add('is-in');
      });
      requestAnimationFrame(() => requestAnimationFrame(() => items.forEach((it) => it.classList.remove('is-fading'))));
    }, reduced ? 0 : 280);
  }));

  /* ── Lightbox ───────────────────────────────────────── */
  const lb = $('#lightbox');
  const lbImg = $('img', lb);
  const lbCap = $('figcaption', lb);
  const lbCount = $('.lightbox__count', lb);
  let current = 0, visible = [], opener = null;

  const show = (i) => {
    current = (i + visible.length) % visible.length;
    const btn = visible[current];
    const alt = $('img', btn).alt;
    lbImg.classList.add('is-swapping');
    const img = new Image();
    img.onload = img.onerror = () => {
      lbImg.src = btn.dataset.full; lbImg.alt = alt; lbCap.textContent = alt;
      lbCount.textContent = `${current + 1} / ${visible.length}`;
      requestAnimationFrame(() => lbImg.classList.remove('is-swapping'));
    };
    img.src = btn.dataset.full;
  };
  const openLb = (btn) => {
    visible = $$('.masonry__item:not(.is-hidden) .masonry__btn');
    opener = btn;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => lb.classList.add('is-open'));
    show(visible.indexOf(btn));
    $('.lightbox__close', lb).focus();
  };
  const closeLb = () => {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { lb.hidden = true; opener?.focus(); }, reduced ? 0 : 400);
  };
  $$('.masonry__btn').forEach((b) => b.addEventListener('click', () => openLb(b)));
  $('.lightbox__close', lb).addEventListener('click', closeLb);
  $('.lightbox__prev', lb).addEventListener('click', () => show(current - 1));
  $('.lightbox__next', lb).addEventListener('click', () => show(current + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'Tab') { // piège de focus
      const f = $$('button', lb); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let touchX = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 45) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ── Compte à rebours ───────────────────────────────── */
  const clock = $('#clock');
  if (clock) {
    const target = new Date(clock.dataset.target).getTime();
    const nums = Object.fromEntries($$('.clock__num', clock).map((n) => [n.dataset.unit, n]));
    const setNum = (el, value) => {
      const str = String(value).padStart(2, '0');
      const old = el.dataset.v || '';
      if (old === str) return;
      el.innerHTML = [...str].map((d, i) =>
        `<span class="digit${old && old.length === str.length && old[i] !== d && !reduced ? ' is-tick' : ''}">${d}</span>`).join('');
      el.dataset.v = str;
    };
    const tick = () => {
      let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      if (s === 0) { $('#clock-done').hidden = false; }
      const d = Math.floor(s / 86400); s -= d * 86400;
      const h = Math.floor(s / 3600); s -= h * 3600;
      const m = Math.floor(s / 60); s -= m * 60;
      setNum(nums.days, d); setNum(nums.hours, h); setNum(nums.minutes, m); setNum(nums.seconds, s);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ── RSVP ───────────────────────────────────────────── */
  const form = $('#rsvp-form');
  const done = $('#rsvp-done');
  const whenYes = $('#when-yes');
  const comp = $('#f-comp');
  const compOut = $('#comp-out');
  const maxComp = Number(comp.dataset.max) || 4;
  let formShownAt = performance.now();

  const updateStepper = () => {
    const v = Number(comp.value);
    compOut.textContent = v;
    $('[data-step="-1"]', form).disabled = v <= 0;
    $('[data-step="1"]', form).disabled = v >= maxComp;
  };
  $$('[data-step]', form).forEach((b) => b.addEventListener('click', () => {
    comp.value = Math.min(maxComp, Math.max(0, Number(comp.value) + Number(b.dataset.step)));
    updateStepper();
  }));
  updateStepper();

  const syncAttending = () => {
    const v = form.attending.value;
    whenYes.classList.toggle('is-collapsed', v === 'no');
    $$('input, button', whenYes).forEach((el) => { el.tabIndex = v === 'no' ? -1 : 0; });
  };
  $$('input[name="attending"]', form).forEach((r) => r.addEventListener('change', () => { syncAttending(); setErr('attending', ''); }));

  const setErr = (field, msg) => {
    const p = $(`#err-${field}`);
    if (p) p.textContent = msg || '';
    const inp = form.elements[field];
    if (inp && inp.closest) inp.closest('.field')?.classList.toggle('has-error', !!msg);
    if (inp && inp.setAttribute) inp.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };
  ['full_name', 'contact'].forEach((n) => form.elements[n].addEventListener('input', () => setErr(n, '')));

  const validate = () => {
    const errs = {};
    if (form.full_name.value.trim().length < 2) errs.full_name = 'Indiquez votre nom et prénom.';
    const c = form.contact.value.trim();
    const isMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
    if (!isMail && c.replace(/\D/g, '').length < 8) errs.contact = 'Indiquez un e-mail ou un numéro WhatsApp valide.';
    if (!form.attending.value) errs.attending = 'Dites-nous si vous serez présent(e).';
    return errs;
  };

  const showDone = (attending) => {
    $('#done-title').textContent = attending ? 'Merci, votre présence est confirmée.' : 'Merci pour votre réponse.';
    $('#done-text').textContent = attending
      ? 'Nous avons hâte de célébrer ce jour avec vous.'
      : 'Vous nous manquerez ! Merci de penser à nous en ce jour si spécial.';
    form.hidden = true;
    done.hidden = false;
    done.classList.remove('is-in'); void done.offsetWidth; done.classList.add('is-in');
    done.focus({ preventScroll: true });
    done.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    if (attending && !reduced) confetti();
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    ['full_name', 'contact', 'attending'].forEach((n) => setErr(n, ''));
    $('#rsvp-error').textContent = '';
    const errs = validate();
    if (Object.keys(errs).length) {
      Object.entries(errs).forEach(([k, v]) => setErr(k, v));
      const first = form.elements[Object.keys(errs)[0]];
      (first.length ? first[0] : first).focus();
      return;
    }
    const btn = $('#rsvp-submit');
    btn.classList.add('is-loading'); btn.disabled = true;
    try {
      $('#elapsed').value = Math.round(performance.now() - formShownAt);
      if (!API) { // aucun service d'enregistrement configuré : la réponse part par WhatsApp
        window.open(waLink(), '_blank', 'noopener');
        showDone(form.attending.value === 'yes');
        return;
      }
      const fd = new FormData(form);
      if (!form.is_public.checked) fd.set('is_public', '');
      const res = await fetch(API.rsvp, { method: 'POST', body: new URLSearchParams(fd) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        if (data.fields) Object.entries(data.fields).forEach(([k, v]) => setErr(k, v));
        throw new Error(data.error || 'Une erreur est survenue. Réessayez ou répondez via WhatsApp.');
      }
      try { localStorage.setItem('rsvp-answer', form.attending.value); } catch (_) { /* stockage indisponible */ }
      showDone(data.attending);
      loadGuests();
    } catch (err) {
      $('#rsvp-error').textContent = err.message || 'Connexion impossible. Réessayez ou répondez via WhatsApp.';
    } finally {
      btn.classList.remove('is-loading'); btn.disabled = false;
    }
  });

  $('#rsvp-again').addEventListener('click', () => {
    done.hidden = true; form.hidden = false;
    form.full_name.focus();
  });

  // Réponse rapide via WhatsApp : message pré-rempli à partir du formulaire
  function waLink() {
    const name = form.full_name.value.trim();
    const att = form.attending.value;
    const lines = [`Bonjour ${W.couple || ''} !`];
    if (att === 'no') lines.push(`Je suis désolé(e), je ne pourrai pas venir à votre mariage.`);
    else {
      lines.push(`Je confirme ma présence à votre mariage 🎉`);
      const n = Number(comp.value);
      if (n) lines.push(`Je viendrai avec ${n} accompagnant${n > 1 ? 's' : ''}.`);
      if (form.diet.value.trim()) lines.push(`Régime / allergies : ${form.diet.value.trim()}`);
    }
    if (form.message.value.trim()) lines.push(form.message.value.trim());
    if (name) lines.push(`— ${name}`);
    return `https://wa.me/${W.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
  }
  $('#wa-btn').addEventListener('click', (e) => { e.currentTarget.href = waLink(); });

  function confetti() {
    const colors = ['#C9A46A', '#E8DCC8', '#D8BD8A', '#FBF8F3', '#B8945A'];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('span');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      c.style.setProperty('--x', (Math.random() * 200 - 100) + 'px');
      c.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      c.style.animationDuration = 2.4 + Math.random() * 2 + 's';
      c.style.animationDelay = Math.random() * .6 + 's';
      c.style.borderRadius = Math.random() > .5 ? '50%' : '1px';
      document.body.appendChild(c);
      c.addEventListener('animationend', () => c.remove());
    }
  }

  /* ── Invités confirmés ──────────────────────────────── */
  const countEl = $('#guest-count');
  const list = $('#guests');
  const PAGE = 12;

  const animateCount = (to) => {
    const from = Number(countEl.textContent) || 0;
    if (reduced || from === to) { countEl.textContent = to; return; }
    const t0 = performance.now(), dur = 1400;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      countEl.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const guestCard = (g, i) => {
    const li = document.createElement('li');
    li.className = 'guest';
    li.style.setProperty('--i', i % PAGE);
    const initials = g.name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
    li.innerHTML = '<span class="guest__avatar" aria-hidden="true"></span><div><span class="guest__name"></span><span class="guest__plus"></span></div>';
    $('.guest__avatar', li).textContent = initials;
    $('.guest__name', li).textContent = g.name;
    $('.guest__plus', li).textContent = g.companions ? `+ ${g.companions} accompagnant${g.companions > 1 ? 's' : ''}` : 'Seul(e)';
    if (g.message) {
      const p = document.createElement('p');
      p.className = 'guest__msg';
      p.textContent = `« ${g.message} »`;
      $('div', li).appendChild(p);
    }
    return li;
  };

  let guestsData = [];
  const renderGuests = (n) => {
    list.innerHTML = '';
    guestsData.slice(0, n).forEach((g, i) => list.appendChild(guestCard(g, i)));
    if (guestsData.length > n) {
      const li = document.createElement('li');
      li.className = 'guests__more';
      li.innerHTML = '<button type="button" class="btn btn--line btn--sm">Voir tous les invités</button>';
      li.firstChild.addEventListener('click', () => renderGuests(guestsData.length));
      list.appendChild(li);
    }
  };

  let guestsSeen = false;
  async function loadGuests() {
    try {
      if (!API) { $('#guests-empty').hidden = false; return; }
      const res = await fetch(API.guests, { cache: 'no-store' });
      const data = await res.json();
      guestsData = data.guests || [];
      $('#guest-count-label').textContent = data.count > 1 ? 'invités ont confirmé leur présence' : 'invité a confirmé sa présence';
      $('#guests-empty').hidden = data.count > 0;
      const go = () => { animateCount(data.count); renderGuests(PAGE); };
      if (guestsSeen) go();
      else {
        const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { guestsSeen = true; io.disconnect(); go(); } }, { threshold: 0.2 });
        io.observe($('#invites'));
      }
    } catch (_) { /* liste indisponible : on laisse la section discrète */ }
  }
  loadGuests();

  /* ── FAQ : accordéons animés ────────────────────────── */
  $$('.faq__item').forEach((d) => {
    const summary = $('summary', d);
    const body = $('.faq__body', d);
    summary.addEventListener('click', (e) => {
      if (reduced || !body.animate) return;
      e.preventDefault();
      if (d.open) {
        const a = body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.22,.61,.36,1)' });
        a.onfinish = () => { d.open = false; };
      } else {
        d.open = true;
        body.animate([{ height: '0px', opacity: 0 }, { height: body.offsetHeight + 'px', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  });

  /* ── Copier le numéro mobile money ──────────────────── */
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copié ✓'; }
    catch (_) { b.textContent = b.dataset.copy; }
    setTimeout(() => { b.textContent = 'Copier'; }, 2000);
  }));
})();
