import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE application.svg_icon (
      id SERIAL PRIMARY KEY,
      organization_id TEXT NOT NULL,
      svg_content TEXT NOT NULL,
      original_filename VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX svg_icon_organization_id_idx ON application.svg_icon (organization_id);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DROP TABLE application.svg_icon;`);
}
