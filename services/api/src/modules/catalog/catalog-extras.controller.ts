import { Body, Controller, Get, Post } from '@nestjs/common'
import { AttachModifierGroupDto } from './dto/attach-modifier-group.dto'
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto'
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto'
import { CreateProductVariantDto } from './dto/create-product-variant.dto'
import { CatalogExtrasService } from './catalog-extras.service'

@Controller('catalog')
export class CatalogExtrasController {
  constructor(private readonly catalogExtrasService: CatalogExtrasService) {}

  @Get('variants')
  listVariants() {
    return this.catalogExtrasService.listVariants()
  }

  @Post('variants')
  createVariant(@Body() dto: CreateProductVariantDto) {
    return this.catalogExtrasService.createVariant(dto)
  }

  @Get('modifier-groups')
  listModifierGroups() {
    return this.catalogExtrasService.listModifierGroups()
  }

  @Post('modifier-groups')
  createModifierGroup(@Body() dto: CreateModifierGroupDto) {
    return this.catalogExtrasService.createModifierGroup(dto)
  }

  @Get('modifier-options')
  listModifierOptions() {
    return this.catalogExtrasService.listModifierOptions()
  }

  @Post('modifier-options')
  createModifierOption(@Body() dto: CreateModifierOptionDto) {
    return this.catalogExtrasService.createModifierOption(dto)
  }

  @Post('product-modifier-groups')
  attachModifierGroup(@Body() dto: AttachModifierGroupDto) {
    return this.catalogExtrasService.attachModifierGroup(dto)
  }
}
