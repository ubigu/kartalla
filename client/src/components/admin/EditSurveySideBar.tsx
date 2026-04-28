// @ts-strict-ignore
import { keyframes } from '@emotion/react';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Theme,
  Typography,
  useTheme,
} from '@mui/material';

import ClipboardIcon from '@src/components/icons/ClipboardIcon';
import DocumentCopyIcon from '@src/components/icons/DocumentCopyIcon';
import DragHandleIcon from '@src/components/icons/DragHandleIcon';
import MailIcon from '@src/components/icons/MailIcon';
import SettingsIcon from '@src/components/icons/SettingsIcon';
import SurveyPageIcon from '@src/components/icons/SurveyPageIcon';
import ThanksPageIcon from '@src/components/icons/ThanksPageIcon';

import { Combobox_WIP } from '@src/components/core/Combobox';
import { useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { useHistory, useRouteMatch } from 'react-router-dom';
import SideBarItem, { SIDEBAR_PAGE_ICON_CLASS } from '../SideBarItem';

import { Conditions, LanguageCode, SurveyPage } from '@interfaces/survey';
import { duplicateFiles } from '@src/controllers/AdminFileController';
import { useClipboard } from '@src/stores/ClipboardContext';
import {
  replaceIdsWithNull,
  replaceTranslationsWithNull,
} from '@src/utils/schemaValidation';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import ConditionalPageIcon from '../icons/ConditionalPageIcon';
import MapGridIcon from '../icons/MapGridIcon';
import PadlockIcon from '../icons/PadlockIcon';
import PaintPaletteIcon from '../icons/PaintPaletteIcon';
import ShareExternalLinkIcon from '../icons/ShareExternalLinkIcon';
import TranslateTextIcon from '../icons/TranslateTextIcon';
import { collectPageFields } from './EditSurveyTranslationsV2';

const pulse = keyframes`
  0% { opacity: 0.4; }
  50% { opacity: 0.7; }
  100% { opacity: 0.4; }
`;

const styles = {
  navBox: (theme: Theme) => ({
    overflowY: 'auto',
    borderRight: `solid 1px ${theme.palette.borderSecondary.main}`,
    backgroundColor: theme.palette.surfaceSubtle.main,
    width: '270px',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  }),
  loading: (theme: Theme) => ({
    animation: `${pulse} 1s ${theme.transitions.easing.easeIn} infinite`,
  }),
  languagesBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '4px',
    flex: 0,
    height: 'fit-content',
  },
  langBadge: (status: 'default' | 'warning' | 'error') => (theme: Theme) => {
    const colorByStatus = {
      default: theme.palette.borderSecondary.main,
      warning: theme.palette.textWarning.main,
      error: theme.palette.textError.main,
    };
    const color = colorByStatus[status];
    return {
      width: 22,
      height: 22,
      borderRadius: '50%',
      border: `1px solid ${color}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: status !== 'default' ? 600 : 400,
      color,
      flexShrink: 0,
    };
  },
  sectionHeader: {
    marginTop: '16px',
    paddingX: '16px',
    paddingBottom: '6px',
    borderBottom: 'solid 2px #C4CEDA',
  },
  list: { padding: 0, alignSelf: 'stretch' },
  footer: (theme: Theme) => ({
    position: 'sticky',
    bottom: 0,
    zIndex: 1,
    background: theme.palette.surfaceSubtle.main,
    marginTop: 'auto',
    padding: '8px',
    fontSize: '12px',
    textAlign: 'center',
    alignSelf: 'stretch',
  }),
};

function getLangBadgeStatus(
  pages: SurveyPage[],
  lang: LanguageCode,
): 'default' | 'warning' | 'error' {
  let anyMissing = false;
  for (const page of pages) {
    const fields = collectPageFields(page, lang);
    const filledCount = fields.filter((f) => f.trim()).length;
    if (filledCount === 0) return 'error';
    if (filledCount < fields.length) anyMissing = true;
  }
  return anyMissing ? 'warning' : 'default';
}

interface Props {
  allowEditing: boolean;
}

export default function EditSurveySideBar(props: Props) {
  const [newPageDisabled, setNewPageDisabled] = useState(false);

  const history = useHistory();
  const { url } = useRouteMatch();
  const {
    activeSurvey,
    originalActiveSurvey,
    createPage,
    editPage,
    newPageLoading,
    activeSurveyLoading,
    movePage,
  } = useSurvey();
  const { tr, surveyLanguage, setSurveyLanguage, language, languages } =
    useTranslations();
  const { showToast } = useToasts();
  const { clipboardSection, setClipboardPage, clipboardPage } = useClipboard();
  const theme = useTheme();

  return (
    <Box
      component={'nav'}
      aria-label={tr.EditSurveyPage.sidebarLabel}
      sx={styles.navBox}
    >
      <SideBarItem
        sxProps={{
          display: 'flex',
          gap: '8px',
          flex: 0,
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
        backgroundColor={theme.palette.surfaceSubtle.main}
        to={`/admin?lang=${language}`}
      >
        <ArrowLeftIcon
          className={SIDEBAR_PAGE_ICON_CLASS}
          fontSize="small"
          htmlColor={theme.palette.primary.main}
        />
        <ListItemText primary={tr.EditSurvey.toFrontPage} />
      </SideBarItem>
      {activeSurvey.localisationEnabled && (
        <Box
          sx={{
            padding: '8px 12px',
            borderBottom: `solid 1px ${theme.palette.borderSecondary.main}`,
          }}
        >
          <Combobox_WIP
            sx={(theme) => ({
              '&&': { background: theme.palette.surfacePrimary.main },
            })}
            id="sidebar-survey-language"
            label={tr.SurveyLanguageMenu.workingLanguage}
            value={surveyLanguage}
            onChange={(value) =>
              setSurveyLanguage(value as typeof surveyLanguage)
            }
            options={languages
              .filter((lang) => activeSurvey.enabledLanguages[lang])
              .map((lang) => ({
                value: lang,
                label: `${tr.LanguageMenu[lang].toLocaleLowerCase()} (${lang})`,
              }))}
          />
        </Box>
      )}
      <Typography
        mt={1}
        sx={styles.sectionHeader}
        component="h2"
        variant="secondaryHeader"
      >
        {tr.EditSurvey.settings}
      </Typography>
      <List sx={styles.list}>
        <ListItem disablePadding>
          <SideBarItem to={`${url}/perusasetukset?lang=${language}`}>
            <SettingsIcon stroke="currentColor" />
            <ListItemText primary={tr.EditSurvey.basicSettings} />
          </SideBarItem>
        </ListItem>
        <ListItem disablePadding>
          <SideBarItem to={`${url}/käyttäjäoikeudet?lang=${language}`}>
            <PadlockIcon />

            <ListItemText primary={tr.EditSurvey.permissions} />
          </SideBarItem>
        </ListItem>
        <ListItem disablePadding>
          <SideBarItem to={`${url}/ulkoasu?lang=${language}`}>
            <PaintPaletteIcon />

            <ListItemText primary={tr.EditSurvey.appearance} />
          </SideBarItem>
        </ListItem>
        <ListItem disablePadding>
          <SideBarItem to={`${url}/kartta-aineistot?lang=${language}`}>
            <MapGridIcon />

            <ListItemText primary={tr.EditSurvey.mapData} />
          </SideBarItem>
        </ListItem>
        <ListItem disablePadding>
          <SideBarItem to={`${url}/sähköpostit?lang=${language}`}>
            <MailIcon />

            <ListItemText primary={tr.EditSurvey.emailReports} />
          </SideBarItem>
        </ListItem>
        <ListItem disablePadding>
          <SideBarItem
            sxProps={{
              '& .MuiListItemText-root > *': {
                color: 'textlink.main',
              },
            }}
            backgroundColor="transparent"
            external
            newTab
            to={`/${originalActiveSurvey.organization.name}/${
              originalActiveSurvey.name
            }${
              originalActiveSurvey?.localisationEnabled
                ? '?lang=' + surveyLanguage
                : ''
            }`}
          >
            <ShareExternalLinkIcon />

            <ListItemText primary={tr.EditSurvey.openSurveyPage} />
          </SideBarItem>
        </ListItem>
      </List>

      <Typography
        sx={styles.sectionHeader}
        component="h2"
        variant="secondaryHeader"
      >
        {tr.EditSurvey.content}
      </Typography>

      <DragDropContext
        onDragEnd={(event) => {
          if (!event.destination) {
            return;
          }
          movePage(Number(event.draggableId), event.destination.index);
        }}
      >
        <Droppable droppableId="pages">
          {(provided) => (
            <List
              sx={styles.list}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {activeSurvey.pages.map((page, index) => (
                <Draggable
                  key={page.id}
                  draggableId={String(page.id)}
                  index={index}
                >
                  {(provided) => (
                    <Box
                      component={'li'}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      sx={{ position: 'relative' }}
                    >
                      <div
                        {...provided.dragHandleProps}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 4px',
                          cursor: 'grab',
                          zIndex: 1,
                        }}
                      >
                        <DragHandleIcon sx={{ fontSize: 14 }} />
                      </div>
                      <SideBarItem
                        to={`${url}/sivut/${page.id}?lang=${language}`}
                        sxProps={{
                          '&:not(:hover) .page-copy-btn': {
                            visibility: 'hidden',
                          },
                        }}
                      >
                        <>
                          {Object.keys(page?.conditions)?.length > 0 && (
                            <ConditionalPageIcon
                              sx={{
                                marginLeft: '-4px',
                                transform: 'translateX(6px)',
                              }}
                              stroke={theme.palette.borderSecondary.main}
                            />
                          )}
                          <SurveyPageIcon
                            className={SIDEBAR_PAGE_ICON_CLASS}
                            stroke={theme.palette.borderSecondary.main}
                            innerTextColor="primary.main"
                            innerText={index + 1}
                          />
                        </>
                        <ListItemText
                          primaryTypographyProps={{ noWrap: true }}
                          primary={
                            page.title?.[surveyLanguage] || (
                              <em>{tr.EditSurvey.untitledPage}</em>
                            )
                          }
                        />
                        <IconButton
                          className="page-copy-btn"
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            event.preventDefault();
                            // Deep copy page to avoid changes to current context
                            const deepCopy = replaceTranslationsWithNull(
                              replaceIdsWithNull({
                                ...structuredClone(page),
                                id: -1,
                                sidebar: {
                                  ...structuredClone(page.sidebar),
                                  mapLayers: [],
                                },
                              }),
                            ) as SurveyPage;
                            // Remove conditions from Follow up question
                            const copiedSurveyPage: SurveyPage = {
                              ...deepCopy,
                              sections: deepCopy.sections.map((section) => {
                                return {
                                  ...section,
                                  followUpSections:
                                    section.followUpSections?.map((fus) => {
                                      return {
                                        ...fus,
                                        conditions: {
                                          equals: [],
                                          lessThan: [],
                                          greaterThan: [],
                                        } as Conditions,
                                      };
                                    }),
                                };
                              }),
                            };
                            // Store section to locale storage for other browser tabs to get access to it
                            localStorage.setItem(
                              'clipboard-content',
                              JSON.stringify({
                                clipboardPage: {
                                  ...copiedSurveyPage,
                                  conditions: {},
                                },
                                clipboardSection,
                              }),
                            );
                            // Store page to context for the currently active browser tab to get access to it
                            setClipboardPage({
                              ...copiedSurveyPage,
                              conditions: {},
                            });
                            showToast({
                              message: tr.EditSurvey.pageCopied,
                              severity: 'success',
                            });
                          }}
                        >
                          <DocumentCopyIcon />
                        </IconButton>
                      </SideBarItem>
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {props.allowEditing && (
                <>
                  <ListItem disablePadding>
                    <SideBarItem
                      disabled={newPageDisabled || activeSurveyLoading}
                      sxProps={
                        newPageLoading ? styles.loading(theme) : undefined
                      }
                      onClick={async () => {
                        setNewPageDisabled(true);
                        try {
                          const page = await createPage();
                          history.push(
                            `${url}/sivut/${page.id}?lang=${language}`,
                          );
                          setNewPageDisabled(false);
                        } catch (error) {
                          showToast({
                            severity: 'error',
                            message: tr.EditSurvey.newPageFailed,
                          });
                          setNewPageDisabled(false);
                          throw error;
                        }
                      }}
                    >
                      <SurveyPageIcon
                        className={SIDEBAR_PAGE_ICON_CLASS}
                        stroke={theme.palette.borderSecondary.main}
                        innerText="+"
                        {...(!(newPageDisabled || activeSurveyLoading) && {
                          innerTextColor: theme.palette.primary.main,
                        })}
                      />
                      <ListItemText
                        sx={{
                          fontStyle: 'italic',
                        }}
                        primary={tr.EditSurvey.newPage}
                      />
                    </SideBarItem>
                  </ListItem>
                  <ListItem disablePadding>
                    <SideBarItem
                      disabled={!clipboardPage}
                      onClick={async () => {
                        setNewPageDisabled(true);
                        try {
                          // Create new blank page and set its contents from Clipboard -context
                          const blankPage = await createPage();
                          history.push(
                            `${url}/sivut/${blankPage.id}?lang=${language}`,
                          );
                          setNewPageDisabled(false);

                          // Duplicate any and all files in image and attachment
                          // sections before creating new page
                          const duplicatedFiles: SurveyPage =
                            await duplicateFiles(
                              structuredClone(clipboardPage),
                              activeSurvey,
                            );

                          editPage({
                            ...duplicatedFiles,
                            id: blankPage.id,
                          });
                          showToast({
                            severity: 'warning',
                            message: tr.EditSurvey.pageAttached,
                            autoHideDuration: 30000,
                          });
                          showToast({
                            severity: 'warning',
                            message: tr.EditSurvey.checkConditionalSections,
                            autoHideDuration: 30000,
                          });
                        } catch (error) {
                          showToast({
                            severity: 'error',
                            message: tr.EditSurvey.newPageFailed,
                          });
                          setNewPageDisabled(false);
                          throw error;
                        }
                      }}
                    >
                      <ClipboardIcon
                        stroke={theme.palette.borderSecondary.main}
                        className={SIDEBAR_PAGE_ICON_CLASS}
                      />
                      <ListItemText
                        sx={{
                          fontStyle: 'italic',
                        }}
                        primary={tr.EditSurvey.attachNewPage}
                      />
                    </SideBarItem>
                  </ListItem>
                </>
              )}
              <ListItem disablePadding>
                <SideBarItem to={`${url}/kiitos-sivu?lang=${language}`}>
                  <ThanksPageIcon
                    className={SIDEBAR_PAGE_ICON_CLASS}
                    stroke={theme.palette.borderSecondary.main}
                  />
                  <ListItemText primary={tr.EditSurvey.thanksPage} />
                </SideBarItem>
              </ListItem>
            </List>
          )}
        </Droppable>
      </DragDropContext>
      {activeSurvey.localisationEnabled && (
        <>
          <Typography
            component={'h2'}
            sx={styles.sectionHeader}
            variant="secondaryHeader"
          >
            {tr.EditSurvey.multilingualism}
          </Typography>
          <SideBarItem
            sxProps={styles.languagesBox}
            to={`${url}/käännökset?lang=${language}`}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TranslateTextIcon />
              <Typography>{tr.EditSurvey.manageTranslations}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: '4px', marginLeft: '16px' }}>
              {languages
                .filter((lang) => activeSurvey.enabledLanguages[lang])
                .map((lang) => (
                  <Box
                    key={lang}
                    sx={styles.langBadge(
                      getLangBadgeStatus(
                        activeSurvey.pages,
                        lang as LanguageCode,
                      ),
                    )}
                  >
                    {lang}
                  </Box>
                ))}
            </Box>
          </SideBarItem>
        </>
      )}
      <Typography sx={styles.footer}>{tr.EditSurvey.developedBy}</Typography>
    </Box>
  );
}
