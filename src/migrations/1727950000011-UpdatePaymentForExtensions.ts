import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdatePaymentForExtensions1727950000011
  implements MigrationInterface
{
  name = 'UpdatePaymentForExtensions1727950000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add extension_id column
    await queryRunner.addColumn(
      'payments',
      new TableColumn({
        name: 'extension_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Add payment_type column
    await queryRunner.query(`
      ALTER TABLE \`payments\`
      ADD COLUMN \`payment_type\` ENUM('subscription', 'extension') NOT NULL DEFAULT 'subscription'
    `);

    // Add package_id column
    await queryRunner.addColumn(
      'payments',
      new TableColumn({
        name: 'package_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Add foreign key for extension_id
    await queryRunner.query(`
      ALTER TABLE \`payments\`
      ADD CONSTRAINT \`FK_payments_extension_id\`
      FOREIGN KEY (\`extension_id\`)
      REFERENCES \`user_api_extensions\`(\`id\`)
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    // Add index for payment_type
    await queryRunner.query(`
      CREATE INDEX \`IDX_payments_type\` ON \`payments\` (\`payment_type\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX \`IDX_payments_type\` ON \`payments\`
    `);

    // Drop foreign key
    await queryRunner.query(`
      ALTER TABLE \`payments\` DROP FOREIGN KEY \`FK_payments_extension_id\`
    `);

    // Drop columns
    await queryRunner.dropColumn('payments', 'package_id');
    await queryRunner.dropColumn('payments', 'payment_type');
    await queryRunner.dropColumn('payments', 'extension_id');
  }
}


