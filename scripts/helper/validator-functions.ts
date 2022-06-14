import { BigNumber, Wallet } from "ethers";
import { JsonRpcProvider } from '@ethersproject/providers';
import BridgeABI from '../../artifacts/contracts/Bridge.sol/Bridge.json';

const getValidatorAllowanceSignature = async (wallet: Wallet, 
        provider: JsonRpcProvider, 
        receiverAddress: string, 
        amount: BigNumber, 
        tokenAddress: string, 
        bridgeContractAddress: string): Promise<string> => {
  const chainId: number = parseInt(await provider.send("eth_chainId", []));
  return await wallet._signTypedData(
    {
      name: BridgeABI.contractName,
      version: '1',
      chainId: chainId,
      verifyingContract: bridgeContractAddress
    },
    {
      Allowance: [
        { name: 'receiver', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'token', type: 'address' }
      ],
    },
    {
      receiver: receiverAddress, 
      amount: amount, 
      token: tokenAddress,
    });
}

const getValidatorTokenCreationSignature = async (wallet: Wallet, 
        provider: JsonRpcProvider,
        bridgeContractAddress: string,
        userAddress: string,
        tokenName: string,
        tokenSymbol: string): Promise<string> => {
  const chainId: number = parseInt(await provider.send("eth_chainId", []));
  return await wallet._signTypedData(
      {
        name: BridgeABI.contractName,
        version: '1',
        chainId: chainId,
        verifyingContract: bridgeContractAddress
      },
      {
          TokenCreation: [
            { name: 'from', type: 'address' },
            { name: 'name', type: 'string' },
            { name: 'symbol', type: 'string' }
          ],
      },
      {
        from: userAddress, 
        name: tokenName, 
        symbol: tokenSymbol,
      });
}

export {
    getValidatorAllowanceSignature,
    getValidatorTokenCreationSignature
}