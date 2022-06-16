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
    const erc20TokenAddress: string = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
    console.log('Releasing %d of token %s to receiver address %s', amount, erc20TokenAddress, receiverAddress);
    const signatures = ["0x28ad710dde73d411ee86d0227bc000cee0c337f410289dd664068ca866edfa624f3d867c625d99ee2ba9e86d93fb6c0f0a168129860de5b70bc91f24871152861b"];
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


