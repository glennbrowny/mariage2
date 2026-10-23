<?php
declare(strict_types=1);
require_once __DIR__ . '/lib/bootstrap.php';

$g  = cfg('groom');
$b  = cfg('bride');
$fam = cfg('families');
$cer = cfg('ceremony');
$rec = cfg('reception');
$dc  = cfg('dress_code');
$gifts = cfg('gifts');
$couple = $g['name'] . ' & ' . $b['name'];
$dateLong = date_fr(cfg('date_start'));
$dateShort = (new DateTime(cfg('date_start')))->format('d.m.Y');
$startIso = (new DateTime(cfg('date_start')))->format(DateTime::ATOM);
$url = site_url();
$monogram = mb_substr($g['name'], 0, 1) . '&' . mb_substr($b['name'], 0, 1);

// Lien Google Agenda
$gcal = 'https://calendar.google.com/calendar/render?' . http_build_query([
    'action'   => 'TEMPLATE',
    'text'     => "Mariage de $couple",
    'dates'    => (new DateTime(cfg('date_start')))->setTimezone(new DateTimeZone('UTC'))->format('Ymd\THis\Z') . '/'
                . (new DateTime(cfg('date_end')))->setTimezone(new DateTimeZone('UTC'))->format('Ymd\THis\Z'),
    'location' => $cer['place'] . ', ' . $cer['address'],
    'details'  => "Cérémonie {$cer['time']} — {$cer['place']}\nRéception {$rec['time']} — {$rec['place']}\n$url",
]);

/** <picture> responsive WebP + JPEG avec dimensions réelles (évite les sauts de mise en page). */
function picture(string $name, string $alt, string $sizes = '100vw', string $class = '', bool $lazy = true, array $widths = [480, 960]): string {
    $dir = __DIR__ . '/assets/img/';
    $webp = []; $jpg = []; $w = $h = 0;
    foreach ($widths as $wd) {
        if (!is_file("$dir$name-$wd.jpg")) continue;
        [$rw, $rh] = getimagesize("$dir$name-$wd.jpg");
        $webp[] = "assets/img/$name-$wd.webp {$rw}w";
        $jpg[]  = "assets/img/$name-$wd.jpg {$rw}w";
        $w = $rw; $h = $rh; $last = "assets/img/$name-$wd.jpg";
    }
    $load = $lazy ? 'loading="lazy" decoding="async"' : 'fetchpriority="high"';
    return '<picture><source type="image/webp" srcset="' . implode(', ', $webp) . '" sizes="' . $sizes . '">'
         . '<img src="' . $last . '" srcset="' . implode(', ', $jpg) . '" sizes="' . $sizes . '" width="' . $w . '" height="' . $h
         . '" alt="' . e($alt) . '" class="' . $class . '" ' . $load . '></picture>';
}

/** Lettres animées une à une. */
function letters(string $text, int $offset = 0): string {
    $out = '';
    foreach (mb_str_split($text) as $i => $ch) {
        $out .= $ch === ' ' ? ' ' : '<span class="ltr" style="--i:' . ($i + $offset) . '">' . e($ch) . '</span>';
    }
    return $out;
}

$gallery = [
    ['couple-escalier',    'couple',  "$couple allongés au pied d'un escalier en spirale"],
    ['mariee',             'mariee',  "{$b['name']} ajuste sa boucle d'oreille, sourire aux lèvres"],
    ['marie',              'marie',   "{$g['name']} en smoking blanc entouré de ses témoins"],
    ['mariee-cortege',     'moments', "La mariée descend l'escalier, accompagnée de ses demoiselles d'honneur"],
    ['detail-bijou',       'mariee',  "Détail du bijou de cheveux de la mariée"],
    ['mariee-amies',       'moments', "{$b['name']} et ses amies, fous rires avant la cérémonie"],
    ['detail-boutonniere', 'marie',   "Détail de la boutonnière du marié"],
    ['detail-voile',       'moments', "Le voile de la mariée vu du dessus"],
];
?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?= e($couple) ?> — Invitation au mariage · <?= e(date_fr(cfg('date_start'), false)) ?></title>
<meta name="description" content="<?= e("$couple se marient le $dateLong à " . cfg('city') . ". Découvrez notre invitation et confirmez votre présence.") ?>">
<meta name="theme-color" content="#0B0A09">
<link rel="canonical" href="<?= e($url) ?>/">

<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="<?= e("$couple — Nous nous marions !") ?>">
<meta property="og:description" content="<?= e(ucfirst($dateLong) . ' · ' . cfg('city') . '. Ouvrez votre invitation et confirmez votre présence.') ?>">
<meta property="og:url" content="<?= e($url) ?>/">
<meta property="og:image" content="<?= e($url) ?>/assets/img/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Jost:wght@300;400;500&family=Pinyon+Script&display=swap" rel="stylesheet">
<link rel="preload" as="image" type="image/webp" href="assets/img/hero-720.webp">
<link rel="stylesheet" href="assets/css/style.css?v=<?= filemtime(__DIR__ . '/assets/css/style.css') ?>">
<script>document.documentElement.classList.add('js');</script>
</head>
<body>
<a class="skip" href="#invitation">Aller au contenu</a>

<!-- Décor animé en fond de page -->
<div class="backdrop" aria-hidden="true">
  <div class="backdrop__move" id="backdrop-move"><div class="backdrop__img"></div></div>
  <div class="backdrop__glow"></div>
  <div class="backdrop__shade"></div>
</div>
<div class="dust" id="dust" aria-hidden="true"></div>

<!-- Rideau d'ouverture -->
<div class="intro" id="intro" aria-hidden="true">
  <div class="intro__ring"><span class="intro__mono"><?= e($monogram) ?></span></div>
  <p class="intro__date"><?= e($dateShort) ?></p>
</div>

<!-- Navigation -->
<header class="nav" id="nav">
  <a href="#accueil" class="nav__logo" aria-label="Retour en haut"><?= e($monogram) ?></a>
  <nav aria-label="Navigation principale">
    <ul class="nav__links" id="nav-links">
      <li><a href="#invitation">Invitation</a></li>
      <li><a href="#maries">Les mariés</a></li>
      <li><a href="#histoire">Notre histoire</a></li>
      <li><a href="#galerie">Galerie</a></li>
      <li><a href="#details">Le jour J</a></li>
      <li><a href="#faq">FAQ</a></li>
      <li><a href="#rsvp" class="nav__cta">Confirmer</a></li>
    </ul>
  </nav>
  <button class="nav__burger" id="burger" aria-expanded="false" aria-controls="nav-links" aria-label="Ouvrir le menu">
    <span></span><span></span>
  </button>
</header>

<main>
<!-- 1. HÉRO -->
<section class="hero" id="accueil" aria-labelledby="hero-title">
  <div class="hero__ambient" aria-hidden="true"></div>
  <div class="hero__card">
  <div class="hero__media" data-parallax="0.12">
    <picture>
      <source type="image/webp" srcset="assets/img/hero-720.webp">
      <img src="assets/img/hero-720.jpg" alt="" width="564" height="891" fetchpriority="high">
    </picture>
  </div>
  <div class="hero__veil"></div>

  <div class="hero__inner">
    <div class="hero__text">
      <p class="eyebrow hero__eyebrow">Nous nous marions</p>
      <h1 class="hero__names" id="hero-title" aria-label="<?= e($couple) ?>">
        <span class="hero__name" aria-hidden="true"><?= letters($g['name']) ?></span>
        <span class="hero__amp" aria-hidden="true">&amp;</span>
        <span class="hero__name" aria-hidden="true"><?= letters($b['name'], mb_strlen($g['name']) + 2) ?></span>
      </h1>
      <div class="hero__rule" aria-hidden="true"></div>
      <p class="hero__date"><?= e(ucfirst($dateLong)) ?></p>
      <p class="hero__place"><?= e($cer['time']) ?> · <?= e(cfg('city')) ?><span><?= e($cer['place']) ?></span></p>
      <div class="hero__actions">
        <a href="#invitation" class="btn btn--gold">Ouvrir l'invitation</a>
        <a href="#rsvp" class="btn btn--ghost-light">Confirmer ma présence</a>
      </div>
    </div>
  </div>
  </div>

  <a href="#invitation" class="hero__scroll" aria-label="Faire défiler vers l'invitation"><span></span></a>
</section>

<!-- 2. INVITATION -->
<section class="section section--ivory" id="invitation" aria-labelledby="inv-title">
  <div class="card-frame reveal">
    <svg class="corner corner--tl" viewBox="0 0 60 60" aria-hidden="true"><path d="M2 58V20Q2 2 20 2h38M10 58V24Q10 10 24 10h34"/><circle cx="20" cy="20" r="2.5"/></svg>
    <svg class="corner corner--tr" viewBox="0 0 60 60" aria-hidden="true"><path d="M2 58V20Q2 2 20 2h38M10 58V24Q10 10 24 10h34"/><circle cx="20" cy="20" r="2.5"/></svg>
    <svg class="corner corner--bl" viewBox="0 0 60 60" aria-hidden="true"><path d="M2 58V20Q2 2 20 2h38M10 58V24Q10 10 24 10h34"/><circle cx="20" cy="20" r="2.5"/></svg>
    <svg class="corner corner--br" viewBox="0 0 60 60" aria-hidden="true"><path d="M2 58V20Q2 2 20 2h38M10 58V24Q10 10 24 10h34"/><circle cx="20" cy="20" r="2.5"/></svg>

    <p class="eyebrow">Invitation</p>
    <p class="inv__lead">Avec la bénédiction de leurs familles</p>
    <p class="inv__families"><?= e($fam['groom']) ?> <span>&amp;</span> <?= e($fam['bride']) ?></p>
    <p class="inv__lead">ont la joie de vous annoncer le mariage de leurs enfants</p>
    <h2 class="inv__names script" id="inv-title"><?= e($g['name']) ?> <span class="amp">&amp;</span> <?= e($b['name']) ?></h2>
    <p class="inv__text">Nous avons le plaisir de vous inviter à célébrer notre union et à partager avec nous ce moment unique, entourés de celles et ceux qui comptent le plus.</p>

    <div class="inv__meta">
      <div><span class="inv__label">Date</span><span class="inv__value"><?= e(ucfirst($dateLong)) ?></span></div>
      <div><span class="inv__label">Heure</span><span class="inv__value"><?= e($cer['time']) ?></span></div>
      <div><span class="inv__label">Lieu</span><span class="inv__value"><?= e($cer['place']) ?>, <?= e(cfg('city')) ?></span></div>
      <div><span class="inv__label">Dress code</span><span class="inv__value"><?= e($dc['title']) ?></span></div>
    </div>
    <a href="#rsvp" class="btn btn--dark">Confirmer ma présence</a>
  </div>
</section>

<!-- 3. LES MARIÉS -->
<section class="section" id="maries" aria-labelledby="maries-title">
  <header class="section__head reveal">
    <p class="eyebrow">Les mariés</p>
    <h2 class="section__title" id="maries-title">Deux histoires, <em>un seul chemin</em></h2>
  </header>
  <div class="couple">
    <?php foreach ([['Le marié', $g, 'marie'], ['La mariée', $b, 'mariee']] as $k => [$role, $p, $img]): ?>
    <article class="person reveal" style="--d:<?= $k * 150 ?>ms">
      <div class="person__photo">
        <?= picture($img, "Portrait de {$p['name']}, " . mb_strtolower($role), '(min-width: 900px) 420px, 90vw') ?>
      </div>
      <p class="eyebrow"><?= e($role) ?></p>
      <h3 class="person__name script"><?= e($p['name']) ?></h3>
      <p class="person__bio"><?= e($p['bio']) ?></p>
      <blockquote class="person__quote">« <?= e($p['message']) ?> »</blockquote>
    </article>
    <?php if ($k === 0): ?><div class="couple__amp script" aria-hidden="true">&amp;</div><?php endif; ?>
    <?php endforeach; ?>
  </div>
</section>

<!-- 4. NOTRE HISTOIRE -->
<section class="section section--cream" id="histoire" aria-labelledby="story-title">
  <header class="section__head reveal">
    <p class="eyebrow">Notre histoire</p>
    <h2 class="section__title" id="story-title">Le fil <em>de notre amour</em></h2>
  </header>
  <div class="timeline" id="timeline">
    <div class="timeline__track" aria-hidden="true"><div class="timeline__fill"></div></div>
    <ol class="timeline__list">
    <?php foreach (cfg('story') as $i => [$year, $title, $text, $img]): ?>
    <li class="step reveal <?= $i % 2 ? 'step--right' : '' ?>">
      <span class="step__dot" aria-hidden="true"></span>
      <div class="step__media"><?= picture($img, $title, '(min-width: 900px) 360px, 80vw', '', true, [480]) ?></div>
      <div class="step__body">
        <span class="step__year"><?= e($year) ?></span>
        <h3 class="step__title"><?= e($title) ?></h3>
        <p><?= e($text) ?></p>
      </div>
    </li>
    <?php endforeach; ?>
    </ol>
  </div>
</section>

<!-- 5. GALERIE -->
<section class="section" id="galerie" aria-labelledby="gal-title">
  <header class="section__head reveal">
    <p class="eyebrow">Galerie</p>
    <h2 class="section__title" id="gal-title">Instants <em>choisis</em></h2>
  </header>
  <div class="filters reveal" role="group" aria-label="Filtrer la galerie">
    <?php foreach (['all' => 'Tous', 'couple' => 'Le couple', 'mariee' => 'La mariée', 'marie' => 'Le marié', 'moments' => 'Nos moments'] as $f => $label): ?>
      <button class="chip<?= $f === 'all' ? ' is-active' : '' ?>" data-filter="<?= $f ?>" aria-pressed="<?= $f === 'all' ? 'true' : 'false' ?>"><?= $label ?></button>
    <?php endforeach; ?>
  </div>
  <div class="masonry" id="gallery">
    <?php foreach ($gallery as $i => [$img, $cat, $alt]): ?>
    <figure class="masonry__item reveal" data-cat="<?= $cat ?>" style="--d:<?= ($i % 3) * 90 ?>ms">
      <button class="masonry__btn" data-index="<?= $i ?>" data-full="assets/img/<?= $img ?>-<?= is_file(__DIR__ . "/assets/img/$img-960.webp") ? 960 : 480 ?>.webp" aria-label="Agrandir : <?= e($alt) ?>">
        <?= picture($img, $alt, '(min-width: 900px) 33vw, 50vw', '', true, [480, 960]) ?>
      </button>
    </figure>
    <?php endforeach; ?>
  </div>
</section>

<!-- 6. DÉTAILS -->
<section class="section section--ivory" id="details" aria-labelledby="det-title">
  <header class="section__head reveal">
    <p class="eyebrow">Le jour J</p>
    <h2 class="section__title" id="det-title">Les <em>détails</em></h2>
  </header>

  <div class="events">
    <?php foreach ([[$cer, 'M12 3v4M10 5h4M6 21V11l6-4 6 4v10M6 21h12M10 21v-4a2 2 0 0 1 4 0v4'], [$rec, 'M8 3v6a4 4 0 0 0 8 0V3M12 13v8M8 21h8M16 3v6']] as $k => [$ev, $icon]): ?>
    <article class="event reveal" style="--d:<?= $k * 120 ?>ms">
      <svg class="event__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="<?= $icon ?>"/></svg>
      <h3 class="event__title"><?= e($ev['title']) ?></h3>
      <p class="event__date"><?= e(ucfirst($dateLong)) ?> · <strong><?= e($ev['time']) ?></strong></p>
      <p class="event__place"><?= e($ev['place']) ?></p>
      <p class="event__addr"><?= e($ev['address']) ?></p>
      <a class="btn btn--line" href="<?= e(maps_url($ev['maps'])) ?>" target="_blank" rel="noopener">Voir sur Google Maps</a>
    </article>
    <?php endforeach; ?>
  </div>

  <div class="cal reveal">
    <span class="cal__label">Ajouter au calendrier</span>
    <a class="btn btn--dark btn--sm" href="calendar.php" download>Apple / Outlook (.ics)</a>
    <a class="btn btn--line btn--sm" href="<?= e($gcal) ?>" target="_blank" rel="noopener">Google Agenda</a>
  </div>

  <div class="details-grid">
    <div class="dress reveal">
      <p class="eyebrow">Dress code</p>
      <h3 class="dress__title"><?= e($dc['title']) ?></h3>
      <p><?= e($dc['text']) ?></p>
      <ul class="swatches" aria-label="Palette de couleurs suggérée">
        <?php foreach ($dc['swatches'] as $i => $c): ?><li style="--c:<?= e($c) ?>;--d:<?= $i * 80 ?>ms" title="<?= e($c) ?>"></li><?php endforeach; ?>
      </ul>
    </div>
    <div class="program reveal" style="--d:120ms">
      <p class="eyebrow">Programme de la journée</p>
      <ol class="program__list">
        <?php foreach (cfg('program') as [$t, $title, $desc]): ?>
        <li><span class="program__time"><?= e($t) ?></span><div><strong><?= e($title) ?></strong><span><?= e($desc) ?></span></div></li>
        <?php endforeach; ?>
      </ol>
    </div>
  </div>
</section>

<!-- 7. COMPTE À REBOURS -->
<section class="countdown" id="compte" aria-labelledby="cd-title">
  <div class="countdown__inner reveal">
    <p class="eyebrow eyebrow--light">Le grand jour approche</p>
    <h2 class="countdown__title" id="cd-title">Plus que…</h2>
    <div class="clock" id="clock" data-target="<?= e($startIso) ?>" role="timer" aria-live="off">
      <?php foreach (['days' => 'Jours', 'hours' => 'Heures', 'minutes' => 'Minutes', 'seconds' => 'Secondes'] as $unit => $label): ?>
      <div class="clock__unit"><span class="clock__num" data-unit="<?= $unit ?>">00</span><span class="clock__label"><?= $label ?></span></div>
      <?php endforeach; ?>
    </div>
    <p class="countdown__done" id="clock-done" hidden>C'est aujourd'hui ! Merci d'être à nos côtés.</p>
  </div>
</section>

<!-- 8. RSVP -->
<section class="section section--ivory" id="rsvp" aria-labelledby="rsvp-title">
  <header class="section__head reveal">
    <p class="eyebrow">RSVP</p>
    <h2 class="section__title" id="rsvp-title">Serez-vous <em>des nôtres ?</em></h2>
    <p class="section__sub">Merci de nous répondre avant le <strong><?= e(date_fr(cfg('rsvp_deadline'), false)) ?></strong>.</p>
  </header>

  <div class="rsvp reveal">
    <form class="rsvp__form" id="rsvp-form" novalidate>
      <input type="hidden" name="elapsed" id="elapsed" value="0">
      <div class="hp" aria-hidden="true"><label>Site web <input name="website" tabindex="-1" autocomplete="off"></label></div>

      <div class="field">
        <input id="f-name" name="full_name" type="text" placeholder=" " autocomplete="name" required maxlength="80">
        <label for="f-name">Nom et prénom</label>
        <p class="field__err" id="err-full_name"></p>
      </div>
      <div class="field">
        <input id="f-contact" name="contact" type="text" placeholder=" " autocomplete="email" required maxlength="120" inputmode="email">
        <label for="f-contact">E-mail ou numéro WhatsApp</label>
        <p class="field__err" id="err-contact"></p>
      </div>

      <fieldset class="choice">
        <legend>Votre réponse</legend>
        <label class="choice__opt"><input type="radio" name="attending" value="yes" required><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>Je viens avec joie</span></label>
        <label class="choice__opt"><input type="radio" name="attending" value="no"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>Je ne pourrai pas venir</span></label>
        <p class="field__err" id="err-attending"></p>
      </fieldset>

      <div class="when-yes" id="when-yes"><div class="when-yes-inner">
        <div class="stepper">
          <span class="stepper__label" id="comp-label">Accompagnants</span>
          <div class="stepper__ctrl">
            <button type="button" data-step="-1" aria-label="Retirer un accompagnant">−</button>
            <output id="comp-out" aria-labelledby="comp-label" aria-live="polite">0</output>
            <button type="button" data-step="1" aria-label="Ajouter un accompagnant">+</button>
          </div>
          <input type="hidden" name="companions" id="f-comp" value="0" data-max="<?= (int) cfg('max_companions') ?>">
        </div>
        <div class="field">
          <input id="f-diet" name="diet" type="text" placeholder=" " maxlength="200">
          <label for="f-diet">Régime alimentaire ou allergies (facultatif)</label>
        </div>
      </div></div>

      <div class="field">
        <textarea id="f-msg" name="message" rows="3" placeholder=" " maxlength="500"></textarea>
        <label for="f-msg">Un mot pour les mariés (facultatif)</label>
      </div>

      <label class="check"><input type="checkbox" name="is_public" value="1" checked><span>Afficher mon prénom et mon message dans la liste « Ils seront présents »</span></label>

      <p class="rsvp__error" id="rsvp-error" role="alert"></p>
      <div class="rsvp__actions">
        <button type="submit" class="btn btn--gold btn--block" id="rsvp-submit"><span>Envoyer ma réponse</span></button>
        <a class="btn btn--wa btn--block" id="wa-btn" href="https://wa.me/<?= e(cfg('whatsapp')) ?>" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3Z"/></svg>
          Répondre via WhatsApp
        </a>
      </div>
    </form>

    <div class="rsvp__done" id="rsvp-done" hidden tabindex="-1">
      <svg class="tick" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-15"/></svg>
      <h3 class="rsvp__done-title" id="done-title">Merci, votre présence est confirmée.</h3>
      <p id="done-text">Nous avons hâte de célébrer ce jour avec vous.</p>
      <button class="btn btn--line btn--sm" id="rsvp-again" type="button">Modifier ma réponse</button>
    </div>
  </div>
</section>

<!-- 9. ILS SERONT PRÉSENTS -->
<section class="section section--cream" id="invites" aria-labelledby="guests-title">
  <header class="section__head reveal">
    <p class="eyebrow">Ils seront présents</p>
    <h2 class="section__title" id="guests-title"><span class="counter" id="guest-count">0</span> <em id="guest-count-label">invités ont confirmé leur présence</em></h2>
  </header>
  <ul class="guests" id="guests" aria-live="polite"></ul>
  <p class="guests__empty" id="guests-empty" hidden>Soyez le premier ou la première à confirmer votre présence !</p>
</section>

<?php if ($gifts['enabled']): ?>
<!-- 10. CADEAUX -->
<section class="section gifts" id="cadeaux" aria-labelledby="gift-title">
  <div class="gifts__card reveal">
    <svg class="gifts__icon" viewBox="0 0 48 48" aria-hidden="true"><path d="M8 20h32v22H8zM5 13h38v7H5zM24 13v29M24 13c-3-6-11-8-11-2 0 2 3 2 11 2zm0 0c3-6 11-8 11-2 0 2-3 2-11 2z"/></svg>
    <p class="eyebrow">Liste de mariage</p>
    <h2 class="section__title" id="gift-title">Un geste <em>de cœur</em></h2>
    <p class="gifts__text"><?= e($gifts['text']) ?></p>
    <a class="btn btn--gold" href="<?= e($gifts['link_url']) ?>" target="_blank" rel="noopener"><?= e($gifts['link_label']) ?></a>
    <?php if (!empty($gifts['mobile_money'])): ?>
    <p class="gifts__mm"><?= e($gifts['mobile_money']) ?>
      <button class="copy" type="button" data-copy="<?= e(preg_replace('/^.*?:\s*/', '', $gifts['mobile_money'])) ?>">Copier</button></p>
    <?php endif; ?>
  </div>
</section>
<?php endif; ?>

<!-- 11. FAQ -->
<section class="section section--ivory" id="faq" aria-labelledby="faq-title">
  <header class="section__head reveal">
    <p class="eyebrow">FAQ</p>
    <h2 class="section__title" id="faq-title">Questions <em>fréquentes</em></h2>
  </header>
  <div class="faq">
    <?php
    $faq = [
      ['Puis-je venir avec un accompagnant ?', "Oui, dans la limite des places indiquées sur votre invitation. Merci de préciser le nombre d'accompagnants dans le formulaire RSVP afin que nous puissions organiser le placement."],
      ['Quel est le dress code ?', $dc['title'] . ' — ' . $dc['text']],
      ['Y a-t-il un parking ?', "Oui, un parking gratuit et surveillé est disponible sur place, à l'église comme au domaine de réception."],
      ['Jusqu\'à quand puis-je confirmer ma présence ?', "Merci de confirmer avant le " . date_fr(cfg('rsvp_deadline'), false) . ". Vous pouvez modifier votre réponse à tout moment en renvoyant le formulaire avec le même e-mail ou numéro."],
      ['Comment me rendre au lieu ?', "La cérémonie a lieu à {$cer['place']} ({$cer['address']}), puis la réception à {$rec['place']} ({$rec['address']}). Les boutons « Voir sur Google Maps » de la section Le jour J vous guideront."],
    ];
    foreach ($faq as $i => [$q, $a]): ?>
    <details class="faq__item reveal" style="--d:<?= $i * 70 ?>ms">
      <summary><?= e($q) ?><span class="faq__icon" aria-hidden="true"></span></summary>
      <div class="faq__body"><p><?= e($a) ?></p></div>
    </details>
    <?php endforeach; ?>
  </div>
</section>
</main>

<!-- 12. PIED DE PAGE -->
<footer class="footer">
  <p class="footer__mono"><?= e($monogram) ?></p>
  <p class="footer__names script"><?= e($g['name']) ?> <span class="amp">&amp;</span> <?= e($b['name']) ?></p>
  <p class="footer__date"><?= e($dateShort) ?> · <?= e(cfg('city')) ?></p>
  <p class="footer__tag"><?= e(cfg('hashtag')) ?></p>
  <p class="footer__thanks">Merci de faire partie de notre histoire. Nous avons hâte de vous retrouver.</p>
  <nav class="footer__links" aria-label="Liens rapides">
    <a href="#galerie">Galerie</a><a href="#rsvp">RSVP</a><a href="<?= e(maps_url($cer['maps'])) ?>" target="_blank" rel="noopener">Localisation</a>
  </nav>
</footer>

<!-- Lightbox -->
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Photo agrandie" hidden>
  <button class="lightbox__close" aria-label="Fermer">×</button>
  <button class="lightbox__nav lightbox__prev" aria-label="Photo précédente">‹</button>
  <figure class="lightbox__fig"><img alt=""><figcaption></figcaption></figure>
  <button class="lightbox__nav lightbox__next" aria-label="Photo suivante">›</button>
  <p class="lightbox__count" aria-live="polite"></p>
</div>

<script>window.WEDDING = <?= json_encode([
  'couple' => $couple,
  'whatsapp' => cfg('whatsapp'),
  'maxCompanions' => (int) cfg('max_companions'),
  'static' => defined('STATIC_BUILD'),
], JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) ?>;</script>
<script src="assets/js/main.js?v=<?= filemtime(__DIR__ . '/assets/js/main.js') ?>" defer></script>
</body>
</html>
