/**
 * ─────────────────────────────────────────────────────────────
 *  RSVP du mariage — backend Google Sheets (gratuit, sans serveur)
 * ─────────────────────────────────────────────────────────────
 *  Ce fichier ne va PAS sur GitHub : il se colle dans Google Apps Script.
 *  Mode d'emploi complet : voir LISEZ-MOI.md dans le dossier « github ».
 *
 *  1. Créez une feuille Google Sheets vide.
 *  2. Menu Extensions → Apps Script, collez tout ce fichier, enregistrez.
 *  3. Changez ADMIN_KEY et NOTIFY_EMAIL ci-dessous.
 *  4. Déployer → Nouveau déploiement → Type « Application Web »
 *       Exécuter en tant que : Moi   |   Accès : Tout le monde
 *  5. Copiez l'URL obtenue (…/exec) dans config.js du site.
 */

const ADMIN_KEY      = 'CHANGEZ-MOI-mot-de-passe-admin';   // mot de passe de admin.html
const NOTIFY_EMAIL   = '';                                  // ex. 'maries@gmail.com' (vide = pas d'e-mail)
const MAX_COMPANIONS = 4;
const SHEET_NAME     = 'RSVP';
const HEADERS = ['Reçu le', 'Modifié le', 'Nom', 'Contact', 'Clé contact', 'Présence', 'Accompagnants',
                 'Régime / allergies', 'Message', 'Liste publique', 'Masqué'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sh;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  return String(v == null ? '' : v).replace(/<[^>]*>/g, '').trim().slice(0, max);
}

/** Prénom + initiale du nom : « Marie-Claire D. » */
function publicName_(full) {
  const parts = String(full).trim().split(/\s+/);
  return parts.length > 1 ? parts[0] + ' ' + parts[parts.length - 1].charAt(0).toUpperCase() + '.' : parts[0];
}

function rows_() {
  const values = sheet_().getDataRange().getValues();
  values.shift();
  return values.map((r) => ({
    created: r[0], updated: r[1], name: r[2], contact: r[3], key: r[4],
    attending: r[5] === 'Oui', companions: Number(r[6]) || 0, diet: r[7], message: r[8],
    isPublic: r[9] === 'Oui', hidden: String(r[10]).toLowerCase() === 'oui',
  }));
}

/** Enregistrement d'une réponse (formulaire du site). */
function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return json_({ ok: true, attending: true });                    // robot : champ piège rempli
  if (Number(p.elapsed || 0) < 2500) return json_({ ok: false, error: 'Merci de prendre le temps de remplir le formulaire.' });

  const name = clean_(p.full_name, 80);
  const contact = clean_(p.contact, 120);
  const att = p.attending === 'yes' ? 1 : p.attending === 'no' ? 0 : -1;
  let comp = Math.max(0, Math.min(MAX_COMPANIONS, parseInt(p.companions, 10) || 0));
  const diet = clean_(p.diet, 200);
  const msg = clean_(p.message, 500);
  const isPublic = p.is_public && p.is_public !== 'false';

  const fields = {};
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const digits = contact.replace(/\D+/g, '');
  if (name.length < 2) fields.full_name = 'Indiquez votre nom et prénom.';
  if (!isEmail && digits.length < 8) fields.contact = 'Indiquez un e-mail ou un numéro WhatsApp valide.';
  if (att === -1) fields.attending = 'Dites-nous si vous serez présent(e).';
  if (Object.keys(fields).length) return json_({ ok: false, error: 'Certains champs sont à corriger.', fields });
  if (att === 0) comp = 0;

  const key = isEmail ? contact.toLowerCase() : digits;
  const now = new Date();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_();
    const keys = sh.getLastRow() > 1 ? sh.getRange(2, 5, sh.getLastRow() - 1, 1).getValues().map((r) => String(r[0])) : [];
    const idx = keys.indexOf(key);
    // Le texte commençant par = + - @ est préfixé d'une apostrophe (pas de formule injectée dans la feuille).
    const safe = (v) => (/^[=+\-@]/.test(v) ? "'" + v : v);
    const row = [now, now, safe(name), safe(contact), "'" + key, att ? 'Oui' : 'Non', comp, safe(diet), safe(msg), isPublic ? 'Oui' : 'Non', 'Non'];
    if (idx >= 0) {
      // Même contact : on met à jour la réponse existante (on garde la date de création et l'état « Masqué »).
      const r = idx + 2;
      const old = sh.getRange(r, 1, 1, HEADERS.length).getValues()[0];
      row[0] = old[0]; row[10] = old[10] || 'Non';
      sh.getRange(r, 1, 1, HEADERS.length).setValues([row]);
    } else {
      sh.appendRow(row);
    }
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail(NOTIFY_EMAIL, (att ? '✓ Présent : ' : '✗ Absent : ') + name,
        'Nouvelle réponse RSVP\n\nNom : ' + name + '\nContact : ' + contact + '\nPrésence : ' + (att ? 'Oui' : 'Non') +
        '\nAccompagnants : ' + comp + '\nRégime / allergies : ' + (diet || '—') + '\nMessage : ' + (msg || '—'));
    } catch (err) { /* quota e-mail atteint : la réponse reste enregistrée */ }
  }
  return json_({ ok: true, attending: !!att, name: publicName_(name) });
}

/** Lecture : liste publique (?action=guests) ou espace mariés (?action=admin&key=…). */
function doGet(e) {
  const p = (e && e.parameter) || {};
  const rows = rows_();

  if (p.action === 'admin') {
    if (p.key !== ADMIN_KEY) return json_({ ok: false, error: 'Mot de passe incorrect.' });
    return json_({ ok: true, rows: rows.map((r) => ({
      name: r.name, contact: r.contact, attending: r.attending, companions: r.companions, diet: r.diet,
      message: r.message, isPublic: r.isPublic, hidden: r.hidden, updated: r.updated,
    })) });
  }

  // Liste publique : aucune donnée privée (ni contact, ni régime alimentaire).
  const yes = rows.filter((r) => r.attending && !r.hidden);
  const count = yes.reduce((n, r) => n + 1 + r.companions, 0);
  const guests = yes.reverse().filter((r) => r.isPublic).map((r) => ({
    name: publicName_(r.name), companions: r.companions, message: r.message ? String(r.message).slice(0, 140) : null,
  }));
  return json_({ count, responses: yes.length, guests });
}
