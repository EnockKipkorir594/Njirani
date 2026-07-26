
import { readFileSync, writeFileSync } from "fs";

interface Contact {
    name: string,
    email: string,
    age?: number
}

//Reading a file 
let contacts: Contact[] = [];
try{
    const data = readFileSync('contacts.json', 'utf-8');
    contacts = JSON.parse(data);

}
catch{
    //Initialize an empty file 
    contacts = []
}

const args = process.argv.slice(2)
const command  = args[0];

if (command === "add"){

    if (args.length < 3){
        console.log("Usage: <add> <name> <email>");
        process.exit(1);

    }
    const newName = args[1]!;
    const newEmail = args[2]!;
    try{
        const data = readFileSync('contacts.json', 'utf-8');
        contacts = JSON.parse(data);
        const alreadyExists = contacts.some(
            (c) => c.name === newName || c.email === newEmail
        );
        
        if (alreadyExists){
            console.log(`User ${newName} || ${newEmail} already exists`)
        } else {
            
            contacts.push({
                name: newName,
                email: newEmail
            });
        
        
            //Write into a file contacts.json
            writeFileSync('contacts.json', JSON.stringify(contacts, null, 2));
            console.log(`Added ${newName}`);
        
        }
}
    catch{

}
  
}

else if (command === "list") {

    if (contacts.length === 0){
        console.log("contacts in empty");
    }
    else {
        for (const contact of contacts){
        console.log(`${contact.name} - ${contact.email}`);
        }
    }
   

    //If the file is empty return an empty file without errors
}
else if (command === "search") {
    if (args.length < 2){
        console.log("Usage: <search> <name>")
    }
    const userName = args[1]
    const found = contacts.find(
        (c) => c.name === userName 
    );
    
    if (found){

        console.log(`Name : ${found.name}\n Email: ${found.email}`);

    }
    else {
        console.log(`No user found with that ${userName}`);
    }
        
}   


else {
    console.log("Unknown command: Use add, list, or search");
};






