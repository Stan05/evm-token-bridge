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
    const wrappedTokenAddress: string = "0xCafac3dD18aC6c6e92c921884f9E4176737C052c"
    console.log('Minting %d of token %s to receiver address %s', amount, wrappedTokenAddress, receiverAddress);
    const signatures = ["0xad42da2e87f82c4728b013f295a0b2f01dc1d49b6d84ec12e9454a19dbd075986fa6061ff9c6444cbd56f498dda4e8383775e9daf42ce9f326d82e35c8b2e0591b"];
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


