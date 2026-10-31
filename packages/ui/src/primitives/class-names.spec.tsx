import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Dialog, DialogContent, DialogTitle } from './dialog.js';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './select.js';
import { Toast, ToastProvider, ToastTitle, ToastViewport } from './toast.js';

afterEach(cleanup);

describe('primitive class names', () => {
  it('keeps base styles when callers add classes to text primitives', () => {
    render(
      <>
        <Dialog open onOpenChange={() => undefined}>
          <DialogContent>
            <DialogTitle className="custom-dialog">Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
        <Select open value="selected">
          <SelectTrigger aria-label="Choose">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="custom-select">Options</SelectLabel>
              <SelectItem value="selected">Selected</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <ToastProvider>
          <Toast open onOpenChange={() => undefined}>
            <ToastTitle className="custom-toast">Toast</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      </>,
    );

    expect(screen.getByText('Dialog').classList.contains('tk-dialog__title')).toBe(true);
    expect(screen.getByText('Dialog').classList.contains('custom-dialog')).toBe(true);
    expect(screen.getByText('Options').classList.contains('tk-select__label')).toBe(true);
    expect(screen.getByText('Options').classList.contains('custom-select')).toBe(true);
    expect(screen.getByText('Toast').classList.contains('tk-toast__title')).toBe(true);
    expect(screen.getByText('Toast').classList.contains('custom-toast')).toBe(true);
  });
});
