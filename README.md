<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

IQX API - Hệ thống giao dịch chứng khoán ảo (Virtual Trading) với tính năng:
- 📊 Giao dịch chứng khoán ảo với dữ liệu thị trường thực
- 💰 Hệ thống thanh toán (PayOS integration)
- 🎁 Hệ thống giới thiệu & hoa hồng (F1, F2, F3)
- 📦 Quản lý gói subscription
- 👥 Xếp hạng leaderboard
- 🔔 Watchlist & alerts
- 🔧 **Admin Management** - Quản lý users, gắn gói, khóa/kích hoạt users
- 🤖 **Chat API** - Tích hợp AriX AI để phân tích chứng khoán thông minh
- 🔄 **API Extensions** - Gói mở rộng API calls cho subscription

Built with [Nest](https://github.com/nestjs/nest) framework.

## Project setup

```bash
$ pnpm install
```

## 📚 Documentation

### 🌟 **MAIN DOCUMENTATION**
- **[COMPLETE_API_GUIDE.md](./COMPLETE_API_GUIDE.md)** ⭐ **READ THIS FIRST** (2,766 lines)
  - Hướng dẫn đầy đủ nhất về Chat API, Extensions, Payment, Admin
  - 50+ code examples (TypeScript, cURL, Python)
  - Complete error handling guide
  - Testing & deployment guide
  
- **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** 📑 - Danh mục tất cả docs

### Quick References
- **[API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)** - Tra cứu nhanh endpoints
- **[START_HERE.md](./START_HERE.md)** - Getting started guide

### API Documentation
- **[CHAT_API_V2.md](./CHAT_API_V2.md)** - Chat API detailed
- **[API_COMPLETE_DOCUMENTATION.md](./API_COMPLETE_DOCUMENTATION.md)** - Alternative full guide
- **[EXTENSION_PAYMENT_FLOW.md](./EXTENSION_PAYMENT_FLOW.md)** - Payment flow
- **[API_EXTENSION_PAYMENT_COMPLETE.md](./API_EXTENSION_PAYMENT_COMPLETE.md)** - Payment complete guide

### Admin Documentation
- **[ADMIN_PACKAGE_MANAGEMENT_API.md](./ADMIN_PACKAGE_MANAGEMENT_API.md)** - Package management
- **[USER_MANAGEMENT_API.md](./USER_MANAGEMENT_API.md)** - User management
- **[ADMIN_OVERVIEW.md](./ADMIN_OVERVIEW.md)** - Admin features
- **[ADMIN_ARCHITECTURE.md](./ADMIN_ARCHITECTURE.md)** - Architecture
- **[ADMIN_SETUP.md](./ADMIN_SETUP.md)** - Setup guide
- **[ADMIN_USE_CASES.md](./ADMIN_USE_CASES.md)** - Use cases
- **[ADMIN_IMPLEMENTATION_SUMMARY.md](./ADMIN_IMPLEMENTATION_SUMMARY.md)** - Implementation

### Technical Documentation
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical summary
- **[FINAL_IMPLEMENTATION_SUMMARY.md](./FINAL_IMPLEMENTATION_SUMMARY.md)** - Complete implementation
- **[MIGRATIONS.md](./MIGRATIONS.md)** - Migration guide
- **[MIGRATION-QUICK-START.md](./MIGRATION-QUICK-START.md)** - Quick start
- **[VIRTUAL_TRADING_PROFIT_CALCULATION.md](./VIRTUAL_TRADING_PROFIT_CALCULATION.md)** - Trading logic

## Database Migration

**⚠️ Quan trọng: Chạy migrations trước khi start ứng dụng**

```bash
# Quick start (recommended)
$ ./run-migrations.sh full

# Hoặc chạy thủ công
$ pnpm run migration:run
```

📖 Xem chi tiết: [MIGRATION-QUICK-START.md](./MIGRATION-QUICK-START.md)

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## API Documentation

API documentation is available at `http://localhost:3000/api` when running in development mode.

### Main Features

#### 🔐 Authentication
- Email/Password login with JWT
- Phone verification
- Password reset
- Session management

#### 💰 Payment System
- PayOS integration for online payment
- Bank transfer support
- Webhook handling
- Payment history

#### 🎁 Referral & Commission System
- Generate referral codes
- Track referrals (F1, F2, F3...)
- Automatic commission calculation
- Multi-tier commission support (10%, 3.5%, 1.5%)

#### 📊 Virtual Trading
- Buy/Sell stocks with virtual money
- Portfolio management
- Transaction history
- Profit/Loss tracking
- Real-time market data

#### 🏆 Leaderboard
- Rank by total asset value
- Rank by profit/loss percentage
- Win rate statistics

#### 📦 Subscription Management
- Multiple subscription packages
- Auto-renewal support
- Payment integration

#### 🔧 Admin User Management
- User statistics & overview
- Search and filter users
- Activate/Deactivate users
- Assign subscription packages to users
- Manage user subscriptions (extend, suspend, cancel)
- Update user roles
- Full audit trail for admin actions

📖 **Admin Documentation:**
- [Admin Setup Guide](./ADMIN_SETUP.md) - How to create first admin user
- [User Management API](./USER_MANAGEMENT_API.md) - Complete API reference
- [Admin Use Cases](./ADMIN_USE_CASES.md) - Common workflows & examples
- [Postman Collection](./postman-admin-collection.json) - Import for easy testing

## Environment Variables

Create a `.env` file in the `api/` directory:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=iqx

# JWT
JWT_SECRET=your_jwt_secret

# PayOS
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
```

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
