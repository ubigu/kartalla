import { LanguageCode, LocalizedText } from '@interfaces/survey';
import useTranslations from '@src/translations/useTranslations';
import ExcelJS from 'exceljs';
import {
  SectionHeader,
  SubmissionPersonalInfo,
  createExportSubmissions,
  getAnswerDBEntries,
  getHeaderKey,
  getPersonalInfosForSurvey,
  getSectionDetailsForHeader,
  getSectionHeaders,
  joinKeys,
} from './exportUtils';

const DATE_FORMAT = 'dd.mm.yyyy hh:mm';

const HEADER_ROW_CONFIG = {
  groupHeader: { height: 28 },
  optionHeader: { height: 22 },
} as const;

const HEADER_ROW_COUNT = Object.keys(HEADER_ROW_CONFIG).length;

const ROW_HEIGHT = {
  dataMin: 20,
  dataMax: 80,
  lineHeight: 15,
} as const;

const COLUMN_WIDTH = {
  min: 10,
  max: 50,
} as const;

const GREY_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFEEEEEE' },
};
const THIN_BORDER = { style: 'thin' } as ExcelJS.Border;
const ALL_SIDES_BORDER = {
  top: THIN_BORDER,
  left: THIN_BORDER,
  bottom: THIN_BORDER,
  right: THIN_BORDER,
};
const HEADER_ALIGNMENT = { vertical: 'middle', indent: 1 } as ExcelJS.Alignment;
const DATA_ALIGNMENT = {
  vertical: 'middle',
  horizontal: 'center',
  wrapText: true,
} as ExcelJS.Alignment;

const TEXT_ALIGNMENT = {
  vertical: 'middle',
  horizontal: 'left',
  wrapText: true,
} as ExcelJS.Alignment;

const CHECKMARK = '✓';

interface ExcelColumn {
  key: string;
  groupLabel: string;
  groupKey: string;
  optionLabel: string;
  isFollowUp: boolean;
  isBinary: boolean;
  isText: boolean;
}

interface MetaColumn {
  header: string;
  getValue: (
    submissionId: string,
    sub: any,
    pi: SubmissionPersonalInfo | undefined,
  ) => any;
  isDate?: boolean;
}

function buildExcelColumns(
  sectionMetadata: SectionHeader[],
  lang: LanguageCode,
): ExcelColumn[] {
  const predecessorIndexes = sectionMetadata.reduce((acc, section) => {
    if (!section.predecessorSection) {
      return {
        ...acc,
        [section.sectionId]: joinKeys(section.pageIndex, section.sectionIndex),
      };
    }
    return acc;
  }, {});

  const sectionsByGroup = sectionMetadata.reduce(
    (groups, section) => {
      const { pageIndex, sectionIndex, predecessorSection } = section;
      const groupKey = predecessorSection
        ? joinKeys(
            predecessorIndexes[predecessorSection],
            `followUp${sectionIndex}`,
          )
        : joinKeys(pageIndex, sectionIndex);
      groups[groupKey] = groups[groupKey] ?? [];
      groups[groupKey].push(section);
      return groups;
    },
    {} as Record<string, SectionHeader[]>,
  );

  const columns: ExcelColumn[] = [];

  for (const sectionGroup of Object.values(sectionsByGroup)) {
    const sectionHead = sectionGroup[0];
    const isFollowUp = sectionHead.predecessorSection != null;
    const shortCode = getSectionDetailsForHeader(
      sectionHead,
      predecessorIndexes,
    );
    const tr = useTranslations(lang);
    const typeLabel =
      tr.questionTypes[sectionHead.type as keyof typeof tr.questionTypes];
    const infixParts = [
      ...(isFollowUp ? [tr.followUpLabel] : []),
      ...(typeLabel ? [typeLabel] : []),
    ];
    const typeInfix =
      infixParts.length > 0 ? ` (${infixParts.join(' / ')})` : '';
    const baseGroupLabel = `${shortCode}${typeInfix}: ${sectionHead.title?.[lang] ?? sectionHead.title?.['fi'] ?? ''}`;
    const baseGroupKey = joinKeys(
      sectionHead.pageIndex,
      sectionHead.sectionIndex,
    );

    switch (sectionHead.type) {
      case 'radio':
      case 'radio-image':
      case 'checkbox':
      case 'grouped-checkbox':
        for (const section of sectionGroup) {
          const groupSuffix = section.groupName
            ? ` - ${section.groupName[lang] ?? section.groupName['fi']}`
            : '';
          const sectionShortCode = getSectionDetailsForHeader(
            section,
            predecessorIndexes,
          );
          columns.push({
            key: getHeaderKey(
              section.pageIndex,
              section.sectionIndex,
              section.groupIndex,
              section.optionId,
              section.predecessorSection,
              predecessorIndexes,
            ),
            groupLabel: `${sectionShortCode}${typeInfix}: ${section.title?.[lang] ?? section.title?.['fi'] ?? ''}${groupSuffix}`,
            groupKey: section.groupIndex
              ? joinKeys(
                  section.pageIndex,
                  section.sectionIndex,
                  section.groupIndex,
                )
              : joinKeys(section.pageIndex, section.sectionIndex),
            optionLabel: section.text?.[lang] ?? section.text?.['fi'] ?? '',
            isFollowUp,
            isBinary: true,
            isText: false,
          });
        }
        if (
          'allowCustomAnswer' in sectionHead.details &&
          sectionHead.details.allowCustomAnswer
        ) {
          columns.push({
            key: getHeaderKey(
              sectionHead.pageIndex,
              sectionHead.sectionIndex,
              null,
              -1,
              sectionHead.predecessorSection,
              predecessorIndexes,
            ),
            groupLabel: baseGroupLabel,
            groupKey: baseGroupKey,
            optionLabel: tr.customAnswerLabel,
            isFollowUp,
            isBinary: false,
            isText: false,
          });
        }
        break;

      case 'matrix':
        if ('subjects' in sectionHead.details) {
          const { subjects } = sectionHead.details as {
            subjects: LocalizedText[];
          };
          subjects.forEach((subject, subjectIdx) => {
            columns.push({
              key: getHeaderKey(
                sectionHead.pageIndex,
                sectionHead.sectionIndex,
                subjectIdx + 1,
                null,
                sectionHead.predecessorSection,
                predecessorIndexes,
              ),
              groupLabel: baseGroupLabel,
              groupKey: baseGroupKey,
              optionLabel: subject[lang] ?? subject['fi'] ?? '',
              isFollowUp,
              isBinary: false,
              isText: false,
            });
          });
        }
        break;

      case 'multi-matrix':
        if (
          'subjects' in sectionHead.details &&
          'classes' in sectionHead.details
        ) {
          const { subjects, classes } = sectionHead.details as {
            subjects: LocalizedText[];
            classes: LocalizedText[];
          };
          subjects.forEach((subject, subjectIdx) => {
            const subjectGroupKey = joinKeys(baseGroupKey, subjectIdx + 1);
            const subjectGroupLabel = `${baseGroupLabel} - ${subject[lang] ?? subject['fi'] ?? ''}`;
            classes.forEach((cls, classIdx) => {
              columns.push({
                key: getHeaderKey(
                  sectionHead.pageIndex,
                  sectionHead.sectionIndex,
                  subjectIdx + 1,
                  classIdx + 1,
                  sectionHead.predecessorSection,
                  predecessorIndexes,
                ),
                groupLabel: subjectGroupLabel,
                groupKey: subjectGroupKey,
                optionLabel: cls[lang] ?? cls['fi'] ?? '',
                isFollowUp,
                isBinary: true,
                isText: false,
              });
            });
          });
        }
        break;

      case 'sorting':
        sectionGroup.forEach((section) => {
          columns.push({
            key: getHeaderKey(
              section.pageIndex,
              section.sectionIndex,
              null,
              section.optionIndex + 1,
              section.predecessorSection,
              predecessorIndexes,
            ),
            groupLabel: baseGroupLabel,
            groupKey: baseGroupKey,
            optionLabel: `${section.optionIndex + 1}.`,
            isFollowUp,
            isBinary: false,
            isText: false,
          });
        });
        break;

      case 'budgeting':
        if ('targets' in sectionHead.details) {
          const { targets } = sectionHead.details as {
            targets: { name: LocalizedText }[];
          };
          targets?.forEach((target, targetIdx) => {
            columns.push({
              key: getHeaderKey(
                sectionHead.pageIndex,
                sectionHead.sectionIndex,
                targetIdx + 1,
                null,
                sectionHead.predecessorSection,
                predecessorIndexes,
              ),
              groupLabel: baseGroupLabel,
              groupKey: baseGroupKey,
              optionLabel: target.name?.[lang] ?? target.name?.['fi'] ?? '',
              isFollowUp,
              isBinary: false,
              isText: false,
            });
          });
        }
        break;

      default:
        columns.push({
          key: getHeaderKey(
            sectionHead.pageIndex,
            sectionHead.sectionIndex,
            null,
            null,
            sectionHead.predecessorSection,
            predecessorIndexes,
          ),
          groupLabel: baseGroupLabel,
          groupKey: baseGroupKey,
          optionLabel: '',
          isFollowUp,
          isBinary: false,
          isText: sectionHead.type === 'free-text',
        });
    }
  }

  return columns;
}

function getActivePersonalInfoColumns(
  firstPersonalInfo: SubmissionPersonalInfo,
  lang: LanguageCode,
): {
  key: string;
  header: string;
  getValue: (pi: SubmissionPersonalInfo) => string | null;
}[] {
  const tr = useTranslations(lang);
  const all = [
    {
      key: 'askName',
      header: tr.PersonalInfo.exportName,
      getValue: (pi: SubmissionPersonalInfo) => pi.name,
    },
    {
      key: 'askEmail',
      header: tr.PersonalInfo.exportEmail,
      getValue: (pi: SubmissionPersonalInfo) => pi.email,
    },
    {
      key: 'askPhone',
      header: tr.PersonalInfo.exportPhone,
      getValue: (pi: SubmissionPersonalInfo) => pi.phone,
    },
    {
      key: 'askAddress',
      header: tr.PersonalInfo.exportAddress,
      getValue: (pi: SubmissionPersonalInfo) => pi.address,
    },
    {
      key: 'askCustom',
      header:
        firstPersonalInfo.details?.customLabel?.[lang] ??
        firstPersonalInfo.details?.customLabel?.['fi'] ??
        '',
      getValue: (pi: SubmissionPersonalInfo) => pi.custom,
    },
  ];
  return all.filter((col) => firstPersonalInfo.details?.[col.key]);
}

function initializeHeaderRows(
  ws: ExcelJS.Worksheet,
  metaCols: MetaColumn[],
  columns: ExcelColumn[],
) {
  const [groupHeaderRow, optionHeaderRow] = Object.values(
    HEADER_ROW_CONFIG,
  ).map((config, idx) => {
    const row = ws.getRow(idx + 1);
    row.height = config.height;
    return row;
  });

  metaCols.forEach((col, colIndex) => {
    const cell = groupHeaderRow.getCell(colIndex + 1);
    cell.value = col.header;
    cell.font = { bold: true };
    cell.alignment = HEADER_ALIGNMENT;
    cell.border = ALL_SIDES_BORDER;
  });

  columns.forEach((excelCol, index) => {
    const colIndex = metaCols.length + index + 1;

    const groupCell = groupHeaderRow.getCell(colIndex);
    groupCell.value = excelCol.groupLabel;
    groupCell.font = { bold: true };
    groupCell.alignment = HEADER_ALIGNMENT;
    groupCell.border = ALL_SIDES_BORDER;

    const optionCell = optionHeaderRow.getCell(colIndex);
    optionCell.value = excelCol.optionLabel || null;
    optionCell.alignment = DATA_ALIGNMENT;
    optionCell.border = ALL_SIDES_BORDER;
    if (!excelCol.optionLabel) {
      optionCell.fill = GREY_FILL;
    }
  });

  groupHeaderRow.commit();
  optionHeaderRow.commit();
}

function applyMerges(
  ws: ExcelJS.Worksheet,
  metaColCount: number,
  columns: ExcelColumn[],
) {
  for (let colIndex = 1; colIndex <= metaColCount; colIndex++) {
    ws.mergeCells(1, colIndex, HEADER_ROW_COUNT, colIndex);
  }

  let groupStart = metaColCount + 1;
  let columnIndex = 0;

  while (columnIndex < columns.length) {
    const currentGroupKey = columns[columnIndex].groupKey;
    let groupEnd = groupStart;
    let nextIndex = columnIndex + 1;

    while (
      nextIndex < columns.length &&
      columns[nextIndex].groupKey === currentGroupKey
    ) {
      groupEnd++;
      nextIndex++;
    }

    if (groupEnd > groupStart) {
      ws.mergeCells(1, groupStart, 1, groupEnd);
    }

    groupStart = groupEnd + 1;
    columnIndex = nextIndex;
  }
}

function applyFreezePane(ws: ExcelJS.Worksheet, metaColCount: number) {
  ws.views = [
    { state: 'frozen', xSplit: metaColCount, ySplit: HEADER_ROW_COUNT },
  ];
}

function groupSizes(columns: ExcelColumn[]): number[] {
  const sizes: number[] = new Array(columns.length).fill(0);
  let groupStart = 0;
  while (groupStart < columns.length) {
    const currentGroupKey = columns[groupStart].groupKey;
    const nextGroupStart = columns.findIndex(
      (c, idx) => idx > groupStart && c.groupKey !== currentGroupKey,
    );
    const groupEnd = nextGroupStart === -1 ? columns.length : nextGroupStart;
    const groupSize = groupEnd - groupStart;
    for (let memberIdx = groupStart; memberIdx < groupEnd; memberIdx++)
      sizes[memberIdx] = groupSize;
    groupStart = groupEnd;
  }
  return sizes;
}

function headerContentWidth(col: ExcelColumn, groupSize: number): number {
  const groupLabelPerColumn = Math.ceil(col.groupLabel.length / groupSize);
  const optionWidth = col.optionLabel.length;
  return Math.max(groupLabelPerColumn, optionWidth);
}

function applyColumnWidths(
  ws: ExcelJS.Worksheet,
  metaCols: MetaColumn[],
  columns: ExcelColumn[],
  submissions: any[],
  personalInfoRows: SubmissionPersonalInfo[] | null,
) {
  const sizes = groupSizes(columns);
  // Header widths are uncapped — the header label is the minimum content width.
  // Data rows can only increase width up to COLUMN_WIDTH.max, never below the header minimum.
  const widths = [
    ...metaCols.map((c) => c.header.length),
    ...columns.map((c, i) => headerContentWidth(c, sizes[i])),
  ];

  for (const sub of submissions) {
    const submissionId = Object.keys(sub)[0];
    const answers = sub[submissionId];
    const personalInfo = personalInfoRows?.find(
      (pi) => String(pi.submissionId) === String(submissionId),
    );

    metaCols.forEach((col, index) => {
      const value = String(col.getValue(submissionId, sub, personalInfo) ?? '');
      widths[index] = Math.max(
        widths[index],
        Math.min(COLUMN_WIDTH.max, value.length),
      );
    });

    columns.forEach((col, index) => {
      const value = answers?.[col.key];
      if (value != null) {
        widths[metaCols.length + index] = Math.max(
          widths[metaCols.length + index],
          Math.min(COLUMN_WIDTH.max, String(value).length),
        );
      }
    });
  }

  ws.columns = widths.map((width) => ({ width }));
  return widths;
}

function writeDataRows(
  ws: ExcelJS.Worksheet,
  metaCols: MetaColumn[],
  columns: ExcelColumn[],
  submissions: any[],
  personalInfoRows: SubmissionPersonalInfo[] | null,
  colWidths: number[],
) {
  submissions.forEach((sub, rowIndex) => {
    const submissionId = Object.keys(sub)[0];
    const answers = sub[submissionId];
    const personalInfo = personalInfoRows?.find(
      (pi) => String(pi.submissionId) === String(submissionId),
    );
    const row = ws.getRow(rowIndex + HEADER_ROW_COUNT + 1);

    let maxLines = 1;

    metaCols.forEach((col, colIndex) => {
      const value = col.getValue(submissionId, sub, personalInfo);
      const cell = row.getCell(colIndex + 1);
      cell.alignment = DATA_ALIGNMENT;
      cell.border = ALL_SIDES_BORDER;
      if (col.isDate && value instanceof Date) {
        cell.value = value;
        cell.numFmt = DATE_FORMAT;
      } else {
        cell.value = value ?? null;
        const lines = Math.ceil(
          String(value ?? '').length / colWidths[colIndex],
        );
        maxLines = Math.max(maxLines, lines);
      }
    });

    columns.forEach((col, colIndex) => {
      const value = answers?.[col.key];
      const cell = row.getCell(metaCols.length + colIndex + 1);
      cell.alignment = col.isText ? TEXT_ALIGNMENT : DATA_ALIGNMENT;
      cell.border = ALL_SIDES_BORDER;
      if (value == null) return;
      const displayValue =
        col.isBinary && value === 1
          ? CHECKMARK
          : typeof value === 'number'
            ? value
            : String(value);
      cell.value = displayValue;
      const lines = Math.ceil(
        String(displayValue).length / colWidths[metaCols.length + colIndex],
      );
      maxLines = Math.max(maxLines, lines);
    });

    row.height = Math.min(
      ROW_HEIGHT.dataMax,
      Math.max(ROW_HEIGHT.dataMin, maxLines * ROW_HEIGHT.lineHeight),
    );
    row.commit();
  });
}

function buildMainWorksheet(
  ws: ExcelJS.Worksheet,
  columns: ExcelColumn[],
  submissions: any[],
  personalInfoRows: SubmissionPersonalInfo[] | null,
  lang: LanguageCode,
) {
  const piCols = personalInfoRows?.[0]
    ? getActivePersonalInfoColumns(personalInfoRows[0], lang)
    : [];

  const tr = useTranslations(lang);
  const metaCols: MetaColumn[] = [
    {
      header: tr.submissionId,
      getValue: (submissionId) => submissionId,
    },
    {
      header: tr.responseTime,
      getValue: (_id, sub) => sub.timeStamp,
      isDate: true,
    },
    {
      header: tr.responseLanguage,
      getValue: (_id, sub) => sub.submissionLanguage,
    },
    ...piCols.map((piCol) => ({
      header: piCol.header,
      getValue: (
        _id: string,
        _sub: any,
        pi: SubmissionPersonalInfo | undefined,
      ) => (pi ? piCol.getValue(pi) : null),
    })),
  ];

  const colWidths = applyColumnWidths(
    ws,
    metaCols,
    columns,
    submissions,
    personalInfoRows,
  );
  initializeHeaderRows(ws, metaCols, columns);
  applyMerges(ws, metaCols.length, columns);
  applyFreezePane(ws, metaCols.length);
  writeDataRows(
    ws,
    metaCols,
    columns,
    submissions,
    personalInfoRows,
    colWidths,
  );

  const lastWrittenRow = HEADER_ROW_COUNT + submissions.length;
  const excessRows = (ws.lastRow?.number ?? lastWrittenRow) - lastWrittenRow;
  if (excessRows > 0) {
    ws.spliceRows(lastWrittenRow + 1, excessRows);
  }
}

export async function getExcelFile(
  surveyId: number,
  withPersonalInfo?: boolean,
  lang: LanguageCode = 'fi',
) {
  const rows = await getAnswerDBEntries(surveyId);
  const personalInfoRows = withPersonalInfo
    ? await getPersonalInfosForSurvey(surveyId)
    : null;
  if (!rows && !personalInfoRows) return null;

  const sectionMetadata = await getSectionHeaders(surveyId);
  const columns = buildExcelColumns(sectionMetadata, lang);
  const submissions = rows
    ? createExportSubmissions(rows, sectionMetadata, lang)
    : [];

  const tr = useTranslations(lang);
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(tr.sheetName);
  buildMainWorksheet(ws, columns, submissions, personalInfoRows, lang);

  return workbook.xlsx.writeBuffer();
}
