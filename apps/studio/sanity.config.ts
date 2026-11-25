/**
 * Sanity Studio configuration — Milestones Coffee 2.0
 *
 * Project ID and dataset are configured via environment variables.
 * See apps/studio/.env.example for required variables.
 */
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';

// Object types
import { bilingualText, seoMetadata, openingHours, imageOptimisation } from './src/schemas/objects';

// Document types
import {
  branch,
  menuCategory,
  menuProduct,
  offer,
  adminActivity,
  corporatePage,
} from './src/schemas/documents';

const projectId = process.env['SANITY_STUDIO_PROJECT_ID'] || 'txh3gqgo'; // public project ID
const dataset = process.env['SANITY_STUDIO_DATASET'] ?? 'production';

if (!projectId) {
  console.warn(
    '[Milestones Studio] SANITY_STUDIO_PROJECT_ID not set — configure in .env.local',
  );
}

export default defineConfig({
  name: 'milestones-coffee',
  title: 'Milestones Coffee CMS',
  projectId,
  dataset,

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // Singleton — one document per type
            S.listItem()
              .title('Corporate Page')
              .id('corporatePage')
              .child(
                S.document()
                  .schemaType('corporatePage')
                  .documentId('corporatePage-singleton'),
              ),

            S.divider(),

            // Collections
            S.documentTypeListItem('branch').title('Branches'),
            S.documentTypeListItem('menuCategory').title('Menu Categories'),
            S.documentTypeListItem('menuProduct').title('Menu Products'),
            S.documentTypeListItem('offer').title('Offers & Promotions'),
          ]),
    }),

    // Vision tool for GROQ query testing — disabled in production builds
    ...(process.env['SANITY_STUDIO_ENABLE_VISION'] === 'true' ? [visionTool()] : []),
  ],

  schema: {
    types: [
      // Objects
      bilingualText,
      seoMetadata,
      openingHours,
      imageOptimisation,

      // Documents
      branch,
      menuCategory,
      menuProduct,
      offer,
      adminActivity,
      corporatePage,
    ],
  },
});
