import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { isValidCron } from 'cron-validator';

@ValidatorConstraint({ name: 'IsCron', async: false })
export class IsCronConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    return typeof value === 'string' ? isValidCron(value) : false;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid cron expression`;
  }
}

export function IsCron(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCron',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsCronConstraint,
    });
  };
}
