import { z } from 'zod';

// =============================================
// NFC Tag API
// =============================================

export const NfcTagRequestSchema = z.object({
  identifier: z.string(),
  aid: z.string().optional(),
});

export const NfcControlSummarySchema = z.object({
  totalDevices: z.number(),
  successCount: z.number(),
  failCount: z.number(),
});

export const NfcTagResponseSchema = z.object({
  result: z.enum(['SUCCESS', 'PARTIAL', 'DENIED', 'UNKNOWN', 'ERROR']),
  logType: z.enum(['ENTER', 'EXIT', 'DENIED', 'UNKNOWN']),
  spaceName: z.string(),
  userName: z.string().nullable(),
  controlResult: z.enum(['SUCCESS', 'FAIL', 'PARTIAL', 'SKIPPED']).nullable(),
  controlSummary: NfcControlSummarySchema.nullable(),
  message: z.string(),
});

// =============================================
// NFC Reader
// =============================================

export const NfcReaderListItemSchema = z.object({
  no: z.number(),
  readerSeq: z.number(),
  readerName: z.string(),
  readerCode: z.string(),
  readerSerial: z.string().nullable(),
  readerStatus: z.enum(['ACTIVE', 'INACTIVE']),
  spaceSeq: z.number(),
  spaceName: z.string(),
  buildingName: z.string(),
  regDate: z.string(),
});

export const NfcReaderDetailSchema = z.object({
  readerSeq: z.number(),
  readerName: z.string(),
  readerCode: z.string(),
  readerSerial: z.string().nullable(),
  readerApiKey: z.string(),
  readerStatus: z.enum(['ACTIVE', 'INACTIVE']),
  spaceSeq: z.number(),
  spaceName: z.string(),
  spaceFloor: z.string(),
  buildingSeq: z.number(),
  buildingName: z.string(),
  readerIsdel: z.string(),
  regDate: z.string(),
  updDate: z.string(),
});

// =============================================
// NFC Card
// =============================================

export const NfcCardListItemSchema = z.object({
  no: z.number(),
  cardSeq: z.number(),
  tuSeq: z.number(),
  userName: z.string(),
  cardIdentifier: z.string(),
  cardAid: z.string().nullable(),
  cardLabel: z.string().nullable(),
  cardType: z.enum(['CARD', 'PHONE']),
  cardStatus: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']),
  lastTaggedAt: z.string().nullable(),
  regDate: z.string(),
});

export const NfcCardDetailSchema = z.object({
  cardSeq: z.number(),
  tuSeq: z.number(),
  userName: z.string(),
  userEmail: z.string(),
  cardIdentifier: z.string(),
  cardAid: z.string().nullable(),
  cardLabel: z.string().nullable(),
  cardType: z.enum(['CARD', 'PHONE']),
  cardStatus: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']),
  cardIsdel: z.string(),
  lastTaggedAt: z.string().nullable(),
  tagCount: z.number(),
  regDate: z.string(),
  updDate: z.string(),
});

// =============================================
// NFC Log
// =============================================

export const NfcLogTypeSchema = z.enum(['ENTER', 'EXIT', 'DENIED', 'UNKNOWN']);
export const NfcControlResultSchema = z.enum(['SUCCESS', 'FAIL', 'PARTIAL', 'SKIPPED']);

export const NfcControlDetailItemSchema = z.object({
  spaceDeviceSeq: z.number(),
  deviceName: z.string(),
  commandType: z.string(),
  resultStatus: z.enum(['SUCCESS', 'FAIL', 'TIMEOUT']),
  resultMessage: z.string().nullable(),
});

export const NfcLogListItemSchema = z.object({
  no: z.number(),
  nfcLogSeq: z.number(),
  readerName: z.string(),
  readerCode: z.string(),
  spaceName: z.string(),
  buildingName: z.string(),
  userName: z.string().nullable(),
  cardLabel: z.string().nullable(),
  logType: NfcLogTypeSchema,
  tagIdentifier: z.string(),
  controlResult: NfcControlResultSchema.nullable(),
  controlSummary: NfcControlSummarySchema.nullable(),
  taggedAt: z.string(),
});

export const NfcLogDetailSchema = z.object({
  nfcLogSeq: z.number(),
  readerSeq: z.number(),
  readerName: z.string(),
  readerCode: z.string(),
  spaceSeq: z.number(),
  spaceName: z.string(),
  buildingName: z.string(),
  cardSeq: z.number().nullable(),
  userName: z.string().nullable(),
  cardLabel: z.string().nullable(),
  cardType: z.enum(['CARD', 'PHONE']).nullable(),
  logType: NfcLogTypeSchema,
  tagIdentifier: z.string(),
  tagAid: z.string().nullable(),
  controlResult: NfcControlResultSchema.nullable(),
  controlDetails: z.array(NfcControlDetailItemSchema),
  taggedAt: z.string(),
});

// =============================================
// NFC Stats
// =============================================

export const NfcActiveSpaceSchema = z.object({
  spaceSeq: z.number(),
  spaceName: z.string(),
  currentUser: z.string(),
  enteredAt: z.string(),
});

export const NfcStatsSchema = z.object({
  readers: z.object({
    total: z.number(),
    active: z.number(),
    inactive: z.number(),
  }),
  cards: z.object({
    total: z.number(),
    active: z.number(),
    blocked: z.number(),
    inactive: z.number(),
    byType: z.object({
      CARD: z.number(),
      PHONE: z.number(),
    }),
  }),
  today: z.object({
    totalTags: z.number(),
    enters: z.number(),
    exits: z.number(),
    denied: z.number(),
    unknown: z.number(),
  }),
  activeSpaces: z.array(NfcActiveSpaceSchema),
});

// =============================================
// Paginated Responses
// =============================================

export const NfcReaderListResponseSchema = z.object({
  items: z.array(NfcReaderListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const NfcCardListResponseSchema = z.object({
  items: z.array(NfcCardListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const NfcLogListResponseSchema = z.object({
  items: z.array(NfcLogListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

// =============================================
// Unregistered Tags
// =============================================

export const UnregisteredTagItemSchema = z.object({
  tagIdentifier: z.string(),
  tagAid: z.string().nullable(),
  firstTaggedAt: z.string(),
  lastTaggedAt: z.string(),
  tagCount: z.number(),
  lastReaderName: z.string(),
  lastSpaceName: z.string(),
});

// =============================================
// NFC Reader Command Mapping
// =============================================

export const NfcDeviceCommandSchema = z.object({
  commandSeq: z.number(),
  commandName: z.string(),
  commandCode: z.string().optional(),
  commandType: z.string(),
});

export const NfcReaderCommandDeviceSchema = z.object({
  spaceDeviceSeq: z.number(),
  deviceName: z.string(),
  presetName: z.string(),
  deviceStatus: z.enum(['ACTIVE', 'INACTIVE']),
  isMapped: z.boolean(),
  enterCommand: NfcDeviceCommandSchema.nullable(),
  exitCommand: NfcDeviceCommandSchema.nullable(),
  availableCommands: z.array(NfcDeviceCommandSchema),
});

export const NfcReaderCommandMappingSchema = z.object({
  readerSeq: z.number(),
  readerName: z.string(),
  spaceSeq: z.number(),
  spaceName: z.string(),
  buildingName: z.string(),
  devices: z.array(NfcReaderCommandDeviceSchema),
  mappedCount: z.number(),
  totalDevices: z.number(),
});

// =============================================
// Type Exports
// =============================================

export type NfcTagRequest = z.infer<typeof NfcTagRequestSchema>;
export type NfcTagResponse = z.infer<typeof NfcTagResponseSchema>;
export type NfcReaderListItem = z.infer<typeof NfcReaderListItemSchema>;
export type NfcReaderDetail = z.infer<typeof NfcReaderDetailSchema>;
export type NfcCardListItem = z.infer<typeof NfcCardListItemSchema>;
export type NfcCardDetail = z.infer<typeof NfcCardDetailSchema>;
export type NfcLogListItem = z.infer<typeof NfcLogListItemSchema>;
export type NfcLogDetail = z.infer<typeof NfcLogDetailSchema>;
export type NfcStats = z.infer<typeof NfcStatsSchema>;
export type NfcReaderCommandMapping = z.infer<typeof NfcReaderCommandMappingSchema>;
