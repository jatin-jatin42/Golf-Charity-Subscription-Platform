import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CharitiesService } from './charities.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Charities')
@Controller('charities')
export class CharitiesController {
  constructor(private charitiesService: CharitiesService) {}

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  findAll(@Query('search') search?: string, @Query('category') category?: string) {
    return this.charitiesService.findAll(search, category);
  }

  @Get('featured')
  findFeatured() {
    return this.charitiesService.findFeatured();
  }

  @Get('categories')
  getCategories() {
    return this.charitiesService.getCategories();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.charitiesService.findById(id);
  }

  // Admin CRUD
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() body: any) {
    return this.charitiesService.create(body);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: any) {
    return this.charitiesService.update(id, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.charitiesService.delete(id);
  }

  @Post(':id/events')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  addEvent(@Param('id') id: string, @Body() body: any) {
    return this.charitiesService.addEvent(id, { ...body, date: new Date(body.date) });
  }
}
