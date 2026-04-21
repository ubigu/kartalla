// @ts-strict-ignore
import { MapPublication } from '@interfaces/mapPublications';
import {
  Autocomplete,
  Box,
  FormLabel,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import { getMapPublications } from '@src/controllers/MapPublicationsController';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { getLayerName } from '@src/utils/oskariHelpers';
import { useEffect, useState } from 'react';
import { loadingPulse } from '../core/styles';

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
        display: 'flex',
        flexDirection: 'column',
        gap: '36px',
        maxWidth: 'min(55em, 70%)',
        ...(activeSurveyLoading && loadingPulse),
      }}
    >
      <Typography variant="mainHeader" component={'h1'}>
        {tr.EditSurvey.mapData}
      </Typography>
      {mapPublicationsLoading ? (
        <Skeleton variant="rectangular" height={40} />
      ) : (
        <Autocomplete
          options={mapPublications}
          getOptionLabel={(pub) => pub.name}
          value={
            mapPublications.find((pub) => pub.url === activeSurvey.mapUrl) ??
            null
          }
          onChange={(_, value) => {
            editSurvey({
              ...activeSurvey,
              mapUrl: value?.url ?? '',
            });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              label={tr.EditSurveyInfo.mapPublicationSelect}
              helperText={tr.EditSurveyInfo.mapPublicationSelectHelperText}
            />
          )}
        />
      )}
      <TextField
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
          <FormLabel>{tr.EditSurveyInfo.availableMapLayers}</FormLabel>
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
