import { config } from "dotenv" ; 
config ();

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

async function main(){
    const city = "Kericho";
    const apiKey = process.env.OpenWeather_APIKey;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    if (!response.ok){
        console.log(`Error: ${response.status} ${response.statusText}`);
        return ;
    }

    const data: WeatherResponse = await response.json();

    console.log(data);
   

}

main().catch(err => console.error(err));