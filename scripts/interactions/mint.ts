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

    const receiverAddress: string = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    const amount: number = 10;
    const wrappedTokenAddress: string = "0xb7a5bd0345ef1cc5e66bf61bdec17d2461fbd968"
    console.log('Minting %d of token %s to receiver address %s', amount, wrappedTokenAddress, receiverAddress);
    const signatures = ["0xc2cf7779f883ebf291c673d687a4c85e621d788a695590930378c1f6992729676c79c2f25376498b4a1804ac3360db790cd8316e6764255b2ffb18b4f69b40d41b"];
    const tx = await targetBridgeContract
                    .connect(userWallet)
                    .mint(receiverAddress, 
                            amount, 
                            wrappedTokenAddress, 
                            signatures, 
                            { gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 1000000 });
    const receipt = await tx.wait();
    console.log('Successful mint')
    /*const mintTokenContract = new hre.ethers.Contract("0xa16E02E87b7454126E5E10d957A927A7F5B5d2be", ERC20TokenABI.abi, targetChainProvider);
    console.log(await mintTokenContract.balanceOf(userWallet.getAddress()));*/
}

main();


