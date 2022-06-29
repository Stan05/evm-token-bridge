import TransactionRepository from "../repository/transaction-repository";
import { Transaction, TransactionType } from "../repository/models/transaction";
import SupportedTokenService from "./supported-token-service";

class TransactionService {
  transactionRepository: TransactionRepository = new TransactionRepository();
  supportedTokenService: SupportedTokenService = new SupportedTokenService();

  async CreateTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      console.log("Saving Transaction", transaction);
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

  async GetTransaction(
    txHash: string,
    txType: TransactionType,
    sourceChain: number,
    targetChain: number
  ): Promise<Transaction | null> {
    try {
      const existingLockTransaction =
        await this.transactionRepository.GetTransaction(
          txHash,
          txType,
          sourceChain,
          targetChain
        );
      console.log("Get %s Tx %s", txType, existingLockTransaction);
      return existingLockTransaction;
    } catch (err) {
      throw new Error("Unable to Get Transaction");
    }
  }
}

export default TransactionService;
