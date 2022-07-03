import { BigNumber } from "ethers";
import { SupportedToken } from "../../repository/models/supported-token";

interface SupportedChain {
  chainId: number;
  chainName: string;
}

interface TransactionResponse {
  bridgeTxHash: string;
  claimTxHash?: string;
  txType: string;
  txStatus: string;
  sourceChain: SupportedChain;
  targetChain: SupportedChain;
  amount: BigNumber;
  sourceToken: SupportedToken;
  targetToken: SupportedToken;
  createdAt: Date;
  updatedAt: Date;
}

export { TransactionResponse, SupportedChain };
