import axios from "axios";
import { ethers } from "ethers";
import React from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";

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
    height: "250px",
    margin: "auto",
  },
};

const TOKEN_ADDRESS_KEY = "tokenAddress";
const AddTokenComponent = ({
  chainId,
  modalIsOpen,
  closeModal,
  onSuccessfullAdd,
}: {
  chainId: number;
  modalIsOpen: boolean;
  closeModal: () => void;
  onSuccessfullAdd: () => void;
}) => {
  const {
    register,
    formState: { errors },
    setError,
    resetField,
    handleSubmit,
  } = useForm();

  const onSubmit = (data) => {
    if (data.tokenAddress)
      axios
        .post("http://localhost:8080/tokens", {
          chainId: chainId,
          token: data.tokenAddress,
        })
        .then((response) => {
          closeModal();
          onSuccessfullAdd();
          resetField(TOKEN_ADDRESS_KEY);
        })
        .catch((error) => {
          setError(TOKEN_ADDRESS_KEY, {
            type: "api-error",
            message: "Could not add token",
          });
        });
  };

  return (
    <div className="bridge-add-token-modal">
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        ariaHideApp={false}
        style={modalStyle}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <label htmlFor={TOKEN_ADDRESS_KEY}>Input your token address</label>
          <input
            {...register(TOKEN_ADDRESS_KEY, {
              validate: (value) =>
                ethers.utils.isAddress(value) || "Should be a valid address",
            })}
          />
          <div>
            {errors.tokenAddress && <span>{errors.tokenAddress.message}</span>}
          </div>
          <input type="submit" />
          <button onClick={closeModal}>Close</button>
        </form>
      </Modal>
    </div>
  );
};
export default AddTokenComponent;
