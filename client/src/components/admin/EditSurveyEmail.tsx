import { Box, FormHelperText, Typography } from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';
import {
  useWorkingLanguage,
  useWorkingLanguageInlineDescription,
} from '@src/stores/WorkingLanguageContext';
import { request } from '@src/utils/request';
import { useEffect, useState } from 'react';
import { Checkbox } from '../core/Checkbox';
import { Input } from '../core/Input';
import { InputHelperText } from '../core/InputHelperText';
import { loadingPulse } from '../core/styles';
import RichTextEditor from '../RichTextEditor';
import { editPageContainerSx } from './EditSurvey';
import { EmailPicker } from './EmailPicker';
import KeyValueForm from './KeyValueForm';

interface Props {
  canEdit: boolean;
}

export default function EditSurveyEmail({ canEdit }: Props) {
  const [autocompleteEmailsLoading, setAutocompleteEmailsLoading] =
    useState(true);
  const [autocompleteEmails, setAutocompleteEmails] = useState<string[]>([]);

  const { activeSurvey, activeSurveyLoading, editSurvey } = useSurvey();
  const { tr } = useTranslations();
  const { workingLanguage } = useWorkingLanguage();
  const workingLanguageInlineDescription =
    useWorkingLanguageInlineDescription();

  const editingDisabled = !canEdit || activeSurveyLoading;

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
    <Box
      sx={{
        ...editPageContainerSx,
        ...(activeSurveyLoading && loadingPulse),
      }}
    >
      <Typography variant="mainHeader" component={'h1'}>
        {tr.EditSurvey.emailReports}
      </Typography>
      <div>
        <Checkbox
          aria-describedby={'enable-email-helper'}
          label={tr.EditSurveyEmail.enable}
          disabled={editingDisabled}
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
        <InputHelperText id={'enable-email-helper'} sx={{ paddingTop: '4px' }}>
          {tr.EditSurveyEmail.enableHelperText}
        </InputHelperText>
      </div>
      {activeSurvey.email.enabled && (
        <>
          <Box display={'flex'} flexDirection="column" gap={'1rem'}>
            <Checkbox
              label={tr.EditSurveyEmail.includeMarginImages}
              disabled={editingDisabled}
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
              <Checkbox
                aria-describedby={'include-personal-info-helper'}
                label={tr.EditSurveyEmail.includePersonalInfo}
                disabled={editingDisabled}
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
              <Checkbox
                aria-describedby={'email-required-helper'}
                label={tr.EditSurveyEmail.required}
                disabled={editingDisabled}
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
              disabled={autocompleteEmailsLoading || editingDisabled}
            />
          </div>
          <Input
            label={tr.EditSurveyEmail.emailSubject}
            disabled={editingDisabled}
            inlineDescription={workingLanguageInlineDescription}
            value={activeSurvey.email.subject?.[workingLanguage] ?? ''}
            onChange={(event) => {
              editSurvey({
                ...activeSurvey,
                email: {
                  ...activeSurvey.email,
                  subject: {
                    ...activeSurvey.email.subject,
                    [workingLanguage]: event.target.value,
                  },
                },
              });
            }}
          />
          <RichTextEditor
            label={tr.EditSurveyEmail.emailBody}
            disabled={editingDisabled}
            value={activeSurvey.email.body?.[workingLanguage] ?? ''}
            onChange={(value) => {
              editSurvey({
                ...activeSurvey,
                email: {
                  ...activeSurvey.email,
                  body: {
                    ...activeSurvey.email.body,
                    [workingLanguage]: value,
                  },
                },
              });
            }}
          />
          <div>
            <KeyValueForm
              label={tr.EditSurveyEmail.info}
              disabled={editingDisabled}
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
            <FormHelperText>{tr.EditSurveyEmail.infoHelperText}</FormHelperText>
          </div>
        </>
      )}
    </Box>
  );
}
