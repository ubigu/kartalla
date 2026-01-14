import { SurveyMultiMatrixQuestion } from '@interfaces/survey';
import {
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Theme,
  useMediaQuery,
} from '@mui/material';
import { SystemStyleObject } from '@mui/system';
import { visuallyHidden } from '@mui/utils';

import { useTranslations } from '@src/stores/TranslationContext';
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface Props {
  value: string[][];
  onChange: (value: string[][]) => void;
  setDirty: (dirty: boolean) => void;
  question: SurveyMultiMatrixQuestion;
  validationErrors: (
    | 'required'
    | 'answerLimits'
    | 'minValue'
    | 'maxValue'
    | 'custom'
  )[];
  setBackdropOpen: Dispatch<SetStateAction<boolean>>;
  readOnly?: boolean;
}

interface ComponentState {
  isOverflow: boolean;
  breakPoint: number;
}

type StyleKeys = 'matrixRow' | 'matrixCell' | 'matrixText' | 'stickyLeft';

const styles: Record<StyleKeys, SystemStyleObject<Theme>> = {
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
};

export default function MultiMatrixQuestion({
  value,
  onChange,
  question,
  validationErrors,
  setDirty,
  setBackdropOpen,
  readOnly = false,
}: Props) {
  const { tr, surveyLanguage } = useTranslations();
  const isMobileWidth = useMediaQuery('(max-width:430px)');
  const [componentState, setComponentState] = useState<ComponentState>({
    isOverflow: false,
    breakPoint: 0,
  });
  const radioRef = useRef(null);
  const selectRef = useRef(null);

  useEffect(() => {
    if (
      question?.answerLimits?.max &&
      value.some((row) => row.length > question.answerLimits.max)
    ) {
      setDirty(true);
    }
  }, [value]);

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

  function handleChange(subjectIndex: number, classIndex: string) {
    function updateAnswerRow(row: string[]) {
      if (classIndex === '-1' && !row.includes(classIndex)) {
        return ['-1'];
      }

      if (row.includes(classIndex)) {
        return row.filter((item) => item !== classIndex);
      }
      return row.includes('-1') ? [classIndex] : [...row, classIndex];
    }

    const values = value.map((val, index) =>
      index === subjectIndex ? updateAnswerRow(val) : [...val],
    );

    onChange(values);
  }

  function handleSelectChange(subjectIndex: number, classIndexes: string[]) {
    function updateAnswerRow(row: string[]) {
      if (classIndexes.includes('-1')) {
        return row.includes('-1')
          ? classIndexes.filter((val) => val !== '-1')
          : ['-1'];
      }

      return classIndexes;
    }
    const values = value.map((val, index) =>
      index === subjectIndex ? updateAnswerRow(val) : [...val],
    );
    onChange(values);
  }

  function getSelectionRenderValue(subjectIndex: number) {
    const valueList = value?.[subjectIndex];
    if (valueList.length === 0) {
      return;
    }
    if (valueList.length > 1) {
      return `${valueList.length} ${tr.MultiMatrixQuestion.selected}`;
    }
    if (valueList[0] === '-1') {
      return tr.MatrixQuestion.emptyAnswer;
    }
    return question.classes[Number(valueList[0])]?.[surveyLanguage];
  }

  const answerLimitText = useMemo(() => {
    if (!question.answerLimits) {
      return null;
    }
    return (
      question.answerLimits.min && question.answerLimits.max
        ? tr.MultiMatrixQuestion.answerLimitsMinMax
        : question.answerLimits.min
          ? tr.MultiMatrixQuestion.answerLimitsMin
          : question.answerLimits.max
            ? tr.MultiMatrixQuestion.answerLimitsMax
            : ''
    )
      .replace('{min}', `${question.answerLimits.min}`)
      .replace('{max}', `${question.answerLimits.max}`);
  }, [question.answerLimits, surveyLanguage]);

  const unAnsweredRowsText = useMemo(() => {
    if (!question.answerLimits) {
      return null;
    }

    const unansweredRows = value
      .map((rowAnswers, index) => {
        if (rowAnswers.length < question.answerLimits.min) {
          return index + 1;
        }
      })
      .filter((val) => val);

    if (unansweredRows.length > 1) {
      return tr.MultiMatrixQuestion.unansweredRows.replace(
        '{x}',
        unansweredRows
          .join(', ')
          .replace(/, ([^,]*)$/, ` ${tr.MultiMatrixQuestion.and} $1`),
      );
    }
    return tr.MultiMatrixQuestion.unansweredRow.replace(
      '{x}',
      unansweredRows.join(', '),
    );
  }, value);

  function getSRRowFeedback(subjectIndex: number) {
    if (value[subjectIndex].includes('-1')) {
      // IDK already selected on this row
      return tr.MultiMatrixQuestion.SR.replacingIDK;
    }
    const count = value[subjectIndex].length;
    if (question.answerLimits === null && !question.isRequired) {
      return;
    }

    const limits = question.answerLimits;
    if (limits.min === null && question.isRequired && count === 0) {
      return tr.MultiMatrixQuestion.SR.isRequired;
    }
    if (count < limits.min) {
      return tr.MultiMatrixQuestion.SR.mustSelectMore.replace(
        '{x}',
        String(limits.min - count),
      );
    }
    if (count < limits.max) {
      return tr.MultiMatrixQuestion.SR.maySelectMore.replace(
        '{x}',
        String(limits.max - count),
      );
    }
    if (count >= limits.max) {
      return tr.MultiMatrixQuestion.SR.maxSelected;
    }
  }

  return (
    <>
      {answerLimitText && (
        // Align this helper text with the form label
        <>
          <FormHelperText
            style={{ marginLeft: 0, marginBottom: '0.5em' }}
            id={`checkbox-helper-label-${question.id}`}
          >
            {`${answerLimitText}\n${
              validationErrors?.includes('answerLimits')
                ? unAnsweredRowsText
                : ''
            } `}
          </FormHelperText>
          {validationErrors && validationErrors.includes('answerLimits') && (
            <FormHelperText style={visuallyHidden} role="alert">
              {`${question.title?.[surveyLanguage]}, ${answerLimitText}\n${unAnsweredRowsText}`}
            </FormHelperText>
          )}
        </>
      )}
      {!isMobileWidth && !componentState.isOverflow && (
        <TableContainer id={`${question.id}-input`} ref={radioRef}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell scope="col" sx={styles.stickyLeft} />
                {question.classes.map((entry, index) => {
                  return (
                    <TableCell
                      scope="col"
                      key={index.toString()}
                      sx={{ ...styles.matrixCell, ...styles.matrixText }}
                    >
                      {entry?.[surveyLanguage] ?? index}
                    </TableCell>
                  );
                })}
                {question.allowEmptyAnswer && (
                  <TableCell
                    sx={{
                      backgroundColor: '#efefef',
                      ...styles.matrixCell,
                      ...styles.matrixText,
                    }}
                    scope="col"
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
                      sx={{
                        ...styles.matrixCell,
                        ...styles.stickyLeft,
                        ...styles.matrixText,
                      }}
                    >
                      {subject?.[surveyLanguage]}
                    </TableCell>
                    {question.classes.map((_entry, classIndex) => {
                      return (
                        <TableCell
                          key={classIndex.toString()}
                          sx={styles.matrixCell}
                        >
                          {classIndex === 0 && (
                            <p
                              style={visuallyHidden}
                              id={`SR-row-fill-status-${question.id}-${subjectIndex}`}
                            >
                              {getSRRowFeedback(subjectIndex)}
                            </p>
                          )}
                          <Checkbox
                            inputProps={{
                              className: `checkbox-${question.id}`,
                              'aria-describedby': `SR-row-fill-status-${question.id}-${subjectIndex}`,
                            }}
                            sx={{
                              '&.Mui-focusVisible': {
                                border: (theme) =>
                                  `solid 2px ${theme.palette.primary.main}`,
                                margin: '-2px',
                              },
                            }}
                            disabled={
                              readOnly ||
                              (value[subjectIndex].length ===
                                question.answerLimits?.max &&
                                !value[subjectIndex].includes(
                                  String(classIndex),
                                ))
                            }
                            name={`question-${subjectIndex}`}
                            checked={value[subjectIndex].includes(
                              classIndex.toString(),
                            )}
                            value={classIndex}
                            onChange={(event) => {
                              handleChange(
                                subjectIndex,
                                (event.target as HTMLInputElement).value,
                              );
                            }}
                          />
                        </TableCell>
                      );
                    })}
                    {question.allowEmptyAnswer && (
                      <TableCell
                        sx={{
                          backgroundColor: '#efefef',
                          ...styles.matrixCell,
                        }}
                      >
                        <Checkbox
                          inputProps={{
                            className: `checkbox-${question.id}`,
                            'aria-label': tr.MultiMatrixQuestion.SR.IDK,
                          }}
                          sx={{
                            '&.Mui-focusVisible': {
                              border: (theme) =>
                                `solid 2px ${theme.palette.primary.main}`,
                              margin: '-2px',
                            },
                          }}
                          name={`question-${subjectIndex}`}
                          checked={value[subjectIndex][0] === '-1'}
                          value={-1}
                          onChange={(event) => {
                            handleChange(
                              subjectIndex,
                              (event.target as HTMLInputElement).value,
                            );
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
            {question.title && (
              <caption style={visuallyHidden}>
                {question.title?.[surveyLanguage]}
              </caption>
            )}
            <TableHead>
              <TableRow>
                <TableCell
                  scope="col"
                  sx={{
                    ...styles.matrixCell,
                    ...styles.matrixText,
                    ...styles.stickyLeft,
                  }}
                >
                  {tr.MatrixQuestion.subject}
                </TableCell>
                <TableCell
                  scope="col"
                  sx={{
                    '&&': {
                      textAlign: 'left',
                      ...styles.matrixCell,
                      ...styles.matrixText,
                    },
                  }}
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
                      sx={{
                        ...styles.matrixCell,
                        ...styles.matrixText,
                        ...styles.stickyLeft,
                      }}
                    >
                      {subject?.[surveyLanguage]}
                    </TableCell>

                    <TableCell>
                      <FormControl
                        size="small"
                        sx={{ minWidth: 160, maxWidth: 200, m: 1 }}
                      >
                        <Select
                          onOpen={() => setBackdropOpen(true)}
                          onClose={() => setBackdropOpen(false)}
                          multiple
                          renderValue={() =>
                            getSelectionRenderValue(subjectIndex)
                          }
                          value={value?.[subjectIndex]}
                          onChange={(event) => {
                            if (Array.isArray(event.target.value)) {
                              handleSelectChange(
                                subjectIndex,
                                event.target.value,
                              );
                            }
                          }}
                        >
                          {question.classes.map((entry, classIndex) => (
                            <MenuItem
                              key={classIndex}
                              value={String(classIndex)}
                              aria-describedby={`SR-row-fill-status-${question.id}-${subjectIndex}`}
                              disabled={
                                readOnly ||
                                (value[subjectIndex].length ===
                                  question.answerLimits?.max &&
                                  !value[subjectIndex].includes(
                                    String(classIndex),
                                  ))
                              }
                            >
                              <Checkbox
                                checked={value[subjectIndex].includes(
                                  classIndex.toString(),
                                )}
                              />
                              {entry?.[surveyLanguage]}
                            </MenuItem>
                          ))}
                          {question.allowEmptyAnswer && (
                            <MenuItem
                              value={'-1'}
                              sx={{ backgroundColor: '#efefef' }}
                            >
                              <Checkbox
                                checked={value[subjectIndex].includes('-1')}
                              />
                              {tr.MatrixQuestion.emptyAnswer}
                            </MenuItem>
                          )}
                        </Select>
                      </FormControl>
                      <p
                        style={visuallyHidden}
                        id={`SR-row-fill-status-${question.id}-${subjectIndex}`}
                      >
                        {getSRRowFeedback(subjectIndex)}
                      </p>
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
                  displayEmpty
                  multiple
                  labelId={`matrix-select-label-${question.id}-${subjectIndex}`}
                  renderValue={() => getSelectionRenderValue(subjectIndex)}
                  value={value?.[subjectIndex]}
                  onChange={(event) => {
                    if (Array.isArray(event.target.value)) {
                      handleSelectChange(subjectIndex, event.target.value);
                    }
                  }}
                >
                  <MenuItem sx={{ display: 'none' }} value="" disabled>
                    {tr.SurveySections.selectAnswer}
                  </MenuItem>
                  {question.classes.map((entry, classIndex) => (
                    <MenuItem
                      key={classIndex}
                      value={classIndex.toString()}
                      aria-describedby={`SR-row-fill-status-${question.id}-${subjectIndex}`}
                      disabled={
                        readOnly ||
                        (value[subjectIndex].length ===
                          question.answerLimits?.max &&
                          !value[subjectIndex].includes(String(classIndex)))
                      }
                    >
                      <Checkbox
                        checked={value[subjectIndex].includes(
                          classIndex.toString(),
                        )}
                      />
                      {entry?.[surveyLanguage]}
                    </MenuItem>
                  ))}
                  {question.allowEmptyAnswer && (
                    <MenuItem value={'-1'} sx={{ backgroundColor: '#efefef' }}>
                      <Checkbox checked={value[subjectIndex].includes('-1')} />
                      {tr.MatrixQuestion.emptyAnswer}
                    </MenuItem>
                  )}
                </Select>

                <p
                  style={visuallyHidden}
                  id={`SR-row-fill-status-${question.id}-${subjectIndex}`}
                >
                  {getSRRowFeedback(subjectIndex)}
                </p>
              </FormControl>
            );
          })}
        </Stack>
      )}
    </>
  );
}
