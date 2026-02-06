import { Module } from '@nestjs/common';
import { DailyController } from './controllers/daily.controller';
import { HealthController } from './controllers/health.controller';
import { SessionController } from './controllers/session.controller';
import { RitualsController } from './controllers/rituals.controller';
import { LogsController } from './controllers/logs.controller';
import { MetricsController } from './controllers/metrics.controller';
import { TasksController } from './controllers/tasks.controller';
import { LanguageController } from './controllers/language.controller';
import { AIService } from './ai/services/ai.service';
import { HealthService } from './services/health.service';
import { SessionService } from './services/session.service';
import { TasksService } from './services/tasks.service';
import { StateService } from '../libs/storage/state.service';
import { DbService } from '../libs/db/db.service';
import { LanguageService } from '../libs/localization/language.service';

@Module({
  controllers: [
    DailyController,
    HealthController,
    SessionController,
    RitualsController,
    LogsController,
    MetricsController,
    TasksController,
    LanguageController,
  ],
  providers: [
    HealthService,
    SessionService,
    TasksService,
    AIService,
    StateService,
    DbService,
    LanguageService,
  ],
})
export class AppModule {}
