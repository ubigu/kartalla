import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import SettingsIcon from '@src/components/icons/SettingsIcon';
import { useTranslations } from '@src/stores/TranslationContext';
import { useUser } from '@src/stores/UserContext';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { InstructionsDialog } from './InstructionsDialog';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
});

export default function AppBarUserMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement>(null);
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);
  const { activeUserIsSuperUser, activeUserIsAdmin } = useUser();
  const classes = useStyles();
  const { tr } = useTranslations();
  const history = useHistory();

  return (
    <div className={classes.root}>
      <Tooltip arrow title={tr.AppBarUserMenu.label}>
        <IconButton
          aria-label={tr.AppBarUserMenu.label}
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={(event) => {
            setMenuOpen(!menuOpen);
            setMenuAnchorEl(event.currentTarget);
          }}
          color="inherit"
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      <Menu
        sx={{ padding: '4px', transform: 'translateX(15px)' }}
        id="menu-appbar"
        anchorEl={menuAnchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 0,
          horizontal: 0,
        }}
        open={menuOpen}
        onClose={() => {
          setMenuOpen(false);
        }}
      >
        {(activeUserIsAdmin || activeUserIsSuperUser) && (
          <MenuItem
            onClick={() => {
              setMenuOpen(false);
              history.push('/kayttajahallinta');
            }}
          >
            {tr.AppBarUserMenu.userManagement}
          </MenuItem>
        )}
        {activeUserIsSuperUser && (
          <MenuItem onClick={() => setInstructionsDialogOpen(true)}>
            {tr.AppBarUserMenu.updateInstructions}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setMenuOpen(false);
            window.location.pathname = '/logout';
          }}
        >
          {tr.AppBarUserMenu.logout}
        </MenuItem>
      </Menu>
      <InstructionsDialog
        isOpen={instructionsDialogOpen}
        setIsOpen={setInstructionsDialogOpen}
        setMenuOpen={setMenuOpen}
      />
    </div>
  );
}
