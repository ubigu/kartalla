import { SurveyPageSection } from '@interfaces/survey';
import GeoBudgetingIcon from '@src/components/icons/GeoBudgetingIcon';
import { ReactNode } from 'react';
import BudgetingIcon from '../icons/BudgetingIcon';
import CheckboxCheckedIcon from '../icons/CheckboxCheckedIcon';
import DownloadFileIcon from '../icons/DownloadFileIcon';
import { ImageCheckIcon } from '../icons/ImageCheckIcon';
import ImageSmallIcon from '../icons/ImageSmallIcon';
import LikertGroupIcon from '../icons/LikertGroupIcon';
import MapIcon from '../icons/MapIcon';
import MatrixIcon from '../icons/MatrixIcon';
import MultiCheckmarkIcon from '../icons/MultiCheckmarkIcon';
import NumericFieldIcon from '../icons/NumericFieldIcon';
import OrderedIcon from '../icons/OrderedIcon';
import PaperclipIcon from '../icons/PaperclipIcon';
import PersonIcon from '../icons/PersonIcon';
import RadioButtonCheckedIcon from '../icons/RadioButtonCheckedIcon';
import SliderIcon from '../icons/SliderIcon';
import TextFieldIcon from '../icons/TextFieldIcon';
import TextSectionIcon from '../icons/TextSectionIcon';

export const sectionTypeIcons: Record<SurveyPageSection['type'], ReactNode> = {
  'personal-info': <PersonIcon />,
  radio: <RadioButtonCheckedIcon />,
  'radio-image': <ImageCheckIcon />,
  checkbox: <CheckboxCheckedIcon />,
  'free-text': <TextFieldIcon />,
  numeric: <NumericFieldIcon />,
  map: <MapIcon />,
  sorting: <OrderedIcon />,
  slider: <SliderIcon />,
  matrix: <MatrixIcon />,
  'multi-matrix': <LikertGroupIcon />,
  'grouped-checkbox': <MultiCheckmarkIcon />,
  attachment: <PaperclipIcon />,
  budgeting: <BudgetingIcon />,
  'geo-budgeting': <GeoBudgetingIcon />,
  text: <TextSectionIcon />,
  image: <ImageSmallIcon />,
  document: <DownloadFileIcon />,
};
