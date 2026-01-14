import { SurveyFollowUpSection, SurveyPageSection } from '@interfaces/survey';
import {
  AccordionDetails,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Tooltip,
} from '@mui/material';
import RichTextEditor from '@src/components/RichTextEditor';
import { NewLineIcon } from '@src/components/icons/NewLineIcon';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { Dispatch, ReactNode, SetStateAction, useState } from 'react';

interface Props {
  disabled: boolean;
  section: SurveyPageSection;
  handleEdit: (section: SurveyPageSection) => void;
  accordion: {
    icon: ReactNode;
    tooltip: string;
    form: ReactNode;
  };
  setDeleteConfirmDialogOpen: Dispatch<SetStateAction<boolean>>;
  pageId?: number;
}

export function SectionDetails({
  disabled,
  section,
  handleEdit,
  accordion,
  setDeleteConfirmDialogOpen,
  pageId,
}: Props) {
  const { tr, surveyLanguage, initializeLocalizedObject } = useTranslations();
  const { addFollowUpSection } = useSurvey();
  // Sequence for making each follow-up section ID unique before they're added to database
  const [followUpSectionSequence, setFollowUpSectionSequence] = useState(-1);

  const defaultFollowUpSection: SurveyFollowUpSection = {
    type: 'radio',
    options: [],
    allowCustomAnswer: false,
    isRequired: false,
    title: null,
    conditions: { equals: [], lessThan: [], greaterThan: [] },
    id: followUpSectionSequence,
  };

  return (
    <AccordionDetails
      data-testid={`section${section.id}`}
      sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <TextField
        autoFocus
        disabled={disabled}
        label={tr.EditSurveyPage.title}
        value={section.title?.[surveyLanguage] ?? null}
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
      {accordion.form}
      <FormGroup row>
        <FormControlLabel
          label={tr.SurveySections.sectionInfo}
          control={
            <Checkbox
              name="section-info"
              checked={section.showInfo ?? false}
              onChange={(event) =>
                handleEdit({
                  ...section,
                  showInfo: event.target.checked,
                  info: !event.target.checked
                    ? initializeLocalizedObject(null)
                    : section.info,
                })
              }
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
          disabled={disabled}
          onClick={() => {
            setDeleteConfirmDialogOpen(true);
          }}
        >
          {tr.EditSurveyPage.deleteSection}
        </Button>
        {['radio', 'checkbox', 'numeric', 'slider'].includes(section.type) &&
          // no button for subquestions
          // pageId should not be passed for map subquestions
          pageId && (
            <Tooltip
              sx={{ display: section.id < 0 ? 'none' : '' }}
              title={tr.EditSurveyPage.addFollowUpButtonTile}
            >
              <span style={{ marginLeft: 'auto' }}>
                <Button
                  disabled={section.id < 0} // no follow-up sections for draft questions
                  onClick={() => {
                    addFollowUpSection(
                      pageId,
                      section.id,
                      defaultFollowUpSection,
                    );
                    setFollowUpSectionSequence((prev) => prev - 1);
                  }}
                  startIcon={<NewLineIcon />}
                  variant="contained"
                >
                  {tr.EditSurveyPage.addFollowUpQuestion}
                </Button>
              </span>
            </Tooltip>
          )}
      </FormGroup>
    </AccordionDetails>
  );
}
