/**
 * Seed script: creates a test survey covering every question type.
 *
 * Run from the server/ directory:
 *   npx ts-node -r tsconfig-paths/register src/scripts/createTestSurvey.ts
 *
 * Requires DATABASE_URL (and DATABASE_ENCRYPTION_KEY) to be set, e.g.:
 *   DATABASE_URL=postgresql://kartalla_user:password@localhost:5432/kartalla_db \
 *   DATABASE_ENCRYPTION_KEY=any32charstring \
 *   npx ts-node -r tsconfig-paths/register src/scripts/createTestSurvey.ts
 */

import PgPromise from 'pg-promise';
import {
  BudgetAllocationDirection,
  LocalizedText,
  SurveyAttachmentQuestion,
  SurveyBudgetingQuestion,
  SurveyCheckboxQuestion,
  SurveyFreeTextQuestion,
  SurveyGeoBudgetingQuestion,
  SurveyGroupedCheckboxQuestion,
  SurveyMapQuestion,
  SurveyMatrixQuestion,
  SurveyMultiMatrixQuestion,
  SurveyNumericQuestion,
  SurveyPageSection,
  SurveyPersonalInfoQuestion,
  SurveyRadioImageQuestion,
  SurveyRadioQuestion,
  SurveySliderQuestion,
  SurveySortingQuestion,
  SurveyTextSection,
} from '@interfaces/survey';
import { initializeDatabase, getDb } from '@src/database';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SURVEY_NAME = 'test-all-question-types';

/** Builds a LocalizedText with the same value for all three languages. */
function loc(fi: string, en: string, se = en): LocalizedText {
  return { fi, en, se };
}

// ---------------------------------------------------------------------------
// Survey data – all question types defined with full TypeScript types
// ---------------------------------------------------------------------------

// Page 1 ─────────────────────────────────────────────────────────────────────
const page1Sections: SurveyPageSection[] = [
  {
    type: 'text',
    title: loc('Tervetuloa', 'Welcome', 'Välkommen'),
    body: loc(
      'Tämä kyselylomake testaa kaikkia kysymystyyppejä.',
      'This survey tests all question types.',
      'Denna enkät testar alla frågetyper.',
    ),
    bodyColor: '#000000',
  } satisfies SurveyTextSection,

  {
    type: 'personal-info',
    title: loc('Henkilötiedot', 'Personal information', 'Personuppgifter'),
    isRequired: false,
    askName: true,
    askEmail: true,
    askPhone: true,
    askAddress: false,
    askCustom: false,
  } satisfies SurveyPersonalInfoQuestion,

  {
    type: 'free-text',
    title: loc(
      'Vapaamuotoinen kommentti',
      'Free text comment',
      'Fritextkommentar',
    ),
    isRequired: false,
    maxLength: 500,
  } satisfies SurveyFreeTextQuestion,
];

// Page 2 ─────────────────────────────────────────────────────────────────────
const page2Sections: SurveyPageSection[] = [
  {
    type: 'radio',
    title: loc(
      'Yksi valinta (radio)',
      'Single choice (radio)',
      'Enstaka val (radio)',
    ),
    isRequired: true,
    allowCustomAnswer: false,
    options: [
      { text: loc('Vaihtoehto A', 'Option A', 'Alternativ A') },
      { text: loc('Vaihtoehto B', 'Option B', 'Alternativ B') },
      { text: loc('Vaihtoehto C', 'Option C', 'Alternativ C') },
      { text: loc('Vaihtoehto D', 'Option D', 'Alternativ D') },
    ],
  } satisfies SurveyRadioQuestion,

  {
    type: 'radio-image',
    title: loc(
      'Kuvavalintakysymys',
      'Image option question',
      'Bildalternativsfråga',
    ),
    isRequired: false,
    allowCustomAnswer: false,
    options: [
      {
        text: loc('Kuva A', 'Image A', 'Bild A'),
        imageUrl: null,
        altText: loc('Kuvavaihtoehto A', 'Image option A', 'Bildalternativ A'),
        attributions: '',
      },
      {
        text: loc('Kuva B', 'Image B', 'Bild B'),
        imageUrl: null,
        altText: loc('Kuvavaihtoehto B', 'Image option B', 'Bildalternativ B'),
        attributions: '',
      },
      {
        text: loc('Kuva C', 'Image C', 'Bild C'),
        imageUrl: null,
        altText: loc('Kuvavaihtoehto C', 'Image option C', 'Bildalternativ C'),
        attributions: '',
      },
    ],
  } satisfies SurveyRadioImageQuestion,

  {
    type: 'checkbox',
    title: loc(
      'Monivalinta (checkbox, max 3)',
      'Multiple choice (checkbox, max 3)',
      'Flerval (kryssruta, max 3)',
    ),
    isRequired: false,
    allowCustomAnswer: true,
    answerLimits: { min: 1, max: 3 },
    options: [
      { text: loc('Valinta 1', 'Choice 1', 'Val 1') },
      {
        text: loc('Valinta 2', 'Choice 2', 'Val 2'),
        info: loc(
          'Lisätietoa valinnasta 2',
          'More info about choice 2',
          'Mer info om val 2',
        ),
      },
      { text: loc('Valinta 3', 'Choice 3', 'Val 3') },
      { text: loc('Valinta 4', 'Choice 4', 'Val 4') },
    ],
  } satisfies SurveyCheckboxQuestion,

  {
    type: 'sorting',
    title: loc('Järjestelykysymys', 'Sorting question', 'Sorteringsfråga'),
    isRequired: false,
    options: [
      { text: loc('Kohde 1', 'Item 1', 'Objekt 1') },
      { text: loc('Kohde 2', 'Item 2', 'Objekt 2') },
      { text: loc('Kohde 3', 'Item 3', 'Objekt 3') },
      { text: loc('Kohde 4', 'Item 4', 'Objekt 4') },
    ],
  } satisfies SurveySortingQuestion,

  {
    type: 'grouped-checkbox',
    title: loc(
      'Ryhmitelty monivalinta',
      'Grouped checkbox',
      'Grupperad kryssruta',
    ),
    isRequired: false,
    answerLimits: { min: null, max: null },
    groups: [
      {
        id: null as unknown as number, // assigned by DB on insert
        name: loc('Ryhmä 1', 'Group 1', 'Grupp 1'),
        options: [
          {
            text: loc(
              'R1 – vaihtoehto A',
              'G1 – option A',
              'G1 – alternativ A',
            ),
          },
          {
            text: loc(
              'R1 – vaihtoehto B',
              'G1 – option B',
              'G1 – alternativ B',
            ),
          },
          {
            text: loc(
              'R1 – vaihtoehto C',
              'G1 – option C',
              'G1 – alternativ C',
            ),
          },
        ],
      },
      {
        id: null as unknown as number, // assigned by DB on insert
        name: loc('Ryhmä 2', 'Group 2', 'Grupp 2'),
        options: [
          {
            text: loc(
              'R2 – vaihtoehto A',
              'G2 – option A',
              'G2 – alternativ A',
            ),
          },
          {
            text: loc(
              'R2 – vaihtoehto B',
              'G2 – option B',
              'G2 – alternativ B',
            ),
          },
          {
            text: loc(
              'R2 – vaihtoehto C',
              'G2 – option C',
              'G2 – alternativ C',
            ),
          },
        ],
      },
    ],
  } satisfies SurveyGroupedCheckboxQuestion,
];

// Page 3 ─────────────────────────────────────────────────────────────────────
const page3Sections: SurveyPageSection[] = [
  {
    type: 'numeric',
    title: loc(
      'Numerokysymys (1–100)',
      'Numeric question (1–100)',
      'Numerisk fråga (1–100)',
    ),
    isRequired: false,
    minValue: 1,
    maxValue: 100,
  } satisfies SurveyNumericQuestion,

  {
    type: 'slider',
    title: loc('Liukusäädin (0–10)', 'Slider (0–10)', 'Skjutreglage (0–10)'),
    isRequired: false,
    presentationType: 'numeric',
    minValue: 0,
    maxValue: 10,
    minLabel: loc('Ei lainkaan', 'Not at all', 'Inte alls'),
    maxLabel: loc('Erittäin paljon', 'Very much', 'Väldigt mycket'),
  } satisfies SurveySliderQuestion,
];

// Page 4 ─────────────────────────────────────────────────────────────────────
const page4Sections: SurveyPageSection[] = [
  {
    type: 'matrix',
    title: loc('Matriisikysymys', 'Matrix question', 'Matrisfråga'),
    isRequired: false,
    allowEmptyAnswer: true,
    classes: [
      loc('Täysin samaa mieltä', 'Strongly agree', 'Håller helt med'),
      loc('Samaa mieltä', 'Agree', 'Håller med'),
      loc('Eri mieltä', 'Disagree', 'Håller inte med'),
      loc('Täysin eri mieltä', 'Strongly disagree', 'Håller inte alls med'),
    ],
    subjects: [
      loc('Väite 1', 'Statement 1', 'Påstående 1'),
      loc('Väite 2', 'Statement 2', 'Påstående 2'),
      loc('Väite 3', 'Statement 3', 'Påstående 3'),
    ],
  } satisfies SurveyMatrixQuestion,

  {
    type: 'multi-matrix',
    title: loc('Monivalintamatriisi', 'Multi-matrix', 'Flervals-matris'),
    isRequired: false,
    allowEmptyAnswer: true,
    answerLimits: { min: null, max: null },
    classes: [
      loc('Luokka A', 'Class A', 'Klass A'),
      loc('Luokka B', 'Class B', 'Klass B'),
      loc('Luokka C', 'Class C', 'Klass C'),
    ],
    subjects: [
      loc('Aihe 1', 'Topic 1', 'Ämne 1'),
      loc('Aihe 2', 'Topic 2', 'Ämne 2'),
    ],
  } satisfies SurveyMultiMatrixQuestion,

  {
    type: 'budgeting',
    title: loc(
      'Budjetointikysymys (1000 €)',
      'Budgeting question (€1000)',
      'Budgeteringsfråga (1000 €)',
    ),
    isRequired: false,
    budgetingMode: 'direct',
    totalBudget: 1000,
    unit: '€',
    allocationDirection: 'decreasing' as BudgetAllocationDirection,
    requireFullAllocation: false,
    inputMode: 'absolute',
    targets: [
      { name: loc('Kohde A', 'Target A', 'Mål A'), price: 100 },
      { name: loc('Kohde B', 'Target B', 'Mål B'), price: 200 },
      { name: loc('Kohde C', 'Target C', 'Mål C'), price: 150 },
      { name: loc('Kohde D', 'Target D', 'Mål D'), price: 50 },
    ],
  } satisfies SurveyBudgetingQuestion,
];

// Page 5 ─────────────────────────────────────────────────────────────────────
const mapSubQuestion: SurveyFreeTextQuestion = {
  type: 'free-text',
  title: loc(
    'Miksi valitsit tämän kohdan?',
    'Why did you choose this location?',
    'Varför valde du denna plats?',
  ),
  isRequired: false,
};

const page5Sections: SurveyPageSection[] = [
  {
    type: 'map',
    title: loc(
      'Karttakysymys (piste, viiva, alue)',
      'Map question (point, line, area)',
      'Kartfråga (punkt, linje, yta)',
    ),
    isRequired: false,
    selectionTypes: ['point', 'line', 'area'],
    featureStyles: {
      point: { markerIcon: null },
      line: { strokeStyle: 'solid', strokeColor: '#0055bb' },
      area: { strokeStyle: 'solid', strokeColor: '#0055bb' },
    },
    subQuestions: [mapSubQuestion],
  } satisfies SurveyMapQuestion,

  {
    type: 'geo-budgeting',
    title: loc(
      'Geo-budjetointikysymys (5 kpl)',
      'Geo-budgeting question (5 pieces)',
      'Geo-budgeteringsfråga (5 st)',
    ),
    isRequired: false,
    totalBudget: 5,
    unit: 'kpl',
    allocationDirection: 'decreasing' as BudgetAllocationDirection,
    targets: [
      { name: loc('Geo-kohde A', 'Geo-target A', 'Geo-mål A') },
      { name: loc('Geo-kohde B', 'Geo-target B', 'Geo-mål B') },
      { name: loc('Geo-kohde C', 'Geo-target C', 'Geo-mål C') },
    ],
  } satisfies SurveyGeoBudgetingQuestion,

  {
    type: 'attachment',
    title: loc('Tiedostoliite', 'File attachment', 'Bilaga'),
    isRequired: false,
    fileUrl: null,
  } satisfies SurveyAttachmentQuestion,
];

const pages = [
  {
    title: loc('Teksti ja tiedot', 'Text & info', 'Text och info'),
    sidebarType: 'none' as const,
    sections: page1Sections,
  },
  {
    title: loc('Valintakysymykset', 'Selection questions', 'Valfrågor'),
    sidebarType: 'none' as const,
    sections: page2Sections,
  },
  {
    title: loc(
      'Numerot ja liukusäädin',
      'Numeric & slider',
      'Numeriska och skjutreglage',
    ),
    sidebarType: 'none' as const,
    sections: page3Sections,
  },
  {
    title: loc(
      'Matriisi ja budjetointi',
      'Matrix & budgeting',
      'Matris och budgetering',
    ),
    sidebarType: 'none' as const,
    sections: page4Sections,
  },
  {
    title: loc('Kartta ja liitteet', 'Map & attachments', 'Karta och bilagor'),
    sidebarType: 'map' as const,
    sections: page5Sections,
  },
];

// ---------------------------------------------------------------------------
// Database insertion
// ---------------------------------------------------------------------------

/** Extracts the `details` JSON that goes in the DB column for a section. */
function sectionDetails(section: SurveyPageSection): object {
  // Mirror surveySectionsToRows: everything except these common fields goes into details
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    id,
    type,
    title,
    body,
    info,
    followUpSections,
    fileUrl,
    options,
    subQuestions,
    groups,
    ...details
  } = section as any;
  return details;
}

async function insertSection(
  db: PgPromise.IBaseProtocol<unknown>,
  pageId: number,
  idx: number,
  section: SurveyPageSection,
  parentSectionId: number | null = null,
): Promise<number> {
  const { title, type, info } = section;
  const body = 'body' in section ? section.body : null;
  const fileUrl = 'fileUrl' in section ? (section as any).fileUrl : null;
  const details = sectionDetails(section);

  const row = await db.one<{ id: number }>(
    `INSERT INTO data.page_section
       (survey_page_id, idx, type, title, body, details, info, file_url, parent_section)
     VALUES ($1, $2, $3, $4::json, $5::json, $6::jsonb, $7::json, $8, $9)
     RETURNING id`,
    [
      pageId,
      idx,
      type,
      JSON.stringify(title),
      JSON.stringify(body),
      JSON.stringify(details),
      JSON.stringify(info ?? null),
      fileUrl,
      parentSectionId,
    ],
  );

  // Insert options for question types that have them
  if ('options' in section && Array.isArray(section.options)) {
    await Promise.all(
      section.options.map(async (option, optIdx) => {
        const fileUrlOpt =
          'imageUrl' in option ? (option as any).imageUrl : null;
        const detailsOpt =
          'imageUrl' in option
            ? {
                altText: (option as any).altText,
                attributions: (option as any).attributions,
              }
            : null;
        await db.none(
          `INSERT INTO data.option (section_id, idx, text, info, file_url, details)
         VALUES ($1, $2, $3::json, $4::json, $5, $6::json)`,
          [
            row.id,
            optIdx,
            JSON.stringify(option.text),
            JSON.stringify(option.info ?? null),
            fileUrlOpt,
            JSON.stringify(detailsOpt),
          ],
        );
      }),
    );
  }

  // Insert option groups (grouped-checkbox)
  if (
    'groups' in section &&
    Array.isArray((section as SurveyGroupedCheckboxQuestion).groups)
  ) {
    const grouped = section as SurveyGroupedCheckboxQuestion;
    await Promise.all(
      grouped.groups.map(async (group, gIdx) => {
        const groupRow = await db.one<{ id: number }>(
          `INSERT INTO data.option_group (section_id, idx, name)
         VALUES ($1, $2, $3::json) RETURNING id`,
          [row.id, gIdx, JSON.stringify(group.name)],
        );
        await Promise.all(
          group.options.map(async (option, optIdx) => {
            await db.none(
              `INSERT INTO data.option (section_id, idx, text, info, group_id)
           VALUES ($1, $2, $3::json, $4::json, $5)`,
              [
                row.id,
                optIdx,
                JSON.stringify(option.text),
                JSON.stringify(option.info ?? null),
                groupRow.id,
              ],
            );
          }),
        );
      }),
    );
  }

  // Insert map sub-questions
  if (
    'subQuestions' in section &&
    Array.isArray((section as SurveyMapQuestion).subQuestions)
  ) {
    const mapQ = section as SurveyMapQuestion;
    await Promise.all(
      mapQ.subQuestions.map((subQ, sqIdx) =>
        insertSection(db, pageId, sqIdx, subQ, row.id),
      ),
    );
  }

  return row.id;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  await initializeDatabase();
  const db = getDb();

  // Guard: abort if survey already exists
  const existing = await db.oneOrNone<{ id: number }>(
    `SELECT id FROM data.survey WHERE name = $1`,
    [SURVEY_NAME],
  );
  if (existing) {
    console.log(
      `Survey "${SURVEY_NAME}" already exists (id=${existing.id}). Delete it first if you want to recreate it.`,
    );
    process.exit(0);
  }

  await db.tx(async (t) => {
    const USER_GROUP_ORG = 'test-group-id-2';

    const userGroup = await t.oneOrNone<{ id: number }>(
      `SELECT id FROM application.user_group WHERE organization = $1 LIMIT 1`,
      [USER_GROUP_ORG],
    );
    if (!userGroup) {
      throw new Error(
        `No user group found with organization="${USER_GROUP_ORG}". Create it in the admin UI first.`,
      );
    }

    const survey = await t.one<{ id: number }>(
      `INSERT INTO data.survey
         (name, title, subtitle, description, author, author_unit,
          start_date, allow_test_survey, display_privacy_statement,
          email_enabled, email_required, allow_saving_unfinished,
          localisation_enabled, is_archived, languages, organization)
       VALUES ($1, $2::json, $3::json, $4::json, $5, $6,
               NOW() - interval '1 day', TRUE, FALSE,
               FALSE, FALSE, FALSE, FALSE, FALSE, $7, $8)
       RETURNING id`,
      [
        SURVEY_NAME,
        JSON.stringify(
          loc('Kaikki kysymystyypit', 'All question types', 'Alla frågetyper'),
        ),
        JSON.stringify(loc('Testikyselylomake', 'Test survey', 'Testenkät')),
        JSON.stringify(
          loc(
            'Tämä kyselylomake testaa kaikkia kysymystyyppejä.',
            'This survey tests all question types.',
            'Denna enkät testar alla frågetyper.',
          ),
        ),
        'Seed Script',
        'Test Unit',
        ['fi', 'en', 'se'],
        USER_GROUP_ORG,
      ],
    );

    await t.none(
      `INSERT INTO data.survey_user_group (survey_id, group_id) VALUES ($1, $2)`,
      [survey.id, userGroup.id],
    );

    await Promise.all(
      pages.map(async (page, pageIdx) => {
        const pageRow = await t.one<{ id: number }>(
          `INSERT INTO data.survey_page (survey_id, idx, title, sidebar_type, sidebar_map_layers)
         VALUES ($1, $2, $3::json, $4, $5::json) RETURNING id`,
          [
            survey.id,
            pageIdx,
            JSON.stringify(page.title),
            page.sidebarType,
            '[]',
          ],
        );
        await Promise.all(
          page.sections.map((section, sIdx) =>
            insertSection(t, pageRow.id, sIdx, section),
          ),
        );
      }),
    );

    console.log('');
    console.log('✓ Test survey created successfully');
    console.log(`  Survey ID   : ${survey.id}`);
    console.log(`  Survey name : ${SURVEY_NAME}`);
    console.log(`  Admin URL   : /admin/surveys/${survey.id}/submissions`);
    console.log('');
  });

  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to create test survey:', err);
  process.exit(1);
});
