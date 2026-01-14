import { SurveyMatrixQuestion } from '@interfaces/survey';
import {
  FormControl,
  FormLabel,
  MenuItem,
  Radio,
  Select,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';

import { makeStyles } from '@mui/styles';

import { useTranslations } from '@src/stores/TranslationContext';
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
  setDirty: (dirty: boolean) => void;
  question: SurveyMatrixQuestion;
  setBackdropOpen: Dispatch<SetStateAction<boolean>>;
}

interface ComponentState {
  isOverflow: boolean;
  breakPoint: number;
}

const useStyles = makeStyles({
  matrixRow: {
    display: 'flex',
    flexDirection: 'row',
  },
  matrixCell: {
    width: '100px',
    wordWrap: 'break-word',
    margin: '0',
    textAlign: 'center',
  },
  matrixText: {
    fontWeight: 'bold',
  },
  stickyLeft: {
    position: 'sticky',
    left: 0,
    zIndex: 1,
    textAlign: 'left',
  },
});

export default function MatrixQuestion({
  value,
  onChange,
  question,
  setBackdropOpen,
}: Props) {
  const { tr, surveyLanguage } = useTranslations();
  const classes = useStyles();
  const isMobileWidth = useMediaQuery('(max-width:430px)');
  const [componentState, setComponentState] = useState<ComponentState>({
    isOverflow: false,
    breakPoint: 0,
  });

  const radioRef = useRef(null);
  const selectRef = useRef(null);

  useLayoutEffect(() => {
    if (!radioRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];

      setComponentState((prev) => {
        if (
          entry === null ||
          entry.target.clientWidth < entry.target.scrollWidth
        ) {
          return {
            isOverflow: true,
            breakPoint: prev.isOverflow
              ? prev.breakPoint
              : entry.target.scrollWidth,
          };
        } else {
          return prev;
        }
      });
    });

    resizeObserver.observe(radioRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [componentState.isOverflow, isMobileWidth]);

  useLayoutEffect(() => {
    if (!selectRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];

      setComponentState((prev) => {
        if (entry.target.scrollWidth >= componentState.breakPoint) {
          return { isOverflow: false, breakPoint: prev.breakPoint };
        }
        return prev;
      });
    });

    resizeObserver.observe(selectRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [componentState.isOverflow, isMobileWidth]);

  function handleChange(
    subjectIndex: number,
    event: ChangeEvent<HTMLInputElement> | SelectChangeEvent,
    type: 'radio' | 'select' = 'radio',
  ) {
    // Ignore if the value is false
    if (type === 'radio' && !(event.target as HTMLInputElement).checked) {
      return;
    }
    // Set the row's value to the selected button's value
    const values = [...value];
    values[subjectIndex] = event.target.value;
    onChange(values);
  }

  return (
    <>
      {!isMobileWidth && !componentState.isOverflow && (
        <TableContainer id={`${question.id}-input`} ref={radioRef}>
          <Table size="small">
            {question.title && (
              <caption style={visuallyHidden}>
                {question.title?.[surveyLanguage]}
              </caption>
            )}
            <TableHead>
              <TableRow>
                <TableCell scope="col" className={classes.stickyLeft} />
                {question.classes.map((entry, index) => {
                  return (
                    <TableCell
                      scope="col"
                      key={index}
                      className={`${classes.matrixCell} ${classes.matrixText}`}
                    >
                      {entry?.[surveyLanguage] ?? index}
                    </TableCell>
                  );
                })}
                {question.allowEmptyAnswer && (
                  <TableCell
                    scope="col"
                    sx={{ backgroundColor: '#efefef' }}
                    className={`${classes.matrixCell} ${classes.matrixText}`}
                  >
                    {tr.MatrixQuestion.emptyAnswer}
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {question.subjects.map((subject, subjectIndex) => {
                return (
                  <TableRow key={subjectIndex}>
                    <TableCell
                      component="th"
                      scope="row"
                      className={[
                        classes.stickyLeft,
                        classes.matrixCell,
                        classes.matrixText,
                      ].join(' ')}
                    >
                      {subject?.[surveyLanguage]}
                    </TableCell>
                    {question.classes.map((_entry, classIndex) => (
                      <TableCell
                        key={classIndex.toString()}
                        className={classes.matrixCell}
                      >
                        <Radio
                          name={`question-${question.id}-${subjectIndex}`}
                          checked={
                            value[subjectIndex] === classIndex.toString()
                          }
                          value={classIndex.toString()}
                          onChange={(event) => {
                            handleChange(subjectIndex, event);
                          }}
                        />
                      </TableCell>
                    ))}
                    {question.allowEmptyAnswer && (
                      <TableCell
                        className={classes.matrixCell}
                        sx={{ backgroundColor: '#efefef' }}
                      >
                        <Radio
                          name={`question-${question.id}-${subjectIndex}`}
                          checked={value[subjectIndex] === '-1'}
                          value={'-1'}
                          onChange={(event) => {
                            handleChange(subjectIndex, event);
                          }}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {!isMobileWidth && componentState.isOverflow && (
        <TableContainer
          id={`${question.id}-input`}
          ref={selectRef}
          sx={{ marginTop: 2 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  scope="col"
                  className={[
                    classes.stickyLeft,
                    classes.matrixCell,
                    classes.matrixText,
                  ].join(' ')}
                >
                  {tr.MatrixQuestion.subject}
                </TableCell>
                <TableCell
                  scope="col"
                  className={[classes.matrixCell, classes.matrixText].join(' ')}
                  sx={{ '&&': { textAlign: 'left' } }}
                >
                  {tr.MatrixQuestion.response}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {question.subjects.map((subject, subjectIndex) => {
                return (
                  <TableRow key={subjectIndex}>
                    <TableCell
                      component="th"
                      scope="row"
                      className={[
                        classes.stickyLeft,
                        classes.matrixCell,
                        classes.matrixText,
                      ].join(' ')}
                    >
                      {subject?.[surveyLanguage]}
                    </TableCell>

                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 160, m: 1 }}>
                        <Select
                          onOpen={() => setBackdropOpen(true)}
                          onClose={() => setBackdropOpen(false)}
                          value={value?.[subjectIndex] ?? ''}
                          onChange={(event: SelectChangeEvent<string>) =>
                            handleChange(subjectIndex, event, 'select')
                          }
                        >
                          {question.classes.map((entry, classIndex) => (
                            <MenuItem
                              key={classIndex}
                              value={classIndex.toString()}
                            >
                              {entry?.[surveyLanguage]}
                            </MenuItem>
                          ))}
                          {question.allowEmptyAnswer && (
                            <MenuItem value={'-1'}>
                              {tr.MatrixQuestion.emptyAnswer}
                            </MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {isMobileWidth && (
        <Stack id={`${question.id}-input`} mt={2}>
          {question.subjects.map((subject, subjectIndex) => {
            return (
              <FormControl
                key={subjectIndex}
                size="small"
                sx={{ minWidth: 160, m: 1 }}
              >
                <FormLabel
                  id={`matrix-select-label-${question.id}-${subjectIndex}`}
                  sx={{
                    fontWeight: 'bold',
                    marginBottom: 1,
                    color: 'black',
                    fontSize: '0.875rem',
                  }}
                >
                  {subject?.[surveyLanguage]}
                </FormLabel>
                <Select
                  onOpen={() => setBackdropOpen(true)}
                  onClose={() => setBackdropOpen(false)}
                  labelId={`matrix-select-label-${question.id}-${subjectIndex}`}
                  displayEmpty
                  value={value?.[subjectIndex] ?? ''}
                  onChange={(event: SelectChangeEvent<string>) =>
                    handleChange(subjectIndex, event, 'select')
                  }
                >
                  <MenuItem sx={{ display: 'none' }} value="" disabled>
                    {tr.SurveySections.selectAnswer}
                  </MenuItem>
                  {question.classes.map((entry, classIndex) => (
                    <MenuItem key={classIndex} value={classIndex.toString()}>
                      {entry?.[surveyLanguage]}
                    </MenuItem>
                  ))}
                  {question.allowEmptyAnswer && (
                    <MenuItem value={'-1'}>
                      {tr.MatrixQuestion.emptyAnswer}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            );
          })}
        </Stack>
      )}
    </>
  );
}
