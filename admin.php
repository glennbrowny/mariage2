<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';

start_session();
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

$error = '';
$self = strtok($_SERVER['REQUEST_URI'] ?? 'admin.php', '?');

// ── Connexion / déconnexion ──
if (($_POST['action'] ?? '') === 'login') {
    $_SESSION['tries'] = ($_SESSION['tries'] ?? 0) + 1;
    if ($_SESSION['tries'] > 8) {
        $error = 'Trop de tentatives. Fermez le navigateur et réessayez plus tard.';
    } elseif (password_verify((string) ($_POST['password'] ?? ''), cfg('admin_password_hash'))) {
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        $_SESSION['tries'] = 0;
        header("Location: $self"); exit;
    } else {
        usleep(600000);
        $error = 'Mot de passe incorrect.';
    }
}
if (($_GET['logout'] ?? '') === '1') { $_SESSION = []; session_destroy(); header("Location: $self"); exit; }

$isAdmin = !empty($_SESSION['admin']);

// ── Actions protégées ──
if ($isAdmin && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] !== 'login') {
    if (!csrf_check($_POST['csrf'] ?? null)) { http_response_code(400); exit('Jeton invalide.'); }
    $id = (int) ($_POST['id'] ?? 0);
    if ($_POST['action'] === 'toggle') db()->prepare('UPDATE rsvp SET hidden = 1 - hidden WHERE id = ?')->execute([$id]);
    if ($_POST['action'] === 'delete') db()->prepare('DELETE FROM rsvp WHERE id = ?')->execute([$id]);
    header("Location: $self#r"); exit;
}

if ($isAdmin && ($_GET['export'] ?? '') === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="rsvp-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF"); // BOM pour Excel
    fputcsv($out, ['Nom', 'Contact', 'Présence', 'Accompagnants', 'Total personnes', 'Régime / allergies', 'Message', 'Public', 'Masqué', 'Reçu le', 'Modifié le'], ';');
    foreach (db()->query('SELECT * FROM rsvp ORDER BY created_at DESC') as $r) {
        fputcsv($out, [$r['full_name'], $r['contact'], $r['attending'] ? 'Oui' : 'Non', $r['companions'],
            $r['attending'] ? 1 + $r['companions'] : 0, $r['diet'], $r['message'],
            $r['is_public'] ? 'Oui' : 'Non', $r['hidden'] ? 'Oui' : 'Non', $r['created_at'], $r['updated_at']], ';');
    }
    exit;
}

$couple = cfg('groom')['name'] . ' & ' . cfg('bride')['name'];
?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Espace mariés — <?= e($couple) ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  :root { --ivory:#FBF8F3; --cream:#F4EEE4; --gold:#B8945A; --gold-text:#8A6A36; --ink:#1C1712; --muted:#6F645A; --line:rgba(184,148,90,.35); }
  * { box-sizing: border-box; }
  body { margin:0; font-family:Jost, system-ui, sans-serif; font-weight:300; background:var(--ivory); color:var(--ink); }
  h1, h2 { font-family:"Cormorant Garamond", serif; font-weight:400; margin:0; }
  a { color: inherit; }
  .wrap { max-width:1200px; margin:0 auto; padding:24px 16px 80px; }
  .top { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px; margin-bottom:28px; }
  .top h1 { font-size:2rem; } .top h1 em { color:var(--gold-text); }
  .btn { display:inline-flex; align-items:center; min-height:40px; padding:0 16px; border:1px solid var(--gold); background:#fff; font:inherit; font-size:.75rem; letter-spacing:.15em; text-transform:uppercase; text-decoration:none; cursor:pointer; color:var(--ink); }
  .btn--dark { background:var(--ink); color:#fff; border-color:var(--ink); }
  .stats { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:12px; margin-bottom:32px; }
  .stat { background:#fff; border:1px solid var(--line); padding:18px; }
  .stat b { display:block; font-family:"Cormorant Garamond", serif; font-size:2.6rem; font-weight:400; line-height:1; color:var(--gold-text); }
  .stat span { font-size:.72rem; letter-spacing:.15em; text-transform:uppercase; color:var(--muted); }
  .panel { background:#fff; border:1px solid var(--line); padding:20px; margin-bottom:24px; }
  .panel h2 { font-size:1.6rem; margin-bottom:12px; }
  .tools { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
  .tools input, .tools select { min-height:40px; padding:0 12px; border:1px solid var(--line); font:inherit; background:#fff; }
  .tools input { flex:1; min-width:200px; }
  .table-wrap { overflow-x:auto; }
  table { width:100%; border-collapse:collapse; font-size:.9rem; }
  th, td { text-align:left; padding:10px 8px; border-bottom:1px solid var(--line); vertical-align:top; }
  th { font-weight:500; font-size:.7rem; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); white-space:nowrap; }
  tr.is-hidden td { opacity:.45; }
  .pill { display:inline-block; padding:2px 10px; border-radius:99px; font-size:.75rem; white-space:nowrap; }
  .yes { background:#E6F0E6; color:#2E6B3A; } .no { background:#F5E4E0; color:#8A3A2A; }
  td form { display:inline; }
  td button { border:0; background:none; font:inherit; font-size:.8rem; text-decoration:underline; cursor:pointer; color:var(--muted); padding:4px; }
  .msg { max-width:280px; font-style:italic; color:var(--muted); }
  ul.list { margin:0; padding-left:18px; } ul.list li { margin-bottom:6px; }
  .login { max-width:380px; margin:12vh auto; background:#fff; border:1px solid var(--line); padding:40px 28px; text-align:center; }
  .login input { width:100%; min-height:48px; padding:0 14px; border:1px solid var(--line); font:inherit; margin:18px 0 12px; }
  .err { color:#A33A2A; font-size:.9rem; }
  .grid2 { display:grid; gap:24px; } @media (min-width:860px) { .grid2 { grid-template-columns:1fr 1fr; } }
</style>
</head>
<body>
<?php if (!$isAdmin): ?>
  <form class="login" method="post">
    <h1>Espace mariés</h1>
    <p style="color:var(--muted)"><?= e($couple) ?></p>
    <input type="hidden" name="action" value="login">
    <label for="pw" class="sr">Mot de passe</label>
    <input id="pw" type="password" name="password" placeholder="Mot de passe" autocomplete="current-password" required autofocus>
    <?php if ($error): ?><p class="err" role="alert"><?= e($error) ?></p><?php endif; ?>
    <button class="btn btn--dark" type="submit" style="width:100%;justify-content:center">Se connecter</button>
  </form>
<?php else:
    $rows = db()->query('SELECT * FROM rsvp ORDER BY created_at DESC')->fetchAll();
    $yes = array_filter($rows, fn($r) => $r['attending']);
    $no  = count($rows) - count($yes);
    $people = array_sum(array_map(fn($r) => 1 + $r['companions'], $yes));
    $diets = array_filter($yes, fn($r) => trim((string) $r['diet']) !== '');
    $msgs  = array_filter($rows, fn($r) => trim((string) $r['message']) !== '');
    $csrf = csrf_token();
?>
  <div class="wrap">
    <div class="top">
      <h1>Espace mariés — <em><?= e($couple) ?></em></h1>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn" href="./" target="_blank">Voir le site</a>
        <a class="btn" href="?export=csv">Exporter CSV</a>
        <a class="btn btn--dark" href="?logout=1">Déconnexion</a>
      </div>
    </div>

    <div class="stats">
      <div class="stat"><b><?= $people ?></b><span>Personnes attendues</span></div>
      <div class="stat"><b><?= count($yes) ?></b><span>Réponses « oui »</span></div>
      <div class="stat"><b><?= $no ?></b><span>Réponses « non »</span></div>
      <div class="stat"><b><?= $people - count($yes) ?></b><span>Accompagnants</span></div>
      <div class="stat"><b><?= count($diets) ?></b><span>Régimes / allergies</span></div>
    </div>

    <div class="grid2">
      <div class="panel">
        <h2>Régimes alimentaires & allergies</h2>
        <?php if (!$diets): ?><p style="color:var(--muted)">Aucun pour l'instant.</p><?php else: ?>
        <ul class="list"><?php foreach ($diets as $r): ?><li><b><?= e($r['full_name']) ?></b> (<?= 1 + $r['companions'] ?> pers.) — <?= e($r['diet']) ?></li><?php endforeach; ?></ul>
        <?php endif; ?>
      </div>
      <div class="panel">
        <h2>Messages des invités</h2>
        <?php if (!$msgs): ?><p style="color:var(--muted)">Aucun message pour l'instant.</p><?php else: ?>
        <ul class="list"><?php foreach ($msgs as $r): ?><li><b><?= e($r['full_name']) ?></b> : <i><?= e($r['message']) ?></i></li><?php endforeach; ?></ul>
        <?php endif; ?>
      </div>
    </div>

    <div class="panel" id="r">
      <h2>Toutes les réponses (<?= count($rows) ?>)</h2>
      <div class="tools">
        <input type="search" id="q" placeholder="Rechercher un nom, un contact…" aria-label="Rechercher">
        <select id="f" aria-label="Filtrer"><option value="">Toutes</option><option value="yes">Présents</option><option value="no">Absents</option></select>
      </div>
      <div class="table-wrap">
      <table>
        <thead><tr><th>Nom</th><th>Contact</th><th>Présence</th><th>Accomp.</th><th>Régime</th><th>Message</th><th>Reçu le</th><th>Liste publique</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($rows as $r): ?>
          <tr class="<?= $r['hidden'] ? 'is-hidden' : '' ?>" data-att="<?= $r['attending'] ? 'yes' : 'no' ?>">
            <td><b><?= e($r['full_name']) ?></b></td>
            <td><?= e($r['contact']) ?></td>
            <td><span class="pill <?= $r['attending'] ? 'yes' : 'no' ?>"><?= $r['attending'] ? 'Présent' : 'Absent' ?></span></td>
            <td><?= (int) $r['companions'] ?></td>
            <td><?= e($r['diet'] ?: '—') ?></td>
            <td class="msg"><?= e($r['message'] ?: '—') ?></td>
            <td style="white-space:nowrap"><?= e(date('d/m/Y H:i', strtotime($r['updated_at']))) ?></td>
            <td><?= !$r['is_public'] ? 'Refusé par l\'invité' : ($r['hidden'] ? 'Masqué' : 'Visible') ?></td>
            <td style="white-space:nowrap">
              <form method="post"><input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id" value="<?= (int) $r['id'] ?>">
                <button name="action" value="toggle"><?= $r['hidden'] ? 'Afficher' : 'Masquer' ?></button>
                <button name="action" value="delete" onclick="return confirm('Supprimer définitivement cette réponse ?')">Supprimer</button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
        <?php if (!$rows): ?><tr><td colspan="9" style="color:var(--muted)">Aucune réponse pour l'instant.</td></tr><?php endif; ?>
        </tbody>
      </table>
      </div>
    </div>
  </div>
  <script>
    const q = document.getElementById('q'), f = document.getElementById('f');
    const filter = () => document.querySelectorAll('tbody tr[data-att]').forEach((tr) => {
      tr.hidden = !(tr.textContent.toLowerCase().includes(q.value.toLowerCase()) && (!f.value || tr.dataset.att === f.value));
    });
    q.addEventListener('input', filter); f.addEventListener('change', filter);
  </script>
<?php endif; ?>
<style>.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}</style>
</body>
</html>
