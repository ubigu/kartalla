import { GeneralNotification } from '@interfaces/generalNotification';
import { Box } from '@mui/material';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useUser } from '@src/stores/UserContext';
import { request } from '@src/utils/request';
import { useEffect, useRef, useState } from 'react';
import { AdminAppBar } from '../AdminAppBar';
import { EditGeneralNotification } from './EditGeneralNotification';
import { GeneralNotificationList } from './GeneralNotificationList';

const containerStyle = {
  margin: 'auto',
  width: '800px',
  display: 'flex',
  overflowY: 'hidden',
  height: 'calc(100vh - 64px)',
  flexDirection: 'column',
  padding: '3rem',
  gap: '2rem',
};

export function GeneralNotifications() {
  const { tr } = useTranslations();
  const { showToast } = useToasts();
  const { activeUserIsSuperUser } = useUser();
  const [activeNotification, setActiveNotification] = useState<{
    data: GeneralNotification | null;
    editing: boolean;
  }>({ data: null, editing: false });

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<GeneralNotification[]>([]);
  const [sseReconnects, setSseReconnects] = useState(0);

  const editorRef = useRef<{ setEditorValue: (value: string) => void }>(null);

  async function fetchNotifications() {
    setLoading(true);
    const data = await request<GeneralNotification[]>(
      '/api/general-notifications',
    );
    setNotifications(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    let eventSource: EventSource;
    function initializeEventSource() {
      eventSource = new EventSource('/api/general-notifications/events');
      eventSource.onerror = () => {
        setSseReconnects((prev) => prev + 1);
        eventSource.close();

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
      eventSource.onmessage = () => {
        fetchNotifications();
      };
    }
    initializeEventSource();
    return () => eventSource.close();
  }, []);

  async function onSubmit(
    formData: { message: string; title: string },
    notificationId?: string,
  ) {
    try {
      if (notificationId) {
        await request(`/api/general-notifications/${notificationId}`, {
          method: 'PUT',
          body: {
            message: formData.message,
            title: formData.title,
          },
        });
        showToast({
          message: tr.GeneralNotification.updateSuccess,
          severity: 'success',
        });
      } else {
        await request('/api/general-notifications', {
          method: 'POST',
          body: {
            message: formData.message,
            title: formData.title,
          },
        });
        showToast({
          message: tr.GeneralNotification.addSuccess,
          severity: 'success',
        });
      }
      setActiveNotification({ data: null, editing: false });
      editorRef.current?.setEditorValue('');
      fetchNotifications();
    } catch {
      showToast({
        message: tr.GeneralNotification.updateFailed,
        severity: 'error',
      });
    }
  }

  async function onDelete(notificationId: string) {
    try {
      await request(`/api/general-notifications/${notificationId}`, {
        method: 'DELETE',
      });
      showToast({
        message: tr.GeneralNotification.deleteSuccess,
        severity: 'success',
      });
      setActiveNotification({ data: null, editing: false });
      editorRef.current?.setEditorValue('');
      fetchNotifications();
    } catch {
      showToast({
        message: tr.GeneralNotification.deleteFailed,
        severity: 'error',
      });
    }
  }

  return (
    <>
      <AdminAppBar labels={[tr.AppBar.generalNotifications]} />
      <Box sx={containerStyle}>
        {activeUserIsSuperUser && (
          <EditGeneralNotification
            ref={editorRef}
            notification={activeNotification.data}
            onSubmit={onSubmit}
            editing={activeNotification.editing}
            onEdit={() => setActiveNotification({ data: null, editing: true })}
            onCancel={() => {
              setActiveNotification({ data: null, editing: false });
              editorRef.current?.setEditorValue('');
            }}
            onDelete={(notificationId) => onDelete(notificationId)}
          />
        )}
        <GeneralNotificationList
          editing={activeNotification.editing}
          loading={loading}
          activeNotification={activeNotification.data}
          notifications={notifications}
          editingEnabled={activeUserIsSuperUser}
          onCancel={() => setActiveNotification({ data: null, editing: false })}
          onEdit={(notification) => {
            setActiveNotification({ data: notification, editing: true });
          }}
        />
      </Box>
    </>
  );
}
