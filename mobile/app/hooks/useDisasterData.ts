import { useEffect, useState } from 'react';
import { disasterService, landslideService } from '../../services';
import { DisasterAlert, LandslideEvent } from '../../services/types';

/**
 * Hook to share disaster and landslide data globally
 */
export function useDisasterData() {
  const [disasters, setDisasters] = useState<DisasterAlert[]>([]);
  const [landslideHistory, setLandslideHistory] = useState<LandslideEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel fetch for alerts and historical data
      const [alerts, history] = await Promise.all([
        disasterService.getDisasterAlerts(),
        Promise.resolve(landslideService.getHistoricalEvents()) // Historical is local JSON
      ]);
      setDisasters(alerts);
      setLandslideHistory(history);
    } catch (error) {
      console.log('Global Disaster Data fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { disasters, landslideHistory, loading, refresh: fetchData };
}
