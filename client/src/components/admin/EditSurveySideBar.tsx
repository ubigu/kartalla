import {
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Theme,
} from '@mui/material';

import AddIcon from '@src/components/icons/AddIcon';
import BranchIcon from '@src/components/icons/BranchIcon';
import ChevronLeftIcon from '@src/components/icons/ChevronLeftIcon';
import ClipboardIcon from '@src/components/icons/ClipboardIcon';
import DocumentCopyIcon from '@src/components/icons/DocumentCopyIcon';
import DraggableIcon from '@src/components/icons/DraggableIcon';
import FavoriteIcon from '@src/components/icons/FavoriteIcon';
import InfoIcon from '@src/components/icons/InfoIcon';
import LanguageIcon from '@src/components/icons/LanguageIcon';
import MailIcon from '@src/components/icons/MailIcon';
import SurveyPageIcon from '@src/components/icons/SurveyPageIcon';
import VisibleIcon from '@src/components/icons/VisibleIcon';

import { makeStyles } from '@mui/styles';
import { useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { useHistory, useRouteMatch } from 'react-router-dom';
import ListItemLink from '../ListItemLink';
import SideBar from '../SideBar';

import { Conditions, SurveyPage } from '@interfaces/survey';
import { duplicateFiles } from '@src/controllers/AdminFileController';
import { useClipboard } from '@src/stores/ClipboardContext';
import {
  replaceIdsWithNull,
  replaceTranslationsWithNull,
} from '@src/utils/schemaValidation';

const useStyles = makeStyles((theme: Theme) => ({
  '@keyframes pulse': {
    '0%': {
      opacity: 0.4,
    },
    '50%': {
      opacity: 0.7,
    },
    '100%': {
      opacity: 0.4,
    },
  },
  loading: {
    animation: `$pulse 1s ${theme.transitions.easing.easeIn} infinite`,
  },
  disabled: {
    pointerEvents: 'none',
    opacity: 0.4,
  },
  listItemButton: {
    '&:hover': {
      backgroundColor: '#747474',
    },
  },
}));

interface Props {
  width: number;
  mobileOpen: boolean;
  onDrawerToggle: () => void;
  allowEditing: boolean;
}

export default function EditSurveySideBar(props: Props) {
  const [newPageDisabled, setNewPageDisabled] = useState(false);

  const classes = useStyles();
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
  const { tr, surveyLanguage, language } = useTranslations();
  const { showToast } = useToasts();
  const { clipboardSection, setClipboardPage, clipboardPage } = useClipboard();

  return (
    <SideBar
      width={props.width}
      mobileOpen={props.mobileOpen}
      onDrawerToggle={props.onDrawerToggle}
    >
      <List>
        <ListItemLink to={`/admin?lang=${language}`}>
          <ListItemIcon>
            <ChevronLeftIcon />
          </ListItemIcon>
          <ListItemText primary={tr.EditSurvey.toFrontPage} />
        </ListItemLink>
        <ListItemLink to={`${url}/perustiedot?lang=${language}`}>
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText primary={tr.EditSurvey.info} />
        </ListItemLink>
        <ListItemLink to={`${url}/käännökset?lang=${language}`}>
          <ListItemIcon>
            <LanguageIcon />
          </ListItemIcon>
          <ListItemText primary={tr.EditSurvey.translations}></ListItemText>
        </ListItemLink>
        <ListItemLink to={`${url}/sähköpostit?lang=${language}`}>
          <ListItemIcon>
            <MailIcon />
          </ListItemIcon>
          <ListItemText primary={tr.EditSurvey.email} />
        </ListItemLink>
      </List>
      <Divider />
      <List>
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
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {activeSurvey.pages.map((page, index) => (
                  <Draggable
                    key={page.id}
                    draggableId={String(page.id)}
                    index={index}
                  >
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps}>
                        <ListItemLink
                          to={`${url}/sivut/${page.id}?lang=${language}`}
                        >
                          <ListItemIcon>
                            {Object.keys(page?.conditions)?.length > 0 && (
                              <BranchIcon />
                            )}
                            <SurveyPageIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              page.title?.[surveyLanguage] || (
                                <em>{tr.EditSurvey.untitledPage}</em>
                              )
                            }
                          />
                          <IconButton
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

                          <div {...provided.dragHandleProps}>
                            <IconButton>
                              <DraggableIcon />
                            </IconButton>
                          </div>
                        </ListItemLink>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        {props.allowEditing && (
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <ListItem
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-around',
              }}
              className={`${
                newPageDisabled || activeSurveyLoading ? classes.disabled : ''
              } ${newPageLoading ? classes.loading : ''}`}
              onClick={async () => {
                setNewPageDisabled(true);
                try {
                  const page = await createPage();
                  history.push(`${url}/sivut/${page.id}?lang=${language}`);
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
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary={tr.EditSurvey.newPage} />
            </ListItem>
            <span
              style={{
                height: '2rem',
                borderRight: '1px solid white',
                alignSelf: 'center',
              }}
            />
            <ListItemButton
              className={classes.listItemButton}
              disabled={!clipboardPage}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-around',
                width: '100%',
              }}
              onClick={async () => {
                setNewPageDisabled(true);
                try {
                  // Create new blank page and set its contents from Clipboard -context
                  const blankPage = await createPage();
                  history.push(`${url}/sivut/${blankPage.id}?lang=${language}`);
                  setNewPageDisabled(false);

                  // Duplicate any and all files in image and attachment
                  // sections before creating new page
                  const duplicatedFiles: SurveyPage = await duplicateFiles(
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
              <ClipboardIcon />
              {tr.EditSurvey.attachNewPage}
            </ListItemButton>
          </div>
        )}
      </List>
      <Divider />
      <List>
        <ListItemLink to={`${url}/kiitos-sivu?lang=${language}`}>
          <ListItemIcon>
            <FavoriteIcon />
          </ListItemIcon>
          <ListItemText primary={tr.EditSurvey.thanksPage} />
        </ListItemLink>
        <ListItemLink
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
          <ListItemIcon>
            <VisibleIcon />
          </ListItemIcon>
          <ListItemText primary={tr.EditSurvey.toSurveyPage} />
        </ListItemLink>
      </List>
    </SideBar>
  );
}
