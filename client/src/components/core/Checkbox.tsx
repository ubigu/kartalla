import { Check } from '@mui/icons-material';
import {
  CheckboxProps,
  FormControlLabel,
  Checkbox as MuiCheckbox,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import { controlBorderRadius } from './styles';

interface IconProps {
  backgroundColor?: string;
}

const iconSize = 28;
const checkboxHorizontalPadding = 9;
const helperTextMarginLeft = iconSize + checkboxHorizontalPadding;

const iconBaseStyle = (backgroundColor?: string) => {
  const { palette } = useTheme();
  return {
    backgroundColor: backgroundColor ?? palette.surfaceInput.main,
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    borderRadius: controlBorderRadius,
    boxShadow: '0px 1px 2px 0px #59788626 inset',
    border: `0.5px solid ${palette.borderSubtle.main}`,
  };
};

const CheckedIcon = ({ backgroundColor }: IconProps) => {
  return (
    <span
      className="icon-wrapper"
      style={{
        ...iconBaseStyle(backgroundColor),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Check fontSize="medium" />
    </span>
  );
};

const UncheckedIcon = ({ backgroundColor }: IconProps) => {
  return (
    <span className="icon-wrapper" style={iconBaseStyle(backgroundColor)} />
  );
};

interface Props extends Omit<CheckboxProps, 'size'> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  checkboxBackground?: string;
}

export function Checkbox({
  label,
  helperText,
  sx,
  checkboxBackground,
  inputProps,
  'aria-describedby': ariaDescribedBy,
  ...props
}: Props) {
  const { palette } = useTheme();

  const checkbox = (
    <MuiCheckbox
      disableFocusRipple
      disableRipple
      sx={{
        paddingY: 0,
        '&:hover:not(.Mui-disabled) .icon-wrapper, &:focus:not(.Mui-disabled) .icon-wrapper':
          {
            backgroundColor: `${palette.surfaceSubtle.dark} !important`,
          },
      }}
      size="large"
      checkedIcon={<CheckedIcon backgroundColor={checkboxBackground} />}
      icon={<UncheckedIcon backgroundColor={checkboxBackground} />}
      inputProps={{ 'aria-describedby': ariaDescribedBy, ...inputProps }}
      {...props}
    />
  );

  const control =
    label == null ? (
      checkbox
    ) : (
      <FormControlLabel
        sx={{ height: 'fit-content', marginLeft: '-9px', ...sx }}
        control={checkbox}
        label={label}
      />
    );

  if (helperText == null) return control;

  return (
    <div>
      {control}
      <div style={{ marginLeft: `${helperTextMarginLeft}px` }}>
        {helperText}
      </div>
    </div>
  );
}
