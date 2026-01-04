// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyProjClean74 {
    uint256 public value;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // Is function ka kaam seedha hai — simple update. (id 74)
    function update(uint256 v) public {
        value = v;
    }

    function get() public view returns (uint256) {
        return value;
    }
}
