import { Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { ReactNode } from 'react';

const useStyles = makeStyles((theme: Theme) => ({
  '@keyframes pulse': {
    '0%': {
      opacity: 0.4,
    },
    '50%': {
      opacity: 0.7,
    },
    '100%': {
      opacity: 0.4,
    },
  },
  loading: {
    animation: `$pulse 1s ${theme.transitions.easing.easeIn} infinite`,
    pointerEvents: 'none',
  },
  fieldset: {
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
}));

interface Props {
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode | ReactNode[];
}

export default function Fieldset({ disabled, loading, children }: Props) {
  const classes = useStyles();

  return (
    <fieldset
      disabled={disabled || loading}
      className={`${classes.fieldset} ${loading ? classes.loading : ''}`}
    >
      {children}
    </fieldset>
  );
}
