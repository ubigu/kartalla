import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`ALTER TABLE DATA.survey 
	DROP CONSTRAINT survey_name_key,
	ADD CONSTRAINT survey_name_organization_unique_key UNIQUE (name, organization);`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`ALTER TABLE DATA.survey 
        DROP CONSTRAINT survey_name_organization_unique_key,
        ADD CONSTRAINT survey_name_key UNIQUE (name);`);
}
