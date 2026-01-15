import { Feature, FeatureCollection, Point } from 'geojson';
import OskariRPC, {
  Channel,
  DrawingEventHandler,
  FeatureEventHandler,
  FeatureStyle,
  MarkerClickEventHandler,
  MarkerStyle,
} from 'oskari-rpc';
import { useEffect, useState } from 'react';
import { isPointFeature } from './geometry';
import { useCurrent } from './useCurrent';

// Layer ID for answer geometries
const featureLayer = 'answers';

// Drawing ID for modifying existing geometries
// const modifyEventId = 'modify';

// Default feature style
const defaultFeatureStyle: FeatureStyle = {
  stroke: {
    color: '#000000',
    width: 10,
  },
  fill: {
    color: 'rgba(0,0,0,0.3)',
  },
};

const defaultMarkerStyle: MarkerStyle = {
  shape: null,
  size: null,
  font: 'bold 14px Verdana',
};

function getOrigin(url: string) {
  const anchorElement = document.createElement('a');
  anchorElement.href = url;
  return `${anchorElement.protocol}//${anchorElement.hostname}${
    anchorElement.port ? `:${anchorElement.port}` : ''
  }`;
}

export function useOskari() {
  const [rpcChannel, setRpcChannel] = useState<Channel | null>(null);
  const [featureClickEventHandler, setFeatureClickEventHandler] =
    useState<FeatureEventHandler | null>(null);
  const [markerClickEventHandler, setMarkerClickEventHandler] =
    useState<MarkerClickEventHandler | null>(null);
  const [drawingEventHandler, setDrawingEventHandler] =
    useState<DrawingEventHandler | null>(null);
  const [allLayers, setAllLayers] = useState<number[] | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [, setDefaultMapView] = useState<FeatureCollection>(null);
  const [oskariVersion, setOskariVersion] = useState(null);

  // Make current features available inside callbacks
  const getCurrentFeatures = useCurrent(features);

  /**
   * Initializes the map to fiven iframe element and Oskari map URL
   * @param iframe Iframe element
   * @param url Oskari map URL
   * @returns
   */
  async function initializeMap(iframe: HTMLIFrameElement, url: string) {
    if (!iframe || !url) {
      return;
    }
    // Reset RPC channel (i.e. make map "not ready")
    setRpcChannel(null);
    setAllLayers(null);
    const channel = OskariRPC.connect(iframe, getOrigin(url));

    // Wait for the channel to get ready before proceeding
    await new Promise<void>((resolve) => {
      channel.onReady(() => {
        setRpcChannel(channel);
        resolve();
      });
    });

    // Get all layers and persist them into the state
    const allLayers = await new Promise<number[]>((resolve) => {
      channel.getAllLayers((layers) => {
        resolve(layers.map((layer) => layer.id));
      });
    });

    setAllLayers(allLayers);
  }

  /**
   * Set feature click handler
   * @param onFeatureClick Handler
   */
  function setFeatureClickHandler(onFeatureClick: (feature: Feature) => void) {
    // Remove previous feature event handler
    if (featureClickEventHandler) {
      rpcChannel.unregisterEventHandler(
        'FeatureEvent',
        featureClickEventHandler,
      );
      setFeatureClickEventHandler(null);
    }

    const featureHandler: FeatureEventHandler = (event) => {
      if (event.operation !== 'click') {
        return;
      }
      // There should only be one feature collection
      const featureCollection: GeoJSON.FeatureCollection =
        event.features[0].geojson;
      // There should only be one feature
      const feature = featureCollection.features[0];
      onFeatureClick(feature);
    };
    rpcChannel.handleEvent('FeatureEvent', featureHandler);
    setFeatureClickEventHandler(() => featureHandler);

    // Remove previous marker click event handler
    if (markerClickEventHandler) {
      rpcChannel.unregisterEventHandler(
        'MarkerClickEvent',
        markerClickEventHandler,
      );
      setMarkerClickEventHandler(null);
    }

    const markerHandler: MarkerClickEventHandler = (event) => {
      const feature = getCurrentFeatures().find(
        (feature) => feature.id === event.id,
      );
      if (!feature) {
        return;
      }
      onFeatureClick(feature);
    };
    rpcChannel.handleEvent('MarkerClickEvent', markerHandler);
    setMarkerClickEventHandler(() => markerHandler);
  }

  function startDrawingRequest() {
    rpcChannel.postRequest('DrawTools.StartDrawingRequest', [
      'DefaultViewSelection',
      'Square',
      { allowMultipleDrawing: 'single' },
    ]);

    if (drawingEventHandler) {
      rpcChannel.unregisterEventHandler('DrawingEvent', drawingEventHandler);
      setDrawingEventHandler(null);
    }

    const drawingHandler: DrawingEventHandler = (event) => {
      if (event.id === 'DefaultViewSelection' && event.isFinished) {
        setDefaultMapView(event.geojson);
      }
    };
    rpcChannel.handleEvent('DrawingEvent', drawingHandler);
    setDrawingEventHandler(() => drawingHandler);
  }

  /**
   * Clear all features on the map
   */
  function clearFeatures() {
    rpcChannel.postRequest('MapModulePlugin.RemoveFeaturesFromMapRequest', [
      null,
      null,
      featureLayer,
    ]);
    rpcChannel.postRequest('MapModulePlugin.RemoveMarkersRequest', []);
    setFeatures([]);
  }

  /**
   * Draw features with given style function on the map
   * @param features Features
   * @param getFeatureStyle Style function
   * @param getMarkerStyle Marker style function (used for showing point features)
   */
  function drawFeatures(
    features: Feature[],
    getFeatureStyle?: (
      feature: Feature,
      isPrimaryStyle: boolean,
    ) => FeatureStyle,
    getMarkerStyle?: (
      feature: Feature<Point>,
      isPrimaryStyle: boolean,
      withMessage: boolean,
    ) => MarkerStyle,
  ) {
    // Clear previous features
    clearFeatures();
    // Add current features one by one to get the correct styles
    features.forEach((feature) => {
      // Answers to first question should be styled differently
      const isPrimaryStyle =
        feature.properties.question.id === features[0].properties?.question?.id;
      if (isPointFeature(feature)) {
        const style =
          getMarkerStyle?.(feature, isPrimaryStyle, true) ?? defaultMarkerStyle;
        rpcChannel.postRequest('MapModulePlugin.AddMarkerRequest', [
          {
            x: (feature.geometry as any).coordinates[0],
            y: (feature.geometry as any).coordinates[1],
            offsetX: 0,
            offsetY: 0,
            ...style,
          },
          String(feature.id) +
            (feature.properties.selected ? '_selection' : ''),
        ]);
      } else {
        const style: FeatureStyle =
          getFeatureStyle?.(feature, isPrimaryStyle) ?? defaultFeatureStyle;
        rpcChannel.postRequest('MapModulePlugin.AddFeaturesToMapRequest', [
          {
            type: 'FeatureCollection',
            features: [feature],
          },
          {
            layerId: featureLayer,
            centerTo: false,
            clearPrevious: false,
            cursor: 'pointer',
            featureStyle: style,
          },
        ]);
      }
    });

    setFeatures([...features]);
  }

  /**
   * Zoom to features on the map
   */
  function zoomToFeatures() {
    rpcChannel.postRequest('MapModulePlugin.ZoomToFeaturesRequest', [
      { layer: [featureLayer] },
      {},
    ]);
  }

  /**
   * Set visible layers
   * @param visibleLayers Visible layer IDs
   */
  function setVisibleLayers(visibleLayers: (number | string)[]) {
    allLayers.forEach((layerId) => {
      // Update visibility for each layer - only show it if current page has that layer visible
      rpcChannel.postRequest('MapModulePlugin.MapLayerVisibilityRequest', [
        layerId,
        visibleLayers.includes(layerId),
      ]);
    });
  }

  useEffect(() => {
    if (!rpcChannel || oskariVersion) return;
    rpcChannel?.getInfo((oskariInfo) => {
      const oskariVersion = Number(oskariInfo.version.split('.').join(''));
      setOskariVersion(oskariVersion);
    });
    return () => setRpcChannel(null);
  }, [rpcChannel]);

  return {
    initializeMap,
    isMapReady: Boolean(rpcChannel) && Boolean(allLayers),
    setFeatureClickHandler,
    clearFeatures,
    drawFeatures,
    zoomToFeatures,
    setVisibleLayers,
    startDrawingRequest,
    oskariVersion,
  };
}
