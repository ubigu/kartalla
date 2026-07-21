import { Box, CircularProgress, Typography } from '@mui/material';
import ErrorIcon from '@src/components/icons/ErrorIcon';

interface Props {
  isMapReady: boolean;
  mapError: boolean;
  loadErrorText: string;
}

export default function OskariMapStatusOverlay({
  isMapReady,
  mapError,
  loadErrorText,
}: Props) {
  return (
    <>
      {!isMapReady && !mapError && (
        <CircularProgress
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-20px',
            marginLeft: '-20px',
            zIndex: 1,
          }}
        />
      )}
      {mapError && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            textAlign: 'center',
            padding: 2,
            zIndex: 1,
          }}
        >
          <ErrorIcon sx={{ color: 'textError.main', fontSize: '2.5rem' }} />
          <Typography color="textError" variant="h6" component={'p'}>
            {loadErrorText}
          </Typography>
        </Box>
      )}
    </>
  );
}
