import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReferredByToUsers1727950000001 implements MigrationInterface {
  name = 'AddReferredByToUsers1727950000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add referred_by_id column to users table
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'referred_by_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE \`users\`
      ADD CONSTRAINT \`FK_referred_by_id\`
      FOREIGN KEY (\`referred_by_id\`)
      REFERENCES \`users\`(\`id\`)
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    // Add index for performance
    await queryRunner.query(`
      CREATE INDEX \`IDX_users_referred_by_id\` ON \`users\` (\`referred_by_id\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_referred_by_id\`
    `);

    // Drop index
    await queryRunner.query(`
      DROP INDEX \`IDX_users_referred_by_id\` ON \`users\`
    `);

    // Drop column
    await queryRunner.dropColumn('users', 'referred_by_id');
  }
}

