import {
  SurveyFollowUpSection,
  SurveyFollowUpSectionParent,
} from '@interfaces/survey';
import { Box, Button, Divider, Typography } from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { ReactNode, useEffect, useRef, useState } from 'react';
import AddSurveySectionActions from '../AddSurveySectionActions';
import { FollowUpSectionConditions } from './FollowUpSectionConditions';
import { FollowUpSectionDetails } from './FollowUpSectionDetails';

interface Props {
  accordion: {
    icon: ReactNode;
    tooltip: string;
    form: ReactNode;
  };
  pageId: number;
  parentTitle: string;
  section: SurveyFollowUpSection;
  parentSection: SurveyFollowUpSectionParent;
  parentSectionIndex: number;
}

export function FollowUpSectionMenu({
  accordion,
  parentTitle,
  section,
  parentSection,
  pageId,
}: Props) {
  const { tr } = useTranslations();
  const { activeSurveyLoading, editFollowUpSection, deleteFollowUpSection } =
    useSurvey();
  const [loading, setLoading] = useState(true);
  const [sectionActionsOpen, setSectionActionsOpen] = useState(false);
  const buttonRef = useRef(null);

  function getFollowUpSectionLabel(type: typeof section.type) {
    const sectionTranslations = tr.SurveySection;

    const translationEntries: Record<
      typeof type,
      keyof typeof sectionTranslations
    > = {
      checkbox: 'checkBoxQuestion',
      attachment: 'attachmentSection',
      document: 'documentSection',
      'free-text': 'freeTextQuestion',
      'grouped-checkbox': 'groupedCheckboxQuestion',
      image: 'imageSection',
      map: 'mapQuestion',
      matrix: 'matrixQuestion',
      'multi-matrix': 'multiMatrixQuestion',
      numeric: 'numericQuestion',
      radio: 'radioQuestion',
      'radio-image': 'radioImageQuestion',
      slider: 'sliderQuestion',
      sorting: 'sortingQuestion',
      text: 'textSection',
      'personal-info': 'personalInfoQuestion',
      budgeting: 'budgetingQuestion',
      'geo-budgeting': 'geoBudgetingQuestion',
    };

    if (!Object.keys(translationEntries).includes(type))
      return sectionTranslations.question;

    return sectionTranslations[translationEntries[type]];
  }

  // Reflect loading status when e.g. the entire survey is being saved
  useEffect(() => {
    setLoading(activeSurveyLoading);
  }, [activeSurveyLoading]);

  return (
    <Box
      sx={{
        maxHeight: '960px',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        gap: 2,
        overflowY: 'auto',

        '& .MuiDivider-root': {
          color: '#BFBFBF',
          '&::before': {
            width: '0%',
          },
          '& .MuiDivider-wrapper': { paddingLeft: 0 },
          '& .MuiTypography-root': {
            color: '#7B7B7B',
            fontWeight: 700,
          },
        },
      }}
    >
      <Typography>
        {`${tr.FollowUpSection.title} `}
        <i>{parentTitle}</i>
      </Typography>
      <Divider orientation="horizontal">
        <Typography>{tr.FollowUpSection.conditions.title}</Typography>
      </Divider>
      <div>
        <FollowUpSectionConditions
          parentSection={parentSection}
          pageId={pageId}
          followUpSection={section}
        />
      </div>
      <Divider orientation="horizontal">
        <Typography>{getFollowUpSectionLabel(section.type)}</Typography>
      </Divider>
      {!sectionActionsOpen && section?.type ? (
        <FollowUpSectionDetails
          setDeleteConfirmDialogOpen={() =>
            deleteFollowUpSection(pageId, parentSection.id, section.id)
          }
          accordion={accordion}
          handleEdit={(section) =>
            editFollowUpSection(pageId, parentSection.id, section)
          }
          section={section}
        />
      ) : (
        <AddSurveySectionActions
          disabled={loading}
          onAdd={(section) => {
            editFollowUpSection(pageId, parentSection.id, section);
            setSectionActionsOpen(false);
          }}
          followUpSectionId={section.id}
        />
      )}
      {section?.type && (
        <Button
          ref={buttonRef}
          variant="contained"
          sx={{ marginLeft: 'auto' }}
          onClick={() => {
            setSectionActionsOpen((prev) => !prev);
            setTimeout(() => {
              buttonRef?.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
              });
            }, 500);
          }}
        >
          {!sectionActionsOpen && section?.type
            ? tr.FollowUpSection.changeType
            : tr.FollowUpSection.cancel}
        </Button>
      )}
    </Box>
  );
}
