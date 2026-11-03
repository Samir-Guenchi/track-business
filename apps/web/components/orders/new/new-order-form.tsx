'use client';

import { CustomerFields } from './customer-fields';
import { DeliveryFields } from './delivery-fields';
import { FormFooter } from './form-footer';
import { ItemsFields } from './items-fields';
import { NotesField } from './notes-field';
import { PasteMessage } from './paste-message';
import { Totals } from './totals';
import { useOrderForm } from './use-order-form';

/** Manual order entry for phone, Instagram and walk-in orders (#24). */
export function NewOrderForm() {
  const { controls, quote, errors, mutation, saved, save } = useOrderForm();
  return (
    <form
      noValidate
      className="grid gap-4 lg:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        save('open');
      }}
    >
      <div className="flex flex-col gap-4">
        <PasteMessage controls={controls} />
        <CustomerFields controls={controls} errors={errors} />
        <DeliveryFields controls={controls} errors={errors} />
      </div>
      <div className="flex flex-col gap-4">
        <ItemsFields controls={controls} errors={errors}>
          <Totals
            errors={errors}
            controls={controls}
            quotedFee={quote.fee}
            feeUnavailable={quote.unavailable}
          />
        </ItemsFields>
        <NotesField controls={controls} />
        <FormFooter
          invalid={errors.size > 0}
          mutation={mutation}
          saved={saved}
          onSaveAndNew={() => save('next')}
        />
      </div>
    </form>
  );
}
