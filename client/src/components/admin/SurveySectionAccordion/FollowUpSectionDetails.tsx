import { SurveyPageSection } from '@interfaces/survey';

import {
  AccordionDetails,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
} from '@mui/material';
import RichTextEditor from '@src/components/RichTextEditor';
import { useTranslations } from '@src/stores/TranslationContext';
import { Dispatch, ReactNode, SetStateAction } from 'react';

interface Props {
  section: SurveyPageSection;
  handleEdit: (section: SurveyPageSection) => void;
  accordion: {
    icon: ReactNode;
    tooltip: string;
    form: ReactNode;
  };
  setDeleteConfirmDialogOpen: Dispatch<SetStateAction<boolean>>;
}

export function FollowUpSectionDetails({
  section,
  handleEdit,
  accordion,
  setDeleteConfirmDialogOpen,
}: Props) {
  const { tr, surveyLanguage, initializeLocalizedObject } = useTranslations();

  return (
    <AccordionDetails
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        backgroundColor: '#FDE1FF',
      }}
    >
      <TextField
        autoFocus
        label={tr.EditSurveyPage.title}
        value={section.title?.[surveyLanguage] ?? ''}
        variant="standard"
        onChange={(event) => {
          handleEdit({
            ...section,
            title: {
              ...section.title,
              [surveyLanguage]: event.target.value,
            },
          });
        }}
      />
      {accordion?.form}
      <FormGroup row>
        <FormControlLabel
          label={tr.SurveySections.sectionInfo}
          control={
            <Checkbox
              name="section-info"
              checked={section.showInfo ?? false}
              onChange={(event) => {
                handleEdit({
                  ...section,
                  showInfo: event.target.checked,
                  info: !event.target.checked
                    ? initializeLocalizedObject(null)
                    : section.info,
                });
              }}
            />
          }
        />
      </FormGroup>
      {section.showInfo && (
        <RichTextEditor
          value={section.info?.[surveyLanguage] ?? ''}
          label={tr.EditTextSection.text}
          onChange={(value) =>
            handleEdit({
              ...section,
              info: { ...section.info, [surveyLanguage]: value },
            })
          }
        />
      )}
      <FormGroup row>
        <Button
          variant="contained"
          onClick={() => {
            setDeleteConfirmDialogOpen(true);
          }}
        >
          {tr.EditSurveyPage.deleteSection}
        </Button>
      </FormGroup>
    </AccordionDetails>
  );
}
