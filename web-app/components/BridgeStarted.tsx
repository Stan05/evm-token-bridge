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
import useFeeCalculatorContract from "../hooks/useFeeCalculatorContract";

interface BridgeStartedInterface {
  targetChain: number;
  bridgeAmount: BigNumber;
  bridgeTxHash: string;
  requestNetworkSwitch: (chainId: number) => void;
  setHasBridgingStarted: (chainId: boolean) => void;
}

const BridgeStarted = ({
  targetChain,
  bridgeAmount,
  bridgeTxHash,
  requestNetworkSwitch,
  setHasBridgingStarted,
}: BridgeStartedInterface) => {
  const {
    chainId: connectedChain,
    account,
    library,
  } = useWeb3React<Web3Provider>();
  useFeeCalculatorContract();
  const targetBridgeAddress: string = tryGetContractAddress(
    targetChain,
    BRIDGE
  );
  const targetBridge = useBridgeContract(targetBridgeAddress);

  const [isMintTxClaimable, setIsMintTxClaimable] = useState<boolean>(false);
  const [claimTxHash, setClaimTxHash] = useState<string>();

  const claimBridgeTransaction = async () => {
    await targetBridge
      .mint(
        account,
        bridgeAmount,
        "0x87731fDC857708b8974E28Aada134AA9affe9f85", //TODO: Validator to give me that and the signatures
        [
          "0x52f4eec5352b87a1c4c5f95ec1f59ffb4049bf0daa542414e277c8180dae96cf2c62109001e62c3bb2b786d28d7c205e6bbdec66eeab418e07e658a8669f3e4a1b",
        ],
        { value: ethers.utils.parseEther("0.005") }
      )
      .then((result) => {
        console.log("Success mint ", result);
        setClaimTxHash(result.hash);
        setIsMintTxClaimable(false);
        setHasBridgingStarted(false);
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
    if (isMintTxClaimable) {
      requestNetworkSwitch(targetChain);
    }
  }, [isMintTxClaimable]);

  useInterval(async () => {
    if (bridgeTxHash && !isMintTxClaimable) {
      console.log("Bridging started, polling for tx mined");
      const isTxMined = await isTransactionMined(bridgeTxHash);
      setIsMintTxClaimable(isTxMined);
    }
  }, 1000);

  return (
    <div className="bridge-started">
      {!isMintTxClaimable ? (
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
      {claimTxHash && (
        <p>
          Your tokens are being claimed with tx
          <a
            {...{
              className: "href",
              href: formatEtherscanLink("Transaction", [
                connectedChain,
                claimTxHash,
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
