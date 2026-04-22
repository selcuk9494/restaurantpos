import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma/prisma.service'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto'

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  getMeta() {
    return {
      statuses: ['PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW'],
    }
  }

  listReservations() {
    return this.prisma.reservation.findMany({
      include: {
        customer: true,
        table: true,
      },
      orderBy: [{ reservedAt: 'asc' }],
    })
  }

  createReservation(dto: CreateReservationDto) {
    return this.prisma.reservation.create({
      data: {
        customerId: dto.customerId,
        tableId: dto.tableId,
        fullName: dto.fullName,
        phone: dto.phone,
        guestCount: dto.guestCount,
        reservedAt: new Date(dto.reservedAt),
        note: dto.note,
      },
      include: {
        customer: true,
        table: true,
      },
    })
  }

  updateStatus(dto: UpdateReservationStatusDto) {
    return this.prisma.reservation.update({
      where: { id: dto.reservationId },
      data: { status: dto.status },
      include: {
        customer: true,
        table: true,
      },
    })
  }
}
