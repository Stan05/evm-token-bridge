import TransactionRepository from "../repository/transaction-repository";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "../repository/models/transaction";
import SupportedTokenService from "./supported-token-service";
import {
  TransactionResponse,
  SupportedChain,
} from "./models/transaction-response";
import { SupportedToken } from "../repository/models/supported-token";
class TransactionService {
  transactionRepository: TransactionRepository = new TransactionRepository();
  supportedTokenService: SupportedTokenService = new SupportedTokenService();

  async CreateTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      await this.supportedTokenService.EnsureTokenIsSupported(
        transaction.sourceChainId,
        transaction.sourceToken
      );
      const result: Transaction =
        await this.transactionRepository.CreateTransaction(transaction);
      return result;
    } catch (err) {
      console.log(err);
      throw new Error("Unable to Create Transaction");
    }
  }

  async UpdateTransaction(transaction: Transaction) {
    try {
      await this.transactionRepository.UpdateTransaction(transaction);
    } catch (err) {
      console.log(err);
      throw new Error("Unable to Update Transaction");
    }
  }

  async GetBridgeTransaction(
    bridgeTxHash: string,
    txType: TransactionType,
    sourceChain: number,
    targetChain: number
  ): Promise<Transaction | null> {
    try {
      const existingLockTransaction =
        await this.transactionRepository.GetBridgeTransaction(
          bridgeTxHash,
          txType,
          sourceChain,
          targetChain
        );
      console.log("Get %s bridge Tx %s", txType, existingLockTransaction);
      return existingLockTransaction;
    } catch (err) {
      throw new Error("Unable to Get Transaction");
    }
  }

  async GetClaimTransaction(
    claimTxHash: string,
    txType: TransactionType,
    sourceChain: number,
    targetChain: number
  ): Promise<Transaction | null> {
    try {
      const existingLockTransaction =
        await this.transactionRepository.GetBridgeTransaction(
          claimTxHash,
          txType,
          sourceChain,
          targetChain
        );
      console.log("Get %s claim Tx %s", txType, existingLockTransaction);
      return existingLockTransaction;
    } catch (err) {
      throw new Error("Unable to Get Transaction");
    }
  }

  async ClaimTransaction(
    sourceChainId: number,
    targetChainId: number,
    bridgeTxHash: string,
    claimTxHash: string,
    txType: TransactionType
  ) {
    console.log(
      "Claiming ",
      sourceChainId,
      targetChainId,
      bridgeTxHash,
      claimTxHash,
      txType
    );
    const existingTransaction =
      await this.transactionRepository.GetBridgeTransaction(
        bridgeTxHash,
        txType,
        sourceChainId,
        targetChainId
      );
    if (existingTransaction) {
      this.supportedTokenService.EnsureTokenIsSupported(
        existingTransaction.targetChainid,
        existingTransaction.targetToken
      );
      existingTransaction.txStatus = TransactionStatus.CLAIMED;
      existingTransaction.updatedAt = new Date();
      existingTransaction.claimTxHash = claimTxHash;
      this.transactionRepository.UpdateTransaction(existingTransaction);
    } else {
      throw new Error("Transaction does not exist");
    }
  }

  async GetTransactions(account: string): Promise<TransactionResponse[]> {
    const transactions = await this.transactionRepository.GetTransactions(
      account
    );

    const transactionResponses = transactions.map((tx) =>
      this.toTransactionResponse(tx)
    );
    return Promise.all(transactionResponses);
  }

  private async toTransactionResponse(
    tx: Transaction
  ): Promise<TransactionResponse> {
    const supportedSourceToken: SupportedToken =
      await this.supportedTokenService.GetSupportedToken(
        tx.sourceChainId,
        tx.sourceToken
      );
    const supportedTargetToken =
      await this.supportedTokenService.GetSupportedToken(
        tx.targetChainid,
        tx.targetToken
      );
    return {
      bridgeTxHash: tx.bridgeTxHash,
      claimTxHash: tx.claimTxHash,
      txType: tx.txType,
      txStatus: tx.txStatus,
      sourceChain: toSupportedChain(tx.sourceChainId),
      targetChain: toSupportedChain(tx.targetChainid),
      amount: tx.amount,
      sourceToken: supportedSourceToken,
      targetToken: supportedTargetToken,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
    };
  }
}

export default TransactionService;
function toSupportedChain(sourceChainId: number): SupportedChain {
  switch (sourceChainId) {
    case 3:
      return { chainId: 3, chainName: "Ropsten" };
    case 4:
      return { chainId: 4, chainName: "Rinkeby" };
    default:
      return { chainId: -1, chainName: "undefined" };
  }
}
