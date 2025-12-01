import {
  SurveyBudgetingQuestion,
  SurveyCheckboxQuestion,
  SurveyDocumentSection,
  SurveyFollowUpSection,
  SurveyFollowUpSectionParent,
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
  Tooltip,
  Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import CheckboxCheckedIcon from '@src/components/icons/CheckboxCheckedIcon';
import ChevronDownIcon from '@src/components/icons/ChevronDownIcon';
import DownloadFileIcon from '@src/components/icons/DownloadFileIcon';
import DraggableIcon from '@src/components/icons/DraggableIcon';
import { FollowUpListItemIcon } from '@src/components/icons/FollowUpListItemIcon';
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
import { useTranslations } from '@src/stores/TranslationContext';
import { ReactNode, useMemo, useRef, useState } from 'react';
import { DraggableProvided } from 'react-beautiful-dnd';
import ConfirmDialog from '../../ConfirmDialog';
import EditAttachmentSection from '../EditAttachmentSection';
import EditBudgetingQuestion from '../EditBudgetingQuestion';
import EditCheckBoxQuestion from '../EditCheckBoxQuestion';
import EditDocumentSection from '../EditDocumentSection';
import EditFreeTextQuestion from '../EditFreeTextQuestion';
import { EditGeoBudgetingQuestion } from '../EditGeoBudgetingQuestion';
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
import { FollowUpSectionMenu } from './FollowUpSectionMenu';

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
  pageId: number;
  isLastItem: boolean;
  index: number;
  parentSectionIndex: number;
  section: SurveyFollowUpSection;
  parentSection: SurveyFollowUpSectionParent;
  expanded: boolean;
  className?: string;
  disabled?: boolean;
  onExpandedChange: (isExpanded: boolean) => void;
  name: string;
  onEdit: (section: SurveyPageSection | SurveyFollowUpSection) => void;
  onDelete: (index: number) => void;
  provided: DraggableProvided;
}

export function FollowUpSectionAccordion(props: Props) {
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const classes = useStyles();
  const { tr, surveyLanguage } = useTranslations();

  // Index is used inside a callback function -> useRef is required in React to catch all updates
  const indexRef = useRef<number>(null);
  indexRef.current = props.index;

  function handleEdit(section: SurveyPageSection | SurveyFollowUpSection) {
    props.onEdit(section);
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
        />
      ),
    },
    attachment: {
      icon: <PaperclipIcon />,
      tooltip: tr.SurveySection.attachmentSection,
      form: <EditAttachmentSection />,
    },
    budgeting: {
      icon: <PaperclipIcon />,
      tooltip: tr.SurveySection.budgetingQuestion,
      form: (
        <EditBudgetingQuestion
          section={props.section as SurveyBudgetingQuestion}
          onChange={handleEdit}
        />
      ),
    },
    'geo-budgeting': {
      icon: <MapIcon />,
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
        className={`${
          props.className ?? classes.accordion
        } follow-up-section-accordion-${
          props.expanded ? 'expanded' : 'collapsed'
        }`}
        style={{ backgroundColor: '#FDE1FF' }}
      >
        <AccordionSummary
          expandIcon={<ChevronDownIcon />}
          aria-controls={`${props.name}-content`}
          id={`${props.name}-header`}
          className={classes.customAccordionSummary}
          classes={{ contentGutters: classes.contentGutters }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '1rem',
            }}
          >
            {accordion?.tooltip ? (
              <Tooltip title={accordion.tooltip}>
                <div style={{ display: 'flex' }}>
                  <FollowUpListItemIcon lastItem={props.isLastItem} />
                  {accordion.icon as any}
                </div>
              </Tooltip>
            ) : (
              <div style={{ display: 'flex' }}>
                <FollowUpListItemIcon lastItem={props.isLastItem} />
                {accordion?.icon}
              </div>
            )}
          </div>

          <Typography className={classes.sectionTitle}>
            {props.section.title?.[surveyLanguage] || (
              <em>{tr.EditSurveyPage.untitledSection}</em>
            )}
          </Typography>
          <div {...props.provided.dragHandleProps} style={{ display: 'flex' }}>
            <DraggableIcon />
          </div>
        </AccordionSummary>

        <FollowUpSectionMenu
          accordion={accordion}
          pageId={props.pageId}
          section={props.section}
          parentTitle={props.parentSection?.title?.[surveyLanguage]}
          parentSection={props.parentSection}
          parentSectionIndex={props.parentSectionIndex}
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
