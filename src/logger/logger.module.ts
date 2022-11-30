import { Module } from '@nestjs/common';
import { LoggerService, LoggerOptions, LoggerTransport } from 'nest-logger';

@Module({
  imports: [],
  providers: [
    {
      provide: LoggerService,
      useFactory: () => {
        const options: LoggerOptions = {
          fileOptions: {
            filename: `${process.env.LOG_PATH}/%DATE%.log`,
          },
        };
        const loggers = LoggerService.getLoggers(
          [LoggerTransport.ROTATE],
          options,
        );
        return new LoggerService('info', loggers);
      },
    },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}
