// node_moules
import colors from 'colors';
import ora from 'ora';
import * as dotenv from 'dotenv';
dotenv.config();

// config
import * as configFile from './tools/config.js';

const config = configFile.default

const spinner = ora('Sending Asstets');
spinner.spinner = process.env.spinnerType;


// constants
let servers = JSON.parse(process.env.servers);
let apiPort = process.env.apiPort
let assetsEachServer = process.argv[2] || process.env.assetsEachServer;
let username = process.argv[3] || process.env.username;


let addedAssetsObj = {};       // contains the number of added assets for aech server
let numOfServers = 0;         // count number of the servers
let doneServers = 0;         // number of the servers which added all assets

let startTime = Date.now() / 1000;
spinner.start();


for (let key in servers) 
{
    let serverIP = servers[key];
    let serverName = key;

    numOfServers++;     // count the number of the servers in config file
    addedAssetsObj[serverName] = 0;

    becnmarkServers(serverIP, apiPort, serverName, assetsEachServer);
}



// send assets to all servers
function becnmarkServers(ip, port, serverName, numOfAssets)
{
    let carName;
    let orgNumber;

    for (let i = 0; i < numOfAssets; i++)
    {
        orgNumber = serverName.match(/\d/g).join("");
        carName = `car_${serverName}_${i+1}`;

        axios.post(`http://${ip}:${port}`, {
            username,
            org: `org${orgNumber}`,
            args: [carName, "Benz", "c240" , "black", "Alireza"]
        })
        .then(response => 
        {
            addedAssetsObj[serverName]++;
            doneServers++;

            if (addedAssetsObj[serverName] == numOfAssets) 
            {
                let endTime = ((Date.now() / 1000) - startTime).toFixed(2);
                spinner.succeed(colors.dim(`Successfully added '${numOfAssets}' assets of the server: [${ip} - ${serverName}] ~ ${elapsedTime} seconds'`));
                spinner.start();

                // if all servers done the operation
                if (doneServers == numOfServers) {
                    let totalEndTime = ((Date.now() / 1000) - startTime).toFixed(2);
                    spinner.succeed(colors.green(`All assets of '${numOfServers}' servers added successfully.'`));
                    console.log(colors.yellow(`~ ${totalEndTime} seconds`));
                    console.log(colors.blue(`TPS: ${( (numOfServers * numOfAssets) / (totalEndTime) ).toFixed(2)}`));
                }
            }

        })
        .catch(error => {
            spinner.fail(colors.bgRed(`Error in sending data to server: [${ip} - ${serverName}] - ${carName}`));
            console.log(colors.red(error));
            spinner.start();
        });
    }
}
