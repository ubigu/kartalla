import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { format } from 'date-fns';
import { AnswerItem } from './AnswersList';

interface Props {
  answers: AnswerItem[];
}

export function AnswerTable({ answers }: Props) {
  const { tr } = useTranslations();

  if (!answers.length) {
    return null;
  }

  return (
    <TableContainer component={Paper} sx={{ marginTop: 2 }}>
      <Table sx={{ '& td, & th': { fontSize: '1rem' } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 500 }}>
              {tr.AnswersList.respondent.replace('{x}', '')}
            </TableCell>
            <TableCell sx={{ fontWeight: 500 }}>
              {tr.SurveySubmissionsPage.date}
            </TableCell>
            <TableCell sx={{ fontWeight: 500 }}>
              {tr.MapInfoBox.answer}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {answers.map((answer, index) => (
            <TableRow
              key={`${answer.submission.id}-${answer.entry.sectionId}-${index}`}
            >
              <TableCell sx={{ fontWeight: 400 }}>
                {answer.submission.id}
              </TableCell>
              <TableCell sx={{ fontWeight: 400, color: '#797979' }}>
                {format(answer.submission.timestamp, 'd.MM.yyyy')}
              </TableCell>
              <TableCell sx={{ fontWeight: 400 }}>
                {String(answer.entry.value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
