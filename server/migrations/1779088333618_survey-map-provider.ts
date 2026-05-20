import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    ALTER TABLE data.survey ADD COLUMN map_provider TEXT;
    UPDATE data.survey SET map_provider = CASE WHEN map_url IS NOT NULL AND map_url != '' THEN 'oskari' ELSE 'openlayers' END;
    ALTER TABLE data.survey ALTER COLUMN map_provider SET NOT NULL;

    UPDATE data.survey_page sp
    SET sidebar_map_layers = '[0]'::json
    FROM data.survey s
    WHERE sp.survey_id = s.id
      AND s.map_provider = 'openlayers'
      AND sp.sidebar_type = 'map';

    CREATE TABLE application.map_layers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    );
    INSERT INTO application.map_layers (id, name) VALUES (0, 'OpenStreetMap');
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DROP TABLE application.map_layers;

    UPDATE data.survey_page sp
    SET sidebar_map_layers = '[]'::json
    FROM data.survey s
    WHERE sp.survey_id = s.id
      AND s.map_provider = 'openlayers'
      AND sp.sidebar_type = 'map';

    ALTER TABLE data.survey DROP COLUMN map_provider;
  `);
}
