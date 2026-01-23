import axios from 'axios';

const BASE_URL = 'http://192.168.2.104:5000/api';

type SignupData = {
  name: string;
  email: string;
  password: string;
};

type LoginData = {
  email: string;
  password: string;
};

export const signup = async (data: SignupData) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/signup`, data);
    return response;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const login = async (data: LoginData) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, data);
    return response;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
