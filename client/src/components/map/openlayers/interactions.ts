import { Interaction } from 'ol/interaction';
import Draw, { type Options as DrawOptions } from 'ol/interaction/Draw';
import Modify, { type Options as ModifyOptions } from 'ol/interaction/Modify';
import Select, { type Options as SelectOptions } from 'ol/interaction/Select';
import Snap, { type Options as SnapOptions } from 'ol/interaction/Snap';
import Map from 'ol/Map';

export type DrawType = 'Point' | 'LineString' | 'Polygon';

export const interactionNames = [
  'featureDraw',
  'featureModify',
  'featureSnap',
  'featureSelect',
] as const;

export type OlInteractionName = (typeof interactionNames)[number];

export type InteractionOptionsMap = {
  featureDraw: DrawOptions;
  featureModify: ModifyOptions;
  featureSnap: SnapOptions;
  featureSelect: SelectOptions;
};

export type InteractionInstanceMap = {
  featureDraw: FeatureDrawInteraction;
  featureModify: FeatureModifyInteraction;
  featureSnap: FeatureSnapInteraction;
  featureSelect: FeatureSelectInteraction;
};

export function setInteractionName(
  interaction: Interaction,
  name: OlInteractionName,
): void {
  interaction.set('name', name);
}

export function getInteractionName(interaction: Interaction) {
  return interaction.get('name');
}

export function findInteraction<T extends Interaction>(
  map: Map,
  name: string,
): T | null {
  return (
    (map
      .getInteractions()
      .getArray()
      .find((i) => getInteractionName(i) === name) as T) ?? null
  );
}

export class FeatureSnapInteraction extends Snap {
  constructor(options: SnapOptions) {
    super(options);
    this.setActive(false);
  }
}

export class FeatureModifyInteraction extends Modify {
  constructor(options: ModifyOptions) {
    super(options);
    this.setActive(false);
  }
}

export class FeatureDrawInteraction extends Draw {
  constructor(options: DrawOptions) {
    super(options);
    this.setActive(false);
  }
}

export class FeatureSelectInteraction extends Select {
  constructor(options?: SelectOptions) {
    super(options);
  }
}

const interactionFactories: {
  [K in OlInteractionName]: (
    options: InteractionOptionsMap[K],
  ) => InteractionInstanceMap[K];
} = {
  featureDraw: (options) => new FeatureDrawInteraction(options),
  featureModify: (options) => new FeatureModifyInteraction(options),
  featureSnap: (options) => new FeatureSnapInteraction(options),
  featureSelect: (options) => new FeatureSelectInteraction(options),
};

export function createInteraction<N extends OlInteractionName>(
  name: N,
  options: InteractionOptionsMap[N],
) {
  return interactionFactories[name](options);
}
