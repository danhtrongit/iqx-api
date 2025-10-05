import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameApiLimitColumn1727950000006 implements MigrationInterface {
  name = 'RenameApiLimitColumn1727950000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename daily_api_limit to api_limit in subscription_packages table
    await queryRunner.query(`
      ALTER TABLE \`subscription_packages\`
      CHANGE COLUMN \`daily_api_limit\` \`api_limit\` int NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rename api_limit back to daily_api_limit
    await queryRunner.query(`
      ALTER TABLE \`subscription_packages\`
      CHANGE COLUMN \`api_limit\` \`daily_api_limit\` int NULL
    `);
  }
}

