//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SharedWallet is Ownable {
    event AllowanceChanged(
        address indexed _forwho,
        address indexed _byWho,
        uint256 _oldAmount,
        uint256 _newAmount
    );
    mapping(address => uint256) public allowance;
    event MoneySent(address indexed _beneficiary, uint256 _amount);
    event MoneyReceived(address indexed _from, uint256 _amount);

    function isOwner() internal view returns (bool) {
        return owner() == msg.sender;
    }

    function setAllowance(address _who, uint256 _amount) public onlyOwner {
        emit AllowanceChanged(_who, msg.sender, allowance[_who], _amount);
        allowance[_who] = _amount;
    }

    modifier ownerOrAllowed(uint256 _amount) {
        require(
            isOwner() || allowance[msg.sender] >= _amount,
            "You are not allowed"
        );
        _;
    }

    function reduceAllowance(address _who, uint256 _amount)
        public
        ownerOrAllowed(_amount)
    {
        emit AllowanceChanged(
            _who,
            msg.sender,
            allowance[_who],
            allowance[_who] - _amount
        );
        allowance[_who] -= _amount;
    }

    function withdrawMoney(address payable _to, uint256 _amount)
        public
        ownerOrAllowed(_amount)
    {
        require(
            _amount <= address(this).balance,
            "Contract doesn't own enough money"
        );
        if (!isOwner()) {
            reduceAllowance(msg.sender, _amount);
        }
        emit MoneySent(_to, _amount);
        _to.transfer(_amount);
    }

    receive() external payable {
        emit MoneyReceived(msg.sender, msg.value);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
