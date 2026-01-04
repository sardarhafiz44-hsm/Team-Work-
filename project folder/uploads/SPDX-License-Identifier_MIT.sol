// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*
   HIGH-LEVEL ADVANCED VULNERABILITY DATASET CONTRACT
   ---------------------------------------------------
   This contract intentionally contains MULTIPLE severe vulnerabilities:

   1. Reentrancy
   2. Broken Access Control
   3. Integer Overflow/Underflow (unchecked block)
   4. Insecure Randomness (block.timestamp)
   5. Unprotected Self-Destruct
   6. tx.origin Authentication Flaw
   7. Unsafe External Calls
   8. Missing Input Validation
   9. Logic Flaw in Reward System
   10. Unbounded Loop (DOS Vulnerability)
*/

contract AdvancedVulnerableContract {

    address public owner;
    mapping(address => uint256) public balances;
    address[] public users;

    constructor() {
        owner = msg.sender;
    }

    // ❌ Vulnerability #1: tx.origin used for authentication
    modifier onlyOwner() {
        require(tx.origin == owner, "Not owner"); // attackable via phishing
        _;
    }

    // ❌ Vulnerability #2: No validation, allows spam pushing addresses
    function registerUser(address user) external {
        users.push(user);
    }

    // Deposit funds
    function deposit() external payable {
        if (balances[msg.sender] == 0) {
            users.push(msg.sender);
        }
        balances[msg.sender] += msg.value;
    }

    // ❌ Vulnerability #3: Reentrancy + unsafe external call
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Not enough balance");

        // Interaction before Effects → reentrancy possible
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");

        balances[msg.sender] -= amount; // state update after call
    }

    // ❌ Vulnerability #4: Insecure randomness
    function getRandomNumber() public view returns (uint256) {
        return uint256(keccak256(abi.encode(block.timestamp, msg.sender, block.number)));
    }

    // ❌ Vulnerability #5: Integer overflow using unchecked
    function rewardUser(address user, uint256 reward) external onlyOwner {
        unchecked {
            balances[user] += reward * 1000000000000; // possible overflow
        }
    }

    // ❌ Vulnerability #6: DOS - Unbounded loop over dynamic array
    function distributeRewards() external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            balances[users[i]] += 1 ether; // expensive loop risk
        }
    }

    // ❌ Vulnerability #7: Unprotected self-destruct
    function destroy() external {
        selfdestruct(payable(msg.sender));
    }

    // ❌ Vulnerability #8: Owner can drain contract (malicious admin logic)
    function drainAll() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
