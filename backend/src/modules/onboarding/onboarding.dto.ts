import { IsString, IsDateString, IsArray, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class StartOnboardingDto {
    @IsString()
    userId: string;

    @IsString()
    fullName: string;
}

export class SubmitCosmicDataDto {
    @IsDateString()
    birthDate: string;

    @IsString()
    birthTime: string; // HH:MM format

    @IsString()
    birthPlace: string;

    @IsOptional()
    @IsString()
    birthCity?: string;

    @IsOptional()
    @IsString()
    birthState?: string;

    @IsOptional()
    @IsString()
    birthCountry?: string;

    @IsOptional()
    @IsString()
    birthTimezone?: string;
}

// Big Five psychometric assessment
export class SubmitPsychometricDto {
    @IsArray()
    @IsNumber({}, { each: true })
    answers: number[]; // Array of 10 answers (1-5 scale)
}

export class SubmitNarrativeDto {
    @IsOptional()
    @IsString()
    decisiveMoment?: string;

    @IsOptional()
    @IsString()
    frustration?: string;

    @IsOptional()
    @IsString()
    dream?: string;
}
