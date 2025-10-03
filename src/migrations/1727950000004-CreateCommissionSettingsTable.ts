import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCommissionSettingsTable1727950000004 implements MigrationInterface {
  name = 'CreateCommissionSettingsTable1727950000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'commission_settings',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            default: "'default'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'commission_total_pct',
            type: 'decimal',
            precision: 5,
            scale: 4,
            default: 0.15,
          },
          {
            name: 'tiers_pct',
            type: 'json',
          },
          {
            name: 'is_active',
            type: 'tinyint',
            default: 1,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
      true,
    );

    // Insert default commission settings
    await queryRunner.query(`
      INSERT INTO \`commission_settings\` 
      (\`id\`, \`name\`, \`description\`, \`commission_total_pct\`, \`tiers_pct\`, \`is_active\`)
      VALUES 
      (UUID(), 'default', 'Cài đặt hoa hồng mặc định: F1=10%, F2=3.5%, F3=1.5%', 0.15, '[0.1, 0.035, 0.015]', 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('commission_settings');
  }
}

