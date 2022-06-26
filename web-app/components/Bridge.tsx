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
import BridgeStarted from "./BridgeStarted";
import BridgeSetup from "./BridgeSetup";

export type BridgeFormData = {
  sourceChain: number;
  targetChain: number;
  sourceToken: string;
  bridgeAmount: number;
};

const Bridge = () => {
  const {
    chainId: connectedChain,
    account,
    library,
  } = useWeb3React<Web3Provider>();
  const sourceBridge = useBridgeContract();
  // -------------  BRIDGE SETUP START --------------- //
  // Bridge Inputs Data
  const [supportedSourceChains, setSupportedSourceChains] = useState<
    SelectSearchOption[]
  >([]);
  const [supportedTargetChains, setSupportedTargetChains] = useState<
    SelectSearchOption[]
  >([]);
  const [supportedSourceTokens, setSupportedSourceTokens] = useState<
    SelectSearchOption[]
  >([]);

  // Bridge Form Data
  const [bridgeFormData, setBridgeFormData] = useState<BridgeFormData>();
  const [sourceChain, setSourceChain] = useState<number>(0);
  const [targetChain, setTargetChain] = useState<number>(0);
  const [sourceToken, setSourceToken] = useState<string>("");
  const [bridgeAmount, setBridgeAmount] = useState<number>();
  // -------------  BRIDGE SETUP END --------------- //

  // -------------  BRIDGE STARTED START --------------- //
  const [isBridgTxClaimable, setIsBridgeTxClaimable] = useState<boolean>(false);
  const [bridgeTxHash, setBridgeTxHash] = useState<string>();

  // -------------  BRIDGE STARTED END --------------- //

  // Bridge State
  const [sourceTokenContract, setSourceTokenContract] = useState<Contract>();
  const [availabeSourceTokenAmount, setAvailableSourceTokenAmount] =
    useState<BigNumber>();
  const [selectedSourceTokenDetails, setSelectedSourceTokenDetails] =
    useState<BridgeSupportedToken>();
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [hasBridgingStarted, setHasBridgingStarted] = useState<boolean>(false);

  /*const initializeInputData = async (chainId: number) => {
    setSourceChain(chainId);

    // Initialize supported chains
    const selectableSourceChains: SelectSearchOption[] =
      bridgeSupportedChains.map((supportedChain) =>
        fromSupportedChain(supportedChain)
      );
    setSupportedSourceChains(selectableSourceChains);
    setSupportedTargetChains(
      selectableSourceChains.filter(
        (supportedChain) => supportedChain.value !== chainId
      )
    );

    // Initialize supported source tokens
    const supportedSourceTokens: SelectSearchOption[] = bridgeSupportedChains
      .find((supportedChain) => supportedChain.chainId === chainId)
      ?.supportedTokens.map((supportedToken) =>
        fromSupportedToken(supportedToken)
      );
    setSupportedSourceTokens(supportedSourceTokens);
  };*/

  const requestNetworkSwitch = async (selectedNetwork: number) => {
    if (!window.ethereum) throw new Error("No wallet found");
    if (selectedNetwork !== connectedChain) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${Number(selectedNetwork).toString(16)}` }],
        });
        setSourceChain(selectedNetwork);
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            // TODO: Add support for adding chain to metamask
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xf00",
                  chainName: "...",
                  rpcUrls: ["https://..."] /* ... */,
                },
              ],
            });
          } catch (addError) {
            console.log("Error on adding new chain");
          }
        }
      }
    }
  };
  /*
  const handleSourceTokenChanged = async (sourceToken) => {
    setSourceToken(sourceToken);
    const tokenContract: Contract = new Contract(
      sourceToken,
      ERC20Token_ABI.abi,
      library.getSigner(account)
    );

    setAvailableSourceTokenAmount(await tokenContract.balanceOf(account));
    setSourceTokenContract(tokenContract);
    setSelectedSourceTokenDetails({
      name: await tokenContract.name(),
      symbol: await tokenContract.symbol(),
      address: tokenContract.address,
      decimals: await tokenContract.decimals(),
    });
  };

  const sendBridgeTransaction = async () => {
    if (isFormValid) {
      console.log(
        "Sending bridge lock transaction from chain %d and token %s with amount %f to chain %d",
        sourceChain,
        sourceToken,
        bridgeAmount,
        targetChain
      );
      const normalizedAmount =
        bridgeAmount * (10 ^ selectedSourceTokenDetails.decimals);

      await getUserPermit(
        account,
        sourceBridge.address,
        sourceTokenContract,
        window.ethereum,
        normalizedAmount
      ).then(async (signature) => {
        await sourceBridge
          .lock(
            targetChain,
            sourceToken,
            normalizedAmount,
            signature.deadline,
            signature.v,
            signature.r,
            signature.s
          )
          .then((tx) => {
            console.log(tx);
            setHasBridgingStarted(true);
            setBridgeTxHash(tx.hash);
          })
          .catch(() => {
            setHasBridgingStarted(false);
          });
      });
    }
  };

  const claimBridgeTransaction = async () => {
    const targetBridgeAddress: string = tryGetContractAddress(
      targetChain,
      BRIDGE
    );
    console.log(targetBridgeAddress);
    const targetBridge: Contract = new Contract(
      targetBridgeAddress,
      BRIDGE_ABI.abi,
      library.getSigner(account)
    );
    const normalizedAmount =
      bridgeAmount * (10 ^ selectedSourceTokenDetails.decimals);
    console.log(bridgeAmount);
    const estimate = await targetBridge.estimateGas.mint(
      account,
      normalizedAmount,
      "0x87731fDC857708b8974E28Aada134AA9affe9f85",
      [
        "0x0727b7c1b57bb48a13597ea8db1e3f6271d030a02045182d650ab7a7ab2790aa46fd1ddc75950e5c233aa6b7cc6a6ebd10b802b0004a566d906edf495647eb2f1c",
      ],
      { value: ethers.utils.parseEther("0.005") }
    );
    console.log(estimate);
    await targetBridge.mint(
      account,
      normalizedAmount,
      "0x87731fDC857708b8974E28Aada134AA9affe9f85",
      [
        "0x0727b7c1b57bb48a13597ea8db1e3f6271d030a02045182d650ab7a7ab2790aa46fd1ddc75950e5c233aa6b7cc6a6ebd10b802b0004a566d906edf495647eb2f1c",
      ],
      { value: ethers.utils.parseEther("0.005") }
    );
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
    setIsFormValid(
      isSet(sourceChain) &&
        isSet(targetChain) &&
        isSet(sourceToken) &&
        isSet(bridgeAmount)
    );
  }, [sourceChain, targetChain, sourceToken, bridgeAmount]);

  useEffect(() => {
    initializeInputData(connectedChain);
  }, [connectedChain]);

  useEffect(() => {
    if (isBridgTxClaimable) {
      requestNetworkSwitch(targetChain);
    }
  }, [isBridgTxClaimable]);

  useInterval(async () => {
    if (hasBridgingStarted && bridgeTxHash && !isBridgTxClaimable) {
      console.log("Bridging started, polling for tx mined");
      const isTxMined = await isTransactionMined(bridgeTxHash);
      setIsBridgeTxClaimable(isTxMined);
    }
  }, 1000);
*/
  return (
    <div className="bridge-wrapper">
      {!hasBridgingStarted ? (
        <BridgeSetup
          bridgeFormData={bridgeFormData}
          setBridgeFormData={setBridgeFormData}
          setHasBridgingStarted={setHasBridgingStarted}
          setBridgeTxHash={setBridgeTxHash}
          requestNetworkSwitch={requestNetworkSwitch}
        ></BridgeSetup>
      ) : (
        /*<div className="bridge-setup">
          <div className="bridge-chains-selectors">
            <div>
              <label htmlFor="sourceChain">Transfer from</label>
              <SelectSearch
                options={supportedSourceChains}
                id="sourceChain"
                search
                value={sourceChain}
                onChange={(selectedValue) =>
                  requestNetworkSwitch(selectedValue)
                }
                placeholder="Choose Chain"
              />
            </div>
            <div>
              <label htmlFor="targetChain">Transfer to</label>
              <SelectSearch
                options={supportedTargetChains}
                id="targetChain"
                search
                value={targetChain}
                placeholder="Choose Chain"
                onChange={(selectedValue) => setTargetChain(selectedValue)}
              />
            </div>
          </div>

          <div className="bridge-tokens-selectors">
            <div>
              <label htmlFor="sourceToken">You send</label>
              <SelectSearch
                options={supportedSourceTokens}
                id="sourceToken"
                search
                value={sourceToken}
                placeholder="Choose Token"
                onChange={handleSourceTokenChanged}
              />
            </div>
            <div>
              {selectedSourceTokenDetails && availabeSourceTokenAmount && (
                <p>
                  Balance
                  {`${
                    " " +
                    selectedSourceTokenDetails.symbol +
                    " " +
                    ethers.utils.formatUnits(
                      availabeSourceTokenAmount,
                      selectedSourceTokenDetails.decimals
                    )
                  }` ?? 0}
                </p>
              )}
              <NumberFormat
                value={bridgeAmount?.toString()}
                onValueChange={(value) => setBridgeAmount(value.floatValue)}
                allowNegative={false}
                thousandSeparator={true}
                className="some"
                inputMode="numeric"
              />
            </div>
          </div>

          <button
            disabled={!isFormValid}
            onClick={() => sendBridgeTransaction()}
          >
            Confirm
          </button>
          <button onClick={() => setHasBridgingStarted(!hasBridgingStarted)}>
            Start
          </button>
        </div>*/
        <BridgeStarted
          targetChain={targetChain}
          bridgeAmount={
            bridgeAmount * (10 ^ selectedSourceTokenDetails?.decimals ?? 18)
          }
          bridgeTxHash={bridgeTxHash}
          requestNetworkSwitch={requestNetworkSwitch}
        ></BridgeStarted>
        /*<div className="bridge-started">
          {!isBridgTxClaimable ? (
            <p className="waiting">Waiting for your transaction to be mined.</p>
          ) : (
            <p>
              You can claim your tokens after you connect to the target chain.
            </p>
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
        </div>*/
      )}
    </div>
  );
};

function isSet(variable: any): boolean {
  if (variable) {
    return true;
  }
  return false;
}

function fromSupportedChain(
  supportedChain: BridgeSupportedChain
): SelectSearchOption {
  return { name: supportedChain.chainName, value: supportedChain.chainId };
}

function fromSupportedToken(
  supportedToken: BridgeSupportedToken
): SelectSearchOption {
  return {
    name: supportedToken.name + "(" + supportedToken.symbol + ")",
    value: supportedToken.address,
  };
}

export default Bridge;
