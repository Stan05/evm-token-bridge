import { Wallet, Contract, ethers } from "ethers";
import GovernanceABI from '../../artifacts/contracts/Governance.sol/Governance.json';

const getUserPermit = async (user: Wallet, token: Contract, spender: string, amount: number, chainId: number) => {
    const nonce = await token.nonces(user.address);
    const deadline: number = + new Date() + 60 * 60; 
    
    const signature = await user._signTypedData(
      {
        name: await token.name(),
        version: '1',
        chainId: chainId,
        verifyingContract: token.address
      },
      {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
          ],
      },
      {
        owner: user.address, 
        spender: spender, 
        value: amount,
        nonce: nonce,
        deadline: deadline
      });
      
      const splitSignature = ethers.utils.splitSignature(signature);
      const preparedSignature = {
          v: splitSignature.v,
          r: splitSignature.r,
          s: splitSignature.s,
          deadline
      };
      return preparedSignature;
  }
  
const getValidatorAllowanceSignature = async (validator: Wallet, receiverAddress: string, amount: number, targetToken: string, governance: Contract) => {
    const nonce = await governance.nonces(receiverAddress);
    return await validator._signTypedData(
      {
        name: GovernanceABI.contractName,
        version: '1',
        chainId: 1,
        verifyingContract: governance.address
      },
      {
          Allowance: [
            { name: 'receiver', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'token', type: 'address' },
            { name: 'nonce', type: 'uint256' }
          ],
      },
      {
        receiver: receiverAddress, 
        amount: amount, 
        token: targetToken,
        nonce: nonce
      });
}

export {
    getUserPermit,
    getValidatorAllowanceSignature
}