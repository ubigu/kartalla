import { Box, CardActionArea, List, ListItem, Typography } from '@mui/material';

import BudgetingIcon from '@src/components/icons/BudgetingIcon';
import CheckboxCheckedIcon from '@src/components/icons/CheckboxCheckedIcon';
import ChevronRightIcon from '@src/components/icons/ChevronRightIcon';
import LikertGroupIcon from '@src/components/icons/LikertGroupIcon';
import MapIcon from '@src/components/icons/MapIcon';
import MatrixIcon from '@src/components/icons/MatrixIcon';
import MultiCheckmarkIcon from '@src/components/icons/MultiCheckmarkIcon';
import NumericFieldIcon from '@src/components/icons/NumericFieldIcon';
import OrderedIcon from '@src/components/icons/OrderedIcon';
import PaperclipIcon from '@src/components/icons/PaperclipIcon';
import RadioButtonCheckedIcon from '@src/components/icons/RadioButtonCheckedIcon';
import SliderIcon from '@src/components/icons/SliderIcon';
import TextSectionIcon from '@src/components/icons/TextSectionIcon';

import { SurveyQuestion } from '@interfaces/survey';
import { Person } from '@mui/icons-material';
import GeoBudgetingIcon from '@src/components/icons/GeoBudgetingIcon';
import { ImageCheckIcon } from '@src/components/icons/ImageCheckIcon';
import { useTranslations } from '@src/stores/TranslationContext';
import { assertNever } from '@src/utils/typeCheck';

interface Props {
  questions: SurveyQuestion[];
  handleClick: (question: SurveyQuestion) => void;
}

function getQuestionIcon(
  questionType: Exclude<SurveyQuestion['type'], 'text' | 'image' | 'document'>,
) {
  switch (questionType) {
    case 'checkbox':
      return <CheckboxCheckedIcon color="primary" />;
    case 'radio':
      return <RadioButtonCheckedIcon color="primary" />;
    case 'radio-image':
      return <ImageCheckIcon color="primary" />;
    case 'numeric':
      return <NumericFieldIcon color="primary" />;
    case 'map':
      return <MapIcon color="primary" />;
    case 'sorting':
      return <OrderedIcon color="primary" />;
    case 'slider':
      return <SliderIcon color="primary" />;
    case 'matrix':
      return <MatrixIcon color="primary" />;
    case 'multi-matrix':
      return <LikertGroupIcon color="primary" />;
    case 'grouped-checkbox':
      return <MultiCheckmarkIcon color="primary" />;
    case 'attachment':
      return <PaperclipIcon color="primary" />;
    case 'free-text':
      return <TextSectionIcon color="primary" />;
    case 'personal-info':
      return <Person color="primary" />;
    case 'budgeting':
      return <BudgetingIcon color="primary" />;
    case 'geo-budgeting':
      return <GeoBudgetingIcon color="primary" />;
    default:
      assertNever(questionType);
  }
}

export function PageQuestionList({ questions, handleClick }: Props) {
  const { surveyLanguage } = useTranslations();

  return (
    <>
      <List sx={{ margin: '0 -1rem' }}>
        {questions.map((question) => (
          <ListItem
            key={question.id}
            sx={{
              padding: 0,
            }}
          >
            <CardActionArea
              onClick={() => handleClick(question)}
              sx={{
                '&.MuiButtonBase-root': {
                  padding: '4px 1rem',
                  '&:hover': { backgroundColor: '#41BBFF33' },
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {getQuestionIcon(question.type)}
                  <Typography>{question.title[surveyLanguage]}</Typography>
                </Box>

                <ChevronRightIcon sx={{ color: '#41BBFF' }} />
              </Box>
            </CardActionArea>
          </ListItem>
        ))}
      </List>
    </>
  );
}
