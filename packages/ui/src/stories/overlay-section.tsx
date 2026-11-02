import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../index.js';
import type { StoryCopy } from './copy.js';

function DialogControl({ copy }: { readonly copy: StoryCopy }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">{copy.dialog}</Button>
      </DialogTrigger>
      <DialogContent closeLabel={copy.dismiss}>
        <DialogTitle>{copy.dialogTitle}</DialogTitle>
        <DialogDescription>{copy.dialogDescription}</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

function DrawerControl({ copy }: { readonly copy: StoryCopy }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary">{copy.drawer}</Button>
      </DrawerTrigger>
      <DrawerContent closeLabel={copy.dismiss}>
        <DrawerTitle>{copy.panel}</DrawerTitle>
        <p>{copy.dialogDescription}</p>
      </DrawerContent>
    </Drawer>
  );
}

function TooltipControl({ copy }: { readonly copy: StoryCopy }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost">{copy.tooltip}</Button>
        </TooltipTrigger>
        <TooltipContent>{copy.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ToastControl({ copy }: { readonly copy: StoryCopy }) {
  const [open, setOpen] = useState(false);
  return (
    <ToastProvider swipeDirection="right">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {copy.notify}
      </Button>
      <Toast open={open} onOpenChange={setOpen} duration={Number.POSITIVE_INFINITY}>
        <ToastTitle>{copy.toastTitle}</ToastTitle>
        <ToastDescription>{copy.toastDescription}</ToastDescription>
        <ToastClose label={copy.dismiss} />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );
}

export function OverlaySection({ copy }: { readonly copy: StoryCopy }) {
  return (
    <section className="tk-showcase__section">
      <h2>{copy.details}</h2>
      <div className="tk-showcase__controls tk-showcase__controls--inline">
        <DialogControl copy={copy} />
        <DrawerControl copy={copy} />
        <TooltipControl copy={copy} />
        <ToastControl copy={copy} />
      </div>
    </section>
  );
}
