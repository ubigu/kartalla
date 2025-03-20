import {
  AnswerEntry,
  Submission,
  Survey,
  SurveyPageSection,
  SurveyQuestion,
} from '@interfaces/survey';
import React, { useEffect, useMemo } from 'react';
import { AnswerSelection } from './AnswersList';
import OskariMap from './OskariMap';

interface Props {
  survey: Survey;
  submissions: Submission[];
  selectedQuestion: SurveyQuestion;
  onSelectQuestion: (question: SurveyQuestion) => void;
  onAnswerClick: (answer: AnswerSelection) => void;
  selectedAnswer: AnswerSelection;
  surveyQuestions: SurveyQuestion[];
  questions: SurveyQuestion[];
}

export default function AnswerMap({
  survey,
  submissions,
  selectedQuestion,
  onSelectQuestion,
  onAnswerClick,
  selectedAnswer,
  surveyQuestions,
  questions,
}: Props) {
  function holdsMapQuestions(question: SurveyQuestion) {
    if (!question) return false;

    return (
      ['map', 'budget-map'].includes(question.type) ||
      (question?.followUpSections?.some((followUpSection) =>
        ['map', 'budget-map'].includes(followUpSection.type),
      ) ??
        false)
    );
  }

  function isFeatureSelected(
    submission: Submission,
    section: SurveyPageSection,
    index: number,
  ) {
    return (
      selectedAnswer &&
      selectedAnswer.submissionId === submission.id &&
      selectedAnswer.questionId === section.id &&
      (['map', 'budget-map'].includes(section.type)
        ? selectedAnswer.index === index
        : true)
    );
  }

  function getAnswerVisibility(answer: AnswerEntry) {
    if (!answer.value) return false;
    // Current question is not selected, filter away answers that are not map answers
    if (selectedQuestion.id === 0)
      return ['map', 'budget-map'].includes(answer.type);

    if (['map', 'budget-map'].includes(answer.type)) {
      if (answer.sectionId === selectedQuestion.id) {
        return true;
      } else if (selectedQuestion.followUpSections?.length > 0) {
        return selectedQuestion.followUpSections?.some(
          (followUpSection) => followUpSection.id === answer.sectionId,
        );
      }
    }

    return false;
  }

  // All answer geometries that should be shown on the map
  const features = useMemo<GeoJSON.Feature[]>(() => {
    // If no question containing map question was selected OR if the selected question was not "select all", show nothing on the map
    if (!(selectedQuestion?.id === 0 || holdsMapQuestions(selectedQuestion))) {
      return [];
    }

    return (
      submissions
        // Reduce all submissions into one array of features
        .reduce((features, submission) => {
          return [
            ...features,
            ...submission.answerEntries

              .filter(
                (
                  answer,
                ): answer is AnswerEntry & { type: 'map' | 'budget-map' } =>
                  getAnswerVisibility(answer),
              )

              // Reduce answer's values into a single array of features
              .reduce((features, answer) => {
                const question =
                  selectedQuestion?.id === 0
                    ? surveyQuestions
                        .flatMap((question) => [
                          question,
                          ...(question?.followUpSections ?? []),
                        ])
                        .find((question) => question.id === answer.sectionId)
                    : selectedQuestion;

                return [
                  ...features,
                  ...answer.value.map((value, index) => {
                    return {
                      id: `feature-${question?.id}-${index}-${submission?.id}`,
                      type: 'Feature',
                      geometry: value.geometry.geometry,
                      properties: {
                        question: question,
                        submissionId: submission.id,
                        index,
                        ...('optionId' in value &&
                          question.type === 'budget-map' && {
                            selectedOption: question.options.find(
                              (o) => o.id === value.optionId,
                            ),
                          }),
                        selected: isFeatureSelected(
                          submission,
                          question,
                          index,
                        ),
                      },
                    } as GeoJSON.Feature;
                  }),
                ];
              }, []),
          ];
        }, [] as GeoJSON.Feature[])
    );
  }, [selectedQuestion, selectedAnswer]);

  // Select to show all questions by default
  useEffect(() => {
    if (selectedQuestion || !questions?.[0]) {
      return;
    }
    onSelectQuestion(questions[0]);
  }, [questions]);

  // Update layers if the question changes (get it from the page)
  const layers = useMemo(() => {
    if (!survey || !selectedQuestion) {
      return [];
    }

    const firstQuestionWithMap = questions.find(
      (question) =>
        ['map', 'budget-map'].includes(question.type) ||
        question.followUpSections?.some((section) =>
          ['map', 'budget-map'].includes(section.type),
        ),
    );
    if (!firstQuestionWithMap) return [];
    // If all answers are currently shown, find the first map question to determine shown map layers
    const page = survey.pages.find((page) =>
      page.sections.some(
        (section) =>
          section.id ===
          (selectedQuestion.id === 0
            ? firstQuestionWithMap.id
            : selectedQuestion.id),
      ),
    );
    return page.sidebar.mapLayers;
  }, [selectedQuestion, survey]);

  return (
    <>
      <OskariMap
        url={survey.mapUrl}
        layers={layers}
        features={features}
        onFeatureClick={(feature) => {
          const { submissionId, question, index } = feature.properties;
          onAnswerClick({ submissionId, questionId: question.id, index });
        }}
        selectedAnswer={selectedAnswer}
      />
    </>
  );
}
