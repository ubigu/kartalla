import { SurveyPage } from '@interfaces/survey';
import { useSurvey } from '@src/stores/SurveyContext';
import React from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import SurveySectionAccordion from './SurveySectionAccordion/SurveySectionAccordion';
import { FollowUpSections } from './SurveySectionAccordion/FollowUpSections';

interface Props {
  page: SurveyPage;
  expandedSection: number;
  disabled?: boolean;
  onExpandedSectionChange: (section: number) => void;
}

export default function SurveySections(props: Props) {
  const { editSection, deleteSection, moveSection } = useSurvey();

  return (
    <DragDropContext
      onDragEnd={(event) => {
        if (!event.destination) {
          return;
        }
        if (event.type.includes('followUpSection')) {
          console.log('jatkokysymystä siirretty');
          return;
        }
        const id = Number(event.draggableId);
        const oldIndex = props.page.sections.findIndex(
          (section) => section.id === id,
        );
        const newIndex = event.destination.index;
        moveSection(props.page.id, oldIndex, event.destination.index);
        // If the section was expanded, re-expand with the new index
        if (props.expandedSection === oldIndex) {
          props.onExpandedSectionChange(newIndex);
        }
      }}
    >
      <Droppable droppableId="sections" type="section">
        {(provided, _snapshot) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {props.page.sections.map((section, index) => {
              return (
                <Draggable
                  key={section.id}
                  draggableId={String(section.id)}
                  index={index}
                >
                  {(provided, _snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps}>
                      <SurveySectionAccordion
                        pageId={props.page.id}
                        index={index}
                        provided={provided}
                        disabled={props.disabled}
                        section={section}
                        name={`section-${index}`}
                        expanded={props.expandedSection === index}
                        onExpandedChange={(isExpanded) => {
                          props.onExpandedSectionChange(
                            isExpanded ? index : null,
                          );
                        }}
                        onEdit={(index, section) => {
                          editSection(props.page.id, index, section);
                        }}
                        onDelete={(index) => {
                          deleteSection(props.page.id, index);
                          // Reset expanded section to null
                          props.onExpandedSectionChange(null);
                        }}
                      />
                      <FollowUpSections
                        parentSectionIndex={index}
                        disabled={props.disabled}
                        page={props.page}
                        parentSection={section}
                      />
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
