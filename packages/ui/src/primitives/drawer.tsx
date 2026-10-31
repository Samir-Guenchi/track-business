'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../cn.js';

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export interface DrawerContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  readonly side?: 'start' | 'end';
  readonly closeLabel?: string;
}

export function DrawerContent({
  side = 'end',
  closeLabel = 'Close panel',
  className,
  children,
  ...props
}: DrawerContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="tk-dialog__overlay" />
      <DialogPrimitive.Content
        className={cn('tk-drawer__content', className)}
        data-side={side}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="tk-dialog__close" aria-label={closeLabel}>
          <X size={18} aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DrawerTitle(props: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className="tk-dialog__title" {...props} />;
}

export function DrawerDescription(props: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className="tk-dialog__description" {...props} />;
}
