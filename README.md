# Invitation de mariage — Daniel & Grâce

Site d'invitation one-page (PHP 8 + JavaScript sans framework + SQLite).
Il fonctionne tel quel sous WAMP : http://localhost/mariage3/

## Personnaliser
Tout se règle dans **`config.php`** : prénoms, familles, date, lieux, dress code,
programme, histoire, cagnotte, numéro WhatsApp, e-mails de notification.

## Photos
1. Déposez les photos à la racine du projet.
2. Lancez : `php tools/optimize-images.php`. Le script génère les versions WebP et JPEG
   dans `assets/img/`, ainsi que l'image de partage `og-image.jpg`.
3. Fond héro : un fichier dont le nom contient « arriere » ou « arrière » est utilisé
   automatiquement. À défaut, le script prend la photo du couple dans l'escalier.

## Espace mariés
`/admin.php`. Mot de passe par défaut : **Mariage2027!**. Changez-le avant la mise en ligne :
```
php -r "echo password_hash('NouveauMotDePasse', PASSWORD_DEFAULT);"
```
puis collez le résultat dans `admin_password_hash` (config.php).

L'espace mariés permet de :
- voir les statistiques et les réponses ;
- consulter les régimes alimentaires et les messages ;
- exporter les réponses en CSV (compatible Excel) ;
- masquer ou supprimer une réponse.

## Données & confidentialité
- Les réponses sont stockées dans `data/rsvp.sqlite`. Ce dossier est bloqué par `.htaccess`, tout comme `lib/`, `tools/` et `config.php`.
- La liste publique n'affiche que le prénom et l'initiale du nom, le nombre d'accompagnants et le message, seulement si l'invité a coché la case d'affichage. Les e-mails, numéros et régimes alimentaires n'y apparaissent jamais.
- Anti-spam : champ piège invisible, temps minimal de remplissage, 6 envois maximum par adresse IP toutes les 10 minutes.
- Un même e-mail ou numéro peut modifier sa réponse : la nouvelle remplace l'ancienne.

## Notifications
Un e-mail part vers `notify_emails` à chaque réponse, via la fonction `mail()` de PHP.
En local, WAMP n'envoie pas d'e-mails. Chez un hébergeur PHP classique, ça fonctionne en général sans réglage.

## Mise en ligne
N'importe quel hébergement PHP 8+ avec Apache convient (o2switch, Hostinger, OVH…) :
copiez le dossier, vérifiez que `data/` est accessible en écriture et renseignez
`site_url` dans config.php pour l'aperçu WhatsApp (Open Graph).
