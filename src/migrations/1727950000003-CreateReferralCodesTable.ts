import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateReferralCodesTable1727950000003 implements MigrationInterface {
  name = 'CreateReferralCodesTable1727950000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'referral_codes',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '20',
            isUnique: true,
          },
          {
            name: 'total_referrals',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_commission',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
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

    // Create unique index on code
    await queryRunner.createIndex(
      'referral_codes',
      new TableIndex({
        name: 'IDX_referral_codes_code',
        columnNames: ['code'],
        isUnique: true,
      }),
    );

    // Create index on user_id
    await queryRunner.createIndex(
      'referral_codes',
      new TableIndex({
        name: 'IDX_referral_codes_user_id',
        columnNames: ['user_id'],
      }),
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'referral_codes',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('referral_codes');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('referral_codes', foreignKey);
      }
    }

    await queryRunner.dropTable('referral_codes');
  }
}

