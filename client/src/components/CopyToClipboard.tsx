import { IconButton, Tooltip } from '@mui/material';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import FileCopyIcon from './icons/FileCopyIcon';

interface Props {
  data: string;
  tooltip?: string;
}

export default function CopyToClipboard({ data, tooltip }: Props) {
  const { tr } = useTranslations();
  const { showToast } = useToasts();

  return (
    <>
      <Tooltip title={tooltip ?? tr.CopyToClipboard.tooltip}>
        <IconButton
          size="small"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(data);
              showToast({
                severity: 'success',
                message: tr.CopyToClipboard.successful,
              });
            } catch (error) {
              showToast({
                severity: 'error',
                message: tr.CopyToClipboard.fail,
              });
            }
          }}
        >
          <FileCopyIcon />
        </IconButton>
      </Tooltip>
    </>
  );
}
