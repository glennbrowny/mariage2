<?php
/**
 * ─────────────────────────────────────────────────────────────
 *  CONFIGURATION DU MARIAGE — modifiez uniquement ce fichier.
 * ─────────────────────────────────────────────────────────────
 *  Tous les textes, dates et lieux affichés sur le site viennent d'ici.
 */
return [
    // ── Les mariés ──────────────────────────────────────────
    'groom' => [
        'name'    => 'Daniel',
        'bio'     => "Architecte de formation, passionné de jazz et de longues marches au bord de l'océan. Il dit souvent qu'il a dessiné beaucoup de maisons, mais qu'il n'en a trouvé qu'une seule : Grâce.",
        'message' => "Merci d'avoir fait partie de notre chemin. Votre présence sera notre plus beau cadeau.",
    ],
    'bride' => [
        'name'    => 'Grâce',
        'bio'     => "Juriste au sourire contagieux, amoureuse des fleurs blanches, des grandes tablées et des fous rires entre amies. Elle croit aux rencontres qui changent une vie.",
        'message' => "J'ai hâte de partager avec vous le plus beau jour de notre vie. Venez avec vos sourires !",
    ],
    'families' => [
        'groom' => 'M. & Mme Kouam',
        'bride' => 'M. & Mme Essomba',
    ],
    'hashtag' => '#DanielEtGrace2027',

    // ── Date (fuseau horaire du lieu de la fête) ────────────
    'timezone'   => 'Africa/Douala',
    'date_start' => '2027-06-12 14:00',   // début de la cérémonie
    'date_end'   => '2027-06-13 02:00',   // fin de la soirée (pour le calendrier)
    'rsvp_deadline' => '2027-05-15',

    // ── Lieux ───────────────────────────────────────────────
    'ceremony' => [
        'title'   => 'Cérémonie religieuse',
        'time'    => '14h00',
        'place'   => 'Église Saint-Joseph',
        'address' => 'Boulevard de la Liberté, Akwa — Douala',
        'maps'    => 'Église Saint-Joseph Akwa Douala',   // recherche Google Maps
    ],
    'reception' => [
        'title'   => 'Réception & dîner',
        'time'    => '19h00',
        'place'   => 'Domaine Les Jardins d\'Ivoire',
        'address' => 'Route de Japoma, Douala',
        'maps'    => 'Japoma Douala',
    ],
    'city' => 'Douala',

    'dress_code' => [
        'title' => 'Chic & élégant',
        'text'  => "Tons champagne, beige, sable, ivoire et doré. Nous vous remercions d'éviter le blanc intégral, réservé à la mariée.",
        'swatches' => ['#F4EEE4', '#E8DCC8', '#D9C6A5', '#C9A46A', '#8A5A3C'],
    ],

    'program' => [
        ['13h30', 'Accueil des invités',  "Installation à l'église, musique douce."],
        ['14h00', 'Cérémonie',            "Échange des vœux et des alliances."],
        ['16h00', 'Cocktail & photos',    "Rafraîchissements et séance photo avec les mariés."],
        ['19h00', 'Dîner',                "Dîner assis au Domaine Les Jardins d'Ivoire."],
        ['21h30', 'Ouverture de bal',     "Première danse des mariés."],
        ['22h00', 'Soirée dansante',      "Jusqu'au bout de la nuit."],
    ],

    'story' => [
        ['2019', 'Notre première rencontre', "Un mariage d'amis, une table mal placée et une conversation qui ne s'est jamais vraiment arrêtée.", 'couple-escalier'],
        ['2023', 'Les fiançailles',          "Deux familles réunies autour d'un même repas, et la promesse de marcher ensemble.", 'detail-bijou'],
        ['2025', 'La demande en mariage',    "Un coucher de soleil, une question murmurée, et un « oui » qui a fait trembler la voix.", 'detail-boutonniere'],
        ['2027', 'Les préparatifs',          "Robes, fleurs, fous rires et listes interminables : le grand jour approche.", 'mariee-amies'],
    ],

    // ── Cadeaux ─────────────────────────────────────────────
    'gifts' => [
        'enabled'       => true,
        'text'          => "Votre présence est notre plus beau cadeau. Si vous souhaitez néanmoins nous gâter, une cagnotte nous aidera à construire notre premier nid.",
        'link_label'    => 'Participer à la cagnotte',
        'link_url'      => 'https://www.leetchi.com/',   // à remplacer par votre lien
        'mobile_money'  => 'Orange Money / MTN MoMo : +237 6 00 00 00 00',
    ],

    // ── Contact & notifications ─────────────────────────────
    // Numéro WhatsApp au format international SANS « + » ni espaces.
    'whatsapp'      => '237600000000',
    // E-mails qui reçoivent une notification à chaque réponse (mail() de PHP).
    'notify_emails' => ['maries@example.com'],
    'from_email'    => 'no-reply@example.com',

    // ── Administration ──────────────────────────────────────
    // Mot de passe par défaut : Mariage2027!  → À CHANGER.
    // Générer un nouveau hash :  php -r "echo password_hash('VotreMotDePasse', PASSWORD_DEFAULT);"
    'admin_password_hash' => '$2y$10$IOKps/vXWkqPkT2WrWrx7uJAwbT3zv.mSF/sEgp9F9goy2wgCq9Dq',

    // URL publique du site (pour Open Graph). Laisser vide = détection automatique.
    'site_url' => '',
    'max_companions' => 4,
];
