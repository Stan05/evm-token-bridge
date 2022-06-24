import { StaticJsonRpcProvider } from '@ethersproject/providers';
import 'dotenv/config'
import { Contract, ethers } from 'ethers';
import hre from 'hardhat';
import BridgeABI from '../../artifacts/contracts/Bridge.sol/Bridge.json';
import ERC20TokenABI from '../../artifacts/contracts/ERC20Token.sol/ERC20Token.json';
import { getUserPermit } from '../helper/user-functions';

const targetBridgeContractAddress: string = process.env.TARGET_BRIDGE_CONTRACT_ADDR?.toString() ?? "";
const wrappedTokenContractAddress: string = "0xCafac3dD18aC6c6e92c921884f9E4176737C052c";
const targetChainProvider: StaticJsonRpcProvider = new hre.ethers.providers.StaticJsonRpcProvider(process.env.GANACHE_URL?.toString() ?? "");
const targetBridgeContract: Contract = new hre.ethers.Contract(targetBridgeContractAddress, BridgeABI.abi, targetChainProvider);
const targetTokenContract: Contract = new hre.ethers.Contract(wrappedTokenContractAddress, ERC20TokenABI.abi, targetChainProvider);
const userPrivateKey: string = process.env.USER_PRIVATE_KEY?.toString() ?? "";

async function main() {
    const userWallet = new hre.ethers.Wallet(userPrivateKey, targetChainProvider);
    
    const targetChainId: number = 31337;
    const amount: number = 10;
    
    console.log('Burning %d of token %s from user address %s', amount, targetTokenContract.address, userWallet.address);
  
    const signature = await getUserPermit(userWallet.address, targetBridgeContract.address, targetTokenContract, targetChainProvider, amount);
    const tx = await targetBridgeContract
                    .connect(userWallet)
                    .burn(targetChainId,
                            targetTokenContract.address, 
                            amount, 
                            signature.deadline, 
                            signature.v, 
                            signature.r, 
                            signature.s,
                            { gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 1000000 });
    const receipt = await tx.wait();

    console.log('Successful burn');
}

main();
