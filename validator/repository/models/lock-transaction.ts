import { BigNumber, BytesLike } from "ethers";
import mongoose from "mongoose";

interface LockTransaction {
  txHash: String;
  from: String;
  targetChainid: number;
  lockedAmount: BigNumber;
  lockedToken: String;
  targetToken: String;
  signatures?: String[];
}

const LockTransactionSchema = new mongoose.Schema<LockTransaction>({
  txHash: { type: String, required: true },
  from: { type: String, required: true },
  targetChainid: { type: Number, required: true },
  lockedAmount: { type: String, required: true },
  targetToken: { type: String, required: true },
  signatures: [String],
});

const LockTransactionModel = mongoose.model(
  "LockTransaction",
  LockTransactionSchema
);

export { LockTransaction, LockTransactionModel };
