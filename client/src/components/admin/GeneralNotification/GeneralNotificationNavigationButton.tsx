import { Box, IconButton, Tooltip } from '@mui/material';
import { MegaphoneIcon } from '@src/components/icons/MegaphoneIcon';
import { useGeneralNotifications } from '@src/stores/GeneralNotificationContext';
import { useTranslations } from '@src/stores/TranslationContext';

import { useHistory } from 'react-router-dom';

export function GeneralNotificationNavigationButton() {
  const { tr } = useTranslations();
  const history = useHistory();
  const { newNotifications } = useGeneralNotifications();

  return (
    <Tooltip
      title={
        tr.AppBar[
          newNotifications ? 'generalNotificationsNew' : 'generalNotifications'
        ]
      }
    >
      <IconButton onClick={() => history.push('/tiedotteet')}>
        <MegaphoneIcon htmlColor="white" />
        {newNotifications && (
          <Box
            component="span"
            sx={(theme) => ({
              position: 'absolute',
              top: '12px',
              right: '0',
              boxShadow: theme.shadows[1],
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: theme.palette.brandYellow.main,
            })}
          />
        )}
      </IconButton>
    </Tooltip>
  );
}
