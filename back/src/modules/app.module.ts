import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { SessionController } from './controllers/session.controller';
import { HealthService } from './services/health.service';
import { SessionService } from './services/session.service';

@Module({
  controllers: [HealthController, SessionController],
  providers: [HealthService, SessionService],
})
export class AppModule {}
