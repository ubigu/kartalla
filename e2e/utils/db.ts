import pg from 'pg';
import { TEST_SURVEY_URL_NAMES } from './data';

const { Pool } = pg;

class DatabaseConnection {
  private pool: pg.Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.E2E_DB_USER ?? 'kartalla_user',
      host: process.env.E2E_DB_HOST ?? '127.0.0.1',
      database: process.env.E2E_DB_NAME ?? 'kartalla_e2e_db',
      password: process.env.E2E_DB_PASSWORD ?? 'password',
      port: Number(process.env.E2E_DB_PORT ?? 5432),
    });
  }

  async query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    query: string,
    params?: unknown[],
  ): Promise<T[]> {
    const res = await this.pool.query<T>(query, params);
    return res.rows;
  }
}

const connection = new DatabaseConnection();

/** Deletes the given surveys together with their submissions' child rows. */
async function deleteSurveysByIds(surveyIds: number[]) {
  if (surveyIds.length === 0) return;

  const submissions = await connection.query<{ id: number }>(
    `SELECT id FROM data.submission WHERE survey_id = ANY($1)`,
    [surveyIds],
  );
  const submissionIds = submissions.map((s) => s.id);

  if (submissionIds.length > 0) {
    await connection.query(
      `DELETE FROM data.answer_entry WHERE submission_id = ANY($1)`,
      [submissionIds],
    );
    await connection.query(
      `DELETE FROM data.personal_info WHERE submission_id = ANY($1)`,
      [submissionIds],
    );
  }

  await connection.query(`DELETE FROM data.survey WHERE id = ANY($1)`, [
    surveyIds,
  ]);
}

export async function clearData() {
  await connection.query(`
    CREATE OR REPLACE FUNCTION data.truncate_tables(
 )
    RETURNS void
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
        AS $BODY$
            DO $$ DECLARE
                table_name text;
            BEGIN
                FOR table_name IN (SELECT tablename FROM pg_tables WHERE schemaname='data') LOOP
                    EXECUTE 'TRUNCATE TABLE data."' || table_name || '" CASCADE;';
                END LOOP;
            END $$;
        $BODY$;



SELECT data.truncate_tables();`);
}

export async function clearTestSurveys(
  urlNames: string[] = Object.values(TEST_SURVEY_URL_NAMES),
) {
  const surveys = await connection.query<{ id: number }>(
    `SELECT id FROM data.survey WHERE name = ANY($1::text[])`,
    [urlNames],
  );
  await deleteSurveysByIds(surveys.map((s) => s.id));
}

export async function clearSections() {
  await connection.query(`DELETE FROM data.page_section;`);
}

const DEFAULT_MOCK_USER_ID =
  process.env.MOCK_USER_ID ?? '12345-67890-abcde-fghij3';

export async function clearMockUserDefaultLanguage(userId?: string) {
  await connection.query(
    `UPDATE application.user SET default_language = NULL WHERE id = $1`,
    [userId ?? DEFAULT_MOCK_USER_ID],
  );
}

export async function setMockUserDefaultLanguage(
  language: string,
  userId?: string,
) {
  await connection.query(
    `UPDATE application.user SET default_language = $2 WHERE id = $1`,
    [userId ?? DEFAULT_MOCK_USER_ID, language],
  );
}

export async function deleteSurveyById(id: string) {
  await deleteSurveysByIds([Number(id)]);
}
