import { z } from 'zod';

/**
 * System Settings Form Validation Schema
 * Matches backend validation rules from UpdateSystemSettingsDto
 */
export const systemSettingsSchema = z
  .object({
    apiInterval: z
      .number({
        required_error: 'API 통신주기는 필수 항목입니다',
        invalid_type_error: 'API 통신주기는 숫자여야 합니다',
      })
      .int('API 통신주기는 정수여야 합니다')
      .min(5, 'API 통신주기는 최소 5분이어야 합니다')
      .max(60, 'API 통신주기는 최대 60분이어야 합니다')
      .refine((val) => val % 5 === 0, {
        message: 'API 통신주기는 5분 단위여야 합니다',
      }),
    executionInterval: z
      .number({
        required_error: '실행주기는 필수 항목입니다',
        invalid_type_error: '실행주기는 숫자여야 합니다',
      })
      .int('실행주기는 정수여야 합니다')
      .min(1, '실행주기는 최소 1분이어야 합니다')
      .max(60, '실행주기는 최대 60분이어야 합니다'),
    blackoutStartTime: z
      .string({
        required_error: '블랙 시간 시작은 필수 항목입니다',
      })
      .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
        message: '블랙 시간 시작은 HH:mm 형식이어야 합니다 (예: 08:00)',
      }),
    blackoutEndTime: z
      .string({
        required_error: '블랙 시간 종료는 필수 항목입니다',
      })
      .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
        message: '블랙 시간 종료는 HH:mm 형식이어야 합니다 (예: 20:00)',
      }),
    defaultImagePath: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      // Validate that start time is before end time
      const [startHours, startMinutes] = data.blackoutStartTime
        .split(':')
        .map(Number);
      const [endHours, endMinutes] = data.blackoutEndTime.split(':').map(Number);

      const startTimeInMinutes = startHours * 60 + startMinutes;
      const endTimeInMinutes = endHours * 60 + endMinutes;

      return startTimeInMinutes < endTimeInMinutes;
    },
    {
      message: '블랙 시간 시작은 종료 시간보다 이전이어야 합니다',
      path: ['blackoutEndTime'],
    }
  );

export type SystemSettingsFormValues = z.infer<typeof systemSettingsSchema>;

/**
 * Image file validation
 */
export const validateImageFile = (file: File): string | null => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png'];

  if (!allowedTypes.includes(file.type)) {
    return 'JPEG 또는 PNG 형식의 이미지만 업로드 가능합니다';
  }

  if (file.size > maxSize) {
    return '파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다';
  }

  return null;
};
