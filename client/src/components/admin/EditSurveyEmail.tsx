import { Box, FormHelperText, Typography } from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';
import { useEffect, useState } from 'react';
import { CoreCheckbox } from '../core/Checkbox';
import { CoreInput } from '../core/Input';
import { InputHelperText } from '../core/InputHelperText';
import { loadingPulse } from '../core/styles';
import RichTextEditor from '../RichTextEditor';
import { EmailPicker } from './EmailPicker';
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '36px',
          maxWidth: 'min(55em, 70%)',
          ...(activeSurveyLoading && loadingPulse),
        }}
      >
        <Typography variant="mainHeader" component={'h1'}>
          {tr.EditSurvey.emailReports}
        </Typography>
        <div>
          <CoreCheckbox
            aria-describedby={'enable-email-helper'}
            label={tr.EditSurveyEmail.enable}
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
          <InputHelperText
            id={'enable-email-helper'}
            sx={{ paddingTop: '4px' }}
          >
            {tr.EditSurveyEmail.enableHelperText}
          </InputHelperText>
        </div>
        {activeSurvey.email.enabled && (
          <>
            <Box display={'flex'} flexDirection="column" gap={'1rem'}>
              <CoreCheckbox
                label={tr.EditSurveyEmail.includeMarginImages}
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
              <div>
                <CoreCheckbox
                  aria-describedby={'include-personal-info-helper'}
                  label={tr.EditSurveyEmail.includePersonalInfo}
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
                <InputHelperText
                  id={'include-personal-info-helper'}
                  sx={{ paddingTop: '4px' }}
                >
                  {tr.EditSurveyEmail.includePersonalInfoHelperText}
                </InputHelperText>
              </div>
              <div>
                <CoreCheckbox
                  aria-describedby={'email-required-helper'}
                  label={tr.EditSurveyEmail.required}
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
                <InputHelperText
                  id={'email-required-helper'}
                  sx={{ paddingTop: '4px' }}
                >
                  {tr.EditSurveyEmail.requiredHelperText}
                </InputHelperText>
              </div>
            </Box>
            <div>
              <EmailPicker
                label={tr.EditSurveyEmail.autoSendTo}
                value={activeSurvey.email.autoSendTo ?? []}
                options={autocompleteEmails}
                onChange={(emails) => {
                  setAutocompleteEmails(emails);
                  editSurvey({
                    ...activeSurvey,
                    email: {
                      ...activeSurvey.email,
                      autoSendTo: emails,
                    },
                  });
                }}
                disabled={autocompleteEmailsLoading || activeSurveyLoading}
              />
            </div>
            <CoreInput
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
      </Box>
    </>
  );
}
