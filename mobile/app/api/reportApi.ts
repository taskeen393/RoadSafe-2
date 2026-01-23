import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://192.168.2.104:5000/api';

export const submitReport = async (data: any) => {
  const token = await SecureStore.getItemAsync('token');

  return axios.post(
    `${BASE_URL}/report`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
};
