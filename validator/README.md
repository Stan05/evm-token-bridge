## Validator

This is a nodejs based webserver serving role as a validator for the EVM Token Bridge.

## Features

- Listens for events from the Bridge contract
  - Ensures transactions finality
  - Deploys wrapped bridge token contracts on the target chain, whenever one is not present
  - Manages transactions state in MongoDB, which are used by the web-app
- Expose REST APIs for the web-app
  - To fetch trsansactions and their state
  - To fetch supported tokens for a given chain

## Getting started

First ensure that you have a MongoDB instance running, you can spin up one with docker by running below:

```
docker run --name validator-db -p 27017:27017 -d mongo
```

Then you can run the validator by running:

```
npm run dev
```
