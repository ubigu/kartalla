import { SvgIcon } from '@interfaces/survey';
import { getDb } from '@src/database';
import { NotFoundError } from '@src/error';

/**
 * Normalizes SVG dimensions to 32x32 viewBox while preserving aspect ratio.
 * Only normalizes if both width and height attributes are present and numeric.
 * This ensures consistent icon sizing in the UI.
 *
 * @param svgContent Original SVG content
 * @returns Normalized SVG content or original if unable to normalize
 */
function normalizeSvgDimensions(svgContent: string): string {
  const TARGET_SIZE = 32;

  // Extract width and height attributes from the <svg> tag
  const widthMatch = svgContent.match(/\swidth=["']([^"']+)["']/);
  const heightMatch = svgContent.match(/\sheight=["']([^"']+)["']/);

  const width = widthMatch ? parseFloat(widthMatch[1]) : null;
  const height = heightMatch ? parseFloat(heightMatch[1]) : null;

  // If width and height are not found, return unchanged
  if (width === null || height === null) {
    return svgContent;
  }

  // Calculate scale factor to fit into 32x32 while preserving aspect ratio
  const scale = Math.min(TARGET_SIZE / width, TARGET_SIZE / height);
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);

  // Replace width and height attributes
  let result = svgContent;
  if (widthMatch) {
    result = result.replace(
      new RegExp(`\\swidth=["']${widthMatch[1]}["']`),
      ` width="${newWidth}"`,
    );
  }
  if (heightMatch) {
    result = result.replace(
      new RegExp(`\\sheight=["']${heightMatch[1]}["']`),
      ` height="${newHeight}"`,
    );
  }

  return result;
}

/**
 * Transform database row to API SvgIcon interface with camelCase field names
 */
export function dbSvgIconToSvgIcon(dbIcon: any): SvgIcon {
  return {
    id: dbIcon.id,
    organizationId: dbIcon.organization_id,
    svgContent: dbIcon.svg_content,
    originalFilename: dbIcon.original_filename,
    createdAt: dbIcon.created_at,
  };
}

/**
 * Upload a new SVG icon for an organization
 */
export async function uploadSvgIcon(
  organizationId: string,
  svgContent: string,
  originalFilename?: string,
): Promise<SvgIcon> {
  const normalizedSvgContent = normalizeSvgDimensions(svgContent);

  const row = await getDb().one(
    `
    INSERT INTO application.svg_icon (organization_id, svg_content, original_filename)
    VALUES ($1, $2, $3)
    RETURNING id, organization_id, svg_content, original_filename, created_at
    `,
    [organizationId, normalizedSvgContent, originalFilename || null],
  );

  return dbSvgIconToSvgIcon(row);
}

/**
 * Get all SVG icons for an organization
 */
export async function getSvgIcons(organizationId: string): Promise<SvgIcon[]> {
  const rows = await getDb().manyOrNone(
    `
    SELECT id, organization_id, svg_content, original_filename, created_at
    FROM application.svg_icon
    WHERE organization_id = $1
    ORDER BY created_at DESC
    `,
    [organizationId],
  );

  return (rows || []).map(dbSvgIconToSvgIcon);
}

/**
 * Delete an SVG icon by ID (with organization validation)
 */
export async function deleteSvgIcon(
  iconId: number,
  organizationId: string,
): Promise<void> {
  const result = await getDb().result(
    `
    DELETE FROM application.svg_icon
    WHERE id = $1 AND organization_id = $2
    `,
    [iconId, organizationId],
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('SVG icon not found');
  }
}
