# Server

## About this repository

This repository contains the code to run the node server of the unruly passenger web app. This server takes in requests from the client and interacts with a PostgreSQL database, iExec, and a smart contract.

## Install

Run `npm i` in the root directory to install the dependencies.

## Start the server

Run `npm start` to start the server. The server will run on port `3000`.

## Environment

### Setting the environment variables

You need to insert a `.env` file in the root directory that contains the following values:
```
IEXEC_WALLET_PASSWORD=      // the password to the iExec wallet of this node server
IEXEC_APP=                  // the address of the deployed gramine app (starts with 0x).
IEXEC_APP_WALLET=           // the address of the wallet used by the gramine app (last stand: 0x8790ed88752255da1a08142d5ba31f0fc0b97fd4)
WEB3STORAGE_TOKEN=          // an IPFS storage token

ETH_ADDRESS=                // the address of the ethereum wallet (starts with 0x)
ETH_PRIVATE_KEY=            // the ethereum private key of the wallet
ALCHEMY_KEY=                // the api key from you alchemy account (We use Alchemy as a provider).

SMART_CONTRACT_ADDRESS=     // the address of the smart contract to interact with

USERNAME=                   // pseudo username for the client
PASSWORD=                   // pseudo password for the client

STATUS_API_KEY=             // api key that the gramine app uses to report the status to the server
STAGING_URL=                // url of this server (remove if you run it on localhost)

DB_HOST=                    // host of postgres db
DB_PORT=                    // port of postgres db 
DB_NAME=                    // name of the database
DB_USER=                    // name of the database user
DB_PASSWORD=                // password of the db
DB_TABLE=                   // name of the table with unruly passengers
```

### Inserting the iExec wallet

To insert a different iExec wallet you need to replace the content of `src/wallet.json` with the content of your wallet's JSON file.

### Templates

We have provided some templates in the [templates](https://github.com/Internet-of-Services-Lab-Project-5/templates "templates") repository.
