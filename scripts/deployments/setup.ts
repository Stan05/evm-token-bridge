import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { ethers } from "hardhat";

async function setup() {
    const bridgeContractName: string = "Bridge";
    const registryContractName: string = "Registry";
    const governanceContractName: string = "Governance";
    const wrappedTokenFactoryContractName: string = "WrappedTokenFactory"
    const erc20TokenContractName: string = "ERC20Token";
    const [deployer, validator, user]: SignerWithAddress[] = await ethers.getSigners();
    
    const governance: Contract = await deployContract(governanceContractName, deployer, [validator.address]);
    const wrappedTokenFactory: Contract = await deployContract(wrappedTokenFactoryContractName, deployer);
    const bridge: Contract = await deployContract(bridgeContractName, deployer, governance.address, wrappedTokenFactory.address);
    const erc20Token: Contract = await deployContract(erc20TokenContractName, deployer, "Token", "TKN", deployer.address);
    const registry: Contract = await deployContract(registryContractName, deployer);
    
    await governance.transferOwnership(bridge.address);
    await wrappedTokenFactory.transferOwnership(bridge.address);
    
    return bridge
}

const deployContract = async (contractName: string, deployer: SignerWithAddress, ...args: any): Promise<Contract> => {
    console.log("\n-------------------------------------------------\n");
    console.log('Deploying contract %s with the account: %s', contractName, deployer.address);

    const ContractFactory = await ethers.getContractFactory(contractName);

    let contract;
    if (args) {
        contract = await ContractFactory.deploy(...args);
    } else {
        contract = await ContractFactory.deploy();
    }
    console.log('Waiting for deployment... ');
    await contract.deployed();
    console.log('%s Contract deployed on address: %s', contractName, contract.address);
    console.log("\n-------------------------------------------------\n");
    return contract;
}
  
module.exports = setup;

