# EVM Token Bridge

This is my project as part of the [LimeAcademy](https://limeacademy.tech/) on topic building an EVM Token Bridge.

The Bridge consist of several components:

### Smart Contracts

The smart contracts written in Solidity - [contracts](/contracts/)

### Validator

The validator is reposnsible to listen for events from the smart contracts and generate signatures, which are used by the users to claim their token on the target chain - [validator](/validator/)

### Web application

Web application written in React, which is interacting with the smart contracts and requesting the signatures from the validator, as well as transaction statuses - [web-app](/web-app/)
