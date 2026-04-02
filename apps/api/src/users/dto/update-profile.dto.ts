import { IsString, IsOptional, Min, Max } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() charityId?: string | null;
  @IsOptional() @Min(10) @Max(100) charityPercent?: number;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() role?: string;
}
