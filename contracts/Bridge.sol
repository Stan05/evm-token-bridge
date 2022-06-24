// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "./ERC20Token.sol";
import "./Governance.sol";
import "./Registry.sol";
import "./WrappedTokenFactory.sol";
import "./FeeCalculator.sol";

contract Bridge {
    Governance public governance;
    WrappedTokenFactory public wrappedTokenFactory;
    FeeCalculator public feeCalculator;

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

    constructor(
        address _governance,
        address _tokenFacory,
        address _feeCalculator
    ) {
        governance = Governance(_governance);
        wrappedTokenFactory = WrappedTokenFactory(_tokenFacory);
        feeCalculator = FeeCalculator(_feeCalculator);
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
     * @notice mints wrapped erc20 token,
     * expects to receive service fee
     * and accure that fee to the first validator that generated a valid signature
     */
    function mint(
        address _receiver,
        uint256 _amount,
        address payable _wrappedToken,
        bytes[] calldata _validatorsSignatures
    ) external payable {
        require(
            feeCalculator.serviceFee() == msg.value,
            "Not enough service fee"
        );
        address[] memory _validators = governance.validateAllowanceSignatures(
            _receiver,
            _amount,
            _wrappedToken,
            _validatorsSignatures
        );

        ERC20Token wrappedTokenContract = wrappedTokenFactory
            .lookupTokenContract(_wrappedToken);
        require(
            address(wrappedTokenContract) != address(0),
            "Wrapped Token is not existing"
        );
        wrappedTokenContract.mint(_receiver, _amount);

        feeCalculator.accureFees(_validators[0]);

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

        ERC20Token wrappedTokenContract = wrappedTokenFactory
            .lookupTokenContract(_wrappedToken);
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
     * @notice releases locked erc20 tokens,
     * expects to receive service fee
     * and accure that fee to the first validator that generated a valid signature
     */
    function release(
        address _receiver,
        uint256 _amount,
        address payable _token,
        bytes[] calldata _validatorsSignatures
    ) external payable {
        require(
            feeCalculator.serviceFee() == msg.value,
            "Not enough service fee"
        );
        address[] memory _validators = governance.validateAllowanceSignatures(
            _receiver,
            _amount,
            _token,
            _validatorsSignatures
        );

        ERC20Token(_token).transfer(msg.sender, _amount);

        feeCalculator.accureFees(_validators[0]);

        emit Release(msg.sender, _token, _amount);
    }

    /**
     * @notice Creates a wrapped token on the chain,
     * only if the transaction sender is registered validator
     */
    function createToken(string calldata _name, string calldata _symbol)
        external
    {
        require(governance.hasAccess(msg.sender), "Validator not registered");

        wrappedTokenFactory.createToken(_name, _symbol);
    }

    /**
     * @notice Claims the fees accumulated by the transaction sender,
     * if't valid validator and has any fees accumulated
     */
    function claimFees() external {
        require(governance.hasAccess(msg.sender), "Validator not registered");
        uint256 _accumulatedFees = feeCalculator.accumulatedFees(msg.sender);
        require(_accumulatedFees > 0, "No accumulated fees to claim");
        bool _sent = payable(msg.sender).send(_accumulatedFees);
        require(_sent, "Fees couldn't be claimed");
        feeCalculator.claim(msg.sender);
    }
}
