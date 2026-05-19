import {
  MapQuestionSelectionType,
  SurveyMapQuestion,
} from '@interfaces/survey';
import { colors } from '@src/themes/colors';
import { Circle as CircleStyle, Fill, Icon, Stroke, Style } from 'ol/style';
import type { FlatStyleLike } from 'ol/style/flat';
import parseCSSColor from 'parse-css-color';

const FEATURE_STROKE_WIDTH = 4;
const POINT_MARKER_RADIUS = 6;
const POINT_MARKER_BORDER_WIDTH = 1.5;
const ADMIN_VIEW_STROKE_WIDTH = 2;
const MARKER_ICON_DISPLAY_SIZE = 32;

const DEFAULT_FEATURE_COLOR = colors.harmaa;
const DEFAULT_FEATURE_FILL_COLOR = `${colors.harmaa}4d`;
const POINT_MARKER_BORDER_COLOR = '#ffffff';
const ADMIN_VIEW_STROKE_COLOR = '#ff4747';
const TRANSPARENT = 'rgba(0,0,0,0)';

const DASHED_LINE_DASH = [30, 10];
const DOTTED_LINE_DASH = [0, 14];
const ADMIN_VIEW_STROKE_DASH = [6];
const LINE_DASH_BY_STROKE_STYLE: Partial<Record<string, number[]>> = {
  dashed: DASHED_LINE_DASH,
  dotted: DOTTED_LINE_DASH,
};

const FEATURE_FILL_OPACITY = 0.3;

const DEFAULT_POINT_STYLE = new Style({
  image: new CircleStyle({
    radius: POINT_MARKER_RADIUS,
    fill: new Fill({ color: DEFAULT_FEATURE_COLOR }),
    stroke: new Stroke({
      color: POINT_MARKER_BORDER_COLOR,
      width: POINT_MARKER_BORDER_WIDTH,
    }),
  }),
});

function resolveMarkerIcon(markerIcon: string | undefined): {
  iconSrc: string;
  iconScale: number;
} {
  if (!markerIcon) return { iconSrc: '', iconScale: 1 };
  const dpr = window.devicePixelRatio ?? 1;
  return {
    iconSrc: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(resizeSvg(markerIcon, MARKER_ICON_DISPLAY_SIZE * dpr))}`,
    iconScale: 1 / dpr,
  };
}

function computeFillColor(strokeColor: string, fallback: string): string {
  const parsed = parseCSSColor(strokeColor);
  return parsed
    ? `rgba(${parsed.values.join(',')}, ${FEATURE_FILL_OPACITY})`
    : fallback;
}

// Replaces width/height in an SVG string to force rasterization at a specific pixel size.
// Used for HiDPI rendering: render at displaySize×dpr, then scale back by 1/dpr.
function resizeSvg(svg: string, px: number): string {
  return svg
    .replace(/(\swidth=["'])[0-9.]+/, `$1${px}`)
    .replace(/(\sheight=["'])[0-9.]+/, `$1${px}`);
}

export function createVertexStyle(color = DEFAULT_FEATURE_COLOR): Style {
  if (color === DEFAULT_FEATURE_COLOR) return DEFAULT_POINT_STYLE;
  return new Style({
    image: new CircleStyle({
      radius: POINT_MARKER_RADIUS,
      fill: new Fill({ color }),
      stroke: new Stroke({
        color: POINT_MARKER_BORDER_COLOR,
        width: POINT_MARKER_BORDER_WIDTH,
      }),
    }),
  });
}

export const adminViewStyle = new Style({
  fill: new Fill({ color: TRANSPARENT }),
  stroke: new Stroke({
    color: ADMIN_VIEW_STROKE_COLOR,
    lineDash: ADMIN_VIEW_STROKE_DASH,
    width: ADMIN_VIEW_STROKE_WIDTH,
  }),
  image: new CircleStyle({
    radius: POINT_MARKER_RADIUS,
    fill: new Fill({ color: ADMIN_VIEW_STROKE_COLOR }),
    stroke: new Stroke({
      color: POINT_MARKER_BORDER_COLOR,
      width: POINT_MARKER_BORDER_WIDTH,
    }),
  }),
});

export const webGLAnswerFlatStyle: FlatStyleLike = [
  {
    filter: ['==', ['get', 'strokeStyle'], 'dashed'],
    style: {
      'stroke-color': ['get', 'strokeColor'],
      'stroke-width': FEATURE_STROKE_WIDTH,
      'stroke-line-dash': DASHED_LINE_DASH,
      'fill-color': ['get', 'fillColor'],
    },
  },
  {
    filter: ['==', ['get', 'strokeStyle'], 'dotted'],
    style: {
      'stroke-color': ['get', 'strokeColor'],
      'stroke-width': FEATURE_STROKE_WIDTH,
      'stroke-line-dash': DOTTED_LINE_DASH,
      'stroke-line-cap': 'round',
      'fill-color': ['get', 'fillColor'],
    },
  },
  {
    filter: ['==', ['get', 'strokeStyle'], ''],
    style: {
      'stroke-color': ['get', 'strokeColor'],
      'stroke-width': FEATURE_STROKE_WIDTH,
      'fill-color': ['get', 'fillColor'],
      'circle-radius': POINT_MARKER_RADIUS,
      'circle-fill-color': ['get', 'strokeColor'],
      'circle-stroke-color': POINT_MARKER_BORDER_COLOR,
      'circle-stroke-width': POINT_MARKER_BORDER_WIDTH,
    },
  },
];

export function getWebGLFeatureStyleProps(
  geomType: string,
  question?: SurveyMapQuestion,
  targetIcon?: string,
): {
  strokeColor: string;
  fillColor: string;
  strokeStyle: string;
  iconSrc: string;
  iconScale: number;
} {
  const isPoint = geomType === 'Point' || geomType === 'MultiPoint';
  const isLine = geomType === 'LineString' || geomType === 'MultiLineString';

  if (isPoint) {
    const markerIcon = targetIcon ?? question?.featureStyles?.point?.markerIcon;
    const { iconSrc, iconScale } = resolveMarkerIcon(markerIcon);
    return {
      strokeColor: DEFAULT_FEATURE_COLOR,
      fillColor: TRANSPARENT,
      strokeStyle: '',
      iconSrc,
      iconScale,
    };
  }

  const type = isLine ? 'line' : 'area';
  const styleConfig = question?.featureStyles?.[type];
  const strokeColor = styleConfig?.strokeColor || DEFAULT_FEATURE_COLOR;
  const fillColor = isLine
    ? TRANSPARENT
    : computeFillColor(strokeColor, TRANSPARENT);
  const strokeStyle = styleConfig?.strokeStyle ?? '';
  return { strokeColor, fillColor, strokeStyle, iconSrc: '', iconScale: 1 };
}

export function createSurveyFeatureStyle(
  type?: MapQuestionSelectionType,
  question?: SurveyMapQuestion & { targetIcon?: string },
): Style {
  if (type === 'point') {
    const markerIcon =
      question?.targetIcon ?? question?.featureStyles?.point?.markerIcon;
    const { iconSrc, iconScale } = resolveMarkerIcon(markerIcon);
    if (!iconSrc) return DEFAULT_POINT_STYLE;
    return new Style({ image: new Icon({ src: iconSrc, scale: iconScale }) });
  }

  const styleConfig = question?.featureStyles?.[type ?? 'line'];
  const strokeColor = styleConfig?.strokeColor || DEFAULT_FEATURE_COLOR;
  const fillColor = computeFillColor(strokeColor, DEFAULT_FEATURE_FILL_COLOR);
  const lineDash = LINE_DASH_BY_STROKE_STYLE[styleConfig?.strokeStyle ?? ''];

  return new Style({
    stroke: new Stroke({
      color: strokeColor,
      width: FEATURE_STROKE_WIDTH,
      lineDash,
    }),
    fill: new Fill({ color: fillColor }),
  });
}
