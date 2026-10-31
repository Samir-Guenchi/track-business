import { useState } from 'react';
import {
  Button,
  Combobox,
  DatePicker,
  Input,
  PhoneInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../index.js';
import type { UiLocale } from '../domain/money-dzd.js';
import type { StoryCopy } from './copy.js';

function BasicControls({ copy }: { readonly copy: StoryCopy }) {
  const [phone, setPhone] = useState('');
  return (
    <>
      <Button>{copy.button}</Button>
      <Button variant="secondary">{copy.secondary}</Button>
      <Button variant="secondary" loading>
        {copy.saving}
      </Button>
      <Input label={copy.order} placeholder={copy.order} error={copy.invalidValue} />
      <DatePicker label={copy.date} />
      <PhoneInput label={copy.phone} value={phone} onValueChange={setPhone} />
    </>
  );
}

function DeliverySelect({ copy }: { readonly copy: StoryCopy }) {
  return (
    <div className="tk-field">
      <span className="tk-field__label">{copy.deliveryType}</span>
      <Select defaultValue="home">
        <SelectTrigger>
          <SelectValue placeholder={copy.deliveryType} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="home">{copy.homeDelivery}</SelectItem>
          <SelectItem value="desk">{copy.stopDesk}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function DeliveryCombobox({ copy }: { readonly copy: StoryCopy }) {
  const [deliveryType, setDeliveryType] = useState('home');
  return (
    <Combobox
      options={[
        { value: 'home', label: copy.homeDelivery },
        { value: 'desk', label: copy.stopDesk },
      ]}
      value={deliveryType}
      placeholder={copy.deliveryType}
      searchLabel={copy.search}
      emptyLabel={copy.noResults}
      label={copy.deliveryType}
      onValueChange={setDeliveryType}
    />
  );
}

export function ControlsSection({
  copy,
  locale,
}: {
  readonly copy: StoryCopy;
  readonly locale: UiLocale;
}) {
  return (
    <section className="tk-showcase__section" lang={locale}>
      <h2>{copy.controls}</h2>
      <div className="tk-showcase__controls">
        <BasicControls copy={copy} />
        <DeliverySelect copy={copy} />
        <DeliveryCombobox copy={copy} />
      </div>
    </section>
  );
}
