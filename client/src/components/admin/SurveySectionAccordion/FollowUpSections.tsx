import { SurveyPage, SurveyPageSection } from '@interfaces/survey';
import { useSurvey } from '@src/stores/SurveyContext';
import { useState } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { FollowUpSectionAccordion } from './FollowUpSectionAccordion';

interface Props {
  parentSection: Extract<
    SurveyPageSection,
    { type: 'numeric' | 'slider' | 'checkbox' | 'radio' }
  >;
  page: SurveyPage;
  disabled: boolean;
  parentSectionIndex: number;
}

export function FollowUpSections({
  parentSection,
  disabled,
  page,
  parentSectionIndex,
}: Props) {
  const [expandedFollowUpSection, setExpandedFollowUpSection] =
    useState<number>(null);
  const { editFollowUpSection, deleteSection } = useSurvey();

  return (
    <Droppable
      droppableId={`follow-up-sections-${parentSection.id}`}
      type={`followUpSection-${parentSection.id}`}
    >
      {(provided, _snapshot) => (
        <div {...provided.droppableProps} ref={provided.innerRef}>
          {parentSection?.followUpSections?.map((sect, index) => (
            <Draggable
              key={`${parentSection.id}-${sect.id}`}
              draggableId={String(sect.id)}
              index={index}
            >
              {(provided, _snapshot) => {
                return (
                  <div
                    style={{ margin: '10px' }}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                  >
                    <FollowUpSectionAccordion
                      pageId={page.id}
                      isLastItem={
                        parentSection.followUpSections.length === index + 1
                      }
                      parentSectionIndex={parentSectionIndex}
                      index={index}
                      provided={provided}
                      disabled={disabled}
                      parentSection={parentSection}
                      section={sect}
                      name={`section-${index}`}
                      expanded={expandedFollowUpSection === index}
                      onExpandedChange={(isExpanded) => {
                        setExpandedFollowUpSection(isExpanded ? index : null);
                      }}
                      onEdit={(section) => {
                        editFollowUpSection(page.id, parentSection.id, section);
                      }}
                      onDelete={(index) => {
                        deleteSection(page.id, index);
                        // Reset expanded section to null
                        setExpandedFollowUpSection(null);
                      }}
                    />
                  </div>
                );
              }}
            </Draggable>
          ))}

          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
