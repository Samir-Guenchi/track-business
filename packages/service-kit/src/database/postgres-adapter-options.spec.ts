import { describe, expect, it } from 'vitest';
import { postgresAdapterOptions } from './postgres-adapter-options.js';

describe('postgresAdapterOptions', () => {
  it('passes the schema from the URL', () => {
    expect(postgresAdapterOptions('postgresql://u:p@h:5432/db?schema=geo_test')).toEqual({
      schema: 'geo_test',
    });
  });

  it('leaves the default schema alone', () => {
    expect(postgresAdapterOptions('postgresql://u:p@h:5432/db')).toEqual({});
  });
});
