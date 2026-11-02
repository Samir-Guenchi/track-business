'use client';

import { DeliveryTypeSchema, type OrderForm } from '@trackecom/contracts';
import { Button, Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { FormAlert } from '../auth/form-alert';
import { ProductsEditor } from './products-editor';
import { type FormEditorState, useFormEditor } from './use-form-editor';

interface FormEditorProps {
  readonly form: OrderForm | null;
  /** `true` once saved, `false` when cancelled. */
  readonly onClose: (saved: boolean) => void;
}

export function FormEditor({ form, onClose }: FormEditorProps) {
  const t = useTranslations('forms.editor');
  const editor = useFormEditor(form, () => onClose(true));
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    editor.submit();
  };
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-panel border border-border bg-surface p-5 shadow-panel"
    >
      <h2 className="text-lg font-semibold">{form ? t('editTitle') : t('createTitle')}</h2>
      <NameFields editor={editor} />
      <ProductsEditor editor={editor} />
      <DeliveryAndLook editor={editor} />
      <FormAlert message={editor.error} />
      <div className="flex gap-2">
        <Button type="submit" loading={editor.saving}>
          {t('save')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => onClose(false)}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}

function DeliveryAndLook({ editor }: { readonly editor: FormEditorState }) {
  const t = useTranslations('forms.editor');
  const { draft, patch } = editor;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <DeliveryOptions editor={editor} />
      <Input
        label={t('maxQuantity')}
        type="number"
        min={1}
        max={50}
        value={draft.maxQuantity}
        onChange={(e) => patch({ maxQuantity: Number(e.currentTarget.value) || 1 })}
      />
      <label className="tk-field">
        <span className="tk-field__label">{t('accent')}</span>
        <input
          type="color"
          className="h-10 w-20 rounded-control border border-border"
          value={draft.accent}
          onChange={(e) => patch({ accent: e.currentTarget.value })}
        />
      </label>
    </div>
  );
}

function NameFields({ editor }: { readonly editor: FormEditorState }) {
  const t = useTranslations('forms.editor');
  const { draft, patch } = editor;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Input
        label={t('name')}
        hint={t('nameHint')}
        required
        maxLength={80}
        value={draft.name}
        onChange={(e) => patch({ name: e.currentTarget.value })}
      />
      <Input
        label={t('formTitle')}
        required
        maxLength={120}
        value={draft.title}
        onChange={(e) => patch({ title: e.currentTarget.value })}
      />
    </div>
  );
}

function DeliveryOptions({ editor }: { readonly editor: FormEditorState }) {
  const t = useTranslations('forms.editor');
  const { draft, patch } = editor;
  const toggle = (type: (typeof DeliveryTypeSchema.options)[number], on: boolean) =>
    patch({
      deliveryTypes: on
        ? [...draft.deliveryTypes, type]
        : draft.deliveryTypes.filter((d) => d !== type),
    });
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="tk-field__label pb-1">{t('delivery')}</legend>
      {DeliveryTypeSchema.options.map((type) => (
        <label key={type} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.deliveryTypes.includes(type)}
            onChange={(e) => toggle(type, e.currentTarget.checked)}
          />
          {t(`deliveryType.${type}`)}
        </label>
      ))}
    </fieldset>
  );
}
