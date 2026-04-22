import { Body, Controller, Get, Post } from '@nestjs/common'
import { CustomersService } from './customers.service'
import { CreateCustomerDto } from './dto/create-customer.dto'

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('meta')
  getMeta() {
    return this.customersService.getMeta()
  }

  @Get()
  listCustomers() {
    return this.customersService.listCustomers()
  }

  @Post()
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.customersService.createCustomer(dto)
  }
}
