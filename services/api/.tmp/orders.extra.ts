
  async updateItem(dto: UpdateOrderItemDto) {
    try {
      const orderItem = await this.prisma.orderItem.findUnique({
        where: { id: dto.orderItemId },
        include: {
          order: true,
          modifiers: true,
        },
      })

      if (!orderItem) {
        throw new BadRequestException('Order item was not found')
      }

      if (orderItem.order.status !== 'OPEN') {
        throw new BadRequestException('Order must be open to update items')
      }

      const modifierOptions = dto.modifierOptionIds
        ? await this.prisma.modifierOption.findMany({
            where: { id: { in: dto.modifierOptionIds } },
          })
        : null

      if (dto.modifierOptionIds && dto.modifierOptionIds.length !== modifierOptions?.length) {
        throw new BadRequestException('One or more modifier options were not found')
      }

      const quantity = dto.quantity ?? orderItem.quantity
      const modifiersTotal = (modifierOptions ?? orderItem.modifiers).reduce((sum, option) => sum + option.priceDelta, 0)
      const lineTotal = (orderItem.unitPrice + modifiersTotal) * quantity

      return await this.prisma.$transaction(async (tx) => {
        await tx.orderItem.update({
          where: { id: dto.orderItemId },
          data: {
            quantity,
            note: dto.note ?? orderItem.note,
            lineTotal,
          },
        })

        if (modifierOptions) {
          await tx.orderItemModifier.deleteMany({
            where: { orderItemId: dto.orderItemId },
          })

          if (modifierOptions.length) {
            await tx.orderItemModifier.createMany({
              data: modifierOptions.map((option) => ({
                orderItemId: dto.orderItemId,
                modifierOptionId: option.id,
                name: option.name,
                priceDelta: option.priceDelta,
              })),
            })
          }
        }

        await this.recalculateOrder(tx, orderItem.orderId)

        return await tx.order.findUniqueOrThrow({
          where: { id: orderItem.orderId },
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

  async removeItem(dto: RemoveOrderItemDto) {
    try {
      const orderItem = await this.prisma.orderItem.findUnique({
        where: { id: dto.orderItemId },
        include: { order: true },
      })

      if (!orderItem) {
        throw new BadRequestException('Order item was not found')
      }

      if (orderItem.order.status !== 'OPEN') {
        throw new BadRequestException('Order must be open to remove items')
      }

      return await this.prisma.$transaction(async (tx) => {
        await tx.orderItemModifier.deleteMany({
          where: { orderItemId: dto.orderItemId },
        })

        await tx.orderItem.delete({
          where: { id: dto.orderItemId },
        })

        await this.recalculateOrder(tx, orderItem.orderId)

        return await tx.order.findUniqueOrThrow({
          where: { id: orderItem.orderId },
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

  async getPaymentSummary() {
    const rows = await this.prisma.payment.groupBy({
      by: ['method'],
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { method: 'asc' },
    })

    return rows.map((row) => ({
      method: row.method,
      paymentCount: row._count._all,
      totalAmount: row._sum.amount ?? 0,
    }))
  }

  async getSalesSummary() {
    const closed = await this.prisma.order.aggregate({
      where: { status: 'CLOSED' },
      _sum: { total: true, paidTotal: true },
      _count: { _all: true },
      _avg: { total: true },
    })

    const open = await this.prisma.order.count({
      where: { status: 'OPEN' },
    })

    return {
      closedOrderCount: closed._count._all,
      openOrderCount: open,
      grossSales: closed._sum.total ?? 0,
      collectedAmount: closed._sum.paidTotal ?? 0,
      averageTicket: closed._avg.total ?? 0,
    }
  }
