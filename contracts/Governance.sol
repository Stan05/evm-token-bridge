// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Governance is Ownable {
    bytes32 private DOMAIN_SEPARATOR;
    mapping(address => bool) private registeredValidators;

    event ValidatorsInitialized(address[] indexed validators);
    event ValidatorRegistered(address indexed validator);
    event ValidatorUnRegistered(address indexed validator);

    constructor(address[] memory _validators) {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("Governance")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
        for (uint i = 0; i < _validators.length; i++) {
            registeredValidators[_validators[i]] = true;
        }
        if (_validators.length > 0) {
            emit ValidatorsInitialized(_validators);
        }
    }

    /**
     * @notice register the validator to perform mint transactions
     */
    function registerValidator(address _validator) external onlyOwner {
        registeredValidators[_validator] = true;
        emit ValidatorRegistered(_validator);
    }

    /**
     * @notice unregister the validator to perform mint transactions
     */
    function unRegisterValidator(address _validator) external onlyOwner {
        registeredValidators[_validator] = false;
        emit ValidatorUnRegistered(_validator);
    }

    /**
     * @notice checks if the validator has access
     */
    function hasAccess(address _validator) external view returns (bool) {
        return registeredValidators[_validator];
    }

    function validateAllowanceSignatures(
        address _receiver,
        uint256 _amount,
        address payable _token,
        bytes[] memory _validatorsSignatures
    ) external view {
        for (uint i = 0; i < _validatorsSignatures.length; i++) {
            bytes memory sig = _validatorsSignatures[i];
            address _validatorAddress = _recoverFromAllowance(
                _receiver,
                _amount,
                _token,
                sig
            );
            require(
                registeredValidators[_validatorAddress],
                "Unrecognized validator signature"
            );
        }
    }

    function _recoverFromAllowance(
        address _receiver,
        uint256 _amount,
        address payable _token,
        bytes memory _validatorSignature
    ) private view returns (address) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        keccak256(
                            "Allowance(address receiver,uint256 amount,address token)"
                        ),
                        _receiver,
                        _amount,
                        _token
                    )
                )
            )
        );

        return ECDSA.recover(digest, _validatorSignature);
    }
}
