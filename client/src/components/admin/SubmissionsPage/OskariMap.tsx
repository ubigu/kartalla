import { useSurveyMap } from '@src/stores/SurveyMapContext';
import { useOskari } from '@src/utils/useOskari';
import { Feature, Geometry } from 'geojson';
import { FeatureStyle, MarkerStyle } from 'oskari-rpc';
import parseCSSColor from 'parse-css-color';
import React, { useEffect, useMemo, useRef } from 'react';
import { AnswerSelection } from './AnswersList';
import { useTranslations } from '@src/stores/TranslationContext';

interface Props {
  url: string;
  layers?: number[];
  features?: Feature[];
  onFeatureClick?: (feature: Feature) => void;
  selectedAnswer?: AnswerSelection;
}

export default function OskariMap({
  url,
  layers,
  features,
  onFeatureClick,
  selectedAnswer,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const {
    initializeMap,
    setFeatureClickHandler,
    drawFeatures,
    isMapReady,
    setVisibleLayers,
    oskariVersion,
  } = useOskari();
  const { surveyLanguage } = useTranslations();
  const { mapFeatureColorScheme } = useSurveyMap();

  // Default feature style
  const defaultFeatureStyles = useMemo(() => {
    return [
      {
        stroke: {
          color: mapFeatureColorScheme.primaryColor,
          width: 6,
        },
        fill: {
          color: mapFeatureColorScheme.primaryFillColor,
        },
      },
      {
        stroke: {
          color: mapFeatureColorScheme.secondaryColor,
          width: 6,
        },
        fill: {
          color: mapFeatureColorScheme.secondaryFillColor,
        },
      },
    ];
  }, []);

  function getFeatureStyle(
    feature: Feature,
    isPrimaryStyle: boolean,
  ): FeatureStyle {
    const selectionType =
      feature.geometry.type === 'Polygon'
        ? 'area'
        : feature.geometry.type === 'LineString'
        ? 'line'
        : 'point';
    const question = feature.properties.question;

    // Use default style for points
    if (selectionType === 'point') {
      return isPrimaryStyle ? defaultFeatureStyles[0] : defaultFeatureStyles[1];
    }
    // Get feature style from question
    const style = question.featureStyles?.[selectionType];
    // If no style is defined, use default
    if (!style) {
      return isPrimaryStyle ? defaultFeatureStyles[0] : defaultFeatureStyles[1];
    }
    // Parse & calculate fill color with a fixed opacity from the stroke color
    const parsedStrokeColor = parseCSSColor(style.strokeColor);
    const fillColor = parsedStrokeColor
      ? `rgba(${parsedStrokeColor.values.join(',')}, 0.3)`
      : isPrimaryStyle
      ? defaultFeatureStyles[0].fill.color
      : defaultFeatureStyles[1].fill.color;
    return {
      stroke: {
        color:
          style.strokeColor || isPrimaryStyle
            ? defaultFeatureStyles[0].stroke.color
            : defaultFeatureStyles[1].stroke.color,
        width: 5,
        lineDash:
          style.strokeStyle === 'dashed'
            ? [30, 10]
            : style.strokeStyle === 'dotted'
            ? [0, 14]
            : null,
        lineCap: style.strokeStyle === 'dashed' ? 'butt' : 'round',
      },
      fill: {
        color: fillColor,
      },
    };
  }

  /** Helper function to determine if feature is for follow-up section.
   * If feature question has follow-up sections the feature is for one of these questions.
   * This is because map questions can't have follow-up questions.
   * */
  function featureIsForFollowUpSection(
    feature: Feature<
      Geometry,
      {
        [name: string]: any;
      }
    >,
  ) {
    return feature.properties.question?.followUpSections?.length > 0;
  }

  function featureIsBudgetMapQuestion(feature: Feature) {
    return feature.properties.question?.type === 'budget-map';
  }

  function getMarkerStyle(
    feature: Feature,
    isPrimaryStyle: boolean,
    withMessage: boolean = true,
  ): MarkerStyle {
    const customIcon: string =
      feature.properties.question?.featureStyles?.point?.markerIcon;

    const style = {
      shape: customIcon ?? (isPrimaryStyle ? 5 : 2),
      size: customIcon && oskariVersion >= 270 && oskariVersion < 290 ? 64 : 6,
      color: isPrimaryStyle
        ? mapFeatureColorScheme.primaryColor
        : mapFeatureColorScheme.secondaryColor,
    };
    if (withMessage) {
      return {
        ...style,
        msg: `${feature.properties.submissionId}${
          featureIsForFollowUpSection(feature)
            ? `-${feature.properties.index + 1}`
            : ''
        } ${
          featureIsBudgetMapQuestion(feature)
            ? `(${feature.properties?.selectedOption?.text?.[surveyLanguage]})`
            : ''
        }`,
      };
    }

    return style;
  }

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
   * Assign click handlers when the map has been initialized
   */
  useEffect(() => {
    if (!isMapReady) {
      return;
    }

    setFeatureClickHandler(onFeatureClick);
  }, [isMapReady]);

  /**
   * Update features and markers onto the map
   */
  useEffect(() => {
    if (!isMapReady || !features) {
      return;
    }

    drawFeatures(features, getFeatureStyle, getMarkerStyle);
  }, [features, selectedAnswer, isMapReady, oskariVersion, surveyLanguage]);

  /**
   * Update visible layers onto the map
   */
  useEffect(() => {
    if (!isMapReady || !layers) {
      return;
    }
    setVisibleLayers(layers);
  }, [layers, isMapReady]);

  return (
    <iframe
      ref={iframeRef}
      style={{
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
  );
}
