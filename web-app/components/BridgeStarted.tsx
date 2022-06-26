import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import {
  BridgeSupportedChain,
  bridgeSupportedChains,
  BridgeSupportedToken,
} from "../constants/networks";
import { SelectSearchOption } from "react-select-search";
import SelectSearch from "react-select-search";
import NumberFormat from "react-number-format";
import useBridgeContract from "../hooks/useBridgeContract";
import {
  getUserPermit,
  tryGetContractAddress,
} from "../utils/helper-functions";
import { BigNumber, Contract, ethers } from "ethers";
import ERC20Token_ABI from "../contracts/ERC20Token.json";
import BRIDGE_ABI from "../contracts/Bridge.json";
import { useInterval } from "use-interval";
import { formatEtherscanLink, shortenHex } from "../util";
import { BRIDGE } from "../constants";

interface BridgeStartedInterface {
  targetChain: number;
  bridgeAmount: number;
  bridgeTxHash: string;
  requestNetworkSwitch: (chainId: number) => void;
}

const BridgeStarted = ({
  targetChain,
  bridgeAmount,
  bridgeTxHash,
  requestNetworkSwitch,
}: BridgeStartedInterface) => {
  const {
    chainId: connectedChain,
    account,
    library,
  } = useWeb3React<Web3Provider>();
  const targetBridgeAddress: string = tryGetContractAddress(
    targetChain,
    BRIDGE
  );
  const targetBridge = useBridgeContract(targetBridgeAddress);

  const [isBridgTxClaimable, setIsBridgeTxClaimable] = useState<boolean>(false);

  const claimBridgeTransaction = async () => {
    await targetBridge
      .mint(
        account,
        bridgeAmount,
        "0x87731fDC857708b8974E28Aada134AA9affe9f85", //TODO: Validator to give me that and the signatures
        [
          "0x0727b7c1b57bb48a13597ea8db1e3f6271d030a02045182d650ab7a7ab2790aa46fd1ddc75950e5c233aa6b7cc6a6ebd10b802b0004a566d906edf495647eb2f1c",
        ],
        { value: ethers.utils.parseEther("0.005") }
      )
      .then((result) => {
        console.log("Success mint ", result);
      })
      .catch((error) => {
        console.log("Error mint", error);
      });
  };

  const isTransactionMined = async (
    transactionHash: string
  ): Promise<boolean> => {
    const txReceipt = await library.getTransactionReceipt(transactionHash);
    console.log(txReceipt);
    if (txReceipt && txReceipt.blockNumber) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (isBridgTxClaimable) {
      requestNetworkSwitch(targetChain);
    }
  }, [isBridgTxClaimable]);

  useInterval(async () => {
    if (bridgeTxHash && !isBridgTxClaimable) {
      console.log("Bridging started, polling for tx mined");
      const isTxMined = await isTransactionMined(bridgeTxHash);
      setIsBridgeTxClaimable(isTxMined);
    }
  }, 1000);

  return (
    <div className="bridge-started">
      {!isBridgTxClaimable ? (
        <p className="waiting">Waiting for your transaction to be mined.</p>
      ) : (
        <p>You can claim your tokens after you connect to the target chain.</p>
      )}
      {bridgeTxHash && (
        <p>
          You can check it at
          <a
            {...{
              className: "href",
              href: formatEtherscanLink("Transaction", [
                connectedChain,
                bridgeTxHash,
              ]),
              target: "_blank",
              rel: "noopener noreferrer",
            }}
          >
            {shortenHex(bridgeTxHash)}
          </a>
        </p>
      )}

      <button
        //disabled={!isBridgTxClaimable}
        onClick={() => claimBridgeTransaction()}
      >
        Claim
      </button>
    </div>
  );
};

export default BridgeStarted;
