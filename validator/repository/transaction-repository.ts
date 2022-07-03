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

  async UpdateTransaction(
    transaction: Transaction
  ): Promise<Transaction | null> {
    console.log("Update Transaction", transaction);
    return await TransactionModel.findOneAndUpdate(
      { bridgeTxHash: transaction.bridgeTxHash },
      transaction
    );
  }

  async GetBridgeTransaction(
    bridgeTxHash: string,
    txType: TransactionType,
    sourceChain: number,
    targetChain: number
  ): Promise<Transaction | null> {
    const existingTransaction: Transaction | null =
      await TransactionModel.findOne({
        bridgeTxHash: bridgeTxHash,
        txType: txType,
        sourceChainId: sourceChain,
        targetChain: targetChain,
      });
    return existingTransaction;
  }

  async GetClaimTransaction(
    claimTxHash: string,
    txType: TransactionType,
    sourceChain: number,
    targetChain: number
  ): Promise<Transaction | null> {
    const existingTransaction: Transaction | null =
      await TransactionModel.findOne({
        claimTxHash: claimTxHash,
        txType: txType,
        sourceChainId: sourceChain,
        targetChain: targetChain,
      });
    return existingTransaction;
  }

  async GetTransactions(account: string): Promise<Transaction[]> {
    return await TransactionModel.find({
      from: { $regex: "^" + account + "$", $options: "i" },
    }).sort("-createdAt");
  }
}

export default TransactionRepository;
