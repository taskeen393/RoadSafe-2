/**
 * Weather Service
 * 
 * Handles weather-related API calls:
 * - Get current weather data
 * - Reverse geocoding
 * - City search autocomplete
 */

import { externalApiClient, LOCATIONIQ_KEY, OPENWEATHER_KEY } from './apiClient';
import { CitySearchResult, LocationInfo, WeatherData } from './types';

/**
 * Get current weather for a location
 */
export const getWeather = async (lat: number, lon: number): Promise<WeatherData> => {
    try {
        const response = await externalApiClient.get<WeatherData>(
            'https://api.openweathermap.org/data/2.5/weather',
            {
                params: {
                    lat,
                    lon,
                    units: 'metric',
                    appid: OPENWEATHER_KEY,
                },
            }
        );
        return response.data;
    } catch (error: any) {
        console.log('Weather error:', error.response?.data || error.message);
        throw { msg: 'Unable to fetch weather data' };
    }
};

/**
 * Reverse geocode coordinates to get location name
 */
export const reverseGeocode = async (lat: number, lon: number): Promise<LocationInfo> => {
    try {
        const response = await externalApiClient.get(
            'https://api.bigdatacloud.net/data/reverse-geocode-client',
            {
                params: {
                    latitude: lat,
                    longitude: lon,
                    localityLanguage: 'en',
                },
            }
        );
        return {
            city: response.data.city || response.data.locality || 'Unknown',
            locality: response.data.locality || '',
            countryName: response.data.countryName || '',
        };
    } catch (error: any) {
        console.log('Geocode error:', error.message);
        throw { msg: 'Unable to get location name' };
    }
};

/**
 * Search for cities with autocomplete
 */
export const searchCities = async (query: string): Promise<CitySearchResult[]> => {
    try {
        if (!query.trim()) return [];

        const response = await externalApiClient.get(
            'https://us1.locationiq.com/v1/autocomplete.php',
            {
                params: {
                    key: LOCATIONIQ_KEY,
                    q: query,
                    format: 'json',
                    limit: 5,
                },
            }
        );

        // Add unique IDs to prevent React key warnings
        return response.data.map((item: any, index: number) => ({
            ...item,
            uid: `${item.place_id}_${index}`,
        }));
    } catch (error: any) {
        console.log('City search error:', error.response?.data || error.message);
        return [];
    }
};

/**
 * Calculate landslide risk based on weather data
 */
export const calculateLandslideRisk = (weather: WeatherData): string => {
    const rain = weather.rain?.['1h'] || 0;
    const snow = weather.snow?.['1h'] || 0;

    if (rain >= 10 || snow >= 5) return 'High Risk';
    if (rain >= 5 || snow >= 2) return 'Moderate Risk';
    return 'Low Risk';
};
