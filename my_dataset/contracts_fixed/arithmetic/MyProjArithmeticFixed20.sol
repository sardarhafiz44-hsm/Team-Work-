// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyProjArithmeticFixed20 {
    uint256 public count = 0;

    function add(uint256 x) public {
        unchecked { count += x; }
    }

    function sub(uint256 x) public {
        require(count >= x, "Underflow");
        count -= x;
    }
}
