import {
  GeoBudgetingAnswer,
  SurveyGeoBudgetingQuestion,
  SurveyMapQuestion,
} from '@interfaces/survey';
import {
  Box,
  FormHelperText,
  LinearProgress,
  linearProgressClasses,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useSurveyMap } from '@src/stores/SurveyMapContext';
import { useTranslations } from '@src/stores/TranslationContext';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MarkdownView } from './MarkdownView';
import GeoBudgetingTargetButton from './GeoBudgetingTargetButton';
import GeoBudgetingFeatureDialog from './GeoBudgetingFeatureDialog';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  value: GeoBudgetingAnswer[];
  onChange: (value: GeoBudgetingAnswer[]) => void;
  question: SurveyGeoBudgetingQuestion;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  readOnly?: boolean;
  validationErrors?: string[];
}

export default function GeoBudgetingQuestion({
  value,
  onChange,
  question,
  setDialogOpen,
  readOnly = false,
  validationErrors = [],
}: Props) {
  const { tr, surveyLanguage, language } = useTranslations();
  const theme = useTheme();
  const {
    draw,
    isMapReady,
    editingMapAnswer,
    stopEditingMapAnswer,
    stopDrawing,
    onModify,
    questionId: mapContextQuestionId,
  } = useSurveyMap();

  const [activeTargetId, setActiveTargetId] = useState<number | null>(null);
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [editingAnswerIndex, setEditingAnswerIndex] = useState<number | null>(
    null,
  );
  const [drawingCancelled, setDrawingCancelled] = useState(false);
  const drawingCancelledRef = useRef(drawingCancelled);

  const valueRef = useRef<GeoBudgetingAnswer[]>(value);
  valueRef.current = value;

  // Calculate count per target
  const countPerTarget = useMemo(() => {
    const counts: number[] = question.targets.map(() => 0);
    value.forEach((answer) => {
      counts[answer.targetId]++;
    });
    return counts;
  }, [value, question.targets]);

  // Calculate total budget used
  const totalUsedBudget = useMemo(() => {
    return value.reduce((sum, answer) => {
      const target = question.targets[answer.targetId];
      return sum + (target.price ?? 0);
    }, 0);
  }, [value, question.targets]);

  const remainingBudget = question.totalBudget - totalUsedBudget;

  // Formatter for numbers
  const numberFormatter = new Intl.NumberFormat(
    language === 'fi' ? 'fi-FI' : language === 'se' ? 'sv-SE' : 'en-US',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
  );

  // Handle feature click from map (edit dialog trigger)
  useEffect(() => {
    if (!editingMapAnswer) {
      return;
    }

    if (editingMapAnswer.questionId === question.id) {
      setEditingAnswerIndex(editingMapAnswer.index ?? null);
      setFeatureDialogOpen(true);
      setDialogOpen(true);
    }
  }, [editingMapAnswer, question.id, setDialogOpen]);

  // Reset active target when a different question starts drawing
  // This ensures that only one question can have an active button at a time
  useEffect(() => {
    // If a DIFFERENT question is currently drawing, reset our active target button state
    if (mapContextQuestionId !== null && mapContextQuestionId !== question.id) {
      setActiveTargetId(null);
    }
  }, [mapContextQuestionId, question.id]);

  // Listen to any geometry changes during modification
  useEffect(() => {
    if (!isMapReady || question.id == null) {
      return;
    }
    const unregisterEventHandler = onModify(question.id, (features) => {
      onChange(
        valueRef.current.map((answer, index) => ({
          ...answer,
          geometry: features[index] as any,
        })),
      );
    });
    // On unmount unregister the event handler
    return () => {
      unregisterEventHandler();
    };
  }, [isMapReady, question.id, onModify]);

  // Handle target button click - trigger drawing
  const handleTargetSelect = async (targetId: number) => {
    if (!isMapReady || readOnly) {
      return;
    }

    setActiveTargetId(targetId);
    setDrawingCancelled(false);

    // Create a compatible question object for map drawing
    const target = question.targets[targetId];
    const drawQuestion: SurveyMapQuestion = {
      id: question.id,
      title: question.title,
      type: 'map',
      isRequired: question.isRequired,
      selectionTypes: ['point'],
      featureStyles: {
        point: {
          markerIcon: target.icon ?? '',
        },
        line: {
          strokeStyle: 'solid',
          strokeColor: '#000000',
        },
        area: {
          strokeStyle: 'solid',
          strokeColor: '#000000',
        },
      },
      subQuestions: [],
    };

    try {
      const geometry = await draw('point', drawQuestion);

      if (drawingCancelledRef.current || !geometry) {
        setActiveTargetId(null);
        return;
      }

      // Stop drawing to clear visual features from the map
      // (GeoBudgetingQuestion has no subquestions, so we clear immediately)
      stopDrawing();

      // Add new answer (geometry is already a Feature<Point> with CRS)
      onChange([
        ...valueRef.current,
        {
          targetId,
          geometry: geometry as any,
        },
      ]);

      setActiveTargetId(null);
    } catch (error) {
      console.error('Error drawing geometry:', error);
      setActiveTargetId(null);
    }
  };

  // Handle delete button click from feature dialog - open confirmation
  const handleDeleteFeatureClick = () => {
    setDeleteConfirmDialogOpen(true);
  };

  // Handle confirmed deletion
  const handleDeleteConfirmed = (confirmed: boolean) => {
    if (confirmed && editingAnswerIndex !== null) {
      onChange(value.filter((_, index) => index !== editingAnswerIndex));
    }
    setDeleteConfirmDialogOpen(false);
    setFeatureDialogOpen(false);
    setDialogOpen(false);
    stopEditingMapAnswer();
  };

  // Sync featureDialogOpen with parent setDialogOpen
  useEffect(() => {
    setDialogOpen(featureDialogOpen);
  }, [featureDialogOpen, setDialogOpen]);

  return (
    <>
      <div id={`${question.id}-input`}>
        <MarkdownView>{question.helperText?.[language] ?? ''}</MarkdownView>

        {/* Budget Display */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, mt: 2 }}
        >
          <Stack alignItems="center" sx={{ minWidth: '80px' }}>
            <Typography variant="caption" color="text.secondary">
              {tr.BudgetingQuestion.used}
            </Typography>
            <Typography variant="body2">
              {numberFormatter.format(totalUsedBudget)} {question.unit}
            </Typography>
          </Stack>

          <LinearProgress
            value={
              question.allocationDirection === 'increasing'
                ? (totalUsedBudget / question.totalBudget) * 100
                : (remainingBudget / question.totalBudget) * 100
            }
            variant="determinate"
            sx={{
              flex: 1,
              height: 16,
              borderRadius: 8,
              [`&.${linearProgressClasses.colorPrimary}`]: {
                backgroundColor: theme.palette.grey[200],
              },
              [`& .${linearProgressClasses.bar}`]: {
                transitionDuration: '0s',
              },
            }}
          />

          <Stack alignItems="center" sx={{ minWidth: '80px' }}>
            <Typography variant="caption" color="text.secondary">
              {tr.BudgetingQuestion.remaining}
            </Typography>
            <Typography variant="body2">
              {numberFormatter.format(remainingBudget)} {question.unit}
            </Typography>
          </Stack>
        </Box>

        {/* Target Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          {question.targets.map((target, index) => (
            <GeoBudgetingTargetButton
              key={index}
              icon={target.icon ?? ''}
              targetName={target.name}
              price={target.price ?? 0}
              count={countPerTarget[index]}
              unit={question.unit ?? ''}
              isActive={activeTargetId === index}
              isMapReady={isMapReady && !readOnly}
              currentLanguage={surveyLanguage}
              remainingBudget={remainingBudget}
              onSelect={() => handleTargetSelect(index)}
            />
          ))}
        </Box>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <FormHelperText error>{validationErrors[0]}</FormHelperText>
        )}
      </div>

      {/* Feature Edit/Delete Dialog */}
      {editingAnswerIndex !== null && (
        <>
          <GeoBudgetingFeatureDialog
            open={featureDialogOpen && !deleteConfirmDialogOpen}
            targetName={
              question.targets[value[editingAnswerIndex]?.targetId]?.name
            }
            targetIcon={
              question.targets[value[editingAnswerIndex]?.targetId]?.icon
            }
            onDeleteClick={handleDeleteFeatureClick}
            onClose={() => {
              setFeatureDialogOpen(false);
              setDialogOpen(false);
              stopEditingMapAnswer();
            }}
          />

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            open={deleteConfirmDialogOpen}
            text={tr.MapQuestion.confirmRemoveAnswer}
            onClose={handleDeleteConfirmed}
            submitColor="error"
          />
        </>
      )}
    </>
  );
}
