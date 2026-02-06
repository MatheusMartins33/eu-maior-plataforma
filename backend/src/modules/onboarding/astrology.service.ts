import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeocodingResult {
    lat: number;
    lng: number;
    city: string;
    country: string;
    timezone: string;
}

export interface NatalChartInput {
    date: string;
    time: string;
    latitude: number;
    longitude: number;
    timezone: string;
}

export interface NatalChartResult {
    sunSign: string;
    moonSign: string;
    ascendant: string;
    planets: Array<{
        name: string;
        sign: string;
        house: number;
        degree: number;
    }>;
    aspects: Array<{
        planet1: string;
        planet2: string;
        aspectType: string;
        orb: number;
    }>;
    houses: Array<{
        number: number;
        sign: string;
        degree: number;
    }>;
}

@Injectable()
export class AstrologyService {
    private readonly logger = new Logger(AstrologyService.name);

    constructor(private readonly config: ConfigService) { }

    /**
     * Geocode a location using Nominatim
     */
    async geocode(location: string): Promise<GeocodingResult> {
        this.logger.log(`Geocoding location: ${location}`);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`,
                {
                    headers: {
                        'User-Agent': 'EU_MAIOR_APP/1.0',
                    },
                }
            );

            const data = await response.json();

            if (!data || data.length === 0) {
                throw new Error(`Could not geocode location: ${location}`);
            }

            const result = data[0];

            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                city: result.name || location.split(',')[0],
                country: result.display_name?.split(',').pop()?.trim() || 'Unknown',
                timezone: this.estimateTimezone(parseFloat(result.lon)),
            };
        } catch (error) {
            this.logger.error(`Geocoding failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate natal chart using external Astrology API
     */
    async generateNatalChart(input: NatalChartInput): Promise<NatalChartResult> {
        this.logger.log(`Generating natal chart for: ${input.date} ${input.time}`);

        const apiUrl = this.config.get('ASTROLOGER_API_URL');
        const apiKey = this.config.get('ASTROLOGER_API_KEY');

        // If no API configured, return mock data for development
        if (!apiUrl || !apiKey) {
            this.logger.warn('Astrologer API not configured, returning mock data');
            return this.getMockNatalChart(input);
        }

        try {
            const [year, month, day] = input.date.split('-').map(Number);
            const [hour, minute] = input.time.split(':').map(Number);

            const payload = {
                subject: {
                    year,
                    month,
                    day,
                    hour,
                    minute,
                    city: 'Location',
                    latitude: input.latitude,
                    longitude: input.longitude,
                    timezone: input.timezone,
                    zodiac_type: 'Tropic',
                    houses_system_identifier: 'P',
                },
                language: 'PT',
            };

            const response = await fetch(`${apiUrl}/natal-aspects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Astrologer API error: ${response.status}`);
            }

            const data = await response.json();
            return this.parseAstrologerResponse(data);

        } catch (error) {
            this.logger.error(`Astrologer API failed: ${error.message}`);
            // Fallback to mock data
            return this.getMockNatalChart(input);
        }
    }

    /**
     * Parse Astrologer API response into our format
     */
    private parseAstrologerResponse(data: any): NatalChartResult {
        // Adapt this based on actual API response structure
        const planets = data.points || [];
        const aspects = data.aspects || [];

        const getSun = planets.find((p: any) => p.name === 'Sun');
        const getMoon = planets.find((p: any) => p.name === 'Moon');
        const getAsc = planets.find((p: any) => p.name === 'Asc');

        return {
            sunSign: getSun?.sign || 'Unknown',
            moonSign: getMoon?.sign || 'Unknown',
            ascendant: getAsc?.sign || 'Unknown',
            planets: planets.map((p: any) => ({
                name: p.name,
                sign: p.sign,
                house: p.house || 1,
                degree: p.abs_pos || 0,
            })),
            aspects: aspects.map((a: any) => ({
                planet1: a.p1_name,
                planet2: a.p2_name,
                aspectType: a.aspect,
                orb: a.orb || 0,
            })),
            houses: [], // Add if API provides
        };
    }

    /**
     * Mock natal chart for development without API
     */
    private getMockNatalChart(input: NatalChartInput): NatalChartResult {
        // Simple sun sign calculation based on date
        const sunSign = this.calculateSunSign(input.date);

        return {
            sunSign,
            moonSign: 'Scorpio', // Mock
            ascendant: 'Capricorn', // Mock
            planets: [
                { name: 'Sun', sign: sunSign, house: 10, degree: 15 },
                { name: 'Moon', sign: 'Scorpio', house: 4, degree: 22 },
                { name: 'Mercury', sign: sunSign, house: 10, degree: 8 },
                { name: 'Venus', sign: sunSign, house: 10, degree: 14.5 },
                { name: 'Mars', sign: 'Virgo', house: 2, degree: 5 },
                { name: 'Jupiter', sign: 'Sagittarius', house: 5, degree: 18 },
                { name: 'Saturn', sign: 'Aquarius', house: 7, degree: 12 },
                { name: 'Uranus', sign: 'Taurus', house: 10, degree: 28 },
                { name: 'Neptune', sign: 'Pisces', house: 8, degree: 20 },
                { name: 'Pluto', sign: 'Capricorn', house: 6, degree: 25 },
            ],
            aspects: [
                { planet1: 'Sun', planet2: 'Venus', aspectType: 'conjunction', orb: 0.58 },
                { planet1: 'Moon', planet2: 'Pluto', aspectType: 'square', orb: 3.2 },
                { planet1: 'Mercury', planet2: 'Saturn', aspectType: 'trine', orb: 4.1 },
                { planet1: 'Mars', planet2: 'Jupiter', aspectType: 'square', orb: 2.8 },
                { planet1: 'Venus', planet2: 'Neptune', aspectType: 'sextile', orb: 5.5 },
            ],
            houses: [],
        };
    }

    /**
     * Simple sun sign calculation
     */
    private calculateSunSign(date: string): string {
        const [, month, day] = date.split('-').map(Number);

        const signs = [
            { sign: 'Capricorn', start: [12, 22], end: [1, 19] },
            { sign: 'Aquarius', start: [1, 20], end: [2, 18] },
            { sign: 'Pisces', start: [2, 19], end: [3, 20] },
            { sign: 'Aries', start: [3, 21], end: [4, 19] },
            { sign: 'Taurus', start: [4, 20], end: [5, 20] },
            { sign: 'Gemini', start: [5, 21], end: [6, 20] },
            { sign: 'Cancer', start: [6, 21], end: [7, 22] },
            { sign: 'Leo', start: [7, 23], end: [8, 22] },
            { sign: 'Virgo', start: [8, 23], end: [9, 22] },
            { sign: 'Libra', start: [9, 23], end: [10, 22] },
            { sign: 'Scorpio', start: [10, 23], end: [11, 21] },
            { sign: 'Sagittarius', start: [11, 22], end: [12, 21] },
        ];

        for (const { sign, start, end } of signs) {
            if (
                (month === start[0] && day >= start[1]) ||
                (month === end[0] && day <= end[1])
            ) {
                return sign;
            }
        }

        return 'Capricorn'; // Default
    }

    /**
     * Estimate timezone from longitude
     */
    private estimateTimezone(longitude: number): string {
        const offset = Math.round(longitude / 15);
        const sign = offset >= 0 ? '+' : '';
        return `UTC${sign}${offset}`;
    }
}
