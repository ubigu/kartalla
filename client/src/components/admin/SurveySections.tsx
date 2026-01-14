import { SurveyPage } from '@interfaces/survey';
import { useSurvey } from '@src/stores/SurveyContext';
import { isFollowUpSectionParentType } from '@src/utils/typeCheck';

import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { FollowUpSections } from './SurveySectionAccordion/FollowUpSections';
import SurveySectionAccordion from './SurveySectionAccordion/SurveySectionAccordion';

interface Props {
  page: SurveyPage;
  expandedSection: number;
  disabled?: boolean;
  onExpandedSectionChange: (section: number) => void;
}

export default function SurveySections(props: Props) {
  const { editSection, deleteSection, moveSection, moveFollowUpSection } =
    useSurvey();

  return (
    <DragDropContext
      onDragEnd={(event) => {
        if (!event.destination) {
          return;
        }

        const id = Number(event.draggableId);

        if (event.type.includes('followUpSection')) {
          const parentSection = props.page.sections.find((sect) =>
            sect.followUpSections?.find((s) => s.id === id),
          );

          const oldIndex = parentSection.followUpSections.findIndex(
            (sect) => sect.id === id,
          );
          const newIndex = event.destination.index;
          moveFollowUpSection(
            props.page.id,
            parentSection.id,
            oldIndex,
            newIndex,
          );
        } else {
          const oldIndex = props.page.sections.findIndex(
            (section) => section.id === id,
          );
          const newIndex = event.destination.index;
          moveSection(props.page.id, oldIndex, event.destination.index);
          // If the section was expanded, re-expand with the new index
          if (props.expandedSection === oldIndex) {
            props.onExpandedSectionChange(newIndex);
          }
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
                      {isFollowUpSectionParentType(section) && (
                        <FollowUpSections
                          parentSectionIndex={index}
                          disabled={props.disabled}
                          page={props.page}
                          parentSection={section}
                        />
                      )}
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
