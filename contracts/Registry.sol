// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Registry is Ownable {
    uint16 private sourceChainId;
    mapping(address => mapping(uint16 => address))
        private sourceTokenToTargetToken;
    mapping(address => mapping(uint16 => address))
        private targetTokenToSourceToken;

    event TokenConnectionRegistered(
        address indexed sourceToken,
        address indexed targetToken,
        uint16 sourceChainId,
        uint16 targetChainId
    );

    constructor() {
        sourceChainId = uint16(block.chainid);
    }

    /**
     * @notice lookup target token address by source token and target chain id
     */
    function lookupTargetTokenAddress(
        address _sourceToken,
        uint16 _targetChainId
    ) external view returns (address) {
        return sourceTokenToTargetToken[_sourceToken][_targetChainId];
    }

    /**
     * @notice lookup source token by target token and source chain id
     */
    function lookupSourceTokenAddress(
        address _targetToken,
        uint16 _sourceChainId
    ) external view returns (address) {
        return targetTokenToSourceToken[_targetToken][_sourceChainId];
    }

    /**
     * @notice registers a token connection between the source and target oken addreses
     */
    function registerTargetTokenAddress(
        address _sourceToken,
        uint16 _targetChainId,
        address _targetToken
    ) external onlyOwner {
        require(_sourceToken != address(0), "Invalid source address");
        require(_targetToken != address(0), "Invalid target address");

        sourceTokenToTargetToken[_sourceToken][_targetChainId] = _targetToken;
        targetTokenToSourceToken[_targetToken][sourceChainId] = _sourceToken;

        emit TokenConnectionRegistered(
            _sourceToken,
            _targetToken,
            sourceChainId,
            _targetChainId
        );
    }
}
