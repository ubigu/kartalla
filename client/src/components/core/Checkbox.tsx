import { Check } from '@mui/icons-material';
import { Checkbox, CheckboxProps, FormControlLabel } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

interface IconProps {
  backgroundColor?: string;
}

const iconBaseStyle = (backgroundColor?: string) => {
  const { palette } = useTheme();
  return {
    backgroundColor: backgroundColor ?? palette.surfaceInput.main,
    width: '28px',
    height: '28px',
    borderRadius: '4px',
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

interface CoreCheckboxProps extends Omit<CheckboxProps, 'size'> {
  label?: React.ReactNode;
  checkboxBackground?: string;
}

export function CoreCheckbox({
  label,
  sx,
  checkboxBackground,
  ...props
}: CoreCheckboxProps) {
  const { palette } = useTheme();
  const checkbox = (
    <Checkbox
      disableFocusRipple
      disableRipple
      sx={{
        paddingY: 0,
        '&:hover .icon-wrapper, &:focus .icon-wrapper': {
          backgroundColor: `${palette.surfaceSubtle.dark} !important`,
        },
      }}
      size="large"
      checkedIcon={<CheckedIcon backgroundColor={checkboxBackground} />}
      icon={<UncheckedIcon backgroundColor={checkboxBackground} />}
      {...props}
    />
  );

  if (label == null) return checkbox;

  return (
    <FormControlLabel
      sx={{ height: 'fit-content', marginLeft: '-9px', ...sx }}
      control={checkbox}
      label={label}
    />
  );
}
