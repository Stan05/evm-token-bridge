import { BigNumber, Wallet } from "ethers";
import { JsonRpcProvider } from '@ethersproject/providers';
import GovernanceABI from '../../artifacts/contracts/Governance.sol/Governance.json';

const getValidatorAllowanceSignature = async (wallet: Wallet, 
        provider: JsonRpcProvider, 
        receiverAddress: string, 
        amount: BigNumber, 
        tokenAddress: string, 
        governanceContractAddress: string): Promise<string> => {
  const chainId: number = parseInt(await provider.send("eth_chainId", []));
  return await wallet._signTypedData(
    {
      name: GovernanceABI.contractName,
      version: '1',
      chainId: chainId,
      verifyingContract: governanceContractAddress
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

export {
    getValidatorAllowanceSignature
}