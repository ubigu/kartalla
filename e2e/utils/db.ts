import pg from 'pg';

const { Pool } = pg;

class DatabaseConnection {
  private pool: any;

  constructor() {
    this.pool = new Pool({
      user: 'vuorovaikutusalusta_user',
      host: '127.0.0.1',
      database: 'vuorovaikutusalusta_e2e_db',
      password: 'password',
      port: 5432,
    });
  }

  private async disconnect() {
    await this.pool.end();
  }

  async query(query: string) {
    try {
      const res = await this.pool.query(query);
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

export async function clearSections() {
  return connection.query(`
    DELETE FROM data.page_section;`);
}
