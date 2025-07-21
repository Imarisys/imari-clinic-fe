export interface WeatherUnits {
  time: string;
  temperature_2m: string;
  relative_humidity_2m: string;
  precipitation: string;
  weathercode: string;
  windspeed_10m: string;
}

export interface HourlyForecast {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation: number[];
  weathercode: number[];
  windspeed_10m: number[];
}

export interface WeatherForecast {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: WeatherUnits;
  hourly: HourlyForecast;
}

export interface WeatherResponse {
  city: string;
  country: string;
  coordinates: {
    [key: string]: number;
  };
  forecast: WeatherForecast;
}
