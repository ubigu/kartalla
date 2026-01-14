import {
  AnswerEntry,
  GeoBudgetingAnswer,
  Submission,
  Survey,
  SurveyPageSection,
  SurveyQuestion,
} from '@interfaces/survey';
import { useTranslations } from '@src/stores/TranslationContext';
import { Feature } from 'geojson';
import { useEffect, useMemo } from 'react';
import { AnswerSelection } from './AnswersList';
import OskariMap from './OskariMap';

/**
 * Base properties shared by both map and geo-budgeting answer features
 */
interface BaseAnswerFeatureProperties {
  question: SurveyPageSection | undefined;
  submissionId: number;
  index: number;
  selected: boolean;
}

/**
 * Additional properties specific to geo-budgeting answer features
 */
interface GeoBudgetingAnswerFeatureProperties
  extends BaseAnswerFeatureProperties {
  targetIndex: number;
  targetIcon: string | undefined;
}

/**
 * Union type for all answer feature properties
 */
type AnswerFeatureProperties =
  | BaseAnswerFeatureProperties
  | GeoBudgetingAnswerFeatureProperties;

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
  const { surveyLanguage } = useTranslations();
  function holdsMapQuestions(question: SurveyQuestion) {
    if (!question) return false;

    return (
      question.type === 'map' ||
      question.type === 'geo-budgeting' ||
      (question?.followUpSections?.some(
        (followUpSection) => followUpSection.type === 'map',
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
      (section.type === 'map' ? selectedAnswer.index === index : true)
    );
  }

  function getAnswerVisibility(answer: AnswerEntry) {
    if (!answer.value) return false;
    // Current question is not selected, filter away answers that are not map/geo-budgeting answers
    if (selectedQuestion.id === 0)
      return answer.type === 'map' || answer.type === 'geo-budgeting';

    if (answer.type === 'map' || answer.type === 'geo-budgeting') {
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
  const features = useMemo<Feature<any, AnswerFeatureProperties>[]>(() => {
    // If no question containing map question was selected OR if the selected question was not "select all", show nothing on the map
    if (!(selectedQuestion?.id === 0 || holdsMapQuestions(selectedQuestion))) {
      return [];
    }

    return (
      submissions
        // Reduce all submissions into one array of features
        .reduce(
          (features, submission) => {
            return [
              ...features,
              ...submission.answerEntries

                .filter(
                  (
                    answer,
                  ): answer is AnswerEntry & {
                    type: 'map' | 'geo-budgeting';
                  } => getAnswerVisibility(answer),
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
                    ...answer.value
                      .filter((value) => value.geometry?.geometry != null)
                      .map((value, index) => {
                        const isSelected = isFeatureSelected(
                          submission,
                          question,
                          index,
                        );

                        // For geo-budgeting answers, create properties with targetIndex and targetIcon
                        if (
                          answer.type === 'geo-budgeting' &&
                          question?.type === 'geo-budgeting'
                        ) {
                          const geoBudgetValue = value as GeoBudgetingAnswer;
                          const properties: GeoBudgetingAnswerFeatureProperties =
                            {
                              question,
                              submissionId: submission.id,
                              index,
                              selected: isSelected,
                              targetIndex: geoBudgetValue.targetIndex,
                              targetIcon:
                                question.targets?.[geoBudgetValue.targetIndex]
                                  ?.icon,
                            };

                          return {
                            id: `feature-${question?.id}-${index}-${submission?.id}`,
                            type: 'Feature',
                            geometry: geoBudgetValue.geometry.geometry,
                            properties,
                          };
                        }

                        // For map questions, create base properties
                        const properties: BaseAnswerFeatureProperties = {
                          question,
                          submissionId: submission.id,
                          index,
                          selected: isSelected,
                        };

                        return {
                          id: `feature-${question?.id}-${index}-${submission?.id}`,
                          type: 'Feature',
                          geometry: value.geometry.geometry,
                          properties,
                        };
                      }),
                  ];
                }, []),
            ];
          },
          [] as Feature<any, AnswerFeatureProperties>[],
        )
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
        question.type === 'map' ||
        question.followUpSections?.some((section) => section.type === 'map'),
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
        key={survey.localizedMapUrls[surveyLanguage]} // Force re-mount on URL change
        url={survey.localizedMapUrls[surveyLanguage]}
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
