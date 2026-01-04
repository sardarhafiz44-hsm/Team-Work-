// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

contract MyProjArithmeticVuln10 {
    uint256 public count = 0;

    function add(uint256 x) public {
        count += x; // vulnerable to overflow in <0.8.0
    }

    function sub(uint256 x) public {
        count -= x; // vulnerable to underflow in <0.8.0
    }
}
