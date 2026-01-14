import { FileAnswer, SurveyAttachmentQuestion } from '@interfaces/survey';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton, Typography } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';

import { useFileValidator } from '@src/utils/fileValidator';
import DropZone from './DropZone';

interface Props {
  value: FileAnswer[];
  onChange: (value: FileAnswer[]) => void;
  setDirty: (dirty: boolean) => void;
  question: SurveyAttachmentQuestion;
  readOnly: boolean;
}

const MEGAS = 10;

export default function AttachmentQuestion({
  value,
  setDirty,
  onChange,
  question,
  readOnly = false,
}: Props) {
  const { tr } = useTranslations();
  const fileValidator = useFileValidator();

  const allowedFilesRegex =
    /^data:(image|application|video)\/(png|jpg|jpeg|pdf|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|xlsx|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|docx|mp4|mkv|webm|avi|wmv|m4p|m4v|mpg|mpeg|m4v|mov);base64,/;

  const dropzoneContent = value?.length ? (
    <div>
      <Typography color="info"> {tr.AttachmentQuestion.addedFile}: </Typography>
      {value?.map((file, index) => {
        return (
          <div
            key={`file-upload-${index}`}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Typography color="primary"> {file.fileName} </Typography>
            <IconButton
              aria-label={tr.AttachmentQuestion.deleteUploadedFile}
              onClick={(event) => {
                event.stopPropagation();
                value.splice(index, 1);
                onChange(value);
              }}
            >
              {!readOnly && <DeleteIcon />}
            </IconButton>
          </div>
        );
      })}
    </div>
  ) : null;

  return (
    <div id={`${question.id}-input`}>
      <DropZone
        readOnly={readOnly}
        maxFiles={1}
        maxFileSize={MEGAS}
        fileCallback={async (files: File[]) => {
          await fileValidator(
            files,
            (fileAnswers) => {
              onChange(fileAnswers);
              setDirty(true);
            },
            allowedFilesRegex,
          );
        }}
      >
        {dropzoneContent}
      </DropZone>
      <Typography>{tr.AttachmentQuestion.attachmentFileFormats}</Typography>
    </div>
  );
}
