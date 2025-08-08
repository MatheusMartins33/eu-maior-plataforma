import { ProfileStatus, ProfileValidation, REQUIRED_PROFILE_FIELDS, OPTIONAL_PROFILE_FIELDS } from '@/types/profile';

// Define the Profile interface based on the current context structure
interface Profile {
  id?: string;
  full_name?: string | null;
  data_nascimento?: string | null;
  hora_nascimento?: string | null;
  local_nascimento?: string | null;
  cidade_nascimento?: string | null;
  estado_nascimento?: string | null;
  pais_nascimento?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Validates if a profile is complete based on required fields and status
 */
export const validateProfile = (profile: Profile | null): ProfileValidation => {
  if (!profile) {
    return {
      isValid: false,
      missingFields: [...REQUIRED_PROFILE_FIELDS],
      status: ProfileStatus.PENDING,
      completionPercentage: 0
    };
  }

  const missingFields: string[] = [];
  let filledRequiredFields = 0;

  // Check required fields
  REQUIRED_PROFILE_FIELDS.forEach(field => {
    const value = profile[field as keyof Profile];
    if (!value || (typeof value === 'string' && !value.trim())) {
      missingFields.push(field);
    } else {
      filledRequiredFields++;
    }
  });

  // Calculate completion percentage
  const totalRequiredFields = REQUIRED_PROFILE_FIELDS.length;
  const completionPercentage = Math.round((filledRequiredFields / totalRequiredFields) * 100);

  // Determine status based on validation and current status
  let status: ProfileStatus;
  
  if (profile.status === ProfileStatus.COMPLETED && missingFields.length === 0) {
    status = ProfileStatus.COMPLETED;
  } else if (profile.status === ProfileStatus.IN_PROGRESS || missingFields.length > 0) {
    status = missingFields.length === totalRequiredFields ? ProfileStatus.PENDING : ProfileStatus.INCOMPLETE;
  } else if (missingFields.length === 0 && profile.status !== ProfileStatus.COMPLETED) {
    // Profile has all required fields but status is not completed
    status = ProfileStatus.INCOMPLETE;
  } else {
    status = ProfileStatus.PENDING;
  }

  return {
    isValid: missingFields.length === 0 && status === ProfileStatus.COMPLETED,
    missingFields,
    status,
    completionPercentage
  };
};

/**
 * Simple helper to check if profile is complete
 */
export const isProfileComplete = (profile: Profile | null): boolean => {
  const validation = validateProfile(profile);
  return validation.isValid;
};

/**
 * Get human-readable field names for missing fields
 */
export const getFieldDisplayNames = (fields: string[]): string[] => {
  const displayNames: Record<string, string> = {
    full_name: 'Nome completo',
    data_nascimento: 'Data de nascimento',
    local_nascimento: 'Local de nascimento',
    hora_nascimento: 'Hora de nascimento',
    cidade_nascimento: 'Cidade de nascimento',
    estado_nascimento: 'Estado de nascimento',
    pais_nascimento: 'País de nascimento'
  };

  return fields.map(field => displayNames[field] || field);
};

/**
 * Check if profile has minimum required data for a specific feature
 */
export const hasMinimumProfileData = (profile: Profile | null): boolean => {
  if (!profile) return false;
  
  // At minimum, we need full_name and data_nascimento for basic functionality
  return !!(
    profile.full_name?.trim() && 
    profile.data_nascimento?.trim()
  );
};

/**
 * Get profile completion status message
 */
export const getProfileStatusMessage = (validation: ProfileValidation): string => {
  if (validation.isValid) {
    return 'Perfil completo';
  }
  
  if (validation.completionPercentage === 0) {
    return 'Perfil não iniciado';
  }
  
  if (validation.completionPercentage < 100) {
    return `Perfil ${validation.completionPercentage}% completo`;
  }
  
  return 'Perfil incompleto';
};