import {
  TransactionReceipt,
  TransactionResponse,
  Web3Provider,
} from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useState } from "react";
import useInterval from "use-interval";
import { requestNetworkSwitch } from "../../utils/helper-functions";
import { ITransaction } from "./TransactionComponent";

const PendingTransaction = ({
  transaction,
  baseTransactionComponent,
  transactionChanged,
}: {
  transaction: ITransaction;
  baseTransactionComponent: (transaction: ITransaction) => JSX.Element;
  transactionChanged: () => void;
}) => {
  const { chainId, library } = useWeb3React<Web3Provider>();
  const [checkInitiated, setCheckInitiated] = useState<boolean>(false);
  const [isPendingTxMined, setIsPendingTxMined] = useState<boolean>(false);

  const isTransactionMined = async (
    transactionHash: string
  ): Promise<boolean> => {
    const txResponse: TransactionResponse = await library.getTransaction(
      transactionHash
    );
    const txReceipt: TransactionReceipt =
      txResponse && (await txResponse.wait(7));
    if (txReceipt && txReceipt.status == 1) {
      return true;
    }
    return false;
  };

  useInterval(async () => {
    if (
      (transaction.txStatus === "WAITING_CLAIM" ||
        transaction.txStatus === "WAITING_FINALITY") &&
      !isPendingTxMined
    ) {
      // check if the tx is mined
      setCheckInitiated(true);
      const isTxMined = await isTransactionMined(transaction.bridgeTxHash);
      setIsPendingTxMined(isTxMined);
      transactionChanged();
    }
  }, 5000);

  return (
    <div
      {...{
        className: !isPendingTxMined
          ? "transaction-history waiting"
          : "transaction-history",
      }}
    >
      {{ ...baseTransactionComponent(transaction) }}
      {" | "}
      <button
        disabled={!isPendingTxMined}
        onClick={() =>
          requestNetworkSwitch(transaction.targetChain.chainId, chainId)
        }
      >
        Switch
      </button>
    </div>
  );
};

export default PendingTransaction;
