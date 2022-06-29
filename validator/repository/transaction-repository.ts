import {
  Transaction,
  TransactionModel,
  TransactionType,
} from "./models/transaction";

//Dealing with data base operations
class TransactionRepository {
  async CreateTransaction(lockTransaction: Transaction): Promise<Transaction> {
    console.log("Saving Transaction", lockTransaction);
    const transactionModel = new TransactionModel(lockTransaction);
    const transactionResult: Transaction = await transactionModel.save();
    return transactionResult;
  }

  async GetTransaction(
    txHash: string,
    txType: TransactionType,
    sourceChain: number,
    targetChain: number
  ): Promise<Transaction | null> {
    const existingTransaction: Transaction | null =
      await TransactionModel.findOne({
        txHash: txHash,
        txType: txType,
        sourceChainId: sourceChain,
        targetChain: targetChain,
      });
    return existingTransaction;
  }
}

export default TransactionRepository;
