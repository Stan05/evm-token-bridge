// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC20Token.sol";

contract WrappedTokenFactory is Ownable {
    mapping(address => ERC20Token) private wrappedTokenContracts;

    event TokenCreated(
        address indexed newTokenAddress,
        string name,
        string symbol
    );

    function createToken(string memory _name, string memory _symbol)
        external
        onlyOwner
    {
        ERC20Token wrappedContract = new ERC20Token(_name, _symbol, msg.sender);
        wrappedTokenContracts[address(wrappedContract)] = wrappedContract;
        emit TokenCreated(address(wrappedContract), _name, _symbol);
    }

    function lookupTokenContract(address _token)
        public
        view
        returns (ERC20Token)
    {
        return wrappedTokenContracts[_token];
    }
}
