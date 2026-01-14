import { SurveySortingQuestion } from '@interfaces/survey';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Typography,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { useTranslations } from '@src/stores/TranslationContext';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
  ResponderProvided,
} from 'react-beautiful-dnd';

interface Props {
  value: number[];
  onChange: (value: number[]) => void;
  question: SurveySortingQuestion;
  setDirty: (dirty: boolean) => void;
  readOnly: boolean;
}

export default function SortingQuestion(props: Props) {
  const { surveyLanguage, tr } = useTranslations();
  const [verified, setVerified] = useState(props.value ? true : false);
  const [sortedOptionIds, setSortedOptionIds] = useState(
    props.value ?? props.question.options.map((option) => option.id),
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const optionElements = useRef<HTMLElement[]>([]);
  const [optionIndexLabelHeights, setOptionIndexLabelHeights] = useState([]);

  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (optionElements.current.length > 0) {
        setOptionIndexLabelHeights(
          optionElements.current.map((el) => el.offsetHeight),
        );
      }
    });
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }
  }, [wrapperRef.current]);

  useEffect(() => {
    if (!verified || !props.onChange) {
      props.onChange(null);
      return;
    }
    props.onChange(sortedOptionIds);
  }, [sortedOptionIds, verified]);

  const reorder = (
    list: Array<number>,
    startIndex: number,
    endIndex: number,
  ) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const onDragEnd = (result: DropResult, provided: ResponderProvided) => {
    const { destination, source } = result;
    if (!destination || destination.index === source.index) {
      provided.announce(
        tr.SortingQuestion.announcement.droppedInPlace.replace(
          '{position}',
          (destination.index + 1).toString(),
        ),
      );
      return;
    }
    // Resize the index label heights array to match the new order
    if (optionElements.current.length > 0) {
      setOptionIndexLabelHeights((prev) => {
        const newHeights = [...prev];
        const [removed] = newHeights.splice(source.index, 1);
        newHeights.splice(destination.index, 0, removed);
        return newHeights;
      });
    }
    provided.announce(
      tr.SortingQuestion.announcement.drop.replace(
        '{position}',
        (destination.index + 1).toString(),
      ),
    );
    setVerified(false);
    setSortedOptionIds(
      reorder(sortedOptionIds, source.index, destination.index),
    );
  };

  return (
    <FormGroup id={`${props.question.id}-input`}>
      <Box
        style={visuallyHidden}
        id={`drag-instruction-announcement-${props.question.id}`}
      >
        {tr.SortingQuestion.announcement.focus}
      </Box>
      <DragDropContext
        onDragStart={(start, provided) =>
          provided.announce(
            tr.SortingQuestion.announcement.grab.replace(
              '{position}',
              (start.source.index + 1).toString(),
            ),
          )
        }
        onDragUpdate={(update, provided) =>
          provided.announce(
            tr.SortingQuestion.announcement.move
              .replace('{position}', (update.destination.index + 1).toString())
              .replace('{length}', props.question.options.length.toString()),
          )
        }
        onDragEnd={onDragEnd}
      >
        <div style={{ display: 'flex', flexDirection: 'row' }} ref={wrapperRef}>
          <div>
            {props.question.options.map((_option, index) => (
              <Paper
                key={index}
                variant="outlined"
                sx={{
                  height: optionIndexLabelHeights[index],
                  backgroundColor: '#ededed',
                  borderTopRightRadius: '0',
                  borderBottomRightRadius: '0',
                  marginBottom: '0.5em',
                  marginRight: '-0.25em',
                  padding: '0.5em',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'height 0.1s',
                }}
              >
                <Typography>{index + 1}.</Typography>
              </Paper>
            ))}
          </div>
          <Droppable
            droppableId={`question-dropzone-${props.question.id}`}
            isDropDisabled={props.readOnly}
          >
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{ flexGrow: 1 }}
              >
                {sortedOptionIds.map((optionId, index) => (
                  <Draggable
                    isDragDisabled={props.readOnly}
                    key={`option-${optionId}`}
                    index={index}
                    draggableId={`option-${optionId}`}
                  >
                    {(provided, snapshot) => (
                      <Paper
                        ref={(el) => {
                          if (el) {
                            optionElements.current[index] = el;
                          }
                          return provided.innerRef(el);
                        }}
                        variant="outlined"
                        sx={{
                          backgroundColor: snapshot.isDragging
                            ? '#c2dcf1'
                            : 'white',
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.5em',
                          padding: '0.5em',
                          transition: 'background-color 200ms',
                          '&:focus': {
                            outlineOffset: '2px',
                            outline: '2px solid black',
                          },
                        }}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        aria-describedby={`drag-instruction-announcement-${props.question.id}`}
                      >
                        <Typography
                          color={props.readOnly ? 'disabled' : 'primary.main'}
                        >
                          {
                            props.question.options.find(
                              (option) => option.id === optionId,
                            ).text?.[surveyLanguage]
                          }
                        </Typography>
                        <Box style={visuallyHidden}>
                          {tr.SortingQuestion.inPosition} {index + 1} /{' '}
                          {sortedOptionIds.length}
                        </Box>
                        <DragIndicatorIcon
                          color={snapshot.isDragging ? 'info' : 'action'}
                        />
                      </Paper>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
        <FormControlLabel
          label={tr.SortingQuestion.orderComplete}
          control={
            <Checkbox
              name={`verify-order-question_${props.question.id}`}
              checked={verified}
              onChange={(event) => {
                setVerified(event.target.checked);
                props.setDirty(true);
              }}
            />
          }
          sx={{
            lineHeight: 1.2,
            marginBottom: '0.5em',
          }}
        />
      </DragDropContext>
    </FormGroup>
  );
}
