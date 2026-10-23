# Invitation de mariage — Daniel & Grâce

Site d'invitation en HTML, CSS et JavaScript. Tous les fichiers sont à la racine, sans sous-dossier.

## Mise en ligne (GitHub Pages)
1. Envoyez **tous les fichiers de ce dossier** à la racine du dépôt (« Add file → Upload files »).
2. Ouvrez **Settings → Pages**. Choisissez **Deploy from a branch**, la branche `main` et le dossier `/ (root)`.
3. Une à deux minutes plus tard, le site s'affiche à l'adresse `https://VOTRE-PSEUDO.github.io/NOM-DU-DEPOT/`.

## Réponses RSVP (Google Sheets)
Collez l'adresse de votre script Google Apps Script (elle se termine par `/exec`) dans **`config.js`** :
```js
window.WEDDING_ENDPOINT = 'https://script.google.com/macros/s/XXXX/exec';
```
Tant que ce fichier est vide, les invités répondent via WhatsApp, avec un message déjà rédigé.

## Espace mariés
`admin.html` : statistiques, régimes alimentaires, messages et export CSV. L'accès se fait avec le mot de passe défini dans le script Google.
