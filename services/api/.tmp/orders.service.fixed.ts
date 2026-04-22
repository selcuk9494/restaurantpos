import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import { AddOrderItemDto } from './dto/add-order-item.dto'
import { AddPaymentDto } from './dto/add-payment.dto'
import { CloseOrderDto } from './dto/close-order.dto'
import { CreateOrderDto } from './dto/create-order.dto'

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  getMeta() {
    return {
      module: 'orders',
      endpoints: [
        'GET /v1/orders/meta',
        'GET /v1/orders',
        'POST /v1/orders',
        'POST /v1/orders/items',
        'POST /v1/orders/payments',
        'POST /v1/orders/close',
      ],
    }
  }

  async listOrders() {
    try {
      return await this.prisma.order.findMany({
        include: {
          session: { include: { table: { include: { area: true } } } },
          items: {
            include: {
              product: true,
              variant: true,
              modifiers: true,
            },
          },
          payments: true,
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async createOrder(dto: CreateOrderDto) {
    try {
      const session = await this.prisma.tableSession.findUnique({
        where: { id: dto.sessionId },
      })

      if (!session || session.status !== 'OPEN') {
        throw new BadRequestException('Table session must be open to create order')
      }

      const existingOpenOrder = await this.prisma.order.findFirst({
        where: { sessionId: dto.sessionId, status: 'OPEN' },
      })

      if (existingOpenOrder) {
        throw new BadRequestException('Open order already exists for this session')
      }

      return await this.prisma.order.create({
        data: {
          sessionId: dto.sessionId,
          note: dto.note,
          status: 'OPEN',
        },
        include: {
          session: { include: { table: { include: { area: true } } } },
          items: true,
          payments: true,
        },
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async addItem(dto: AddOrderItemDto) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
      })

      if (!order || order.status !== 'OPEN') {
        throw new BadRequestException('Order must be open to add items')
      }

      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      })

      if (!product) {
        throw new BadRequestException('Product was not found')
      }

      const variant = dto.variantId
        ? await this.prisma.productVariant.findUnique({
            where: { id: dto.variantId },
          })
        : null

      if (variant && variant.productId !== product.id) {
        throw new BadRequestException('Variant does not belong to product')
      }

      const modifierOptions = dto.modifierOptionIds?.length
        ? await this.prisma.modifierOption.findMany({
            where: { id: { in: dto.modifierOptionIds } },
          })
        : []

      if ((dto.modifierOptionIds?.length ?? 0) !== modifierOptions.length) {
        throw new BadRequestException('One or more modifier options were not found')
      }

      const quantity = dto.quantity ?? 1
      const unitPrice = variant?.price ?? product.price
      const modifiersTotal = modifierOptions.reduce((sum, option) => sum + option.priceDelta, 0)
      const lineTotal = (unitPrice + modifiersTotal) * quantity

      return await this.prisma.$transaction(async (tx) => {
        const item = await tx.orderItem.create({
          data: {
            orderId: dto.orderId,
            productId: product.id,
            variantId: variant?.id,
            quantity,
            unitPrice,
            lineTotal,
            note: dto.note,
            productName: product.name,
            variantName: variant?.name,
          },
        })

        if (modifierOptions.length) {
          await tx.orderItemModifier.createMany({
            data: modifierOptions.map((option) => ({
              orderItemId: item.id,
              modifierOptionId: option.id,
              name: option.name,
              priceDelta: option.priceDelta,
            })),
          })
        }

        await this.recalculateOrder(tx, dto.orderId)

        return await tx.order.findUniqueOrThrow({
          where: { id: dto.orderId },
          include: {
            session: { include: { table: { include: { area: true } } } },
            items: {
              include: {
                product: true,
                variant: true,
                modifiers: true,
              },
            },
            payments: true,
          },
        })
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }


  async addPayment(dto: AddPaymentDto) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
      })

      if (!order || order.status !== 'OPEN') {
        throw new BadRequestException('Order must be open to add payment')
      }

      return await this.prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            orderId: dto.orderId,
            method: dto.method,
            amount: dto.amount,
            note: dto.note,
          },
        })

        const payments = await tx.payment.findMany({
          where: { orderId: dto.orderId },
          select: { amount: true },
        })

        const paidTotal = payments.reduce((sum, payment) => sum + payment.amount, 0)

        await tx.order.update({
          where: { id: dto.orderId },
          data: { paidTotal },
        })

        return await tx.order.findUniqueOrThrow({
          where: { id: dto.orderId },
          include: {
            session: { include: { table: { include: { area: true } } } },
            items: { include: { product: true, variant: true, modifiers: true } },
            payments: true,
          },
        })
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async closeOrder(dto: CloseOrderDto) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        include: {
          session: { include: { table: { include: { area: true } } } },
          payments: true,
        },
      })

      if (!order || order.status !== 'OPEN') {
        throw new BadRequestException('Order must be open to close')
      }

      const paidTotal = order.payments.reduce((sum, payment) => sum + payment.amount, 0)

      if (order.total > 0 && paidTotal < order.total) {
        throw new BadRequestException('Order is not fully paid')
      }

      return await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: dto.orderId },
          data: {
            status: 'CLOSED',
            note: dto.note ?? order.note,
            paidTotal,
            closedAt: new Date(),
          },
        })

        const openOrdersCount = await tx.order.count({
          where: { sessionId: order.sessionId, status: 'OPEN' },
        })

        if (openOrdersCount === 0 && order.session.status === 'OPEN') {
          await tx.tableSession.update({
            where: { id: order.sessionId },
            data: { status: 'CLOSED', note: dto.note ?? order.session.note, closedAt: new Date() },
          })


          await tx.restaurantTable.update({
            where: { id: order.session.tableId },
            data: { status: 'AVAILABLE' },
          })
        }

        return await tx.order.findUniqueOrThrow({
          where: { id: dto.orderId },
          include: {
            session: { include: { table: { include: { area: true } } } },
            items: { include: { product: true, variant: true, modifiers: true } },
            payments: true,
          },
        })
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }
  private async recalculateOrder(tx: Prisma.TransactionClient, orderId: string) {
    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { lineTotal: true },
    })

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)

    await tx.order.update({
      where: { id: orderId },
      data: {
        subtotal,
        total: subtotal,
      },
    })
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
