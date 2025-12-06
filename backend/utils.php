<?php
// Gemmer base64 billeder som filer
function saveBase64Image($base64String, $folder = 'uploads/') {
    // Hvis mappen ikke findes, opret den
    if (!file_exists($folder)) {
        mkdir($folder, 0777, true);
    }

    // Hvis det ikke er base64 data (f.eks. en eksisterende sti), returner bare
    if (!$base64String || strpos($base64String, 'data:image') === false) {
        return $base64String; 
    }

    // Opdel data og decode
    $image_parts = explode(";base64,", $base64String);
    $image_type_aux = explode("image/", $image_parts[0]);
    $image_type = $image_type_aux[1];
    $image_base64 = base64_decode($image_parts[1]);
    
    // Generer unikt filnavn
    $fileName = uniqid() . '.' . $image_type;
    $file = $folder . $fileName;
    
    // Gem filen fysisk på disken
    file_put_contents($file, $image_base64);
    
    // Returner sti relative til backend roden (f.eks. 'app/uploads/fil.jpg')
    return 'app/' . $folder . $fileName;
}

// Standard JSON response helper
function jsonResponse($data) {
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Hent JSON body fra request
function getJsonInput() {
    return json_decode(file_get_contents('php://input'), true);
}

// Tjek om brugeren er logget ind
session_start();
function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
}
?>