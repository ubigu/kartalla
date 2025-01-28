import { FileAnswer } from '@interfaces/survey';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from '@mui/material';
import DownloadIcon from '@src/components/icons/DownloadIcon';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import React from 'react';
import { useState } from 'react';

interface Props {
  surveyId: number;
}

export default function DataExport({ surveyId }: Props) {
  const [displayDialog, setDisplayDialog] = useState(false);
  const [withPersonalInfo, setWithPersonalInfo] = useState(false);
  const [selectedFileFormats, setSelectedFileFormats] = useState({
    csv: true,
    geopackage: false,
    attachments: false,
  });
  const { tr } = useTranslations();
  const { showToast } = useToasts();

  const allowedFilesRegex =
    /^data:(image|application|video)\/(png|jpg|jpeg|pdf|vnd.openxmlformats-officedocument.spreadsheetml.sheet|xlsx|vnd.openxmlformats-officedocument.wordprocessingml.document|docx|mp4|mkv|webm|avi|wmv|m4p|m4v|mpg|mpeg|m4v|mov);base64,/;

  async function exportCSV() {
    try {
      const res = await fetch(
        `/api/answers/${surveyId}/file-export/csv?withPersonalInfo=${withPersonalInfo}`,
        {
          method: 'GET',
        },
      );

      const csvText = await res.text();
      const textBlob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(textBlob);
      link.target = '_blank';
      link.download = 'data.csv';
      link.click();
    } catch (err) {
      showToast({
        severity: 'error',
        message: err.message,
      });
    }
  }

  async function exportGeoPackage() {
    try {
      const res = await fetch(
        `/api/answers/${surveyId}/file-export/geopackage`,
        {
          method: 'GET',
        },
      );

      if (!res.ok) {
        let error: string | object = await res.text();
        error = JSON.parse(error as string);
        throw {
          ...(typeof error === 'object'
            ? error
            : {
                text: error,
              }),
          status: res.status,
        };
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const blobLink = document.createElement('a');
      blobLink.href = blobUrl;
      blobLink.download = 'geopackage.gpkg';
      blobLink.click();
    } catch (err) {
      showToast({
        severity: 'error',
        message: err.message,
      });
    }
  }

  async function exportAttachments() {
    try {
      const files = (await request(
        `/api/answers/${surveyId}/file-export/attachments`,
      )) as FileAnswer[];

      const zip = new JSZip();
      files.map((file) =>
        zip.file(
          file.fileName,
          file.fileString.replace(allowedFilesRegex, ''),
          { base64: true },
        ),
      );
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'vastaukset.zip');
    } catch (err) {
      showToast({ severity: 'error', message: err.message });
    }
  }

  return (
    <>
      <Button
        startIcon={<DownloadIcon />}
        sx={{ marginRight: 'auto' }}
        variant="contained"
        onClick={() => setDisplayDialog((prev) => !prev)}
      >
        {tr.DataExport.exportAnswers}
      </Button>
      <Dialog open={displayDialog} onClose={() => setDisplayDialog(false)}>
        <DialogTitle> {tr.DataExport.surveyAnswerExport} </DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column' }}>
          <Box display="flex" flexDirection="column">
            <FormControlLabel
              label={tr.DataExport.alphanumericSubmissions}
              control={
                <Checkbox
                  checked={selectedFileFormats.csv}
                  onChange={(event) =>
                    setSelectedFileFormats({
                      ...selectedFileFormats,
                      csv: event.target.checked,
                    })
                  }
                />
              }
            />
            {selectedFileFormats.csv && (
              <FormControlLabel
                sx={{
                  marginLeft: '8px',
                  height: '26px',
                  '& .MuiFormControlLabel-label': {
                    fontSize: '14px',
                  },
                  paddingBottom: '6px',
                }}
                label={tr.DataExport.personalInfo}
                control={
                  <Checkbox
                    size="small"
                    checked={withPersonalInfo}
                    onChange={() => setWithPersonalInfo((prev) => !prev)}
                  />
                }
              />
            )}
          </Box>
          <FormControlLabel
            label={tr.DataExport.geospatialSubmissions}
            control={
              <Checkbox
                checked={selectedFileFormats.geopackage}
                onChange={(event) =>
                  setSelectedFileFormats({
                    ...selectedFileFormats,
                    geopackage: event.target.checked,
                  })
                }
              />
            }
          />
          <FormControlLabel
            label={tr.DataExport.attachments}
            control={
              <Checkbox
                checked={selectedFileFormats.attachments}
                onChange={(event) =>
                  setSelectedFileFormats({
                    ...selectedFileFormats,
                    attachments: event.target.checked,
                  })
                }
              />
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisplayDialog(false)}>
            {tr.commands.cancel}
          </Button>
          <Button
            disabled={
              !selectedFileFormats.csv &&
              !selectedFileFormats.geopackage &&
              !selectedFileFormats.attachments
            }
            onClick={() => {
              setDisplayDialog(false);
              selectedFileFormats.csv && exportCSV();
              selectedFileFormats.geopackage && exportGeoPackage();
              selectedFileFormats.attachments && exportAttachments();
            }}
          >
            {' '}
            {tr.DataExport.download}{' '}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
