function calculator (num1: number, operator: string, num2: number){
    switch (operator) {
        case "+":
            return num1 + num2;
        case "-":
            return num1 - num2;
        case "*":
            return num1 * num2;
        case "/":
            if (num2 === 0) {
                throw new Error("Cannot divide by zero");
            }
            return num1 / num2;
        default:
            throw new Error("Invalid operator");
    };

};

import {readFile, writeFile} from "fs/promises";

async function savedHistory(entry:{ num1: number, operator: string, num2: number, result: number }){
    let history = [];
    try{
        const data = await readFile("history.json", "utf-8");
        history = JSON.parse(data);
    }catch{

    }
    history.push({ ...entry, timestamp: new Date() .toISOString()});
    if (history.length > 10) history.shift();
    
    await writeFile("history.json", JSON.stringify(history, null, 2));

    }



async function main() {
    const args = process.argv.slice(2);
    const num1 = Number(args[0]);
    const operator = args[1];
    const num2 = Number(args[2]);
    
   

    //validate the input
    if (args.length !== 3){
        console.error("Usage: node calculator.ts <num1> <operator> <num2>");
        process.exit(1);
    }

    if (!num1 || !operator || !num2){
        console.error("Invalid numbers");
        process.exit(1);
    }

    const result = calculator(num1, operator, num2);
    console.log(`${num1} ${operator} ${num2} = ${result}`);
    await savedHistory({num1, operator, num2, result})



};

main();

