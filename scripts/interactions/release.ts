import 'dotenv/config'
import hre, { ethers } from 'hardhat';
import BridgeABI from '../../artifacts/contracts/Bridge.sol/Bridge.json';
import ERC20TokenABI from '../../artifacts/contracts/ERC20Token.sol/ERC20Token.json';
import { StaticJsonRpcProvider } from '@ethersproject/providers';

const sourceBridgeContractAddress: string = process.env.SOURCE_BRIDGE_CONTRACT_ADDR?.toString() ?? "";
const sourceChainProvider: StaticJsonRpcProvider = new hre.ethers.providers.StaticJsonRpcProvider(hre.config.networks.localhost.url);
const sourceBridgeContract = new hre.ethers.Contract(sourceBridgeContractAddress, BridgeABI.abi, sourceChainProvider);
const userPrivateKey = process.env.USER_PRIVATE_KEY?.toString() ?? "";


async function main() {
    const userWallet = new hre.ethers.Wallet(userPrivateKey, sourceChainProvider);

    const receiverAddress: string = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    const amount: number = 10;
    const erc20TokenAddress: string = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
    console.log('Releasing %d of token %s to receiver address %s', amount, erc20TokenAddress, receiverAddress);
    const signatures = ["0x589cbb8fccd1418de47007f57ed65e7b7ef30994819f35be2e2e917691ec05655e5b63c7a0f5ea23e3cd358b0c51d72d52859d538af9cb9b5c5fcda6a6dbef6d1b"];
    const tx = await sourceBridgeContract
                    .connect(userWallet)
                    .release(receiverAddress, 
                            amount, 
                            erc20TokenAddress, 
                            signatures, 
                            { gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 1000000 });
    const receipt = await tx.wait();
    console.log('Successful release')
    /*const mintTokenContract = new hre.ethers.Contract(erc20TokenAddress, ERC20TokenABI.abi, sourceChainProvider);
    console.log(await mintTokenContract.balanceOf(userWallet.getAddress()));*/
}

main();


