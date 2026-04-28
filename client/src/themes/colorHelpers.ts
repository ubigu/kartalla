import { colors } from './colors';

type ColorState = 'default' | 'hover' | 'focus' | 'error';

export function getBorderColor(
  state: ColorState,
  isError: boolean = false,
): string {
  if (isError) return 'brandRed.main';

  const borderColors: Record<ColorState, string> = {
    error: 'brandRed.main',
    default: 'borderSubtle.main',
    hover: 'primary.main',
    focus: 'brandBlue.main',
  };
  return borderColors[state];
}

export function getBackgroundColor(
  state: ColorState,
  isError: boolean = false,
): string {
  if (isError) return 'surfaceError.light';

  const backgroundColors: Record<ColorState, string> = {
    error: 'surfaceError.light',
    default: 'surfaceInput.main',
    hover: 'surfaceHover.main',
    focus: 'surfaceInput.main',
  };
  return backgroundColors[state];
}

interface LabelColorOptions {
  isFocused: boolean;
  isError: boolean;
}

export function getBoxShadow(
  state: ColorState,
  isError: boolean = false,
): string {
  if (isError) return `0px 4px 15.3px 0px ${colors.surfaceErrorLight}`;

  const shadows: Record<ColorState, string> = {
    error: `0px 4px 15.3px 0px ${colors.surfaceErrorLight}`,
    default: '0px 1px 2px 0px #59788626 inset',
    hover: '0px 1px 2px 0px #59788626 inset',
    focus: `0px 7px 15px 0px ${colors.effectsFocusShadow}, 0px 4px 7px 0px ${colors.effectsFocusShadow}`,
  };
  return shadows[state];
}

export function getLabelColor(options: LabelColorOptions): string {
  if (options.isError) return 'textError.main';
  if (options.isFocused) return 'textSecondary.main';
  return 'textInteractive.main';
}

export function getDisabledLabelColor(): string {
  return 'textSubtle.main';
}

export function getDisabledInputStyles() {
  return {
    backgroundColor: 'surfaceSubtle.main',
    color: 'textSubtle.main',
    cursor: 'not-allowed',
    '&::placeholder': { color: 'textSubtle.main', opacity: 1 },
    '&:hover:not(:focus)': {},
  } as const;
}
