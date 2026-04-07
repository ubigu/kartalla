// @ts-strict-ignore
import { FileAnswer } from '@interfaces/survey';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';

const MEGAS = 10;

function readFileAsync(file: any) {
  return new Promise<string | ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = (error) => {
      reject(error);
    };
  });
}

/** Hook for getting an async fileValidator function which validates File objects based on provided allowedFIlesRegex. */
export function useFileValidator() {
  const { showToast } = useToasts();
  const { tr } = useTranslations();

  /** Validates an array of File objects and checks if their data URL strings match the provided allowedFilesRegex (if provided).
  @param files - An array of File objects.
  * @param allowedFilesRegex - An optional regular expression used to verify if the file's data URL string matches the permitted format.
  *                            If not provided, any file type is allowed.
  * @param callBack - A callback function that is invoked with an array of validated FileAnswer objects (each containing the file's name and data URL string)
  *                   if all the files are successfully validated.
  * */
  return async function fileValidator(
    files: File[],
    callBack: (value: FileAnswer[]) => void,
    allowedFilesRegex?: RegExp,
  ) {
    try {
      const filesSize = files
        .map((file) => file.size)
        .reduce((prevValue, currentValue) => prevValue + currentValue, 0);
      if (filesSize > MEGAS * 1000 * 1000) {
        showToast({
          severity: 'error',
          message: tr.fileValidator.fileSizeLimitError,
        });
        return;
      }
      const fileStrings = (await Promise.all(
        files.map((file: any) => readFileAsync(file)),
      )) as string[];

      const filesAreValid = allowedFilesRegex
        ? !fileStrings
            .map((fileString: string) => allowedFilesRegex.test(fileString))
            .includes(false)
        : true;

      if (filesAreValid) {
        callBack(
          fileStrings.map((fileString, index) => ({
            fileName: files[index].name,
            fileString: fileString,
          })),
        );
      } else {
        showToast({
          severity: 'error',
          message: tr.fileValidator.unsupportedFileFormat,
        });
      }
    } catch (err) {
      showToast({
        severity: 'error',
        message: err?.message ?? tr.fileValidator.fileUploadError,
      });
    }
  };
}
