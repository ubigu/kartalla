// @ts-strict-ignore
import { Check, Edit } from '@mui/icons-material';
import { Box, Fab, Tooltip } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { OlMap } from '@src/components/map/openlayers/OlMap';
import {
  SurveyOlMapProvider,
  useSurveyOlMap,
} from '@src/stores/SurveyOlMapContext';
import { useSurveyMap } from '@src/stores/SurveyMapContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useEffect, useState } from 'react';

interface Props {
  layers: (number | string)[];
  onAnswer?: () => void;
  defaultMapView?: GeoJSON.FeatureCollection;
  pageId: number;
}

interface MapPosition {
  centerX: number;
  centerY: number;
  zoom?: number;
}

export default function SurveyOlMap(props: Props) {
  return (
    <SurveyOlMapProvider>
      <SurveyOlMapContent {...props} />
    </SurveyOlMapProvider>
  );
}

function SurveyOlMapContent(props: Props) {
  const [mapInitialPos, setMapInitialPos] = useState<MapPosition | null>(null);
  const { setMap, provider, isReady: olIsReady } = useSurveyOlMap();
  const {
    setMapProvider,
    isMapReady,
    initializeMap,
    modifying,
    answerGeometries,
    startModifying,
    stopModifying,
    drawing,
    centerToDefaultView,
    getMapPosition,
    moveMapTo,
  } = useSurveyMap();

  const { tr } = useTranslations();

  useEffect(() => {
    setMapProvider(olIsReady ? provider : null);
  }, [olIsReady]);

  useEffect(() => {
    if (!isMapReady) return;
    initializeMap();
  }, [isMapReady]);

  useEffect(() => {
    if (!isMapReady) return;
    if (!mapInitialPos) {
      getMapPosition().then((pos) => {
        setMapInitialPos(pos);
      });
    }

    if (props.defaultMapView) {
      centerToDefaultView(props.defaultMapView);
    } else if (mapInitialPos) {
      moveMapTo(
        mapInitialPos.centerX,
        mapInitialPos.centerY,
        mapInitialPos.zoom,
      );
    }
  }, [isMapReady, props.defaultMapView, props.pageId]);

  return (
    <>
      <p style={visuallyHidden}>{tr.SurveyMap.browsingInstructions}</p>
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <OlMap onMapReady={setMap} />
      </Box>
      {!drawing && !modifying && answerGeometries?.features.length > 0 && (
        <Tooltip title={tr.SurveyMap.editGeometries}>
          <Fab
            style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}
            variant="extended"
            color="primary"
            aria-label={tr.SurveyMap.editGeometries}
            onClick={() => {
              startModifying();
            }}
          >
            <Edit sx={{ mr: 1 }} /> {tr.commands.edit}
          </Fab>
        </Tooltip>
      )}
      {!drawing && modifying && (
        <Tooltip title={tr.SurveyMap.finishEditingGeometries}>
          <Fab
            style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}
            variant="extended"
            color="primary"
            aria-label={tr.SurveyMap.finishEditingGeometries}
            onClick={() => {
              stopModifying();
            }}
          >
            <Check sx={{ mr: 1 }} /> {tr.commands.finish}
          </Fab>
        </Tooltip>
      )}
    </>
  );
}
