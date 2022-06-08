// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Governance is Ownable {
    mapping(address => bool) registeredValidators;

    /**
     * @notice register the validator to perform mint transactions
     */
    function registerValidator(address _validator) external onlyOwner {
        registeredValidators[_validator] = true;
    }

    /**
     * @notice unregister the validator to perform mint transactions
     */
    function unRegisterValidator(address _validator) external onlyOwner {
        registeredValidators[_validator] = false;
    }

    /**
     * @notice checks if the validator has access
     */
    function hasAccess(address _validator) external view returns (bool) {
        return registeredValidators[_validator];
    }
}
