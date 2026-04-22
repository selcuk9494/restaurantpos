import { Module } from '@nestjs/common'
import { CatalogController } from './catalog.controller'
import { CatalogExtrasController } from './catalog-extras.controller'
import { CatalogExtrasService } from './catalog-extras.service'
import { CatalogService } from './catalog.service'

@Module({
  controllers: [CatalogController, CatalogExtrasController],
  providers: [CatalogService, CatalogExtrasService],
})
export class CatalogModule {}
