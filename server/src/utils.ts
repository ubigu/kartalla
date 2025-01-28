import { MimeType } from '@interfaces/admin';
import { ImageType } from '@interfaces/survey';
import { NextFunction, Request, Response } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { Geometry } from 'geojson';
import { BadRequestError } from './error';

/**
 * Middleware function for validating a request against provided validation rules.
 * @param chains Validation chains (express-validator)
 */
export function validateRequest(chains: ValidationChain[]) {
  return [
    ...chains,
    (req: Request, res: Response, next: NextFunction) => {
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

function isMimeType(val: string): val is MimeType {
  return val === 'application/pdf';
}

export function parseMimeType(val: unknown): MimeType {
  if (!isString(val) || !isMimeType(val)) {
    throw new Error('Invalid value for mimeType');
  }
  return val;
}

export function assertNever(value: never): never {
  throw new Error(
    `Unhandled discriminated union member: ${JSON.stringify(value)}`,
  );
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
