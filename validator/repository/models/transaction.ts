import { BigNumber } from "ethers";
import mongoose from "mongoose";

enum TransactionType {
  BURN,
  LOCK,
}

interface Transaction {
  txHash: String;
  txType: TransactionType;
  from: String;
  sourceChainId: number;
  targetChainid: number;
  amount: BigNumber;
  sourceToken: String;
  targetToken: String;
  signatures?: String[];
}

const TransactionSchema = new mongoose.Schema<Transaction>({
  txHash: { type: String, required: true },
  txType: { type: Number, enum: TransactionType, required: true },
  from: { type: String, required: true },
  sourceChainId: { type: Number, required: true },
  targetChainid: { type: Number, required: true },
  sourceToken: { type: String, required: true },
  targetToken: { type: String, required: true },
  amount: { type: String, required: true },
  signatures: [String],
});

const TransactionModel = mongoose.model("Transaction", TransactionSchema);

export { TransactionType, Transaction, TransactionModel };
