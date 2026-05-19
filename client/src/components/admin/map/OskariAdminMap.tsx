import { SurveyPage } from '@interfaces/survey';
import { Box, CircularProgress } from '@mui/material';
import {
  SurveyOskariMapProvider,
  useSurveyOskariMap,
} from '@src/stores/SurveyOskariMapContext';
import { useAdminMap } from '@src/stores/SurveyMapContext';
import OskariRPC from 'oskari-rpc';
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
    setRpcChannel,
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

  /**
   * More crossbrowser-safe alternative to detecting origin from URL
   * (compared to URL.origin, with only ~80% global support at the moment of writing this)
   * @param url URL
   * @returns Origin of the URL
   */
  function getOrigin(url: string) {
    const anchorElement = document.createElement('a');
    anchorElement.href = url;
    return `${anchorElement.protocol}//${anchorElement.hostname}${
      anchorElement.port ? `:${anchorElement.port}` : ''
    }`;
  }

  /**
   * Initialize RPC channel when iframe gets loaded
   */
  useEffect(() => {
    if (!iframeRef?.current) {
      return;
    }
    setRpcChannel(null);
    const channel = OskariRPC.connect(iframeRef.current, getOrigin(url));
    channel.onReady(() => {
      setRpcChannel(channel);
    });
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
      {!isMapReady && (
        <CircularProgress
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-20px',
            marginLeft: '-20px',
            zIndex: 1,
          }}
        />
      )}
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
