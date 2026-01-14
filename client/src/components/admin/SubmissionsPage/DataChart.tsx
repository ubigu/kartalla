import { Submission } from '@interfaces/survey';
import {
  Bar,
  ComposedChart,
  Label,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Box, Skeleton, useTheme } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { format, getWeek, getYear, parse } from 'date-fns';

interface SubmissionData {
  date: string;
  weekAndYear: string;
  week: number;
  submissionCount: number;
  cumulativeCount: number;
}

interface SubmissionDataByWeek {
  [key: string]: {
    week: number;
    year: number;
    submissionCount: number;
    cumulativeCount: number;
  };
}

interface Props {
  submissions: Submission[];
  submissionsLoading: boolean;
}

const SCALE_THRESHOLD = 31;

function getDataByWeek(dataList: SubmissionData[]) {
  if (!dataList?.length) return [];
  return Object.values(
    dataList.reduce((dataByWeek, data) => {
      const year = getYear(parse(data.date, 'd.M.yyyy', new Date()));
      return {
        ...dataByWeek,
        [data.weekAndYear]: dataByWeek[data.weekAndYear]
          ? {
              ...dataByWeek[data.weekAndYear],
              week: data.week,
              year: year,
              submissionCount:
                dataByWeek[data.weekAndYear].submissionCount +
                data.submissionCount,
              cumulativeCount: Math.max(
                dataByWeek[data.weekAndYear].cumulativeCount,
                data.cumulativeCount,
              ),
            }
          : {
              week: data.week,
              year: year,
              submissionCount: data.submissionCount,
              cumulativeCount: data.cumulativeCount,
            },
      };
    }, {} as SubmissionDataByWeek),
  ).map((val) => val);
}

export function DataChart({ submissions, submissionsLoading }: Props) {
  const theme = useTheme();
  const { tr } = useTranslations();

  if (submissionsLoading) {
    return <Skeleton variant="rectangular" height={'390'} />;
  }

  const submissionsData = Object.entries(
    submissions?.reduce(
      (data, submission) => {
        const timestamp = format(submission.timestamp, 'dd.MM.yyyy');

        return {
          ...data,
          [timestamp]: data?.[timestamp]
            ? [...data[timestamp], submission.id]
            : [submission.id],
        };
      },
      {} as Record<string, number[]>,
    ),
  )
    .map(([date, submissionIds]) => {
      const weekNum = getWeek(
        parse(date, 'dd.MM.yyyy', new Date(), { weekStartsOn: 1 }),
      );
      const year = getYear(parse(date, 'dd.MM.yyyy', new Date()));
      return {
        date: date,
        weekAndYear: `${weekNum}-${year}`,
        week: weekNum,
        submissionCount: submissionIds.length,
      };
    })

    .reduce(
      (prev, current, index) => [
        ...prev,
        {
          ...current,
          cumulativeCount:
            index === 0
              ? current.submissionCount
              : current.submissionCount + prev[index - 1].cumulativeCount,
        },
      ],
      [],
    );

  const displayByWeek = submissionsData.length > SCALE_THRESHOLD;

  return (
    <Box
      style={{
        height: '390px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ResponsiveContainer width="95%" height="95%">
        <ComposedChart
          style={{ fontWeight: 600 }}
          margin={{ bottom: 30 }}
          data={
            displayByWeek ? getDataByWeek(submissionsData) : submissionsData
          }
        >
          <XAxis
            dataKey={displayByWeek ? 'week' : 'date'}
            tickFormatter={(data) =>
              displayByWeek
                ? data
                : format(parse(data, 'dd.MM.yyyy', new Date()), 'd.M.')
            }
          >
            <Label
              value={
                displayByWeek
                  ? tr.SurveySubmissionsPage.dataChart.xAxisLabel.byWeek
                  : tr.SurveySubmissionsPage.dataChart.xAxisLabel.byDay
              }
              position="bottom"
            />
          </XAxis>

          <YAxis yAxisId="left">
            <Label
              angle={-90}
              value={tr.SurveySubmissionsPage.dataChart.yAxisLabel}
              position="insideLeft"
              style={{ textAnchor: 'middle' }}
            />
          </YAxis>
          <YAxis yAxisId="right" orientation="right">
            <Label
              fontStyle="bold"
              angle={90}
              value={tr.SurveySubmissionsPage.dataChart.yAxisTotalLabel}
              position="insideRight"
              style={{ textAnchor: 'middle' }}
            />
          </YAxis>
          <Tooltip
            formatter={(_val, name) => [
              _val,
              name === 'submissionCount'
                ? tr.SurveySubmissionsPage.dataChart.tooltipCurrent
                : tr.SurveySubmissionsPage.dataChart.tooltipTotal,
            ]}
            labelFormatter={(label, data) =>
              displayByWeek
                ? `${tr.SurveySubmissionsPage.dataChart.tooltipWeekLabel.replace(
                    '{x}',
                    label,
                  )} ${data[0]?.payload.year}`
                : label
            }
          />
          <Bar
            yAxisId="left"
            dataKey="submissionCount"
            fill={theme.palette.primary.main}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dot={false}
            dataKey="cumulativeCount"
            strokeWidth={2}
            stroke={theme.palette.secondary.main}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}
