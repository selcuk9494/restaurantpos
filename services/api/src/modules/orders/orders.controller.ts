import { Body, Controller, Get, Post } from '@nestjs/common'
import { AddOrderItemDto } from './dto/add-order-item.dto'
import { AddPaymentDto } from './dto/add-payment.dto'
import { CloseOrderDto } from './dto/close-order.dto'
import { CreateOrderDto } from './dto/create-order.dto'
import { RemoveOrderItemDto } from './dto/remove-order-item.dto'
import { UpdateOrderItemDto } from './dto/update-order-item.dto'
import { UpdateOrderItemStatusDto } from './dto/update-order-item-status.dto'
import { OrdersService } from './orders.service'

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('meta')
  getMeta() {
    return this.ordersService.getMeta()
  }

  @Get()
  listOrders() {
    return this.ordersService.listOrders()
  }

  @Get('payment-summary')
  getPaymentSummary() {
    return this.ordersService.getPaymentSummary()
  }

  @Get('sales-summary')
  getSalesSummary() {
    return this.ordersService.getSalesSummary()
  }

  @Get('kitchen')
  listKitchen() {
    return this.ordersService.listKitchen()
  }

  @Post()
  createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto)
  }

  @Post('items')
  addItem(@Body() dto: AddOrderItemDto) {
    return this.ordersService.addItem(dto)
  }

  @Post('items/update')
  updateItem(@Body() dto: UpdateOrderItemDto) {
    return this.ordersService.updateItem(dto)
  }

  @Post('items/remove')
  removeItem(@Body() dto: RemoveOrderItemDto) {
    return this.ordersService.removeItem(dto)
  }

  @Post('items/status')
  updateItemStatus(@Body() dto: UpdateOrderItemStatusDto) {
    return this.ordersService.updateItemStatus(dto)
  }

  @Post('payments')
  addPayment(@Body() dto: AddPaymentDto) {
    return this.ordersService.addPayment(dto)
  }

  @Post('close')
  closeOrder(@Body() dto: CloseOrderDto) {
    return this.ordersService.closeOrder(dto)
  }
}
