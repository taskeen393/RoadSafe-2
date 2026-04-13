import React, { createContext, useContext, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useToast } from '../components/ToastContext';
import { landslideService, disasterService } from '../services';

const PROXIMITY_THRESHOLD_KM = 1.0; // 1km alert
const ALERT_COOLDOWN_MS = 1000 * 60 * 30; // 30 minutes cooldown per spot

interface ProximityAlertContextType { }

const ProximityAlertContext = createContext<ProximityAlertContextType | undefined>(undefined);

export const ProximityAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const lastAlertedSpots = useRef<Record<string, number>>({});
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  /**
   * Helper: Haversine distance
   */
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const checkProximity = async (currentLat: number, currentLon: number) => {
    const now = Date.now();

    // 1. Check Landslide History
    const landslides = landslideService.getHistoricalEvents();
    for (const spot of landslides) {
      const dist = calculateDistance(currentLat, currentLon, spot.lat, spot.lon);

      if (dist <= PROXIMITY_THRESHOLD_KM) {
        const lastAlertTime = lastAlertedSpots.current[spot.id] || 0;
        if (now - lastAlertTime > ALERT_COOLDOWN_MS) {
          showToast({
            type: 'warning',
            title: 'Danger Zone / خطرناک علاقہ',
            message: `Entering a historical landslide area: ${spot.location}.\nاس علاقے میں پہلے لینڈ سلائیڈنگ ہو چکی ہے۔ احتیاط سے سفر کریں۔`,
          });
          lastAlertedSpots.current[spot.id] = now;
          return; // Trigger one alert at a time to avoid spam
        }
      }
    }

    // 2. Check Active Disaster Alerts (from service)
    try {
      const activeAlerts = await disasterService.getDisasterAlerts();
      for (const alert of activeAlerts) {
        const dist = calculateDistance(currentLat, currentLon, alert.lat, alert.lon);

        if (dist <= PROXIMITY_THRESHOLD_KM * 5) { // 5km for active disasters
          const lastAlertTime = lastAlertedSpots.current[alert.id] || 0;
          if (now - lastAlertTime > ALERT_COOLDOWN_MS) {
            showToast({
              type: 'error',
              title: 'Critical Alert / شدید خطرہ',
              message: `Active Disaster Nearby: ${alert.title}. ${alert.description}`,
            });
            lastAlertedSpots.current[alert.id] = now;
            return;
          }
        }
      }
    } catch (err) {
      console.log('Proximity Alert disaster check failed');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // Every 30 seconds
          distanceInterval: 500, // Every 500 meters
        },
        (location) => {
          if (isMounted) {
            checkProximity(location.coords.latitude, location.coords.longitude);
          }
        }
      );
    };

    startLocationTracking();

    return () => {
      isMounted = false;
      locationSubscription.current?.remove();
    };
  }, []);

  return (
    <ProximityAlertContext.Provider value={{}}>
      {children}
    </ProximityAlertContext.Provider>
  );
};

export const useProximityAlerts = () => {
  const context = useContext(ProximityAlertContext);
  if (context === undefined) {
    throw new Error('useProximityAlerts must be used within a ProximityAlertProvider');
  }
  return context;
};
