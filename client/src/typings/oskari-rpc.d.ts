/**
 * Partial type declarations for the oskari-rpc library.
 */
declare module 'oskari-rpc' {
  /**
   * Draw tools related requests
   */
  namespace DrawTools {
    /**
     * Start drawing request
     */
    export type StartDrawingRequest = (
      name: 'DrawTools.StartDrawingRequest',
      params: [
        id: string,
        shape: 'Point' | 'Circle' | 'Polygon' | 'Box' | 'Square' | 'LineString',
        options: {
          buffer?: number;
          style?: object;
          allowMultipleDrawing?: boolean | 'single' | 'multiGeom';
          drawControl?: boolean;
          modifyControl?: boolean;
          showMeasureOnMap?: boolean;
          selfIntersection?: boolean;
          geojson?: GeoJSON.GeoJSON;
        },
      ],
    ) => void;

    /**
     * Stop drawing request
     */
    export type StopDrawingRequest = (
      name: 'DrawTools.StopDrawingRequest',
      params: [id: string, clearCurrent?: boolean, supressEvent?: boolean],
    ) => void;
  }

  /**
   * MapModulePlugin related requests
   */
  namespace MapModulePlugin {
    /**
     * Map layer visibility request
     */
    export type MapLayerVisibilityRequest = (
      name: 'MapModulePlugin.MapLayerVisibilityRequest',
      params: [layerId: number, visibility: boolean],
    ) => void;
    /**
     * Add features to map request
     */
    export type AddFeaturesToMapRequest = (
      name: 'MapModulePlugin.AddFeaturesToMapRequest',
      params: [
        geoJson: GeoJSON.FeatureCollection,
        options: {
          layerId: string;
          clearPrevious: boolean;
          centerTo: boolean;
          cursor?: string;
          prio?: number;
          featureStyle?: FeatureStyle;
        },
      ],
    ) => void;

    /**
     * Zoom to provided features request
     */
    export type ZoomToFeaturesRequest = (
      name: 'MapModulePlugin.ZoomToFeaturesRequest',
      params: [
        options: {
          layer?: string[];
          maxZoomLevel?: number;
        },
        featureFilter: {
          [key: string]: string[];
        },
      ],
    ) => void;

    /**
     * Remove features from map request
     */
    export type RemoveFeaturesFromMapRequest = (
      name: 'MapModulePlugin.RemoveFeaturesFromMapRequest',
      params: [
        featureFilterKey: string,
        featureFilterValue: string | number,
        layerId: string,
      ],
    ) => void;

    /**
     * Add markers request
     */
    export type AddMarkerRequest = (
      name: 'MapModulePlugin.AddMarkerRequest',
      params: [
        marker: {
          x: number;
          y: number;
          shape: string | number;
          offsetX: number;
          offsetY: number;
          size: number;
        } & MarkerStyle,
        id: string,
      ],
    ) => void;

    /**
     * Remove markers request
     */
    export type RemoveMarkersRequest = (
      name: 'MapModulePlugin.RemoveMarkersRequest',
      params: number[],
    ) => void;
  }

  /**
   * InfoBox related requests
   */
  export namespace InfoBox {
    export interface ContentItem {
      html?: string;
      actions?: {
        name: string;
        type: 'link' | 'button';
        action: {
          [key: string]: string | number;
        };
      }[];
    }

    /**
     * Show InfoBox with given parameters
     */
    export type ShowInfoBoxRequest = (
      name: 'InfoBox.ShowInfoBoxRequest',
      params: [
        id: string,
        title: string,
        content: ContentItem[],
        position:
          | {
              lat: number;
              lon: number;
            }
          | {
              marker: string;
            },
        options: {
          hidePrevious?: boolean;
        },
      ],
    ) => void;

    /**
     * Hide InfoBox with given ID
     */
    export type HideInfoBoxRequest = (
      name: 'InfoBox.HideInfoBoxRequest',
      params: [id: string],
    ) => void;
  }

  /**
   *  Move map to given position
   */

  export type MapMoveRequest = (
    name: 'MapMoveRequest',
    params: [x: number, y: number, zoom?: number, options?: object],
  ) => void;

  /**
   * Drawing event handler
   */
  export type DrawingEventHandler = (payload: {
    geojson: GeoJSON.FeatureCollection<
      GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon
    > & {
      crs: string;
    };
    id: string;
    isFinished: boolean;
  }) => void;

  /**
   * Feature event handler
   */
  export type FeatureEventHandler = (payload: {
    operation: 'add' | 'remove' | 'click' | 'zoom' | 'error';
    features: {
      layerId: string;
      geojson: any;
    }[];
  }) => void;

  /**
   * Marker click event handler
   */
  export type MarkerClickEventHandler = (payload: { id: string }) => void;

  /**
   * Infobox action event handler
   */
  export type InfoboxActionEventHandler = (payload: {
    /**
     * Layer ID
     */
    id: string;
    /**
     * Action parameters
     */
    actionParams: any;
  }) => void;

  export type MapClickEventHandler = (payload: {
    lon: number;
    lat: number;
    x: number;
    y: number;
    ctrlKeyDown: boolean;
  }) => void;

  /**
   * Style for a feature
   */
  export interface FeatureStyle {
    text?: {
      labelProperty: string;
      labelText: string;
      font: string;
    };
    stroke?: {
      color: string;
      width: number;
      lineDash?: number[];
      lineCap?: 'dashed' | 'butt' | 'round';
    };
    fill?: {
      color: string;
    };
  }

  /**
   * Style for a marker
   */
  export interface MarkerStyle {
    shape: string | number;
    size: number;
    color?: string;
    msg?: string;
    font?: string;
  }

  /**
   * All Oskari events
   */
  namespace Event {
    /**
     * Oskari drawing event
     */
    export type DrawingEvent = (
      name: 'DrawingEvent',
      callback: DrawingEventHandler,
    ) => void;

    /**
     * Oskari feature event
     */
    export type FeatureEvent = (
      name: 'FeatureEvent',
      callback: FeatureEventHandler,
    ) => void;

    /**
     * Oskari marker click event
     */
    export type MarkerClickEvent = (
      name: 'MarkerClickEvent',
      callback: MarkerClickEventHandler,
    ) => void;

    /**
     * Oskari infobox action event
     */
    export type InfoboxActionEvent = (
      name: 'InfoboxActionEvent',
      callback: InfoboxActionEventHandler,
    ) => void;

    /**
     * Oskari map click event
     */
    export type MapClickedEvent = (
      name: 'MapClickedEvent',
      callback: MapClickEventHandler,
    ) => void;
  }

  export interface Channel {
    onReady: (callback: (info: ChannelInfo) => void) => void;
    log: (text: string) => void;
    getAllLayers: (callback: (layers: Layer[]) => void) => void;
    getSupportedEvents: (callback: (events: unknown[]) => void) => void;
    getSupportedRequests: (callback: (requests: unknown[]) => void) => void;
    getSupportedFunctions: (callback: (functions: unknown[]) => void) => void;
    getInfo: (callback: (info: any) => void) => void;
    getMapPosition: (callback: (position: any) => void) => void;
    /**
     * Post an Oskari request
     */
    postRequest: MapModulePlugin.MapLayerVisibilityRequest &
      DrawTools.StartDrawingRequest &
      DrawTools.StopDrawingRequest &
      MapModulePlugin.AddFeaturesToMapRequest &
      MapModulePlugin.ZoomToFeaturesRequest &
      MapModulePlugin.RemoveFeaturesFromMapRequest &
      MapModulePlugin.AddMarkerRequest &
      MapModulePlugin.RemoveMarkersRequest &
      InfoBox.ShowInfoBoxRequest &
      InfoBox.HideInfoBoxRequest &
      MapMoveRequest;
    /**
     * Handle an Oskari event
     */
    handleEvent: Event.MapClickedEvent &
      Event.DrawingEvent &
      Event.FeatureEvent &
      Event.MarkerClickEvent &
      Event.InfoboxActionEvent;

    /**
     * Unregister any registered event handler
     */
    unregisterEventHandler: (
      name: string,
      handler: (...args: any) => void,
    ) => void;
  }

  export interface ChannelInfo {
    /**
     *
     * Is the RPC client supported?
     */
    clientSupported: boolean;
    /**
     * Oskari version
     */
    version: string;
  }

  export interface Layer {
    /**
     * ID of the map layer
     */
    id: number;
    /**
     * Name of the map layer
     */
    name: string;
    /**
     * Is the layer visible?
     */
    visible: boolean;
  }

  export interface Synchronizer {
    synchronize: (state: unknown) => void;
    destroy: () => void;
  }

  export interface Handler {
    init: (channel: Channel) => void;
    synchronize: (channel: Channel, state: unknown) => void;
    destroy: () => void;
  }

  const OskariRPC: {
    connect: (
      iframeElement: HTMLIFrameElement,
      iframeDomain: string,
    ) => Channel;
    synchronizerFactory: (
      channel: Channel,
      handlers: Handler[],
    ) => Synchronizer;
    VERSION: string;
  };
  export default OskariRPC;
}
