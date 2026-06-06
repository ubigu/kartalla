// @ts-strict-ignore
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
  Radio,
  RadioGroup,
} from '@mui/material';
import DownloadIcon from '@src/components/icons/DownloadIcon';
import { useToasts } from '@src/stores/ToastContext';
import {
  getApiTranslation,
  useTranslations,
} from '@src/stores/TranslationContext';
import { useWorkingLanguage } from '@src/stores/WorkingLanguageContext';
import { request } from '@src/utils/request';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { useEffect, useState } from 'react';

interface AnswerCounts {
  aplhaNumericAnswers: number;
  attachmentAnswers: number;
  mapAnswers: number;
  personalInfoAnswers: number;
}
interface Props {
  surveyId: number;
  surveyName: string;
}

async function handleFileExportError(res: Response) {
  if (!res.ok) {
    let error: string | object = await res.text();
    try {
      error = JSON.parse(error as string);
    } catch {
      // keep as string if body is not valid JSON
    }
    throw {
      ...(typeof error === 'object' ? error : { text: error }),
      status: res.status,
    };
  }
}

export default function DataExport({ surveyId, surveyName }: Props) {
  const [displayDialog, setDisplayDialog] = useState(false);
  const [withPersonalInfo, setWithPersonalInfo] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [selectedFileFormats, setSelectedFileFormats] = useState({
    csv: false,
    geopackage: false,
    attachments: false,
  });
  const [answerCounts, setAnswerCounts] = useState<AnswerCounts | null>();
  const { tr } = useTranslations();
  const { workingLanguage } = useWorkingLanguage();

  function getExportFilename(label: string, ext: string) {
    const sanitizedLabel = label
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_À-ɏ]/g, '');
    return `${surveyName}_${sanitizedLabel}_${workingLanguage}.${ext}`;
  }
  const { showToast } = useToasts();

  useEffect(() => {
    async function getAnswerCounts() {
      try {
        const result = await request<AnswerCounts>(
          `/api/answers/${surveyId}/answer-counts`,
        );
        setAnswerCounts(result);
        setSelectedFileFormats((prev) => ({
          ...prev,
          csv: result.aplhaNumericAnswers > 0 || result.personalInfoAnswers > 0,
        }));
      } catch {
        showToast({
          severity: 'error',
          message: tr.DataExport.error,
        });
      }
    }
    getAnswerCounts();
  }, []);

  const allowedFilesRegex =
    /^data:(image|application|video)\/(png|jpg|jpeg|pdf|vnd.openxmlformats-officedocument.spreadsheetml.sheet|xlsx|vnd.openxmlformats-officedocument.wordprocessingml.document|docx|mp4|mkv|webm|avi|wmv|m4p|m4v|mpg|mpeg|m4v|mov);base64,/;

  async function exportCSV() {
    try {
      const res = await fetch(
        `/api/answers/${surveyId}/file-export?fileType=csv&withPersonalInfo=${withPersonalInfo}&lang=${workingLanguage}`,
        {
          method: 'GET',
        },
      );

      await handleFileExportError(res);
      const csvText = await res.text();
      const textBlob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(textBlob);
      link.download = getExportFilename(tr.DataExport.submissions, 'csv');
      link.click();
    } catch (err) {
      showToast({
        severity: 'error',
        message: getApiTranslation(err.message_code ?? err.message, tr),
      });
    }
  }

  async function exportExcel() {
    try {
      const res = await fetch(
        `/api/answers/${surveyId}/file-export?fileType=excel&withPersonalInfo=${withPersonalInfo}&lang=${workingLanguage}`,
        { method: 'GET' },
      );

      await handleFileExportError(res);

      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = getExportFilename(tr.DataExport.submissions, 'xlsx');
      link.click();
    } catch (err) {
      showToast({
        severity: 'error',
        message: getApiTranslation(err.message_code ?? err.message, tr),
      });
    }
  }

  async function exportGeoPackage() {
    try {
      const res = await fetch(
        `/api/answers/${surveyId}/file-export/geopackage?lang=${workingLanguage}`,
        {
          method: 'GET',
        },
      );

      await handleFileExportError(res);

      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = getExportFilename(
        tr.DataExport.geospatialSubmissions,
        'gpkg',
      );
      link.click();
    } catch (err) {
      showToast({
        severity: 'error',
        message: getApiTranslation(err.message_code ?? err.message, tr),
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
      saveAs(blob, getExportFilename(tr.DataExport.attachments, 'zip'));
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
                  disabled={
                    answerCounts?.aplhaNumericAnswers === 0 &&
                    answerCounts?.personalInfoAnswers === 0
                  }
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
              <Box
                sx={{
                  marginLeft: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <FormControlLabel
                  sx={{
                    height: '26px',
                    '& .MuiFormControlLabel-label': { fontSize: '14px' },
                    paddingBottom: '6px',
                  }}
                  label={tr.DataExport.personalInfo}
                  control={
                    <Checkbox
                      disabled={answerCounts?.personalInfoAnswers === 0}
                      size="small"
                      checked={withPersonalInfo}
                      onChange={() => setWithPersonalInfo((prev) => !prev)}
                    />
                  }
                />
                <RadioGroup
                  value={exportFormat}
                  onChange={(e) =>
                    setExportFormat(e.target.value as 'xlsx' | 'csv')
                  }
                >
                  {(['xlsx', 'csv'] as const).map((fmt) => (
                    <FormControlLabel
                      key={fmt}
                      value={fmt}
                      sx={{
                        height: '26px',
                        '& .MuiFormControlLabel-label': { fontSize: '14px' },
                      }}
                      label={fmt}
                      control={<Radio size="small" />}
                    />
                  ))}
                </RadioGroup>
              </Box>
            )}
          </Box>
          <FormControlLabel
            label={tr.DataExport.geospatialSubmissions}
            control={
              <Checkbox
                disabled={answerCounts?.mapAnswers === 0}
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
                disabled={answerCounts?.attachmentAnswers === 0}
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
              if (selectedFileFormats.csv) {
                exportFormat === 'xlsx' ? exportExcel() : exportCSV();
              }
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
