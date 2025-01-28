import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`CREATE TABLE data.personal_info (
        id SERIAL PRIMARY KEY,
        submission_id INT4 REFERENCES data.submission(id) ON DELETE RESTRICT,
        section_id INT4 REFERENCES data.page_section(id) ON DELETE RESTRICT,
        name bytea,
        email bytea,
        phone bytea
      )`);

  pgm.sql(
    `ALTER TABLE data.survey ADD COLUMN email_include_personal_info BOOLEAN DEFAULT FALSE`,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DROP TABLE data.personal_info;`);
  pgm.sql(`ALTER TABLE data.survey DROP COLUMN email_include_personal_info`);
}
