// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "./ERC20Token.sol";
import "./Governance.sol";
import "./Registry.sol";
import "./TokenFactory.sol";

contract Bridge is Governance, Registry, TokenFactory {
    event Lock(
        address indexed from,
        uint16 indexed targetChainId,
        address token,
        uint amount
    );

    event Mint(
        address indexed receiver,
        address validator,
        address token,
        uint amount
    );

    constructor() Governance("Bridge") {}

    /**
     * @notice locks the non-native erc20 tokens
     */
    function lock(
        uint16 _targetChainId,
        address payable _token,
        uint256 _amount,
        uint256 _deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(_amount > 0, "Bridged amount is required.");

        ERC20Token(_token).permit(
            msg.sender,
            address(this),
            _amount,
            _deadline,
            v,
            r,
            s
        );
        ERC20Token(_token).transferFrom(msg.sender, address(this), _amount);

        emit Lock(msg.sender, _targetChainId, _token, _amount);
    }

    /**
     * @notice mints wrapped erc20 token
     */
    function mint(
        address _receiver,
        uint256 _amount,
        address payable _token,
        bytes[] calldata _validatorsSignatures
    ) external {
        _validateSignatures(_receiver, _amount, _token, _validatorsSignatures);

        ERC20Token tokenContract = lookupTokenContract(_token);
        require(address(tokenContract) != address(0), "Token is not existing");
        tokenContract.mint(_receiver, _amount);

        emit Mint(_receiver, msg.sender, _token, _amount);
    }

    /**
     * @notice burns wrapped erc20 tokens
     */
    function burn() external {}

    /**
     * @notice releases locked erc20 tokens
     */
    function release() external {}
}
