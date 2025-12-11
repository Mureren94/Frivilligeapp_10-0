<?php
// utils.php - SIKKER VERSION

// Gemmer base64 billeder som filer med streng validering
function saveBase64Image($base64String, $folder = 'uploads/') {
    // Opret mappe hvis den mangler
    if (!file_exists($folder)) {
        mkdir($folder, 0777, true);
    }

    // Hvis dataen ikke er en base64 streng (f.eks. en URL), returner den uændret
    if (!$base64String || strpos($base64String, 'data:image') === false) {
        return $base64String; 
    }

    // 1. Rens og valider formatet (data:image/xyz;base64,...)
    if (!preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
        return null;
    }

    // 2. Decode selve dataen
    $data = substr($base64String, strpos($base64String, ',') + 1);
    $decodedData = base64_decode($data);

    if ($decodedData === false) {
        return null;
    }

    // 3. SIKKERHEDSTJEK: Brug 'finfo' til at tjekke filens reelle MIME-type (Magic Bytes)
    // Stol ALDRIG på hvad browseren/brugeren siger filtypen er.
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->buffer($decodedData);

    // Tilladte filtyper
    $allowedTypes = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/gif'  => 'gif',
        'image/webp' => 'webp'
    ];

    if (!isset($allowedTypes[$mimeType])) {
        error_log("Sikkerhedsadvarsel: Forsøg på upload af ulovlig filtype: " . $mimeType);
        return null;
    }

    // 4. SIKKERHEDSTJEK: Prøv at loade billedet med GD library
    // Dette sikrer at filen faktisk er et gyldigt billede og ikke bare en fil med falsk header
    $img = @imagecreatefromstring($decodedData);
    if (!$img) {
        error_log("Sikkerhedsadvarsel: Filen er ikke et gyldigt billede.");
        return null;
    }
    unset($img); // Ryd op i hukommelsen (PHP 8+ bruger objekter cleanup)

    // 5. Generer filnavn og gem
    $extension = $allowedTypes[$mimeType];
    $fileName = uniqid() . '.' . $extension;
    $file = $folder . $fileName;
    
    if (file_put_contents($file, $decodedData)) {
        // Returner sti relative til backend roden (vi beholder 'app/' præfixet for kompatibilitet)
        return 'app/' . $folder . $fileName;
    }

    return null;
}

// Standard JSON response helper
function jsonResponse($data) {
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Hent JSON body fra request
function getJsonInput() {
    $content = file_get_contents('php://input');
    return json_decode($content, true);
}

// Auth check - Bemærk: session_start() er fjernet herfra, da den nu ligger i index.php
function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
}
?>