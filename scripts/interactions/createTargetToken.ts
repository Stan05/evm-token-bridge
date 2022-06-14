import 'dotenv/config'
import hre, { ethers } from 'hardhat';
import BridgeABI from '../../artifacts/contracts/Bridge.sol/Bridge.json';
import ERC20TokenABI from '../../artifacts/contracts/ERC20Token.sol/ERC20Token.json';

const targetBridgeContractAddress = process.env.TARGET_BRIDGE_CONTRACT_ADDR?.toString() ?? "";
const targetChainProvider = new hre.ethers.providers.JsonRpcProvider(process.env.GANACHE_URL?.toString() ?? "");
const targetBridgeContract = new hre.ethers.Contract(targetBridgeContractAddress, BridgeABI.abi, targetChainProvider);
const userPrivateKey = process.env.USER_PRIVATE_KEY?.toString() ?? "";


async function main() {
    const userWallet = new hre.ethers.Wallet(userPrivateKey, targetChainProvider);

    const wrappedTokenName: string = "BridgeToken";
    const wrappedTokenSymbol: string = "bTKN"
    console.log("Creating wrapped token '%s' with symbol '%s'", wrappedTokenName, wrappedTokenSymbol);
    const signatures = ["0x4e59ca8ced87a1e114961578b8e4bedb74252fc6dc617a79a56b214712561385104a2266c772d4951aecbc0fd6d2cc1e42bebfa426d9872998ceb0d984d5cb881b"];
    const tx = await targetBridgeContract
                    .connect(userWallet)
                    .createToken(wrappedTokenName, wrappedTokenSymbol, signatures, { gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 1000000 });
    const receipt = await tx.wait();
    
    const wrappedTokenAddress: string = ethers.utils.hexStripZeros(receipt.events.filter((e: { event: string; }) => e.event == "TokenCreated")[0].topics[1]);
    console.log("Successful creation of token on address '%s'", wrappedTokenAddress)
    /*const mintTokenContract = new hre.ethers.Contract("0xa16E02E87b7454126E5E10d957A927A7F5B5d2be", ERC20TokenABI.abi, targetChainProvider);
    console.log(await mintTokenContract.balanceOf(userWallet.getAddress()));*/
}

main();


