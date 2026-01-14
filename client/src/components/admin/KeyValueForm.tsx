import { SurveyEmailInfoItem } from '@interfaces/survey';
import {
  Fab,
  FormLabel,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import AddIcon from '@src/components/icons/AddIcon';
import DeleteBinIcon from '@src/components/icons/DeleteBinIcon';
import { useTranslations } from '@src/stores/TranslationContext';

interface Props {
  label?: string;
  value: SurveyEmailInfoItem[];
  onChange: (object: SurveyEmailInfoItem[]) => void;
}

export default function KeyValueForm({ label, value, onChange }: Props) {
  const { tr, surveyLanguage, initializeLocalizedObject } = useTranslations();

  return (
    <div>
      {label && <FormLabel>{label}</FormLabel>}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{tr.KeyValueForm.key}</TableCell>
              <TableCell>{tr.KeyValueForm.value}</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {value.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <TextField
                    variant="standard"
                    value={row.name?.[surveyLanguage]}
                    onChange={(event) => {
                      value[index].name = {
                        ...value[index].name,
                        [surveyLanguage]: event.target.value,
                      };
                      onChange(value);
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    variant="standard"
                    value={row.value?.[surveyLanguage]}
                    onChange={(event) => {
                      value[index].value = {
                        ...value[index].value,
                        [surveyLanguage]: event.target.value,
                      };
                      onChange(value);
                    }}
                  />
                </TableCell>
                <TableCell style={{ width: 0 }}>
                  <Tooltip title={tr.KeyValueForm.deleteEntry}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        onChange(value.filter((_, i) => i !== index));
                      }}
                    >
                      <DeleteBinIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Tooltip title={tr.KeyValueForm.addEntry}>
        <Fab
          color="primary"
          aria-label="add-key-value-pair"
          size="small"
          style={{ margin: '1rem 0' }}
          sx={{ boxShadow: 'none' }}
          onClick={() => {
            onChange([
              ...value,
              {
                name: initializeLocalizedObject(''),
                value: initializeLocalizedObject(''),
              },
            ]);
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </div>
  );
}
