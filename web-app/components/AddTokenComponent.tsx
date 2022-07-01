import { margin } from "@mui/system";
import axios from "axios";
import { ethers } from "ethers";
import React, { Component, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { FormErrors } from "./FormError";

const modalStyle = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
  },
  content: {
    position: "absolute",
    top: "40px",
    left: "40px",
    right: "40px",
    bottom: "40px",
    border: "1px solid #ccc",
    background: "#fff",
    overflow: "auto",
    WebkitOverflowScrolling: "touch",
    borderRadius: "4px",
    outline: "none",
    padding: "20px",
    width: "300px",
    margin: "auto",
  },
};

const AddTokenComponent = ({
  chainId,
  modalIsOpen,
  openModal,
  closeModal,
  onSuccessfullAdd,
}: {
  chainId: number;
  modalIsOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  onSuccessfullAdd: () => void;
}) => {
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<
    { key: string; value: string }[]
  >([]);

  const internalCloseModal = () => {
    closeModal();
    setTokenAddress(undefined);
    setFormErrors([]);
  };

  const handleSetTokenAddress = (event) => {
    if (ethers.utils.isAddress(event.target.value)) {
      console.log("valid");
      setTokenAddress(event.target.value);
      setFormErrors([]);
    } else {
      console.log("invalid", formErrors);
      setFormErrors([{ key: "tokenAddress", value: "Invalid token address" }]);
    }
  };

  const addTokenAddress = async () => {
    axios
      .post("http://localhost:8080/tokens", {
        chainId: chainId,
        token: tokenAddress,
      })
      .then((response) => {
        closeModal();
        onSuccessfullAdd();
      })
      .catch((error) => {
        setFormErrors([{ key: "tokenAddress", value: "Could not add token" }]);
      });
  };

  useEffect(() => {
    setIsFormValid(formErrors.length == 0 && tokenAddress != undefined);
  }, [tokenAddress]);

  return (
    <div className="bridge-add-token-modal">
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={internalCloseModal}
        ariaHideApp={false}
        style={modalStyle}
      >
        <div>
          <label htmlFor="token-address">Input your token address</label>
          <input
            type="text"
            name="token-address"
            value={tokenAddress}
            onChange={handleSetTokenAddress}
          />
          <div>
            <FormErrors formErrors={formErrors} />
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          onClick={addTokenAddress}
          disabled={!isFormValid}
        >
          Add
        </button>
        <button onClick={internalCloseModal}>Close</button>
      </Modal>
    </div>
  );
};
export default AddTokenComponent;
