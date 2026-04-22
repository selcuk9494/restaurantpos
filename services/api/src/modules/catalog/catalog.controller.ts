import { Body, Controller, Get, Post } from '@nestjs/common'
import { CatalogService } from './catalog.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { CreateProductDto } from './dto/create-product.dto'

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('meta')
  getMeta() {
    return this.catalogService.getMeta()
  }

  @Get('categories')
  listCategories() {
    return this.catalogService.listCategories()
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto)
  }

  @Get('products')
  listProducts() {
    return this.catalogService.listProducts()
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(dto)
  }
}
