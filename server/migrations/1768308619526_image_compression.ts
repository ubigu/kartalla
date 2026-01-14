import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
import sharp from 'sharp';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  console.log('Starting image compression migration...');

  try {
    // First, add the column
    console.log('Adding compressed_file column...');
    await pgm.db.query(
      `ALTER TABLE data.files ADD COLUMN compressed_file bytea;`,
    );
    // Get total count for progress tracking
    const { rows: countRows } = await pgm.db.query(`
      SELECT COUNT(*) as total
      FROM data.files
      WHERE mime_type LIKE 'image/%';
    `);

    const totalImages = Number(countRows[0].total);
    console.log(`Found ${totalImages} images to compress`);

    if (totalImages === 0) {
      console.log('No images to process, completing migration');
      await pgm.db.query('COMMIT');
      return;
    }

    const BATCH_SIZE = 10; // Process 10 images at a time
    let processed = 0;

    // Process images in batches
    for (let offset = 0; offset < totalImages; offset += BATCH_SIZE) {
      const { rows } = await pgm.db.query(
        `
        SELECT id, mime_type, file
        FROM data.files
        WHERE mime_type LIKE 'image/%'
        ORDER BY id
        LIMIT $1 OFFSET $2;
      `,
        [BATCH_SIZE, offset],
      );

      console.log(
        `Processing batch ${Math.floor(offset / BATCH_SIZE) + 1}/${Math.ceil(totalImages / BATCH_SIZE)} (${rows.length} images)`,
      );

      for (const row of rows) {
        try {
          const fileBuffer = Buffer.from(row.file, 'base64');

          // Add timeout and memory limits for sharp processing
          const compressedFile = (await Promise.race([
            sharp(fileBuffer)
              .rotate()
              .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
              .toFormat('jpeg', { quality: 20 })
              .toBuffer(),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Sharp processing timeout')),
                30000,
              ),
            ),
          ])) as Buffer;

          await pgm.db.query(
            `UPDATE data.files SET compressed_file = $1 WHERE id = $2;`,
            [compressedFile, row.id],
          );

          processed++;
          if (processed % 5 === 0) {
            console.log(
              `Progress: ${processed}/${totalImages} images compressed (${Math.round((processed / totalImages) * 100)}%)`,
            );
          }
        } catch (imageError) {
          console.warn(
            `Failed to compress image ${row.id}:`,
            imageError instanceof Error
              ? imageError.message
              : String(imageError),
          );
          // Continue with next image rather than failing entire migration
        }

        // Force garbage collection hint after each image
        if (global.gc) {
          global.gc();
        }
      }

      // Small delay between batches to prevent overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `Migration completed: ${processed}/${totalImages} images compressed successfully`,
    );
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
