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

  const rnd = (a, b) => a + Math.random() * (b - a);
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced;

  /* ── Enveloppe d'ouverture ──────────────────────────── */
  const scene = $('#envelope');
  const unlock = () => document.documentElement.classList.remove('env-lock');
  if (!scene) unlock();
  else {
    const env = $('#env-open');
    const wrap = $('#env-wrap');
    let opened = false;

    // Pétales ivoire qui tombent doucement
    const petals = $('#env-petals');
    if (petals && !reduced) {
      const n = window.innerWidth < 700 ? 12 : 22;
      for (let i = 0; i < n; i++) {
        const p = document.createElement('span');
        p.style.cssText = `--x:${rnd(0, 100)}%;--s:${rnd(9, 20).toFixed(1)}px;--t:${rnd(9, 17).toFixed(1)}s;--dl:${-rnd(0, 17).toFixed(1)}s;--dx:${rnd(-120, 120).toFixed(0)}px`;
        petals.appendChild(p);
      }
    }

    // L'enveloppe s'incline en suivant le pointeur
    const tilt = (x, y) => { env.style.setProperty('--rx', `${(x * 16).toFixed(2)}deg`); env.style.setProperty('--ry', `${(-y * 12).toFixed(2)}deg`); };
    if (finePointer) scene.addEventListener('pointermove', (e) => { if (!opened) tilt(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5); });

    // Étincelles dorées quand le sceau se brise
    const sparks = () => {
      for (let i = 0; i < 22; i++) {
        const s = document.createElement('span');
        const a = rnd(0, Math.PI * 2), d = rnd(50, 170);
        s.className = 'env-spark';
        s.style.cssText = `--s:${rnd(3, 8).toFixed(1)}px;--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d).toFixed(0)}px;animation-delay:${rnd(0, 0.15).toFixed(2)}s`;
        wrap.appendChild(s);
        s.addEventListener('animationend', () => s.remove());
      }
    };

    const open = () => {
      if (opened) return;
      opened = true;
      tilt(0, 0);
      scene.classList.add('is-opening');
      if (!reduced) sparks();
      const [reveal, leave, end] = reduced ? [0, 50, 400] : [2400, 3600, 5000];
      setTimeout(() => scene.classList.add('is-revealing'), reveal);
      setTimeout(() => { scene.classList.add('is-leaving'); unlock(); requestFrame(); }, leave);
      setTimeout(() => { scene.hidden = true; }, end);
    };
    scene.addEventListener('click', open);
    document.addEventListener('keydown', (e) => {
      if (opened || !['Enter', ' ', 'Escape'].includes(e.key)) return;
      e.preventDefault();
      open();
    });
  }

  /* ── Navigation : dock flottant ─────────────────────── */
  const dock = $('#dock');
  const dockList = $('.dock__list', dock);
  const indicator = $('#dock-indicator');
  const links = new Map($$('a[href^="#"]', dock).map((a) => [a.getAttribute('href').slice(1), a]));
  // Sections sans bouton dans le dock : on allume la rubrique la plus proche
  const alias = { compte: 'details', invites: 'rsvp', cadeaux: 'rsvp' };
  let currentLink = null;

  // La pastille dorée glisse sous la rubrique active
  const placeIndicator = () => {
    if (!currentLink) { indicator.classList.remove('is-on'); return; }
    const first = !indicator.classList.contains('is-on');
    if (first) indicator.style.transition = 'opacity .4s';
    indicator.style.setProperty('--x', `${dockList.offsetLeft + currentLink.offsetLeft}px`);
    indicator.style.setProperty('--w', `${currentLink.offsetWidth}px`);
    indicator.classList.add('is-on');
    if (first) requestAnimationFrame(() => requestAnimationFrame(() => { indicator.style.transition = ''; }));
  };
  const setCurrent = (id) => {
    const a = links.get(alias[id] || id) || null;
    if (a === currentLink) return;
    links.forEach((l) => { l.classList.remove('is-current'); l.removeAttribute('aria-current'); });
    if (a) { a.classList.add('is-current'); a.setAttribute('aria-current', 'true'); }
    currentLink = a;
    placeIndicator();
  };
  // Sur mobile, le nom de la rubrique se déplie : on suit sa largeur en continu
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => placeIndicator());
    links.forEach((a) => ro.observe(a));
  } else window.addEventListener('resize', placeIndicator);
  links.forEach((a, id) => a.addEventListener('click', () => setCurrent(id)));

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setCurrent(en.target.id); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => spy.observe(s));

  // Le dock s'efface pendant la saisie du formulaire (clavier mobile)
  document.addEventListener('focusin', (e) => dock.classList.toggle('is-tucked', !!e.target.closest('input, textarea')));
  document.addEventListener('focusout', () => dock.classList.remove('is-tucked'));

  /* ── Révélations au défilement ──────────────────────── */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); revealer.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el) => (reduced ? el.classList.add('is-in') : revealer.observe(el)));

  /* ── Motion design sur tout le site ─────────────────── */
  // Délais en cascade pour les contenus qui apparaissent l'un après l'autre
  $$('.stagger').forEach((el) => [...el.children].filter((c) => !c.classList.contains('corner')).forEach((c, k) => c.style.setProperty('--k', k)));
  $$('.stagger-clock .clock__unit').forEach((u, k) => u.style.setProperty('--k', k));

  // Anneau de progression autour du monogramme (mis à jour dans la boucle de défilement)
  const progress = $('#mono-badge');

  if (finePointer) {
    // Halo doré qui suit la souris avec un léger retard
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);
    let tx = 0, ty = 0, gx = 0, gy = 0, running = false;
    const follow = () => {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.setProperty('--cx', `${gx.toFixed(1)}px`);
      glow.style.setProperty('--cy', `${gy.toFixed(1)}px`);
      running = Math.abs(tx - gx) + Math.abs(ty - gy) > 0.5;
      if (running) requestAnimationFrame(follow);
    };
    window.addEventListener('pointermove', (e) => {
      if (!glow.classList.contains('is-on')) { gx = tx = e.clientX; gy = ty = e.clientY; glow.classList.add('is-on'); }
      tx = e.clientX; ty = e.clientY;
      if (!running) { running = true; requestAnimationFrame(follow); }
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => glow.classList.remove('is-on'));

    // Héro : le texte, les portraits et les initiales suivent la souris, chacun à sa profondeur
    const hero = $('#accueil');
    const heroText = $('.hero__text');
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width - 0.5, my = (e.clientY - r.top) / r.height - 0.5;
      heroText.style.setProperty('--hx', `${(mx * -18).toFixed(1)}px`);
      heroText.style.setProperty('--hy', `${(my * -12).toFixed(1)}px`);
      hero.style.setProperty('--mx', mx.toFixed(3));
      hero.style.setProperty('--my', my.toFixed(3));
    });
    hero.addEventListener('pointerleave', () => {
      heroText.style.removeProperty('--hx'); heroText.style.removeProperty('--hy');
      hero.style.removeProperty('--mx'); hero.style.removeProperty('--my');
    });

    // Cartes et photos : inclinaison 3D avec reflet
    $$('.event, .card-frame, .person__photo, .masonry__btn').forEach((el) => {
      const max = el.classList.contains('card-frame') ? 3 : 7;
      const glare = document.createElement('span');
      glare.className = 'tilt-glare';
      el.appendChild(glare);
      el.addEventListener('pointermove', (e) => {
        if (el.closest('.reveal:not(.is-in)')) return; // attendre la fin de l'apparition
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.classList.add('is-tilting');
        el.style.transition = 'transform .25s ease-out, border-color .6s, box-shadow .6s';
        el.style.transform = `perspective(1000px) rotateX(${((0.5 - y) * max).toFixed(2)}deg) rotateY(${((x - 0.5) * max).toFixed(2)}deg) translateY(-4px)`;
        el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
      });
      el.addEventListener('pointerleave', () => {
        el.classList.remove('is-tilting');
        el.style.transition = 'transform .9s cubic-bezier(.16,1,.3,1), border-color .6s, box-shadow .6s';
        el.style.transform = '';
        setTimeout(() => { if (!el.classList.contains('is-tilting')) el.style.transition = ''; }, 900);
      });
    });

    // Boutons aimantés : ils glissent vers la souris
    $$('.btn').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.translate = `${((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px`;
      });
      b.addEventListener('pointerleave', () => { b.style.translate = ''; });
    });
  }

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
    const maxY = document.documentElement.scrollHeight - vh;
    progress.style.setProperty('--sp', (maxY > 0 ? window.scrollY / maxY : 0).toFixed(4));
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
