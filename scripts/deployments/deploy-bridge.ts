import { ethers } from "hardhat";

async function deployBridge() {
    const contractName = "Bridge";
    const [deployer, validator] = await ethers.getSigners();
    
    console.log('Deploying contract %s with the account: %s', contractName, deployer.address);

    const Contract = await ethers.getContractFactory(contractName); 
    const contract = await Contract.deploy([validator.address]);
    console.log('Waiting for deployment... ');
    await contract.deployed();
    
    console.log('%s Contract deployed on address: %s', contractName, contract.address);
    console.log('With validator %s \n', validator.address);
    return contract.address
}
  
module.exports = deployBridge;

