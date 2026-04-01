import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, Min, Max, IsDateString, IsOptional } from 'class-validator';
import { ScoresService } from './scores.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class CreateScoreDto {
  @IsInt() @Min(1) @Max(45) value: number;
  @IsDateString() date: string;
}

class UpdateScoreDto {
  @IsOptional() @IsInt() @Min(1) @Max(45) value?: number;
  @IsOptional() @IsDateString() date?: string;
}

@ApiTags('Scores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scores')
export class ScoresController {
  constructor(private scoresService: ScoresService) {}

  @Get()
  getMyScores(@CurrentUser() user: any) {
    return this.scoresService.getMyScores(user.id);
  }

  @Post()
  addScore(@CurrentUser() user: any, @Body() dto: CreateScoreDto) {
    return this.scoresService.addScore(user.id, dto.value, new Date(dto.date));
  }

  @Patch(':id')
  updateScore(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateScoreDto,
  ) {
    return this.scoresService.updateScore(user.id, id, dto.value, dto.date ? new Date(dto.date) : undefined);
  }

  @Delete(':id')
  deleteScore(@CurrentUser() user: any, @Param('id') id: string) {
    return this.scoresService.deleteScore(user.id, id);
  }

  // Admin: view/edit any user's scores
  @Get('admin/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getUserScores(@Param('userId') userId: string) {
    return this.scoresService.getUserScores(userId);
  }

  @Patch('admin/:scoreId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  adminUpdateScore(@Param('scoreId') scoreId: string, @Body() dto: UpdateScoreDto) {
    return this.scoresService.adminUpdateScore(scoreId, dto.value, dto.date ? new Date(dto.date) : undefined);
  }
}
