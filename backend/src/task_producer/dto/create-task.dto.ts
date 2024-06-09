import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  MinDate,
  ValidateIf,
} from 'class-validator';
import { addMinutes } from 'date-fns';
import { IsCron } from '../validators/cron.validtor';

export class CreateTaskDto {
  @IsNotEmpty()
  title: string;

  @IsBoolean()
  isRecurring: boolean;

  @ValidateIf((o) => !o.isRecurring)
  @IsDate()
  @MinDate(() => addMinutes(new Date(), 15), {
    message: 'runAt must be at least 15 minutes from now',
  })
  runAt?: Date;

  @ValidateIf((o) => o.isRecurring)
  @IsCron()
  frequency?: string;
}
