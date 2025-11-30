import { SurveyFollowUpSection, SurveyPageSection } from '@interfaces/survey';
import { Fab, Grid, Tooltip, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import GeoBudgetingIcon from '@src/components/icons/GeoBudgetingIcon';
import { duplicateFiles } from '@src/controllers/AdminFileController';
import { useClipboard } from '@src/stores/ClipboardContext';
import { useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { isFeatureSupported } from '@src/utils/enabledFeatures';
import React, { ReactNode, useState } from 'react';
import { useParams } from 'react-router-dom';
import BudgetingIcon from '../icons/BudgetingIcon';
import CheckboxCheckedIcon from '../icons/CheckboxCheckedIcon';
import ClipboardSmallIcon from '../icons/ClipboardSmallIcon';
import DownloadFileIcon from '../icons/DownloadFileIcon';
import { ImageCheckIcon } from '../icons/ImageCheckIcon';
import ImageSmallIcon from '../icons/ImageSmallIcon';
import LikertGroupIcon from '../icons/LikertGroupIcon';
import MapIcon from '../icons/MapIcon';
import MatrixIcon from '../icons/MatrixIcon';
import MultiCheckmarkIcon from '../icons/MultiCheckmarkIcon';
import NumericFieldIcon from '../icons/NumericFieldIcon';
import OrderedIcon from '../icons/OrderedIcon';
import PaperclipIcon from '../icons/PaperclipIcon';
import PersonIcon from '../icons/PersonIcon';
import RadioButtonCheckedIcon from '../icons/RadioButtonCheckedIcon';
import SliderIcon from '../icons/SliderIcon';
import TextFieldIcon from '../icons/TextFieldIcon';
import TextSectionIcon from '../icons/TextSectionIcon';

const useStyles = makeStyles({
  actionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
});

interface Props {
  followUpSectionId?: number;
  types?: SurveyPageSection['type'][];
  disabled?: boolean;
  onAdd: (newSection: SurveyPageSection | SurveyFollowUpSection) => void;
  disableSectionPaste?: boolean;
}

export default function AddSurveySectionActions(props: Props) {
  const classes = useStyles();
  const { tr, initializeLocalizedObject } = useTranslations();
  const { addSection } = useSurvey();
  const { clipboardSection } = useClipboard();
  const { showToast } = useToasts();
  const { activeSurvey } = useSurvey();
  const { pageId } = useParams<{
    pageId: string;
  }>();

  const personalInfoDisabled = activeSurvey.pages.some((page) =>
    page.sections.some((section) => section.type === 'personal-info'),
  );

  // Sequence for making each section ID unique before they're added to database
  const [sectionSequence, setSectionSequence] = useState(-1);

  const defaultSections: {
    [type in SurveyPageSection['type']]: SurveyPageSection;
  } = {
    'personal-info': {
      type: 'personal-info',
      title: initializeLocalizedObject(''),
      isRequired: false,
      askName: false,
      askEmail: false,
      askPhone: false,
      askAddress: false,
      askCustom: false,
      customLabel: initializeLocalizedObject(''),
    },
    checkbox: {
      type: 'checkbox',
      title: initializeLocalizedObject(''),
      isRequired: false,
      info: null,
      options: [{ text: initializeLocalizedObject('') }],
      answerLimits: null,
      allowCustomAnswer: false,
    },
    radio: {
      type: 'radio',
      title: initializeLocalizedObject(''),
      isRequired: false,
      info: null,
      options: [{ text: initializeLocalizedObject('') }],
      allowCustomAnswer: false,
    },
    'radio-image': {
      type: 'radio-image',
      title: initializeLocalizedObject(''),
      isRequired: false,
      info: null,
      options: [
        {
          text: initializeLocalizedObject(''),
          imageUrl: null,
          altText: initializeLocalizedObject(''),
          attributions: '',
        },
      ],
      allowCustomAnswer: false,
    },
    numeric: {
      type: 'numeric',
      title: initializeLocalizedObject(''),
      isRequired: false,
      info: null,
      minValue: null,
      maxValue: null,
    },
    map: {
      type: 'map',
      title: initializeLocalizedObject(''),
      isRequired: false,
      info: null,
      selectionTypes: [],
      featureStyles: {
        point: {
          markerIcon: null,
        },
        line: {
          strokeStyle: null,
          strokeColor: null,
        },
        area: {
          strokeStyle: null,
          strokeColor: null,
        },
      },
      subQuestions: [],
    },
    'free-text': {
      type: 'free-text',
      isRequired: false,
      info: null,
      title: initializeLocalizedObject(''),
    },
    text: {
      type: 'text',
      title: initializeLocalizedObject(''),
      body: initializeLocalizedObject(''),
      bodyColor: '#000000',
      info: null,
    },
    sorting: {
      type: 'sorting',
      title: initializeLocalizedObject(''),
      options: [{ text: initializeLocalizedObject('') }],
      isRequired: false,
      info: null,
    },
    slider: {
      type: 'slider',
      isRequired: false,
      info: null,
      title: initializeLocalizedObject(''),
      presentationType: 'literal',
      minValue: 0,
      maxValue: 10,
      minLabel: initializeLocalizedObject(''),
      maxLabel: initializeLocalizedObject(''),
    },
    matrix: {
      type: 'matrix',
      isRequired: false,
      title: initializeLocalizedObject(''),
      info: null,
      classes: [],
      subjects: [],
      allowEmptyAnswer: false,
    },
    'multi-matrix': {
      type: 'multi-matrix',
      isRequired: false,
      title: initializeLocalizedObject(''),
      info: null,
      classes: [],
      subjects: [],
      allowEmptyAnswer: false,
      answerLimits: {
        min: 0,
        max: 1,
      },
    },
    'grouped-checkbox': {
      type: 'grouped-checkbox',
      isRequired: false,
      title: initializeLocalizedObject(''),
      answerLimits: {
        min: 0,
        max: 2,
      },
      groups: [],
    },
    image: {
      type: 'image',
      title: initializeLocalizedObject(''),
      fileUrl: null,
      altText: initializeLocalizedObject(''),
      attributions: '',
    },
    document: {
      type: 'document',
      title: initializeLocalizedObject(''),
      fileUrl: null,
    },
    attachment: {
      type: 'attachment',
      isRequired: false,
      title: initializeLocalizedObject(''),
      fileUrl: null,
    },
    budgeting: {
      type: 'budgeting',
      isRequired: false,
      title: initializeLocalizedObject(''),
      budgetingMode: 'direct',
      totalBudget: 0,
      unit: '€',
      targets: [],
      allocationDirection: 'increasing',
      requireFullAllocation: false,
      inputMode: 'absolute',
      helperText: initializeLocalizedObject(''),
    },
    'geo-budgeting': {
      type: 'geo-budgeting',
      isRequired: false,
      title: initializeLocalizedObject(''),
      totalBudget: 0,
      unit: '€',
      targets: [],
      allocationDirection: 'increasing',
      helperText: initializeLocalizedObject(''),
    },
  };

  function handleAdd(type: SurveyPageSection['type']) {
    return () => {
      const id = props.followUpSectionId ?? sectionSequence;
      if (!props.followUpSectionId) setSectionSequence(sectionSequence - 1);
      props.onAdd({
        ...defaultSections[type],
        id,
      });
    };
  }

  const questionButtons: {
    type: SurveyPageSection['type'];
    label: string;
    ariaLabel: string;
    icon: ReactNode;
  }[] = [
    {
      type: 'personal-info',
      label: tr.AddSurveySectionActions.personalInfoQuestion,
      ariaLabel: 'add-personal-info-section',
      icon: <PersonIcon />,
    },
    {
      type: 'radio',
      label: tr.AddSurveySectionActions.radioQuestion,
      ariaLabel: 'add-radio-question',
      icon: <RadioButtonCheckedIcon />,
    },
    {
      type: 'radio-image',
      label: tr.AddSurveySectionActions.radioImageQuestion,
      ariaLabel: 'add-radio-image-question',
      icon: <ImageCheckIcon />,
    },
    {
      type: 'checkbox',
      label: tr.AddSurveySectionActions.checkBoxQuestion,
      ariaLabel: 'add-checkbox-question',
      icon: <CheckboxCheckedIcon />,
    },
    {
      type: 'free-text',
      label: tr.AddSurveySectionActions.freeTextQuestion,
      ariaLabel: 'add-free-text-question',
      icon: <TextFieldIcon />,
    },
    {
      type: 'numeric',
      label: tr.AddSurveySectionActions.numericQuestion,
      ariaLabel: 'add-numeric-question',
      icon: <NumericFieldIcon />,
    },
    {
      type: 'map',
      label: tr.AddSurveySectionActions.mapQuestion,
      ariaLabel: 'add-map-question',
      icon: <MapIcon />,
    },
    {
      type: 'sorting',
      label: tr.AddSurveySectionActions.sortingQuestion,
      ariaLabel: 'add-sorting-question',
      icon: <OrderedIcon />,
    },
    {
      type: 'slider',
      label: tr.AddSurveySectionActions.sliderQuestion,
      ariaLabel: 'add-slider-question',
      icon: <SliderIcon />,
    },
    {
      type: 'matrix',
      label: tr.AddSurveySectionActions.matrixQuestion,
      ariaLabel: 'add-matrix-question',
      icon: <MatrixIcon />,
    },
    {
      type: 'multi-matrix',
      label: tr.AddSurveySectionActions.multiMatrixQuestion,
      ariaLabel: 'add-multiple-choice-matrix-question',
      icon: <LikertGroupIcon />,
    },
    {
      type: 'grouped-checkbox',
      label: tr.AddSurveySectionActions.groupedCheckboxQuestion,
      ariaLabel: 'add-grouped-checkbox-question',
      icon: <MultiCheckmarkIcon />,
    },
    {
      type: 'attachment',
      label: tr.AddSurveySectionActions.attachmentSection,
      ariaLabel: 'add-attachment-section',
      icon: <PaperclipIcon />,
    },
    ...(isFeatureSupported('budgetingQuestion')
      ? [
          {
            type: 'budgeting',
            label: tr.AddSurveySectionActions.budgetingQuestion,
            ariaLabel: 'add-budgeting-section',
            icon: <BudgetingIcon />,
          } as const,
          {
            type: 'geo-budgeting',
            label: tr.AddSurveySectionActions.geoBudgetingQuestion,
            ariaLabel: 'add-geo-budgeting-section',
            icon: <GeoBudgetingIcon />,
          } as const,
        ]
      : []),
  ];

  const sectionButtons: {
    type: SurveyPageSection['type'];
    label: string;
    ariaLabel: string;
    icon: ReactNode;
  }[] = [
    {
      type: 'text',
      label: tr.AddSurveySectionActions.textSection,
      ariaLabel: 'add-text-section',
      icon: <TextSectionIcon />,
    },
    {
      type: 'image',
      label: tr.AddSurveySectionActions.imageSection,
      ariaLabel: 'add-image-section',
      icon: <ImageSmallIcon />,
    },
    {
      type: 'document',
      label: tr.AddSurveySectionActions.documentSection,
      ariaLabel: 'add-document-section',
      icon: <DownloadFileIcon />,
    },
  ];

  return (
    <Grid container>
      <Grid container direction="row">
        <Grid item xs={12} md={6}>
          {questionButtons
            .filter(
              (button) => !props.types || props.types.includes(button.type),
            )
            .map((button) => (
              <Grid item key={button.type} style={{ padding: '0.5rem' }}>
                <div className={classes.actionItem}>
                  <Tooltip
                    title={
                      personalInfoDisabled && button.type === 'personal-info'
                        ? tr.AddSurveySectionActions.personalInfoDisabled
                        : ''
                    }
                    placement="left"
                  >
                    <span>
                      <Fab
                        color="primary"
                        aria-label={button.ariaLabel}
                        size="small"
                        onClick={handleAdd(button.type)}
                        disabled={
                          props.disabled ||
                          (button.type === 'personal-info' &&
                            personalInfoDisabled)
                        }
                        style={{ minWidth: '40px' }}
                        sx={{ boxShadow: 'none' }}
                      >
                        {button.icon}
                      </Fab>
                    </span>
                  </Tooltip>

                  <Typography>{button.label}</Typography>
                </div>
              </Grid>
            ))}
        </Grid>
        <Grid item xs={12} md={6}>
          {sectionButtons
            .filter(
              (button) => !props.types || props.types.includes(button.type),
            )
            .map((button) => (
              <Grid item key={button.type} style={{ padding: '0.5rem' }}>
                <div className={classes.actionItem}>
                  <Fab
                    color="primary"
                    aria-label={button.ariaLabel}
                    size="small"
                    onClick={handleAdd(button.type)}
                    disabled={props.disabled}
                    sx={{ boxShadow: 'none' }}
                  >
                    {button.icon}
                  </Fab>
                  <Typography>{button.label}</Typography>
                </div>
              </Grid>
            ))}
          {!props.disableSectionPaste && (
            <Grid item style={{ padding: '0.5rem' }}>
              <div className={classes.actionItem}>
                <Fab
                  disabled={!clipboardSection}
                  color="secondary"
                  aria-label={'attach-section-from-clipboard'}
                  size="small"
                  sx={{ boxShadow: 'none' }}
                  onClick={async () => {
                    // Copy content from Clipboard context to active survey
                    if (clipboardSection) {
                      const duplicatedFiles: SurveyPageSection =
                        await duplicateFiles(
                          structuredClone(clipboardSection),
                          activeSurvey,
                        );

                      addSection(Number(pageId), {
                        ...duplicatedFiles,
                        id: sectionSequence,
                      });

                      setSectionSequence((prev) => prev - 1);

                      if (clipboardSection.type === 'map') {
                        showToast({
                          severity: 'warning',
                          autoHideDuration: 30000,
                          message: tr.EditSurveyPage.sectionAttached,
                        });
                      }
                    }
                  }}
                >
                  <ClipboardSmallIcon />
                </Fab>
                <Typography>{tr.EditSurveyPage.attachSection}</Typography>
              </div>
            </Grid>
          )}
          <Grid
            item
            style={{
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          ></Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
