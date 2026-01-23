/**
 * SOS Service
 * 
 * Handles SOS alerts and nearby emergency places:
 * - Send SOS alert to backend
 * - Fetch nearby hospitals, police, fire stations
 * - Get place phone numbers
 */

import apiClient, { externalApiClient, GOOGLE_API_KEY } from './apiClient';
import { Place, PlaceDetailsResponse, SOSRequest } from './types';

/**
 * Send SOS alert to backend
 */
export const sendSOSAlert = async (data: SOSRequest): Promise<void> => {
    try {
        await apiClient.post('/sos', data);
    } catch (error: any) {
        console.log('SOS alert error:', error.response?.data || error.message);
        throw error.response?.data || { msg: 'Failed to send SOS alert' };
    }
};

/**
 * Fetch nearby places from Google Places API
 * @param lat Latitude
 * @param lon Longitude
 * @param type Place type (hospital, police, fire_station)
 * @param radius Search radius in meters (default: 2000)
 */
export const getNearbyPlaces = async (
    lat: number,
    lon: number,
    type: string,
    radius: number = 2000
): Promise<Place[]> => {
    try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
        const response = await externalApiClient.get(url, {
            params: {
                location: `${lat},${lon}`,
                radius,
                type,
                key: GOOGLE_API_KEY,
            },
        });
        return response.data.results;
    } catch (error: any) {
        console.log('Nearby places error:', error.message);
        throw { msg: 'Unable to fetch nearby places' };
    }
};

/**
 * Get phone number for a place from Google Places Details API
 */
export const getPlacePhoneNumber = async (placeId: string): Promise<string | null> => {
    try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json`;
        const response = await externalApiClient.get<PlaceDetailsResponse>(url, {
            params: {
                place_id: placeId,
                fields: 'formatted_phone_number',
                key: GOOGLE_API_KEY,
            },
        });
        return response.data.result?.formatted_phone_number || null;
    } catch (error: any) {
        console.log('Place details error:', error.message);
        return null;
    }
};
