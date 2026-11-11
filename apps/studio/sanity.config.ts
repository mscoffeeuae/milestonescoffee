/**
 * Sanity Studio configuration.
 * Full schemas implemented in Prompt 4 (editorial content and public discovery).
 * Project ID and dataset configured via environment variables.
 */
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

const projectId = process.env['SANITY_STUDIO_PROJECT_ID'] ?? '';
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
  plugins: [structureTool()],
  // Full schema registered in Prompt 4
  schema: {
    types: [],
  },
});
