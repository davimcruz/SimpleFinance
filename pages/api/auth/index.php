<?php
// Conexão com o banco de dados MySQL
$servername = "localhost";
$username = "davmac53_simplefinance";
$password = "Davi123@";
$database = "davmac53_simplefinance";

$conn = new mysqli($servername, $username, $password, $database);

// Verificar conexão
if ($conn->connect_error) {
    die("Falha na conexão com o banco de dados: " . $conn->connect_error);
}

// Processar dados do formulário de registro
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST["email"];
    $password = $_POST["password"];

    // Inserir dados no banco de dados
    $sql = "INSERT INTO usuarios (email, senha) VALUES ('$email', '$password')";

    if ($conn->query($sql) === TRUE) {
        echo "Usuário registrado com sucesso";
    } else {
        echo "Erro ao registrar usuário: " . $conn->error;
    }
}

$conn->close();