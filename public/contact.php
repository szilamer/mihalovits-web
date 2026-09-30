<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Csak POST kérés engedélyezett.']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Hibás kérés.']);
    exit;
}

if (!empty($data['company'])) {
    echo json_encode(['ok' => true]);
    exit;
}

$name = trim((string) ($data['name'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$phone = trim((string) ($data['phone'] ?? ''));
$topic = trim((string) ($data['topic'] ?? ''));
$message = trim((string) ($data['message'] ?? ''));
$consent = !empty($data['consent']);

$errors = [];
if (mb_strlen($name) < 3) {
    $errors['name'] = 'Kérem, adja meg a teljes nevét.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Érvényes e-mail címet adjon meg.';
}
if ($phone !== '' && !preg_match('/^[+\d][\d\s()\/-]{6,}$/', $phone)) {
    $errors['phone'] = 'A telefonszám formátuma nem megfelelő.';
}
if ($topic === '') {
    $errors['topic'] = 'Válasszon témát, hogy gyorsabban tudjak reagálni.';
}
if (mb_strlen($message) < 20) {
    $errors['message'] = 'Kérem, írjon legalább néhány mondatot az ügyről (min. 20 karakter).';
}
if (mb_strlen($message) > 4000) {
    $errors['message'] = 'Az üzenet túl hosszú (max. 4000 karakter).';
}
if (!$consent) {
    $errors['consent'] = 'Az adatkezelési tájékoztató elfogadása szükséges.';
}

if ($errors !== []) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'errors' => $errors]);
    exit;
}

$to = 'info@mihalovits.eu';
$subject = 'Új megkeresés a weboldalról: ' . $topic;
$body = implode("\n", [
    'Új megkeresés érkezett a mm.logframe.cc űrlapról.',
    '',
    'Név: ' . $name,
    'E-mail: ' . $email,
    'Telefon: ' . ($phone !== '' ? $phone : '–'),
    'Téma: ' . $topic,
    '',
    $message,
]);

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: Mihalovits web <noreply@mm.logframe.cc>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'X-Mailer: mm.logframe.cc',
];

$sent = @mail($to, $encodedSubject, $body, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Az üzenet küldése nem sikerült.']);
    exit;
}

echo json_encode(['ok' => true]);
