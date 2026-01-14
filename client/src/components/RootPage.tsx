import {
  Box,
  Link,
  SxProps,
  Theme,
  Typography,
  useMediaQuery,
} from '@mui/material';

import { CityIcon } from './icons/CityIcon';
import { KartallaLogoDark } from './icons/KartallaLogoDark';
import { UbiguLogoGreen } from './icons/UbiguLogoGreen';

const pageStyle = {
  width: '100vw',
  height: '100vh',
  backgroundColor: '#00a393',
  '@media (max-width: 900px)': {
    backgroundColor: '#fff',
  },
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const infoBoxStyle = (isMobile: boolean): SxProps => ({
  backgroundColor: '#fff',
  border: `1px solid #fff`,
  borderRadius: '48px',
  width: 'fit-content',
  height: 'fit-content',
  maxWidth: '650px',
  maxHeight: isMobile ? '100%' : '90%',
  overflowY: 'auto',
  margin: isMobile ? 0 : '40px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '30px 30px 0 30px',
  gap: '16px',
  textAlign: 'center',
});

export function RootPage() {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down(600));

  return (
    <Box sx={pageStyle}>
      <Box sx={infoBoxStyle(isMobile)}>
        <KartallaLogoDark
          sx={{
            width: '100%',
            height: '95px',
            paddingBottom: '1rem',
          }}
        />
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: '24px',
            color: '#00a393',
            lineHeight: 1.2,
          }}
        >
          Hei! Olet saapunut Ubigun Kartalla-palveluun.
        </Typography>
        <Typography>
          Jos näkemäsi ei vastaa odotustasi, sinun saattaa olla syytä tarkistaa
          osoite.
        </Typography>
        <Typography>
          Jos taas olet kiinnostunut tutustumaan tarkemmin
          osallistamisalustaamme, olet lämpimästi tervetullut vierailemaan{' '}
          <Link color="#219ACD" href="https://www.ubigu.fi/">
            kotisivuillamme
          </Link>
          !
        </Typography>
        <Box sx={{ position: 'relative' }}>
          <UbiguLogoGreen
            sx={{
              width: '50%',
              height: '30%',
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
          <CityIcon sx={{ width: '100%', height: 'fit-content' }} />
        </Box>
      </Box>
    </Box>
  );
}
