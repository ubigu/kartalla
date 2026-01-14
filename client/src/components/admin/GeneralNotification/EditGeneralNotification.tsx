import { GeneralNotification } from '@interfaces/generalNotification';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
} from '@mui/material';
import AddIcon from '@src/components/icons/AddIcon';
import DeleteBinIcon from '@src/components/icons/DeleteBinIcon';
import RichTextEditor from '@src/components/RichTextEditor';
import { useTranslations } from '@src/stores/TranslationContext';
import {
  FormEvent,
  forwardRef,
  RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';

interface FormElements extends HTMLFormControlsCollection {
  notificationTitle: HTMLInputElement;
}
interface NotificationFormElements extends HTMLFormElement {
  readonly elements: FormElements;
}

interface Props {
  notification?: GeneralNotification | null;
  editing: boolean;
  onEdit: () => void;
  onSubmit: (
    formData: { message: string; title: string },
    notificationId?: string,
  ) => Promise<void>;
  onCancel: () => void;
  onDelete: (notificationId: string) => void;
}

export const EditGeneralNotification = forwardRef(
  function EditGeneralNotification(
    { notification, onSubmit, onCancel, editing, onEdit, onDelete }: Props,
    ref: RefObject<{ setEditorValue: (value: string) => void } | null>,
  ) {
    const { tr } = useTranslations();
    const [formData, setFormData] = useState({
      title: notification?.title ?? '',
      message: notification?.message ?? '',
    });

    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
      setFormData({
        message: notification?.message ?? '',
        title: notification?.title ?? '',
      });
      ref.current?.setEditorValue(notification?.message ?? '');
    }, [notification]);

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: editing ? '0 0 270px' : '0 0 40px',
          transition: 'flex 0.5s ',
          '& .rdw-editor-toolbar': {
            zIndex: 2,
            position: 'sticky',
            top: 0,
          },
          '& .rdw-editor-wrapper': {
            position: 'relative',
            maxHeight: '500px',
            overflowY: 'auto',
          },
          '& .DraftEditor-root': {
            minHeight: '220px',
          },
        }}
      >
        {editing ? (
          <FormControl
            sx={{
              animation: 'grow 0.75s',
              '@keyframes grow': {
                from: { opacity: 0, maxHeight: 0 },
                to: { opacity: 1, maxHeight: '500px' },
              },
            }}
            onSubmit={async (e: FormEvent<NotificationFormElements>) => {
              const currentTarget = e.currentTarget;
              e.preventDefault();
              await onSubmit(formData, notification?.id);
              currentTarget.reset();
              setFormData({ title: '', message: '' });
            }}
            ref={formRef}
            component={'form'}
          >
            <FormControl
              sx={{
                marginBottom: '1rem',
                width: '100%',
                backgroundColor: 'white',
                zIndex: 2,
              }}
            >
              <InputLabel
                required
                sx={{ backgroundColor: 'white', zIndex: 3 }}
                htmlFor="notificationTitle"
              >
                {tr.GeneralNotification.formLabel}
              </InputLabel>
              <OutlinedInput
                id="notificationTitle"
                required
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                value={formData.title}
              />
            </FormControl>
            <RichTextEditor
              ref={ref}
              value={formData.message}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, message: value }));
              }}
            />
            <Box
              sx={{
                backgroundColor: 'white',
                zIndex: 2,
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '1rem',
                gap: '1rem',
              }}
            >
              {notification?.id && (
                <Button
                  endIcon={<DeleteBinIcon />}
                  color="error"
                  sx={{ marginRight: 'auto' }}
                  onClick={() => {
                    onDelete(notification?.id);
                  }}
                >
                  {tr.commands.remove}
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={() => {
                  setFormData({
                    message: notification?.message ?? '',
                    title: notification?.title ?? '',
                  });
                  onCancel();
                }}
              >
                {tr.commands.cancel}
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={
                  formData.message.length === 0 ||
                  !formRef.current?.checkValidity()
                }
              >
                {tr.commands.save}
              </Button>
            </Box>
          </FormControl>
        ) : (
          <Button
            variant="contained"
            sx={{
              marginLeft: 'auto',
              animation: 'fadeIn 0.5s',
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
            endIcon={<AddIcon />}
            onClick={onEdit}
          >
            {tr.GeneralNotification.addNew}
          </Button>
        )}
      </Box>
    );
  },
);
