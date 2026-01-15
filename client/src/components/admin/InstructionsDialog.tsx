import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import PaperclipIcon from '@src/components/icons/PaperclipIcon';
import UploadIcon from '@src/components/icons/UploadIcon';
import {
  getInstructionFilename,
  storeAdminInstructions,
} from '@src/controllers/AdminFileController';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import DropZone from '../DropZone';

interface Props {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
}
const MEGAS = 10;
const MAX_FILE_SIZE = MEGAS * 1000 * 1000; // ten megabytes

export function InstructionsDialog({ isOpen, setIsOpen, setMenuOpen }: Props) {
  const { showToast } = useToasts();
  const { tr } = useTranslations();
  const [instructionFileName, setInstructionFileName] = useState(null);
  const [stagedFile, setStagedFile] = useState<File>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setStagedFile(null);
    setInstructionFileName(null);

    async function setFileName() {
      try {
        const filename = await getInstructionFilename();
        setInstructionFileName(filename);
      } catch {
        showToast({
          severity: 'error',
          message: tr.InstructionsDialog.fetchingError,
        });
      }
    }
    setFileName();
  }, [isOpen]);

  const allowedFilesRegex = /^data:(application)\/(pdf);base64,/;

  function readFileAsync(file: File) {
    return new Promise<string | ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = (error) => {
        reject(error);
      };
    });
  }

  return (
    <Dialog open={isOpen}>
      <DialogTitle>{tr.InstructionsDialog.uploadNewInstructions}</DialogTitle>
      <DialogContent>
        <DropZone
          maxFiles={1}
          fileCallback={async (files: File[]) => {
            try {
              const filesSize = files
                .map((file) => file.size)
                .reduce(
                  (prevValue, currentValue) => prevValue + currentValue,
                  0,
                );
              if (filesSize > MAX_FILE_SIZE) {
                showToast({
                  severity: 'error',
                  message: tr.InstructionsDialog.fileSizeLimitError.replace(
                    '{x}',
                    String(MEGAS),
                  ),
                });
                return;
              }
              const fileStrings = (await Promise.all(
                files.map((file: any) => readFileAsync(file)),
              )) as string[];

              const filesAreValid = !fileStrings
                .map((fileString: string) => allowedFilesRegex.test(fileString))
                .includes(false);

              if (filesAreValid) {
                setStagedFile(files[0]);
              } else {
                showToast({
                  severity: 'error',
                  message: tr.InstructionsDialog.wrongFileFormat,
                });
              }
            } catch (err) {
              showToast({
                severity: 'error',
                message: err?.message ?? tr.InstructionsDialog.fileUploadError,
              });
            }
          }}
        >
          {stagedFile && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <PaperclipIcon />
              <p>{stagedFile.name}</p>
            </div>
          )}
        </DropZone>
        {instructionFileName && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '20px',
              justifyContent: 'center',
              gap: '20px',
            }}
          >
            <Typography>
              {' '}
              {tr.InstructionsDialog.currentInstructions}:{' '}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<UploadIcon sx={{ color: 'currentColor' }} />}
              href="/api/file/instructions"
              download={instructionFileName}
            >
              {instructionFileName}
            </Button>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setIsOpen(false);
            setStagedFile(null);
            setInstructionFileName(null);
          }}
        >
          {tr.InstructionsDialog.cancel}
        </Button>
        <Button
          onClick={async () => {
            if (stagedFile) {
              await storeAdminInstructions(stagedFile);
              setIsOpen(false);
              setMenuOpen(false);
            }
          }}
        >
          {tr.InstructionsDialog.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
