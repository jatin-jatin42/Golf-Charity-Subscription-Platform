import { IsEmail, IsString, MinLength, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ description: 'Charity ID to support (selected at signup)' })
  @IsOptional()
  @IsString()
  charityId?: string;

  @ApiPropertyOptional({ description: 'Charity contribution percentage (min 10%)', minimum: 10, maximum: 100 })
  @IsOptional()
  @Min(10)
  @Max(100)
  charityPercent?: number;
}
