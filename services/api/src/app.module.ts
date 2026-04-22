import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './database/prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { CatalogModule } from './modules/catalog/catalog.module'
import { DiningModule } from './modules/dining/dining.module'
import { CustomersModule } from './modules/customers/customers.module'
import { HealthModule } from './modules/health/health.module'
import { IamModule } from './modules/iam/iam.module'
import { OrdersModule } from './modules/orders/orders.module'
import { ReservationsModule } from './modules/reservations/reservations.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    IamModule,
    AuthModule,
    CatalogModule,
    DiningModule,
    CustomersModule,
    ReservationsModule,
    OrdersModule,
  ],
})
export class AppModule {}
