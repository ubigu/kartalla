import { PdfMimeType } from '@interfaces/admin';
import { ImageType } from '@interfaces/survey';
import { NextFunction, Request, Response } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { Geometry } from 'geojson';
import sharp from 'sharp';
import { BadRequestError } from './error';
import logger from './logger';

/**
 * Middleware function for validating a request against provided validation rules.
 * @param chains Validation chains (express-validator)
 */
export function validateRequest(chains: ValidationChain[]) {
  return [
    ...chains,
    (req: Request, _res: Response, next: NextFunction) => {
      try {
        validationResult(req).throw();
        next();
      } catch (error) {
        throw new BadRequestError(`Validation error`, error);
      }
    },
  ];
}

/**
 * Encodes given text to base64.
 * @param str Text
 * @returns Base64 decoded text
 */
export function base64Encode(str: string) {
  return Buffer.from(str).toString('base64');
}

/**
 * Decodes base64 encoded text into ASCII.
 * @param str Base64 decoded text
 * @returns ASCII text
 */
export function base64Decode(str: string) {
  return Buffer.from(str, 'base64').toString('ascii');
}

function isString(text: unknown): text is string {
  return typeof text === 'string' || text instanceof String;
}

function isImageType(val: string): val is ImageType {
  return val === 'backgroundImage' || val === 'thanksPageImage';
}

export function parseImageType(val: unknown): ImageType | null {
  if (!isString(val) || !isImageType(val)) {
    throw new Error('Invalid value for imagetype');
  }
  return val;
}

function isPdfMimeType(val: string): val is PdfMimeType {
  return val === 'application/pdf';
}

export function parsePdfMimeType(val: unknown): PdfMimeType {
  if (!isString(val) || !isPdfMimeType(val)) {
    throw new Error('Invalid value for mimeType');
  }
  return val;
}

export function checkFileNameValidity(
  filename: string,
  fileType: 'image' | 'pdf',
) {
  switch (fileType) {
    case 'pdf':
      return filename.endsWith('.pdf');
    case 'image':
      return false;
  }
}

export function assertNever(value: never): never {
  throw new Error(
    `Unhandled discriminated union member: ${JSON.stringify(value)}`,
  );
}

/** Creates a compressed JPEG image buffer */
function compressImage(image: Buffer, quality: number) {
  return sharp(image).rotate().toFormat('jpeg', { quality }).toBuffer();
}

/** Compresses an image to JPEG format and returns it as a hexadecimal string with \x prefix. */
export async function getCompressedFileString(image: Buffer, _quality: number) {
  let compressedFileString: string | null = null;
  try {
    compressedFileString = `\\x${(await compressImage(image, 20)).toString(
      'hex',
    )}`;
  } catch (error) {
    logger.info(`Error while compressing image: ${error}`);
  }
  return compressedFileString;
}

/**
 * Function for getting alphabet characters with index
 * @param num
 * @returns
 */
export function indexToAlpha(num = 1) {
  // ASCII value of first character
  const a = 'a'.charCodeAt(0);
  const numberToCharacter = (number: number) => {
    return String.fromCharCode(a + number);
  };
  return numberToCharacter(num);
}

export function geometryToGeoJSONFeatureCollection(
  geometry: Geometry,
  properties: Record<string, string>,
  srid: number,
): GeoJSON.FeatureCollection & { crs: string } {
  return {
    type: 'FeatureCollection',
    crs: `EPSG:${srid}`,
    features: [{ type: 'Feature', geometry: geometry, properties }],
  };
}

export function formatPhoneNumber(phoneNumber: string) {
  // Remove all non-numeric characters (except '+')
  const cleanNumber = phoneNumber.replace(/[^+\d]/g, '');

  let prefix = '';
  let rest = cleanNumber;

  // If the number starts with '+' (international number)
  if (cleanNumber.startsWith('+')) {
    prefix = cleanNumber.slice(0, 4); // Country code +358
    rest = cleanNumber.slice(4); // Remaining numbers
  }

  let formatted;
  // Segment the main part based on the length of the number
  if (rest.length <= 9) {
    formatted = `${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
  } else if (rest.length <= 10) {
    formatted = `${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
  } else {
    formatted = `${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
  }

  // Return the combined number
  return `${prefix} ${formatted}`.trim();
}

/** Replace the language parameter in the map URL (like fi or fi_FI) with specific language codes. */
export function getLocalizedMapUrls(mapUrl: string) {
  return {
    fi: mapUrl?.replace(/(&)?lang=\w\w(_\w\w)?/, '').concat('&lang=fi') ?? '',
    se: mapUrl?.replace(/(&)?lang=\w\w(_\w\w)?/, '').concat('&lang=sv') ?? '',
    en: mapUrl?.replace(/(&)?lang=\w\w(_\w\w)?/, '').concat('&lang=en') ?? '',
  };
}
