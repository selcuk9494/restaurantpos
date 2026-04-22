
  async listKitchen() {
    try {
      return await this.prisma.orderItem.findMany({
        where: {
          order: { status: 'OPEN' },
          status: { in: ['NEW', 'PREPARING', 'READY'] },
        },
        include: {
          order: {
            include: {
              session: { include: { table: { include: { area: true } } } },
            },
          },
          product: true,
          variant: true,
          modifiers: true,
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async updateItemStatus(dto: UpdateOrderItemStatusDto) {
    try {
      const orderItem = await this.prisma.orderItem.findUnique({
        where: { id: dto.orderItemId },
        include: { order: true },
      })

      if (!orderItem) {
        throw new BadRequestException('Order item was not found')
      }

      if (orderItem.order.status !== 'OPEN') {
        throw new BadRequestException('Order must be open to update kitchen status')
      }

      const statusTimestamps: Record<string, Record<string, Date | null>> = {
        NEW: { startedAt: null, readyAt: null, servedAt: null },
        PREPARING: { startedAt: new Date(), readyAt: null, servedAt: null },
        READY: { readyAt: new Date(), servedAt: null },
        SERVED: { servedAt: new Date() },
      }

      if (!statusTimestamps[dto.status]) {
        throw new BadRequestException('Unsupported kitchen status')
      }

      return await this.prisma.orderItem.update({
        where: { id: dto.orderItemId },
        data: {
          status: dto.status,
          ...statusTimestamps[dto.status],
        },
        include: {
          order: {
            include: {
              session: { include: { table: { include: { area: true } } } },
            },
          },
          product: true,
          variant: true,
          modifiers: true,
        },
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }
