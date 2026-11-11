import { Module } from '@nestjs/common';
import { AdminOrdersController } from './admin-orders.controller.js';
import { AdminOrdersService } from './admin-orders.service.js';
import { NotificationModule } from '../../notifications/notification.module.js';

@Module({
  imports: [NotificationModule],
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService],
  exports: [AdminOrdersService],
})
export class AdminOrdersModule {}
