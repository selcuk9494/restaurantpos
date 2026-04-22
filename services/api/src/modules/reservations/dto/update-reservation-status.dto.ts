import { IsIn, IsString } from 'class-validator'

export class UpdateReservationStatusDto {
  @IsString()
  reservationId!: string

  @IsIn(['PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW'])
  status!: string
}
