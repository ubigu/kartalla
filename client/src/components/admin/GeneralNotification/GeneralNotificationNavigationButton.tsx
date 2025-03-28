import { Box, IconButton, Tooltip } from '@mui/material';
import { MegaphoneIcon } from '@src/components/icons/MegaphoneIcon';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

export function GeneralNotificationNavigationButton() {
  const { tr } = useTranslations();
  const { showToast } = useToasts();
  const history = useHistory();
  const [newNotifications, setNewNotifications] = useState(false);
  const [sseReconnects, setSseReconnects] = useState(0);

  async function refreshRecentCount() {
    const data = await request<{ count: number }>(
      '/api/general-notifications/recent-count',
    );

    setNewNotifications(data.count > 0);
  }

  useEffect(() => {
    let generalNotificationEventSource: EventSource;
    function initializeEventSource() {
      generalNotificationEventSource = new EventSource(
        '/api/general-notifications/events',
      );
      generalNotificationEventSource.onerror = () => {
        setSseReconnects((prev) => prev + 1);
        generalNotificationEventSource.close();

        if (sseReconnects === 10) {
          showToast({
            message: tr.AppBar.generalNotificationsError,
            severity: 'error',
          });
        } else {
          setTimeout(() => {
            initializeEventSource();
          }, 5000);
        }
      };
      generalNotificationEventSource.onmessage = (message) => {
        const data = JSON.parse(message.data);

        if (data.newGeneralNotifications || data.deletedGeneralNotification) {
          refreshRecentCount();
        } else {
          setNewNotifications(false);
        }
      };
    }
    initializeEventSource();
    return () => {
      generalNotificationEventSource.close();
    };
  }, []);

  useEffect(() => {
    refreshRecentCount();
  }, []);

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
