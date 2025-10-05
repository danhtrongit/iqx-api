import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import * as readline from 'readline';
import { AppDataSource } from '../../../data-source';

/**
 * Script để tạo admin user đầu tiên
 * 
 * Chạy: ts-node src/admin/scripts/create-first-admin.ts
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createFirstAdmin() {
  try {
    console.log('=== TẠO ADMIN USER ĐẦU TIÊN ===\n');

    // Kết nối database
    await AppDataSource.initialize();
    console.log('✓ Đã kết nối database\n');

    const userRepository = AppDataSource.getRepository('User');

    // Kiểm tra xem đã có admin chưa
    const existingAdmin = await userRepository.findOne({
      where: { role: 'admin' },
    });

    if (existingAdmin) {
      console.log('⚠ Đã có admin user trong hệ thống:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   ID: ${existingAdmin.id}\n`);

      const confirm = await askQuestion(
        'Bạn có muốn tạo thêm admin user mới không? (y/n): ',
      );

      if (confirm.toLowerCase() !== 'y') {
        console.log('\nHủy tạo admin user mới.');
        rl.close();
        await AppDataSource.destroy();
        return;
      }
    }

    // Nhập thông tin
    const email = await askQuestion('\nEmail: ');
    const password = await askQuestion('Password: ');
    const displayName = await askQuestion('Display Name (optional): ');
    const fullName = await askQuestion('Full Name (optional): ');

    // Kiểm tra email đã tồn tại
    const existingUser = await userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      console.log('\n⚠ Email đã tồn tại trong hệ thống');
      const promote = await askQuestion(
        'Bạn có muốn nâng cấp user này lên admin không? (y/n): ',
      );

      if (promote.toLowerCase() === 'y') {
        existingUser.role = 'admin';
        existingUser.isActive = true;
        await userRepository.save(existingUser);

        console.log('\n✓ Đã nâng cấp user lên admin:');
        console.log(`   ID: ${existingUser.id}`);
        console.log(`   Email: ${existingUser.email}`);
        console.log(`   Role: ${existingUser.role}`);
      } else {
        console.log('\nHủy thao tác.');
      }

      rl.close();
      await AppDataSource.destroy();
      return;
    }

    // Hash password
    const passwordHash = await argon2.hash(password);

    // Tạo admin user
    const admin = userRepository.create({
      email,
      passwordHash,
      displayName: displayName || email.split('@')[0],
      fullName: fullName || null,
      role: 'admin',
      isActive: true,
    });

    await userRepository.save(admin);

    console.log('\n✓ Tạo admin user thành công:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Display Name: ${admin.displayName}`);

    console.log('\n📝 Hãy sử dụng email và password này để đăng nhập và lấy JWT token');
    console.log(
      '   POST /api/auth/login với body: { "email": "' +
        email +
        '", "password": "..." }',
    );

    rl.close();
    await AppDataSource.destroy();
  } catch (error) {
    console.error('\n❌ Lỗi:', error);
    rl.close();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

createFirstAdmin();

