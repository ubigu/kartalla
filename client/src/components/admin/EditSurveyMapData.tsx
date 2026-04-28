// @ts-strict-ignore
import { MapPublication } from '@interfaces/mapPublications';
import { Box, Skeleton, Typography } from '@mui/material';
import { getMapPublications } from '@src/controllers/MapPublicationsController';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { getLayerName } from '@src/utils/oskariHelpers';
import { useEffect, useState } from 'react';
import { Combobox_WIP } from '../core/Combobox';
import { CoreInput } from '../core/Input';
import { loadingPulse } from '../core/styles';
import { editPageContainerSx } from './EditSurvey';

export default function EditSurveyMapData() {
  const [mapPublications, setMapPublications] = useState<MapPublication[]>([]);
  const [mapPublicationsLoading, setMapPublicationsLoading] = useState(true);

  const {
    activeSurvey,
    activeSurveyLoading,
    editSurvey,
    validationErrors,
    availableMapLayers,
    availableMapLayersLoading,
  } = useSurvey();
  const { tr, surveyLanguage } = useTranslations();

  useEffect(() => {
    async function fetchMapPublications() {
      try {
        const publications = await getMapPublications();
        setMapPublications(publications);
      } catch (error) {
        // non-critical — fall back to manual URL entry
      } finally {
        setMapPublicationsLoading(false);
      }
    }
    fetchMapPublications();
  }, []);

  return (
    <Box
      sx={{
        ...editPageContainerSx,
        ...(activeSurveyLoading && loadingPulse),
      }}
    >
      <Typography variant="mainHeader" component={'h1'}>
        {tr.EditSurvey.mapData}
      </Typography>
      {mapPublicationsLoading ? (
        <Skeleton variant="rectangular" height={40} />
      ) : (
        <Combobox_WIP
          options={mapPublications.map((pub) => ({
            value: pub.url,
            label: pub.name,
          }))}
          value={activeSurvey.mapUrl}
          onChange={(value) => {
            editSurvey({
              ...activeSurvey,
              mapUrl: value,
            });
          }}
          label={tr.EditSurveyInfo.mapPublicationSelect}
          helperText={tr.EditSurveyInfo.mapPublicationSelectHelperText}
        />
      )}
      <CoreInput
        error={validationErrors.includes('survey.mapUrl')}
        label={tr.EditSurveyInfo.mapUrl}
        value={activeSurvey.mapUrl ?? ''}
        onChange={(event) => {
          editSurvey({
            ...activeSurvey,
            mapUrl: event.target.value,
          });
        }}
        helperText={
          validationErrors.includes('survey.mapUrl') &&
          tr.EditSurveyInfo.mapUrlError
        }
      />
      {availableMapLayersLoading && (
        <Skeleton variant="rectangular" height={200} width="100%" />
      )}
      {!availableMapLayersLoading && availableMapLayers?.length > 0 && (
        <div>
          <Typography>{tr.EditSurveyInfo.availableMapLayers}</Typography>
          <ul>
            {availableMapLayers.map((layer) => (
              <li key={layer.id}>
                {getLayerName(
                  layer,
                  surveyLanguage,
                  tr.EditSurveyInfo.layerNameFallback,
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Box>
  );
}
