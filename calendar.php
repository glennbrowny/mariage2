<?php
declare(strict_types=1);
require_once __DIR__ . '/lib/bootstrap.php';

// Fichier .ics « Ajouter au calendrier » (Apple, Outlook, Google…)
$g = cfg('groom')['name'];
$b = cfg('bride')['name'];
$start = (new DateTime(cfg('date_start')))->setTimezone(new DateTimeZone('UTC'));
$end   = (new DateTime(cfg('date_end')))->setTimezone(new DateTimeZone('UTC'));
$c = cfg('ceremony'); $r = cfg('reception');

$esc = static fn(string $s) => str_replace(["\r\n", "\n"], '\n', addcslashes($s, ',;\\'));
$desc = "Cérémonie {$c['time']} — {$c['place']}, {$c['address']}\nRéception {$r['time']} — {$r['place']}, {$r['address']}\n" . site_url();

$lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Invitation//Mariage//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:mariage-' . md5($g . $b . cfg('date_start')) . '@invitation',
    'DTSTAMP:' . gmdate('Ymd\THis\Z'),
    'DTSTART:' . $start->format('Ymd\THis\Z'),
    'DTEND:' . $end->format('Ymd\THis\Z'),
    'SUMMARY:' . $esc("Mariage de $g & $b"),
    'LOCATION:' . $esc($c['place'] . ', ' . $c['address']),
    'DESCRIPTION:' . $esc($desc),
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:' . $esc("Demain : mariage de $g & $b"), 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
];

header('Content-Type: text/calendar; charset=utf-8');
header('Content-Disposition: attachment; filename="mariage.ics"');
echo implode("\r\n", $lines) . "\r\n";
