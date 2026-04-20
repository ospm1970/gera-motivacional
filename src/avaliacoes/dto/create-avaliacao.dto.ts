import { IsNumber, Min, Max, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateAvaliacaoDto {
  @IsUUID()
  @IsNotEmpty()
  phraseId: string;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(5)
  nota: number;
}
