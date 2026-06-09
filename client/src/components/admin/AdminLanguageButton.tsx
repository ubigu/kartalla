import { LanguageCode } from '@interfaces/survey';
import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import LanguageIcon from '@src/components/icons/LanguageIcon';
import { useToasts } from '@src/stores/ToastContext';
import {
  Language,
  supportedLanguages,
  useTranslations,
} from '@src/stores/TranslationContext';
import { useUser } from '@src/stores/UserContext';
import { request } from '@src/utils/request';
import { useState } from 'react';

export function AdminLanguageButton() {
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const { tr, language, setLanguage } = useTranslations();
  const { activeUser, setActiveUser } = useUser();
  const { showToast } = useToasts();

  async function handleLanguageChange(lang: Language) {
    setLanguage(lang);
    setMenuAnchorEl(null);
    if (activeUser)
      setActiveUser({ ...activeUser, defaultLanguage: lang as LanguageCode });
    try {
      await request('/api/users/me/default-language', {
        method: 'PATCH',
        body: { language: lang },
      });
    } catch {
      showToast({
        severity: 'error',
        message: tr.AppBarUserMenu.defaultLanguageSaveFailed,
      });
    }
  }

  return (
    <>
      <Tooltip arrow title={tr.LanguageMenu.changeLanguage}>
        <IconButton
          aria-label={tr.LanguageMenu.changeLanguage}
          color="inherit"
          onClick={(event) => setMenuAnchorEl(event.currentTarget)}
        >
          <LanguageIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={menuAnchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
      >
        {supportedLanguages.map((lang) => (
          <MenuItem
            key={lang}
            selected={lang === language}
            onClick={() => handleLanguageChange(lang)}
          >
            {tr.LanguageMenu[lang]} ({lang.toLocaleUpperCase()})
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
