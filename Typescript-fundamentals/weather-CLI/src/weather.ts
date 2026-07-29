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

// weathercache interface 
interface WeatherCache {
    [cityName: string] : CachedWeather;

}
//weather forecast interface 3-day
interface ForecastResponse {
    list : Array<{
        dt_txt: string;
        main : { temp: number; humidity : number};
        weather : Array<{description: string}>;
    }>;
}


//loadcache function 
function loadCache() : WeatherCache {
    try{
        //reads weather.json file 
        const data = readFileSync('weather.json', 'utf-8');
        //converts JSON to human readable format 
        return JSON.parse(data);
    
    }
    catch{
        //Initialize an empty file 
        return {};
    }

}
//save function 
function saveCache( cache: WeatherCache): void {
    //writes into weather.json 
    writeFileSync("weather.json", JSON.stringify(cache, null, 2));
}

//displayWeather function displays weather condition 
function displayWeather ( city: string, newWeather: CachedWeather, isCached : Boolean, units: string): void{
    const symbol = units === "imperial" ? "°F" : "°C";
    const source = isCached ? "cache" : "Live API";

    console.log("------------------------------");
    console.log(`   Weather for ${city}`);
    console.log("------------------------------");
    console.log();
    console.log(`   Temperature : ${newWeather.temp}${symbol}`);
    console.log(`   Condition : ${newWeather.condition}`);
    console.log(`   Humidity : ${newWeather.humidity}`);
    console.log(`   WindSpeed : ${newWeather.windSpeed}`);
    console.log();
    console.log(`   Source : ${source}`);
    console.log(`   Fetched At : ${newWeather.fetchedAt}`);
    console.log("------------------------------");

}
//handleHttpError function. Error handling function 
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
//displayForecast function . Displays 3-day weather forecast of a city 
function displayForecast(city : string, data: ForecastResponse, units: string): void {
    console.log(`----------------------------------------`);
    console.log(`   3-Day weather Forecast for ${city}`);
    console.log(`----------------------------------------`);
    console.log();
    const symbol = units === "imperial" ? "°F" : "°C";
    const noonEntries  = data.list.filter( entry =>  entry.dt_txt.includes("12:00:00"));
    const threeDays = noonEntries.slice(0,3);
    
    for (const entry of threeDays){
        //Extracts the date only 
        const date = entry.dt_txt.split(" ")[0];

        console.log(`Date: ${date}`);
        console.log(`   Temperature : ${entry.main.temp}${symbol}`);
        console.log(`   Condition : ${entry.weather[0]?.description}`);
        console.log(`   Humidity : ${entry.main.humidity}`);
        console.log();

    }

    console.log(`----------------------------------------`);
    
}
//loadFavorites function.Lists all favorite cities using --favorites flag 
function loadFavorites() : string[] {
    try {
        const data = readFileSync('favorites.json', 'utf-8');
        return JSON.parse(data);
    }catch {
        return [];
    }
}
//saveFavorites function. Saves cities to favorites.json using --save flag 
function saveFavorites( favorites : string[]):void {
    writeFileSync('favorites.json', JSON.stringify(favorites, null , 2));
}
//async fucntion fetchCurrentWeather function which returns a promise. 
async function fetchCurrentWeather(city : string , units: string): Promise< CachedWeather | null>{
    const apiKey = process.env.OpenWeather_APIKey;
    if (!apiKey){
        console.error("API key not found");
        return null;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}` 
     try{
        const response = await fetch(url);
        if (!response.ok){
            handleHttpError(response.status);
            return null;
            
        }

        const data: WeatherResponse = await response.json();

        return {
        temp : data.main.temp,
        condition : data.weather[0]?.description || "unknown",
        humidity : data.main.humidity,
        windSpeed : data.wind.speed,
        fetchedAt : new Date().toISOString()
        }
    }catch (err){
        console.error(`Network error for ${city}`);
        return null;
    }

}
//async fetchForecast function which returns  a promise.
async function fetchForecast(city: string, units: string): Promise < ForecastResponse | null > {
    const apiKey = process.env.OpenWeather_APIKey;
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}`;
    try {
        const response = await fetch(url);
        if (!response.ok){
            handleHttpError(response.status);
            return null ;

        }
        return await response.json();
    }catch (err){
        console.error(`Network error for ${city}`);
        return null; 
    }


}

//Main function which handles most of the logic and implements the other global functions 
async function main(){
    
    const args = process.argv.slice(2);
    //Handling usecase where city is not provided 
    if (args.length === 0) {
        console.error("Usage: weather <city>");
        process.exit(1);
    }
    
        //fetch weather data 

    let isForecast = false;
    let units = "metric";
    let  city = "";
    let isSave = false;
    let isFavorite = false;
    //iterating through all the args using a for loop 
    for (let i = 0; i < args.length; i++){

        const arg = args[i];
        if (arg === "--forecast"){
            isForecast = true ;
        }
        else if (arg === "--units"){
             units = args[i + 1] || "";
             i++;
        }
        else if (arg === "--save"){
            isSave = true;
        }
        else if (arg === "--favorites"){
            isFavorite = true;
        }
       
        else {
            city = arg || "";
        }
           
    }
    //edge case where --save flag is used. 
    if (isSave){
        //show an error if no city is provided
        if (!city){
            console.error("Usage: weather [--forecast] <city>");
            process.exit(1);
         }
         //otherwise call the loadFavorites function 
         const favorites = loadFavorites();
         //if the city is already in favorites display the messae below 
         if (favorites.includes(city)){


            console.log(`${city} is already in favorites`);
            return ;
         }
        //otherwise add city to the favorites array 
         favorites.push(city);
         saveFavorites(favorites);
         console.log(`Saved ${city} to favorites`);
         return;
    }
    //edge case where --favorites is used. 
    if (isFavorite){
        const favorites = loadFavorites();
        //favorites is empty .
        if (favorites.length === 0){
            console.log('No favorites saved');
            return ;
        }
        //if only the --favorite flag is used list only city names
        if (!isForecast && args.length === 1){
            console.log('Favorite cities:')
            for (const fav of favorites){
                console.log(`   -${fav}`);
            }
            return ;
        }


        for (const fav of favorites){
            // if --forecast is used together with --favorites provide 3-day forecast for the favorite cities 
            if (isForecast){
                const data  = await fetchForecast(fav, units);
                if (data) displayForecast(fav, data, units);
            }
            //other the --forecast is not used provide the favorite cities with their current weather.
            else{
                const weather = await fetchCurrentWeather(fav, units);
                if (weather) displayWeather(fav, weather, false, units);
             }

        }
        return ;
    }
    
    const cache = loadCache();
    const cached = cache[city];
    //if city does not have a --forecast flag and is contained in weather.json 
    if (!isForecast && cached) {
        displayWeather(city, cached,  true, units);
        return ;
         // Done — no API call needed
    
    }
    //handles where the metric or imperial are not used 
    if (!["metric", "imperial"].includes(units)) {
        console.error("Usage: --units metric|imperial");
        process.exit(1);
    }

    const apiKey = process.env.OpenWeather_APIKey;
    //handles where an API key is not provided
    if (!apiKey) {
        console.error("API key not found. Check .env file.");
        process.exit(1);
    }
    //handles where --forecast is used 
    if (isForecast){
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}`;
        try{
            const response = await fetch(url);
            if (!response.ok){
                console.error(`Error ${response.status} for ${city}`);
                return;
            }

            const data : ForecastResponse = await response.json();
            displayForecast(city, data, units);
        }catch (err){
            console.error("Network error. Check your internet connection");
            console.error(err);
            process.exit(1);
        }
    
       
    }else {
        //where the --forecast is not used

        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
            
        
    
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


        displayWeather(city , newWeather, false, units);



    }catch (err){
        console.error("Network error. Check your internet connecion");

        console.error(err);

        process.exit(1);

    }

}   

}

main().catch(err => console.error(err));