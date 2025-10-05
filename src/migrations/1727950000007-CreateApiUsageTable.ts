import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateApiUsageTable1727950000007 implements MigrationInterface {
  name = 'CreateApiUsageTable1727950000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create api_usage table
    await queryRunner.createTable(
      new Table({
        name: 'api_usage',
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
            name: 'usage_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'request_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_tokens',
            type: 'int',
            default: 0,
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

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE \`api_usage\`
      ADD CONSTRAINT \`FK_api_usage_user_id\`
      FOREIGN KEY (\`user_id\`)
      REFERENCES \`users\`(\`id\`)
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Add index for user_id and usage_date
    await queryRunner.createIndex(
      'api_usage',
      new TableIndex({
        name: 'IDX_api_usage_user_date',
        columnNames: ['user_id', 'usage_date'],
      }),
    );

    // Add index for usage_date
    await queryRunner.createIndex(
      'api_usage',
      new TableIndex({
        name: 'IDX_api_usage_date',
        columnNames: ['usage_date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('api_usage', 'IDX_api_usage_date');
    await queryRunner.dropIndex('api_usage', 'IDX_api_usage_user_date');

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE \`api_usage\` DROP FOREIGN KEY \`FK_api_usage_user_id\`
    `);

    // Drop table
    await queryRunner.dropTable('api_usage');
  }
}

