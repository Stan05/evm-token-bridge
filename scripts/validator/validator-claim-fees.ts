import 'dotenv/config'
import { ethers } from 'hardhat';
import { BigNumber, BytesLike, Contract, Wallet } from 'ethers';
import hre from 'hardhat';
import BridgeABI from '../../artifacts/contracts/Bridge.sol/Bridge.json';
import RegistryABI from '../../artifacts/contracts/Registry.sol/Registry.json';
import ERC20ABI from '../../artifacts/contracts/ERC20Token.sol/ERC20Token.json';
import GovernanceABI from '../../artifacts/contracts/Governance.sol/Governance.json';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { getValidatorAllowanceSignature } from '../helper/validator-functions';

const sourceChainProvider: StaticJsonRpcProvider = new hre.ethers.providers.StaticJsonRpcProvider(hre.config.networks.localhost.url);
const targetChainProvider: StaticJsonRpcProvider = new hre.ethers.providers.StaticJsonRpcProvider(process.env.GANACHE_URL?.toString() ?? "");

const sourceBridgeContractAddress: string = process.env.SOURCE_BRIDGE_CONTRACT_ADDR?.toString() ?? "";
const targetBridgeContractAddress: string = process.env.TARGET_BRIDGE_CONTRACT_ADDR?.toString() ?? "";

const sourceBridgeContract: Contract = new hre.ethers.Contract(sourceBridgeContractAddress, BridgeABI.abi, sourceChainProvider);
const targetBridgeContract: Contract = new hre.ethers.Contract(targetBridgeContractAddress, BridgeABI.abi, targetChainProvider);

const validatorPrivateKey: string = process.env.GANACHE_VALIDATOR_PRIVATE_KEY?.toString() ?? "";
const validatorSourceChainWallet: Wallet = new hre.ethers.Wallet(validatorPrivateKey, sourceChainProvider);
const validatorTargetChainWallet: Wallet = new hre.ethers.Wallet(validatorPrivateKey, targetChainProvider);

async function main() {
    console.log('Claiming fees on source chain');
    console.log('Balance before claim ', await sourceChainProvider.getBalance(validatorSourceChainWallet.address));
    try {
        await sourceBridgeContract.connect(validatorSourceChainWallet).claimFees();
    } catch (err) {
        console.log('Could not claim fees');
    }
    console.log('Balance after claim', await sourceChainProvider.getBalance(validatorSourceChainWallet.address));

    
    console.log('\nClaiming fees on target chain');
    console.log('Balance before claim ', await targetChainProvider.getBalance(validatorTargetChainWallet.address));
    try {
        await targetBridgeContract.connect(validatorTargetChainWallet).claimFees();
    } catch (err) {
        console.log('Could not claim fees');
    }
    console.log('Balance after claim', await targetChainProvider.getBalance(validatorTargetChainWallet.address));
}


main();

