import { IconButton, Tooltip } from '@mui/material';
import CancelIcon from '@src/components/icons/CancelIcon';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import React, { useEffect, useMemo, useState } from 'react';
import DropZone from '../DropZone';
import { getFileName, getFullFilePath } from '@src/utils/path';

interface Props {
  targetPath?: string[];
  surveyId?: number;
  value: {
    url: string;
  }[];
  onUpload: (file: { url: string }) => void;
  onDelete: (file: { url: string }) => void;
  surveyOrganizationId: string;
}

export default function FileUpload({
  onUpload,
  targetPath,
  value,
  onDelete,
  surveyId,
  surveyOrganizationId,
}: Props) {
  const { tr } = useTranslations();
  const { showToast } = useToasts();
  const [acceptedFiles, setAcceptedFiles] = useState([]);

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
        await fetch(`/api/file${targetPath ? `/${targetPath}` : ''}`, {
          method: 'POST',
          body: formData,
        });
        // Upload complete - notify via callback
        onUpload({
          url: getFullFilePath(surveyOrganizationId, targetPath, file.name),
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
          <Tooltip title={tr.FileUpload.deleteFile}>
            <IconButton
              aria-label="delete"
              size="small"
              style={{ marginLeft: '1rem' }}
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
          </Tooltip>
        </div>
      );
    });
  }, [value]);

  return (
    <div>
      <DropZone maxFiles={1} fileCallback={(files) => setAcceptedFiles(files)}>
        {value?.length ? (
          <aside>
            <h4>{tr.FileUpload.addedFile}</h4>
            {filesList}
          </aside>
        ) : null}
      </DropZone>
    </div>
  );
}
