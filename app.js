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
let servers = JSON.parse(process.env.mobinServers);
let numOfServers = +Object.keys(JSON.parse(process.env.mobinServers)).length;    // count number of the servers
let apiPort = process.env.apiPort
let assetsEachServer = +process.argv[2] || +process.env.assetsEachServer;
let username = process.argv[3] || process.env.username;
let multiFileAdd_boolean = process.argv[4] || false;

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

    // becnmarkServersBatch(serverIP, apiPort, serverName, assetsEachServer);
    becnmarkServers(serverIP, apiPort, serverName);
}


// tell servers how to add assets intervally
function becnmarkServers(ip, port, serverName)
{
    let orgNumber = +serverName.match(/\d/g).join("");

    let url = `http://${ip}:${port}/addAssetBatch`;
    if (multiFileAdd_boolean) {
        url = `http://${ip}:${port}/addAssetBatch_multiFile`
    }
    
    axios.post(url, {
        username,
        orgName: `org${orgNumber}`,
        numOfAssets: assetsEachServer,
        startFrom: (orgNumber * assetsEachServer) - assetsEachServer + 1
    })
    .then(response => 
    {
        doneServers++;

        let endTime = ((Date.now() / 1000) - startTime).toFixed(2);
        spinner.succeed(colors.green(response.data + ` - [${ip} - ${serverName}] ~ ${endTime} seconds'`));
        spinner.start();

        // if all servers done the operation
        if (doneServers == numOfServers) {
            let totalEndTime = ((Date.now() / 1000) - startTime).toFixed(2);
            spinner.succeed(colors.green(`All assets of '${numOfServers}' servers added successfully.'`));
            console.log(colors.yellow(`~ ${totalEndTime} seconds`));
            console.log(colors.blue(`TPS: ${calculateTPS(totalEndTime, assetsEachServer)}`));
        }
    })
    .catch(error => 
    {
        doneServers++;

        spinner.fail(colors.bgRed(`\nError in sending data to server: [${ip} - ${serverName}]`));
        console.log(colors.red(error + "\n"));
        spinner.start();

        // if all servers done the operation
        if (doneServers == numOfServers) {
            let totalEndTime = ((Date.now() / 1000) - startTime).toFixed(2);
            spinner.fail(colors.bgRed.black(`All servers done but some errors!'`));
            console.log(colors.yellow(`~ ${totalEndTime} seconds`));
            console.log(colors.blue(`TPS: ${calculateTPS(totalEndTime)}`));
        }
    });
}


// send assets to all servers one by one
function becnmarkServersBatch(ip, port, serverName, numOfAssets)
{
    let carName;
    let orgNumber = +serverName.match(/\d/g).join("");
    
    for (let i = 0; i < numOfAssets; i++)
    {
        // if (orgNumber == 6) orgNumber = 1;
        // if (orgNumber == 7) orgNumber = 2;

        carName = `car_${serverName}_${i+1}`;


        axios.post(`http://${ip}:${port}/addAsset`, {
            username,
            orgName: `org${orgNumber}`,
            args: [carName, "Benz", "c240" , "black", "alireza"]
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



function calculateTPS(totalTime, numOfAssets)
{
    let tps;

    if (numOfAssets) {
        tps = ((numOfAssets*numOfServers) / totalTime).toFixed(2);
    }

    else {
        let totalAddedAssets = 0;
    
        for (let host in addedAssetsObj) {
            totalAddedAssets+= addedAssetsObj[host];
        }
    
        tps = (totalAddedAssets / totalTime).toFixed(2);
    }

    return tps;
}