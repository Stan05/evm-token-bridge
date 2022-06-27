import {
  Transaction,
  TransactionModel,
  TransactionType,
} from "./models/transaction";

//Dealing with data base operations
class ValidatorRepository {
  async CreateTransaction(lockTransaction: Transaction) {
    try {
      console.log("Saving Transaction", lockTransaction);
      const lockTransactionModel = new TransactionModel(lockTransaction);
      const lockTransactionResult = await lockTransactionModel.save();
      return lockTransactionResult;
    } catch (err) {
      console.log(err);
      throw new Error("Unable to Create Lock Transaction");
    }
  }

  async GetTransaction(txHash: string, txType: TransactionType) {
    try {
      const existingLockTransaction = await TransactionModel.findOne({
        txHash: txHash,
        txType: txType,
      });
      console.log("Get %s Tx %s", txType, existingLockTransaction);
      return existingLockTransaction;
    } catch (err) {
      throw new Error("Unable to Create Lock Transaction");
    }
  }
}

export default ValidatorRepository;
