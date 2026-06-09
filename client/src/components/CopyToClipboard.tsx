import { IconButton, SxProps, Theme, Tooltip } from '@mui/material';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import FileCopyIcon from './icons/FileCopyIcon';

interface Props {
  data: string;
  tooltip?: string;
  sx?: SxProps<Theme>;
}

export default function CopyToClipboard({ data, tooltip, sx }: Props) {
  const { tr } = useTranslations();
  const { showToast } = useToasts();

  return (
    <>
      <Tooltip sx={sx} title={tooltip ?? tr.CopyToClipboard.tooltip}>
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
