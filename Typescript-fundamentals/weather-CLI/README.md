# Weather CLI Tool 
A simple weather CLI that fetches Weather data from OpenWeatherMap API.Supports caching, 
handles duplicates, unit toggling, fetch 3-day weather forecast, list current weather for your 
favorite cities. 

## Prerequisites 

- **Node.js v18+**
- **Typescript**
- **OpenWeatherMap API Key**

## Installation 
```bash 
git clone 'https://github.com/EnockKipkorir594/Njirani'
cd weather-CLI 
npm install 
#Create your .env and add your API Key 
echo "OpenWeather_APIKey=your API key here" > .env

```
## Usage Examples 
```bash 
#Displays Nairobi's current weather condition
npx tsx src/weather.ts "Nairobi"
#Use --units flag to toggle units (Fahrenheit)
npx tsx src/weather.ts --units imperial Nairobi
#3-Day forecast 
npx tsx src/weather.ts --forecast Nairobi 
#Using --save flag saves a city to favorites
npx tsx src/weather.ts  --save "Nairobi"
#List of favorite cities 
npx tsx src/weather.ts --favorites 
#returning forecast of the favorite cities 
npx tsx src/weather.ts --favorites --forecast Nairobi

```

## Features List 
- Checks the weather of a particular location (city)
- Handles caching through weather of an already searched city rather than callig the API 
- Saves favorite cities 
- Fetching weather data for favorite cities. 
- Unit toggling: changing unit from celcius to fahrenheit.
- 3-day weather forecast. Returns weather condition of a place for the last 3 days.
- Error handling bad data like nonexistent city names.Bad API keys.


## Folder Structure 
```bash 
weather-cli/
├── src/
│   └── weather.ts
├── .env
├── .gitignore
├── favorites.json
├── weather.json
├── package.json
└── README.md

```

## Error Messages Reference 
| Error | cause | fix |
| -- | -- | -- |
| CIty not found | Misspelled city name or city does not exist | Rewrite city name |
| Bad API key | check your .env API key | Get a new key |
| Too many requests | RateLimiter | Wait a few mins before making a request | 
| Network Error | Not connected to a network | Connect ot an internet connection | 

 