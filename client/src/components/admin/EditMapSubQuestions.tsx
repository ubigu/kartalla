import { SurveyMapQuestion, SurveyMapSubQuestion } from '@interfaces/survey';
import { makeStyles } from '@mui/styles';

import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import SurveySectionAccordion from './SurveySectionAccordion/SurveySectionAccordion';

interface Props {
  mapQuestion: SurveyMapQuestion;
  expandedSection: number;
  onChange: (subQuestions: SurveyMapSubQuestion[]) => void;
  disabled?: boolean;
  onExpandedSectionChange: (expandedSectionIndex: number) => void;
}

const useStyles = makeStyles({
  accordion: {
    background: '#bbb',
  },
});

export default function EditMapSubQuestions(props: Props) {
  const classes = useStyles();

  return (
    <DragDropContext
      onDragEnd={(event) => {
        if (!event.destination) {
          return;
        }
        const subQuestionId = Number(event.draggableId);
        const oldIndex = props.mapQuestion.subQuestions.findIndex(
          (subQuestion) => subQuestion.id === subQuestionId,
        );

        const subQuestion = props.mapQuestion.subQuestions[oldIndex];
        const newIndex = event.destination.index;
        const otherSubQuestions = props.mapQuestion.subQuestions.filter(
          (subQuestion) => subQuestion.id !== subQuestionId,
        );
        props.onChange([
          ...otherSubQuestions.slice(0, newIndex),
          subQuestion,
          ...otherSubQuestions.slice(newIndex),
        ]);
        // If the section was expanded, re-expand with the new index
        if (props.expandedSection === oldIndex) {
          props.onExpandedSectionChange(newIndex);
        }
      }}
    >
      <Droppable droppableId="map-sub-sections">
        {(provided, _snapshot) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {(props.mapQuestion.subQuestions ?? []).map((section, index) => (
              <Draggable
                key={section.id}
                draggableId={String(section.id)}
                index={index}
              >
                {(provided, _snapshot) => (
                  <div ref={provided.innerRef} {...provided.draggableProps}>
                    <SurveySectionAccordion
                      disableSectionCopying
                      index={index}
                      provided={provided}
                      key={index}
                      className={classes.accordion}
                      disabled={props.disabled}
                      section={section}
                      name={`section-${index}`}
                      expanded={props.expandedSection === index}
                      onExpandedChange={(isExpanded) => {
                        props.onExpandedSectionChange(
                          isExpanded ? index : null,
                        );
                      }}
                      onEdit={(index, editedSection: SurveyMapSubQuestion) => {
                        // Replace the edited subquestion in the array
                        const subQuestions = props.mapQuestion.subQuestions.map(
                          (section, i) =>
                            i === index ? editedSection : section,
                        );
                        props.onChange(subQuestions);
                      }}
                      onDelete={(index) => {
                        // Filter out the subquestion from the array
                        const subQuestions =
                          props.mapQuestion.subQuestions.filter(
                            (_, i) => i !== index,
                          );
                        props.onChange(subQuestions);
                        // Reset expanded section to null
                        props.onExpandedSectionChange(null);
                      }}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
