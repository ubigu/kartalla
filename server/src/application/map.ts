import { LanguageCode, LocalizedSurveyMapLayer } from '@interfaces/survey';
import fetch, { Response } from 'node-fetch';
import { getDb } from '../database';
import { NotFoundError } from '../error';

export async function getOlMapLayers() {
  const rows = await getDb().manyOrNone<{ id: number; name: string }>(
    'SELECT id, name FROM application.map_layers ORDER BY id',
  );
  return rows;
}

export async function getAvailableMapLayers(
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
    se: 'sv',
  }[language];

  // Separate query parameters and possible trailing slash
  const [baseUrl, queryParams] = mapUrl.split(/\/?\?/);
  try {
    const response: Response = await fetch(
      `${baseUrl}/action?action_route=GetAppSetup&${queryParams}`,
    );
    const responseJson = (await response.json()) as {
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
          };
        };
      };
    };
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
