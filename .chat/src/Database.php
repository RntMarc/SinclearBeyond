<?php

declare(strict_types=1);

namespace SinclearChat;

final class Database
{
    private static ?\PDO $instance = null;

    public static function getConnection(): \PDO
    {
        if (self::$instance === null) {
            $config = Config::getInstance();

            $host = $config->get('DB_HOST', '127.0.0.1');
            $port = $config->get('DB_PORT', '3306');
            $name = $config->get('DB_NAME', 'sinclearchat');
            $user = $config->get('DB_USER', 'root');
            $pass = $config->get('DB_PASSWORD', '');

            $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

            self::$instance = new \PDO($dsn, $user, $pass, [
                \PDO::ATTR_ERRMODE            => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                \PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
            self::$instance->exec("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
        }

        return self::$instance;
    }

    public static function getMigrationConnection(): \PDO
    {
        $config = Config::getInstance();

        $host = $config->get('DB_HOST', '127.0.0.1');
        $port = $config->get('DB_PORT', '3306');
        $name = $config->get('DB_NAME', 'sinclearchat');
        $user = $config->get('DB_USER', 'root');
        $pass = $config->get('DB_PASSWORD', '');

        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

        $pdo = new \PDO($dsn, $user, $pass, [
            \PDO::ATTR_ERRMODE                  => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_DEFAULT_FETCH_MODE       => \PDO::FETCH_ASSOC,
            \PDO::ATTR_EMULATE_PREPARES         => false,
            \PDO::MYSQL_ATTR_MULTI_STATEMENTS   => true,
        ]);
        $pdo->exec("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");

        return $pdo;
    }
}
