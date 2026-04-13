import { LandslideEvent } from './types';
import { weatherService } from './index';

// Historical Landslide Data for Pakistan
const HISTORICAL_DATA: LandslideEvent[] = require('../assets/data/landslide_data_pakistan.json');

/**
 * Service to manage landslide data and risk calculation
 */

export const landslideService = {
  /**
   * Get all historical landslide events
   */
  getHistoricalEvents(): LandslideEvent[] {
    return HISTORICAL_DATA;
  },

  /**
   * Calculate current landslide risk for a coordinate
   * 1: Low, 2-3: Medium, 4: High, 5: Critical
   * Based on historical frequency + current rainfall
   */
  async calculateCurrentRisk(lat: number, lon: number): Promise<{
    score: number;
    level: 'Low' | 'Medium' | 'High' | 'Critical';
    reasons: string[];
  }> {
    let score = 1;
    const reasons: string[] = [];

    // 1. Check Historical Proximity (Radius of 25km)
    const RADIUS_KM = 25;
    const nearbyEvents = HISTORICAL_DATA.filter(event => {
      const dist = this.calculateDistance(lat, lon, event.lat, event.lon);
      return dist <= RADIUS_KM;
    });

    if (nearbyEvents.length > 0) {
      score += Math.min(2, nearbyEvents.length * 0.5); // Add up to 2 points for history
      reasons.push(`${nearbyEvents.length} historical landslides recorded in this region.`);
    }

    // 2. Fetch Current Rainfall
    try {
      const weather = await weatherService.getWeather(lat, lon);
      const rain = weather.rain?.['1h'] || 0;

      if (rain > 15) {
        score += 3;
        reasons.push(`Critical rainfall detected: ${rain}mm/h.`);
      } else if (rain > 5) {
        score += 1.5;
        reasons.push(`Moderate rainfall detected: ${rain}mm/h.`);
      }
    } catch (err) {
      console.log('Weather rainfall fetch failed for landslide risk');
    }

    // Determine Level
    let level: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    if (score >= 4.5) level = 'Critical';
    else if (score >= 3.5) level = 'High';
    else if (score >= 2.5) level = 'Medium';

    return { score, level, reasons };
  },

  /**
   * Helper: Haversine distance
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
};
