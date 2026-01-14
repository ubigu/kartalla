import { AnswerEntry, Submission, SurveyQuestion } from '@interfaces/survey';
import { Box, useTheme } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { FunctionComponent, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Props {
  submissions: Submission[];
  selectedQuestion: SurveyQuestion;
}

type Data = {
  id: number;
  options: {
    id: number;
    text: string;
    count: number;
  }[];
  tooltipFormatter: (value: any) => [string | number, string];
};

type Range = {
  min: number;
  max: number;
};

function LabelTooltip({
  tooltip,
}: {
  tooltip: { coordinate: number; value: string };
}) {
  if (!tooltip) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        animation: 'fadeIn 0.3s ease-in-out',
        padding: '5px',
        fontWeight: 600,
        height: 'fit-content',
        backgroundColor: 'white',
        position: 'absolute',
        left: tooltip.coordinate,
        border: '1px solid #cfcece',
        bottom: '100px',
      }}
    >
      {tooltip.value}
    </Box>
  );
}

function buildNumericRange(range: Range, answersList: AnswerEntry[]): number[] {
  const maxBuckets = 10;
  const minBuckets = 5;

  if (answersList[0].type === 'slider') {
    return Array.from({ length: 11 }, (_, i) => i);
  }

  // If range min/max are provided, use those. Otherwise find min/max values
  const min = Math.floor(
    range.min ??
      (answersList.reduce(
        (min, answer) => (Number(answer.value) < min ? answer.value : min),
        null as number,
      ) as number),
  );
  const max = Math.ceil(
    range.max ??
      (answersList.reduce(
        (max, answer) => (Number(answer.value) > max ? answer.value : max),
        null as number,
      ) as number),
  );

  // For short ranges, use step of 1
  if (max - min <= maxBuckets && max - min > minBuckets) {
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }

  // increases / decreases bucket count until all items fit in bucketCount * allowedBuckets
  const calcBucketSize = (r: number, bucketSize: number) => {
    let bucketCount = Math.ceil(r / bucketSize);
    while (bucketCount < minBuckets) {
      bucketSize /= 2;
      bucketCount = Math.ceil(r / bucketSize);
    }
    while (bucketCount > maxBuckets) {
      bucketSize *= 2;
      bucketCount = Math.ceil(r / bucketSize);
    }
    return [bucketCount, bucketSize];
  };

  const [numOfBuckets, step] = calcBucketSize(
    max - min,
    // Starting position is first power of 10 to fit full range
    Math.pow(10, Math.floor(Math.log10((max - min) / maxBuckets))),
  );

  return Array.from({ length: numOfBuckets }, (_, i) => {
    const value = min + step * i;

    return Number.isInteger(value) ? value : parseFloat(value.toFixed(2));
  });
}

const CustomizedAxisTick: FunctionComponent<any> = (props: any) => {
  const { x, y, payload } = props;
  const tickValue =
    payload.value.length > 12
      ? payload.value.slice(0, 11) + '...'
      : payload.value;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="#666"
        transform="rotate(-35)"
      >
        {tickValue}
      </text>
    </g>
  );
};

export default function Chart({ submissions, selectedQuestion }: Props) {
  const [chartWidth, setChartWidth] = useState(240);
  const { surveyLanguage } = useTranslations();
  const theme = useTheme();
  const { tr } = useTranslations();
  const [tooltip, setTooltip] = useState(null);

  const answerData = useMemo(() => {
    if (!selectedQuestion) return;

    const questionAnswers = submissions
      .reduce(
        (answers, submission) => [...answers, ...submission.answerEntries],
        [] as AnswerEntry[],
      )
      .filter((answer) => answer.sectionId === selectedQuestion.id);
    if (!questionAnswers) return;

    let base: Data;
    switch (selectedQuestion.type) {
      case 'radio':
      case 'radio-image':
      case 'checkbox':
        base = {
          id: selectedQuestion.id,
          options: selectedQuestion.options.map((option) => {
            return {
              id: option.id,
              text: option.text[surveyLanguage],
              count: questionAnswers.reduce(
                (count, qa: AnswerEntry & { type: 'checkbox' | 'radio' }) => {
                  return qa.value === option.id ||
                    (Array.isArray(qa.value) && qa.value.includes(option.id))
                    ? count + 1
                    : count;
                },
                0,
              ),
            };
          }),
          tooltipFormatter: (value) => [
            value,
            tr.SurveySubmissionsPage.dataChart.tooltipCurrent,
          ],
        };
        break;
      case 'numeric':
      case 'slider':
        base = {
          id: selectedQuestion.id,
          options: buildNumericRange(
            { min: selectedQuestion.minValue, max: selectedQuestion.maxValue },
            questionAnswers,
          ).map((bucket, bucketIndex, buckets) => {
            const bucketMax = bucket + (buckets[1] - buckets[0]);
            return {
              id: bucket,
              text: `${bucket} ${
                buckets[1] - buckets[0] === 1
                  ? ''
                  : '\u2013 ' +
                    (Number.isInteger(bucketMax)
                      ? bucketMax
                      : parseFloat(bucketMax.toFixed(2)))
              }`,
              count: questionAnswers.reduce(
                (count, qa: AnswerEntry & { type: 'slider' | 'numeric' }) => {
                  if (qa.value == null || qa.value < bucket) {
                    return count;
                  }
                  // Last bucket must include the upper limit
                  if (bucketIndex === buckets.length - 1) {
                    return qa.value <= bucket + buckets[1] - buckets[0]
                      ? count + 1
                      : count;
                  }
                  return qa.value < bucket + buckets[1] - buckets[0]
                    ? count + 1
                    : count;
                },
                0,
              ),
            };
          }),
          tooltipFormatter: (value) => [
            value,
            tr.SurveySubmissionsPage.dataChart.tooltipCurrent,
          ],
        };
        break;
      case 'budgeting': {
        const inputMode = selectedQuestion.inputMode ?? 'absolute';

        // For pieces mode, show piece count; for direct mode, show budget amount (always monetary)
        const unit =
          selectedQuestion.budgetingMode === 'pieces'
            ? tr.BudgetingQuestion.perPiece
            : (selectedQuestion.unit ?? '');

        base = {
          id: selectedQuestion.id,
          options: selectedQuestion.targets.map((target, index) => {
            // Get raw stored allocations for this target across all submissions
            const allocations = questionAnswers.map(
              (qa: AnswerEntry & { type: 'budgeting' }) => qa.value[index] ?? 0,
            );

            // Convert to monetary values if stored as percentages
            const monetaryAllocations =
              inputMode === 'percentage'
                ? allocations.map(
                    (pct) => (pct / 100) * selectedQuestion.totalBudget,
                  )
                : allocations;

            const totalAllocation = monetaryAllocations.reduce(
              (sum, val) => sum + val,
              0,
            );
            const averageAllocation =
              monetaryAllocations.length > 0
                ? totalAllocation / monetaryAllocations.length
                : 0;

            // Round to 2 decimal places if needed
            const displayValue = Number.isInteger(averageAllocation)
              ? averageAllocation
              : parseFloat(averageAllocation.toFixed(2));

            return {
              id: index,
              text: target.name[surveyLanguage],
              count: displayValue,
            };
          }),
          tooltipFormatter: (value) => [
            unit ? `${value} ${unit}` : value,
            tr.SurveySubmissionsPage.dataChart.tooltipAverage,
          ],
        };
        break;
      }
      default:
    }

    const optionCount = base?.options.length;
    setChartWidth(
      optionCount <= 3
        ? 220
        : 220 + Math.min(760, Math.log2(optionCount - 2) * 180),
    );
    return base;
  }, [selectedQuestion, surveyLanguage]);

  return answerData ? (
    <Box position={'relative'}>
      <ResponsiveContainer
        minWidth={250}
        height={340}
        style={{
          backgroundColor: '#ffffffdd',
          borderBottomRightRadius: '7px',
          maxWidth: `${chartWidth}px`,
        }}
      >
        <BarChart
          style={{ fontWeight: 600 }}
          data={answerData.options}
          margin={{
            top: 25,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="text"
            tick={<CustomizedAxisTick />}
            interval={0}
            onMouseEnter={(params) => setTooltip(params)}
            onMouseLeave={() => setTooltip(null)}
          />
          <YAxis />
          <Tooltip formatter={answerData.tooltipFormatter} />

          <Bar dataKey="count" fill={theme.palette.primary.main} />
        </BarChart>
      </ResponsiveContainer>
      <LabelTooltip tooltip={tooltip} />
    </Box>
  ) : (
    <></>
  );
}
