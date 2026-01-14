import {
  Autocomplete,
  Box,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  TextField,
} from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';
import { useEffect, useState } from 'react';
import Fieldset from '../Fieldset';
import RichTextEditor from '../RichTextEditor';
import KeyValueForm from './KeyValueForm';

export default function EditSurveyEmail() {
  const [autocompleteEmailsLoading, setAutocompleteEmailsLoading] =
    useState(true);
  const [autocompleteEmails, setAutocompleteEmails] = useState<string[]>([]);

  const { activeSurvey, activeSurveyLoading, editSurvey } = useSurvey();
  const { tr, surveyLanguage } = useTranslations();

  useEffect(() => {
    async function fetchAutocompleteEmails() {
      setAutocompleteEmailsLoading(true);
      try {
        const emails = await request<string[]>('/api/surveys/report-emails');
        setAutocompleteEmails(emails);
      } catch (error) {
        // Ignore network errors
        setAutocompleteEmails([]);
      }
      setAutocompleteEmailsLoading(false);
    }
    fetchAutocompleteEmails();
  }, []);

  return (
    <>
      <Fieldset loading={activeSurveyLoading}>
        <div>
          <FormControlLabel
            control={
              <Checkbox
                name="email-enabled"
                disabled={activeSurveyLoading}
                checked={activeSurvey.email.enabled ?? false}
                onChange={(event) => {
                  editSurvey({
                    ...activeSurvey,
                    email: {
                      ...activeSurvey.email,
                      enabled: event.target.checked,
                    },
                  });
                }}
              />
            }
            label={tr.EditSurveyEmail.enable}
          />
          <FormHelperText>{tr.EditSurveyEmail.enableHelperText}</FormHelperText>
        </div>
        {activeSurvey.email.enabled && (
          <>
            <Box display={'flex'} flexDirection="column" gap={'1rem'}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="margin-images-enabled"
                    disabled={activeSurveyLoading}
                    checked={activeSurvey.email.includeMarginImages}
                    onChange={(event) => {
                      editSurvey({
                        ...activeSurvey,
                        email: {
                          ...activeSurvey.email,
                          includeMarginImages: event.target.checked,
                        },
                      });
                    }}
                  />
                }
                label={tr.EditSurveyEmail.includeMarginImages}
              />
              <div>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="personal-info-enabled"
                      disabled={activeSurveyLoading}
                      checked={activeSurvey.email.includePersonalInfo}
                      onChange={(event) => {
                        editSurvey({
                          ...activeSurvey,
                          email: {
                            ...activeSurvey.email,
                            includePersonalInfo: event.target.checked,
                          },
                        });
                      }}
                    />
                  }
                  label={tr.EditSurveyEmail.includePersonalInfo}
                />
                <FormHelperText>
                  {tr.EditSurveyEmail.includePersonalInfoHelperText}
                </FormHelperText>
              </div>
              <div>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="email-required"
                      disabled={activeSurveyLoading}
                      checked={activeSurvey.email.required}
                      onChange={(event) => {
                        editSurvey({
                          ...activeSurvey,
                          email: {
                            ...activeSurvey.email,
                            required: event.target.checked,
                          },
                        });
                      }}
                    />
                  }
                  label={tr.EditSurveyEmail.required}
                />
                <FormHelperText>
                  {tr.EditSurveyEmail.requiredHelperText}
                </FormHelperText>
              </div>
            </Box>
            <Autocomplete
              multiple
              freeSolo
              filterSelectedOptions
              loading={autocompleteEmailsLoading}
              options={autocompleteEmails}
              value={activeSurvey.email.autoSendTo ?? []}
              onChange={(_, value: string[]) => {
                editSurvey({
                  ...activeSurvey,
                  email: {
                    ...activeSurvey.email,
                    autoSendTo: value,
                  },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  label={tr.EditSurveyEmail.autoSendTo}
                  helperText={tr.EditSurveyEmail.autoSendToHelperText}
                />
              )}
            />
            <TextField
              label={tr.EditSurveyEmail.emailSubject}
              value={activeSurvey.email.subject?.[surveyLanguage] ?? ''}
              onChange={(event) => {
                editSurvey({
                  ...activeSurvey,
                  email: {
                    ...activeSurvey.email,
                    subject: {
                      ...activeSurvey.email.subject,
                      [surveyLanguage]: event.target.value,
                    },
                  },
                });
              }}
            />
            <RichTextEditor
              label={tr.EditSurveyEmail.emailBody}
              value={activeSurvey.email.body?.[surveyLanguage] ?? ''}
              onChange={(value) => {
                editSurvey({
                  ...activeSurvey,
                  email: {
                    ...activeSurvey.email,
                    body: {
                      ...activeSurvey.email.body,
                      [surveyLanguage]: value,
                    },
                  },
                });
              }}
            />
            <div>
              <KeyValueForm
                label={tr.EditSurveyEmail.info}
                value={activeSurvey.email.info ?? []}
                onChange={(value) => {
                  editSurvey({
                    ...activeSurvey,
                    email: {
                      ...activeSurvey.email,
                      info: value,
                    },
                  });
                }}
              />
              <FormHelperText>
                {tr.EditSurveyEmail.infoHelperText}
              </FormHelperText>
            </div>
          </>
        )}
      </Fieldset>
    </>
  );
}
