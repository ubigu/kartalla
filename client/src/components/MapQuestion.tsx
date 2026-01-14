import {
  MapQuestionAnswer,
  MapQuestionSelectionType,
  SurveyMapQuestion,
  SurveyMapSubQuestionAnswer,
} from '@interfaces/survey';
import {
  Badge,
  Button,
  FormHelperText,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useSurveyMap } from '@src/stores/SurveyMapContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import MapSubQuestionDialog from './MapSubQuestionDialog';

interface Props {
  value: MapQuestionAnswer[];
  onChange: (value: MapQuestionAnswer[]) => void;
  question: SurveyMapQuestion;
  setDialogOpen: Dispatch<SetStateAction<boolean>>;
  mobileDrawerOpen?: boolean;
}

export default function MapQuestion({
  value,
  onChange,
  question,
  setDialogOpen,
  mobileDrawerOpen,
}: Props) {
  const [drawingCancelled, setDrawingCancelled] = useState(false);
  const drawingCancelledRef = useRef(drawingCancelled);
  const [selectionType, setSelectionType] =
    useState<MapQuestionSelectionType>(null);
  const [subQuestionDialogOpen, setSubQuestionDialogOpen] = useState(false);
  const [handleSubQuestionDialogClose, setHandleSubQuestionDialogClose] =
    useState<(answers: SurveyMapSubQuestionAnswer[]) => void>(null);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [clearConfirmDialogOpen, setClearConfirmDialogOpen] = useState(false);
  const [readyForSubQuestion, setReadyForSubQuestion] = useState(false);

  const {
    draw,
    isMapReady,
    drawing,
    stopDrawing,
    stopModifying,
    questionId: drawingQuestionId,
    editingMapAnswer,
    stopEditingMapAnswer,
    onModify,
  } = useSurveyMap();
  const { tr, surveyLanguage } = useTranslations();

  const valueRef = useRef<MapQuestionAnswer[]>(null);
  valueRef.current = value;

  useEffect(() => {
    if (!mobileDrawerOpen && readyForSubQuestion) {
      setReadyForSubQuestion(false);
      setTimeout(() => {
        setSubQuestionDialogOpen(true);
      }, 100);
    }
  }, [mobileDrawerOpen, readyForSubQuestion]);

  // Listen to any geometry changes related to this question
  useEffect(() => {
    if (!isMapReady || question.id == null) {
      return;
    }
    const unregisterEventHandler = onModify(question.id, (features) => {
      onChange(
        valueRef.current.map((answer, index) => ({
          ...answer,
          geometry: features[index],
        })),
      );
    });
    // On unmount unregister the event handler
    return () => {
      unregisterEventHandler();
    };
  }, [isMapReady, question.id]);

  /**
   * Execute the drawing answer flow when user selects a selection type
   */
  useEffect(() => {
    // Don't start drawing if the map isn't ready yet
    if (!isMapReady) {
      // If some selection type was selected, deselect it
      if (selectionType) {
        setSelectionType(null);
      }
      return;
    }
    if (!selectionType) {
      stopDrawing();
      return;
    }

    stopModifying();
    setDrawingCancelled(false);
    async function handleMapDraw() {
      const geometry = await draw(selectionType, question);

      // The state variable isn't updated inside this async function - access its current value via ref
      if (drawingCancelledRef.current) {
        return;
      }

      // If no geometry was returned, either the mobile menu was closed or the step was skipped - ignore the question for now
      if (!geometry) {
        return;
      }

      const subQuestionAnswers = await getSubQuestionAnswers();

      stopDrawing();

      if (!subQuestionAnswers) {
        // Subquestion dialog was cancelled - do not add an answer
        setSelectionType(null);
        return;
      }
      // Update the new answer to context at once
      onChange([
        ...value,
        {
          selectionType,
          geometry,
          subQuestionAnswers,
          mapLayers: [],
        },
      ]);
      setSelectionType(null);
    }
    handleMapDraw();

    // Cleanup function - prevent any state changes if the component was unmounted
    return () => {
      setDrawingCancelled(true);
    };
  }, [selectionType]);

  /**
   * When starting to draw for a different question,¨
   * reset selection type to null
   */
  useEffect(() => {
    if (!isMapReady || question.id == null || drawingQuestionId == null) {
      return;
    }
    if (drawingQuestionId !== question.id) {
      setSelectionType(null);
    }
  }, [drawingQuestionId]);

  /**
   * When drawing gets stopped, clear selected selection type
   */
  useEffect(() => {
    if (!drawing) {
      setSelectionType(null);
    }
  }, [drawing]);

  const mobileWidth = useMediaQuery('(max-width:600px)');

  async function getSubQuestionAnswers() {
    // Don't open the dialog at all if there are no subquestions
    if (!question.subQuestions?.length) {
      return [];
    }
    return await new Promise<MapQuestionAnswer['subQuestionAnswers']>(
      (resolve) => {
        // Open the subquestion dialog after drawing completes to prevent it from closing automatically on iPhones
        setReadyForSubQuestion(true);
        setHandleSubQuestionDialogClose(
          () => (answers: SurveyMapSubQuestionAnswer[]) => {
            resolve(answers);
            setSubQuestionDialogOpen(false);
          },
        );
      },
    );
  }

  useEffect(() => {
    setDialogOpen(
      deleteConfirmDialogOpen || clearConfirmDialogOpen || subQuestionDialogOpen
        ? true
        : false,
    );
  }, [deleteConfirmDialogOpen, clearConfirmDialogOpen, subQuestionDialogOpen]);

  function getToggleButton(selectionType: MapQuestionSelectionType) {
    const markingCount = value?.filter(
      (answer) => answer.selectionType === selectionType,
    ).length;
    return (
      <ToggleButton
        id={`${question.id}-draw-button`}
        value={selectionType}
        aria-label={`${tr.MapQuestion.selectionTypes[selectionType]}
          ${
            markingCount > 0
              ? ` ${markingCount} ${tr.MapQuestion.markingsMade}`
              : ''
          }`}
        disabled={!isMapReady}
      >
        <Badge badgeContent={markingCount} color="secondary">
          {selectionType === 'point' && (
            <img
              style={{ height: '2rem' }}
              src={`/api/feature-styles/icons/point_icon`}
              alt=""
            />
          )}
          {selectionType === 'line' && (
            <img
              style={{ height: '2rem' }}
              src={`/api/feature-styles/icons/line_icon`}
              alt=""
            />
          )}
          {selectionType === 'area' && (
            <img
              style={{ height: '2rem' }}
              src={`/api/feature-styles/icons/area_icon`}
              alt=""
            />
          )}
        </Badge>
        <Typography style={{ marginLeft: '1rem' }}>
          {tr.MapQuestion.selectionTypes[selectionType]}
        </Typography>
      </ToggleButton>
    );
  }

  return (
    <>
      <div
        id={`${question.id}-input`}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <ToggleButtonGroup
          value={selectionType}
          exclusive
          onChange={(_, newValue) => {
            setSelectionType(newValue);
          }}
          aria-label={tr.MapQuestion.mapSelectionButtons}
          orientation={mobileWidth ? 'vertical' : 'horizontal'}
        >
          {question.selectionTypes.includes('point') &&
            getToggleButton('point')}
          {question.selectionTypes.includes('line') && getToggleButton('line')}
          {question.selectionTypes.includes('area') && getToggleButton('area')}
        </ToggleButtonGroup>
        {selectionType !== null && (
          <FormHelperText>
            {tr.MapQuestion.selectionHelperText[selectionType]}
          </FormHelperText>
        )}
        {value?.length > 0 && (
          <div>
            <Button
              style={{ marginTop: '2rem' }}
              variant="outlined"
              color="primary"
              onClick={() => {
                setSelectionType(null);
                setClearConfirmDialogOpen(true);
              }}
            >
              {tr.MapQuestion.clearAnswers}
            </Button>
          </div>
        )}
      </div>
      {/* Editing dialog */}
      <MapSubQuestionDialog
        open={editingMapAnswer?.questionId === question.id}
        title={question.title?.[surveyLanguage]}
        answer={value[editingMapAnswer?.index]}
        subQuestions={question.subQuestions}
        onSubmit={(answers) => {
          onChange(
            value.map((answer, index) =>
              index === editingMapAnswer.index
                ? { ...answer, subQuestionAnswers: answers }
                : answer,
            ),
          );
          stopEditingMapAnswer();
        }}
        onCancel={() => {
          stopEditingMapAnswer();
        }}
        onDelete={() => {
          setDeleteConfirmDialogOpen(true);
        }}
      />
      {/* New map answer dialog */}
      <MapSubQuestionDialog
        open={subQuestionDialogOpen}
        subQuestions={question.subQuestions}
        onSubmit={(answers) => {
          handleSubQuestionDialogClose(answers);
          setTimeout(() => {
            (
              document.getElementById(
                `${question.id}-draw-button`,
              ) as HTMLButtonElement
            )?.focus();
          }, 1);
        }}
        onCancel={() => {
          handleSubQuestionDialogClose(null);

          setTimeout(() => {
            (
              document.getElementById(
                `${question.id}-draw-button`,
              ) as HTMLButtonElement
            )?.focus();
          }, 1);
        }}
      />
      {/* Confirm dialog for deleting a map answer */}
      <ConfirmDialog
        open={deleteConfirmDialogOpen}
        text={tr.MapQuestion.confirmRemoveAnswer}
        submitColor="error"
        onClose={(result) => {
          if (result) {
            onChange(
              value.filter((_, index) => index !== editingMapAnswer.index),
            );
            stopEditingMapAnswer();
          }
          setDeleteConfirmDialogOpen(false);
        }}
      />
      {/* Confirm dialog for clearing all map answers */}
      <ConfirmDialog
        open={clearConfirmDialogOpen}
        text={tr.MapQuestion.confirmClearAnswers}
        submitColor="error"
        onClose={(result) => {
          if (result) {
            onChange([]);
          }
          setClearConfirmDialogOpen(false);
        }}
      />
    </>
  );
}
