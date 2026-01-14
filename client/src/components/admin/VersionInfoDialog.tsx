import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  SxProps,
  Typography,
} from '@mui/material';

import CloseIcon from '../icons/CloseIcon';

import { useTranslations } from '@src/stores/TranslationContext';
import KartallaLogoInfo from '../icons/KartallaLogoWhite';
import UbiguLogoWhite from '../icons/UbiguLogoWhite';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const dialogBaseStyle: SxProps = {
  '& .MuiPaper-root': {
    backgroundColor: 'primary.main',
    width: '404px',
    height: 'fit-content',
    border: '1px solid white',
    borderRadius: '20px',
    '& p': { color: 'white', fontSize: '14px' },
  },
};

const dialogTitleStyle: SxProps = {
  color: 'white',
  marginTop: '15px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
};

const dialogContentStyle: SxProps = {
  color: 'white',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  padding: '0px 24px',
  flexGrow: 0,
};

const dialogActionsStyle: SxProps = {
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
};

export function VersionInfoDialog({ isOpen, onClose }: Props) {
  const { tr } = useTranslations();

  return (
    <Dialog open={isOpen} sx={dialogBaseStyle}>
      <DialogTitle sx={dialogTitleStyle}>
        <KartallaLogoInfo />
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 700 }}>
            {tr.VersionInfoDialog.title}
          </Typography>
          <Typography>
            {tr.VersionInfoDialog.version} {APP_VERSION}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={dialogContentStyle}>
        <Typography>{tr.VersionInfoDialog.developedBy}:</Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700, paddingBottom: '4px' }}>
              Ubigu Oy
            </Typography>
            <Typography sx={{ lineHeight: '14px' }}>
              Hämeenkatu 14 C 17, <br />
              33100 Tampere
            </Typography>
            <Typography>ubigu.fi</Typography>
          </Box>
          <UbiguLogoWhite />
        </Box>
      </DialogContent>
      <DialogActions sx={dialogActionsStyle}>
        <Button
          size="small"
          variant="outlined"
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'harmaa.main',
              borderColor: 'white',
            },
            borderColor: 'white',
            paddingX: '0.5rem',
          }}
          onClick={onClose}
          endIcon={<CloseIcon htmlColor="white" />}
        >
          {tr.commands.close}
        </Button>
        <IconButton
          sx={{ position: 'absolute', top: 0, right: 0 }}
          onClick={onClose}
        >
          <CloseIcon htmlColor="white" />
        </IconButton>
      </DialogActions>
    </Dialog>
  );
}
