import { Body, Controller, Get, Post } from '@nestjs/common'
import { CloseTableSessionDto } from './dto/close-table-session.dto'
import { CreateTableAreaDto } from './dto/create-table-area.dto'
import { CreateTableDto } from './dto/create-table.dto'
import { OpenTableSessionDto } from './dto/open-table-session.dto'
import { DiningService } from './dining.service'

@Controller('dining')
export class DiningController {
  constructor(private readonly diningService: DiningService) {}

  @Get('meta')
  getMeta() {
    return this.diningService.getMeta()
  }

  @Get('areas')
  listAreas() {
    return this.diningService.listAreas()
  }

  @Post('areas')
  createArea(@Body() dto: CreateTableAreaDto) {
    return this.diningService.createArea(dto)
  }

  @Get('tables')
  listTables() {
    return this.diningService.listTables()
  }

  @Post('tables')
  createTable(@Body() dto: CreateTableDto) {
    return this.diningService.createTable(dto)
  }

  @Get('sessions')
  listSessions() {
    return this.diningService.listSessions()
  }

  @Post('sessions/open')
  openSession(@Body() dto: OpenTableSessionDto) {
    return this.diningService.openSession(dto)
  }

  @Post('sessions/close')
  closeSession(@Body() dto: CloseTableSessionDto) {
    return this.diningService.closeSession(dto)
  }
}
