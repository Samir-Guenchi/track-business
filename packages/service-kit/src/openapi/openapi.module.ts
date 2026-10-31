import { Controller, type DynamicModule, Get, Inject, Module } from '@nestjs/common';
import { Public } from '../authorization/access-policy.js';
import { type ZodOpenApiPathsObject, createDocument } from 'zod-openapi';

const OPENAPI_DOCUMENT = Symbol('OPENAPI_DOCUMENT');

export interface OpenApiOptions {
  readonly title: string;
  readonly version: string;
  /** Built from the zod contracts, so the document can never drift from validation. */
  readonly paths: ZodOpenApiPathsObject;
}

/** Builds the OpenAPI 3.1 document of a service from its zod contracts. */
export function buildOpenApiDocument(options: OpenApiOptions): ReturnType<typeof createDocument> {
  return createDocument({
    openapi: '3.1.0',
    info: { title: options.title, version: options.version },
    paths: options.paths,
  });
}

@Public()
@Controller('docs')
class OpenApiController {
  constructor(@Inject(OPENAPI_DOCUMENT) private readonly document: unknown) {}

  @Get('openapi.json')
  json(): unknown {
    return this.document;
  }
}

/** Serves `GET /docs/openapi.json`. The gateway aggregates the services' documents for clients. */
@Module({})
export class OpenApiModule {
  static forRoot(options: OpenApiOptions): DynamicModule {
    return {
      module: OpenApiModule,
      controllers: [OpenApiController],
      providers: [{ provide: OPENAPI_DOCUMENT, useValue: buildOpenApiDocument(options) }],
    };
  }
}
