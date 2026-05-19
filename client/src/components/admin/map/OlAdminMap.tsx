import { SurveyPage } from '@interfaces/survey';
import {
  SurveyOlMapProvider,
  useSurveyOlMap,
} from '@src/stores/SurveyOlMapContext';
import { useAdminMap } from '@src/stores/SurveyMapContext';
import { useEffect } from 'react';
import { OlMap } from '@src/components/map/openlayers/OlMap';

interface Props {
  page: SurveyPage;
  allowDrawing?: boolean;
}

export function OlAdminMap(props: Props) {
  return (
    <SurveyOlMapProvider>
      <OlAdminMapContent {...props} />
    </SurveyOlMapProvider>
  );
}

function OlAdminMapContent({ page, allowDrawing = false }: Props) {
  const { setMap, provider, isReady } = useSurveyOlMap();
  const {
    setMapProvider,
    isMapReady,
    startDrawingDefaultView,
    drawDefaultView,
    setDefaultView,
  } = useAdminMap();

  useEffect(() => {
    setMapProvider(isReady ? provider : null);
  }, [isReady]);

  useEffect(() => {
    if (isMapReady) {
      setDefaultView(page.sidebar.defaultMapView);
      drawDefaultView(page.sidebar.defaultMapView);
      if (allowDrawing) startDrawingDefaultView();
    }
  }, [isMapReady]);

  return <OlMap onMapReady={setMap} />;
}
