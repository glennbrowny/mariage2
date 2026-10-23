# Publier l'invitation sur GitHub

Le dossier **`C:\wamp64\www\mariage3`** contient le site prêt à publier : HTML, CSS, JS et images, sans sous-dossier.
Ce dossier-ci (`mariage3-source`) contient la version PHP, les outils et ce guide. Il ne se publie pas.

## 1. Mettre le site en ligne (GitHub Pages)
1. Sur github.com, cliquez sur **New repository**. Donnez-lui un nom, par exemple `mariage`, et choisissez **Public**.
2. Cliquez sur **uploading an existing file**. Ouvrez le dossier `mariage3`, sélectionnez **tous les fichiers** (Ctrl+A) et glissez-les dans la page.
   Cliquez ensuite sur **Commit changes**.
3. Ouvrez **Settings → Pages**. Dans « Source », choisissez **Deploy from a branch**, puis la branche `main` et le dossier `/ (root)`. Enregistrez.
4. Une à deux minutes plus tard, le site est en ligne à l'adresse `https://VOTRE-PSEUDO.github.io/mariage/`.

## 2. Enregistrer les réponses RSVP (Google Sheets, gratuit)
GitHub n'héberge que des pages fixes et ne peut pas stocker les réponses.
C'est donc une feuille Google qui s'en charge.

1. Sur drive.google.com, créez une **feuille Google Sheets** vide, par exemple « RSVP Mariage ».
2. Dans cette feuille, ouvrez le menu **Extensions → Apps Script**. Effacez le code présent et collez tout le contenu du fichier
   **`google-apps-script.gs`** (dans ce dossier `mariage3-source`).
3. En haut du script, modifiez :
   - `ADMIN_KEY` : le mot de passe de votre espace mariés ;
   - `NOTIFY_EMAIL` : votre adresse e-mail, pour recevoir un e-mail à chaque réponse.
4. Cliquez sur **Déployer → Nouveau déploiement**. Choisissez le type **Application Web**, puis :
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**

   Validez et acceptez les autorisations. Google affiche un avertissement : cliquez sur « Paramètres avancés », puis sur « Accéder à… ».
5. Copiez l'**URL de l'application Web**. Elle se termine par `/exec`.
6. Sur GitHub, ouvrez le fichier **`config.js`**, cliquez sur le crayon, collez l'URL entre les guillemets :
   ```js
   window.WEDDING_ENDPOINT = 'https://script.google.com/macros/s/XXXX/exec';
   ```
   Cliquez sur **Commit changes**.

Tant que `config.js` est vide, le bouton « Envoyer ma réponse » ouvre WhatsApp avec la réponse déjà rédigée. Aucune réponse n'est perdue.

## 3. Espace mariés
Ouvrez `https://VOTRE-PSEUDO.github.io/mariage/admin.html` et saisissez le mot de passe `ADMIN_KEY`.
Vous y trouvez les statistiques, les régimes alimentaires, les messages, la recherche et l'export CSV.
- Pour **masquer** un invité de la liste publique, écrivez `Oui` dans la colonne « Masqué » de la feuille Google.
- Pour **supprimer** une réponse, supprimez sa ligne dans la feuille.

## 4. Modifier le site plus tard
- **Petit texte :** modifiez directement `index.html` sur GitHub (icône crayon).
- **Gros changements** (noms, date, lieux…) : modifiez `config.php`, puis lancez
  `php tools/build-static.php` dans le dossier du projet. Le dossier `mariage3` est régénéré. Envoyez à nouveau les fichiers modifiés sur GitHub.
  Votre `config.js` n'est jamais écrasé.
- **Aperçu WhatsApp :** une fois l'adresse du site connue, renseignez `site_url` dans `config.php`, régénérez et renvoyez `index.html`.
  Le lien partagé affichera alors l'image de la carte.

Si vous modifiez le script Google, refaites **Déployer → Gérer les déploiements → Modifier → Nouvelle version**, sinon l'ancienne version reste active.
