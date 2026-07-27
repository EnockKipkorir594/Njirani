import { config } from "dotenv" ; 
import { readFileSync, writeFileSync } from "node:fs";

config ();
//weather response body 
interface WeatherResponse {
    main : {
        temp : number;
        humidity : number;
    };
    weather : Array<{
        description : string;

    }>
    wind: {
        speed: number;
    }

    name : string;
}
//cachedweather object 
interface CachedWeather{
    temp : number;
    condition : string;
    humidity : number;
    windSpeed: number;
    fetchedAt: string;
}

// weathercache object 
interface WeatherCache {
    [cityName: string] : CachedWeather;

}

function loadCache() : WeatherCache {
    try{
        const data = readFileSync('weather.json', 'utf-8');
        return JSON.parse(data);
    
    }
    catch{
        //Initialize an empty file 
        return {};
    }

}

function saveCache( cache: WeatherCache): void {
    writeFileSync("weather.json", JSON.stringify(cache, null , 2));
}

function displayWeather ( city: string, newWeather: CachedWeather, isCached : Boolean): void{

    const source = isCached ? "cache" : "Live API";

    console.log("------------------------------");
    console.log(`   Weather for ${city}`);
    console.log("------------------------------");
    console.log();
    console.log(`   Temperature : ${newWeather.temp}`);
    console.log(`   Condition : ${newWeather.condition}`);
    console.log(`   Humidity : ${newWeather.humidity}`);
    console.log(`   WindSpeed : ${newWeather.windSpeed}`);
    console.log();
    console.log(`   Source : ${source}`);
    console.log(`   Fetched At : ${newWeather.fetchedAt}`);
    console.log("------------------------------");

}


async function main(){
    
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Usage: weather <city>")
        process.exit(1);
    }
    const city = args[0] || "London";
    const cache = loadCache();
    if (cache[city]) {
        displayWeather(city , cache[city], true);
        return;  // Done — no API call needed

    }
    const apiKey = process.env.OpenWeather_APIKey;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);

    if (!response.ok){
        console.log(`Error: ${response.status} ${response.statusText}`);
        return ;
    }

    const data: WeatherResponse = await response.json();

    const newWeather : CachedWeather = {
        temp : data.main.temp,
        condition : data.weather[0]?.description || "unknown",
        humidity : data.main.humidity,
        windSpeed : data.wind.speed,
        fetchedAt : new Date().toISOString()
    }

    cache[city] = newWeather;
    saveCache(cache);


    displayWeather(city , newWeather, false);
   


}

main().catch(err => console.error(err));