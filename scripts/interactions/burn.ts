import { keccak256 } from '@ethersproject/keccak256';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import 'dotenv/config'
import { Contract, ethers } from 'ethers';
import { hexlify } from 'ethers/lib/utils';
import hre from 'hardhat';
import BridgeABI from '../../artifacts/contracts/Bridge.sol/Bridge.json';
import ERC20TokenABI from '../../artifacts/contracts/ERC20Token.sol/ERC20Token.json';

const targetBridgeContractAddress: string = process.env.TARGET_BRIDGE_CONTRACT_ADDR?.toString() ?? "";
const wrappedTokenContractAddress: string = "0xb7a5bd0345ef1cc5e66bf61bdec17d2461fbd968";
const targetChainProvider: StaticJsonRpcProvider = new hre.ethers.providers.StaticJsonRpcProvider(process.env.GANACHE_URL?.toString() ?? "");
const targetBridgeContract: Contract = new hre.ethers.Contract(targetBridgeContractAddress, BridgeABI.abi, targetChainProvider);
const targetTokenContract: Contract = new hre.ethers.Contract(wrappedTokenContractAddress, ERC20TokenABI.abi, targetChainProvider);
const userPrivateKey: string = process.env.USER_PRIVATE_KEY?.toString() ?? "";

async function main() {
    const userWallet = new hre.ethers.Wallet(userPrivateKey, targetChainProvider);
    
    const targetChainId: number = 31337;
    const amount: number = 10;
    const deadline: number = + new Date() + 60 * 60; 
    
    console.log('Burning %d of token %s from user address %s', amount, targetTokenContract.address, userWallet.address);
  
    const signature = await getSignature(userWallet.address, targetBridgeContract.address, targetTokenContract, targetChainProvider, amount);
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
    /*const mintTokenContract = new hre.ethers.Contract("0xa16E02E87b7454126E5E10d957A927A7F5B5d2be", ERC20TokenABI.abi, targetChainProvider);
    console.log(await mintTokenContract.balanceOf(userWallet.getAddress()));*/
}

async function getSignature(userAddress: string, spender: string, tokenContract: Contract, provider: StaticJsonRpcProvider, permitAmount: number): Promise<{v: number, r: string, s:string, deadline: number}> {
    const nonce = (await tokenContract.nonces(userAddress));
    const chainId: number = parseInt(await provider.send("eth_chainId", []));
    const deadline = + new Date() + 60 * 60; 
    
    const EIP712Domain = [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
    ];

    const domain = {
        name: await tokenContract.name(),
        version: '1',
        chainId: chainId,
        verifyingContract: tokenContract.address
    };
  
    const Permit = [ 
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
    ];
    
    const message = {
        owner: userAddress, 
        spender: spender, 
        value: permitAmount.toString(),
        nonce: nonce.toString(),
        deadline
    };

    const data = {
        types: {
            EIP712Domain,
            Permit
        },
        domain,
        primaryType: 'Permit',
        message
    }
    
    const signatureLike = await provider.send('eth_signTypedData_v4', [userAddress, data]); 
    
    const signature = hre.ethers.utils.splitSignature(signatureLike);
    const preparedSignature = {
        v: signature.v,
        r: signature.r,
        s: signature.s,
        deadline
    };

    return preparedSignature;
}

main();
