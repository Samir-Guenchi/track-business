'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../cn.js';

export const ToastProvider = ToastPrimitive.Provider;
export const ToastAction = ToastPrimitive.Action;

export function ToastViewport(props: ComponentProps<typeof ToastPrimitive.Viewport>) {
  const { className, ...viewportProps } = props;
  return (
    <ToastPrimitive.Viewport className={cn('tk-toast__viewport', className)} {...viewportProps} />
  );
}

export function Toast({ className, ...props }: ComponentProps<typeof ToastPrimitive.Root>) {
  return <ToastPrimitive.Root className={cn('tk-toast', className)} {...props} />;
}

export function ToastTitle({ className, ...props }: ComponentProps<typeof ToastPrimitive.Title>) {
  return <ToastPrimitive.Title className={cn('tk-toast__title', className)} {...props} />;
}

export function ToastDescription({
  className,
  ...props
}: ComponentProps<typeof ToastPrimitive.Description>) {
  return (
    <ToastPrimitive.Description className={cn('tk-toast__description', className)} {...props} />
  );
}

export function ToastClose({ label = 'Dismiss notification' }: { readonly label?: string }) {
  return (
    <ToastPrimitive.Close className="tk-toast__close" aria-label={label}>
      <X size={16} aria-hidden="true" />
    </ToastPrimitive.Close>
  );
}
