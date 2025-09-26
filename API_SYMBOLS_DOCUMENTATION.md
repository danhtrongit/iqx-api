# API Symbols Documentation - Complete Reference

## 🚀 Tổng quan
API Symbols cung cấp một bộ endpoint hoàn chỉnh để quản lý và truy xuất thông tin chứng khoán trong hệ thống IQX Trading. API hỗ trợ tìm kiếm, phân trang, lọc, và lấy giá real-time từ VietCap.

## 🔗 Base URL
```
http://localhost:3000/api/symbols
```

## 🔐 Authentication
Một số endpoint yêu cầu JWT token trong header:
```
Authorization: Bearer <your_jwt_token>
```

## 📊 Database Schema
### Symbol Entity
```typescript
interface Symbol {
  id: number;              // Khóa chính (bigint)
  symbol: string;          // Mã chứng khoán (unique)
  type: string;            // Loại: STOCK, BOND, FU
  board: string;           // Sàn: HSX, HNX, UPCOM
  en_organ_name?: string;  // Tên tiếng Anh
  organ_short_name?: string; // Tên viết tắt
  organ_name?: string;     // Tên tiếng Việt
  product_grp_id?: string; // Mã nhóm sản phẩm
  created_at: Date;        // Ngày tạo
  updated_at: Date;        // Ngày cập nhật
}
```

---

## 📋 API Endpoints

### 1. Lấy danh sách chứng khoán (có phân trang)

**GET** `/api/symbols`

Lấy danh sách chứng khoán với phân trang và bộ lọc. Endpoint chính để tìm kiếm và lọc chứng khoán.

#### Query Parameters:
| Tham số | Kiểu | Mặc định | Bắt buộc | Mô tả | Ví dụ |
|---------|------|----------|----------|-------|-------|
| `page` | number | 1 | ❌ | Trang hiện tại (≥1) | `1` |
| `limit` | number | 20 | ❌ | Số lượng mỗi trang (1-100) | `20` |
| `search` | string | - | ❌ | Tìm kiếm trong tất cả trường tên | `vinamilk` |
| `symbol` | string | - | ❌ | Tìm kiếm theo mã chứng khoán | `VNM` |
| `type` | enum | - | ❌ | Loại: `STOCK`, `BOND`, `FU` | `STOCK` |
| `board` | enum | - | ❌ | Sàn: `HSX`, `HNX`, `UPCOM` | `HSX` |
| `includePrices` | boolean | false | ❌ | Lấy giá real-time (chậm) | `true` |

#### 🎯 Search Logic:
- **`search`**: Tìm trong `organ_name`, `organ_short_name`, `en_organ_name`, `symbol`
- **`symbol`**: Tìm kiếm chỉ trong trường `symbol`
- **Độ ưu tiên kết quả**:
  1. Khớp chính xác với symbol
  2. Symbol bắt đầu bằng từ khóa
  3. Symbol chứa từ khóa
  4. Các trường khác chứa từ khóa

#### Request Examples:
```bash
# Cơ bản - lấy trang đầu
curl "http://localhost:3000/api/symbols"

# Phân trang
curl "http://localhost:3000/api/symbols?page=2&limit=10"

# Tìm kiếm theo tên công ty
curl "http://localhost:3000/api/symbols?search=vinamilk&limit=5"

# Lọc theo loại và sàn
curl "http://localhost:3000/api/symbols?type=STOCK&board=HSX&limit=50"

# Bao gồm giá real-time (chậm)
curl "http://localhost:3000/api/symbols?search=VN&includePrices=true&limit=5"

# Tìm kiếm mã chứng khoán cụ thể
curl "http://localhost:3000/api/symbols?symbol=VIC&includePrices=true"
```

#### Success Response (200):
```json
{
  "data": [
    {
      "id": 8424928,
      "symbol": "VNM",
      "type": "STOCK",
      "board": "HSX",
      "en_organ_name": "Vietnam Dairy Products Joint Stock Company",
      "organ_short_name": "VINAMILK",
      "organ_name": "Công ty Cổ phần Sữa Việt Nam",
      "product_grp_id": "STO",
      "currentPrice": 61600,           // Chỉ khi includePrices=true
      "priceUpdatedAt": "2025-09-25T07:40:00.000Z" // Chỉ khi includePrices=true
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

#### Error Response (400):
```json
{
  "statusCode": 400,
  "message": [
    "Trang phải lớn hơn 0",
    "Limit không được vượt quá 100"
  ],
  "error": "Bad Request"
}
```

---

### 2. Lấy tất cả chứng khoán (không phân trang)

**GET** `/api/symbols/all`

⚠️ **Cảnh báo**: Endpoint này có thể trả về lượng dữ liệu lớn (>1500 records). Chỉ sử dụng khi cần thiết.

#### Query Parameters:
| Tham số | Kiểu | Mặc định | Bắt buộc | Mô tả | Ví dụ |
|---------|------|----------|----------|-------|-------|
| `search` | string | - | ❌ | Tìm kiếm theo mã hoặc tên | `vingroup` |
| `symbol` | string | - | ❌ | Tìm kiếm theo mã chứng khoán | `VIC` |
| `type` | enum | - | ❌ | Loại: `STOCK`, `BOND`, `FU` | `STOCK` |
| `board` | enum | - | ❌ | Sàn: `HSX`, `HNX`, `UPCOM` | `HSX` |
| `includePrices` | boolean | false | ❌ | Lấy giá real-time (chỉ 50 đầu tiên) | `true` |

#### 🎯 Performance Notes:
- Giới hạn `includePrices` chỉ cho **50 symbols đầu tiên** để tránh timeout
- Response không có phân trang - trả về tất cả kết quả phù hợp
- Sử dụng cùng logic tìm kiếm và sắp xếp với endpoint có phân trang

#### Request Examples:
```bash
# Lấy tất cả chứng khoán STOCK
curl "http://localhost:3000/api/symbols/all?type=STOCK"

# Lấy tất cả mã HSX
curl "http://localhost:3000/api/symbols/all?board=HSX"

# Tìm kiếm tất cả mã chứa "bank"
curl "http://localhost:3000/api/symbols/all?search=bank"
```

#### Success Response (200):
```json
{
  "data": [
    {
      "id": 8424928,
      "symbol": "VNM",
      "type": "STOCK",
      "board": "HSX",
      "en_organ_name": "Vietnam Dairy Products Joint Stock Company",
      "organ_short_name": "VINAMILK",
      "organ_name": "Công ty Cổ phần Sữa Việt Nam",
      "product_grp_id": "STO"
    },
    // ... 1500+ records
  ],
  "count": 1500,
  "message": "Lấy tất cả chứng khoán thành công"
}
```

---

### 3. Tìm kiếm chứng khoán (Alias)

**GET** `/api/symbols/search`

📝 **Lưu ý**: Endpoint này là alias của `/api/symbols` với cùng chức năng và parameters. Được tạo để semantics rõ ràng hơn khi tìm kiếm.

#### Functionality:
- Hoàn toàn giống với endpoint `GET /api/symbols`
- Hỗ trợ đầy đủ phân trang, lọc, và tìm kiếm
- Tham khảo tài liệu của endpoint `GET /api/symbols` ở trên

#### Quick Example:
```bash
curl "http://localhost:3000/api/symbols/search?search=vinamilk&limit=5"
```

---

### 4. Đếm số lượng chứng khoán

**GET** `/api/symbols/count`

Endpoint đơn giản để lấy tổng số chứng khoán trong hệ thống.

#### Query Parameters: Không có

#### Request Examples:
```bash
curl "http://localhost:3000/api/symbols/count"
```

#### Success Response (200):
```json
{
  "count": 1547,
  "message": "Lấy số lượng chứng khoán thành công"
}
```

---

### 5. Lấy thông tin chi tiết chứng khoán

**GET** `/api/symbols/{symbol}`

Lấy thông tin chi tiết của một chứng khoán cụ thể theo mã symbol.

#### Path Parameters:
| Tham số | Kiểu | Bắt buộc | Mô tả | Ví dụ |
|---------|------|----------|-------|-------|
| `symbol` | string | ✅ | Mã chứng khoán (không phân biệt hoa thường) | `VNM`, `vic` |

#### Query Parameters:
| Tham số | Kiểu | Mặc định | Bắt buộc | Mô tả | Ví dụ |
|---------|------|----------|----------|-------|-------|
| `includePrices` | boolean/string | false | ❌ | Bao gồm giá real-time từ VietCap | `true`, `"1"`, `1` |

#### 🎯 includePrices Values:
Endpoint chấp nhận các giá trị sau cho `includePrices`:
- `true` (boolean)
- `"true"` (string)
- `"1"` (string)
- `1` (number)

#### Request Examples:
```bash
# Không bao gồm giá
curl "http://localhost:3000/api/symbols/VNM"

# Bao gồm giá hiện tại (boolean)
curl "http://localhost:3000/api/symbols/VNM?includePrices=true"

# Bao gồm giá hiện tại (string)
curl "http://localhost:3000/api/symbols/VIC?includePrices=1"

# Case insensitive
curl "http://localhost:3000/api/symbols/vnm?includePrices=true"
```

#### Success Response (200) - Không có giá:
```json
{
  "data": {
    "id": 8424928,
    "symbol": "VNM",
    "type": "STOCK",
    "board": "HSX",
    "en_organ_name": "Vietnam Dairy Products Joint Stock Company",
    "organ_short_name": "VINAMILK",
    "organ_name": "Công ty Cổ phần Sữa Việt Nam",
    "product_grp_id": "STO"
  },
  "message": "Lấy thông tin chứng khoán thành công"
}
```

#### Success Response (200) - Có giá:
```json
{
  "data": {
    "id": 8424928,
    "symbol": "VNM",
    "type": "STOCK",
    "board": "HSX",
    "en_organ_name": "Vietnam Dairy Products Joint Stock Company",
    "organ_short_name": "VINAMILK",
    "organ_name": "Công ty Cổ phần Sữa Việt Nam",
    "product_grp_id": "STO",
    "currentPrice": 61600,
    "priceUpdatedAt": "2025-09-25T07:40:00.000Z"
  },
  "message": "Lấy thông tin chứng khoán thành công"
}
```

#### Not Found Response (404):
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