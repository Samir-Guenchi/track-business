import {
  CarrierSuggestionSchema,
  SuggestCarrierQuerySchema,
  SuggestionSettingsSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

const settings = {
  description: 'Settings',
  content: { 'application/json': { schema: SuggestionSettingsSchema } },
};

export const suggestionOpenApiPaths: ZodOpenApiPathsObject = {
  '/carriers/suggestion': {
    get: {
      summary: 'The connected carrier to preselect for one parcel, with a reason code',
      requestParams: { query: SuggestCarrierQuerySchema },
      responses: {
        '200': {
          description: 'Suggestion and every option, best first',
          content: { 'application/json': { schema: CarrierSuggestionSchema } },
        },
      },
    },
  },
  '/carriers/suggestion-settings': {
    get: { summary: 'Store weights and routing rules', responses: { '200': settings } },
    put: {
      summary: 'Change weights and routing rules (store.update)',
      requestBody: { content: { 'application/json': { schema: SuggestionSettingsSchema } } },
      responses: { '200': settings },
    },
  },
};
