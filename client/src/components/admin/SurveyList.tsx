import React, { useEffect } from 'react';
import { Survey } from '@interfaces/survey';
import { useState } from 'react';
import { createNewSurvey, getSurveys } from '@src/controllers/SurveyController';
import { useToasts } from '@src/stores/ToastContext';
import SurveyListItem from './SurveyListItem';
import {
  FormControlLabel,
  List,
  Skeleton,
  Switch,
  Tab,
  Tabs,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useTranslations } from '@src/stores/TranslationContext';
import LoadingButton from '../LoadingButton';
import { useHistory } from 'react-router-dom';
import { TagPicker } from '@src/components/admin/TagPicker';
import { LoadingBackdrop } from './LoadingBackdrop';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '330px',
    maxWidth: '650px',
    width: '45vw',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  item: {
    boxShadow: '0px 2px 4px rgba(63, 111, 127, 0.9)',
  },
});

const tabs = ['active', 'archived'];

export default function SurveyList() {
  const [tabView, setTabView] = useState<(typeof tabs)[number]>('active');
  const [surveysLoading, setSurveysLoading] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [newSurveyLoading, setNewSurveyLoading] = useState(false);
  const [showAuthoredOnly, setShowAuthoredOnly] = useState<boolean>(false);
  const [showPublishedOnly, setShowPublishedOnly] = useState<boolean>(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [copying, setCopying] = useState(false);
  const classes = useStyles();
  const { showToast } = useToasts();
  const { tr } = useTranslations();
  const history = useHistory();

  useEffect(() => {
    let abortController = new AbortController();
    async function updateSurveys() {
      try {
        setSurveys(
          await getSurveys(
            abortController,
            showAuthoredOnly,
            showPublishedOnly,
          ),
        );
        abortController = null;
      } catch (error) {
        showToast({
          severity: 'error',
          message: tr.SurveyList.errorFetchingSurveys,
        });
      }
      setSurveysLoading(false);
    }
    updateSurveys();

    // Abort request if component gets unmounted
    // TODO: still some problems on unmount when creating a new survey....
    return () => {
      abortController?.abort();
    };
  }, [showAuthoredOnly, showPublishedOnly]);

  return (
    <div className={classes.root}>
      <Tabs
        value={tabView}
        indicatorColor="primary"
        textColor="primary"
        sx={{
          mb: '16px',
          minHeight: 'fit-content',
          '& button': { minHeight: 'fit-content' },
        }}
        TabIndicatorProps={{ sx: { height: '2px' } }}
      >
        {tabs.map((tab) => (
          <Tab
            sx={{ textTransform: 'none' }}
            value={tab}
            key={tab}
            onClick={() => setTabView(tab)}
            label={
              tab === 'active'
                ? tr.SurveyList.activeLabel
                : tr.SurveyList.archiveLabel
            }
          />
        ))}
      </Tabs>
      <div className={classes.actions}>
        <FormControlLabel
          value="showAuthored"
          control={
            <Switch
              checked={showAuthoredOnly}
              onChange={(event) => setShowAuthoredOnly(event.target.checked)}
            />
          }
          label={tr.SurveyList.showAuthoredOnly}
        />
      </div>
      {tabView === 'active' && (
        <div className={classes.actions}>
          <FormControlLabel
            value="showPublished"
            control={
              <Switch
                checked={showPublishedOnly}
                onChange={(event) => setShowPublishedOnly(event.target.checked)}
              />
            }
            label={tr.SurveyList.showPublishedOnly}
          />
          <LoadingButton
            variant="contained"
            loading={newSurveyLoading}
            onClick={async () => {
              setNewSurveyLoading(true);
              try {
                const newSurvey = await createNewSurvey();
                setNewSurveyLoading(false);
                history.push(`/kyselyt/${newSurvey.id}`);
              } catch (error) {
                showToast({
                  severity: 'error',
                  message: tr.SurveyList.errorCreatingNewSurvey,
                });
              } finally {
                if (newSurveyLoading) setNewSurveyLoading(false);
              }
            }}
          >
            {tr.SurveyList.createNewSurvey}
          </LoadingButton>
        </div>
      )}

      <div className={classes.actions}>
        <TagPicker
          selectedTags={filterTags}
          addEnabled={false}
          onSelectedTagsChange={(t) => setFilterTags(t)}
        />
      </div>
      {surveysLoading ? (
        <Skeleton variant="rectangular" width="auto" height={210} />
      ) : (
        <>
          <List
            sx={{
              listStyle: 'none',
              padding: '0',
              opacity: 0,
              '@keyframes fadeIn': { '100%': { opacity: 1 } },
              animation: 'fadeIn 1s forwards',
            }}
            data-testid="survey-admin-list"
          >
            {surveys
              .filter((s) => s.isArchived === (tabView === 'archived'))
              .filter((s) =>
                filterTags.length
                  ? filterTags.some((t) =>
                      s.tags.length ? s.tags.includes(t) : false,
                    )
                  : true,
              )
              .map((survey) => (
                <SurveyListItem
                  onArchive={(surveyId) =>
                    setSurveys((prev) =>
                      prev.map((survey) =>
                        survey.id === surveyId
                          ? {
                              ...survey,
                              isArchived: true,
                              isPublished: false,
                              endDate: new Date(),
                            }
                          : survey,
                      ),
                    )
                  }
                  onRestore={(surveyId) =>
                    setSurveys((prev) =>
                      prev.map((survey) =>
                        survey.id === surveyId
                          ? { ...survey, isArchived: false }
                          : survey,
                      ),
                    )
                  }
                  key={survey.id}
                  survey={survey}
                  onCopyStart={() => setCopying(true)}
                  onCopyEnd={() => setCopying(false)}
                />
              ))}
          </List>
          <LoadingBackdrop open={copying} />
        </>
      )}
    </div>
  );
}
