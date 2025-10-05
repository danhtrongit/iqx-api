import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateApiExtensionTables1727950000009
  implements MigrationInterface
{
  name = 'CreateApiExtensionTables1727950000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create api_extension_packages table
    await queryRunner.createTable(
      new Table({
        name: 'api_extension_packages',
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
            length: '255',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'additional_calls',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'VND'",
          },
          {
            name: 'is_active',
            type: 'tinyint',
            default: 1,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create user_api_extensions table
    await queryRunner.createTable(
      new Table({
        name: 'user_api_extensions',
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
            isNullable: false,
          },
          {
            name: 'subscription_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'extension_package_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'additional_calls',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'VND'",
          },
          {
            name: 'payment_reference',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE \`user_api_extensions\`
      ADD CONSTRAINT \`FK_user_api_ext_user_id\`
      FOREIGN KEY (\`user_id\`)
      REFERENCES \`users\`(\`id\`)
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`user_api_extensions\`
      ADD CONSTRAINT \`FK_user_api_ext_subscription_id\`
      FOREIGN KEY (\`subscription_id\`)
      REFERENCES \`user_subscriptions\`(\`id\`)
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`user_api_extensions\`
      ADD CONSTRAINT \`FK_user_api_ext_package_id\`
      FOREIGN KEY (\`extension_package_id\`)
      REFERENCES \`api_extension_packages\`(\`id\`)
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Add indexes
    await queryRunner.createIndex(
      'user_api_extensions',
      new TableIndex({
        name: 'IDX_user_api_ext_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_api_extensions',
      new TableIndex({
        name: 'IDX_user_api_ext_subscription_id',
        columnNames: ['subscription_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex(
      'user_api_extensions',
      'IDX_user_api_ext_subscription_id',
    );
    await queryRunner.dropIndex(
      'user_api_extensions',
      'IDX_user_api_ext_user_id',
    );

    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE \`user_api_extensions\` DROP FOREIGN KEY \`FK_user_api_ext_package_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_api_extensions\` DROP FOREIGN KEY \`FK_user_api_ext_subscription_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_api_extensions\` DROP FOREIGN KEY \`FK_user_api_ext_user_id\``,
    );

    // Drop tables
    await queryRunner.dropTable('user_api_extensions');
    await queryRunner.dropTable('api_extension_packages');
  }
}

