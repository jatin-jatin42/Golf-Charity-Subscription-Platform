import {
  Controller, Get, Post, Patch, Param, Query,
  UseGuards, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { WinnersService } from './winners.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Winners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('winners')
export class WinnersController {
  constructor(private winnersService: WinnersService) {}

  // Admin: all winners with optional filters
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAll(
    @Query('verifyStatus') verifyStatus?: string,
    @Query('payStatus') payStatus?: string,
  ) {
    return this.winnersService.findAll(verifyStatus, payStatus);
  }

  // User: my winnings
  @Get('me')
  getMyWinnings(@CurrentUser() user: any) {
    return this.winnersService.getMyWinnings(user.id);
  }

  // User: upload proof screenshot
  @Post(':id/proof')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  uploadProof(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.winnersService.uploadProof(id, user.id, file);
  }

  // Admin: verify submission
  @Patch(':id/verify')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  verify(@Param('id') id: string, @Query('status') status: 'APPROVED' | 'REJECTED') {
    return this.winnersService.verify(id, status);
  }

  // Admin: mark payout as paid
  @Patch(':id/pay')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  markPaid(@Param('id') id: string) {
    return this.winnersService.markPaid(id);
  }
}
