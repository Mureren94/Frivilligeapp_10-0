<?php
require_once 'db.php';

$usersToReset = [
    'superadmin@test.dk' => 'superadmin',
    'odensemurerne@gmail.com' => 'DetteErEnTest'
];

foreach ($usersToReset as $email => $newPassword) {
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    
    try {
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
        $stmt->execute([$newHash, $email]);

        if ($stmt->rowCount() > 0) {
            echo "Adgangskode for <strong>$email</strong> er nulstillet til '<strong>$newPassword</strong>'. <br>";
        } else {
            // Check if user exists
            $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $check->execute([$email]);
            if ($check->fetch()) {
                 echo "Adgangskoden for <strong>$email</strong> var allerede '<strong>$newPassword</strong>' (eller ingen ændring nødvendig). <br>";
            } else {
                 echo "Kunne IKKE finde brugeren <strong>$email</strong> i databasen.<br>";
            }
        }
    } catch (PDOException $e) {
        echo "FEJL ved $email: " . $e->getMessage() . "<br>";
    }
}
echo "<br>Du kan nu logge ind med de nye adgangskoder.";
?>
