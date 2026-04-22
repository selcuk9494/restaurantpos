import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { CreateProductDto } from './dto/create-product.dto'

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  getMeta() {
    return {
      module: 'catalog',
      endpoints: [
        'GET /v1/catalog/meta',
        'GET /v1/catalog/categories',
        'POST /v1/catalog/categories',
        'GET /v1/catalog/products',
        'POST /v1/catalog/products',
      ],
    }
  }

  async listCategories() {
    try {
      return await this.prisma.category.findMany({
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async createCategory(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        },
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async listProducts() {
    try {
      return await this.prisma.product.findMany({
        include: {
          category: true,
        },
        orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async createProduct(dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          price: dto.price,
          isActive: dto.isActive,
          category: {
            connect: { id: dto.categoryId },
          },
        },
        include: {
          category: true,
        },
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      throw new ServiceUnavailableException('Database connection is not ready')
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Record already exists')
      }

      if (error.code === 'P2003') {
        throw new BadRequestException('Related record was not found')
      }

      if (error.code === 'P2021') {
        throw new ServiceUnavailableException('Database schema is not migrated yet')
      }

      throw new BadRequestException(error.message)
    }

    if (
      error instanceof Prisma.PrismaClientValidationError ||
      error instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      throw new BadRequestException(error.message)
    }

    if (error instanceof Error && /fetch failed|can't reach database server|cannot fetch data from service/i.test(error.message)) {
      throw new ServiceUnavailableException('Database service is not reachable yet')
    }

    throw error
  }
}
