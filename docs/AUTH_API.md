# 🔐 Authentication API Documentation

## Tổng quan
Module Authentication cung cấp các tính năng xác thực người dùng, quản lý session và bảo mật tài khoản.

**Base URL**: `/api/auth`

---

## Endpoints

### 1. Đăng ký tài khoản
**POST** `/auth/register`

Tạo tài khoản mới cho người dùng.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "displayName": "John Doe",
  "fullName": "John Smith Doe"
}
```

#### Validation Rules
- **email**:
  - Phải là email hợp lệ
  - Không được trùng với email đã tồn tại
  - Tối đa 255 ký tự
- **password**:
  - Tối thiểu 8 ký tự
  - Phải có ít nhất 1 chữ hoa
  - Phải có ít nhất 1 chữ thường
  - Phải có ít nhất 1 chữ số
  - Phải có ít nhất 1 ký tự đặc biệt
- **displayName**:
  - Tối thiểu 2 ký tự
  - Tối đa 50 ký tự
  - Không bắt buộc
- **fullName**:
  - Tối đa 255 ký tự
  - Không bắt buộc

#### Response Success (201)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "displayName": "John Doe",
  "message": "Đăng ký thành công"
}
```

#### Error Responses
```json
// 400 - Validation Error
{
  "statusCode": 400,
  "message": [
    "email must be a valid email",
    "password is too weak"
  ],
  "error": "Bad Request"
}

// 409 - Email đã tồn tại
{
  "statusCode": 409,
  "message": "Email đã được sử dụng",
  "error": "Conflict"
}
```

---

### 2. Đăng nhập
**POST** `/auth/login`

Xác thực người dùng và trả về JWT access token.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Response Success (200)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "member",
    "isActive": true
  },
  "message": "Đăng nhập thành công"
}
```

#### Error Responses
```json
// 400 - Thông tin không hợp lệ
{
  "statusCode": 400,
  "message": "Email hoặc mật khẩu không đúng",
  "error": "Bad Request"
}

// 401 - Tài khoản bị khóa
{
  "statusCode": 401,
  "message": "Tài khoản đã bị khóa",
  "error": "Unauthorized"
}
```

---

### 3. Refresh Token
**POST** `/auth/refresh`

Làm mới access token khi token cũ hết hạn.

#### Headers
```
Authorization: Bearer <old_jwt_token>
```

#### Response Success (200)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "displayName": "John Doe"
  },
  "message": "Làm mới token thành công"
}
```

---

### 4. Đăng xuất
**POST** `/auth/logout`

Vô hiệu hóa session hiện tại.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response Success (200)
```json
{
  "message": "Đăng xuất thành công"
}
```

---

### 5. Quên mật khẩu
**POST** `/auth/forgot-password`

Gửi email chứa link reset mật khẩu.

#### Request Body
```json
{
  "email": "user@example.com"
}
```

#### Response Success (200)
```json
{
  "message": "Email reset mật khẩu đã được gửi"
}
```

**Note**: Response luôn trả về thành công để tránh email enumeration attack.

---

### 6. Reset mật khẩu
**POST** `/auth/reset-password`

Đặt lại mật khẩu với token từ email.

#### Request Body
```json
{
  "token": "reset_token_from_email_12345",
  "newPassword": "NewSecurePassword456!"
}
```

#### Response Success (200)
```json
{
  "message": "Đặt lại mật khẩu thành công"
}
```

#### Error Responses
```json
// 400 - Token không hợp lệ hoặc hết hạn
{
  "statusCode": 400,
  "message": "Token reset không hợp lệ hoặc đã hết hạn",
  "error": "Bad Request"
}
```

---

### 7. Xác thực số điện thoại
**POST** `/auth/phone/verify`

Gửi mã xác thực SMS đến số điện thoại.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "phoneNumber": "+84901234567"
}
```

#### Response Success (200)
```json
{
  "message": "Mã xác thực đã được gửi đến số điện thoại"
}
```

---

### 8. Xác nhận mã OTP
**POST** `/auth/phone/confirm`

Xác nhận mã OTP để hoàn tất xác thực số điện thoại.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "phoneNumber": "+84901234567",
  "otpCode": "123456"
}
```

#### Response Success (200)
```json
{
  "message": "Xác thực số điện thoại thành công"
}
```

#### Error Responses
```json
// 400 - Mã OTP không đúng
{
  "statusCode": 400,
  "message": "Mã xác thực không đúng hoặc đã hết hạn",
  "error": "Bad Request"
}
```

---

### 9. Lấy thông tin profile
**GET** `/auth/profile`

Lấy thông tin chi tiết của người dùng hiện tại.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response Success (200)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "displayName": "John Doe",
  "fullName": "John Smith Doe",
  "phoneE164": "+84901234567",
  "phoneVerifiedAt": "2025-09-25T10:00:00Z",
  "role": "member",
  "isActive": true,
  "createdAt": "2025-09-20T10:00:00Z",
  "updatedAt": "2025-09-25T10:00:00Z"
}
```

---

## JWT Token Structure

### Payload
```json
{
  "sub": "user_id",           // Subject (User ID)
  "email": "user@example.com", // User email
  "role": "member",           // User role
  "iat": 1727252400,          // Issued at
  "exp": 1727338800           // Expiration time
}
```

### Token Expiration
- **Access Token**: 24 giờ
- **Reset Token**: 1 giờ
- **OTP Code**: 5 phút

---

## Security Features

### Password Security
- Mã hóa bằng Argon2 (industry standard)
- Salt tự động cho mỗi password
- Không thể reverse engineer

### Session Management
- JWT tokens với expiration
- Blacklist tokens khi logout
- Automatic cleanup expired sessions

### Rate Limiting
- Login: 5 attempts/minute
- Register: 3 attempts/minute
- Reset password: 2 attempts/minute
- OTP: 3 attempts/5 minutes

### Input Validation
- SQL injection protection
- XSS prevention
- CSRF protection with tokens

---

## Error Codes Reference

| HTTP Code | Description | Example |
|-----------|-------------|---------|
| 200 | Success | Login successful |
| 201 | Created | Registration successful |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Invalid credentials |
| 403 | Forbidden | Account locked |
| 409 | Conflict | Email already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server error |

---

## Integration Examples

### Frontend Login Flow
```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { access_token, user } = await loginResponse.json();

// 2. Store token
localStorage.setItem('access_token', access_token);
localStorage.setItem('user', JSON.stringify(user));

// 3. Use token in subsequent requests
const apiCall = await fetch('/api/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

### Token Refresh Implementation
```javascript
async function refreshToken() {
  const currentToken = localStorage.getItem('access_token');

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });

    if (response.ok) {
      const { access_token } = await response.json();
      localStorage.setItem('access_token', access_token);
      return access_token;
    }
  } catch (error) {
    // Redirect to login
    window.location.href = '/login';
  }
}
```

---

## Phone Verification Flow

### Complete Phone Verification
```javascript
// Step 1: Send OTP
await fetch('/api/auth/phone/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phoneNumber: '+84901234567'
  })
});

// Step 2: User enters OTP from SMS

// Step 3: Confirm OTP
await fetch('/api/auth/phone/confirm', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phoneNumber: '+84901234567',
    otpCode: '123456'
  })
});
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(50),
  full_name VARCHAR(255),
  phone_e164 VARCHAR(20) UNIQUE,
  phone_verified_at TIMESTAMPTZ,
  role VARCHAR(20) DEFAULT 'member',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);
```