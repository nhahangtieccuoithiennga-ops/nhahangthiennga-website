<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dbFile = __DIR__ . '/tn_crm.sqlite';
$conn = new SQLite3($dbFile, SQLITE3_OPEN_READWRITE | SQLITE3_OPEN_CREATE);
$conn->exec('PRAGMA foreign_keys = ON');
$conn->exec("CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT,
    price REAL,
    description TEXT,
    stock INTEGER
)");
$conn->exec("CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    zalo TEXT,
    registered_at TEXT
)");
$conn->exec("CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    amount REAL,
    status TEXT,
    purchased_at TEXT,
    order_id TEXT,
    payment_url TEXT,
    payment_status TEXT DEFAULT 'pending'
)");

$checkoutColumns = $conn->query("PRAGMA table_info(orders)");
$existingColumns = [];
while ($row = $checkoutColumns->fetchArray(SQLITE3_ASSOC)) {
    $existingColumns[] = $row['name'];
}
if (!in_array('order_id', $existingColumns, true)) {
    $conn->exec('ALTER TABLE orders ADD COLUMN order_id TEXT');
}
if (!in_array('payment_url', $existingColumns, true)) {
    $conn->exec('ALTER TABLE orders ADD COLUMN payment_url TEXT');
}
if (!in_array('payment_status', $existingColumns, true)) {
    $conn->exec("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending'");
}

$conn->exec("UPDATE orders
    SET order_id = COALESCE(order_id, 'TN-' || printf('%06d', id)),
        payment_url = COALESCE(payment_url, 'https://vietqr.app/img?bank=TPBank&acc=10004884646&template=compact&amount=' || CAST(COALESCE(amount, 0) AS INTEGER) || '&des=' || 'TN-' || printf('%06d', id)),
        payment_status = COALESCE(payment_status, 'pending')
    WHERE order_id IS NULL OR payment_url IS NULL OR payment_status IS NULL");

$seedCheck = $conn->querySingle("SELECT COUNT(*) FROM products");
if ((int)$seedCheck === 0) {
    $conn->exec("INSERT INTO products (name, type, price, description, stock) VALUES
        ('Checklist Tiệc Cưới', 'digital', 199000, 'Checklist chuẩn bị tiệc, viết gọn, dễ dùng.', NULL),
        ('Set Menu Cưới', 'service', 2200000, 'Gói tư vấn menu cho tiệc cưới.', NULL),
        ('Bàn ghế tiệc', 'physical', 1200000, 'Bàn ghế cho sự kiện gia đình.', 20)");

    $conn->exec("INSERT INTO customers (name, phone, zalo, registered_at) VALUES
        ('Nguyễn Văn A', '0900000000', '0900000000', '2026-08-01'),
        ('Trần Thị B', '0911111111', '0911111111', '2026-08-01')");

    $conn->exec("INSERT INTO orders (customer_id, product_id, amount, status, purchased_at) VALUES
        (1, 1, 199000, 'pending', '2026-08-01'),
        (2, 2, 2200000, 'success', '2026-08-01')");
}

function sendJson($payload, $status = 200) {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?: [];

try {
    if ($method === 'GET') {
        if ($action === 'products') {
            $rows = [];
            $result = $conn->query("SELECT id, name, type, price, description, stock FROM products ORDER BY id");
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                $rows[] = $row;
            }
            sendJson($rows);
        }

        if ($action === 'customers') {
            $rows = [];
            $result = $conn->query("SELECT id, name, phone, zalo, registered_at FROM customers ORDER BY id");
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                $rows[] = $row;
            }
            sendJson($rows);
        }

        if ($action === 'orders') {
            $rows = [];
            $result = $conn->query("SELECT o.id, o.order_id, c.name AS customer_name, p.name AS product_name, o.amount, o.status, o.payment_status, o.payment_url, o.purchased_at
                FROM orders o
                LEFT JOIN customers c ON c.id = o.customer_id
                LEFT JOIN products p ON p.id = o.product_id
                ORDER BY o.id");
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                $rows[] = $row;
            }
            sendJson($rows);
        }

        if ($action === 'stats') {
            $productsCount = (int)$conn->querySingle("SELECT COUNT(*) FROM products");
            $customersCount = (int)$conn->querySingle("SELECT COUNT(*) FROM customers");
            $ordersCount = (int)$conn->querySingle("SELECT COUNT(*) FROM orders");
            sendJson([
                'products' => $productsCount,
                'customers' => $customersCount,
                'orders' => $ordersCount
            ]);
        }

        sendJson(['error' => 'Missing action'], 400);
    }

    if ($method === 'POST') {
        if ($action === 'products') {
            $name = trim((string)($body['name'] ?? ''));
            $type = trim((string)($body['type'] ?? 'digital'));
            $price = (float)($body['price'] ?? 0);
            $description = trim((string)($body['description'] ?? ''));
            $stock = isset($body['stock']) && $body['stock'] !== '' ? (int)$body['stock'] : null;
            if ($name === '') {
                sendJson(['error' => 'Vui lòng nhập tên sản phẩm'], 400);
            }
            $stmt = $conn->prepare("INSERT INTO products (name, type, price, description, stock) VALUES (:name, :type, :price, :description, :stock)");
            $stmt->bindValue(':name', $name, SQLITE3_TEXT);
            $stmt->bindValue(':type', $type, SQLITE3_TEXT);
            $stmt->bindValue(':price', $price, SQLITE3_FLOAT);
            $stmt->bindValue(':description', $description, SQLITE3_TEXT);
            $stmt->bindValue(':stock', $stock, SQLITE3_INTEGER);
            $stmt->execute();
            sendJson(['ok' => true]);
        }

        if ($action === 'customers') {
            $name = trim((string)($body['name'] ?? ''));
            $phone = trim((string)($body['phone'] ?? ''));
            $zalo = trim((string)($body['zalo'] ?? ''));
            $registeredAt = trim((string)($body['registered_at'] ?? '')) ?: date('Y-m-d');
            if ($name === '' || $phone === '') {
                sendJson(['error' => 'Tên và số điện thoại là bắt buộc'], 400);
            }
            $stmt = $conn->prepare("INSERT INTO customers (name, phone, zalo, registered_at) VALUES (:name, :phone, :zalo, :registered_at)");
            $stmt->bindValue(':name', $name, SQLITE3_TEXT);
            $stmt->bindValue(':phone', $phone, SQLITE3_TEXT);
            $stmt->bindValue(':zalo', $zalo, SQLITE3_TEXT);
            $stmt->bindValue(':registered_at', $registeredAt, SQLITE3_TEXT);
            $stmt->execute();
            sendJson(['ok' => true]);
        }

        if ($action === 'orders') {
            $customerId = (int)($body['customer_id'] ?? 0);
            $productId = (int)($body['product_id'] ?? 0);
            $amount = (float)($body['amount'] ?? 0);
            $status = trim((string)($body['status'] ?? 'pending'));
            $date = trim((string)($body['purchased_at'] ?? '')) ?: date('Y-m-d');
            $orderId = 'TN-' . strtoupper(substr(md5($customerId . $productId . $amount . time()), 0, 8));
            $paymentStatus = $status === 'success' ? 'paid' : 'pending';
            $paymentUrl = 'https://vietqr.app/img?bank=TPBank&acc=10004884646&template=compact&amount=' . (int)$amount . '&des=' . urlencode($orderId);

            $productRow = $conn->querySingle("SELECT type, stock FROM products WHERE id = {$productId}", true);
            if ($productRow && $productRow['type'] === 'physical' && $productRow['stock'] !== null) {
                if ((int)$productRow['stock'] <= 0) {
                    sendJson(['error' => 'Sản phẩm vật lý đã hết hàng, không thể tạo đơn mới'], 400);
                }
                $conn->exec("UPDATE products SET stock = stock - 1 WHERE id = {$productId}");
            }

            $stmt = $conn->prepare("INSERT INTO orders (customer_id, product_id, amount, status, purchased_at, order_id, payment_url, payment_status) VALUES (:customer_id, :product_id, :amount, :status, :purchased_at, :order_id, :payment_url, :payment_status)");
            $stmt->bindValue(':customer_id', $customerId, SQLITE3_INTEGER);
            $stmt->bindValue(':product_id', $productId, SQLITE3_INTEGER);
            $stmt->bindValue(':amount', $amount, SQLITE3_FLOAT);
            $stmt->bindValue(':status', $status, SQLITE3_TEXT);
            $stmt->bindValue(':purchased_at', $date, SQLITE3_TEXT);
            $stmt->bindValue(':order_id', $orderId, SQLITE3_TEXT);
            $stmt->bindValue(':payment_url', $paymentUrl, SQLITE3_TEXT);
            $stmt->bindValue(':payment_status', $paymentStatus, SQLITE3_TEXT);
            $stmt->execute();
            sendJson(['ok' => true, 'order_id' => $orderId, 'payment_status' => $paymentStatus]);
        }

        if ($action === 'booking') {
            $name = trim((string)($body['hoTen'] ?? ''));
            $phone = trim((string)($body['soDienThoai'] ?? ''));
            $date = trim((string)($body['ngayDuKien'] ?? '')) ?: date('Y-m-d');
            $note = trim((string)($body['ghiChu'] ?? ''));
            $source = trim((string)($body['trang'] ?? ''));
            $amount = (float)($body['amount'] ?? 2000);
            $orderId = 'TN' . strtoupper(substr(md5($phone . $date . time()), 0, 8));
            $paymentUrl = trim((string)($body['payment_url'] ?? '')) ?: 'https://vietqr.app/img?bank=TPBank&acc=10004884646&template=compact&amount=' . (int)$amount . '&des=' . urlencode('TN-' . $orderId);

            if ($name === '' || $phone === '') {
                sendJson(['error' => 'Tên và số điện thoại là bắt buộc'], 400);
            }

            $existingCustomer = $conn->querySingle("SELECT id FROM customers WHERE phone = '{$phone}'", true);
            $customerId = 0;

            if ($existingCustomer) {
                $customerId = (int)$existingCustomer['id'];
            } else {
                $stmt = $conn->prepare("INSERT INTO customers (name, phone, zalo, registered_at) VALUES (:name, :phone, :zalo, :registered_at)");
                $stmt->bindValue(':name', $name, SQLITE3_TEXT);
                $stmt->bindValue(':phone', $phone, SQLITE3_TEXT);
                $stmt->bindValue(':zalo', $phone, SQLITE3_TEXT);
                $stmt->bindValue(':registered_at', $date, SQLITE3_TEXT);
                $stmt->execute();
                $customerId = (int)$conn->lastInsertRowId();
            }

            $defaultProductId = (int)$conn->querySingle("SELECT id FROM products ORDER BY id LIMIT 1");
            $stmt = $conn->prepare("INSERT INTO orders (customer_id, product_id, amount, status, purchased_at, order_id, payment_url, payment_status) VALUES (:customer_id, :product_id, :amount, :status, :purchased_at, :order_id, :payment_url, :payment_status)");
            $stmt->bindValue(':customer_id', $customerId, SQLITE3_INTEGER);
            $stmt->bindValue(':product_id', $defaultProductId ?: 1, SQLITE3_INTEGER);
            $stmt->bindValue(':amount', $amount, SQLITE3_FLOAT);
            $stmt->bindValue(':status', 'pending', SQLITE3_TEXT);
            $stmt->bindValue(':purchased_at', $date, SQLITE3_TEXT);
            $stmt->bindValue(':order_id', $orderId, SQLITE3_TEXT);
            $stmt->bindValue(':payment_url', $paymentUrl, SQLITE3_TEXT);
            $stmt->bindValue(':payment_status', 'pending', SQLITE3_TEXT);
            $stmt->execute();

            sendJson(['ok' => true, 'customer_id' => $customerId, 'source' => $source, 'note' => $note, 'amount' => $amount, 'order_id' => $orderId, 'payment_status' => 'pending']);
        }

        sendJson(['error' => 'Missing action'], 400);
    }

    if ($method === 'DELETE') {
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            sendJson(['error' => 'Missing id'], 400);
        }
        if ($action === 'products') {
            $conn->exec("DELETE FROM products WHERE id = {$id}");
            sendJson(['ok' => true]);
        }
        if ($action === 'customers') {
            $conn->exec("DELETE FROM customers WHERE id = {$id}");
            sendJson(['ok' => true]);
        }
        if ($action === 'orders') {
            $conn->exec("DELETE FROM orders WHERE id = {$id}");
            sendJson(['ok' => true]);
        }
        sendJson(['error' => 'Missing action'], 400);
    }
} catch (Throwable $e) {
    sendJson(['error' => $e->getMessage()], 500);
}
