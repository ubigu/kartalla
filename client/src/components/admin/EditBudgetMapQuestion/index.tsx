import {
  MapQuestionSelectionType,
  SurveyBudgetMapQuestion,
  SurveyMapQuestion,
  SurveyMapSubQuestion,
} from '@interfaces/survey';
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  TextField,
} from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import React, { useState } from 'react';
import AddSurveySectionActions from '../AddSurveySectionActions';
import EditMapSubQuestions from '../EditMapSubQuestions';
import MarkerIconSelect from '../MarkerIconSelect';
import StrokeColorSelect from '../StrokeColorSelect';
import StrokeStyleSelect from '../StrokeStyleSelect';
import QuestionOptions from '../QuestionOptions';
import { BudgetMapOptions } from './BudgetMapOptions';

interface Props {
  section: SurveyBudgetMapQuestion;
  disabled?: boolean;
  onChange: (section: SurveyBudgetMapQuestion) => void;
}

export default function EditBudgetMapQuestion({
  section,
  disabled,
  onChange,
}: Props) {
  const [expandedSection, setExpandedSection] = useState<number>(null);

  const { tr } = useTranslations();

  function toggleSelectionType(type: MapQuestionSelectionType) {
    const selectionTypes = !section.selectionTypes?.includes(type)
      ? [...(section.selectionTypes ?? []), type].sort()
      : (section.selectionTypes ?? []).filter((t) => t !== type);
    onChange({
      ...section,
      selectionTypes,
    });
  }

  return (
    <>
      <FormGroup row>
        <FormControlLabel
          label={tr.SurveySections.isRequired}
          control={
            <Checkbox
              name="is-required"
              disabled={disabled}
              checked={section.isRequired}
              onChange={(event) => {
                onChange({
                  ...section,
                  isRequired: event.target.checked,
                });
              }}
            />
          }
        />
      </FormGroup>
      <FormGroup sx={{ gap: '1rem' }}>
        <FormLabel>{'Budjetointi'}</FormLabel>
        <TextField
          disabled={disabled}
          label={'Kokonaisbudjetti'}
          value={section.budget ?? null}
          variant="standard"
          type="number"
          onChange={(event) => {
            onChange({
              ...section,
              budget: Number(event.target.value),
            });
          }}
        />
        <BudgetMapOptions
          disabled={disabled}
          options={section?.options ?? []}
          allowOptionValue
          onChange={(options) => {
            onChange({
              ...section,
              options,
            });
          }}
          title={'Vaihtoehdot'}
          allowOptionInfo={false}
        />
      </FormGroup>
      <FormGroup>
        <FormLabel>{tr.EditMapQuestion.selectionTypes}</FormLabel>
        <div style={{ display: 'flex', marginTop: '0.5rem' }}>
          <FormControlLabel
            label={tr.EditMapQuestion.point}
            control={
              <Checkbox
                name="point"
                disabled={disabled}
                checked={section.selectionTypes?.includes('point') ?? false}
                onChange={() => {
                  toggleSelectionType('point');
                }}
              />
            }
          />
          {section.selectionTypes?.includes('point') && (
            <MarkerIconSelect
              value={section.featureStyles?.point?.markerIcon}
              onChange={(icon) => {
                onChange({
                  ...section,
                  featureStyles: {
                    ...section.featureStyles,
                    point: {
                      markerIcon: icon,
                    },
                  },
                });
              }}
            />
          )}
        </div>
        <div style={{ display: 'flex', marginTop: '0.5rem' }}>
          <FormControlLabel
            label={tr.EditMapQuestion.line}
            control={
              <Checkbox
                name="line"
                disabled={disabled}
                checked={section.selectionTypes?.includes('line') ?? false}
                onChange={() => {
                  toggleSelectionType('line');
                }}
              />
            }
          />
          {section.selectionTypes?.includes('line') && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <StrokeStyleSelect
                value={section.featureStyles?.line?.strokeStyle}
                onChange={(value) => {
                  onChange({
                    ...section,
                    featureStyles: {
                      ...section.featureStyles,
                      line: {
                        ...section.featureStyles?.line,
                        strokeStyle: value,
                      },
                    },
                  });
                }}
              />
              <StrokeColorSelect
                value={section.featureStyles?.line?.strokeColor}
                onChange={(value) => {
                  onChange({
                    ...section,
                    featureStyles: {
                      ...section.featureStyles,
                      line: {
                        ...section.featureStyles?.line,
                        strokeColor: value,
                      },
                    },
                  });
                }}
              />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', marginTop: '0.5rem' }}>
          <FormControlLabel
            label={tr.EditMapQuestion.area}
            control={
              <Checkbox
                name="area"
                disabled={disabled}
                checked={section.selectionTypes?.includes('area') ?? false}
                onChange={() => {
                  toggleSelectionType('area');
                }}
              />
            }
          />
          {section.selectionTypes?.includes('area') && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <StrokeStyleSelect
                value={section.featureStyles?.area?.strokeStyle}
                onChange={(value) => {
                  onChange({
                    ...section,
                    featureStyles: {
                      ...section.featureStyles,
                      area: {
                        ...section.featureStyles?.area,
                        strokeStyle: value,
                      },
                    },
                  });
                }}
              />
              <StrokeColorSelect
                value={section.featureStyles?.area?.strokeColor}
                onChange={(value) => {
                  onChange({
                    ...section,
                    featureStyles: {
                      ...section.featureStyles,
                      area: {
                        ...section.featureStyles?.area,
                        strokeColor: value,
                      },
                    },
                  });
                }}
              />
            </div>
          )}
        </div>
      </FormGroup>
      <FormLabel>{tr.EditMapQuestion.subQuestions}</FormLabel>
      <EditMapSubQuestions
        mapQuestion={section}
        expandedSection={expandedSection}
        onExpandedSectionChange={(section) => {
          setExpandedSection(section);
        }}
        onChange={(subQuestions) => {
          onChange({ ...section, subQuestions });
        }}
      />
      <AddSurveySectionActions
        types={['radio', 'checkbox', 'free-text', 'numeric']}
        onAdd={(newSection: SurveyMapSubQuestion) => {
          onChange({
            ...section,
            subQuestions: [...(section.subQuestions ?? []), newSection],
          });
          // Open last section after adding a new one
          setExpandedSection((section.subQuestions ?? []).length);
        }}
        disableSectionPaste
      />
    </>
  );
}
