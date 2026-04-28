import { Typography, TypographyProps } from '@mui/material';

interface Props extends TypographyProps {
  isError?: boolean;
}

export function InputHelperText({ isError, sx, ...props }: Props) {
  return (
    <Typography
      sx={[
        (theme) => ({
          color: isError
            ? theme.palette.textError.main
            : theme.palette.textSecondary.main,
          fontSize: '12px',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
}
