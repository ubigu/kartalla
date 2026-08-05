import {
  LocalizedText,
  PublicationSubmission,
  PublicationSubmissionAnswerEntry,
  SectionOption,
  Submission,
  SubmissionAnswerEntry,
  Survey,
  SurveyBudgetingQuestion,
  SurveyCheckboxQuestion,
  SurveyGeoBudgetingQuestion,
  SurveyGroupedCheckboxQuestion,
  SurveyMatrixQuestion,
  SurveyMultiMatrixQuestion,
  SurveyPageSection,
  SurveyRadioImageQuestion,
  SurveyRadioQuestion,
  SurveySortingQuestion,
} from '@interfaces/survey';
import en from '@src/translations/en.json';
import fi from '@src/translations/fi.json';
import sv from '@src/translations/sv.json';

/** Localized label for the "-1" ("don't know") sentinel used by matrix questions. */
const DONT_KNOW_LABEL: LocalizedText = {
  fi: fi.dontKnow,
  en: en.dontKnow,
  sv: sv.dontKnow,
};

/**
 * Recursively includes follow-up sections and (for map questions)
 * subquestions, since answer entries can reference section ids nested at
 * either level, not just top-level page sections.
 */
function flattenSections(sections: SurveyPageSection[]): SurveyPageSection[] {
  return sections.reduce<SurveyPageSection[]>((flat, section) => {
    flat.push(section);
    if (section.followUpSections?.length) {
      flat.push(...flattenSections(section.followUpSections));
    }
    if (section.type === 'map') {
      flat.push(...flattenSections(section.subQuestions));
    }
    return flat;
  }, []);
}

function getSectionsById(survey: Survey): Map<number, SurveyPageSection> {
  const sections = flattenSections(
    (survey.pages ?? []).flatMap((page) => page.sections),
  );
  return new Map(
    sections
      .filter((section) => section.id != null)
      .map((section) => [section.id, section]),
  );
}

function findOptionText(
  options: SectionOption[],
  id: number,
): LocalizedText | null {
  return options.find((option) => option.id === id)?.text ?? null;
}

/**
 * Resolves a single selected option to an explicit `{id, label}` pair
 * (`label` is `null` if the option can no longer be found). A string value
 * is a custom answer (when the question allows one) and is returned as-is,
 * since it's already human-readable and has no id to map.
 */
function resolveSelectedOption(
  options: SectionOption[],
  value: string | number | null | undefined,
): { id: number; label: LocalizedText | null } | string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  return { id: value, label: findOptionText(options, value) };
}

/**
 * Resolves a class index to its id + text. "-1" is the "don't know"
 * sentinel used by matrix questions.
 */
function resolveClassById(
  classes: LocalizedText[] | undefined,
  classIndex: string,
): { id: number; label: LocalizedText | null } {
  const id = Number(classIndex);
  if (classIndex === '-1') {
    return { id, label: DONT_KNOW_LABEL };
  }
  return { id, label: classes?.[id] ?? null };
}

/** `classIndex` is `null` when the subject was left unanswered. */
function resolveClass(
  classes: LocalizedText[] | undefined,
  classIndex: string | null | undefined,
): { id: number; label: LocalizedText | null } | null {
  return classIndex == null ? null : resolveClassById(classes, classIndex);
}

function addLabels(
  entry: SubmissionAnswerEntry,
  sectionsById: Map<number, SurveyPageSection>,
): PublicationSubmissionAnswerEntry {
  const section = sectionsById.get(entry.sectionId);
  const sectionTitle = section?.title;

  switch (entry.type) {
    case 'radio':
    case 'radio-image': {
      const options =
        (section as SurveyRadioQuestion | SurveyRadioImageQuestion)?.options ??
        [];
      return {
        ...entry,
        sectionTitle,
        value: resolveSelectedOption(options, entry.value),
      };
    }
    case 'checkbox': {
      const options = (section as SurveyCheckboxQuestion)?.options ?? [];
      const value = (entry.value ?? []).map((v) =>
        typeof v === 'string'
          ? v
          : { id: v, label: findOptionText(options, v) },
      );
      return { ...entry, sectionTitle, value };
    }
    case 'sorting': {
      const options = (section as SurveySortingQuestion)?.options ?? [];
      const value = (entry.value ?? []).map((id) => ({
        id,
        label: findOptionText(options, id),
      }));
      return { ...entry, sectionTitle, value };
    }
    case 'grouped-checkbox': {
      const groups = (section as SurveyGroupedCheckboxQuestion)?.groups ?? [];
      const value = (entry.value ?? []).map((id) => {
        for (const group of groups) {
          const option = group.options.find((option) => option.id === id);
          if (option) {
            return { id, group: group.name, option: option.text };
          }
        }
        return { id, group: null, option: null };
      });
      return { ...entry, sectionTitle, value };
    }
    case 'matrix': {
      const question = section as SurveyMatrixQuestion;
      const subjects = question?.subjects ?? [];
      const value = subjects.map((subject, index) => ({
        subject: { id: index, label: subject },
        class: resolveClass(question?.classes, entry.value?.[index]),
      }));
      return { ...entry, sectionTitle, value };
    }
    case 'multi-matrix': {
      const question = section as SurveyMultiMatrixQuestion;
      const subjects = question?.subjects ?? [];
      const value = subjects.map((subject, index) => ({
        subject: { id: index, label: subject },
        classes: (entry.value?.[index] ?? []).map((classIndex) =>
          resolveClassById(question?.classes, classIndex),
        ),
      }));
      return { ...entry, sectionTitle, value };
    }
    case 'budgeting': {
      const question = section as SurveyBudgetingQuestion;
      const targets = question?.targets ?? [];
      const value = targets.map((target, index) => ({
        target: { id: index, label: target.name },
        value: entry.value?.[index] ?? 0,
      }));
      return { ...entry, sectionTitle, value };
    }
    case 'geo-budgeting': {
      const question = section as SurveyGeoBudgetingQuestion;
      const targets = question?.targets ?? [];
      const value = (entry.value ?? []).map((placement) => ({
        ...placement,
        targetName: targets[placement.targetIndex]?.name ?? null,
      }));
      return { ...entry, sectionTitle, value };
    }
    case 'map': {
      const value = (entry.value ?? []).map((mapAnswer) => ({
        ...mapAnswer,
        subQuestionAnswers: (mapAnswer.subQuestionAnswers ?? []).map(
          (subEntry) => addLabels(subEntry, sectionsById),
        ),
      }));
      return { ...entry, sectionTitle, value };
    }
    default:
      return { ...entry, sectionTitle };
  }
}

/**
 * Enriches submission answer entries with human-readable, localized text
 * resolved against the survey's question definitions (option/class/subject/
 * target names), for use by the public submission publication API. Ids are
 * kept alongside their resolved text directly within `value`.
 */
export function addHumanReadableLabels(
  submissions: Submission[],
  survey: Survey,
): PublicationSubmission[] {
  const sectionsById = getSectionsById(survey);
  return submissions.map((submission) => ({
    ...submission,
    answerEntries: (submission.answerEntries ?? []).map((entry) =>
      addLabels(entry, sectionsById),
    ),
  }));
}
