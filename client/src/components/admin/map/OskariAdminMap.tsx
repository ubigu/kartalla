import { SurveyPage } from '@interfaces/survey';
import { Box } from '@mui/material';
import OskariMapStatusOverlay from '@src/components/map/OskariMapStatusOverlay';
import { useAdminMap } from '@src/stores/SurveyMapContext';
import {
  SurveyOskariMapProvider,
  useSurveyOskariMap,
} from '@src/stores/SurveyOskariMapContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useEffect, useRef } from 'react';

interface Props {
  url: string;
  page: SurveyPage;
  allowDrawing?: boolean;
}

export function OskariAdminMap(props: Props) {
  return (
    <SurveyOskariMapProvider>
      <AdminMapContent {...props} />
    </SurveyOskariMapProvider>
  );
}

function AdminMapContent({ url, page, allowDrawing = false }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const {
    initializeMap,
    mapError,
    provider,
    isReady: oskariIsReady,
  } = useSurveyOskariMap();
  const {
    setMapProvider,
    isMapReady,
    startDrawingDefaultView,
    drawDefaultView,
    setDefaultView,
    setVisibleLayers,
  } = useAdminMap();
  const { tr } = useTranslations();

  /**
   * Initialize RPC channel when iframe gets loaded
   */
  useEffect(() => {
    if (!iframeRef?.current) {
      return;
    }
    initializeMap(iframeRef.current, url);
  }, [iframeRef, url]);

  /**
   * Set the map provider in the shared context when Oskari becomes ready
   */
  useEffect(() => {
    setMapProvider(oskariIsReady ? provider : null);
  }, [oskariIsReady]);

  useEffect(() => {
    if (isMapReady) {
      setVisibleLayers(page.sidebar.mapLayers);
      setDefaultView(page.sidebar.defaultMapView);
      drawDefaultView();
      if (allowDrawing) startDrawingDefaultView();
    }
  }, [isMapReady]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <OskariMapStatusOverlay
        isMapReady={isMapReady}
        mapError={mapError}
        loadErrorText={tr.OskariMap.loadError}
      />
      <iframe
        ref={iframeRef}
        style={{
          opacity: isMapReady ? 1 : 0,
          border: 0,
          width: '100%',
          height: '100%',
          margin: '0 auto',
        }}
        src={url}
        allow="geolocation"
        allowFullScreen
        loading="lazy"
      />
    </Box>
  );
}
