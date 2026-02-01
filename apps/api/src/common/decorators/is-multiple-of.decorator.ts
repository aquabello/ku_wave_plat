import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsMultipleOf(
  multiple: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isMultipleOf',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [multiple],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [multiple] = args.constraints;
          return typeof value === 'number' && value % multiple === 0;
        },
        defaultMessage(args: ValidationArguments) {
          const [multiple] = args.constraints;
          return `${args.property}은(는) ${multiple} 단위여야 합니다`;
        },
      },
    });
  };
}
