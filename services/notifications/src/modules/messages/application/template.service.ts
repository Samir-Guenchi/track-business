import { Inject, Injectable } from '@nestjs/common';
import {
  CHANNELS,
  type MessageLanguage,
  NOTIFICATION_TRIGGERS,
  type NotificationTemplate,
} from '@trackecom/contracts';
import { DEFAULT_TEMPLATES } from '../domain/default-templates.js';
import { TemplateNotCustomError } from '../domain/notification.errors.js';
import {
  STORES,
  type StoredTemplate,
  type TemplateKey,
  type TemplateStore,
} from './ports/stores.js';

const LANGUAGES: readonly MessageLanguage[] = ['ar', 'fr', 'darija'];

const sameKey = (a: TemplateKey, b: TemplateKey) =>
  a.trigger === b.trigger && a.channel === b.channel && a.language === b.language;

/** Every trigger, channel and language: the store's own text, else the built-in one. */
@Injectable()
export class TemplateService {
  constructor(@Inject(STORES.templates) private readonly templates: TemplateStore) {}

  async list(storeId: string): Promise<NotificationTemplate[]> {
    const custom = await this.templates.custom(storeId);
    return NOTIFICATION_TRIGGERS.flatMap((trigger) =>
      CHANNELS.flatMap((channel) =>
        LANGUAGES.map((language) => {
          const key = { trigger, channel, language };
          const own = custom.find((template) => sameKey(template, key));
          const body = own?.body ?? DEFAULT_TEMPLATES[trigger][language];
          return { ...key, body, custom: own !== undefined };
        }),
      ),
    );
  }

  /** The text a message is rendered from. */
  async bodyFor(storeId: string, key: TemplateKey): Promise<string> {
    return (
      (await this.templates.find(storeId, key)) ?? DEFAULT_TEMPLATES[key.trigger][key.language]
    );
  }

  async save(storeId: string, template: StoredTemplate): Promise<NotificationTemplate> {
    await this.templates.save(storeId, template);
    return { ...template, custom: true };
  }

  /** Back to the built-in text. */
  async reset(storeId: string, key: TemplateKey): Promise<void> {
    if (!(await this.templates.remove(storeId, key))) {
      throw new TemplateNotCustomError();
    }
  }
}
