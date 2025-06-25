import { SurveyGroupedCheckboxQuestion } from '@interfaces/survey';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Fab,
  TextField,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import ChevronDownSmallIcon from '@src/components/icons/ChevronDownSmallIcon';
import DraggableIcon from '@src/components/icons/DraggableIcon';
import AddIcon from '../icons/AddIcon';
import { makeStyles } from '@mui/styles';
import { useTranslations } from '@src/stores/TranslationContext';
import React, { useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import QuestionOptions from './QuestionOptions';

interface Props {
  section: SurveyGroupedCheckboxQuestion;
  disabled?: boolean;
  onChange: (section: SurveyGroupedCheckboxQuestion) => void;
}

const useStyles = makeStyles({
  accordion: {
    background: '#bbb',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  answerLimitInput: {
    marginRight: '1rem',
  },
});

export default function EditGroupedCheckBoxQuestion({
  section,
  disabled,
  onChange,
}: Props) {
  const [openedGroupId, setOpenedGroupId] = useState<number>(null);

  const { tr, surveyLanguage } = useTranslations();
  const classes = useStyles();

  return (
    <>
      <FormGroup row>
        <FormControlLabel
          control={
            <Checkbox
              name="limit-answers"
              disabled={disabled}
              checked={Boolean(section.answerLimits)}
              onChange={(event) => {
                onChange({
                  ...section,
                  answerLimits: event.target.checked
                    ? {
                        min: null,
                        max: null,
                      }
                    : null,
                });
              }}
            />
          }
          label={tr.SurveySections.limitAnswers}
        />
      </FormGroup>
      {section.answerLimits && (
        <FormGroup row>
          <TextField
            id="min-answers"
            disabled={disabled}
            className={classes.answerLimitInput}
            type="number"
            variant="standard"
            label={tr.SurveySections.minAnswers}
            InputLabelProps={{ shrink: true }}
            value={section.answerLimits?.min ?? ''}
            onChange={(event) => {
              // Negative numbers shouldn't be allowed
              const value = Math.max(Number(event.target.value), 0);
              onChange({
                ...section,
                answerLimits: {
                  ...section.answerLimits,
                  min: Math.min(value, section.answerLimits.max),
                },
              });
            }}
          />
          <TextField
            id="max-answers"
            disabled={disabled}
            type="number"
            variant="standard"
            label={tr.SurveySections.maxAnswers}
            InputLabelProps={{ shrink: true }}
            value={section.answerLimits?.max ?? ''}
            onChange={(event) => {
              // Negative numbers shouldn't be allowed
              const value = Math.max(Number(event.target.value), 0);
              onChange({
                ...section,
                answerLimits: {
                  ...section.answerLimits,
                  max: Math.max(value, section.answerLimits.min),
                },
              });
            }}
          />
        </FormGroup>
      )}
      <DragDropContext
        onDragEnd={(event) => {
          if (!event.destination) {
            return;
          }
          const groupId = Number(event.draggableId);
          const oldIndex = section.groups.findIndex(
            (group) => group.id === groupId,
          );
          const group = section.groups[oldIndex];
          const newIndex = event.destination.index;
          const otherGroups = section.groups.filter(
            (group) => group.id !== groupId,
          );
          onChange({
            ...section,
            groups: [
              ...otherGroups.slice(0, newIndex),
              group,
              ...otherGroups.slice(newIndex),
            ],
          });
          // If the group was expanded, re-expand with the new index
          if (openedGroupId === oldIndex) {
            setOpenedGroupId(newIndex);
          }
        }}
      >
        <Droppable droppableId="option-groups">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {section.groups.map((group, index) => (
                <Draggable
                  key={group.id}
                  draggableId={String(group.id)}
                  index={index}
                >
                  {(provided) => (
                    <Accordion
                      {...provided.draggableProps}
                      ref={provided.innerRef}
                      key={group.id}
                      className={classes.accordion}
                      data-testid={`group-${index}-${
                        openedGroupId === group.id ? 'expanded' : 'collapsed'
                      }`}
                      expanded={openedGroupId === group.id}
                      onChange={(_, isExpanded) => {
                        setOpenedGroupId(isExpanded ? group.id : null);
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ChevronDownSmallIcon />}
                        aria-controls={`group-${index}-content`}
                        id={`group-${index}-header`}
                      >
                        <Typography style={{ flexGrow: 1 }}>
                          {group.name[surveyLanguage] || (
                            <em>
                              {tr.EditGroupedCheckBoxQuestion.untitledGroup}
                            </em>
                          )}
                        </Typography>
                        <div
                          {...provided.dragHandleProps}
                          style={{ display: 'flex' }}
                        >
                          <DraggableIcon />
                        </div>
                      </AccordionSummary>
                      <AccordionDetails className={classes.group}>
                        <TextField
                          autoFocus
                          disabled={disabled}
                          label={tr.EditGroupedCheckBoxQuestion.groupName}
                          value={group.name[surveyLanguage]}
                          variant="standard"
                          onChange={(event) => {
                            group.name[surveyLanguage] = event.target.value;
                            onChange({
                              ...section,
                            });
                          }}
                        />
                        <QuestionOptions
                          options={group.options}
                          disabled={disabled}
                          onChange={(options) => {
                            group.options = [...options];
                            onChange({ ...section });
                          }}
                          title={tr.SurveySections.options}
                          allowOptionInfo
                          enableClipboardImport
                        />
                        <div>
                          <Button
                            variant="contained"
                            disabled={disabled}
                            onClick={() => {
                              onChange({
                                ...section,
                                groups: section.groups.filter(
                                  (_, i) => i !== index,
                                ),
                              });
                            }}
                          >
                            {tr.EditGroupedCheckBoxQuestion.deleteGroup}
                          </Button>
                        </div>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <div className={classes.row}>
        <Fab
          color="primary"
          disabled={disabled}
          aria-label="add-checkbox-group"
          size="small"
          sx={{ boxShadow: 'none' }}
          onClick={() => {
            // Add a temporary new ID for the group
            const id =
              Math.min(0, ...section.groups.map((group) => group.id)) - 1;
            onChange({
              ...section,
              groups: [
                ...section.groups,
                {
                  id,
                  name: { fi: '', se: '', en: '' },
                  options: [],
                },
              ],
            });
            setOpenedGroupId(id);
          }}
        >
          <AddIcon />
        </Fab>
        <Typography style={{ paddingLeft: '1rem' }}>
          {tr.EditGroupedCheckBoxQuestion.addGroup}
        </Typography>
      </div>
    </>
  );
}
