import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { SessionController } from './controllers/session.controller';
import { RitualsController } from './controllers/rituals.controller';
import { LogsController } from './controllers/logs.controller';
import { MetricsController } from './controllers/metrics.controller';
import { HealthService } from './services/health.service';
import { SessionService } from './services/session.service';
import { StateService } from '../libs/storage/state.service';

@Module({
  controllers: [HealthController, SessionController, RitualsController, LogsController, MetricsController],
  providers: [HealthService, SessionService, StateService],
})
export class AppModule {}
