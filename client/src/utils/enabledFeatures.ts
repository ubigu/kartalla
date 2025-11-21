export type Feature = 'budgetingQuestion' | 'geoBudgetingQuestion';

function parseEnabledFeatures() {
  const featuresJson = ENABLED_FEATURES;
  const features = new Set<Feature>();
  if (!featuresJson || typeof featuresJson !== 'string') {
    return features;
  }
  try {
    const featuresArray = JSON.parse(featuresJson);
    if (Array.isArray(featuresArray)) {
      featuresArray.forEach((feature) => features.add(feature));
    }
  } catch (error) {
    console.error(error);
  }

  return features;
}

const enabledFeatures = parseEnabledFeatures();

export function isFeatureSupported(feature: Feature) {
  return enabledFeatures.has(feature);
}
