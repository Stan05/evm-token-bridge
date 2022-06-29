import { BigNumber, Contract, ethers, Wallet } from "ethers";
import {
  StaticJsonRpcProvider,
  TransactionResponse,
  TransactionReceipt,
} from "@ethersproject/providers";
import GovernanceABI from "../abis/Governance.json";

const getValidatorAllowanceSignature = async (
  wallet: Wallet,
  provider: StaticJsonRpcProvider,
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

/**
 * Retrieves the transaction from the chain and waits 13 confirmation blocks for it.
 * After confirming the finality ensures the status of it is successfuly.
 *
 * @param chainProvider the chain provider to query for the transaction
 * @param transactionHash the transaction hash
 * @returns true if the tx is successful after waiting for finality
 */
const ensureFinality = async (
  chainProvider: StaticJsonRpcProvider,
  transactionHash: any
): Promise<boolean> => {
  const lockTx: TransactionResponse = await chainProvider.getTransaction(
    transactionHash
  );

  console.log(
    "Received event from transaction %s waiting 7 blocks for confirmation",
    transactionHash
  );

  if (lockTx) {
    const lockTxReceipt: TransactionReceipt = await lockTx.wait(7);
    return lockTxReceipt.status == 1;
  }
  return false;
};

export { getValidatorAllowanceSignature, ensureFinality };
