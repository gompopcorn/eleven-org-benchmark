// node_moules
import colors from 'colors';
import ora from 'ora';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();


const spinner = ora('Sending Asstets');
spinner.spinner = process.env.spinnerType;


// constants
// let servers = JSON.parse(process.env.servers);
let servers = JSON.parse(process.env.testServers1);
let numOfServers = +Object.keys(JSON.parse(process.env.testServers1)).length;    // count number of the servers
let apiPort = process.env.apiPort
let assetsEachServer = +process.argv[2] || +process.env.assetsEachServer;
let username = process.argv[3] || process.env.username;

let addedAssetsObj = {};       // contains the number of added assets for aech server
let failedAssetsObj = {};     // contains the number of failed assets for aech server
let doneServers = 0;         // number of the servers which added all assets

console.log(colors.bgBlue.black(`\n* Starting to send ${numOfServers*assetsEachServer} assets with ${numOfServers} servers - ${assetsEachServer} assets each server\n`));

let startTime = Date.now() / 1000;
spinner.start();


for (let key in servers) 
{
    let serverIP = servers[key];
    let serverName = key;

    addedAssetsObj[serverName] = 0;
    failedAssetsObj[serverName] = 0;

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


        axios.post(`http://${ip}:${port}/addAsset`, {
            username,
            orgName: `org${orgNumber}`,
            args: [carName, "Benz", "c240" , "black", "Alireza"]
        })
        .then(response => 
        {
            addedAssetsObj[serverName]++;
            
            if (addedAssetsObj[serverName] + failedAssetsObj[serverName] == numOfAssets) 
            {
                doneServers++;

                if (!failedAssetsObj[numOfServers])
                {
                    let endTime = ((Date.now() / 1000) - startTime).toFixed(2);
                    spinner.succeed(colors.dim(`Successfully added '${numOfAssets}' assets of the server: [${ip} - ${serverName}] ~ ${endTime} seconds'`));
                    spinner.start();
    
                    // if all servers done the operation
                    if (doneServers == numOfServers) {
                        let totalEndTime = ((Date.now() / 1000) - startTime).toFixed(2);
                        spinner.succeed(colors.green(`All assets of '${numOfServers}' servers added successfully.'`));
                        console.log(colors.yellow(`~ ${totalEndTime} seconds`));
                        console.log(colors.blue(`TPS: ${calculateTPS(totalEndTime)}`));
                    }
                }

                else {
                    let endTime = ((Date.now() / 1000) - startTime).toFixed(2);
                    spinner.fail(colors.dim(`'${addedAssetsObj[serverName]}' assets addes and '${failedAssetsObj[serverName]}' assets failed of the server: [${ip} - ${serverName}] ~ ${endTime} seconds'`));
                    spinner.start();
    
                    // if all servers done the operation
                    if (doneServers == numOfServers) {
                        let totalEndTime = ((Date.now() / 1000) - startTime).toFixed(2);
                        spinner.fail(colors.bgRed.black(`All servers done but some errors!'`));
                        console.log(colors.yellow(`~ ${totalEndTime} seconds`));
                        console.log(colors.blue(`TPS: ${calculateTPS(totalEndTime)}`));
                    }
                }
            }

        })
        .catch(error => 
        {
            failedAssetsObj[serverName]++;
            spinner.fail(colors.bgRed(`\nError in sending data to server: [${ip} - ${serverName}] - ${carName}`));
            console.log(colors.red(error.response.data + "\n"));
            spinner.start();

            if (addedAssetsObj[serverName] + failedAssetsObj[serverName] == numOfAssets)
            {
                doneServers++;

                // if all servers done the operation
                if (doneServers == numOfServers) {
                    let totalEndTime = ((Date.now() / 1000) - startTime).toFixed(2);
                    spinner.fail(colors.bgRed.black(`All servers done but some errors!'`));
                    console.log(colors.yellow(`~ ${totalEndTime} seconds`));
                    console.log(colors.blue(`TPS: ${calculateTPS(totalEndTime)}`));
                }
            }
        });
    }
}



function calculateTPS(totalTime)
{
    let totalAddedAssets = 0;

    for (let host in addedAssetsObj) {
        totalAddedAssets+= addedAssetsObj[host];
    }

    let tps = (totalAddedAssets / totalTime).toFixed(2);

    return tps;
}