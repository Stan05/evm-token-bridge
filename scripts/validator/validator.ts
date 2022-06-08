import 'dotenv/config'
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import hre from 'hardhat';
import BridgeABI from '../../artifacts/contracts/Bridge.sol/Bridge.json';
import BridgeERC20ABI from '../../artifacts/contracts/BridgeERC20.sol/BridgeERC20.json';

const sourceBridgeContractAddress = process.env.SOURCE_BRIDGE_CONTRACT_ADDR_KEY?.toString() ?? "";
const targetBridgeContractAddress = process.env.TARGET_BRIDGE_CONTRACT_ADDR_KEY?.toString() ?? "";
const validatorPrivateKey = process.env.GANACHE_VALIDATOR_PRIVATE_KEY?.toString() ?? "";
const tokenRegistry = new Map<string, string>();

const sourceChainProvider = new hre.ethers.providers.JsonRpcProvider(hre.config.networks.localhost.url);
const targetChainProvider = new hre.ethers.providers.JsonRpcProvider(process.env.GANACHE_URL?.toString() ?? "");
const validator = new hre.ethers.Wallet(validatorPrivateKey, targetChainProvider);

const sourceBridgeContract = new hre.ethers.Contract(sourceBridgeContractAddress, BridgeABI.abi, sourceChainProvider);
const targetBridgeContract = new hre.ethers.Contract(targetBridgeContractAddress, BridgeABI.abi, targetChainProvider);

async function main() {
    const filter = {
        address: sourceBridgeContract.address,
        fromBlock: 'latest', // get the block number 
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
    const mintTokenContract = new hre.ethers.Contract(mintToken, BridgeERC20ABI.abi, targetChainProvider);
    const tokenName = await mintTokenContract.name();
    const newBalance = (await mintTokenContract.balanceOf(receiver)).toString();
    console.log('User\'s %s balance %d of \'%s\' token.\n', receiver, newBalance, tokenName);
};

const handleLockEvent = async (event: { data: any; topics: string[]; blockNumber: any; }) => {
    console.log('--------------Lock Event--------------');
    const decodedData = hre.ethers.utils.defaultAbiCoder.decode(['address', 'uint256'], event.data);
    const from = hre.ethers.utils.hexStripZeros(event.topics[1]);
    const lockedToken = decodedData[0];
    const lockedAmount = decodedData[1];
    console.log('Block Number :', event.blockNumber);
    console.log('From : ', from);
    console.log('TargetChainId : ', parseInt(event.topics[2]));
    console.log('Locked Token : ', lockedToken);
    console.log('Locked Amount : ', lockedAmount.toString());
    // Apply some validations ? 
    // validate the amount was deposited in source bridge contract address
    // get the target chain token from registry
    // validate locked token has a wrapped on target chain, otherwise create with factory
    let targetToken = tokenRegistry.get(lockedToken);
    if (targetToken === undefined) {
        console.log('\nDoesn\'t have corresponding wrapped token, deploying one');
        targetToken = await deployNewWrappedTokenContract(lockedToken);
        tokenRegistry.set(lockedToken, targetToken);
    }
    console.log("Validators\'s signature %s", await getValidatorMintSignature(from, lockedAmount, targetToken));
}

const deployNewWrappedTokenContract = async (sourceToken: string) => {
    const sourceTokenContract = new hre.ethers.Contract(sourceToken, BridgeERC20ABI.abi, sourceChainProvider);
    const name = await sourceTokenContract.name();
    const symbol = await sourceTokenContract.symbol();

    const ContractFactory = new hre.ethers.ContractFactory(BridgeERC20ABI.abi , BridgeERC20ABI.bytecode, validator);
    const contract = await ContractFactory.deploy("Wrapped" + name, "W" + symbol, targetBridgeContractAddress);
    console.log('Waiting for deployment... ');
    await contract.deployed();
    
    console.log('Wrapped token %s deployed on address: %s \n', "Wrapped" + name, contract.address);

    return contract.address
}

const getValidatorMintSignature = async (receiver: string, amount: BigNumber, targetToken: string) => {
    
    const EIP712Domain = [ 
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256'},
        { name: 'verifyingContract', type: 'address' }
    ];
    const chainId:number = parseInt(await targetChainProvider.send("eth_chainId", []));
    const domain = {
        name: BridgeABI.contractName,
        version: '1',
        chainId: chainId,
        verifyingContract: targetBridgeContract.address
    };
    console.log(domain);
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

main();


