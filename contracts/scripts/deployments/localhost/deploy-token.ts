import { ethers } from "hardhat";

async function deployToken(name: string, symbol: string) {
    const contractName = "ERC20Token";
    const [deployer] = await ethers.getSigners();
    
    console.log('Deploying contract %s with the account: %s', contractName, deployer.address);
    
    const Contract = await ethers.getContractFactory(contractName); 
    const contract = await Contract.deploy(name, symbol);
    console.log('Waiting for deployment... ');
    await contract.deployed();
    
    console.log('%s Contract deployed on address: %s \n', contractName, contract.address);

    return contract.address
}
  
module.exports = deployToken;