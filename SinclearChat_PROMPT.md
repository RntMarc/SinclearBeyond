# SinclearChat - Read Receipts Implementation

Die folgenden Änderungen müssen im SinclearChat PHP Backend durchgeführt werden, um "Gelesen"-Markierungen für Chats zu unterstützen.

## 1. Datenbank-Migration

Erstelle eine neue Migration `migrations/004_read_receipts.sql`:

```sql
CREATE TABLE IF NOT EXISTS ChatReadReceipts (
    user_id VARCHAR(255) NOT NULL,
    chat_id VARCHAR(255) NOT NULL,
    chat_type ENUM('direct', 'group') NOT NULL,
    last_read_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, chat_id, chat_type),
    INDEX idx_read_receipts_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 2. Neues Model: `src/Models/ReadReceipt.php`

```php
<?php
declare(strict_types=1);
namespace SinclearChat\Models;
use SinclearChat\Database;

final class ReadReceipt {
    public static function update(string $userId, string $chatId, string $chatType): bool {
        if (!in_array($chatType, ['direct', 'group'], true)) return false;
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO ChatReadReceipts (user_id, chat_id, chat_type, last_read_at)
             VALUES (:user_id, :chat_id, :chat_type, CURRENT_TIMESTAMP(6))
             ON DUPLICATE KEY UPDATE last_read_at = CURRENT_TIMESTAMP(6)'
        );
        return $stmt->execute([':user_id' => $userId, ':chat_id' => $chatId, ':chat_type' => $chatType]);
    }

    public static function getUnreadCounts(string $userId): array {
        $db = Database::getConnection();
        $sqlGroup = "SELECT m.chat_id, COUNT(*) as unread_count FROM ChatMessages m
            JOIN ChatRoomMembers crm ON m.chat_id = crm.chat_room_id AND crm.user_id = :user_id1
            LEFT JOIN ChatReadReceipts rr ON rr.user_id = :user_id2 AND rr.chat_id = m.chat_id AND rr.chat_type = 'group'
            WHERE m.chat_type = 'group' AND m.user_id != :user_id3 AND (rr.last_read_at IS NULL OR m.created_at > rr.last_read_at)
            GROUP BY m.chat_id";
        $stmtGroup = $db->prepare($sqlGroup);
        $stmtGroup->execute([':user_id1' => $userId, ':user_id2' => $userId, ':user_id3' => $userId]);
        $groupCounts = $stmtGroup->fetchAll(\PDO::FETCH_KEY_PAIR);

        $sqlDirect = "SELECT m.user_id as chat_partner_id, COUNT(*) as unread_count FROM ChatMessages m
            LEFT JOIN ChatReadReceipts rr ON rr.user_id = :user_id1 AND rr.chat_id = m.user_id AND rr.chat_type = 'direct'
            WHERE m.chat_type = 'direct' AND m.chat_id = :user_id2 AND (rr.last_read_at IS NULL OR m.created_at > rr.last_read_at)
            GROUP BY m.user_id";
        $stmtDirect = $db->prepare($sqlDirect);
        $stmtDirect->execute([':user_id1' => $userId, ':user_id2' => $userId]);
        $directCounts = $stmtDirect->fetchAll(\PDO::FETCH_KEY_PAIR);

        return [
            'group' => $groupCounts,
            'direct' => $directCounts,
            'total' => array_sum($groupCounts) + array_sum($directCounts)
        ];
    }
}
```

## 3. Neuer Controller: `src/Controllers/ReadController.php`

```php
<?php
declare(strict_types=1);
namespace SinclearChat\Controllers;
use SinclearChat\Response;
use SinclearChat\Models\ReadReceipt;

final class ReadController {
    public static function markAsRead(): Response {
        $input = json_decode((string)file_get_contents('php://input'), true);
        $userId = trim((string)($input['user_id'] ?? ''));
        $chatId = trim((string)($input['chat_id'] ?? ''));
        $chatType = trim((string)($input['chat_type'] ?? ''));
        if (!$userId || !$chatId || !$chatType) return Response::error('Missing fields');
        return ReadReceipt::update($userId, $chatId, $chatType) ? Response::success(['status' => 'ok']) : Response::error('Failed', 500);
    }
    public static function getUnread(): Response {
        $userId = trim((string)($_GET['user_id'] ?? ''));
        if (!$userId) return Response::error('Missing user_id');
        return Response::success(ReadReceipt::getUnreadCounts($userId));
    }
}
```

## 4. Routen registrieren in `public/index.php`

Füge folgende Routen hinzu:

```php
$router->post('/api/read', function () {
    return \SinclearChat\Controllers\ReadController::markAsRead();
});

$router->get('/api/unread', function () {
    return \SinclearChat\Controllers\ReadController::getUnread();
});
```
