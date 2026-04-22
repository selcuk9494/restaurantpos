import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import { AttachModifierGroupDto } from './dto/attach-modifier-group.dto'
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto'
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto'
import { CreateProductVariantDto } from './dto/create-product-variant.dto'

@Injectable()
export class CatalogExtrasService {
  constructor(private readonly prisma: PrismaService) {}

  async listVariants() {
    try {
      return await this.prisma.productVariant.findMany({
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
        orderBy: [{ product: { name: 'asc' } }, { sortOrder: 'asc' }, { name: 'asc' }],
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async createVariant(dto: CreateProductVariantDto) {
    try {
      return await this.prisma.productVariant.create({
        data: {
          code: dto.code,
          name: dto.name,
          price: dto.price,
          isDefault: dto.isDefault,
          isActive: dto.isActive,
          sortOrder: dto.sortOrder,
          product: {
            connect: { id: dto.productId },
          },
        },
        include: {
          product: true,
        },
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async listModifierGroups() {
    try {
      return await this.prisma.modifierGroup.findMany({
        include: {
          options: true,
          products: {
            include: {
              product: true,
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async createModifierGroup(dto: CreateModifierGroupDto) {
    try {
      return await this.prisma.modifierGroup.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          minSelect: dto.minSelect,
          maxSelect: dto.maxSelect,
          isRequired: dto.isRequired,
          isActive: dto.isActive,
          sortOrder: dto.sortOrder,
        },
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async listModifierOptions() {
    try {
      return await this.prisma.modifierOption.findMany({
        include: {
          modifierGroup: true,
        },
        orderBy: [{ modifierGroup: { name: 'asc' } }, { sortOrder: 'asc' }, { name: 'asc' }],
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async createModifierOption(dto: CreateModifierOptionDto) {
    try {
      return await this.prisma.modifierOption.create({
        data: {
          code: dto.code,
          name: dto.name,
          priceDelta: dto.priceDelta,
          isDefault: dto.isDefault,
          isActive: dto.isActive,
          sortOrder: dto.sortOrder,
          modifierGroup: {
            connect: { id: dto.modifierGroupId },
          },
        },
        include: {
          modifierGroup: true,
        },
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async attachModifierGroup(dto: AttachModifierGroupDto) {
    try {
      return await this.prisma.productModifierGroup.create({
        data: {
          productId: dto.productId,
          modifierGroupId: dto.modifierGroupId,
          sortOrder: dto.sortOrder,
        },
        include: {
          product: true,
          modifierGroup: true,
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

    if (error instanceof Error && /fetch failed|cannot reach database server|cannot fetch data from service/i.test(error.message)) {
      throw new ServiceUnavailableException('Database service is not reachable yet')
    }

    throw error
  }
}
