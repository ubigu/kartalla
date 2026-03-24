/**
 * Seed script: creates a demo survey about Tievelho road-network data service.
 *
 * Run from the server/ directory:
 *   npx ts-node -r tsconfig-paths/register src/scripts/createTestSurvey.ts
 *
 * Requires DATABASE_URL (and DATABASE_ENCRYPTION_KEY) to be set, e.g.:
 *   DATABASE_URL=postgresql://kartalla_user:password@localhost:5432/kartalla_db \
 *   DATABASE_ENCRYPTION_KEY=any32charstring \
 *   npx ts-node -r tsconfig-paths/register src/scripts/createTestSurvey.ts
 */

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
import { getDb, initializeDatabase } from '@src/database';
import PgPromise from 'pg-promise';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SURVEY_NAME = 'tievelho-kayttajakysely';

/** Builds a LocalizedText with the same value for all three languages. */
function loc(fi: string, en: string, se = en): LocalizedText {
  return { fi, en, se };
}

// ---------------------------------------------------------------------------
// Survey data – Tievelho user experience survey
// ---------------------------------------------------------------------------

// Page 1 – Vastaajan taustatiedot ───────────────────────────────────────────
const page1Sections: SurveyPageSection[] = [
  {
    type: 'text',
    title: loc(
      'Tievelho-käyttäjäkysely 2025',
      'Tievelho User Survey 2025',
      'Tievelho användarundersökning 2025',
    ),
    body: loc(
      'Tievelho on Väyläviraston ylläpitämä tietietopalvelu, joka tarjoaa kattavat aineistot tieverkosta, tien kunnosta ja hoitohistoriasta. Tämän kyselyn avulla kehitämme palvelua vastaamaan paremmin tarpeisiinne. Vastaaminen vie noin 10 minuuttia.',
      "Tievelho is the Finnish Transport Infrastructure Agency's road data service providing comprehensive data on the road network, road conditions and maintenance history. This survey helps us improve the service to better meet your needs. The survey takes about 10 minutes.",
      'Tievelho är Trafikledsverkets vägdatatjänst som erbjuder heltäckande data om vägnätet, vägskick och underhållshistorik. Denna enkät hjälper oss att förbättra tjänsten. Det tar ca 10 minuter att svara.',
    ),
    bodyColor: '#003087',
  } satisfies SurveyTextSection,

  {
    type: 'personal-info',
    title: loc('Yhteystiedot', 'Contact details', 'Kontaktuppgifter'),
    isRequired: false,
    askName: true,
    askEmail: true,
    askPhone: false,
    askAddress: false,
    askCustom: false,
  } satisfies SurveyPersonalInfoQuestion,

  {
    type: 'radio',
    title: loc(
      'Millä sektorilla pääasiassa työskentelette?',
      'In which sector do you mainly work?',
      'Inom vilket sektor arbetar du huvudsakligen?',
    ),
    isRequired: true,
    allowCustomAnswer: false,
    options: [
      {
        text: loc(
          'Tienpitourakoitsija',
          'Road maintenance contractor',
          'Vägunderhållsentreprenör',
        ),
      },
      {
        text: loc(
          'Tiesuunnittelija / konsultti',
          'Road designer / consultant',
          'Vägplanerare / konsult',
        ),
      },
      {
        text: loc(
          'Viranomainen (ELY, kunta tms.)',
          'Public authority (ELY, municipality, etc.)',
          'Myndighet (NTM, kommun o.d.)',
        ),
      },
      {
        text: loc(
          'Tutkimus tai kehitys',
          'Research or development',
          'Forskning eller utveckling',
        ),
      },
      { text: loc('Jokin muu', 'Other', 'Annat') },
    ],
  } satisfies SurveyRadioQuestion,
];

// Page 2 – Tievelhon käyttö ─────────────────────────────────────────────────
const page2Sections: SurveyPageSection[] = [
  {
    type: 'checkbox',
    title: loc(
      'Mitä Tievelhon aineistoja käytätte työssänne? (Valitse kaikki sopivat)',
      'Which Tievelho datasets do you use in your work? (Select all that apply)',
      'Vilka Tievelho-dataset använder du i ditt arbete? (Välj alla som gäller)',
    ),
    isRequired: true,
    allowCustomAnswer: true,
    answerLimits: { min: 1, max: null },
    options: [
      {
        text: loc('Tieverkkoaineisto', 'Road network data', 'Vägnätsdata'),
        info: loc(
          'Tieosat, tienumerot ja hallinnollinen luokitus',
          'Road sections, road numbers and administrative classification',
          'Vägavsnitt, vägnummer och administrativ klassificering',
        ),
      },
      {
        text: loc(
          'Päällysteen kuntotiedot',
          'Pavement condition data',
          'Beläggningsskicksdata',
        ),
      },
      {
        text: loc(
          'Hoitohistoria ja -rekisteri',
          'Maintenance history and register',
          'Underhållshistorik och -register',
        ),
      },
      {
        text: loc(
          'Liikennemäärätiedot (KVL)',
          'Traffic volume data (AADT)',
          'Trafikvolymdata (ÅMT)',
        ),
      },
      {
        text: loc(
          'Silta- ja taitorakennerekisteri',
          'Bridge and structure register',
          'Bro- och konstruktionsregister',
        ),
      },
      {
        text: loc(
          'Geometria ja korkeusmallit',
          'Road geometry and elevation models',
          'Väggeometri och höjdmodeller',
        ),
      },
      {
        text: loc(
          'Nopeusrajoitustiedot',
          'Speed limit data',
          'Hastighetsbegränsningsdata',
        ),
      },
    ],
  } satisfies SurveyCheckboxQuestion,

  {
    type: 'radio',
    title: loc(
      'Kuinka usein käytätte Tievelhoa?',
      'How often do you use Tievelho?',
      'Hur ofta använder du Tievelho?',
    ),
    isRequired: true,
    allowCustomAnswer: false,
    options: [
      { text: loc('Päivittäin', 'Daily', 'Dagligen') },
      {
        text: loc(
          'Useita kertoja viikossa',
          'Several times a week',
          'Flera gånger i veckan',
        ),
      },
      { text: loc('Viikoittain', 'Weekly', 'Veckovis') },
      { text: loc('Kuukausittain', 'Monthly', 'Månadsvis') },
      { text: loc('Harvemmin', 'Less often', 'Mer sällan') },
    ],
  } satisfies SurveyRadioQuestion,

  {
    type: 'sorting',
    title: loc(
      'Järjestäkää seuraavat käyttötarkoitukset tärkeysjärjestykseen (tärkein ensin)',
      'Sort the following use cases by importance (most important first)',
      'Rangordna följande användningsfall efter prioritet (viktigast först)',
    ),
    isRequired: false,
    options: [
      {
        text: loc(
          'Urakan suunnittelu ja tarjouslaskenta',
          'Contract planning and tendering',
          'Entreprenadplanering och anbudsberäkning',
        ),
      },
      {
        text: loc(
          'Tienpidon laadunvalvonta',
          'Road maintenance quality control',
          'Kvalitetskontroll av vägunderhåll',
        ),
      },
      {
        text: loc(
          'Raportointi ja viranomaisvaatimukset',
          'Reporting and regulatory requirements',
          'Rapportering och myndighetskrav',
        ),
      },
      {
        text: loc(
          'Investointi- ja korjaussuunnittelu',
          'Investment and repair planning',
          'Investerings- och reparationsplanering',
        ),
      },
      {
        text: loc(
          'Tutkimus ja analytiikka',
          'Research and analytics',
          'Forskning och analys',
        ),
      },
    ],
  } satisfies SurveySortingQuestion,

  {
    type: 'grouped-checkbox',
    title: loc(
      'Mitä Tievelhon käyttötapoja hyödynnätte?',
      'Which Tievelho access methods do you use?',
      'Vilka åtkomstmetoder i Tievelho använder du?',
    ),
    isRequired: false,
    answerLimits: { min: null, max: null },
    groups: [
      {
        id: null as unknown as number,
        name: loc('Käyttöliittymä', 'User interface', 'Användargränssnitt'),
        options: [
          {
            text: loc(
              'Selainpohjainen karttanäkymä',
              'Browser-based map view',
              'Webbläsarbaserad kartvy',
            ),
          },
          {
            text: loc(
              'Hakutoiminnot ja suodattimet',
              'Search and filter functions',
              'Sök- och filterfunktioner',
            ),
          },
          {
            text: loc(
              'Raporttien luonti käyttöliittymässä',
              'Report generation in UI',
              'Rapportgenerering i gränssnittet',
            ),
          },
        ],
      },
      {
        id: null as unknown as number,
        name: loc(
          'Rajapinnat ja lataukset',
          'APIs and downloads',
          'API:er och nedladdningar',
        ),
        options: [
          { text: loc('REST-rajapinta (API)', 'REST API', 'REST-API') },
          {
            text: loc(
              'WFS/WMS-karttapalvelut',
              'WFS/WMS map services',
              'WFS/WMS-karttjänster',
            ),
          },
          {
            text: loc(
              'Massalataukset (Extranet)',
              'Bulk downloads (Extranet)',
              'Massanedladdningar (Extranet)',
            ),
          },
          {
            text: loc(
              'GeoPackage / Shapefile -vienti',
              'GeoPackage / Shapefile export',
              'GeoPackage / Shapefile-export',
            ),
          },
        ],
      },
    ],
  } satisfies SurveyGroupedCheckboxQuestion,
];

// Page 3 – Tyytyväisyys palveluun ───────────────────────────────────────────
const page3Sections: SurveyPageSection[] = [
  {
    type: 'slider',
    title: loc(
      'Kuinka tyytyväinen olette Tievelhoon kokonaisuutena? (0 = erittäin tyytymätön, 10 = erittäin tyytyväinen)',
      'How satisfied are you with Tievelho overall? (0 = very dissatisfied, 10 = very satisfied)',
      'Hur nöjd är du med Tievelho totalt sett? (0 = mycket missnöjd, 10 = mycket nöjd)',
    ),
    isRequired: true,
    presentationType: 'numeric',
    minValue: 0,
    maxValue: 10,
    minLabel: loc(
      'Erittäin tyytymätön',
      'Very dissatisfied',
      'Mycket missnöjd',
    ),
    maxLabel: loc('Erittäin tyytyväinen', 'Very satisfied', 'Mycket nöjd'),
  } satisfies SurveySliderQuestion,

  {
    type: 'numeric',
    title: loc(
      'Kuinka monella projektilla tai urakka-alueella käytitte Tievelhoa viimeisen 12 kuukauden aikana?',
      'On how many projects or contract areas did you use Tievelho in the past 12 months?',
      'På hur många projekt eller kontraktsområden använde du Tievelho under de senaste 12 månaderna?',
    ),
    isRequired: false,
    minValue: 0,
    maxValue: 500,
  } satisfies SurveyNumericQuestion,

  {
    type: 'matrix',
    title: loc(
      'Arvioikaa Tievelhon eri osa-alueet',
      'Rate the following aspects of Tievelho',
      'Betygsätt följande aspekter av Tievelho',
    ),
    isRequired: false,
    allowEmptyAnswer: true,
    classes: [
      loc('Erinomainen', 'Excellent', 'Utmärkt'),
      loc('Hyvä', 'Good', 'Bra'),
      loc('Tyydyttävä', 'Satisfactory', 'Tillfredsställande'),
      loc('Heikko', 'Poor', 'Dålig'),
    ],
    subjects: [
      loc('Tietojen ajantasaisuus', 'Data timeliness', 'Datans aktualitet'),
      loc('Tietojen kattavuus', 'Data coverage', 'Datans täckning'),
      loc('Tietojen tarkkuus', 'Data accuracy', 'Datans noggrannhet'),
      loc(
        'Käyttöliittymän helppokäyttöisyys',
        'UI ease of use',
        'Gränssnittets användarvänlighet',
      ),
      loc(
        'Rajapintojen toimivuus',
        'API reliability',
        'API:ernas funktionalitet',
      ),
      loc(
        'Dokumentaatio ja ohjeet',
        'Documentation and guides',
        'Dokumentation och guider',
      ),
      loc('Asiakastuki', 'Customer support', 'Kundsupport'),
    ],
  } satisfies SurveyMatrixQuestion,
];

// Page 4 – Kehittäminen ─────────────────────────────────────────────────────
const page4Sections: SurveyPageSection[] = [
  {
    type: 'multi-matrix',
    title: loc(
      'Kuinka hyvin seuraavien aineistotyyppien tiedot vastaavat tarpeitanne?',
      'How well do the following data types meet your needs?',
      'Hur väl uppfyller följande datatyper dina behov?',
    ),
    isRequired: false,
    allowEmptyAnswer: true,
    answerLimits: { min: null, max: null },
    classes: [
      loc('Täysin riittävä', 'Fully sufficient', 'Fullt tillräcklig'),
      loc('Pääosin riittävä', 'Mostly sufficient', 'Mestadels tillräcklig'),
      loc(
        'Osittain puutteellinen',
        'Partially insufficient',
        'Delvis otillräcklig',
      ),
      loc(
        'Selvästi puutteellinen',
        'Clearly insufficient',
        'Tydligt otillräcklig',
      ),
    ],
    subjects: [
      loc(
        'Päällysteen kuntotiedot',
        'Pavement condition data',
        'Beläggningsskicksdata',
      ),
      loc('Hoitohistoria', 'Maintenance history', 'Underhållshistorik'),
      loc('Liikennemäärät', 'Traffic volumes', 'Trafikvolymer'),
      loc('Siltatiedot', 'Bridge data', 'Brodata'),
      loc(
        'Geometria ja sijaintitieto',
        'Geometry and location data',
        'Geometri och positionsdata',
      ),
    ],
  } satisfies SurveyMultiMatrixQuestion,

  {
    type: 'radio-image',
    title: loc(
      'Minkä tyyppistä kehittämistä toivotte eniten Tievelhoon lähivuosina?',
      'What type of development do you most wish to see in Tievelho in the coming years?',
      'Vilken typ av utveckling önskar du mest för Tievelho de kommande åren?',
    ),
    isRequired: false,
    allowCustomAnswer: false,
    options: [
      {
        text: loc(
          'Reaaliaikaisempi tieto',
          'More real-time data',
          'Mer realtidsdata',
        ),
        imageUrl: null,
        altText: loc('Reaaliaikainen tieto', 'Real-time data', 'Realtidsdata'),
        attributions: '',
      },
      {
        text: loc('Parempi rajapinta (API)', 'Better API', 'Bättre API'),
        imageUrl: null,
        altText: loc('Rajapinta', 'API', 'API'),
        attributions: '',
      },
      {
        text: loc(
          'Selkeämpi käyttöliittymä',
          'Clearer user interface',
          'Tydligare användargränssnitt',
        ),
        imageUrl: null,
        altText: loc('Käyttöliittymä', 'User interface', 'Användargränssnitt'),
        attributions: '',
      },
      {
        text: loc(
          'Laajempi aineistokattavuus',
          'Broader data coverage',
          'Bredare datatäckning',
        ),
        imageUrl: null,
        altText: loc('Aineistokattavuus', 'Data coverage', 'Datatäckning'),
        attributions: '',
      },
    ],
  } satisfies SurveyRadioImageQuestion,

  {
    type: 'budgeting',
    title: loc(
      'Kuvitelkaa, että teillä on 100 000 € käytettävissä Tievelhon kehittämiseen. Miten jakaisitte budjetin?',
      'Imagine you have €100,000 to invest in developing Tievelho. How would you allocate the budget?',
      'Föreställ dig att du har 100 000 € att investera i att utveckla Tievelho. Hur skulle du fördela budgeten?',
    ),
    isRequired: false,
    budgetingMode: 'direct',
    totalBudget: 100000,
    unit: '€',
    allocationDirection: 'decreasing' as BudgetAllocationDirection,
    requireFullAllocation: true,
    inputMode: 'absolute',
    targets: [
      {
        name: loc(
          'Tietojen laadun ja ajantasaisuuden parantaminen',
          'Improving data quality and timeliness',
          'Förbättring av datakvalitet och aktualitet',
        ),
        price: 1000,
      },
      {
        name: loc(
          'Rajapintojen kehittäminen (API, WFS)',
          'API and WFS interface development',
          'Utveckling av API och WFS',
        ),
        price: 1000,
      },
      {
        name: loc(
          'Käyttöliittymän uudistaminen',
          'User interface renewal',
          'Förnyelse av användargränssnittet',
        ),
        price: 1000,
      },
      {
        name: loc(
          'Dokumentaation ja koulutuksen parantaminen',
          'Improving documentation and training',
          'Förbättring av dokumentation och utbildning',
        ),
        price: 1000,
      },
      {
        name: loc(
          'Uusien aineistotyyppien lisääminen',
          'Adding new data types',
          'Lägga till nya datatyper',
        ),
        price: 1000,
      },
    ],
  } satisfies SurveyBudgetingQuestion,
];

// Page 5 – Kartta ja avoin palaute ──────────────────────────────────────────
const mapSubQuestion: SurveyFreeTextQuestion = {
  type: 'free-text',
  title: loc(
    'Kuvailkaa lyhyesti, miksi merkitsitte juuri tämän kohdan (esim. puuttuva tieto, virheellinen kunto)',
    'Briefly describe why you marked this location (e.g. missing data, incorrect condition info)',
    'Beskriv kort varför du markerade denna plats (t.ex. saknad data, felaktig skicksinformation)',
  ),
  isRequired: false,
};

const page5Sections: SurveyPageSection[] = [
  {
    type: 'map',
    title: loc(
      'Merkitkää kartalle tiejaksoja tai -kohteita, joissa Tievelhon aineisto on erityisen puutteellista tai virheellistä',
      'Mark on the map any road sections or locations where Tievelho data is particularly incomplete or inaccurate',
      'Markera på kartan vägavsnitt eller platser där Tievelho-data är särskilt ofullständig eller felaktig',
    ),
    isRequired: false,
    selectionTypes: ['point', 'line'],
    featureStyles: {
      point: { markerIcon: null },
      line: { strokeStyle: 'solid', strokeColor: '#cc0000' },
      area: { strokeStyle: 'solid', strokeColor: '#cc0000' },
    },
    subQuestions: [mapSubQuestion],
  } satisfies SurveyMapQuestion,

  {
    type: 'geo-budgeting',
    title: loc(
      'Priorisoikaa ELY-alueet sen mukaan, kuinka tärkeää Tievelhon kattavuuden parantaminen on niillä (5 pistettä käytössä)',
      'Prioritise ELY regions by how important it is to improve Tievelho coverage there (5 points to allocate)',
      'Prioritera NTM-regioner efter hur viktigt det är att förbättra Tievelho-täckningen där (5 poäng att fördela)',
    ),
    isRequired: false,
    totalBudget: 5,
    unit: 'pistettä',
    allocationDirection: 'decreasing' as BudgetAllocationDirection,
    targets: [
      { name: loc('Uusimaa', 'Uusimaa', 'Nyland') },
      { name: loc('Pirkanmaa', 'Pirkanmaa', 'Birkaland') },
      {
        name: loc(
          'Pohjois-Pohjanmaa',
          'Northern Ostrobothnia',
          'Norra Österbotten',
        ),
      },
      { name: loc('Pohjois-Savo', 'Northern Savo', 'Norra Savolax') },
      { name: loc('Lappi', 'Lapland', 'Lappland') },
      {
        name: loc('Varsinais-Suomi', 'Southwest Finland', 'Egentliga Finland'),
      },
    ],
  } satisfies SurveyGeoBudgetingQuestion,

  {
    type: 'free-text',
    title: loc(
      'Vapaa palaute ja kehitysehdotukset',
      'Open feedback and development suggestions',
      'Öppen feedback och utvecklingsförslag',
    ),
    isRequired: false,
    maxLength: 2000,
  } satisfies SurveyFreeTextQuestion,

  {
    type: 'attachment',
    title: loc(
      'Halutessanne voitte liittää kuvakaappauksen tai muun liitteen (esim. virheilmoitus tai esimerkki puuttuvasta tiedosta)',
      'You may optionally attach a screenshot or other file (e.g. an error message or example of missing data)',
      'Du kan valfritt bifoga en skärmdump eller annan fil (t.ex. felmeddelande eller exempel på saknad data)',
    ),
    isRequired: false,
    fileUrl: null,
  } satisfies SurveyAttachmentQuestion,
];

const pages = [
  {
    title: loc('Taustatiedot', 'Background', 'Bakgrundsinformation'),
    sidebarType: 'none' as const,
    sections: page1Sections,
  },
  {
    title: loc('Tievelhon käyttö', 'Tievelho usage', 'Användning av Tievelho'),
    sidebarType: 'none' as const,
    sections: page2Sections,
  },
  {
    title: loc(
      'Tyytyväisyys palveluun',
      'Service satisfaction',
      'Nöjdhet med tjänsten',
    ),
    sidebarType: 'none' as const,
    sections: page3Sections,
  },
  {
    title: loc(
      'Kehittämistoiveet',
      'Development wishes',
      'Önskemål om utveckling',
    ),
    sidebarType: 'none' as const,
    sections: page4Sections,
  },
  {
    title: loc('Kartta ja palaute', 'Map & feedback', 'Karta och feedback'),
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
          loc(
            'Tievelho-käyttäjäkysely 2025',
            'Tievelho User Survey 2025',
            'Tievelho användarundersökning 2025',
          ),
        ),
        JSON.stringify(
          loc(
            'Väylävirasto kehittää tietopalvelujaan käyttäjiensä tarpeiden pohjalta',
            'The Finnish Transport Infrastructure Agency develops its data services based on user needs',
            'Trafikledsverket utvecklar sina datatjänster utifrån användarnas behov',
          ),
        ),
        JSON.stringify(
          loc(
            'Tievelho on Väyläviraston ylläpitämä tietietopalvelu. Tämän kyselyn avulla kehitämme palvelua vastaamaan paremmin tarpeisiinne.',
            "Tievelho is the Finnish Transport Infrastructure Agency's road data service. This survey helps us improve it to better meet your needs.",
            'Tievelho är Trafikledsverkets vägdatatjänst. Denna enkät hjälper oss att förbättra den.',
          ),
        ),
        'Väylävirasto',
        'Tietopalvelut',
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
    console.log('✓ Tievelho demo survey created successfully');
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
