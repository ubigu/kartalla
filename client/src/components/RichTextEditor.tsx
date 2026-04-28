// @ts-strict-ignore
import { Box, Typography } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { useTranslations } from '@src/stores/TranslationContext';
import { convertFromHTML } from 'draft-convert';
import { convertToRaw, EditorState } from 'draft-js';
import { draftToMarkdown } from 'markdown-draft-js';
import remarkRehype from 'remark-rehype';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import rehypeFormat from 'rehype-format';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { remark } from 'remark';

type StyleProps = { editorHeight?: string; resizable?: boolean };

const useStyles = makeStyles((theme: Theme) => ({
  disabled: {
    opacity: 0.4,
    pointerEvents: 'none',
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
    opacity: 0.4,
    background: '#ddd',
  },
  wrapper: {
    border: '1px solid transparent',
  },
  missingValue: {
    border: '1px solid red',
  },
  editor: {
    height: (props: StyleProps) => props.editorHeight,
    overflow: (props: StyleProps) => (props.resizable ? 'auto' : undefined),
    resize: (props: StyleProps) => (props.resizable ? 'vertical' : undefined),
    background: theme.palette.surfacePrimary.main,
    padding: '0 1rem',
    border: `1px solid ${theme.palette.borderSubtle.main}`,
    borderTop: 'none',
    borderRadius: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    '& .rdw-link-decorator-icon': {
      top: '-50%',
    },
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    height: 'fit-content',
    padding: 0,
    background: theme.palette.surfacePrimary.main,
    marginBottom: 0,
    borderRadius: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    overflow: 'hidden',
    border: `1px solid ${theme.palette.borderSecondary.main}`,
    '& > *': {
      marginBottom: 0,
    },
    '& .rdw-inline-wrapper': {
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },
    '& .rdw-option-wrapper': {
      boxShadow: 'none',
      margin: 0,
      padding: 4,
      border: 'none',
      borderRadius: 0,
      '&:hover': {
        background: theme.palette.borderSecondary.main,
      },
    },
    '& .rdw-option-active': {
      background: theme.palette.borderSecondary.main,
      boxShadow: 'none',
    },
    '& .rdw-option-disabled': {
      pointerEvents: 'none',
    },
    '& .rdw-fontsize-wrapper': {
      background: theme.palette.surfacePrimary.main,
      margin: 0,
      border: 'none',
      maxHeight: '26x',

      '&:hover': {
        background: theme.palette.borderSubtle.main,
      },
      '& .rdw-dropdown-wrapper': {
        maxHeight: '24px',
        border: 'none',
        margin: 0,
        '&:hover': {
          boxShadow: 'none',
          background: theme.palette.borderSubtle.main,
        },
      },

      '& .rdw-dropdown-selectedtext': {
        width: '35px',
      },
    },
  },
}));

const DEFAULT_FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60];

interface Props {
  value: string;
  disabled?: boolean;
  label?: string;
  onChange: (value: string) => void;
  editorHeight?: string;
  resizable?: boolean;
  missingValue?: boolean;
  toolbarOptions?: Record<string, any>;
}

/**
 * Converts given markdown to a new Draft.js editor state.
 * @param markdown Text as markdown
 * @returns Draft.js editor state
 */
export async function markdownToEditorState(
  markdown?: string,
): Promise<EditorState> {
  // Step 1: Markdown → HTML
  // Replace each newline with <br/> to preserve line breaks
  const markdownWithBreaks = markdown?.replace(/\n/g, '<br/>');

  const vFile = await remark()
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, {
      tagNames: ['strong', 'em', 'span', 'br', 'a'],
      attributes: { span: ['style'], a: ['href', 'rel', 'target'] },
    })
    .use(rehypeFormat)
    .use(rehypeStringify)
    .process(markdownWithBreaks);

  // Step 2: HTML → ContentState using draft-convert with custom inline style parsing
  const contentState = convertFromHTML({
    htmlToStyle: (nodeName, node, currentStyle) => {
      if (nodeName === 'span' && node instanceof HTMLElement) {
        const fontSize = node.style.fontSize?.replace(/[^0-9]/g, '');
        if (fontSize) {
          return currentStyle.add(`fontsize-${fontSize}`);
        }
      }
      return currentStyle;
    },
    htmlToEntity: (nodeName, node, createEntity) => {
      if (nodeName === 'a' && node instanceof HTMLAnchorElement) {
        return createEntity('LINK', 'MUTABLE', {
          url: node.getAttribute('href'),
          ...(node.getAttribute('target') && {
            targetOption: node.getAttribute('target'),
          }),
        });
      }
      return undefined;
    },
  })(vFile.toString());

  return EditorState.createWithContent(contentState);
}

/**
 * Converts given Draft.js editor state to markdown.
 * @param editorState Draft.js editor state
 * @returns Text as markdown
 */
function editorStateToMarkdown(
  editorState: EditorState,
  enabledFontSizes: number[] = DEFAULT_FONT_SIZES,
) {
  const content = editorState.getCurrentContent();
  const rawObject = convertToRaw(content);

  const fontSizeStyles = Object.fromEntries(
    enabledFontSizes.map((size) => [
      `fontsize-${size}`,
      {
        open: () => `<span style="font-size:${size}px">`,
        close: () => '</span>',
      },
    ]),
  );

  return draftToMarkdown(rawObject, {
    styleItems: fontSizeStyles,
    preserveNewlines: true,
    entityItems: {
      LINK: {
        open: (entity: { data: { url: string; targetOption?: string } }) =>
          `<a href="${entity?.data.url}" ${entity?.data.targetOption ? `target="${entity?.data.targetOption}"` : ''} rel="noopener noreferrer">`,
        close: () => '</a>',
      },
    },
  });
}

const RichTextEditor = forwardRef(function RichTextEditor(props: Props, ref) {
  const [editorState, setEditorState] = useState(null);

  useImperativeHandle(
    ref,
    () => ({
      setEditorValue: async (value: string) => {
        const newEditorState = await markdownToEditorState(value);
        setEditorState(newEditorState);
      },
    }),
    [],
  );

  const { language, surveyLanguage } = useTranslations();

  useEffect(() => {
    async function updateEditorState() {
      const newEditorState = await markdownToEditorState(props.value);
      setEditorState(newEditorState);
    }
    updateEditorState();
    return () => {
      updateEditorState();
    };
  }, [language, surveyLanguage]);

  const classes = useStyles({
    editorHeight: props.editorHeight,
    resizable: props.resizable,
  });
  const { tr } = useTranslations();

  function handleEditorStateChange(editorState: EditorState) {
    if (props.disabled) {
      return;
    }
    setEditorState(editorState);
    props.onChange(
      editorStateToMarkdown(
        editorState,
        props.toolbarOptions?.fontSize?.options,
      ),
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
      }}
    >
      {props.label && (
        <Typography sx={{ color: 'textInteractive.main', fontSize: '12px' }}>
          {props.label}
        </Typography>
      )}
      <Editor
        {...(props.label && { ariaLabel: props.label })}
        readOnly={props.disabled}
        toolbar={
          props.toolbarOptions ?? {
            options: ['inline', 'list', 'link'],
            inline: {
              options: ['bold', 'italic'],
            },
            list: {
              options: ['unordered', 'ordered'],
            },
            link: {
              defaultTargetOption: '_blank',
            },
          }
        }
        wrapperClassName={`${props.missingValue ? classes.missingValue : ''} ${
          props.disabled ? ` ${classes.disabled}` : ''
        } ${classes.wrapper}`}
        editorClassName={classes.editor}
        toolbarClassName={classes.toolbar}
        localization={{ translations: tr.RichTextEditor }}
        editorState={editorState}
        onEditorStateChange={handleEditorStateChange}
        customStyleMap={{
          'fontsize-24': {
            fontSize: '24px',
          },
          'fontsize-20': {
            fontSize: '20px',
          },
        }}
      />
      {props.disabled && <div className={classes.disabledOverlay} />}
    </Box>
  );
});

export default RichTextEditor;
