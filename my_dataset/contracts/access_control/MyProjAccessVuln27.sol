// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyProjAccessVuln27 {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // vulnerable: anyone can call
    function emergencyWithdraw() public {
        payable(msg.sender).transfer(address(this).balance);
    }

    function deposit() public payable {}
}
