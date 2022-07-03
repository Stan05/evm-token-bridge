import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import axios from "axios";
import { useEffect, useState } from "react";
import useBridgeContract from "../../hooks/useBridgeContract";
import TransactionComponent, { ITransaction } from "./TransactionComponent";

const TransactionHistory = () => {
  const { chainId, account, library } = useWeb3React<Web3Provider>();
  const bridge = useBridgeContract();
  const [transactionsChanged, setNewTransactionsRecorded] =
    useState<boolean>(false);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);

  bridge.on(bridge.filters.Lock(account), () => {
    console.log("lock tx");
    setNewTransactionsRecorded(true);
  });
  bridge.on(bridge.filters.Burn(account), () => {
    console.log("burn tx");
    setNewTransactionsRecorded(true);
  });
  bridge.on(bridge.filters.Release(account), () => {
    console.log("release tx");
    setNewTransactionsRecorded(true);
  });
  bridge.on(bridge.filters.Mint(account), () => {
    console.log("mint tx");
    setNewTransactionsRecorded(true);
  });

  const updateTransactionHistory = (account: string): void => {
    axios
      .get("http://localhost:8080/transactions/" + account)
      .then((response) => {
        if (response.data) {
          const transactions: ITransaction[] = response.data.map(toTransaction);
          console.log("Fetched transactions from API", transactions);
          setTransactions(transactions);
          setNewTransactionsRecorded(false);
        }
      })
      .catch((error) => {
        console.log("Could not fetch transactions", error);
        setTransactions([]);
        setNewTransactionsRecorded(false);
      });
  };

  useEffect(() => {
    updateTransactionHistory(account);
  }, [chainId, account, transactionsChanged]);

  return (
    <div className="transactions-history">
      <h2>Previous Transactions</h2>
      {transactions &&
        Object.values(transactions).map((transaction) => {
          return (
            <TransactionComponent
              key={transaction.bridgeTxHash}
              transaction={transaction}
              transactionChanged={() => setNewTransactionsRecorded(true)}
            ></TransactionComponent>
          );
        })}
    </div>
  );
};

export default TransactionHistory;

function toTransaction(tx: any): ITransaction {
  return {
    bridgeTxHash: tx.bridgeTxHash,
    claimTxHash: tx.claimTxHash,
    txType: tx.txType,
    txStatus: tx.txStatus,
    sourceChain: tx.sourceChain,
    targetChain: tx.targetChain,
    amount: tx.amount,
    sourceToken: tx.sourceToken,
    targetToken: tx.targetToken,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
  };
}
