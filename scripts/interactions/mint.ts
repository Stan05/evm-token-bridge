import 'dotenv/config'
import hre, { ethers } from 'hardhat';
import BridgeABI from '../../artifacts/contracts/Bridge.sol/Bridge.json';

const targetBridgeContractAddress = process.env.TARGET_BRIDGE_CONTRACT_ADDR_KEY?.toString() ?? "";
const targetChainProvider = new hre.ethers.providers.JsonRpcProvider(process.env.GANACHE_URL?.toString() ?? "");
const targetBridgeContract = new hre.ethers.Contract(targetBridgeContractAddress, BridgeABI.abi, targetChainProvider);
const userPrivateKey = process.env.USER_PRIVATE_KEY?.toString() ?? "";

async function main() {
    const userWallet = new hre.ethers.Wallet(userPrivateKey, targetChainProvider);
    const signatures = ["0xbfc5132dbd2ecd73a18a20cb2657def745a2b663ce2d80b1d2890ad76bf939f0446701e6c428845f0c1e7f5934d1097c54e06a16e4f6cbbd6a321f23b194a7601c"];
    await targetBridgeContract
                    .connect(userWallet)
                    .mint("0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", 
                            10, 
                            "0x59F2f1fCfE2474fD5F0b9BA1E73ca90b143Eb8d0", 
                            signatures, 
                            { gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 1000000 });
}

main();


