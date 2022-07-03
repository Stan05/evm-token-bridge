import axios, { AxiosResponse } from "axios";
import { BigNumber, Contract, ethers } from "ethers";
import { BridgeTxType } from "../components/Bridge";
import { CONTRACTS_ADDRESSES } from "../constants";

const tryGetContractAddress = (chainId: number, contractName: string) => {
  const chainContractAddreses: Map<string, string> =
    CONTRACTS_ADDRESSES.get(chainId);
  if (chainContractAddreses !== undefined) {
    return chainContractAddreses.get(contractName);
  }
  return undefined;
};

const getUserPermit = async (
  userAddress: string,
  spender: string,
  tokenContract: Contract,
  provider: any,
  permitAmount: BigNumber
) => {
  const nonce = await tokenContract.nonces(userAddress);
  const deadline = +new Date() + 60 * 60;

  const EIP712Domain = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
  ];

  const chainId: number = (await provider.send("eth_chainId", [])).result;
  const domain = {
    name: await tokenContract.name(),
    version: "1",
    chainId: chainId,
    verifyingContract: tokenContract.address,
  };

  const Permit = [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ];

  const message = {
    owner: userAddress,
    spender: spender,
    value: permitAmount.toString(),
    nonce: nonce.toHexString(),
    deadline,
  };

  const data = {
    types: {
      EIP712Domain,
      Permit,
    },
    domain,
    primaryType: "Permit",
    message,
  };

  const signatureLike = await provider.send("eth_signTypedData_v4", [
    userAddress,
    JSON.stringify(data),
  ]);
  const signature = ethers.utils.splitSignature(signatureLike.result);
  const preparedSignature = {
    v: signature.v,
    r: signature.r,
    s: signature.s,
    deadline,
  };

  return preparedSignature;
};

const requestNetworkSwitch = async (
  selectedNetwork: number,
  connectedChain: number
) => {
  if (!window.ethereum) throw new Error("No wallet found");
  if (selectedNetwork !== connectedChain) {
    try {
      return await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${Number(selectedNetwork).toString(16)}` }],
      });
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

const getSignatures = (
  bridgeTxType: BridgeTxType,
  sourceChain: number,
  targetChain: number,
  txHash: string
): Promise<AxiosResponse> => {
  const url: string =
    bridgeTxType == BridgeTxType.LOCK
      ? "http://localhost:8080/validator/lock/"
      : "http://localhost:8080/validator/burn/";
  return axios.get(url + sourceChain + "/" + targetChain + "/" + txHash);
};

export {
  tryGetContractAddress,
  getUserPermit,
  requestNetworkSwitch,
  getSignatures,
};
