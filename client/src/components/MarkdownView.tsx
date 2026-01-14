import { ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeFormat from 'rehype-format';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';

interface Props extends ComponentPropsWithoutRef<typeof ReactMarkdown> {
  sanitizeCustomSchema?: object;
}

export function MarkdownView(props: Props) {
  const {
    sanitizeCustomSchema,
    remarkPlugins,
    rehypePlugins,
    children,
    ...rest
  } = props;
  const defaultCustomSchema = {
    ...defaultSchema,
    tagNames: [
      ...defaultSchema.tagNames,
      'strong',
      'em',
      'span',
      'br',
      'a',
      'li',
      'ol',
      'ul',
    ],
    attributes: {
      ...defaultSchema.attributes,
      span: ['style'],
      a: ['href', 'rel', 'target'],
    },
  };
  return (
    <ReactMarkdown
      {...rest}
      remarkPlugins={remarkPlugins ?? [remarkBreaks]}
      rehypePlugins={
        rehypePlugins ?? [
          [rehypeExternalLinks],
          [rehypeRaw],
          [rehypeSanitize, sanitizeCustomSchema ?? defaultCustomSchema],
          [rehypeFormat],
        ]
      }
    >
      {children}
    </ReactMarkdown>
  );
}
