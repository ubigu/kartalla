import {
  LocalizedText,
  Submission,
  Survey,
  SurveyPageSection,
} from '@interfaces/survey';
import { describe, expect, it } from 'vitest';
import { createMockSurvey } from '@src/tests/data/survey';
import { addHumanReadableLabels } from './submissionLabels';

const lt = (fi: string): LocalizedText => ({ fi, en: fi, sv: fi });

const dontKnow: LocalizedText = {
  fi: 'En osaa sanoa',
  en: "I don't know",
  sv: 'Jag vet inte',
};

function makeSurveyWithSections(sections: SurveyPageSection[]): Survey {
  const base = createMockSurvey(1, 100);
  return { ...base, pages: [{ ...base.pages![0], sections }] };
}

function makeSubmission(
  id: number,
  answerEntries: Submission['answerEntries'],
): Submission {
  return { id, timestamp: new Date('2024-06-01T12:00:00Z'), answerEntries };
}

describe('addHumanReadableLabels', () => {
  it('radio: value becomes the selected option id + resolved text', () => {
    const survey = makeSurveyWithSections([
      {
        id: 1,
        type: 'radio',
        title: lt('Radio question'),
        isRequired: false,
        allowCustomAnswer: true,
        options: [
          { id: 11, text: lt('Yes') },
          { id: 12, text: lt('No') },
        ],
      },
    ]);
    const [submission] = addHumanReadableLabels(
      [makeSubmission(1, [{ sectionId: 1, type: 'radio', value: 12 }])],
      survey,
    );
    expect(submission.answerEntries[0]).toMatchObject({
      sectionTitle: lt('Radio question'),
      value: { id: 12, label: lt('No') },
    });
  });

  it('radio: passes a custom text answer through as-is (no id)', () => {
    const survey = makeSurveyWithSections([
      {
        id: 1,
        type: 'radio',
        title: lt('Radio question'),
        isRequired: false,
        allowCustomAnswer: true,
        options: [{ id: 11, text: lt('Yes') }],
      },
    ]);
    const [submission] = addHumanReadableLabels(
      [
        makeSubmission(1, [
          { sectionId: 1, type: 'radio', value: 'my custom answer' },
        ]),
      ],
      survey,
    );
    expect(submission.answerEntries[0]).toMatchObject({
      value: 'my custom answer',
    });
  });

  it('radio: keeps the id with a null label when the option can no longer be found', () => {
    const survey = makeSurveyWithSections([
      {
        id: 1,
        type: 'radio',
        title: lt('Radio question'),
        isRequired: false,
        allowCustomAnswer: false,
        options: [],
      },
    ]);
    const [submission] = addHumanReadableLabels(
      [makeSubmission(1, [{ sectionId: 1, type: 'radio', value: 999 }])],
      survey,
    );
    expect(submission.answerEntries[0]).toMatchObject({
      value: { id: 999, label: null },
    });
  });

  it('radio-image: value becomes the selected option id + resolved text', () => {
    const survey = makeSurveyWithSections([
      {
        id: 2,
        type: 'radio-image',
        title: lt('Radio image question'),
        isRequired: false,
        allowCustomAnswer: false,
        options: [
          {
            id: 21,
            text: lt('Picture A'),
            imageUrl: 'a.png',
            altText: lt(''),
            attributions: null,
          },
        ],
      },
    ]);
    const [submission] = addHumanReadableLabels(
      [makeSubmission(1, [{ sectionId: 2, type: 'radio-image', value: 21 }])],
      survey,
    );
    expect(submission.answerEntries[0]).toMatchObject({
      value: { id: 21, label: lt('Picture A') },
    });
  });

  it('checkbox: value becomes each selected option id + resolved text, custom text passes through', () => {
    const survey = makeSurveyWithSections([
      {
        id: 3,
        type: 'checkbox',
        title: lt('Checkbox question'),
        isRequired: false,
        answerLimits: {},
        allowCustomAnswer: true,
        options: [
          { id: 31, text: lt('Option A') },
          { id: 32, text: lt('Option B') },
        ],
      },
    ]);
    const [submission] = addHumanReadableLabels(
      [
        makeSubmission(1, [
          {
            sectionId: 3,
            type: 'checkbox',
            value: [32, 'custom text', 31],
          },
        ]),
      ],
      survey,
    );
    expect(submission.answerEntries[0]).toMatchObject({
      value: [
        { id: 32, label: lt('Option B') },
        'custom text',
        { id: 31, label: lt('Option A') },
      ],
    });
  });

  it('sorting: value becomes the ordered options, each id + resolved text', () => {
    const survey = makeSurveyWithSections([
      {
        id: 4,
        type: 'sorting',
        title: lt('Sorting question'),
        isRequired: false,
        options: [
          { id: 41, text: lt('First') },
          { id: 42, text: lt('Second') },
        ],
      },
    ]);
    const [submission] = addHumanReadableLabels(
      [makeSubmission(1, [{ sectionId: 4, type: 'sorting', value: [42, 41] }])],
      survey,
    );
    expect(submission.answerEntries[0]).toMatchObject({
      value: [
        { id: 42, label: lt('Second') },
        { id: 41, label: lt('First') },
      ],
    });
  });

  it('grouped-checkbox: value becomes each selected id + group/option text, even from a later group', () => {
    const survey = makeSurveyWithSections([
      {
        id: 5,
        type: 'grouped-checkbox',
        title: lt('Grouped checkbox question'),
        isRequired: false,
        answerLimits: {},
        groups: [
          {
            id: 51,
            name: lt('Group 1'),
            options: [{ id: 511, text: lt('G1 option') }],
          },
          {
            id: 52,
            name: lt('Group 2'),
            options: [{ id: 521, text: lt('G2 option') }],
          },
        ],
      },
    ]);
    const [submission] = addHumanReadableLabels(
      [
        makeSubmission(1, [
          { sectionId: 5, type: 'grouped-checkbox', value: [521, 511] },
        ]),
      ],
      survey,
    );
    expect(submission.answerEntries[0]).toMatchObject({
      value: [
        { id: 521, group: lt('Group 2'), option: lt('G2 option') },
        { id: 511, group: lt('Group 1'), option: lt('G1 option') },
      ],
    });
  });

  it('matrix: value becomes one entry per subject, paired with its resolved class ("-1" -> "don\'t know")', () => {
    const survey = makeSurveyWithSections([
      {
        id: 6,
        type: 'matrix',
        title: lt('Matrix question'),
        isRequired: false,
        allowEmptyAnswer: true,
        subjects: [lt('Subject A'), lt('Subject B')],
        classes: [lt('Class 0'), lt('Class 1')],
      },
    ]);
    const [submission] = addHumanReadableLabels(
      [
        makeSubmission(1, [
          { sectionId: 6, type: 'matrix', value: ['1', '-1'] },
        ]),
      ],
      survey,
    );
    expect(submission.answerEntries[0]).toMatchObject({
      value: [
        {
          subject: { id: 0, label: lt('Subject A') },
          class: { id: 1, label: lt('Class 1') },
        },
        {
          subject: { id: 1, label: lt('Subject B') },
          class: { id: -1, label: dontKnow },
        },
      ],
    });
  });

  it('multi-matrix: value becomes one entry per subject, paired with its resolved classes ("-1" -> "don\'t know")', () => {
    const survey = makeSurveyWithSections([
      {
        id: 7,
        type: 'multi-matrix',
        title: lt('Multi-matrix question'),
        isRequired: false,
        allowEmptyAnswer: true,
        answerLimits: {},
        subjects: [lt('Subject A'), lt('Subject B')],
        classes: [lt('Class 0'), lt('Class 1')],
      },
    ]);
    const [submission] = addHumanReadableLabels(
      [
        makeSubmission(1, [
          {
            sectionId: 7,
            type: 'multi-matrix',
            value: [['0', '1'], ['-1']],
          },
        ]),
      ],
      survey,
    );
    expect(submission.answerEntries[0]).toMatchObject({
      value: [
        {
          subject: { id: 0, label: lt('Subject A') },
          classes: [
            { id: 0, label: lt('Class 0') },
            { id: 1, label: lt('Class 1') },
          ],
        },
        {
          subject: { id: 1, label: lt('Subject B') },
          classes: [{ id: -1, label: dontKnow }],
        },
      ],
    });
  });

  it('budgeting: value becomes each target paired with its resolved name and allocated amount', () => {
    const survey = makeSurveyWithSections([
      {
        id: 8,
        type: 'budgeting',
        title: lt('Budgeting question'),
        isRequired: false,
        budgetingMode: 'direct',
        totalBudget: 100,
        targets: [{ name: lt('Target A') }, { name: lt('Target B') }],
        allocationDirection: 'increasing',
      },
    ]);
    const [submission] = addHumanReadableLabels(
      [
        makeSubmission(1, [
          { sectionId: 8, type: 'budgeting', value: [40, 60] },
        ]),
      ],
      survey,
    );
    expect(submission.answerEntries[0]).toMatchObject({
      value: [
        { target: { id: 0, label: lt('Target A') }, value: 40 },
        { target: { id: 1, label: lt('Target B') }, value: 60 },
      ],
    });
  });

  it('geo-budgeting: attaches the resolved target name onto each placement', () => {
    const survey = makeSurveyWithSections([
      {
        id: 9,
        type: 'geo-budgeting',
        title: lt('Geo-budgeting question'),
        isRequired: false,
        totalBudget: 100,
        targets: [{ name: lt('Target A') }, { name: lt('Target B') }],
        allocationDirection: 'increasing',
      },
    ]);
    const [submission] = addHumanReadableLabels(
      [
        makeSubmission(1, [
          {
            sectionId: 9,
            type: 'geo-budgeting',
            value: [
              {
                targetIndex: 1,
                geometry: {
                  type: 'Feature',
                  geometry: { type: 'Point', coordinates: [0, 0] },
                  properties: {},
                },
              },
            ],
          },
        ]),
      ],
      survey,
    );
    expect(submission.answerEntries[0]).toMatchObject({
      value: [{ targetIndex: 1, targetName: lt('Target B') }],
    });
  });

  it('follow-up sections: resolves labels for answer entries belonging to a follow-up section, including its own nested content', () => {
    const survey = makeSurveyWithSections([
      {
        id: 30,
        type: 'radio',
        title: lt('Parent question'),
        isRequired: false,
        allowCustomAnswer: false,
        options: [
          { id: 301, text: lt('Yes') },
          { id: 302, text: lt('No') },
        ],
        followUpSections: [
          {
            id: 31,
            type: 'map',
            title: lt('Follow-up map question'),
            isRequired: false,
            selectionTypes: ['point'],
            featureStyles: {
              point: { markerIcon: '' },
              line: { strokeStyle: 'solid', strokeColor: '#000' },
              area: { strokeStyle: 'solid', strokeColor: '#000' },
            },
            subQuestions: [
              {
                id: 311,
                type: 'radio',
                title: lt('Follow-up map subquestion'),
                isRequired: false,
                allowCustomAnswer: false,
                options: [{ id: 3111, text: lt('Sub option') }],
              },
            ],
            conditions: { equals: [301], lessThan: [], greaterThan: [] },
          },
        ],
      } as SurveyPageSection,
    ]);
    const [submission] = addHumanReadableLabels(
      [
        makeSubmission(1, [
          { sectionId: 30, type: 'radio', value: 301 },
          {
            sectionId: 31,
            type: 'map',
            value: [
              {
                selectionType: 'point',
                mapLayers: [],
                geometry: {
                  type: 'Feature',
                  geometry: { type: 'Point', coordinates: [0, 0] },
                  properties: {},
                },
                subQuestionAnswers: [
                  { sectionId: 311, type: 'radio', value: 3111 },
                ],
              },
            ],
          },
        ]),
      ],
      survey,
    );
    expect(submission.answerEntries).toMatchObject([
      {
        sectionTitle: lt('Parent question'),
        value: { id: 301, label: lt('Yes') },
      },
      {
        sectionTitle: lt('Follow-up map question'),
        value: [
          {
            subQuestionAnswers: [
              {
                sectionTitle: lt('Follow-up map subquestion'),
                value: { id: 3111, label: lt('Sub option') },
              },
            ],
          },
        ],
      },
    ]);
  });

  it('map: resolves the section title and recursively labels nested subquestion answers within value', () => {
    const survey = makeSurveyWithSections([
      {
        id: 10,
        type: 'map',
        title: lt('Map question'),
        isRequired: false,
        selectionTypes: ['point'],
        featureStyles: {
          point: { markerIcon: '' },
          line: { strokeStyle: 'solid', strokeColor: '#000' },
          area: { strokeStyle: 'solid', strokeColor: '#000' },
        },
        subQuestions: [
          {
            id: 101,
            type: 'checkbox',
            title: lt('Map subquestion'),
            isRequired: false,
            answerLimits: {},
            allowCustomAnswer: false,
            options: [{ id: 1011, text: lt('Sub option') }],
          },
        ],
      },
    ]);
    const [submission] = addHumanReadableLabels(
      [
        makeSubmission(1, [
          {
            sectionId: 10,
            type: 'map',
            value: [
              {
                selectionType: 'point',
                mapLayers: [],
                geometry: {
                  type: 'Feature',
                  geometry: { type: 'Point', coordinates: [0, 0] },
                  properties: {},
                },
                subQuestionAnswers: [
                  { sectionId: 101, type: 'checkbox', value: [1011] },
                ],
              },
            ],
          },
        ]),
      ],
      survey,
    );
    const entry = submission.answerEntries[0] as any;
    expect(entry.sectionTitle).toEqual(lt('Map question'));
    expect(entry.value[0].subQuestionAnswers[0]).toMatchObject({
      sectionTitle: lt('Map subquestion'),
      value: [{ id: 1011, label: lt('Sub option') }],
    });
  });

  it.each([
    [
      'personal-info',
      {
        name: 'Test',
        email: null,
        phone: null,
        address: null,
        custom: null,
      },
    ],
    ['free-text', 'some free text'],
    ['numeric', 42],
    ['slider', 3],
    ['attachment', [{ fileString: 'data:...', fileName: 'file.pdf' }]],
  ] as const)(
    '%s: value is left untouched, only sectionTitle is added',
    (type, value) => {
      const survey = makeSurveyWithSections([
        {
          id: 20,
          type: 'free-text',
          title: lt('Plain question'),
          isRequired: false,
        } as SurveyPageSection,
      ]);
      survey.pages[0].sections[0] = {
        ...survey.pages[0].sections[0],
        type,
      } as any;

      const [submission] = addHumanReadableLabels(
        [makeSubmission(1, [{ sectionId: 20, type, value } as any])],
        survey,
      );
      const entry = submission.answerEntries[0];
      expect(entry).toEqual({
        sectionId: 20,
        type,
        value,
        sectionTitle: lt('Plain question'),
      });
    },
  );

  it('leaves the entry unenriched (but does not crash) when the sectionId is not found', () => {
    const survey = makeSurveyWithSections([]);
    const [submission] = addHumanReadableLabels(
      [
        makeSubmission(1, [
          { sectionId: 999, type: 'free-text', value: 'orphan answer' },
        ]),
      ],
      survey,
    );
    expect(submission.answerEntries[0]).toEqual({
      sectionId: 999,
      type: 'free-text',
      value: 'orphan answer',
      sectionTitle: undefined,
    });
  });
});
