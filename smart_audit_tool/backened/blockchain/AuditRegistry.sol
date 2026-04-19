// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AuditRegistry {
    struct AuditRecord {
        string filename;
        uint256 riskScore;
        string auditHash; 
        uint256 timestamp;
        address auditor;
    }

    mapping(bytes32 => AuditRecord) public audits;
    event AuditRecorded(address indexed auditor, string filename, uint256 riskScore, string auditHash);

    function recordAudit(string memory _filename, uint256 _riskScore, string memory _auditHash) public {
        bytes32 id = keccak256(abi.encodePacked(_filename, block.timestamp));
        
        audits[id] = AuditRecord({
            filename: _filename,
            riskScore: _riskScore,
            auditHash: _auditHash,
            timestamp: block.timestamp,
            auditor: msg.sender
        });

        emit AuditRecorded(msg.sender, _filename, _riskScore, _auditHash);
    }
}