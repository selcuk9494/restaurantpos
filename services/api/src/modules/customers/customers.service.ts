import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma/prisma.service'
import { CreateCustomerDto } from './dto/create-customer.dto'

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  getMeta() {
    return {
      statuses: ['ACTIVE'],
    }
  }

  listCustomers() {
    return this.prisma.customer.findMany({
      orderBy: [{ fullName: 'asc' }],
    })
  }

  createCustomer(dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        code: dto.code,
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        note: dto.note,
        loyaltyPoints: dto.loyaltyPoints ?? 0,
      },
    })
  }
}
