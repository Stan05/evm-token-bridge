import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
import hre from 'hardhat';

async function bridge(tokenContractAddress: string, bridgeContractAddress: string) {
    
	const localProvider = new hre.ethers.providers.JsonRpcProvider(hre.config.networks.localhost.url);
    
    const [ deployer, validator, user] = await hre.ethers.getSigners();
    
    const BridgeFactory = await hre.ethers.getContractFactory("Bridge"); 
    const bridgeContract = BridgeFactory.attach(bridgeContractAddress);
    
    const TokenFactory = await hre.ethers.getContractFactory("ERC20Token");
    const tokenContract = TokenFactory.attach(tokenContractAddress);
    console.log('tokenContract');
    await tokenContract.mint(user.address, 10);
    
    console.log('User address ', user.address);
    console.log('User balance ', (await tokenContract.balanceOf(user.address)).toString());
    console.log('Bridge contract balance after lock tx', (await tokenContract.balanceOf(bridgeContract.address)).toString());

    const signature = await getSignature(user.address, bridgeContract.address, tokenContract, localProvider, 10);

    console.log('Prepared the permit signature');
   
    console.log('Sending lock tx');
    await bridgeContract.connect(user).lock(1337, tokenContract.address, 10, signature.deadline, signature.v, signature.r, signature.s);
    console.log('Bridge contract balance after lock tx', (await tokenContract.balanceOf(bridgeContract.address)).toString());
    console.log('User balance ', (await tokenContract.balanceOf(user.address)).toString());
}


async function getSignature(userAddress: string, spender: string, tokenContract: Contract, provider: JsonRpcProvider, permitAmount: number) {
    const nonce = (await tokenContract.nonces(userAddress));
    const deadline = + new Date() + 60 * 60; 
    
    const EIP712Domain = [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
    ];

    const chainId: number = parseInt(await provider.send("eth_chainId", []));
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
        nonce: nonce.toHexString(),
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

module.exports = bridge;