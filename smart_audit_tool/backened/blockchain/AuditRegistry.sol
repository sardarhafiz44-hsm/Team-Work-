// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AuditRegistry - SolShield Pro
 * @notice Immutable on-chain audit proof registry
 * @dev Records audit hashes on the blockchain for tamper-proof verification
 */
contract AuditRegistry {
    
    struct AuditRecord {
        address auditor;
        string filename;
        uint256 riskScore;
        string auditHash;
        uint256 timestamp;
        uint256 blockNumber;
    }

    // State variables
    address public owner;
    uint256 public auditCount;
    
    // Mapping: audit count => record
    mapping(uint256 => AuditRecord) public audits;
    
    // Mapping: auditor address => their audit indices
    mapping(address => uint256[]) public auditorAudits;

    // Events
    event AuditRecorded(
        address indexed auditor,
        string filename,
        uint256 riskScore,
        string auditHash
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "SolShield: Caller is not the owner");
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @notice Record a new audit result on-chain
     * @param _filename Name of the audited contract file
     * @param _riskScore CVSS risk score (0-100)
     * @param _auditHash SHA-256 integrity hash of the audit payload
     */
    function recordAudit(
        string memory _filename,
        uint256 _riskScore,
        string memory _auditHash
    ) external {
        require(_riskScore <= 100, "SolShield: Score must be 0-100");
        require(bytes(_filename).length > 0, "SolShield: Filename required");
        require(bytes(_auditHash).length > 0, "SolShield: Hash required");

        auditCount++;
        
        audits[auditCount] = AuditRecord({
            auditor: msg.sender,
            filename: _filename,
            riskScore: _riskScore,
            auditHash: _auditHash,
            timestamp: block.timestamp,
            blockNumber: block.number
        });

        auditorAudits[msg.sender].push(auditCount);

        emit AuditRecorded(msg.sender, _filename, _riskScore, _auditHash);
    }

    /**
     * @notice Get audit record by index
     * @param _index Audit record index (1-based)
     */
    function getAudit(uint256 _index) 
        external 
        view 
        returns (
            address auditor,
            string memory filename,
            uint256 riskScore,
            string memory auditHash,
            uint256 timestamp,
            uint256 blockNumber
        ) 
    {
        require(_index > 0 && _index <= auditCount, "SolShield: Invalid index");
        AuditRecord storage record = audits[_index];
        return (
            record.auditor,
            record.filename,
            record.riskScore,
            record.auditHash,
            record.timestamp,
            record.blockNumber
        );
    }

    /**
     * @notice Get total audits by a specific auditor
     * @param _auditor Auditor address
     */
    function getAuditorAuditCount(address _auditor) 
        external 
        view 
        returns (uint256) 
    {
        return auditorAudits[_auditor].length;
    }

    /**
     * @notice Verify if an audit hash exists on-chain
     * @param _auditHash The hash to verify
     */
    function verifyAuditHash(string memory _auditHash) 
        external 
        view 
        returns (bool exists, uint256 index) 
    {
        for (uint256 i = 1; i <= auditCount; i++) {
            if (keccak256(abi.encodePacked(audits[i].auditHash)) == 
                keccak256(abi.encodePacked(_auditHash))) {
                return (true, i);
            }
        }
        return (false, 0);
    }

    /**
     * @notice Transfer ownership to a new address
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "SolShield: Zero address");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
}
