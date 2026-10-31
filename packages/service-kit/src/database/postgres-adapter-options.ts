/**
 * Prisma's driver adapter ignores `?schema=` in the URL (the CLI honours it), so services pass it
 * explicitly. Lets tests and small deployments give each service its own Postgres schema.
 */
export function postgresAdapterOptions(databaseUrl: string): { schema?: string } {
  const schema = new URL(databaseUrl).searchParams.get('schema');
  return schema ? { schema } : {};
}
