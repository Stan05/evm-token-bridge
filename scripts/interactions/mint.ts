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
    const signatures = ["0xb8c6a73e1012101c20c2bfe37332a5e9a9bb398c02707584e96c0d7cd5994f893e7c4df51d844f582e3b48da7acb3bcd30fdd42b0398f187cfa1db1aea57eadb1c"];
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


