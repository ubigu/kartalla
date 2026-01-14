import {
  Box,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';

import {
  Conditions,
  SurveyPage,
  SurveyPageConditions,
} from '@interfaces/survey';
import { useTranslations } from '@src/stores/TranslationContext';
import { isFollowUpSectionParentType } from '@src/utils/typeCheck';
import { useParams } from 'react-router-dom';
import { ConditionRow } from './ConditionRow';

interface SurveyPageConditionProps {
  pages: SurveyPage[];
  activePage: SurveyPage;
  sectionId: string;
}

function SurveyPageCondition({
  pages,
  activePage,
  sectionId,
}: SurveyPageConditionProps) {
  const { tr } = useTranslations();
  const { editPage } = useSurvey();

  const selectedQuestion = pages
    .find((page) =>
      page.sections.some((section) => section.id === Number(sectionId)),
    )
    ?.sections.find((sect) => sect.id === Number(sectionId));

  function getOptionsWithSectionId(sectionId: string) {
    if (
      !sectionId ||
      sectionId === '' ||
      (selectedQuestion.type !== 'radio' &&
        selectedQuestion.type !== 'checkbox')
    )
      return [];

    return selectedQuestion.options;
  }

  function handleConditionUpdate(
    operator: keyof Conditions,
    value: (number | string)[],
  ) {
    editPage({
      ...activePage,
      conditions: {
        ...activePage.conditions,
        [sectionId]: {
          ...(activePage.conditions?.[Number(sectionId)] ?? {}),
          [operator]: value,
        },
      } as SurveyPageConditions,
    });
  }

  return (
    <FormControl fullWidth>
      <ConditionRow
        conditionIsNumeric={['numeric', 'slider'].includes(
          selectedQuestion?.type,
        )}
        allowCustomAnswer={
          (selectedQuestion.type === 'checkbox' ||
            selectedQuestion.type === 'radio') &&
          selectedQuestion.allowCustomAnswer
        }
        conditions={activePage.conditions[Number(sectionId)]}
        options={getOptionsWithSectionId(sectionId)}
        label={
          tr.FollowUpSection.conditions.types[
            ['numeric', 'slider'].includes(selectedQuestion?.type)
              ? 'equals'
              : 'contains'
          ]
        }
        onInput={(value) => handleConditionUpdate('equals', value)}
        textFieldValue={
          activePage.conditions[selectedQuestion.id]?.equals[0] ?? ''
        }
      />
      {['numeric', 'slider'].includes(selectedQuestion?.type) && (
        <>
          <ConditionRow
            conditionIsNumeric
            labelPrefix={tr.FollowUpSection.conditions.types.or}
            label={tr.FollowUpSection.conditions.types.greaterThan}
            onInput={(value) => handleConditionUpdate('greaterThan', value)}
            textFieldValue={
              activePage.conditions[selectedQuestion.id]?.greaterThan[0] ?? ''
            }
          />

          <ConditionRow
            conditionIsNumeric
            labelPrefix={tr.FollowUpSection.conditions.types.or}
            label={tr.FollowUpSection.conditions.types.lessThan}
            onInput={(value) => handleConditionUpdate('lessThan', value)}
            textFieldValue={
              activePage.conditions[selectedQuestion.id]?.lessThan[0] ?? ''
            }
          />
        </>
      )}
    </FormControl>
  );
}

export function EditSurveyPageConditions() {
  const { activeSurvey } = useSurvey();
  const { surveyLanguage } = useTranslations();
  const { editPage } = useSurvey();
  const { tr } = useTranslations();

  const { pageId } = useParams<{
    pageId: string;
  }>();

  const emptyConditions: Conditions = {
    equals: [],
    lessThan: [],
    greaterThan: [],
  };

  const activePageIndex = activeSurvey.pages.findIndex(
    (page) => page.id === Number(pageId),
  );
  const activePage = activeSurvey.pages[activePageIndex];
  const conditionList = activePage.conditions
    ? Object.entries(activePage.conditions)
    : [];

  if (
    activePageIndex === 0 ||
    activePageIndex === activeSurvey.pages.length - 1
  )
    return null;

  const previousNonConditionalPages = activeSurvey.pages
    .slice(0, activePageIndex)
    .filter(
      (page) => !page?.conditions || Object.keys(page.conditions).length === 0,
    );

  const previousQuestions = previousNonConditionalPages
    .map((page, pageIndex) =>
      page.sections
        .filter((sect) => isFollowUpSectionParentType(sect))
        .map((section) => ({
          id: section.id,
          title: section.title,
          pageId: page.id,
          pageIndex,
        })),
    )
    .flat(1);

  function handleQuestionSelect(event: SelectChangeEvent<string>) {
    const { value } = event.target;

    // should be only one SurveyPageCondition per page
    const updatedConditions = { [value]: emptyConditions };

    editPage({
      ...activePage,
      conditions: updatedConditions,
    });
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '10px',
        maxWidth: '45rem',
      }}
    >
      <FormControl
        fullWidth
        sx={{
          flexDirection: 'row',
          marginTop: '10px',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <FormLabel
          sx={{
            minWidth: '90px',
            textAlign: 'right',
          }}
        >
          {tr.EditSurveyPage.conditions.label}
        </FormLabel>
        <Select
          sx={{
            flex: 2,
            backgroundColor: 'white',
            '& .MuiSelect-select': {
              paddingY: '0.75rem',
            },
          }}
          onChange={(event) => {
            editPage({
              ...activePage,
              conditions:
                event.target.value === 'noConditions'
                  ? {}
                  : { [String(previousQuestions[0].id)]: emptyConditions },
            });
          }}
          value={conditionList?.length > 0 ? 'conditions' : 'noConditions'}
        >
          <MenuItem
            value={'noConditions'}
          >{`${tr.EditSurveyPage.conditions.pageVisible}.`}</MenuItem>
          <MenuItem
            value={'conditions'}
          >{`${tr.EditSurveyPage.conditions.pageHasConditions}:`}</MenuItem>
        </Select>
      </FormControl>
      {conditionList?.length > 0 && (
        <>
          <FormControl
            fullWidth
            sx={{
              flexDirection: 'row',
              marginTop: '10px',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <FormLabel
              sx={{
                textAlign: 'right',
                minWidth: '90px',
              }}
            >
              {tr.EditSurveyPage.conditions.questionSelectorLabel}
            </FormLabel>
            <Select
              displayEmpty
              sx={{
                flex: 2,
                backgroundColor: 'white',
                overflow: 'hidden',
                '& .MuiSelect-select': {
                  paddingY: '0.75rem',
                  minWidth: 0,
                  '& .MuiTypography-root': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                },
              }}
              value={
                conditionList.length > 0
                  ? conditionList[0][0]
                  : (String(previousQuestions?.[0].id) ?? '')
              }
              onChange={(event) => handleQuestionSelect(event)}
            >
              {previousQuestions.map((question) => (
                <MenuItem
                  key={`${question.pageId}-${question.id}`}
                  value={String(question.id)}
                >
                  <Typography>{`${
                    previousNonConditionalPages[question.pageIndex].title[
                      surveyLanguage
                    ] === ''
                      ? tr.EditSurvey.untitledPage
                      : previousNonConditionalPages[question.pageIndex].title[
                          surveyLanguage
                        ]
                  }: ${question.title[surveyLanguage]}`}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <>
            {conditionList.map(([sectionId, _conditions]) => (
              <SurveyPageCondition
                key={sectionId}
                pages={previousNonConditionalPages}
                activePage={activePage}
                sectionId={sectionId}
              />
            ))}
          </>
        </>
      )}
    </Box>
  );
}
