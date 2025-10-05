import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddApiCallsToSubscriptions1727950000008
  implements MigrationInterface
{
  name = 'AddApiCallsToSubscriptions1727950000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add api_calls_used column
    await queryRunner.addColumn(
      'user_subscriptions',
      new TableColumn({
        name: 'api_calls_used',
        type: 'int',
        default: 0,
      }),
    );

    // Add api_calls_limit column
    await queryRunner.addColumn(
      'user_subscriptions',
      new TableColumn({
        name: 'api_calls_limit',
        type: 'int',
        isNullable: true,
      }),
    );

    // Initialize api_calls_limit from package apiLimit for existing subscriptions
    await queryRunner.query(`
      UPDATE user_subscriptions us
      INNER JOIN subscription_packages sp ON us.package_id = sp.id
      SET us.api_calls_limit = sp.api_limit
      WHERE us.api_calls_limit IS NULL AND sp.api_limit IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_subscriptions', 'api_calls_limit');
    await queryRunner.dropColumn('user_subscriptions', 'api_calls_used');
  }
}

