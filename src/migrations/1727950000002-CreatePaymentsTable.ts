import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePaymentsTable1727950000002 implements MigrationInterface {
  name = 'CreatePaymentsTable1727950000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payments',
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
            length: '255',
          },
          {
            name: 'subscription_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'order_code',
            type: 'bigint',
            isUnique: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'VND'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
            default: "'pending'",
          },
          {
            name: 'payment_method',
            type: 'enum',
            enum: ['payos', 'bank_transfer', 'other'],
            default: "'payos'",
          },
          {
            name: 'payment_link_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'checkout_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'qr_code',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'account_number',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'transaction_date_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'counter_account_bank_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'counter_account_bank_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'counter_account_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'counter_account_number',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'virtual_account_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'virtual_account_number',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'webhook_data',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'cancelled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'failed_reason',
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
      'payments',
      new TableIndex({
        name: 'IDX_payments_user_id_status',
        columnNames: ['user_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_order_code',
        columnNames: ['order_code'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_payment_link_id',
        columnNames: ['payment_link_id'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['subscription_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user_subscriptions',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('payments');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('payments', foreignKey);
      }
    }

    await queryRunner.dropTable('payments');
  }
}

