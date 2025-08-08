export enum ProfileStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  INCOMPLETE = 'incomplete'
}

export interface ProfileValidation {
  isValid: boolean;
  missingFields: string[];
  status: ProfileStatus;
  completionPercentage: number;
}

export interface ProfileField {
  name: string;
  required: boolean;
  type: 'string' | 'date' | 'location';
  validation?: (value: any) => boolean;
}

export const REQUIRED_PROFILE_FIELDS = [
  'full_name',
  'data_nascimento',
  'local_nascimento'
] as const;

export const OPTIONAL_PROFILE_FIELDS = [
  'hora_nascimento',
  'cidade_nascimento',
  'estado_nascimento',
  'pais_nascimento'
] as const;

export type RequiredProfileField = typeof REQUIRED_PROFILE_FIELDS[number];
export type OptionalProfileField = typeof OPTIONAL_PROFILE_FIELDS[number];
export type ProfileFieldName = RequiredProfileField | OptionalProfileField;