// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyProjClean40 {
    uint256 public value;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // Yeh ek basic setter function hai. (example 40)
    function update(uint256 v) public {
        value = v;
    }

    function get() public view returns (uint256) {
        return value;
    }
}
