import { ethers } from "hardhat";

async function deployBridge() {
    const contractName = "Bridge";
    const [deployer, validator] = await ethers.getSigners();
    
    console.log('Deploying contract %s with the account: %s', contractName, deployer.address);

    const Contract = await ethers.getContractFactory(contractName); 
    const contract = await Contract.deploy();
    console.log('Waiting for deployment... ');
    await contract.deployed();
    
    console.log('%s Contract deployed on address: %s', contractName, contract.address);
    console.log('Registering validator %s \n', validator.address);
    await contract.registerValidator(validator.address);
    return contract.address
}
  
module.exports = deployBridge;

