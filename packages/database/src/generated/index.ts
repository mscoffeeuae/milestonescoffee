/**
 * Prisma generated client stub.
 *
 * In production and CI environments with unrestricted network access,
 * this file is REPLACED by `prisma generate` output which contains the full
 * typed client for the schema in ../prisma/schema.prisma.
 *
 * This stub allows TypeScript to compile in restricted network environments
 * (e.g. Claude Code sandbox where binaries.prisma.sh is blocked, preventing
 * prisma generate from downloading query engine binaries).
 *
 * Full schema implemented in Prompt 5. Run `pnpm db:generate` after `docker compose up -d`.
 * The real generated output will replace this file entirely.
 */

// Stub types that allow downstream imports to compile without the generated client.
// These will be replaced with the full Prisma-generated types at first `prisma generate`.

/** @stub — replaced by prisma generate */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class PrismaClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(_options?: any) {}
  $connect(): Promise<void> { return Promise.resolve(); }
  $disconnect(): Promise<void> { return Promise.resolve(); }
}

/** @stub — replaced by prisma generate */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Prisma {
  export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
  export type JsonObject = { [key: string]: JsonValue };
  export type JsonArray = JsonValue[];
}
