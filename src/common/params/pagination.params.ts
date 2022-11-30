import {
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationParams {
  @ApiProperty({ default: 5 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(3)
  limit = 5;

  @ApiProperty({ default: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page = 1;

  @ApiProperty({ default: '-createdAt' })
  @IsOptional()
  @Type(() => String)
  @IsString()
  sort = '-createdAt';
}
