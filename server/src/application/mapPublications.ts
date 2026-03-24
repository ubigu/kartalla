import { MapPublication } from '@interfaces/mapPublications';
import { getDb } from '@src/database';

interface DBMapPublication {
  id: string;
  name: string;
  url: string;
  organization: string;
}

function DBMapPublicationToMapPublication(
  dbMapPublication: DBMapPublication,
): MapPublication {
  return {
    id: dbMapPublication.id,
    name: dbMapPublication.name,
    url: dbMapPublication.url,
  };
}

export async function getMapPublications(organizationId: string) {
  const result = await getDb().manyOrNone<DBMapPublication>(
    `
    SELECT id, name, url
    FROM data.map_publications
    WHERE organization = $1
    ORDER BY name
    `,
    [organizationId],
  );

  return result.map(DBMapPublicationToMapPublication);
}

export async function getMapPublication(id: string) {
  return getDb().oneOrNone<DBMapPublication>(
    `
    SELECT id, name, url, organization
    FROM data.map_publications
    WHERE id = $1
    `,
    [id],
  );
}

export async function addMapPublication(
  data: Omit<MapPublication, 'id'>,
  organizationId: string,
) {
  return getDb().one<{ id: string }>(
    `
    INSERT INTO data.map_publications (name, url, organization)
    VALUES ($1, $2, $3)
    RETURNING id
    `,
    [data.name, data.url.trim(), organizationId],
  );
}

export async function deleteMapPublication(id: string) {
  return getDb().none(
    `
    DELETE FROM data.map_publications
    WHERE id = $1
    `,
    [id],
  );
}
