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

interface ForecastResponse {
    list : Array<{
        dt_txt: string;
        main : { temp: number; humidity : number};
        weather : Array<{description: string}>;
    }>;
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
    writeFileSync("weather.json", JSON.stringify(cache, null, 2));
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

function handleHttpError( status: number): void {
    //Erro handling logic 
    if (status === 401) {
        console.error("Invalid API Key. Check your .env file. ");

    }

    else if(status === 404){

        console.error("City not found. Check spelling or try a different city.");
    }
    else if (status === 429){
        console.error("Too many requests. Wait a few minutes.");
    }
    else {
        console.error(`Error: ${status}`);
    }
    process.exit(1);
}

function displayForecast(city : string, data: ForecastResponse): void {
    console.log(`----------------------------------------`);
    console.log(`   3-Day weather Forecast for ${city}`);
    console.log(`----------------------------------------`);
    console.log();

    const noonEntries  = data.list.filter( entry =>  entry.dt_txt.includes("12:00:00"));
    const threeDays = noonEntries.slice(0,3);
    
    for (const entry of threeDays){
        const date = entry.dt_txt.split(" ")[0];

        console.log(`Date: ${date}`);
        console.log(`   Temperature : ${entry.main.temp}C`);
        console.log(`   Condition : ${entry.weather[0]?.description}`);
        console.log(`   Humidity : ${entry.main.humidity}`);
        console.log();

    }

    console.log(`----------------------------------------`);
    
}


async function main(){
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error("Usage: weather <city>");
        process.exit(1);
    }
    
        //fetch weather data 

    let isForecast = false;
    let  city : string;
    if (args[0] === "--forecast"){
        isForecast = true ;
        city  = args[1] as string;
    }else {
        isForecast = false ;
        city = args[0] as string ;
        }
    
    if (!city){
        console.error("Usage: weather [--forecast] <city>");
        process.exit(1);
        }
    
    const cache = loadCache();
    const cached = cache[city];

    if (!isForecast && cached) {
        displayWeather(city, cached,  true);
         // Done — no API call needed
    
    }
    const apiKey = process.env.OpenWeather_APIKey;

    if (!apiKey) {
        console.error("API key not found. Check .env file.");
        process.exit(1);
    }

    if (isForecast){
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
        try{
            const response = await fetch(url);
            if (!response.ok){
                handleHttpError(response.status);
                return;
            }

            const data : ForecastResponse = await response.json();
            displayForecast(city, data);
        }catch (err){
            console.error("Network error. Check your internet connection");
            console.error(err);
            process.exit(1);
        }
    
       
    }else {

        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
            
        
    
     try{
        const response = await fetch(url);
        if (!response.ok){
            handleHttpError(response.status);
            
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



    }catch (err){
        console.error("Network error. Check your internet connecion");
        console.error(err);
        process.exit(1);

    }
    
}   

}

main().catch(err => console.error(err));