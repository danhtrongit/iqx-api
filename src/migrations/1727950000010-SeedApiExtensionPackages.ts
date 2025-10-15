import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedApiExtensionPackages1727950000010
  implements MigrationInterface
{
  name = 'SeedApiExtensionPackages1727950000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO api_extension_packages (id, name, description, additional_calls, price, currency, is_active)
      VALUES
        (
          UUID(),
          'Gói Mở Rộng 1K',
          'Thêm 1,000 API calls vào gói subscription hiện tại',
          1000,
          49000,
          'VND',
          1
        ),
        (
          UUID(),
          'Gói Mở Rộng 5K',
          'Thêm 5,000 API calls vào gói subscription hiện tại - Tiết kiệm 20%',
          5000,
          199000,
          'VND',
          1
        ),
        (
          UUID(),
          'Gói Mở Rộng 10K',
          'Thêm 10,000 API calls vào gói subscription hiện tại - Tiết kiệm 30%',
          10000,
          349000,
          'VND',
          1
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM api_extension_packages
      WHERE name IN ('Gói Mở Rộng 1K', 'Gói Mở Rộng 5K', 'Gói Mở Rộng 10K')
    `);
  }
}


