// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyProjAccessFixed61 {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function emergencyWithdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function deposit() public payable {}
}
