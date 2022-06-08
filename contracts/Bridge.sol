// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "./BridgeERC20.sol";
import "./Governance.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Bridge is Governance {
    bytes32 private DOMAIN_SEPARATOR;

    event Lock(
        address indexed from,
        uint8 indexed targetChainId,
        address token,
        uint amount
    );

    event Mint(
        address indexed receiver,
        address validator,
        address token,
        uint amount
    );

    constructor() {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("Bridge")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @notice locks the non-native erc20 tokens
     */
    function lock(
        uint8 _targetChainId,
        address payable _token,
        uint256 _amount,
        uint256 _deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(_amount > 0, "Bridged amount is required.");

        BridgeERC20(_token).permit(
            msg.sender,
            address(this),
            _amount,
            _deadline,
            v,
            r,
            s
        );
        BridgeERC20(_token).transferFrom(msg.sender, address(this), _amount);

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

        BridgeERC20(_token).mint(_receiver, _amount);

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

    function _validateSignatures(
        address _receiver,
        uint256 _amount,
        address payable _token,
        bytes[] memory _validatorsSignatures
    ) private view {
        for (uint i = 0; i < _validatorsSignatures.length; i++) {
            bytes memory sig = _validatorsSignatures[i];
            address _validatorAddress = _recover(
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

    function _recover(
        address _receiver,
        uint256 _amount,
        address payable _token,
        bytes memory _validatorsSignature
    ) private view returns (address) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        keccak256(
                            "mint(address receiver,uint256 amount,address token)"
                        ),
                        _receiver,
                        _amount,
                        _token
                    )
                )
            )
        );

        return ECDSA.recover(digest, _validatorsSignature);
    }
}
