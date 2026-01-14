import { IconButton, Tooltip, Typography } from '@mui/material';
import CancelIcon from '@src/components/icons/CancelIcon';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useFileValidator } from '@src/utils/fileValidator';
import { getFileName, getFullFilePath } from '@src/utils/path';
import { useEffect, useMemo, useState } from 'react';
import { FileWithPath } from 'react-dropzone/.';
import DropZone from '../DropZone';
import DownloadIcon from '../icons/DownloadIcon';

interface Props {
  forMedia?: boolean;
  targetPath?: string[];
  surveyId?: number;
  value: {
    url: string;
  }[];
  onUpload: (file: { url: string }) => void;
  onDelete: (file: { url: string }) => void;
  surveyOrganizationId: string;
  disabled?: boolean;
  allowedFilesRegex?: RegExp;
}

export default function FileUpload({
  forMedia,
  disabled,
  onUpload,
  targetPath,
  value,
  onDelete,
  surveyId,
  surveyOrganizationId,
  allowedFilesRegex,
}: Props) {
  const { tr } = useTranslations();
  const { showToast } = useToasts();
  const [acceptedFiles, setAcceptedFiles] = useState<readonly FileWithPath[]>(
    [],
  );
  const fileValidator = useFileValidator();

  const imageFileFormats = ['jpg', 'jpeg', 'png', 'tiff', 'bmp'];

  async function deleteFile(url: string) {
    await fetch(`/api/file/${url}`, {
      method: 'DELETE',
      headers: { organization: JSON.stringify(surveyOrganizationId) },
    });
  }

  useEffect(() => {
    async function doUpload() {
      if (!acceptedFiles.length) {
        return;
      }
      // Delete previous file(s)
      if (value) {
        try {
          await Promise.all((value ?? []).map(({ url }) => deleteFile(url)));
        } catch (error) {
          showToast({
            severity: 'error',
            message: tr.FileUpload.errorDeletingFile,
          });
          return;
        }
      }

      // Save the new file to the server with a POST request
      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organization', surveyOrganizationId);
      if (surveyId != null) {
        formData.append('surveyId', String(surveyId));
      }
      try {
        const res = await fetch(
          `/api/file${forMedia ? '/media' : ''}${
            targetPath ? `/${targetPath}` : ''
          }`,
          {
            method: 'POST',
            body: formData,
          },
        );
        const resJson = await res.json();
        // Upload complete - notify via callback
        onUpload({
          url:
            resJson.id.url ??
            getFullFilePath(surveyOrganizationId, targetPath, file.name),
        });
      } catch (error) {
        showToast({
          severity: 'error',
          message: tr.FileUpload.errorUploadingFile,
        });
      }
    }
    doUpload();
  }, [acceptedFiles]);

  const filesList = useMemo(() => {
    return value?.map(({ url }) => {
      const fileFormat = url
        .substring(url.lastIndexOf('.') + 1, url.length)
        .toLowerCase();
      const name = getFileName(url);
      return (
        <div key={url}>
          {imageFileFormats.includes(fileFormat) && (
            <img
              src={`/api/file/${url}`}
              style={{ width: 50, maxHeight: 50, marginRight: '1rem' }}
            />
          )}
          <span>{name}</span>
          <Tooltip title={tr.FileUpload.downloadFile}>
            <IconButton
              style={{ marginLeft: '1rem' }}
              aria-label="download"
              size="small"
              onClick={(event) => event.stopPropagation()}
              href={`/api/file/${url}`}
              download
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={tr.FileUpload.deleteFile}>
            <span>
              <IconButton
                aria-label="delete"
                size="small"
                disabled={disabled}
                onClick={async (event) => {
                  event.stopPropagation();
                  try {
                    await deleteFile(url);
                    onDelete({ url });
                  } catch (error) {
                    showToast({
                      severity: 'error',
                      message: tr.FileUpload.errorDeletingFile,
                    });
                  }
                }}
              >
                <CancelIcon />
              </IconButton>
            </span>
          </Tooltip>
        </div>
      );
    });
  }, [value]);

  return (
    <div>
      <DropZone
        maxFiles={1}
        fileCallback={async (files: File[]) => {
          await fileValidator(
            files,
            () => {
              setAcceptedFiles(files);
            },
            allowedFilesRegex,
          );
        }}
        /* fileCallback={(files) => setAcceptedFiles(files)} */
        readOnly={disabled}
      >
        {value?.length ? (
          <aside>
            <Typography sx={{ fontWeight: 'bold', padding: '0.5rem 0' }}>
              {tr.FileUpload.addedFile}
            </Typography>
            {filesList}
          </aside>
        ) : null}
      </DropZone>
    </div>
  );
}
