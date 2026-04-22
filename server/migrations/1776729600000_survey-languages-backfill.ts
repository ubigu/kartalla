import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`UPDATE data.survey SET languages = '{fi}' WHERE languages = '{}'`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`UPDATE data.survey SET languages = '{}' WHERE languages = '{fi}'`);
}
