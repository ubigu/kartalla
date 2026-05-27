import pg from 'pg';
import { TEST_SURVEY_URL_NAMES } from './data';

const { Pool } = pg;

class DatabaseConnection {
  private pool: any;

  constructor() {
    this.pool = new Pool({
      user: 'kartalla_user',
      host: '127.0.0.1',
      database: 'kartalla_e2e_db',
      password: 'password',
      port: 5432,
    });
  }

  private async disconnect() {
    await this.pool.end();
  }

  async query(query: string, params?: any[]) {
    try {
      const res = await this.pool.query(query, params);
      return res.rows;
    } catch (err) {
      console.log(err);
    }
  }
}

const connection = new DatabaseConnection();

export async function clearData() {
  return connection.query(`
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
  await connection.query(
    `DELETE FROM data.answer_entry
     WHERE submission_id IN (
       SELECT id FROM data.submission
       WHERE survey_id IN (SELECT id FROM data.survey WHERE name = ANY($1::text[]))
     )`,
    [urlNames],
  );
  await connection.query(
    `DELETE FROM data.personal_info
     WHERE submission_id IN (
       SELECT id FROM data.submission
       WHERE survey_id IN (SELECT id FROM data.survey WHERE name = ANY($1::text[]))
     )`,
    [urlNames],
  );
  await connection.query(
    `DELETE FROM data.survey WHERE name = ANY($1::text[])`,
    [urlNames],
  );
}

export async function clearSections() {
  return connection.query(`DELETE FROM data.page_section;`);
}

export async function deleteSurveyById(id: string) {
  const surveyId = Number(id);
  const submissions = await connection.query(
    `SELECT id FROM data.submission WHERE survey_id = $1`,
    [surveyId],
  );
  if (submissions && submissions.length > 0) {
    const submissionIds = submissions.map((s: { id: number }) => s.id);
    await connection.query(
      `DELETE FROM data.answer_entry WHERE submission_id = ANY ($1)`,
      [submissionIds],
    );
    await connection.query(
      `DELETE FROM data.personal_info WHERE submission_id = ANY ($1)`,
      [submissionIds],
    );
  }
  return connection.query(`DELETE FROM data.survey WHERE id = $1`, [surveyId]);
}
