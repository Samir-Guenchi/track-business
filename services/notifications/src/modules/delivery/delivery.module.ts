import { Module } from '@nestjs/common';
import { type Env, ENV } from '../../config/env.schema.js';
import {
  type OptOutStore,
  type SettingsStore,
  STORES,
} from '../messages/application/ports/stores.js';
import { TemplateService } from '../messages/application/template.service.js';
import { MessagesModule } from '../messages/messages.module.js';
import { EnqueueMessages } from './application/enqueue-messages.js';
import { MessageSender } from './application/message-sender.js';
import {
  type ContactDirectory,
  DELIVERY_PORTS,
  type MessageProvider,
  type MessageQueue,
  type ParcelDirectory,
} from './application/ports/delivery.ports.js';
import { ReceiptsService } from './application/receipts.service.js';
import { DeliveryEventsConsumer } from './infrastructure/delivery-events.consumer.js';
import { FakeMessageProvider } from './infrastructure/fake-message.provider.js';
import { HttpContactDirectory } from './infrastructure/http-contact.directory.js';
import { MessageSenderWorker } from './infrastructure/message-sender.worker.js';
import { PrismaMessageQueue } from './infrastructure/prisma-message.queue.js';
import { PrismaParcelDirectory } from './infrastructure/prisma-parcel.directory.js';
import { ReceiptsController } from './interface/receipts.controller.js';

type SenderInputs = [
  MessageQueue,
  SettingsStore,
  TemplateService,
  OptOutStore,
  ContactDirectory,
  ParcelDirectory,
  MessageProvider,
  Env,
];

/** Sending (#46): events -> queued messages -> provider -> receipts. */
@Module({
  imports: [MessagesModule],
  controllers: [ReceiptsController],
  providers: [
    EnqueueMessages,
    ReceiptsService,
    DeliveryEventsConsumer,
    MessageSenderWorker,
    { provide: DELIVERY_PORTS.queue, useClass: PrismaMessageQueue },
    { provide: DELIVERY_PORTS.parcels, useClass: PrismaParcelDirectory },
    { provide: DELIVERY_PORTS.contacts, useClass: HttpContactDirectory },
    // One provider per environment; `fake` until a gateway is chosen (ADR-0004).
    {
      provide: DELIVERY_PORTS.provider,
      useFactory: (): MessageProvider => new FakeMessageProvider(),
    },
    {
      provide: MessageSender,
      inject: [
        DELIVERY_PORTS.queue,
        STORES.settings,
        TemplateService,
        STORES.optOuts,
        DELIVERY_PORTS.contacts,
        DELIVERY_PORTS.parcels,
        DELIVERY_PORTS.provider,
        ENV,
      ],
      useFactory: (
        ...[queue, settings, templates, optOuts, contacts, parcels, provider, env]: SenderInputs
      ) =>
        new MessageSender({
          queue,
          settings,
          templates,
          optOuts,
          contacts,
          parcels,
          provider,
          trackingUrl: env.TRACKING_URL,
        }),
    },
  ],
  exports: [EnqueueMessages, MessageSender, DELIVERY_PORTS.provider],
})
export class DeliveryModule {}
