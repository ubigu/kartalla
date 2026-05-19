import type { EventsKey } from 'ol/events';
import Map from 'ol/Map';
import { unByKey } from 'ol/Observable';
import {
  createInteraction,
  FeatureModifyInteraction,
  FeatureSelectInteraction,
  FeatureSnapInteraction,
  findInteraction,
  getInteractionName,
  InteractionInstanceMap,
  interactionNames,
  InteractionOptionsMap,
  OlInteractionName,
  setInteractionName,
} from './interactions';

export type MapMode = 'pan' | 'interactivePan' | 'draw' | 'modify';

/** Handles interactions and cursor appearance for each map mode. */
export class MapInteractionManager {
  private _removeListeners: (() => void) | null = null;
  private _hovering = false;
  private _mode: MapMode = 'pan';

  constructor(private map: Map) {}

  get mode() {
    return this._mode;
  }

  private get viewport() {
    return this.map.getViewport();
  }

  private applyCursor() {
    this._removeListeners?.();
    this._removeListeners = null;

    if (this.mode === 'draw') {
      this.viewport.style.cursor = 'default';
      return;
    }

    this.viewport.style.cursor = 'grab';

    const moveKey: EventsKey = this.map.on('pointermove', (event) => {
      const shouldHover =
        this.map.hasFeatureAtPixel(event.pixel) && this.mode !== 'pan';
      if (shouldHover === this._hovering) return;
      this._hovering = shouldHover;
      this.viewport.style.cursor = shouldHover ? 'pointer' : 'grab';
    });

    const isPanMode = this.mode === 'interactivePan' || this.mode === 'pan';
    if (isPanMode) {
      const onDown = () => {
        if (!this._hovering) this.viewport.style.cursor = 'grabbing';
      };
      const onUp = () => {
        if (!this._hovering) this.viewport.style.cursor = 'grab';
      };
      this.viewport.addEventListener('pointerdown', onDown);
      this.viewport.addEventListener('pointerup', onUp);
      this.viewport.addEventListener('pointercancel', onUp);
      this._removeListeners = () => {
        unByKey(moveKey);
        this.viewport.removeEventListener('pointerdown', onDown);
        this.viewport.removeEventListener('pointerup', onUp);
        this.viewport.removeEventListener('pointercancel', onUp);
      };
    } else {
      this._removeListeners = () => unByKey(moveKey);
    }
  }

  build<N extends OlInteractionName>(
    name: N,
    options: InteractionOptionsMap[N],
  ) {
    const existing = findInteraction<InteractionInstanceMap[N]>(this.map, name);
    if (existing) return { interaction: existing, created: false };
    const interaction = createInteraction(name, options);
    setInteractionName(interaction, name);
    this.map.addInteraction(interaction);
    return { interaction, created: true };
  }

  replace<N extends OlInteractionName>(
    name: N,
    options: InteractionOptionsMap[N],
  ) {
    const existing = findInteraction(this.map, name);
    if (existing) this.map.removeInteraction(existing);
    const interaction = createInteraction(name, options);
    setInteractionName(interaction, name);
    this.map.addInteraction(interaction);
    return interaction;
  }

  setMode(mode: MapMode, drawName?: OlInteractionName) {
    this._mode = mode;
    const interactions = this.map.getInteractions().getArray();

    interactions.forEach((interaction) => {
      if (interactionNames.includes(getInteractionName(interaction))) {
        interaction.setActive(false);
      }
    });

    this.applyCursor();

    if (mode === 'interactivePan') {
      findInteraction<FeatureSelectInteraction>(
        this.map,
        'featureSelect',
      )?.setActive(true);
    } else if (mode === 'draw' && drawName) {
      findInteraction(this.map, drawName)?.setActive(true);
    } else if (mode === 'modify') {
      findInteraction<FeatureModifyInteraction>(
        this.map,
        'featureModify',
      )?.setActive(true);
      interactions
        .filter(
          (i): i is FeatureSnapInteraction =>
            i instanceof FeatureSnapInteraction,
        )
        .forEach((snap) => snap.setActive(true));
    }
  }
}
