/**
 * TypeScript types for API requests and responses
 */

// ============ AUTH TYPES ============
export interface User {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignupRequest {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

// ============ REPORT TYPES ============
export interface ReportRequest {
    user: string;
    location: string;
    lat: number;
    lon: number;
    title: string;
    description: string;
    imageUris: string[];
    videoUris: string[];
    voiceUri?: string; // local file URI for upload
    dateTime: string;
}

export interface ReportResponse {
    _id: string;
    user: string;
    userId?: string;
    userProfileImage?: string;
    location: string;
    lat?: number;
    lon?: number;
    title: string;
    description: string;
    imageUris: string[];
    videoUris: string[];
    voiceUri?: string; // Cloudinary URL
    createdAt: string;
}

// ============ CHATBOT TYPES ============
export interface ChatbotRequest {
    message: string;
    country?: string;
}

export interface ChatbotResponse {
    success: boolean;
    reply: string;
}

// ============ SOS TYPES ============
export interface SOSRequest {
    user: string;
    message: string;
}

export interface Place {
    place_id: string;
    name: string;
    vicinity: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
}

export interface PlaceDetailsResponse {
    result: {
        formatted_phone_number?: string;
    };
}

// ============ WEATHER TYPES ============
export interface WeatherData {
    main: {
        temp: number;
        humidity: number;
        pressure: number;
    };
    weather: Array<{
        main: string;
        description: string;
        icon: string;
    }>;
    wind: {
        speed: number;
    };
    rain?: {
        '1h'?: number;
    };
    snow?: {
        '1h'?: number;
    };
}

export interface LocationInfo {
    city: string;
    locality: string;
    countryName: string;
}

export interface CitySearchResult {
    place_id: string;
    display_name: string;
    lat: string;
    lon: string;
}

// ============ DISASTER TYPES ============
export interface DisasterAlert {
    id: string;
    type: string;
    title: string;
    description: string;
    severity: 'Green' | 'Yellow' | 'Orange' | 'Red';
    location: string;
    lat: number;
    lon: number;
    dateTime: string;
    url?: string;
}

export interface LandslideEvent {
    id: string;
    lat: number;
    lon: number;
    date: string;
    severity: 'Low' | 'Medium' | 'High';
    cause: string;
    location: string;
}
