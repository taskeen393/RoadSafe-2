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
    createdAt: string;
}

// ============ CHATBOT TYPES ============
export interface ChatbotRequest {
    user: string;
    message: string;
}

export interface ChatbotResponse {
    bot: string;
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
    };
    weather: Array<{
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
