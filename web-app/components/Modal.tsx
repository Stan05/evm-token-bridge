import React from "react";
import "./modal.css";
import PropTypes from "prop-types";

const Modal = ({ show, onClose, children }) => {
  return (
    <div className="bridge-wrapper">
      {!show ? (
        <div></div>
      ) : (
        <div className="modal" id="modal">
          <h2>Modal Window</h2>
          <div className="content">{children}</div>
          <div className="actions">
            <button className="toggle-button" onClick={onClose}>
              close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Modal;
