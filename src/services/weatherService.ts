import { API_CONFIG, buildApiUrl } from '../config/api';
import { WeatherResponse } from '../types/Weather';

export const weatherService = {
  getWeather: async (countryCode: string, city: string): Promise<WeatherResponse> => {
    const url = buildApiUrl(API_CONFIG.endpoints.weather.get(countryCode, city));
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    return response.json();
  },
};

