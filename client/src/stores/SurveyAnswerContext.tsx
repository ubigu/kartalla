import {
  AnswerEntry,
  Conditions,
  LanguageCode,
  PersonalInfoAnswer,
  Survey,
  SurveyPage,
  SurveyPageSection,
  SurveyQuestion,
} from '@interfaces/survey';
import { request } from '@src/utils/request';
import React, {
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useReducer,
} from 'react';
import { useTranslations } from './TranslationContext';
import { isFollowUpSectionParentType, isString } from '@src/utils/typeCheck';

interface State {
  answers: AnswerEntry[];
  survey: Survey;
  unfinishedToken: string;
}

type Action =
  | {
      type: 'SET_SURVEY';
      survey: Survey;
    }
  | {
      type: 'UPDATE_SURVEY_PAGE';
      page: SurveyPage;
    }
  | {
      type: 'UPDATE_ANSWER';
      answer: AnswerEntry;
    }
  | {
      type: 'UPDATE_ANSWERS';
      answers: AnswerEntry[];
    }
  | {
      type: 'SET_ANSWERS';
      answers: AnswerEntry[];
    }
  | {
      type: 'SET_UNFINISHED_TOKEN';
      token: string;
    };

type Context = [State, React.Dispatch<Action>];

const stateDefaults: State = {
  answers: [],
  survey: null,
  unfinishedToken: null,
};

// Section types that won't have an answer (e.g. text sections)
export const nonQuestionSectionTypes: SurveyPageSection['type'][] = [
  'text',
  'image',
  'document',
];

/**
 * Context containing the state object and dispatch function.
 */
export const SurveyAnswerContext = createContext<Context>(null);

export function getEmptyAnswer(section: SurveyPageSection): AnswerEntry {
  switch (section.type) {
    case 'personal-info':
      return {
        sectionId: section.id,
        type: section.type,
        value: {
          name: '',
          email: '',
          phone: '',
        },
      };
    case 'checkbox':
      return {
        sectionId: section.id,
        type: section.type,
        value: [],
      };
    case 'radio':
      return {
        sectionId: section.id,
        type: section.type,
        value: null,
      };
    case 'free-text':
      return {
        sectionId: section.id,
        type: section.type,
        value: '',
      };
    case 'numeric':
      return {
        sectionId: section.id,
        type: section.type,
        value: null,
      };
    case 'map':
      return {
        sectionId: section.id,
        type: section.type,
        value: [],
      };
    case 'sorting':
      return {
        sectionId: section.id,
        type: section.type,
        value: null,
      };
    case 'slider':
      return {
        sectionId: section.id,
        type: section.type,
        value: null,
      };
    case 'matrix':
      return {
        sectionId: section.id,
        type: section.type,
        value: new Array(section.subjects?.length ?? 1).fill(null),
      };
    case 'multi-matrix':
      return {
        sectionId: section.id,
        type: section.type,
        value: new Array(section.subjects?.length ?? 1).fill(
          new Array().fill(null),
        ),
      };
    case 'grouped-checkbox':
      return {
        sectionId: section.id,
        type: section.type,
        value: [],
      };
    case 'attachment':
      return {
        sectionId: section.id,
        type: section.type,
        value: [],
      };
    default:
      throw new Error(
        `No default value defined for questions of type "${section.type}"`,
      );
  }
}

/**
 * Checks if given answervalue for a question is empty/unanswered
 * @param question Question
 * @param value Answer value
 * @returns Is the answer empty?
 */
export function isAnswerEmpty(
  question: SurveyQuestion,
  value: AnswerEntry['value'],
) {
  // Matrix is considered incomplete, if the answer array doesn't contain as many answers (exluding nulls) as there are rows in the matrix
  if (question.type === 'matrix') {
    if (
      (value as string[]).filter((answer) => answer).length !==
      question.subjects?.length
    ) {
      return true;
    }
  }
  // Multi matrix question is unanswered if every row is empty
  if (question.type === 'multi-matrix') {
    return (value as string[][]).every((row) => row.length === 0);
  }
  // Sorting is considered incomplete, if the array contains any nullish values
  if (question.type === 'sorting') {
    if (!value || (value as number[]).some((value) => value == null)) {
      return true;
    }
  }
  // Personal info is considered incomplete if all of the fields are null
  if (question.type === 'personal-info') {
    const { name, email, phone } = value as PersonalInfoAnswer;
    if (!name && !email && !phone) {
      return true;
    }
  }
  // If value is an array, check the array length - otherwise check for its emptiness
  else if (
    Array.isArray(value)
      ? !value.length
      : value == null || !value.toString().length
  ) {
    return true;
  }
  return false;
}

/**
 * Hook for accessing survey answer context.
 * @returns State and survey answer context functions
 */
export function useSurveyAnswers() {
  const context = useContext(SurveyAnswerContext);
  const { setLanguage, surveyLanguage } = useTranslations();
  if (!context) {
    throw new Error('useSurvey must be used within the SurveyProvider');
  }

  const [state, dispatch] = context;

  function getValidationErrors(
    question: SurveyQuestion,
    answers = state.answers,
  ) {
    const errors: (
      | 'answerLimits'
      | 'required'
      | 'minValue'
      | 'maxValue'
      | 'custom'
    )[] = [];
    // Find the answer that corresponds to the question
    const answer = answers.find((answer) => answer.sectionId === question.id);

    if (!answer.hasOwnProperty('value')) return errors; // Shouldn't happen but used just in case to prevent errors
    if (answer.hasError) errors.push('custom');

    // Checkbox question validation - check possible answer limits
    if (question.type === 'checkbox' || question.type === 'grouped-checkbox') {
      const value = answer.value as (number | string)[];
      // Pick only non-empty selections (numbers and non-empty strings) for the check
      const nonEmptySelections = value.filter(
        (selection) =>
          selection != null &&
          (typeof selection !== 'string' || selection.length > 0),
      );
      if (
        // If either limit is defined and that limit is broken, the answer is invalid
        (question.answerLimits?.max &&
          nonEmptySelections.length > question.answerLimits.max) ||
        (question.answerLimits?.min &&
          nonEmptySelections.length < question.answerLimits.min)
      ) {
        errors.push('answerLimits');
      }
    }

    // Multi choice matrix question validation - check possible answer limits

    if (question.type === 'multi-matrix') {
      const value = answer.value as string[][];
      for (const row of value) {
        if (row.includes('-1')) {
          continue;
        } else if (
          // If either limit is defined and that limit is broken, the answer is invalid
          (question.answerLimits?.max &&
            row.length > question.answerLimits.max) ||
          (question.answerLimits?.min && row.length < question.answerLimits.min)
        ) {
          errors.push('answerLimits');
          break;
        }
      }
    }

    // Numeric question validation - check min & max values
    if (
      question.type === 'numeric' &&
      answer.value != null &&
      typeof answer.value === 'number' &&
      !isNaN(answer.value)
    ) {
      if (question.minValue != null && answer.value < question.minValue) {
        errors.push('minValue');
      }
      if (question.maxValue != null && answer.value > question.maxValue) {
        errors.push('maxValue');
      }
    }

    if (question.isRequired) {
      // Matrix is considered incomplete, if the answer array doesn't contain as many answers (exluding nulls) as there are rows in the matrix
      if (question.type === 'matrix') {
        if (
          (answer.value as string[]).filter((answer) => answer).length !==
          question.subjects?.length
        ) {
          errors.push('required');
        }
      }
      // Multiple choice matrix is considered incomplete if any of the rows is empty
      else if (
        question.type === 'multi-matrix' &&
        (answer.value as string[][]).some((row) => row.length === 0)
      ) {
        errors.push('required');
      } else if (question.type === 'personal-info') {
        if (
          question.askEmail &&
          (answer.value as PersonalInfoAnswer).email.length === 0
        ) {
          errors.push('required');
        } else if (
          question.askName &&
          (answer.value as PersonalInfoAnswer).name.length === 0
        ) {
          errors.push('required');
        } else if (
          question.askPhone &&
          (answer.value as PersonalInfoAnswer).phone.length === 0
        ) {
          errors.push('required');
        }
      }
      // If value is an array, check the array length - otherwise check for its emptiness
      else if (
        Array.isArray(answer.value)
          ? !answer.value.length
          : answer.value == null || !answer.value.toString().length
      ) {
        errors.push('required');
      }
    }

    return errors;
  }

  /**
   * Check if given page with given conditions should be displayed
   * @param page
   * @returns
   */

  function getConditionalPageVisibility(page: SurveyPage) {
    if (!page.conditions || Object.values(page.conditions).length === 0)
      return true;

    return state.answers.some((answerEntry) => {
      const conditionForSection =
        page.conditions?.[answerEntry.sectionId] ?? null;
      // Page has no condition for this answer
      if (!conditionForSection) return false;
      switch (answerEntry.type) {
        case 'radio':
          return conditionForSection.equals.some(
            (answerId) =>
              (isString(answerEntry.value) ? -1 : answerEntry.value) ===
              answerId,
          );

        case 'checkbox':
          return conditionForSection.equals.some((answerId) =>
            (
              answerEntry as Extract<AnswerEntry, { type: 'checkbox' }>
            ).value.some((val) => (isString(val) ? -1 : val) === answerId),
          );

        case 'numeric':
        case 'slider':
          return conditionForSection.equals.some(
            (conditionValue) => answerEntry.value === conditionValue,
          )
            ? true
            : conditionForSection.greaterThan.some(
                (conditionValue) => answerEntry.value >= conditionValue,
              )
            ? true
            : conditionForSection.lessThan.some(
                (conditionValue) => answerEntry.value <= conditionValue,
              )
            ? true
            : false;

        default:
          return false;
      }
    });
  }

  /**
   * Checks is question follow-up section conditions are fulfilled and return list of
   * follow-up question ids that should be displayed
   * @param question
   * @returns
   */

  function getFollowUpSectionsToDisplay(question: SurveyQuestion) {
    // Find the answer that corresponds to the question

    const answer = state.answers.find(
      (answer) => answer.sectionId === question.id,
    );

    if (
      !question?.followUpSections ||
      question.followUpSections.length === 0 ||
      !answer?.value
    ) {
      return [];
    }

    switch (question.type) {
      case 'radio':
        return question.followUpSections
          .filter((section) =>
            section.conditions.equals.some(
              (answerId) =>
                (isString(answer.value) ? -1 : answer.value) === answerId,
            ),
          )
          .map((s) => s.id);
      case 'checkbox':
        return question.followUpSections
          .filter((section) =>
            section.conditions.equals.some((answerId) =>
              (answer as Extract<AnswerEntry, { type: 'checkbox' }>).value.some(
                (val) => (isString(val) ? -1 : val) === answerId,
              ),
            ),
          )
          .map((s) => s.id);
      case 'numeric':
      case 'slider':
        return question.followUpSections
          .filter((section) => {
            const value = (
              answer as Extract<AnswerEntry, { type: 'numeric' | 'slider' }>
            ).value;

            return section.conditions.equals.some(
              (conditionValue) => value === conditionValue,
            )
              ? true
              : section.conditions.greaterThan.some(
                  (conditionValue) => value >= conditionValue,
                )
              ? true
              : section.conditions.lessThan.some(
                  (conditionValue) => value <= conditionValue,
                )
              ? true
              : false;
          })
          .map((s) => s.id);
      default:
        return [];
    }
  }

  /**
   * Filter out answers for hidden conditional pages
   * @param visiblePages
   */
  function getAnswersForSubmission(visiblePages: number[]) {
    const visibleSectionIds = state.survey.pages
      .filter((page) => visiblePages.includes(page.id))
      .map((page) => page.sections)
      .flat(1)
      .map((section) => [section, ...(section?.followUpSections ?? [])])
      .flat(1)
      .map((section) => section.id);

    return state.answers.filter((answer) =>
      visibleSectionIds.includes(answer.sectionId),
    );
  }

  return {
    ...state,
    getFollowUpSectionsToDisplay,
    getConditionalPageVisibility,
    getAnswersForSubmission,

    /**
     * Update survey answer
     * @param answer Survey answer
     */
    updateAnswer(answer: AnswerEntry) {
      dispatch({ type: 'UPDATE_ANSWER', answer });
    },
    /**
     * Initializes empty answers for given survey
     * @param survey
     */
    setSurvey(survey: Survey) {
      if (!survey) {
        dispatch({ type: 'SET_SURVEY', survey });
        dispatch({ type: 'SET_ANSWERS', answers: [] });
        return;
      }
      dispatch({ type: 'SET_SURVEY', survey });
      // Get all sections across survey pages
      function getSectionsFollowUpSections(sections: SurveyPageSection[]) {
        return sections
          .map((section) => section?.followUpSections ?? [])
          .flat(1);
      }

      const sections = survey.pages
        .reduce(
          (sections, page) => [
            ...sections,
            ...page.sections,
            ...getSectionsFollowUpSections(page.sections),
          ],
          [],
        )
        // Skip sections that shouldn't get answers
        .filter((section) => !nonQuestionSectionTypes.includes(section.type));

      dispatch({
        type: 'SET_ANSWERS',
        answers: sections.map(getEmptyAnswer).filter(Boolean),
      });
    },
    /**
     * Gets possible validation errors for given question.
     * @param section Question section
     * @param answers Answers to validate against (uses answers from context state by default)
     * @returns
     */
    getValidationErrors(question: SurveyQuestion, answers = state.answers) {
      return getValidationErrors(question, answers);
    },
    /**
     * Is the entire page valid?
     * @param page Page
     * @returns Is the page valid
     */
    isPageValid(page: SurveyPage) {
      return !page.sections
        // Skip sections that shouldn't get answers
        .filter(
          (section): section is SurveyQuestion =>
            !nonQuestionSectionTypes.includes(section.type),
        )
        .some((section) => {
          const displayedFollowUpIds = getFollowUpSectionsToDisplay(section);

          if (
            isFollowUpSectionParentType(section) &&
            displayedFollowUpIds.length > 0
          ) {
            return section.followUpSections
              .filter(
                (sect): sect is SurveyQuestion & { conditions: Conditions } =>
                  displayedFollowUpIds.includes(sect.id) &&
                  !nonQuestionSectionTypes.includes(sect.type),
              )
              .some((s) => getValidationErrors(s).length);
          }

          return getValidationErrors(section).length > 0;
        });
    },
    /**
     *
     * @param page survey page
     * @returns a list of objects with question titles as keys and an array of errors as values
     */
    getPageInvalidQuestions(page: SurveyPage) {
      return (
        page.sections
          // Skip sections that shouldn't get answers
          .filter(
            (section): section is SurveyQuestion =>
              !nonQuestionSectionTypes.includes(section.type),
          )
          .map((section) => ({
            [section.title[surveyLanguage]]: getValidationErrors(section),
          }))
      );
    },
    /**
     * Fetch unfinished answer entries by token and set them into the context
     * @param token Unfinished token
     */
    async loadUnfinishedEntries(token: string) {
      dispatch({ type: 'SET_UNFINISHED_TOKEN', token });
      const response = await request<{
        answers: AnswerEntry[];
        language: LanguageCode;
      }>(
        `/api/published-surveys/${state.survey.organization.name}/${state.survey.name}/unfinished-submission?token=${token}`,
      );
      const { answers, language } = response;
      dispatch({
        type: 'UPDATE_ANSWERS',
        answers,
      });
      setLanguage(language);
    },
    /**
     * Sets the unfinished token into the context. The next save/submit will replace the unfinished submission.
     * @param token Unfinished token
     */
    setUnfinishedToken(token: string) {
      dispatch({ type: 'SET_UNFINISHED_TOKEN', token });
    },
    /**
     * Updates the given map layers to the state.
     * @param page Page to be updated
     * @param mapLayers Visible map layers
     */
    updatePageMapLayers(page: SurveyPage, mapLayers: number[]) {
      dispatch({
        type: 'UPDATE_SURVEY_PAGE',
        page: { ...page, sidebar: { ...page.sidebar, mapLayers } },
      });
    },
  };
}

/**
 * Reducer for SurveyAnswerContext state.
 * @param state Previous state
 * @param action Dispatched action
 * @returns New state
 */
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SURVEY':
      return {
        ...state,
        survey: action.survey,
      };
    case 'UPDATE_SURVEY_PAGE':
      return {
        ...state,
        survey: {
          ...state.survey,
          pages: state.survey.pages.map((page) =>
            page.id === action.page.id ? action.page : page,
          ),
        },
      };
    case 'UPDATE_ANSWER':
      return {
        ...state,
        answers: state.answers.map((answer) =>
          answer.sectionId === action.answer.sectionId ? action.answer : answer,
        ),
      };
    case 'UPDATE_ANSWERS':
      return {
        ...state,
        answers: state.answers.map(
          (answer) =>
            action.answers.find((a) => a.sectionId === answer.sectionId) ??
            answer,
        ),
      };
    case 'SET_ANSWERS':
      return {
        ...state,
        answers: [...action.answers],
      };
    case 'SET_UNFINISHED_TOKEN':
      return {
        ...state,
        unfinishedToken: action.token,
      };
    default:
      throw new Error('Invalid action type');
  }
}

/**
 * Provider component for SurveyAnswerContext.
 */
export default function SurveyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, stateDefaults);
  /**
   * Use React.useMemo here to avoid unnecessary rerenders
   * @see https://reactjs.org/docs/hooks-reference.html#usememo
   */
  const value = useMemo<Context>(() => [state, dispatch], [state]);

  return (
    <SurveyAnswerContext.Provider value={value}>
      {children}
    </SurveyAnswerContext.Provider>
  );
}
