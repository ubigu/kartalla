import {
  LanguageCode,
  LocalizedSurveyMapLayer,
  Survey,
} from '@interfaces/survey';
import { DEFAULT_SRID } from '@src/constants';
import logger from '@src/logger';
import fetch, { Response } from 'node-fetch';
import { getDb } from '../database';
import { NotFoundError } from '../error';

interface OskariConfiguration {
  configuration: {
    mapfull: {
      conf: {
        layers: {
          id: number;
          name?: string;
          locale?: Record<
            'fi' | 'en' | 'sv',
            {
              name?: string;
            }
          >;
        }[];
        mapOptions: { srsName: `EPSG:${number}` };
      };
    };
  };
}

function buildOskariAppSetupUrl(baseUrl: string, queryParams: string) {
  return `${baseUrl}/action?action_route=GetAppSetup&${queryParams}`;
}

export async function getOlMapLayers() {
  const rows = await getDb().manyOrNone<{ id: number; name: string }>(
    'SELECT id, name FROM application.map_layers ORDER BY id',
  );
  return rows;
}

export async function getAvailableOskariMapLayers(
  mapUrl: string,
  language: LanguageCode = 'fi',
): Promise<LocalizedSurveyMapLayer[]> {
  if (!mapUrl) {
    return [];
  }
  // Convert language code to Oskari's format
  const oskariLanguage = {
    fi: 'fi',
    en: 'en',
    sv: 'sv',
  }[language];

  // Separate query parameters and possible trailing slash
  const [baseUrl, queryParams] = mapUrl.split(/\/?\?/);
  try {
    const response: Response = await fetch(
      buildOskariAppSetupUrl(baseUrl, queryParams),
    );
    const responseJson = (await response.json()) as OskariConfiguration;
    const layers = responseJson.configuration?.mapfull?.conf?.layers?.map(
      ({ id, name, locale }) => ({
        id,
        // For user-created datasets, the name is inside the locale object
        name: locale?.[oskariLanguage]?.name ?? name ?? '<untitled layer>',
      }),
    );
    // For non-existent UUIDs the full layer path won't exist in the response object
    if (!layers) {
      throw new NotFoundError('Map not found');
    }
    return layers;
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      throw new NotFoundError('Map not found');
    }
    throw error;
  }
}

export async function getSurveyTargetSrid(
  survey: Pick<Survey, 'mapProvider' | 'mapUrl'>,
) {
  if (survey.mapProvider === 'openlayers') {
    return DEFAULT_SRID;
  }
  try {
    return await getOskariMapSrid(survey.mapUrl);
  } catch (error) {
    logger.error(
      `Failed to get Oskari map SRID: ${error.message}. Using default ${DEFAULT_SRID}.`,
    );
    return DEFAULT_SRID;
  }
}

export async function getOskariMapSrid(mapUrl: string) {
  const [baseUrl, queryParams] = mapUrl.split(/\/?\?/);
  try {
    const response: Response = await fetch(
      buildOskariAppSetupUrl(baseUrl, queryParams),
    );
    const responseJson = (await response.json()) as OskariConfiguration;
    const srsName =
      responseJson.configuration?.mapfull?.conf?.mapOptions?.srsName;
    if (!srsName) {
      throw new NotFoundError('Map not found');
    }
    const crs = Number(srsName.replace('EPSG:', ''));
    if (isNaN(crs)) {
      throw new Error(`Invalid srs name received from Oskari: ${crs}`);
    }
    return crs;
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      throw new NotFoundError('Map not found');
    }
    throw error;
  }
}
