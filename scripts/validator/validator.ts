import 'dotenv/config'
import { ethers } from 'hardhat';
import { BigNumber, Contract, Wallet } from 'ethers';
import hre from 'hardhat';
import BridgeABI from '../../artifacts/contracts/Bridge.sol/Bridge.json';
import ERC20ABI from '../../artifacts/contracts/ERC20Token.sol/ERC20Token.json';
import { JsonRpcProvider } from '@ethersproject/providers';

const sourceBridgeContractAddress: string = process.env.SOURCE_BRIDGE_CONTRACT_ADDR_KEY?.toString() ?? "";
const targetBridgeContractAddress: string = process.env.TARGET_BRIDGE_CONTRACT_ADDR_KEY?.toString() ?? "";
const validatorPrivateKey: string = process.env.GANACHE_VALIDATOR_PRIVATE_KEY?.toString() ?? "";
const deployerPrivateKey: string = process.env.SOURCE_DEPLOYER_PRIVATE_KEY?.toString() ?? "";
const targetPrivateKey: string = process.env.TARGET_DEPLOYER_PRIVATE_KEY?.toString() ?? "";

const sourceChainProvider: JsonRpcProvider = new hre.ethers.providers.JsonRpcProvider(hre.config.networks.localhost.url);
const targetChainProvider: JsonRpcProvider = new hre.ethers.providers.JsonRpcProvider(process.env.GANACHE_URL?.toString() ?? "");
const validator: Wallet = new hre.ethers.Wallet(validatorPrivateKey, targetChainProvider);
const sourceDeployer: Wallet = new hre.ethers.Wallet(deployerPrivateKey, sourceChainProvider);
const targetDeployer: Wallet = new hre.ethers.Wallet(targetPrivateKey, targetChainProvider);

const sourceBridgeContract: Contract = new hre.ethers.Contract(sourceBridgeContractAddress, BridgeABI.abi, sourceChainProvider);
const targetBridgeContract: Contract = new hre.ethers.Contract(targetBridgeContractAddress, BridgeABI.abi, targetChainProvider);

async function main() {
    const blockNumber = await sourceChainProvider.send("eth_blockNumber", []);
    
    const sourceChainLockFilter = {
        address: sourceBridgeContract.address,
        fromBlock: blockNumber, // get the block number 
        topics: [
            sourceBridgeContract.Lock // filter by target chain id as well, one validator will be running for conection between networks
        ]
    }

    sourceChainProvider.on(sourceBridgeContract.filters.Lock(), handleLockEvent);
    targetChainProvider.on(targetBridgeContract.filters.Mint(), handleMintEvent);
}

const handleMintEvent = async (event: { topics: any[]; data: any; blockNumber: any; }) => {
    console.log('--------------Mint Event--------------');
    const receiver = ethers.utils.hexStripZeros(event.topics[1]);
    const decodedData = ethers.utils.defaultAbiCoder.decode(['address', 'address', 'uint256'], event.data);
    const mintToken = decodedData[1];
    const mintAmount = decodedData[2];
    console.log('Block Number :', event.blockNumber);
    console.log('Receiver : ', receiver);
    console.log('Mint Token : ', mintToken);
    console.log('Mint Amount : ', mintAmount.toString());
    const mintTokenContract = new hre.ethers.Contract(mintToken, ERC20ABI.abi, targetChainProvider);
    const tokenName = await mintTokenContract.name();
    const newBalance = (await mintTokenContract.balanceOf(receiver)).toString();
    console.log('User\'s %s balance %d of \'%s\' token.\n', receiver, newBalance, tokenName);
};

const handleLockEvent = async (event: { data: any; topics: string[]; blockNumber: any; }) => {
    console.log('--------------Lock Event--------------');
    const decodedData = hre.ethers.utils.defaultAbiCoder.decode(['address', 'uint256'], event.data);
    const from = hre.ethers.utils.hexStripZeros(event.topics[1]);
    const lockedToken:string = decodedData[0];
    const lockedAmount: BigNumber = decodedData[1];
    const targetChainId: number = parseInt(event.topics[2]);
    console.log('Block Number :', event.blockNumber);
    console.log('From : ', from);
    console.log('TargetChainId : ', targetChainId);
    console.log('Locked Token : ', lockedToken);
    console.log('Locked Amount : ', lockedAmount.toString());

    const targetToken: string = await lookupTargetTokenAddress(lockedToken, targetChainId);
    console.log("Validators\'s signature %s", await getValidatorMintSignature(from, lockedAmount, targetToken));
}

const deployBridgeTokenOnTargetChain = async (sourceToken: string) => {
    const sourceTokenContract = new hre.ethers.Contract(sourceToken, ERC20ABI.abi, sourceChainProvider);
    const name = await sourceTokenContract.name();
    const symbol = await sourceTokenContract.symbol();

    const bridgeTokenAddressTx = await targetBridgeContract.connect(targetDeployer).createToken("Bridge" + name, "b" + symbol);
    const receipt = await bridgeTokenAddressTx.wait();
    const bridgeTokenAddress: string = ethers.utils.hexStripZeros(receipt.events.filter((e: { event: string; }) => e.event == "TokenCreated")[0].topics[1]);
    
    console.log('Bridge token %s deployed on address: %s \n', "Bridge" + name, bridgeTokenAddress.toUpperCase());

    return bridgeTokenAddress;
}

const getValidatorMintSignature = async (receiver: string, amount: BigNumber, targetToken: string) => {
    
    const EIP712Domain = [ 
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256'},
        { name: 'verifyingContract', type: 'address' }
    ];
    
    const chainId: number = parseInt(await targetChainProvider.send("eth_chainId", []));
    const domain = {
        name: BridgeABI.contractName,
        version: '1',
        chainId: chainId,
        verifyingContract: targetBridgeContract.address
    };
    
    const mint = [ 
        { name: 'receiver', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'token', type: 'address' },
    ];

    const message = {
        receiver: receiver, 
        amount: amount.toNumber(), 
        token: targetToken,
    };
        
    const data = {
        types: {
            EIP712Domain,
            mint
        },
        domain,
        primaryType: 'mint',
        message
    }
    
    const signatureLike = await targetChainProvider.send('eth_signTypedData_v4', [validator.address, data]); 

    return signatureLike;
}

const lookupTargetTokenAddress = async (sourceToken: string, targetChainId: number) => {
    let targetTokenAddress = await sourceBridgeContract.lookupTargetTokenAddress(sourceToken, targetChainId);
    if (targetTokenAddress == undefined || targetTokenAddress == ethers.constants.AddressZero) {
        console.log('\nDoesn\'t have corresponding wrapped token, deploying one');
        targetTokenAddress = await deployBridgeTokenOnTargetChain(sourceToken);
        await sourceBridgeContract.connect(sourceDeployer).registerTargetTokenAddress(sourceToken, targetChainId, targetTokenAddress);
    }
    return targetTokenAddress;
}

main();


