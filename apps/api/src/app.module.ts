import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

// Modules
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { DashboardModule } from '@modules/dashboard/dashboard.module';
import { ProductsModule } from '@modules/products/products.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { CustomersModule } from '@modules/customers/customers.module';
import { AnalyticsModule } from '@modules/analytics/analytics.module';
import { SettingsModule } from '@modules/settings/settings.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database (MariaDB)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mariadb',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
        migrations: [__dirname + '/database/migrations/**/*{.ts,.js}'],
        migrationsRun: false,
        charset: 'utf8mb4',
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('THROTTLE_TTL') || 60,
          limit: configService.get('THROTTLE_LIMIT') || 10,
        },
      ],
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    DashboardModule,
    ProductsModule,
    OrdersModule,
    CustomersModule,
    AnalyticsModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
