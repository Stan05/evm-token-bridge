import {
  LockTransaction,
  LockTransactionModel,
} from "./models/lock-transaction";

//Dealing with data base operations
class ValidatorRepository {
  async CreateLockTransaction(lockTransaction: LockTransaction) {
    try {
      console.log("Saving Lock Transaction", lockTransaction);
      const lockTransactionModel = new LockTransactionModel(lockTransaction);
      const lockTransactionResult = await lockTransactionModel.save();
      return lockTransactionResult;
    } catch (err) {
      console.log(err);
      throw new Error("Unable to Create Lock Transaction");
    }
  }

  async GetLockTransaction(txHash: string) {
    try {
      const existingLockTransaction = await LockTransactionModel.findOne({
        txHash: txHash,
      });
      console.log("Get Lock Tx", existingLockTransaction);
      return existingLockTransaction;
    } catch (err) {
      throw new Error("Unable to Create Lock Transaction");
    }
  }
}

export default ValidatorRepository;
