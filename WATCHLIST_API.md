# API Danh Sách Theo Dõi (Watchlist)

## Tổng quan
API Watchlist cho phép người dùng quản lý danh sách cổ phiếu yêu thích, bao gồm thêm, xóa, cập nhật và theo dõi cổ phiếu với các tính năng cảnh báo giá.

## Base URL
```
/api/watchlist
```

## Authentication
Tất cả endpoints yêu cầu JWT token trong header:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Lấy Danh Sách Cổ Phiếu Yêu Thích

**GET** `/watchlist`

Lấy danh sách tất cả cổ phiếu yêu thích của user hiện tại.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "symbolId": "uuid",
      "symbol": {
        "id": "uuid",
        "symbol": "VNM",
        "organName": "Công ty Cổ phần Sữa Việt Nam",
        "organShortName": "Vinamilk",
        "type": "STOCK",
        "board": "HOSE"
      },
      "customName": "Vinamilk - Sữa",
      "notes": "Cổ phiếu tiềm năng trong ngành F&B",
      "alertPriceHigh": 85000,
      "alertPriceLow": 75000,
      "isAlertEnabled": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "message": "Lấy danh sách yêu thích thành công"
}
```

---

### 2. Đếm Số Lượng Cổ Phiếu Yêu Thích

**GET** `/watchlist/count`

Đếm tổng số cổ phiếu trong danh sách yêu thích của user.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "count": 15,
  "message": "Lấy số lượng yêu thích thành công"
}
```

---

### 3. Lấy Danh Sách Cổ Phiếu Có Cảnh Báo

**GET** `/watchlist/alerts`

Lấy danh sách cổ phiếu đã bật cảnh báo giá.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "symbolId": "uuid",
      "symbol": {
        "id": "uuid",
        "symbol": "VNM",
        "organName": "Công ty Cổ phần Sữa Việt Nam",
        "organShortName": "Vinamilk"
      },
      "alertPriceHigh": 85000,
      "alertPriceLow": 75000,
      "isAlertEnabled": true,
      "customName": "Vinamilk",
      "notes": "Theo dõi breakout"
    }
  ],
  "count": 3,
  "message": "Lấy danh sách cảnh báo thành công"
}
```

---

### 4. Lấy Danh Sách Cổ Phiếu Phổ Biến

**GET** `/watchlist/popular`

Lấy danh sách cổ phiếu được theo dõi nhiều nhất trên hệ thống.

**Query Parameters:**
- `limit` (optional): Số lượng kết quả trả về (mặc định: 10)

**Response:**
```json
{
  "data": [
    {
      "symbol": {
        "id": "uuid",
        "symbol": "VNM",
        "organName": "Công ty Cổ phần Sữa Việt Nam",
        "organShortName": "Vinamilk",
        "type": "STOCK",
        "board": "HOSE"
      },
      "count": 1250
    },
    {
      "symbol": {
        "id": "uuid",
        "symbol": "VIC",
        "organName": "Tập đoàn Vingroup",
        "organShortName": "Vingroup",
        "type": "STOCK",
        "board": "HOSE"
      },
      "count": 980
    }
  ],
  "message": "Lấy danh sách phổ biến thành công"
}
```

---

### 5. Kiểm Tra Cổ Phiếu Trong Danh Sách

**GET** `/watchlist/check/{symbolCode}`

Kiểm tra xem cổ phiếu có trong danh sách yêu thích không.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `symbolCode`: Mã cổ phiếu (VD: VNM, VIC)

**Response:**
```json
{
  "isInWatchlist": true,
  "watchlistItem": {
    "id": "uuid",
    "userId": "uuid",
    "symbolId": "uuid",
    "symbol": {
      "id": "uuid",
      "symbol": "VNM",
      "organName": "Công ty Cổ phần Sữa Việt Nam",
      "organShortName": "Vinamilk"
    },
    "customName": "Vinamilk",
    "notes": "Cổ phiếu chất lượng",
    "alertPriceHigh": 85000,
    "alertPriceLow": 75000,
    "isAlertEnabled": true
  },
  "message": "Cổ phiếu VNM có trong danh sách yêu thích"
}
```

---

### 6. Thêm Cổ Phiếu Vào Danh Sách

**POST** `/watchlist`

Thêm cổ phiếu mới vào danh sách yêu thích.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "symbolCode": "VNM",
  "customName": "Vinamilk - Sữa hàng đầu",
  "notes": "Cổ phiếu blue-chip trong ngành F&B"
}
```

**Body Parameters:**
- `symbolCode` (required): Mã cổ phiếu
- `customName` (optional): Tên tùy chỉnh cho cổ phiếu
- `notes` (optional): Ghi chú về cổ phiếu

**Response - Success (201):**
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "symbolId": "uuid",
    "customName": "Vinamilk - Sữa hàng đầu",
    "notes": "Cổ phiếu blue-chip trong ngành F&B",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Đã thêm VNM vào danh sách yêu thích"
}
```

**Response - Error (404):**
```json
{
  "statusCode": 404,
  "message": "Mã chứng khoán VNM không tồn tại"
}
```

**Response - Error (409):**
```json
{
  "statusCode": 409,
  "message": "Mã chứng khoán VNM đã có trong danh sách yêu thích"
}
```

---

### 7. Cập Nhật Thông Tin Cổ Phiếu

**PUT** `/watchlist/{id}`

Cập nhật thông tin cổ phiếu trong danh sách yêu thích.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Path Parameters:**
- `id`: ID của mục trong watchlist

**Request Body:**
```json
{
  "customName": "Vinamilk - Updated",
  "notes": "Cập nhật ghi chú mới",
  "alertPriceHigh": 90000,
  "alertPriceLow": 70000,
  "isAlertEnabled": true
}
```

**Body Parameters:**
- `customName` (optional): Tên tùy chỉnh mới
- `notes` (optional): Ghi chú mới
- `alertPriceHigh` (optional): Giá cảnh báo trần
- `alertPriceLow` (optional): Giá cảnh báo sàn
- `isAlertEnabled` (optional): Bật/tắt cảnh báo

**Response - Success (200):**
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "symbolId": "uuid",
    "symbol": {
      "id": "uuid",
      "symbol": "VNM",
      "organName": "Công ty Cổ phần Sữa Việt Nam",
      "organShortName": "Vinamilk"
    },
    "customName": "Vinamilk - Updated",
    "notes": "Cập nhật ghi chú mới",
    "alertPriceHigh": 90000,
    "alertPriceLow": 70000,
    "isAlertEnabled": true,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Cập nhật mục yêu thích thành công"
}
```

**Response - Error (400):**
```json
{
  "statusCode": 400,
  "message": "Giá cảnh báo cao phải lớn hơn giá cảnh báo thấp"
}
```

**Response - Error (404):**
```json
{
  "statusCode": 404,
  "message": "Mục yêu thích không tồn tại hoặc không thuộc về bạn"
}
```

---

### 8. Xóa Cổ Phiếu Khỏi Danh Sách (Theo ID)

**DELETE** `/watchlist/{id}`

Xóa cổ phiếu khỏi danh sách yêu thích theo ID.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id`: ID của mục trong watchlist

**Response - Success (200):**
```json
{
  "message": "Xóa khỏi danh sách yêu thích thành công"
}
```

**Response - Error (404):**
```json
{
  "statusCode": 404,
  "message": "Mục yêu thích không tồn tại hoặc không thuộc về bạn"
}
```

---

### 9. Xóa Cổ Phiếu Khỏi Danh Sách (Theo Mã)

**DELETE** `/watchlist/symbol/{symbolCode}`

Xóa cổ phiếu khỏi danh sách yêu thích theo mã cổ phiếu.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `symbolCode`: Mã cổ phiếu (VD: VNM, VIC)

**Response - Success (200):**
```json
{
  "message": "Đã xóa VNM khỏi danh sách yêu thích"
}
```

**Response - Error (404):**
```json
{
  "statusCode": 404,
  "message": "Cổ phiếu không có trong danh sách yêu thích"
}
```

---

### 10. Xóa Toàn Bộ Danh Sách

**DELETE** `/watchlist`

Xóa toàn bộ danh sách yêu thích của user.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "deletedCount": 15,
  "message": "Đã xóa 15 mục khỏi danh sách yêu thích"
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Thành công |
| 201 | Tạo thành công |
| 400 | Lỗi đầu vào hoặc dữ liệu không hợp lệ |
| 401 | Chưa xác thực hoặc token không hợp lệ |
| 404 | Không tìm thấy dữ liệu |
| 409 | Xung đột dữ liệu (cổ phiếu đã tồn tại) |
| 500 | Lỗi server |

## Lưu ý

1. **Giới hạn cảnh báo giá**: `alertPriceHigh` phải lớn hơn `alertPriceLow`
2. **Mã cổ phiếu**: Hệ thống tự động chuyển về viết hoa
3. **Validation**: Tất cả mã cổ phiếu phải tồn tại trong database symbols
4. **Phân trang**: Các endpoint danh sách sẽ được sắp xếp theo `createdAt DESC`
5. **Rate limiting**: Áp dụng giới hạn số lượng request trên mỗi user

## Ví dụ sử dụng với cURL

### Thêm cổ phiếu vào danh sách:
```bash
curl -X POST http://localhost:3000/api/watchlist \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "symbolCode": "VNM",
    "customName": "Vinamilk",
    "notes": "Cổ phiếu blue-chip"
  }'
```

### Lấy danh sách yêu thích:
```bash
curl -X GET http://localhost:3000/api/watchlist \
  -H "Authorization: Bearer <token>"
```

### Cập nhật cảnh báo giá:
```bash
curl -X PUT http://localhost:3000/api/watchlist/{id} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "alertPriceHigh": 90000,
    "alertPriceLow": 70000,
    "isAlertEnabled": true
  }'
```