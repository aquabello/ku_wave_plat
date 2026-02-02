import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpClientService } from './http-client.service';

/**
 * Global HTTP Client Module
 * Provides HttpClientService throughout the application
 * No need to import this module in feature modules
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [HttpClientService],
  exports: [HttpClientService],
})
export class HttpClientModule {}
