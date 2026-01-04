// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyProjClean49 {
    uint256 public value;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // Yeh ek basic setter function hai. (example 49)
    function update(uint256 v) public {
        value = v;
    }

    function get() public view returns (uint256) {
        return value;
    }
}
