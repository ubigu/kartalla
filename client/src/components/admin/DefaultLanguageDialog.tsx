import { LanguageCode } from '@interfaces/survey';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
} from '@mui/material';
import { useToasts } from '@src/stores/ToastContext';
import { Language, useTranslations } from '@src/stores/TranslationContext';
import { useUser } from '@src/stores/UserContext';
import { request } from '@src/utils/request';
import { Dispatch, SetStateAction, useState } from 'react';

interface Props {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
}

export function DefaultLanguageDialog({
  isOpen,
  setIsOpen,
  setMenuOpen,
}: Props) {
  const { tr, languages, setLanguage } = useTranslations();
  const { activeUser, setActiveUser } = useUser();
  const { showToast } = useToasts();
  const [selected, setSelected] = useState<Language>(
    activeUser?.defaultLanguage ?? 'fi',
  );
  async function handleSave() {
    try {
      await request('/api/users/me/default-language', {
        method: 'PATCH',
        body: { language: selected },
      });
      setActiveUser({
        ...activeUser!,
        defaultLanguage: selected as LanguageCode,
      });
      setLanguage(selected);
      showToast({
        severity: 'success',
        message: tr.AppBarUserMenu.defaultLanguageSaved,
      });
      setIsOpen(false);
      setMenuOpen(false);
    } catch {
      showToast({
        severity: 'error',
        message: tr.AppBarUserMenu.defaultLanguageSaveFailed,
      });
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      TransitionProps={{
        onEnter: () => setSelected(activeUser?.defaultLanguage ?? 'fi'),
      }}
    >
      <DialogTitle>{tr.AppBarUserMenu.selectDefaultLanguage}</DialogTitle>
      <DialogContent sx={{ minWidth: '320px' }}>
        <Select
          value={selected}
          onChange={(e) => setSelected(e.target.value as Language)}
          fullWidth
        >
          {languages.map((lang) => (
            <MenuItem key={lang} value={lang}>
              {tr.LanguageMenu[lang]} ({lang.toLocaleUpperCase()})
            </MenuItem>
          ))}
        </Select>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={() => setIsOpen(false)}>
          {tr.commands.cancel}
        </Button>
        <Button
          disabled={selected === activeUser?.defaultLanguage}
          variant="contained"
          onClick={handleSave}
        >
          {tr.commands.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
