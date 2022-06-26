import { BigNumber, Contract, Wallet } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import GovernanceABI from "../abis/Governance.json";

const getValidatorAllowanceSignature = async (
  wallet: Wallet,
  provider: JsonRpcProvider,
  receiverAddress: string,
  amount: BigNumber,
  tokenAddress: string,
  governance: Contract
): Promise<string> => {
  const chainId: number = parseInt(await provider.send("eth_chainId", []));
  const nonce = await governance.nonces(receiverAddress);
  return await wallet._signTypedData(
    {
      name: GovernanceABI.contractName,
      version: "1",
      chainId: chainId,
      verifyingContract: governance.address,
    },
    {
      Allowance: [
        { name: "receiver", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "token", type: "address" },
        { name: "nonce", type: "uint256" },
      ],
    },
    {
      receiver: receiverAddress,
      amount: amount,
      token: tokenAddress,
      nonce: nonce,
    }
  );
};

export { getValidatorAllowanceSignature };
