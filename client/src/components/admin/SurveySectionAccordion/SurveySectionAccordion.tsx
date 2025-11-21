import {
  Conditions,
  SurveyBudgetingQuestion,
  SurveyCheckboxQuestion,
  SurveyDocumentSection,
  SurveyFollowUpSection,
  SurveyFreeTextQuestion,
  SurveyGeoBudgetingQuestion,
  SurveyGroupedCheckboxQuestion,
  SurveyImageSection,
  SurveyMapQuestion,
  SurveyMatrixQuestion,
  SurveyMultiMatrixQuestion,
  SurveyNumericQuestion,
  SurveyPageSection,
  SurveyPersonalInfoQuestion,
  SurveyRadioImageQuestion,
  SurveyRadioQuestion,
  SurveySliderQuestion,
  SurveySortingQuestion,
  SurveyTextSection,
} from '@interfaces/survey';
import { Person } from '@mui/icons-material';
import {
  Accordion,
  AccordionSummary,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import EditBudgetingQuestion from '@src/components/admin/EditBudgetingQuestion';
import { EditGeoBudgetingQuestion } from '@src/components/admin/EditGeoBudgetingQuestion';
import BudgetingIcon from '@src/components/icons/BudgetingIcon';
import CheckboxCheckedIcon from '@src/components/icons/CheckboxCheckedIcon';
import ChevronDownIcon from '@src/components/icons/ChevronDownIcon';
import DocumentCopyIcon from '@src/components/icons/DocumentCopyIcon';
import DownloadFileIcon from '@src/components/icons/DownloadFileIcon';
import DraggableIcon from '@src/components/icons/DraggableIcon';
import { ImageCheckIcon } from '@src/components/icons/ImageCheckIcon';
import ImageSmallIcon from '@src/components/icons/ImageSmallIcon';
import LikertGroupIcon from '@src/components/icons/LikertGroupIcon';
import MapIcon from '@src/components/icons/MapIcon';
import MatrixIcon from '@src/components/icons/MatrixIcon';
import MultiCheckmarkIcon from '@src/components/icons/MultiCheckmarkIcon';
import NumericFieldIcon from '@src/components/icons/NumericFieldIcon';
import OrderedIcon from '@src/components/icons/OrderedIcon';
import PaperclipIcon from '@src/components/icons/PaperclipIcon';
import RadioButtonCheckedIcon from '@src/components/icons/RadioButtonCheckedIcon';
import SliderIcon from '@src/components/icons/SliderIcon';
import TextFieldIcon from '@src/components/icons/TextFieldIcon';
import TextSectionIcon from '@src/components/icons/TextSectionIcon';
import { useClipboard } from '@src/stores/ClipboardContext';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import {
  replaceIdsWithNull,
  replaceTranslationsWithNull,
} from '@src/utils/schemaValidation';
import React, { ReactNode, useMemo, useRef, useState } from 'react';
import { DraggableProvided } from 'react-beautiful-dnd';
import ConfirmDialog from '../../ConfirmDialog';
import EditAttachmentSection from '../EditAttachmentSection';
import EditCheckBoxQuestion from '../EditCheckBoxQuestion';
import EditDocumentSection from '../EditDocumentSection';
import EditFreeTextQuestion from '../EditFreeTextQuestion';
import EditGroupedCheckBoxQuestion from '../EditGroupedCheckBoxQuestion';
import EditImageSection from '../EditImageSection';
import EditMapQuestion from '../EditMapQuestion';
import EditMatrixQuestion from '../EditMatrixQuestion';
import { EditMultiMatrixQuestion } from '../EditMultiMatrixQuestion';
import EditNumericQuestion from '../EditNumericQuestion';
import { EditPersonalInfoQuestion } from '../EditPersonalInfoQuestion';
import EditRadioImageQuestion from '../EditRadioImageQuestion';
import EditRadioQuestion from '../EditRadioQuestion';
import EditSliderQuestion from '../EditSliderQuestion';
import EditSortingQuestion from '../EditSortingQuestion';
import EditTextSection from '../EditTextSection';
import { SectionDetails } from './SectionDetails';

const useStyles = makeStyles({
  accordion: {
    background: '#ddd',
  },
  sectionTitle: {
    marginLeft: '0.5rem',
    flexGrow: 1,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  answerLimitInput: {
    marginRight: '1rem',
  },
  customAccordionSummary: {
    flexDirection: 'row-reverse',
    margin: 0,
  },
  contentGutters: {
    alignItems: 'center',
    margin: 0,
  },
});

interface Props {
  index: number;
  section: SurveyPageSection;
  expanded: boolean;
  className?: string;
  disabled?: boolean;
  onExpandedChange: (isExpanded: boolean) => void;
  name: string;
  onEdit: (index: number, section: SurveyPageSection) => void;
  onDelete: (index: number) => void;
  provided: DraggableProvided;
  disableSectionCopying?: boolean;
  pageId?: number;
}

export default function SurveySectionAccordion(props: Props) {
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const classes = useStyles();
  const { tr, surveyLanguage } = useTranslations();
  const { setSection, clipboardPage } = useClipboard();
  const { showToast } = useToasts();

  // Index is used inside a callback function -> useRef is required in React to catch all updates
  const indexRef = useRef<number>(null);
  indexRef.current = props.index;

  function handleEdit(section: SurveyPageSection) {
    props.onEdit(indexRef.current, section);
  }

  function handleDelete() {
    props.onDelete(indexRef.current);
  }

  const accordions: {
    [type in SurveyPageSection['type']]: {
      icon: ReactNode;
      tooltip: string;
      form: ReactNode;
    };
  } = {
    'personal-info': {
      icon: <Person />,
      tooltip: tr.SurveySection.personalInfoQuestion,
      form: (
        <EditPersonalInfoQuestion
          section={props.section as SurveyPersonalInfoQuestion}
          onChange={handleEdit}
        />
      ),
    },
    checkbox: {
      icon: <CheckboxCheckedIcon />,
      tooltip: tr.SurveySection.checkBoxQuestion,
      form: (
        <EditCheckBoxQuestion
          disabled={props.disabled}
          section={props.section as SurveyCheckboxQuestion}
          onChange={handleEdit}
        />
      ),
    },
    radio: {
      icon: <RadioButtonCheckedIcon />,
      tooltip: tr.SurveySection.radioQuestion,
      form: (
        <EditRadioQuestion
          disabled={props.disabled}
          section={props.section as SurveyRadioQuestion}
          onChange={handleEdit}
        />
      ),
    },
    'radio-image': {
      icon: <ImageCheckIcon />,
      tooltip: tr.SurveySection.radioImageQuestion,
      form: (
        <EditRadioImageQuestion
          disabled={props.disabled}
          section={props.section as SurveyRadioImageQuestion}
          onChange={handleEdit}
        />
      ),
    },

    numeric: {
      icon: <NumericFieldIcon />,
      tooltip: tr.SurveySection.numericQuestion,
      form: (
        <EditNumericQuestion
          disabled={props.disabled}
          section={props.section as SurveyNumericQuestion}
          onChange={handleEdit}
        />
      ),
    },
    map: {
      icon: <MapIcon />,
      tooltip: tr.SurveySection.mapQuestion,
      form: (
        <EditMapQuestion
          disabled={props.disabled}
          section={props.section as SurveyMapQuestion}
          onChange={handleEdit}
        />
      ),
    },
    'free-text': {
      icon: <TextFieldIcon />,
      tooltip: tr.SurveySection.freeTextQuestion,
      form: (
        <EditFreeTextQuestion
          disabled={props.disabled}
          section={props.section as SurveyFreeTextQuestion}
          onChange={handleEdit}
        />
      ),
    },
    text: {
      icon: <TextSectionIcon />,
      tooltip: tr.SurveySection.textSection,
      form: (
        <EditTextSection
          disabled={props.disabled}
          section={props.section as SurveyTextSection}
          onChange={handleEdit}
        />
      ),
    },
    sorting: {
      icon: <OrderedIcon />,
      tooltip: tr.SurveySection.sortingQuestion,
      form: (
        <EditSortingQuestion
          disabled={props.disabled}
          section={props.section as SurveySortingQuestion}
          onChange={handleEdit}
        />
      ),
    },
    slider: {
      icon: <SliderIcon />,
      tooltip: tr.SurveySection.sliderQuestion,
      form: (
        <EditSliderQuestion
          disabled={props.disabled}
          section={props.section as SurveySliderQuestion}
          onChange={handleEdit}
        />
      ),
    },
    matrix: {
      icon: <MatrixIcon />,
      tooltip: tr.SurveySection.matrixQuestion,
      form: (
        <EditMatrixQuestion
          section={props.section as SurveyMatrixQuestion}
          onChange={handleEdit}
        />
      ),
    },
    'multi-matrix': {
      icon: <LikertGroupIcon />,
      tooltip: tr.SurveySection.multiMatrixQuestion,
      form: (
        <EditMultiMatrixQuestion
          disabled={props.disabled}
          section={props.section as SurveyMultiMatrixQuestion}
          onChange={handleEdit}
        />
      ),
    },
    'grouped-checkbox': {
      icon: <MultiCheckmarkIcon />,
      tooltip: tr.SurveySection.groupedCheckboxQuestion,
      form: (
        <EditGroupedCheckBoxQuestion
          disabled={props.disabled}
          section={props.section as SurveyGroupedCheckboxQuestion}
          onChange={handleEdit}
        />
      ),
    },
    image: {
      icon: <ImageSmallIcon />,
      tooltip: tr.SurveySection.imageSection,
      form: (
        <EditImageSection
          section={props.section as SurveyImageSection}
          onChange={handleEdit}
          disabled={props.disabled}
        />
      ),
    },
    document: {
      icon: <DownloadFileIcon />,
      tooltip: tr.SurveySection.documentSection,
      form: (
        <EditDocumentSection
          section={props.section as SurveyDocumentSection}
          onChange={handleEdit}
          disabled={props.disabled}
        />
      ),
    },
    attachment: {
      icon: <PaperclipIcon />,
      tooltip: tr.SurveySection.attachmentSection,
      form: <EditAttachmentSection />,
    },
    budgeting: {
      icon: <BudgetingIcon />,
      tooltip: tr.SurveySection.budgetingQuestion,
      form: (
        <EditBudgetingQuestion
          section={props.section as SurveyBudgetingQuestion}
          onChange={handleEdit}
        />
      ),
    },
    'geo-budgeting': {
      icon: <></>,
      tooltip: tr.SurveySection.geoBudgetingQuestion,
      form: (
        <EditGeoBudgetingQuestion
          section={props.section as SurveyGeoBudgetingQuestion}
          onChange={handleEdit}
        />
      ),
    },
  };

  const accordion = useMemo(() => {
    return accordions[props.section.type];
  }, [props.section, props.disabled]);

  return (
    <>
      <Accordion
        ref={props.provided.innerRef}
        expanded={props.expanded}
        onChange={(_, isExpanded) => {
          props.onExpandedChange(isExpanded);
        }}
        className={`${props.className ?? classes.accordion} section-accordion-${
          props.expanded ? 'expanded' : 'collapsed'
        }`}
      >
        <AccordionSummary
          expandIcon={<ChevronDownIcon />}
          aria-controls={`${props.name}-content`}
          id={`${props.name}-header`}
          className={classes.customAccordionSummary}
          classes={{ contentGutters: classes.contentGutters }}
        >
          <div style={{ display: 'flex', paddingLeft: '1rem' }}>
            {accordion.tooltip ? (
              <Tooltip title={accordion.tooltip}>
                <span>{accordion.icon as any}</span>
              </Tooltip>
            ) : (
              accordion.icon
            )}
          </div>

          <Typography className={classes.sectionTitle}>
            {props.section.title?.[surveyLanguage] || (
              <em>{tr.EditSurveyPage.untitledSection}</em>
            )}
          </Typography>
          {!props.disableSectionCopying && (
            <IconButton
              onClick={async (event) => {
                event.stopPropagation();
                event.preventDefault();

                // Remove all IDs from the section JSON to prevent unwanted references
                // Create deep copy to avoid unwanted side effects on original

                const deepCopy = replaceTranslationsWithNull(
                  replaceIdsWithNull({
                    ...structuredClone(props.section),
                  }),
                );
                const copiedSurveySection: SurveyPageSection = {
                  ...deepCopy,
                  followUpSections: deepCopy.followUpSections?.map(
                    (fus: SurveyFollowUpSection) => {
                      return {
                        ...fus,
                        conditions: {
                          equals: [],
                          lessThan: [],
                          greaterThan: [],
                        } as Conditions,
                      };
                    },
                  ),
                };
                // Store section to locale storage for other browser tabs to get access to it
                localStorage.setItem(
                  'clipboard-content',
                  JSON.stringify({
                    clipboardSection: copiedSurveySection,
                    clipboardPage,
                  }),
                );
                // Store section to context for the currently active browser tab to get access to it
                setSection(copiedSurveySection);
                showToast({
                  message: tr.EditSurveyPage.sectionCopied,
                  severity: 'success',
                });
              }}
            >
              <DocumentCopyIcon htmlColor="#000000DD" />
            </IconButton>
          )}
          <div {...props.provided.dragHandleProps} style={{ display: 'flex' }}>
            <DraggableIcon color="disabled" />
          </div>
        </AccordionSummary>
        <SectionDetails
          pageId={props.pageId}
          disabled={props.disabled}
          section={props.section}
          handleEdit={handleEdit}
          accordion={accordion}
          setDeleteConfirmDialogOpen={setDeleteConfirmDialogOpen}
        />
      </Accordion>
      <ConfirmDialog
        open={deleteConfirmDialogOpen}
        text={tr.EditSurveyPage.confirmDeleteSection}
        submitColor="error"
        onClose={(result) => {
          setDeleteConfirmDialogOpen(false);
          if (result) {
            handleDelete();
          }
        }}
      />
    </>
  );
}
