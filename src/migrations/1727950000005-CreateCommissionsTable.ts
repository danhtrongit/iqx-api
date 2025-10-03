import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCommissionsTable1727950000005 implements MigrationInterface {
  name = 'CreateCommissionsTable1727950000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'commissions',
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
            comment: 'User nhận hoa hồng',
          },
          {
            name: 'payment_id',
            type: 'varchar',
            length: '36',
            comment: 'Payment gốc',
          },
          {
            name: 'referrer_id',
            type: 'varchar',
            length: '36',
            comment: 'User thực hiện mua hàng (F1, F2, F3...)',
          },
          {
            name: 'tier',
            type: 'int',
            comment: 'Cấp độ hoa hồng (1=F1, 2=F2, 3=F3)',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            comment: 'Số tiền hoa hồng',
          },
          {
            name: 'commission_pct',
            type: 'decimal',
            precision: 5,
            scale: 4,
            comment: '% hoa hồng áp dụng',
          },
          {
            name: 'original_amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            comment: 'Giá gốc của payment',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'approved', 'paid', 'cancelled'],
            default: "'pending'",
          },
          {
            name: 'paid_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'cancelled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'cancellation_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
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

    // Create indexes
    await queryRunner.createIndex(
      'commissions',
      new TableIndex({
        name: 'IDX_commissions_user_id_status',
        columnNames: ['user_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'commissions',
      new TableIndex({
        name: 'IDX_commissions_payment_id',
        columnNames: ['payment_id'],
      }),
    );

    await queryRunner.createIndex(
      'commissions',
      new TableIndex({
        name: 'IDX_commissions_referrer_id',
        columnNames: ['referrer_id'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'commissions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'FK_commissions_user_id',
      }),
    );

    await queryRunner.createForeignKey(
      'commissions',
      new TableForeignKey({
        columnNames: ['payment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payments',
        onDelete: 'CASCADE',
        name: 'FK_commissions_payment_id',
      }),
    );

    await queryRunner.createForeignKey(
      'commissions',
      new TableForeignKey({
        columnNames: ['referrer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'FK_commissions_referrer_id',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('commissions');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('commissions', foreignKey);
      }
    }

    await queryRunner.dropTable('commissions');
  }
}

