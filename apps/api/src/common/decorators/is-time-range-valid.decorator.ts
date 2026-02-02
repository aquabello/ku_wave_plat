import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsTimeRangeValid(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isTimeRangeValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const startTime = obj.blackoutStartTime;
          const endTime = obj.blackoutEndTime;

          if (!startTime || !endTime) {
            return true; // Let other validators handle missing values
          }

          const [startHour, startMin] = startTime.split(':').map(Number);
          const [endHour, endMin] = endTime.split(':').map(Number);

          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;

          return startMinutes < endMinutes;
        },
        defaultMessage(args: ValidationArguments) {
          return '블랙 시간 시작은 종료 시간보다 이전이어야 합니다';
        },
      },
    });
  };
}
