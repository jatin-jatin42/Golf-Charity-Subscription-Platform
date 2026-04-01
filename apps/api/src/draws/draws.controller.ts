import {
  Controller, Get, Post, Param, Body, UseGuards, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DrawsService } from './draws.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Draws')
@Controller('draws')
export class DrawsController {
  constructor(private drawsService: DrawsService) {}

  // Public: view all draws
  @Get()
  findAll() {
    return this.drawsService.findAll();
  }

  @Get('current')
  getCurrent() {
    return this.drawsService.getCurrentDraw();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.drawsService.findById(id);
  }

  // Authenticated user: view their participation
  @Get('me/participation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyParticipation(@CurrentUser() user: any) {
    return this.drawsService.getMyParticipation(user.id);
  }

  // Admin: create draw
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  createDraw(@Body() body: { month: string; logicType: 'RANDOM' | 'ALGORITHMIC' }) {
    return this.drawsService.createDraw(new Date(body.month), body.logicType);
  }

  // Admin: simulate draw (pre-analysis)
  @Post(':id/simulate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  simulate(@Param('id') id: string) {
    return this.drawsService.simulate(id);
  }

  // Admin: publish draw results officially
  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  publish(@Param('id') id: string) {
    return this.drawsService.publish(id);
  }
}
