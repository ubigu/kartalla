// @ts-strict-ignore
import { Check, Edit } from '@mui/icons-material';
import { Box, Fab, Tooltip } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import OskariMapStatusOverlay from '@src/components/map/OskariMapStatusOverlay';
import { useSurveyMap } from '@src/stores/SurveyMapContext';
import {
  SurveyOskariMapProvider,
  useSurveyOskariMap,
} from '@src/stores/SurveyOskariMapContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useEffect, useRef, useState } from 'react';

interface Props {
  url: string;
  layers: (number | string)[];
  onAnswer?: () => void;
  defaultMapView?: GeoJSON.FeatureCollection;
  pageId: number;
}

interface MapPosition {
  centerX: number;
  centerY: number;
  zoom?: number;
  options?: object;
}

export default function SurveyOskariMap(props: Props) {
  return (
    <SurveyOskariMapProvider>
      <SurveyOskariMapContent {...props} />
    </SurveyOskariMapProvider>
  );
}

function SurveyOskariMapContent(props: Props) {
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapInitialPos, setMapiInitialPos] = useState<MapPosition | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const {
    initializeMap: initializeOskariMap,
    mapError,
    provider,
    isReady: oskariIsReady,
  } = useSurveyOskariMap();
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

  /**
   * Initialize RPC channel when iframe gets loaded
   */
  useEffect(() => {
    if (!iframeRef?.current) {
      return;
    }
    initializeOskariMap(iframeRef.current, props.url);
  }, [iframeRef, props.url]);

  /**
   * Set the map provider in the shared context when Oskari becomes ready
   */
  useEffect(() => {
    setMapProvider(oskariIsReady ? provider : null);
  }, [oskariIsReady]);

  /**
   * Initialize map only once when it becomes ready
   */
  useEffect(() => {
    if (isMapReady) {
      initializeMap();
      setMapInitialized(true);
    }
    return () => {
      setMapInitialized(false);
    };
  }, [isMapReady]);

  useEffect(() => {
    if (!mapInitialized || !isMapReady) return;
    if (!mapInitialPos) {
      getMapPosition().then((pos) => {
        setMapiInitialPos(pos);
      });
    }

    if (props.defaultMapView) {
      centerToDefaultView(props.defaultMapView, {
        fill: { color: '#00000000' },
        stroke: { color: '#00000000' },
      });
    } else if (mapInitialPos) {
      moveMapTo(
        mapInitialPos.centerX,
        mapInitialPos.centerY,
        mapInitialPos.zoom,
      );
    }
  }, [props.defaultMapView, mapInitialized, props.pageId]);

  return (
    props.url && (
      <>
        <p style={visuallyHidden}>{tr.SurveyMap.browsingInstructions}</p>
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          <OskariMapStatusOverlay
            isMapReady={isMapReady}
            mapError={mapError}
            loadErrorText={tr.SurveyMap.loadError}
          />
          <iframe
            ref={iframeRef}
            title={tr.SurveyMap.iFrameTitle}
            aria-describedby="mapEmbedInstructions"
            style={{
              opacity: isMapReady ? 1 : 0,
              border: 0,
              width: '100%',
              height: '100%',
            }}
            src={props.url}
            allow="geolocation"
            allowFullScreen
          />
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
    )
  );
}
