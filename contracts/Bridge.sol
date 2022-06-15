// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "./ERC20Token.sol";
import "./Governance.sol";
import "./Registry.sol";
import "./TokenFactory.sol";

contract Bridge {
    Governance public governance;
    TokenFactory public tokenFactory;

    event Lock(
        address indexed from,
        uint16 indexed targetChainId,
        address token,
        uint amount
    );

    event Mint(address indexed receiver, address token, uint amount);

    event Burn(
        address indexed from,
        uint16 indexed targetChainId,
        address wrappedToken,
        uint amount
    );

    event Release(address indexed receiver, address token, uint amount);

    constructor(address _governance, address _tokenFacory) {
        governance = Governance(_governance);
        tokenFactory = TokenFactory(_tokenFacory);
    }

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
        address payable _wrappedToken,
        bytes[] calldata _validatorsSignatures
    ) external {
        governance._validateAllowanceSignatures(
            _receiver,
            _amount,
            _wrappedToken,
            _validatorsSignatures
        );

        ERC20Token wrappedTokenContract = tokenFactory.lookupTokenContract(
            _wrappedToken
        );
        require(
            address(wrappedTokenContract) != address(0),
            "Wrapped Token is not existing"
        );
        wrappedTokenContract.mint(_receiver, _amount);

        emit Mint(_receiver, _wrappedToken, _amount);
    }

    /**
     * @notice burns wrapped erc20 tokens
     */
    function burn(
        uint16 _targetChainId,
        address _wrappedToken,
        uint256 _amount,
        uint256 _deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(_amount > 0, "Burnt amount is required.");

        ERC20Token wrappedTokenContract = tokenFactory.lookupTokenContract(
            _wrappedToken
        );
        require(
            address(wrappedTokenContract) != address(0),
            "Wrapped Token is not existing"
        );
        wrappedTokenContract.permit(
            msg.sender,
            address(this),
            _amount,
            _deadline,
            v,
            r,
            s
        );
        wrappedTokenContract.burnFrom(msg.sender, _amount);

        emit Burn(msg.sender, _targetChainId, _wrappedToken, _amount);
    }

    /**
     * @notice releases locked erc20 tokens
     */
    function release(
        address _receiver,
        uint256 _amount,
        address payable _token,
        bytes[] calldata _validatorsSignatures
    ) external {
        governance._validateAllowanceSignatures(
            _receiver,
            _amount,
            _token,
            _validatorsSignatures
        );

        ERC20Token(_token).transfer(msg.sender, _amount);

        emit Release(msg.sender, _token, _amount);
    }

    function createToken(
        string calldata _name,
        string calldata _symbol,
        bytes[] calldata _validatorsSignatures
    ) external {
        governance._validateTokenCreationSignatures(
            msg.sender,
            _name,
            _symbol,
            _validatorsSignatures
        );

        tokenFactory.createToken(_name, _symbol);
    }
}
