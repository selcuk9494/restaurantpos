import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import { CloseTableSessionDto } from './dto/close-table-session.dto'
import { CreateTableAreaDto } from './dto/create-table-area.dto'
import { CreateTableDto } from './dto/create-table.dto'
import { OpenTableSessionDto } from './dto/open-table-session.dto'

@Injectable()
export class DiningService {
  constructor(private readonly prisma: PrismaService) {}

  getMeta() {
    return {
      module: 'dining',
      endpoints: [
        'GET /v1/dining/meta',
        'GET /v1/dining/areas',
        'POST /v1/dining/areas',
        'GET /v1/dining/tables',
        'POST /v1/dining/tables',
        'GET /v1/dining/sessions',
        'POST /v1/dining/sessions/open',
        'POST /v1/dining/sessions/close',
      ],
    }
  }

  async listAreas() {
    try {
      return await this.prisma.tableArea.findMany({
        include: {
          _count: { select: { tables: true } },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async createArea(dto: CreateTableAreaDto) {
    try {
      return await this.prisma.tableArea.create({
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

  async listTables() {
    try {
      return await this.prisma.restaurantTable.findMany({
        include: {
          area: true,
          sessions: {
            where: { status: 'OPEN' },
            orderBy: { openedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: [{ area: { sortOrder: 'asc' } }, { sortOrder: 'asc' }, { name: 'asc' }],
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async createTable(dto: CreateTableDto) {
    try {
      return await this.prisma.restaurantTable.create({
        data: {
          code: dto.code,
          name: dto.name,
          capacity: dto.capacity,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
          area: { connect: { id: dto.areaId } },
        },
        include: { area: true },
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async listSessions() {
    try {
      return await this.prisma.tableSession.findMany({
        include: {
          table: {
            include: { area: true },
          },
        },
        orderBy: [{ status: 'asc' }, { openedAt: 'desc' }],
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async openSession(dto: OpenTableSessionDto) {
    try {
      const activeSession = await this.prisma.tableSession.findFirst({
        where: { tableId: dto.tableId, status: 'OPEN' },
      })

      if (activeSession) {
        throw new BadRequestException('Table already has an open session')
      }

      return await this.prisma.$transaction(async (tx) => {
        const session = await tx.tableSession.create({
          data: {
            tableId: dto.tableId,
            guestCount: dto.guestCount,
            note: dto.note,
            status: 'OPEN',
          },
        })

        await tx.restaurantTable.update({
          where: { id: dto.tableId },
          data: { status: 'OCCUPIED' },
        })

        return await tx.tableSession.findUniqueOrThrow({
          where: { id: session.id },
          include: { table: { include: { area: true } } },
        })
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  async closeSession(dto: CloseTableSessionDto) {
    try {
      const session = await this.prisma.tableSession.findUnique({
        where: { id: dto.sessionId },
      })

      if (!session) {
        throw new BadRequestException('Session was not found')
      }

      if (session.status !== 'OPEN') {
        throw new BadRequestException('Session is already closed')
      }

      return await this.prisma.$transaction(async (tx) => {
        await tx.tableSession.update({
          where: { id: dto.sessionId },
          data: {
            status: 'CLOSED',
            note: dto.note ?? session.note,
            closedAt: new Date(),
          },
        })

        await tx.restaurantTable.update({
          where: { id: session.tableId },
          data: { status: 'AVAILABLE' },
        })

        return await tx.tableSession.findUniqueOrThrow({
          where: { id: dto.sessionId },
          include: { table: { include: { area: true } } },
        })
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
