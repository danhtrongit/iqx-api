# API Symbols Documentation

## Tổng quan
API Symbols cung cấp các endpoint để quản lý và truy xuất thông tin chứng khoán trong hệ thống IQX Trading.

## Base URL
```
http://localhost:3000/api/symbols
```

## Authentication
Một số endpoint yêu cầu JWT token trong header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 Endpoints

### 1. Lấy danh sách chứng khoán (có phân trang)

**GET** `/api/symbols`

Lấy danh sách chứng khoán với phân trang và bộ lọc.

#### Query Parameters:
| Tham số | Kiểu | Mặc định | Mô tả |
|---------|------|----------|-------|
| `page` | number | 1 | Trang hiện tại |
| `limit` | number | 20 | Số lượng mỗi trang |
| `search` | string | - | Tìm kiếm theo mã hoặc tên |
| `type` | string | - | Loại chứng khoán (STOCK, BOND, etc.) |
| `board` | string | - | Sàn giao dịch (HSX, HNX, UPC) |

#### Example Request:
```bash
curl -X GET "http://localhost:3000/api/symbols?page=1&limit=10&search=VN&type=STOCK&board=HSX"
```

#### Example Response:
```json
{
  "data": [
    {
      "id": 8424928,
      "symbol": "VNM",
      "type": "STOCK",
      "board": "HSX",
      "enOrganName": "Vietnam Dairy Products Joint Stock Company",
      "organShortName": "VINAMILK",
      "organName": "Công ty Cổ phần Sữa Việt Nam",
      "productGrpID": "STO"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  },
  "message": "Lấy danh sách chứng khoán thành công"
}
```

---

### 2. Lấy tất cả chứng khoán (không phân trang)

**GET** `/api/symbols/all`

⚠️ **Cẩn thận**: Endpoint này có thể trả về lượng dữ liệu lớn.

#### Query Parameters:
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `search` | string | Tìm kiếm theo mã hoặc tên |
| `type` | string | Loại chứng khoán |
| `board` | string | Sàn giao dịch |

#### Example Request:
```bash
curl -X GET "http://localhost:3000/api/symbols/all?type=STOCK"
```

#### Example Response:
```json
{
  "data": [
    {
      "id": 8424928,
      "symbol": "VNM",
      "type": "STOCK",
      "board": "HSX",
      "enOrganName": "Vietnam Dairy Products Joint Stock Company",
      "organShortName": "VINAMILK",
      "organName": "Công ty Cổ phần Sữa Việt Nam",
      "productGrpID": "STO"
    }
  ],
  "count": 1500,
  "message": "Lấy tất cả chứng khoán thành công"
}
```

---

### 3. Tìm kiếm chứng khoán

**GET** `/api/symbols/search`

Tương tự như endpoint `/api/symbols` nhưng được tối ưu cho tìm kiếm.

#### Example Request:
```bash
curl -X GET "http://localhost:3000/api/symbols/search?search=vinamilk&limit=5"
```

---

### 4. Đếm số lượng chứng khoán

**GET** `/api/symbols/count`

Lấy tổng số lượng chứng khoán trong hệ thống.

#### Example Request:
```bash
curl -X GET "http://localhost:3000/api/symbols/count"
```

#### Example Response:
```json
{
  "count": 1500,
  "message": "Lấy số lượng chứng khoán thành công"
}
```

---

### 5. Lấy thông tin chứng khoán theo mã

**GET** `/api/symbols/{symbol}`

Lấy thông tin chi tiết của một chứng khoán theo mã.

#### Path Parameters:
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `symbol` | string | Mã chứng khoán (VD: VNM, VIC, FPT) |

#### Query Parameters:
| Tham số | Kiểu | Mặc định | Mô tả |
|---------|------|----------|-------|
| `includePrices` | boolean/string | false | Bao gồm giá hiện tại |

#### Example Request:
```bash
# Không bao gồm giá
curl -X GET "http://localhost:3000/api/symbols/VNM"

# Bao gồm giá hiện tại
curl -X GET "http://localhost:3000/api/symbols/VNM?includePrices=true"
```

#### Example Response (với giá):
```json
{
  "data": {
    "id": 8424928,
    "symbol": "VNM",
    "type": "STOCK",
    "board": "HSX",
    "enOrganName": "Vietnam Dairy Products Joint Stock Company",
    "organShortName": "VINAMILK",
    "organName": "Công ty Cổ phần Sữa Việt Nam",
    "productGrpID": "STO",
    "currentPrice": 61600,
    "priceUpdatedAt": "2025-09-25T07:40:00.000Z"
  },
  "message": "Lấy thông tin chứng khoán thành công"
}
```

#### Error Response (404):
```json
{
  "data": null,
  "message": "Không tìm thấy chứng khoán"
}
```

---

### 6. Đồng bộ dữ liệu chứng khoán (Admin)

**POST** `/api/symbols/sync` 🔒

Đồng bộ dữ liệu chứng khoán từ VietCap API (yêu cầu JWT token).

#### Headers:
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

#### Example Request:
```bash
curl -X POST "http://localhost:3000/api/symbols/sync" \
  -H "Authorization: Bearer your_jwt_token_here"
```

#### Example Response:
```json
{
  "message": "Đồng bộ dữ liệu chứng khoán thành công"
}
```

---

## 📊 Data Models

### SymbolResponseDto
| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | number | ID chứng khoán |
| `symbol` | string | Mã chứng khoán |
| `type` | string | Loại (STOCK, BOND, etc.) |
| `board` | string | Sàn giao dịch (HSX, HNX, UPC) |
| `enOrganName` | string? | Tên tiếng Anh |
| `organShortName` | string? | Tên viết tắt |
| `organName` | string? | Tên tiếng Việt |
| `productGrpID` | string? | Mã nhóm sản phẩm |
| `currentPrice` | number? | Giá hiện tại (VND) |
| `priceUpdatedAt` | string? | Thời gian cập nhật giá |

### PaginationMetaDto
| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `page` | number | Trang hiện tại |
| `limit` | number | Số lượng mỗi trang |
| `total` | number | Tổng số kết quả |
| `totalPages` | number | Tổng số trang |
| `hasPreviousPage` | boolean | Có trang trước |
| `hasNextPage` | boolean | Có trang sau |

---

## 🔍 Filtering & Search

### Tìm kiếm
Parameter `search` sẽ tìm kiếm trong các trường:
- Mã chứng khoán (`symbol`)
- Tên tiếng Anh (`enOrganName`)
- Tên tiếng Việt (`organName`)
- Tên viết tắt (`organShortName`)

### Bộ lọc
- **`type`**: STOCK, BOND, FUND, etc.
- **`board`**: HSX, HNX, UPC
- **`productGrpID`**: STO, BND, etc.

---

## 📈 Popular Vietnamese Stocks

| Mã | Tên công ty | Sàn |
|----|-------------|-----|
| VIC | Tập đoàn Vingroup | HSX |
| VCB | Ngân hàng Vietcombank | HSX |
| FPT | Tập đoàn FPT | HSX |
| VNM | Vinamilk | HSX |
| MSN | Tập đoàn Masan | HSX |
| VHM | Vinhomes | HSX |
| GAS | PetroVietnam Gas | HSX |
| CTG | VietinBank | HSX |
| BID | BIDV | HSX |
| VRE | Vincom Retail | HSX |

---

## ⚡ Performance Tips

1. **Phân trang**: Luôn sử dụng `limit` để tránh tải quá nhiều dữ liệu
2. **Cache**: Kết quả có thể được cache trong 5-10 phút
3. **Giá real-time**: Chỉ bao gồm giá khi cần thiết với `includePrices=true`
4. **Tìm kiếm**: Sử dụng endpoint `/search` cho tìm kiếm nhanh

---

## 🚨 Error Codes

| Code | Mô tả |
|------|-------|
| 200 | Thành công |
| 400 | Tham số không hợp lệ |
| 401 | Chưa đăng nhập |
| 404 | Không tìm thấy |
| 500 | Lỗi server |

---

## 🧪 Testing

### Swagger UI
Truy cập: `http://localhost:3000/api/docs`

### Postman Collection
Import file: `symbols-api.postman_collection.json`

### cURL Examples
```bash
# Lấy top 10 chứng khoán HSX
curl "http://localhost:3000/api/symbols?board=HSX&limit=10"

# Tìm kiếm Vingroup
curl "http://localhost:3000/api/symbols/search?search=vingroup"

# Chi tiết VIC với giá
curl "http://localhost:3000/api/symbols/VIC?includePrices=true"
```