// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract BridgeERC20 is ERC20PresetMinterPauser {
    bytes32 private DOMAIN_SEPARATOR;
    bytes32 private constant PERMIT_TYPEHASH =
        0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
    mapping(address => uint256) public nonces;

    constructor(
        string memory _name,
        string memory _symbol,
        address _bridge
    ) ERC20PresetMinterPauser(_name, _symbol) {
        _setupRole(MINTER_ROLE, _bridge);
        _setupRole(PAUSER_ROLE, _bridge);
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,address verifyingContract)"
                ),
                keccak256(bytes(_name)),
                keccak256(bytes("1")),
                address(this)
            )
        );
    }

    function permit(
        address _owner,
        address _spender,
        uint256 _value,
        uint256 _deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(_deadline >= block.timestamp, "ERC20WithPermit: EXPIRED");

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        PERMIT_TYPEHASH,
                        _owner,
                        _spender,
                        _value,
                        nonces[_owner]++,
                        _deadline
                    )
                )
            )
        );

        address recoveredAddress = ecrecover(digest, v, r, s);
        require(
            recoveredAddress != address(0) && recoveredAddress == _owner,
            "ERC20WithPermit: INVALID_SIGNATURE"
        );

        _approve(_owner, _spender, _value);
    }
}
