// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FeeCalculator is Ownable {
    uint256 public serviceFee;
    mapping(address => uint256) feesAccured;

    /// @notice An event emitted once the service fee is modified
    event ServiceFeeSet(uint256 newServiceFee);

    /// @notice An event emitted once a validator claims fees accredited to him
    event Claim(address indexed validator, uint256 amount);

    constructor(uint256 _serviceFee) {
        _setServiceFee(_serviceFee);
    }

    /**
     *  @notice Sets the service fee for this chain
     *  @param _serviceFee The new service fee
     */
    function setServiceFee(uint256 _serviceFee) external onlyOwner {
        _setServiceFee(_serviceFee);
    }

    /**
     * @notice Sends out the reward accumulated by the caller
     */
    function claim(address _validator) external onlyOwner {
        uint256 _accumulatedFee = feesAccured[_validator];
        feesAccured[_validator] = 0;
        emit Claim(_validator, _accumulatedFee);
    }

    /**
     * @notice Accure fees to the validator
     */
    function accureFees(address _validator) external onlyOwner {
        feesAccured[_validator] += serviceFee;
    }

    /**
     *@return The accured fees for the validator
     */
    function accumulatedFees(address _validator)
        external
        view
        returns (uint256)
    {
        return feesAccured[_validator];
    }

    /**
     *  @notice set a new service fee
     *  @param _serviceFee the new service fee
     */
    function _setServiceFee(uint256 _serviceFee) private {
        serviceFee = _serviceFee;
        emit ServiceFeeSet(serviceFee);
    }
}
