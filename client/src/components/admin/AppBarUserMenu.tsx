import {
  Box,
  IconButton,
  ListSubheader,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import SettingsIcon from '@src/components/icons/SettingsIcon';
import { useTranslations } from '@src/stores/TranslationContext';
import { useUser } from '@src/stores/UserContext';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { DefaultLanguageDialog } from './DefaultLanguageDialog';
import { InstructionsDialog } from './InstructionsDialog';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
});

export default function AppBarUserMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);
  const [defaultLanguageDialogOpen, setDefaultLanguageDialogOpen] =
    useState(false);
  const { activeUserIsSuperUser, activeUserIsAdmin } = useUser();
  const classes = useStyles();
  const { tr, language, languages, setLanguage } = useTranslations();
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
        {activeUserIsAdmin && (
          <MenuItem onClick={() => history.push('/karttajulkaisut')}>
            {tr.AppBarUserMenu.editMapPublications}
          </MenuItem>
        )}
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
        <MenuItem
          onClick={() => {
            setMenuOpen(false);
            setDefaultLanguageDialogOpen(true);
          }}
        >
          {tr.AppBarUserMenu.selectDefaultLanguage}
        </MenuItem>
        {activeUserIsSuperUser && (
          <MenuItem onClick={() => setInstructionsDialogOpen(true)}>
            {tr.AppBarUserMenu.updateInstructions}
          </MenuItem>
        )}
        <ListSubheader
          component={'p'}
          disableSticky
          sx={(theme) => ({
            paddingY: 0,
            margin: 0,
            borderTop: `1px solid ${theme.palette.borderSubtle.main}`,
          })}
        >
          {tr.LanguageMenu.changeLanguage}
        </ListSubheader>
        <Box component={'ul'} sx={{ padding: 0, margin: 0 }}>
          {languages.map((lang) => (
            <MenuItem
              key={lang}
              selected={lang === language}
              onClick={() => {
                setLanguage(lang);
                setMenuOpen(false);
              }}
            >
              {tr.LanguageMenu[lang]} ({lang.toLocaleUpperCase()})
            </MenuItem>
          ))}
        </Box>
      </Menu>
      <DefaultLanguageDialog
        isOpen={defaultLanguageDialogOpen}
        setIsOpen={setDefaultLanguageDialogOpen}
        setMenuOpen={setMenuOpen}
      />
      <InstructionsDialog
        isOpen={instructionsDialogOpen}
        setIsOpen={setInstructionsDialogOpen}
        setMenuOpen={setMenuOpen}
      />
    </div>
  );
}
