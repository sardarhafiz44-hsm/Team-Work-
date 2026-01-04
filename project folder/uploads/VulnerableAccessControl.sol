// VulnerableAccessControl.sol
// Learning / medium-level vulnerable Solidity example focused on Access Control bugs.
// -------------------------------------------------------------
// Vulnerabilities included (for learning & testing):
// 1) Broken initialization: `initialize` can be called by anyone to set the owner.
// 2) Using `tx.origin` in access control (`onlyOwner`) rather than `msg.sender`.
//    This enables phishing-style attacks and is incorrect for access control.
// 3) `addAdmin` is public and unprotected so anyone can become an admin.
// 4) `upgrade` uses delegatecall to an arbitrary address without access checks.
// 5) Mixed checks: `onlyAdmin` uses `msg.sender` while `onlyOwner` uses `tx.origin` —
//    inconsistent trust model leads to confusion and attack surface.
// -------------------------------------------------------------
// How to exploit (examples):
// - Call `initialize(yourAddress)` to become owner (because there is no initializer guard).
// - Call `addAdmin(yourAddress)` and then `withdraw` to drain funds.
// - Deploy a malicious contract and trick the current owner to call it so that tx.origin-based checks behave unexpectedly.
// - Call `upgrade(maliciousAddress, data)` to run attacker-controlled code in this contract's context.
// -------------------------------------------------------------
// Mitigations (fixes):
// - Use a constructor or an `initialize` with an `initializer` guard (use OpenZeppelin Initializable pattern).
// - Always use `msg.sender` for access control, not `tx.origin`.
// - Protect admin/add functions with proper modifiers (`onlyOwner`) and checks.
// - Restrict or remove arbitrary delegatecall functionality; if needed, protect it with strict access control and a whitelist.
// - Add events so changes in ownership/admins are observable.
// -------------------------------------------------------------

pragma solidity ^0.8.0;

contract VulnerableAccessControl {
    // NOTE: this example intentionally contains vulnerabilities for learning purposes.

    address public owner;
    mapping(address => bool) public admins;

    // constructor left intentionally "weak" — owner not set here so initialize can be abused.
    constructor() payable {
        // owner = msg.sender; // <-- intentionally commented out to create a learning vulnerability
    }

    // 1) Broken initialize: anyone can call and set `owner` (no initializer guard)
    function initialize(address _owner) public {
        owner = _owner;
    }

    // 2) Dangerous: uses tx.origin instead of msg.sender for owner checks
    modifier onlyOwner() {
        require(tx.origin == owner, "Not owner (uses tx.origin)");
        _;
    }

    // 3) addAdmin is public and unprotected — anyone can add any admin
    function addAdmin(address _admin) public {
        admins[_admin] = true;
    }

    // removeAdmin is protected by onlyOwner — but onlyOwner uses tx.origin (vulnerable pattern)
    function removeAdmin(address _admin) public onlyOwner {
        admins[_admin] = false;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender], "Not admin");
        _;
    }

    // Admin-only withdrawal (but since addAdmin is public, attacker can call addAdmin first)
    function withdraw(uint256 amount) public onlyAdmin {
        require(address(this).balance >= amount, "Insufficient balance");
        payable(msg.sender).transfer(amount);
    }

    // Dangerous: allows delegatecall into any address without access control
    // This lets an attacker execute arbitrary code in the context of this contract
    function upgrade(address newImpl, bytes calldata data) public returns (bytes memory) {
        (bool success, bytes memory ret) = newImpl.delegatecall(data);
        require(success, "delegatecall failed");
        return ret;
    }

    // Simple helpers
    receive() external payable {}

    function deposit() public payable {}

    // Utility: check whether an address is admin
    function isAdmin(address _addr) public view returns (bool) {
        return admins[_addr];
    }
}
