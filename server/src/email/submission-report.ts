import {
  LanguageCode,
  SubmissionAnswerEntry,
  Survey,
} from '@interfaces/survey';
import logger from '@src/logger';
import useTranslations from '@src/translations/useTranslations';
import MarkdownIt from 'markdown-it';
import { Attachment } from 'nodemailer/lib/mailer';
import { sendMail } from './email';

// Markdown renderer
const md = new MarkdownIt({ breaks: true });

/**
 * Turns a file string stored in base64 into a buffer
 * @param fileString
 * @returns
 */
function fileStringToBuffer(fileString: string) {
  // Remove the data indicator prefix to get the base64 data string
  const [, data] = fileString.split(/data:.*;base64,/);
  return Buffer.from(data, 'base64');
}

/**
 * Turns all 'attachment' type answer entries to Attachment objects to be sent via nodemailer
 * @param answerEntries Answer entries
 * @returns
 */
function getAttachments(answerEntries: SubmissionAnswerEntry[]) {
  return answerEntries
    .filter(
      (entry): entry is SubmissionAnswerEntry & { type: 'attachment' } =>
        entry.type === 'attachment',
    )
    .reduce((files, entry) => {
      return [
        ...files,
        ...entry.value.map(
          (file) =>
            ({
              filename: file.fileName,
              content: fileStringToBuffer(file.fileString),
            }) as Attachment,
        ),
      ];
    }, [] as Attachment[]);
}

/**
 * Send submission report to given address
 */
export async function sendSubmissionReport({
  to,
  pdfFile,
  language,
  survey,
  submissionId,
  answerEntries,
  includeAttachments,
}: {
  to: string;
  pdfFile: Buffer;
  language: LanguageCode;
  survey: Survey;
  submissionId: number;
  answerEntries: SubmissionAnswerEntry[];
  includeAttachments: boolean;
}) {
  const subject = survey.email.subject?.[language] ?? survey.title[language];
  const body = md.render(survey.email.body?.[language] ?? '');
  const tr = useTranslations(language);
  const noReply = tr.noReply;
  const attachments: Attachment[] = [
    { filename: `${survey.name}-${submissionId}.pdf`, content: pdfFile },
    ...(includeAttachments ? getAttachments(answerEntries) : []),
  ];

  try {
    await sendMail({
      message: {
        to,
        attachments,
      },
      template: 'submission-report',
      locals: {
        body,
        subject,
        noReply,
      },
    });
  } catch (error) {
    // If sending the mail fails, ignore the error
    logger.error(`Error sending submission report mail: ${error}`);
  }
}
