// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Registry is Ownable {
    mapping(address => mapping(uint8 => address))
        private sourceTokenToTargetToken;

    event TargetTokenRegistered(
        address indexed sourceToken,
        uint8 indexed targetChainId,
        address targetToken
    );

    /**
     * @notice lookup by source token and target chain id the corresponding token address
     */
    function lookupTargetTokenAddress(
        address _sourceToken,
        uint8 _targetChainId
    ) external view returns (address) {
        return sourceTokenToTargetToken[_sourceToken][_targetChainId];
    }

    /**
     * @notice registers a target token address for the given source token and target chain id
     */
    function registerTargetTokenAddress(
        address _sourceToken,
        uint8 _targetChainId,
        address _targetTokenAddress
    ) external onlyOwner {
        sourceTokenToTargetToken[_sourceToken][
            _targetChainId
        ] = _targetTokenAddress;
        emit TargetTokenRegistered(
            _sourceToken,
            _targetChainId,
            _targetTokenAddress
        );
    }
}
