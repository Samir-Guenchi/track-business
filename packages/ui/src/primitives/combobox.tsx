'use client';

import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command } from 'cmdk';
import { useState } from 'react';
import { cn } from '../cn.js';
import { Button } from './button.js';

export interface ComboboxOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean | undefined;
}

export interface ComboboxProps {
  readonly options: readonly ComboboxOption[];
  readonly value?: string | undefined;
  readonly placeholder: string;
  readonly searchLabel: string;
  readonly emptyLabel: string;
  readonly label?: string;
  readonly className?: string;
  readonly invalid?: boolean;
  readonly onValueChange: (value: string) => void;
  readonly disabled?: boolean | undefined;
}

interface ChoiceListProps {
  readonly options: readonly ComboboxOption[];
  readonly value?: string | undefined;
  readonly emptyLabel: string;
  readonly onChoose: (value: string) => void;
}

function ChoiceList({ options, value, emptyLabel, onChoose }: ChoiceListProps) {
  return (
    <Command.List>
      <Command.Empty className="tk-combobox__empty">{emptyLabel}</Command.Empty>
      {options.map((option) => (
        <Command.Item
          key={option.value}
          value={`${option.value} ${option.label}`}
          disabled={option.disabled ?? false}
          onSelect={() => onChoose(option.value)}
        >
          <span>{option.label}</span>
          {value === option.value && <Check size={14} aria-hidden="true" />}
        </Command.Item>
      ))}
    </Command.List>
  );
}

function ComboboxMenu({
  options,
  value,
  searchLabel,
  emptyLabel,
  onChoose,
}: ChoiceListProps & { readonly searchLabel: string }) {
  return (
    <Popover.Portal>
      <Popover.Content className="tk-combobox__content" align="start" sideOffset={4}>
        <Command loop>
          <Command.Input
            aria-label={searchLabel}
            className="tk-combobox__input"
            placeholder={searchLabel}
          />
          <ChoiceList options={options} value={value} emptyLabel={emptyLabel} onChoose={onChoose} />
        </Command>
      </Popover.Content>
    </Popover.Portal>
  );
}

interface ComboboxButtonProps {
  readonly label?: string | undefined;
  readonly placeholder: string;
  readonly className?: string | undefined;
  readonly invalid?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly open: boolean;
  readonly valueLabel?: string | undefined;
}

function ComboboxButton({
  label,
  placeholder,
  className,
  invalid,
  disabled,
  open,
  valueLabel,
}: ComboboxButtonProps) {
  return (
    <Popover.Trigger asChild>
      <Button
        className={cn('tk-combobox__trigger', className)}
        variant="secondary"
        aria-label={label ?? placeholder}
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        disabled={disabled}
      >
        <span>{valueLabel ?? placeholder}</span>
        <ChevronsUpDown size={16} aria-hidden="true" />
      </Button>
    </Popover.Trigger>
  );
}

export function Combobox({
  options,
  value,
  placeholder,
  searchLabel,
  emptyLabel,
  label,
  className,
  invalid,
  onValueChange,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const choose = (nextValue: string) => {
    onValueChange(nextValue === value ? '' : nextValue);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <ComboboxButton
        label={label}
        placeholder={placeholder}
        className={className}
        invalid={invalid}
        disabled={disabled}
        open={open}
        valueLabel={selected?.label}
      />
      <ComboboxMenu
        options={options}
        value={value}
        searchLabel={searchLabel}
        emptyLabel={emptyLabel}
        onChoose={choose}
      />
    </Popover.Root>
  );
}
