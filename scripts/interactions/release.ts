import 'dotenv/config'
import hre, { ethers } from 'hardhat';
import BridgeABI from '../../artifacts/contracts/Bridge.sol/Bridge.json';
import FeeCalculatorABI from '../../artifacts/contracts/FeeCalculator.sol/FeeCalculator.json';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';

const sourceBridgeContractAddress: string = process.env.SOURCE_BRIDGE_CONTRACT_ADDR?.toString() ?? "";
const sourceChainProvider: StaticJsonRpcProvider = new hre.ethers.providers.StaticJsonRpcProvider(hre.config.networks.localhost.url);
const sourceBridgeContract = new hre.ethers.Contract(sourceBridgeContractAddress, BridgeABI.abi, sourceChainProvider);
const userPrivateKey = process.env.USER_PRIVATE_KEY?.toString() ?? "";


async function main() {
    const userWallet = new hre.ethers.Wallet(userPrivateKey, sourceChainProvider);

    const feeCalculatorAddress: string = await sourceBridgeContract.feeCalculator();
    const feeCalculatorContract = new hre.ethers.Contract(feeCalculatorAddress, FeeCalculatorABI.abi, sourceChainProvider);

    const serviceFee: BigNumber = await feeCalculatorContract.serviceFee();
    console.log('Service fee is %d', serviceFee);

    const receiverAddress: string = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    const amount: number = 10;
    const erc20TokenAddress: string = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
    console.log('Releasing %d of token %s to receiver address %s', amount, erc20TokenAddress, receiverAddress);
    const signatures = ["0xf50890b31d49bf22ad7fa68a5270bfe37bb42617fe6e56064b4ebbbd9f01f7eb355acfc05682f11962994f78f41e6107fda589028da78107169f1556b0137a021b"];
    const tx = await sourceBridgeContract
                    .connect(userWallet)
                    .release(receiverAddress, 
                            amount, 
                            erc20TokenAddress, 
                            signatures, 
                            { value:serviceFee, gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 1000000 });
    const receipt = await tx.wait();
    console.log('Successful release');
}

main();


