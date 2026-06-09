import { LanguageCode } from '@interfaces/survey';
import { Box, ListSubheader, MenuItem } from '@mui/material';
import { useToasts } from '@src/stores/ToastContext';
import {
  Language,
  supportedLanguages,
  useTranslations,
} from '@src/stores/TranslationContext';
import { useUser } from '@src/stores/UserContext';
import { request } from '@src/utils/request';

interface Props {
  onClose: () => void;
}

export function AdminLanguageSelector({ onClose }: Props) {
  const { tr, language, setLanguage } = useTranslations();
  const { activeUser, setActiveUser } = useUser();
  const { showToast } = useToasts();

  async function handleLanguageChange(lang: Language) {
    setLanguage(lang);
    onClose();
    try {
      await request('/api/users/me/default-language', {
        method: 'PATCH',
        body: { language: lang },
      });
      setActiveUser({ ...activeUser!, defaultLanguage: lang as LanguageCode });
    } catch {
      showToast({
        severity: 'error',
        message: tr.AppBarUserMenu.defaultLanguageSaveFailed,
      });
    }
  }

  return (
    <>
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
        {supportedLanguages.map((lang) => (
          <MenuItem
            key={lang}
            selected={lang === language}
            onClick={() => handleLanguageChange(lang)}
          >
            {tr.LanguageMenu[lang]} ({lang.toLocaleUpperCase()})
          </MenuItem>
        ))}
      </Box>
    </>
  );
}
