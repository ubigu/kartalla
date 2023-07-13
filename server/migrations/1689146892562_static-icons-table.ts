import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    `CREATE TABLE application.static_icons (id SERIAL PRIMARY KEY, name VARCHAR(40), svg BYTEA);`
  );
}
