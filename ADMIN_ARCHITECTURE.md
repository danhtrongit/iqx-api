# 🏗️ Admin Module - Architecture

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
│                  (Postman/Frontend/cURL)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Requests
                         │ Authorization: Bearer <JWT>
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (NestJS)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Guards Middleware                          │
│  ┌──────────────────┐    ┌─────────────────────┐           │
│  │  JwtAuthGuard    │───▶│   AdminGuard        │           │
│  │  (Verify Token)  │    │   (Check Role)      │           │
│  └──────────────────┘    └─────────────────────┘           │
└────────────────────────┬────────────────────────────────────┘
                         │ If authorized
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              UserManagementController                        │
│  ┌─────────────────────────────────────────────────┐       │
│  │  GET    /api/admin/users/stats                  │       │
│  │  GET    /api/admin/users                        │       │
│  │  GET    /api/admin/users/:id                    │       │
│  │  PATCH  /api/admin/users/:id/activate           │       │
│  │  PATCH  /api/admin/users/:id/deactivate         │       │
│  │  PATCH  /api/admin/users/:id/role               │       │
│  │  GET    /api/admin/users/:id/subscriptions      │       │
│  │  POST   /api/admin/users/:id/subscriptions      │       │
│  │  PATCH  /api/admin/users/:id/subscriptions/:sid │       │
│  │  DELETE /api/admin/users/:id/subscriptions/:sid │       │
│  └─────────────────────────────────────────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            UserManagementService                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │  • listUsers()                                   │       │
│  │  • getUserById()                                 │       │
│  │  • activateUser()                                │       │
│  │  • deactivateUser()                              │       │
│  │  • updateUserRole()                              │       │
│  │  • assignSubscription()                          │       │
│  │  • getUserSubscriptions()                        │       │
│  │  • updateSubscription()                          │       │
│  │  • cancelSubscription()                          │       │
│  │  • getUserStats()                                │       │
│  │  • createAuditLog()                              │       │
│  └─────────────────────────────────────────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   TypeORM Repositories                       │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │    User      │  │ UserSubscription │  │ AuditLog     │ │
│  │  Repository  │  │    Repository    │  │  Repository  │ │
│  └──────────────┘  └──────────────────┘  └──────────────┘ │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         SubscriptionPackage Repository               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      MySQL Database                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  users                                                │  │
│  │  ├─ id, email, role, isActive                        │  │
│  │  └─ displayName, fullName, phoneE164                 │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  user_subscriptions                                   │  │
│  │  ├─ id, userId, packageId                            │  │
│  │  ├─ status, startsAt, expiresAt                      │  │
│  │  └─ price, currency, autoRenew                       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  subscription_packages                                │  │
│  │  ├─ id, name, description                            │  │
│  │  ├─ price, currency, durationDays                    │  │
│  │  └─ isActive, features                               │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  audit_logs                                           │  │
│  │  ├─ id, userId (admin), action                       │  │
│  │  ├─ ipAddress, userAgent                             │  │
│  │  └─ data (JSON), createdAt                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Security Flow

```
┌─────────────────┐
│  Client Request │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  1. Extract JWT Token   │
│     from Authorization  │
│     header              │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐         ┌──────────────┐
│  2. JwtAuthGuard        │────NO──▶│  Return 401  │
│     Validate Token      │         └──────────────┘
└────────┬────────────────┘
         │ YES
         ▼
┌─────────────────────────┐         ┌──────────────┐
│  3. AdminGuard          │────NO──▶│  Return 403  │
│     Check role='admin'  │         └──────────────┘
└────────┬────────────────┘
         │ YES
         ▼
┌─────────────────────────┐
│  4. Execute Controller  │
│     Method              │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  5. Service Layer       │
│     Business Logic      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  6. Database Operation  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  7. Create Audit Log    │
│     Record action       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  8. Return Response     │
└─────────────────────────┘
```

## 📦 Module Dependencies

```
┌──────────────────────────────────────┐
│          AdminModule                 │
│  ┌────────────────────────────────┐ │
│  │  Controllers:                  │ │
│  │  • UserManagementController    │ │
│  ├────────────────────────────────┤ │
│  │  Services:                     │ │
│  │  • UserManagementService       │ │
│  ├────────────────────────────────┤ │
│  │  Guards:                       │ │
│  │  • AdminGuard                  │ │
│  └────────────────────────────────┘ │
└───────────┬──────────────────────────┘
            │
            │ imports
            ▼
┌───────────────────────────────────────┐
│       TypeOrmModule.forFeature        │
│  • User                               │
│  • UserSubscription                   │
│  • SubscriptionPackage                │
│  • AuditLog                           │
└───────────────────────────────────────┘
            │
            │ uses from
            ▼
┌───────────────────────────────────────┐
│          AuthModule                   │
│  • JwtAuthGuard                       │
│  • JwtStrategy                        │
└───────────────────────────────────────┘
```

## 🔄 Data Flow Examples

### Example 1: List Users

```
1. Client Request
   GET /api/admin/users?page=1&limit=10&role=member
   Authorization: Bearer <token>
   
2. Guards Validation
   JwtAuthGuard → Validate token
   AdminGuard → Check role = 'admin'
   
3. Controller
   UserManagementController.listUsers(query)
   Extract: page, limit, role from query params
   
4. Service
   UserManagementService.listUsers(query)
   - Build QueryBuilder
   - Apply filters (role=member)
   - Apply pagination (skip, take)
   - Execute query
   
5. Database
   SELECT users.*, subscriptions.*, packages.*
   FROM users
   LEFT JOIN user_subscriptions subscriptions
   LEFT JOIN subscription_packages packages
   WHERE users.role = 'member'
   ORDER BY users.createdAt DESC
   LIMIT 10 OFFSET 0;
   
6. Response
   {
     data: [...users],
     pagination: { total, page, limit, totalPages }
   }
```

### Example 2: Assign Subscription

```
1. Client Request
   POST /api/admin/users/{userId}/subscriptions
   Body: { packageId, startsAt, durationDays, autoRenew }
   
2. Guards Validation
   ✓ Token valid
   ✓ User is admin
   
3. Controller
   UserManagementController.assignSubscription(userId, assignDto)
   Extract adminId from req.user
   
4. Service
   UserManagementService.assignSubscription(userId, assignDto, adminId)
   
5. Business Logic
   a) Validate user exists
   b) Validate package exists & active
   c) Check no duplicate active subscription
   d) Calculate startsAt & expiresAt
   e) Create subscription record
   f) Save to database
   g) Create audit log
   
6. Database Transactions
   BEGIN TRANSACTION
     INSERT INTO user_subscriptions (...)
     INSERT INTO audit_logs (action='admin.user.assign_subscription', ...)
   COMMIT
   
7. Response
   {
     message: "Gắn gói subscription cho người dùng thành công",
     subscription: { ...subscriptionData }
   }
```

### Example 3: Deactivate User

```
1. Client Request
   PATCH /api/admin/users/{userId}/deactivate
   
2. Guards → ✓ Authorized
   
3. Service Flow
   a) Find user by ID
   b) Check user exists → throw 404 if not
   c) Check not already inactive → throw 400 if inactive
   d) Check user is not admin → throw 400 if admin
   e) Set user.isActive = false
   f) Save user
   g) Create audit log
   
4. Audit Log
   {
     userId: adminId,
     action: 'admin.user.deactivate',
     ipAddress: '192.168.1.1',
     userAgent: 'PostmanRuntime/7.x',
     data: { targetUserId: userId }
   }
   
5. Response
   {
     message: "Khóa người dùng thành công",
     user: { ...sanitizedUserData }
   }
```

## 🗄️ Database Schema Relationships

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │◀────────┐
│ email           │         │
│ role            │         │
│ isActive        │         │
│ displayName     │         │
└─────────────────┘         │
         │                  │
         │ 1:N              │ N:1
         │                  │
         ▼                  │
┌──────────────────────┐    │
│ user_subscriptions   │    │
│──────────────────────│    │
│ id (PK)              │    │
│ userId (FK) ─────────┘    │
│ packageId (FK) ───────────┤
│ status               │    │
│ startsAt             │    │
│ expiresAt            │    │
│ autoRenew            │    │
└──────────────────────┘    │
                            │
                            │
                            │
┌──────────────────────┐    │
│ subscription_packages│    │
│──────────────────────│    │
│ id (PK) ◀────────────┘
│ name                 │
│ price                │
│ durationDays         │
│ isActive             │
└──────────────────────┘

┌─────────────────┐
│   audit_logs    │
│─────────────────│
│ id (PK)         │
│ userId (FK)     │──▶ Admin who performed action
│ action          │    'admin.user.activate'
│ ipAddress       │    '192.168.1.1'
│ userAgent       │    'PostmanRuntime/7.x'
│ data (JSON)     │    { targetUserId: '...' }
│ createdAt       │
└─────────────────┘
```

## 🎯 API Request/Response Flow

### GET /api/admin/users/stats

```
Request:
  GET /api/admin/users/stats
  Authorization: Bearer eyJhbGc...

Processing:
  ├─ JwtAuthGuard validates token
  ├─ AdminGuard checks role
  ├─ Controller calls service.getUserStats()
  ├─ Service queries database
  │   ├─ COUNT(*) FROM users
  │   ├─ COUNT(*) WHERE isActive=true
  │   ├─ COUNT(*) WHERE role='premium'
  │   └─ COUNT(*) WHERE createdAt > startOfMonth
  └─ Return aggregated stats

Response:
  {
    "totalUsers": 1543,
    "activeUsers": 1420,
    "inactiveUsers": 123,
    "premiumUsers": 456,
    "adminUsers": 5,
    "newUsersThisMonth": 89
  }
```

## 🧩 Component Interaction

```
┌─────────────────────────────────────────────────────┐
│                  HTTP Request                       │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │  Controller   │ ← Handles HTTP, extracts params
         └───────┬───────┘
                 │ calls
                 ▼
         ┌───────────────┐
         │   Service     │ ← Business logic
         └───────┬───────┘
                 │ uses
                 ▼
         ┌───────────────┐
         │  Repository   │ ← Data access
         └───────┬───────┘
                 │ queries
                 ▼
         ┌───────────────┐
         │   Database    │ ← Persistent storage
         └───────────────┘
```

## 📈 Scalability Considerations

### Horizontal Scaling
```
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Instance │   │ Instance │   │ Instance │
│    1     │   │    2     │   │    3     │
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     └──────────────┼──────────────┘
                    │
            ┌───────▼───────┐
            │ Load Balancer │
            └───────┬───────┘
                    │
            ┌───────▼────────┐
            │    Database    │
            │   (MySQL)      │
            └────────────────┘
```

### Caching Strategy (Future)
```
┌─────────────────────────────────────┐
│           Redis Cache               │
│  ┌───────────────────────────────┐ │
│  │  User Stats (TTL: 5 min)      │ │
│  │  Package List (TTL: 1 hour)   │ │
│  │  User Details (TTL: 10 min)   │ │
│  └───────────────────────────────┘ │
└──────────────┬──────────────────────┘
               │ Cache miss
               ▼
┌──────────────────────────────────────┐
│         MySQL Database               │
└──────────────────────────────────────┘
```

## 🛡️ Error Handling Flow

```
┌────────────────┐
│  API Request   │
└───────┬────────┘
        │
        ▼
┌────────────────────┐
│  Try-Catch Block   │
└───────┬────────────┘
        │
        ├─────────────────────────────┐
        │                             │
        ▼                             ▼
    Success                       Exception
        │                             │
        │                      ┌──────┴──────┐
        │                      │             │
        │                 NotFoundException  ConflictException
        │                      │             │
        │                   404 Error     409 Error
        │                      │             │
        │                      └──────┬──────┘
        │                             │
        ▼                             ▼
┌────────────────┐          ┌──────────────────┐
│  Return 200 OK │          │ Return HTTP Error│
│  with data     │          │ with message     │
└────────────────┘          └──────────────────┘
```

## 🔄 Audit Trail Architecture

```
Every Admin Action
        │
        ▼
┌───────────────────────────┐
│   Create Audit Log        │
│  ┌─────────────────────┐ │
│  │ action              │ │
│  │ userId (admin)      │ │
│  │ ipAddress           │ │
│  │ userAgent           │ │
│  │ data (JSON)         │ │
│  │ createdAt           │ │
│  └─────────────────────┘ │
└────────────┬──────────────┘
             │ Save to
             ▼
┌───────────────────────────┐
│   audit_logs table        │
└───────────────────────────┘
             │
             │ Can be queried by
             ▼
┌───────────────────────────┐
│   Admin Dashboard         │
│   Compliance Reports      │
│   Security Monitoring     │
└───────────────────────────┘
```

---

**Legend:**
- `→` Flow direction
- `├─` Branch
- `▼` Downward flow
- `◀─` Reference/relationship
- `(PK)` Primary Key
- `(FK)` Foreign Key
- `1:N` One-to-many relationship
- `N:1` Many-to-one relationship

