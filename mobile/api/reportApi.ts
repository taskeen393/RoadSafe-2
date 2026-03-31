import apiClient from '../services/apiClient';

export const submitReport = async (data: any) => {
  return apiClient.post('/report', data);
};
