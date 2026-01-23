// app/reportcontent.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../services/apiClient';

export interface ReportItem {
  _id: string; // MongoDB id
  user: string;
  userId: string;
  location: string;
  lat?: number;
  lon?: number;
  title: string;
  description: string;
  imageUris: string[];
  videoUris: string[];
  dateTime: string;
}

interface ReportContextType {
  reports: ReportItem[];
  addReport: (r: ReportItem) => void;
  refreshReports: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

const ReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<ReportItem[]>([]);

  // Add a single report to top of list
  const addReport = (r: ReportItem) => setReports(prev => [r, ...prev]);

  // Fetch all reports from backend
  const refreshReports = async () => {
    try {
      const res = await apiClient.get('/report');
      setReports(res.data.reverse()); // newest first
    } catch (err) {
      console.log('Error fetching reports:', err);
    }
  };

  useEffect(() => {
    refreshReports();

    // Optional: auto-refresh every 15s
    const interval = setInterval(() => {
      refreshReports();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ReportContext.Provider value={{ reports, addReport, refreshReports }}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReports = () => {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error('useReports must be used within ReportProvider');
  return ctx;
};

export default ReportProvider;
