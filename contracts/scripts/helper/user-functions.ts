import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract, ethers } from 'ethers';

async function getUserPermit(userAddress: string, spender: string, tokenContract: Contract, provider: JsonRpcProvider, permitAmount: number) {
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
    const signature = ethers.utils.splitSignature(signatureLike);
    const preparedSignature = {
        v: signature.v,
        r: signature.r,
        s: signature.s,
        deadline
    };

    return preparedSignature;
}

export {
    getUserPermit
}