// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyProjClean46 {
    uint256 public value;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // Value update karne wala simple code. (no complex logic)
    function update(uint256 v) public {
        value = v;
    }

    function get() public view returns (uint256) {
        return value;
    }
}
