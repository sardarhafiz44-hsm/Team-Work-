// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyProjClean98 {
    uint256 public value;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // Yeh ek basic setter function hai. (example 98)
    function update(uint256 v) public {
        value = v;
    }

    function get() public view returns (uint256) {
        return value;
    }
}
