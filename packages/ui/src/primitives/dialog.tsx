'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../cn.js';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  readonly closeLabel?: string;
}

export function DialogContent({
  closeLabel = 'Close dialog',
  className,
  children,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="tk-dialog__overlay" />
      <DialogPrimitive.Content className={cn('tk-dialog__content', className)} {...props}>
        {children}
        <DialogPrimitive.Close className="tk-dialog__close" aria-label={closeLabel}>
          <X size={18} aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('tk-dialog__title', className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={cn('tk-dialog__description', className)} {...props} />
  );
}
