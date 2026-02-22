import { z } from 'zod';

// =============================================
// Preset
// =============================================

export const PresetCommandSchema = z.object({
  commandSeq: z.number(),
  commandName: z.string(),
  commandCode: z.string(),
  commandType: z.string(),
  commandOrder: z.number(),
});

export const PresetListItemSchema = z.object({
  no: z.number(),
  presetSeq: z.number(),
  presetName: z.string(),
  protocolType: z.string(),
  commIp: z.string().nullable(),
  commPort: z.number().nullable(),
  presetDescription: z.string().nullable(),
  commandCount: z.number(),
  deviceCount: z.number(),
  presetOrder: z.number(),
});

export const PresetDetailSchema = z.object({
  presetSeq: z.number(),
  presetName: z.string(),
  protocolType: z.string(),
  commIp: z.string().nullable(),
  commPort: z.number().nullable(),
  presetDescription: z.string().nullable(),
  presetOrder: z.number(),
  presetIsdel: z.string(),
  regDate: z.string(),
  updDate: z.string(),
  commands: z.array(PresetCommandSchema),
});

// =============================================
// Device
// =============================================

export const DeviceListItemSchema = z.object({
  no: z.number(),
  spaceDeviceSeq: z.number(),
  spaceSeq: z.number(),
  spaceName: z.string(),
  spaceFloor: z.string().nullable(),
  presetSeq: z.number(),
  presetName: z.string(),
  protocolType: z.string(),
  deviceName: z.string(),
  deviceIp: z.string(),
  devicePort: z.number(),
  deviceStatus: z.string(),
  deviceOrder: z.number(),
});

// =============================================
// Control
// =============================================

export const ControlCommandSchema = z.object({
  commandSeq: z.number(),
  commandName: z.string(),
  commandCode: z.string(),
  commandType: z.string(),
});

export const ControlDeviceSchema = z.object({
  spaceDeviceSeq: z.number(),
  deviceName: z.string(),
  presetSeq: z.number(),
  presetName: z.string(),
  protocolType: z.string(),
  deviceIp: z.string(),
  devicePort: z.number(),
  deviceStatus: z.string(),
  deviceOrder: z.number(),
  commands: z.array(ControlCommandSchema),
});

export const ControlSpaceItemSchema = z.object({
  spaceSeq: z.number(),
  spaceName: z.string(),
  spaceFloor: z.string().nullable(),
  spaceType: z.string().nullable(),
  deviceCount: z.number(),
});

export const ControlSpacesResponseSchema = z.object({
  buildingSeq: z.number(),
  buildingName: z.string(),
  spaces: z.array(ControlSpaceItemSchema),
});

export const SpaceDevicesResponseSchema = z.object({
  spaceSeq: z.number(),
  spaceName: z.string(),
  spaceFloor: z.string().nullable(),
  devices: z.array(ControlDeviceSchema),
});

// =============================================
// Execute Command
// =============================================

export const ExecuteCommandResultSchema = z.object({
  logSeq: z.number(),
  resultStatus: z.string(),
  resultMessage: z.string(),
  executedAt: z.string(),
});

export const BatchDeviceResultSchema = z.object({
  spaceDeviceSeq: z.number(),
  deviceName: z.string(),
  resultStatus: z.string(),
  resultMessage: z.string(),
});

export const ExecuteBatchResultSchema = z.object({
  spaceSeq: z.number(),
  spaceName: z.string(),
  totalDevices: z.number(),
  results: z.array(BatchDeviceResultSchema),
  successCount: z.number(),
  failCount: z.number(),
  executedAt: z.string(),
});

// =============================================
// Control Log
// =============================================

export const ControlLogItemSchema = z.object({
  no: z.number(),
  logSeq: z.number(),
  spaceName: z.string(),
  deviceName: z.string(),
  commandName: z.string(),
  commandType: z.string(),
  executedBy: z.string(),
  resultStatus: z.string(),
  resultMessage: z.string().nullable(),
  executedAt: z.string(),
});

export const ControlLogResponseSchema = z.object({
  items: z.array(ControlLogItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

// =============================================
// Type Exports
// =============================================

export type PresetCommand = z.infer<typeof PresetCommandSchema>;
export type PresetListItem = z.infer<typeof PresetListItemSchema>;
export type PresetDetail = z.infer<typeof PresetDetailSchema>;
export type DeviceListItem = z.infer<typeof DeviceListItemSchema>;
export type ControlDevice = z.infer<typeof ControlDeviceSchema>;
export type ControlSpacesResponse = z.infer<typeof ControlSpacesResponseSchema>;
export type SpaceDevicesResponse = z.infer<typeof SpaceDevicesResponseSchema>;
export type ExecuteCommandResult = z.infer<typeof ExecuteCommandResultSchema>;
export type ExecuteBatchResult = z.infer<typeof ExecuteBatchResultSchema>;
export type ControlLogItem = z.infer<typeof ControlLogItemSchema>;
