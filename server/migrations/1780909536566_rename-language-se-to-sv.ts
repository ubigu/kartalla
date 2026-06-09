import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

/**
 * Migrates the internal Swedish language identifier from the incorrect `se`
 * to the correct code `sv`.
 */

const CREATE_LOCALIZED_PREDICATE = `
  CREATE OR REPLACE FUNCTION data.is_localized_object(node jsonb)
  RETURNS boolean
  LANGUAGE sql IMMUTABLE
  AS $func$
    SELECT jsonb_typeof(node) = 'object'
       AND bool_and(
             key IN ('fi', 'en', 'sv', 'se')
             AND jsonb_typeof(value) IN ('string', 'null')
           )
    FROM jsonb_each(node);
  $func$;
`;

const DROP_LOCALIZED_PREDICATE = `DROP FUNCTION data.is_localized_object(jsonb);`;

const CREATE_COPY_FUNCTION = `
  CREATE OR REPLACE FUNCTION data.copy_localized_lang(
    node jsonb, from_key text, to_key text
  ) RETURNS jsonb
  LANGUAGE plpgsql IMMUTABLE
  AS $func$
  DECLARE
    result jsonb := '{}'::jsonb;
    child_key text;
    child_value jsonb;
  BEGIN
    IF node IS NULL THEN
      RETURN NULL;
    END IF;

    CASE jsonb_typeof(node)
      WHEN 'object' THEN
        -- Recurse into every value first.
        FOR child_key, child_value IN SELECT * FROM jsonb_each(node) LOOP
          result := result || jsonb_build_object(
            child_key, data.copy_localized_lang(child_value, from_key, to_key)
          );
        END LOOP;

        -- On a genuine localized object that still has the old key but not
        -- the new one, copy the translation across under the new key.
        IF data.is_localized_object(node)
           AND jsonb_exists(result, from_key)
           AND NOT jsonb_exists(result, to_key) THEN
          result := result || jsonb_build_object(to_key, result -> from_key);
        END IF;

        RETURN result;
      WHEN 'array' THEN
        RETURN (
          SELECT coalesce(
            jsonb_agg(data.copy_localized_lang(element, from_key, to_key)),
            '[]'::jsonb
          )
          FROM jsonb_array_elements(node) AS element
        );
      ELSE
        RETURN node;
    END CASE;
  END;
  $func$;
`;

const DROP_COPY_FUNCTION = `DROP FUNCTION data.copy_localized_lang(jsonb, text, text);`;

interface LocalizedColumn {
  table_name: string;
  column_name: string;
  data_type: 'json' | 'jsonb';
}

async function migrateLanguageKey(
  pgm: MigrationBuilder,
  fromKey: string,
  toKey: string,
): Promise<void> {
  pgm.sql(CREATE_LOCALIZED_PREDICATE);
  pgm.sql(CREATE_COPY_FUNCTION);

  // Copy the language key inside every localized JSON/JSONB column in the data
  // schema. The helper only touches genuine localized objects, so running it
  // across all such columns is safe and avoids missing any.
  const columns: LocalizedColumn[] = await pgm.db.select(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'data' AND data_type IN ('json', 'jsonb')
  `);

  for (const { table_name, column_name, data_type } of columns) {
    pgm.sql(`
      UPDATE data."${table_name}"
      SET "${column_name}" =
        data.copy_localized_lang("${column_name}"::jsonb, '${fromKey}', '${toKey}')::${data_type}
      WHERE "${column_name}" IS NOT NULL
        AND "${column_name}"::text LIKE '%"${fromKey}"%';
    `);
  }

  // Scalar language identifiers — corrected in place (no localized content).
  pgm.sql(`
    UPDATE data.survey
    SET languages = array_replace(languages, '${fromKey}', '${toKey}')
    WHERE '${fromKey}' = ANY(languages);
  `);
  pgm.sql(`
    UPDATE data.submission SET language = '${toKey}' WHERE language = '${fromKey}';
  `);
  pgm.sql(`
    UPDATE application."user"
    SET default_language = '${toKey}' WHERE default_language = '${fromKey}';
  `);

  pgm.sql(DROP_COPY_FUNCTION);
  pgm.sql(DROP_LOCALIZED_PREDICATE);
}

export async function up(pgm: MigrationBuilder): Promise<void> {
  await migrateLanguageKey(pgm, 'se', 'sv');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await migrateLanguageKey(pgm, 'sv', 'se');
}
