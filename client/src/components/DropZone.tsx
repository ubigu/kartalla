import { makeStyles } from '@mui/styles';
import { useTranslations } from '@src/stores/TranslationContext';
import { ReactNode, useEffect } from 'react';
import { FileWithPath, useDropzone } from 'react-dropzone';

const useStyles = makeStyles({
  container: {
    width: '90%',
    display: 'flex',
    alignSelf: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px',
    marginBottom: '10px',
    borderWidth: '2px',
    borderRadius: '2px',
    borderColor: '#eeeeee',
    borderStyle: 'dashed',
    backgroundColor: '#fafafa',
    transition: 'border .24s ease-in-out',
  },
  dropzone: {
    borderRadius: '2px',
    outlineOffset: 0,
    outlineColor: 'rbga(0,0,0,0)',
    transition: 'outline-offset 400ms, outline-color   400ms',
    '&:focus-visible': {
      outline: '2px solid black',
      outlineOffset: '2px',
    },
  },
});

const DEFAULT_MAX_FILE_SIZE = '10';

interface Props {
  maxFiles: number;
  fileCallback: (files: readonly FileWithPath[]) => void;
  children?: ReactNode;
  maxFileSize?: number;
  readOnly?: boolean;
}

export default function DropZone({
  maxFiles,
  fileCallback,
  children,
  maxFileSize,
  readOnly = false,
}: Props) {
  const classes = useStyles();
  const { tr } = useTranslations();
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    maxFiles: maxFiles,
    disabled: readOnly,
  });

  useEffect(() => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    fileCallback(acceptedFiles);
  }, [acceptedFiles]);

  return (
    <section className={classes.container}>
      <div
        {...getRootProps({ className: `dropzone ${classes.dropzone}` })}
        aria-label={children ? tr.AttachmentQuestion.replace : ''}
      >
        <input {...getInputProps()} />
        <div style={{ cursor: 'pointer' }}>
          {children
            ? children
            : tr.DropZone.dropFiles.replace(
                '{x}',
                maxFileSize ? String(maxFileSize) : DEFAULT_MAX_FILE_SIZE,
              )}
        </div>
      </div>
    </section>
  );
}
