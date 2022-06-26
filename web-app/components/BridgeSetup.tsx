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
import { getUserPermit } from "../utils/helper-functions";
import { BigNumber, Contract, ethers } from "ethers";
import ERC20Token_ABI from "../contracts/ERC20Token.json";
import { BridgeFormData, BridgeTxType } from "./Bridge";
import useWrappedTokenFactory from "../hooks/useWrappedTokenFactory";

interface BridgeStartedInterface {
  bridgeFormData: BridgeFormData;
  setBridgeFormData: (BridgeFormData: BridgeFormData) => void;
  setHasBridgingStarted: (hasBridgingStarted: boolean) => void;
  setBridgeTxHash: (bridgeTxHash: string) => void;
  requestNetworkSwitch: (chainId: number) => void;
}

const Bridge = ({
  bridgeFormData,
  setBridgeFormData,
  setHasBridgingStarted,
  setBridgeTxHash,
  requestNetworkSwitch,
}: BridgeStartedInterface) => {
  const {
    chainId: connectedChain,
    account,
    library,
  } = useWeb3React<Web3Provider>();
  const sourceBridge = useBridgeContract();
  const sourceWrappedTokenFactory = useWrappedTokenFactory();

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

  // Bridge State
  const [sourceTokenContract, setSourceTokenContract] = useState<Contract>();
  const [availabeSourceTokenAmount, setAvailableSourceTokenAmount] =
    useState<BigNumber>();
  const [selectedSourceTokenDetails, setSelectedSourceTokenDetails] =
    useState<BridgeSupportedToken>();
  const [isFormValid, setIsFormValid] = useState<boolean>(false);

  const initializeInputData = async (chainId: number) => {
    setBridgeFormData({
      ...bridgeFormData,
      sourceChain: chainId,
    });
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
  };

  const handleSourceTokenChanged = async (sourceToken) => {
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
    setBridgeFormData({
      ...bridgeFormData,
      bridgeTxType: isWrappedTokenSelected(sourceToken)
        ? BridgeTxType.BURN
        : BridgeTxType.LOCK,
      sourceToken: sourceToken,
    });
  };

  const sendBridgeTransaction = async () => {
    if (isFormValid) {
      console.log(
        "Sending bridge lock transaction from chain %d and token %s with amount %f to chain %d",
        bridgeFormData.sourceChain,
        bridgeFormData.sourceToken,
        bridgeFormData.bridgeAmountInput,
        bridgeFormData.targetChain
      );
      await getUserPermit(
        account,
        sourceBridge.address,
        sourceTokenContract,
        window.ethereum,
        bridgeFormData.bridgeAmount
      ).then(async (signature) => {
        await sourceBridge
          .lock(
            bridgeFormData.targetChain,
            bridgeFormData.sourceToken,
            bridgeFormData.bridgeAmount,
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
          .catch((error) => {
            console.log("Tx Failed");
            setHasBridgingStarted(false);
          });
      });
    }
  };

  const isWrappedTokenSelected = async (
    sourceToken: string
  ): Promise<boolean> => {
    return (
      (await sourceWrappedTokenFactory.lookupTokenContract(sourceToken)) !=
      undefined
    );
  };

  useEffect(() => {
    setIsFormValid(
      isSet(bridgeFormData) &&
        isSet(bridgeFormData.sourceChain) &&
        isSet(bridgeFormData.targetChain) &&
        isSet(bridgeFormData.sourceToken) &&
        isSet(bridgeFormData.bridgeAmount)
    );
  }, [bridgeFormData]);

  useEffect(() => {
    initializeInputData(connectedChain);
  }, [connectedChain]);

  return (
    <div className="bridge-setup">
      <div className="bridge-chains-selectors">
        <div>
          <label htmlFor="sourceChain">Transfer from</label>
          <SelectSearch
            options={supportedSourceChains}
            id="sourceChain"
            search
            value={bridgeFormData?.sourceChain}
            onChange={(selectedValue) => requestNetworkSwitch(selectedValue)}
            placeholder="Choose Chain"
          />
        </div>
        <div>
          <label htmlFor="targetChain">Transfer to</label>
          <SelectSearch
            options={supportedTargetChains}
            id="targetChain"
            search
            value={bridgeFormData?.targetChain}
            placeholder="Choose Chain"
            onChange={(targetChain) =>
              setBridgeFormData({
                ...bridgeFormData,
                targetChain: targetChain,
              })
            }
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
            value={bridgeFormData?.sourceToken}
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
            value={bridgeFormData?.bridgeAmountInput}
            onValueChange={(value, source) => {
              if (source.event) {
                setBridgeFormData({
                  ...bridgeFormData,
                  bridgeAmountInput: value.floatValue,
                  bridgeAmount: BigNumber.from(value?.floatValue ?? 0).mul(
                    BigNumber.from(10).pow(
                      selectedSourceTokenDetails?.decimals ?? 18
                    )
                  ),
                });
              }
            }}
            allowNegative={false}
            thousandSeparator={true}
            className="some"
            inputMode="numeric"
          />
        </div>
      </div>

      <button disabled={!isFormValid} onClick={() => sendBridgeTransaction()}>
        Confirm
      </button>
      <button onClick={() => setHasBridgingStarted(true)}>Start</button>
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
