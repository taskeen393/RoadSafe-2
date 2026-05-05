import { externalApiClient } from './apiClient';
import { DisasterAlert } from './types';

/**
 * Disaster Service (Real-time GDACS Implementation)
 * 
 * Fetches ongoing disaster events (Earthquakes, Floods, Tropical Cyclones)
 * using the GDACS GeoJSON feed.
 */

const GDACS_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;FL;TC';

/**
 * Get Disaster Alerts (Filtered for Pakistan region)
 */
export const getDisasterAlerts = async (): Promise<DisasterAlert[]> => {
    try {
        const response = await externalApiClient.get(GDACS_URL);
        
        if (!response.data || !response.data.features) return [];

        const searchName = 'Pakistan';

        return response.data.features
            .filter((f: any) => {
                const props = f.properties || {};
                const affectedCountries = props.affectedcountries || [];
                
                // Check if Pakistan is in affected countries or iso3 matches
                return (
                    (props.iso3 === 'PAK') ||
                    (props.name && props.name.toUpperCase().includes(searchName.toUpperCase())) ||
                    affectedCountries.some((c: any) => 
                        (c.iso3 === 'PAK') || 
                        (c.countryname && c.countryname.toUpperCase() === searchName.toUpperCase())
                    )
                );
            })
            .map((f: any) => {
                const props = f.properties || {};
                const geometry = f.geometry || {};
                const [lon, lat] = geometry.coordinates || [0, 0];

                return {
                    id: f.id || Math.random().toString(36).substr(2, 9),
                    type: props.eventtype || 'Alert',
                    title: props.name || 'Natural Disaster',
                    description: props.description || 'Live alert in the region.',
                    severity: props.alertlevel || 'Green',
                    location: props.name || 'Pakistan',
                    lat,
                    lon,
                    dateTime: props.fromdate || new Date().toISOString(),
                    url: `https://www.gdacs.org/report.aspx?eventtype=${props.eventtype}&eventid=${props.eventid}`,
                };
            });
    } catch (error: any) {
        console.log('Disaster fetch error:', error.message);
        return [];
    }
};
