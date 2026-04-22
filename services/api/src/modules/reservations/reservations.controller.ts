import { Body, Controller, Get, Post } from '@nestjs/common'
import { ReservationsService } from './reservations.service'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto'

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('meta')
  getMeta() {
    return this.reservationsService.getMeta()
  }

  @Get()
  listReservations() {
    return this.reservationsService.listReservations()
  }

  @Post()
  createReservation(@Body() dto: CreateReservationDto) {
    return this.reservationsService.createReservation(dto)
  }

  @Post('status')
  updateStatus(@Body() dto: UpdateReservationStatusDto) {
    return this.reservationsService.updateStatus(dto)
  }
}
