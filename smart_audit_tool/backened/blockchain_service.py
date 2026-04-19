from web3 import Web3
import json
import os
import random  # <--- ✅ Added for Randomization Concept

# --- CONFIGURATION ---
RPC_URL = "http://127.0.0.1:7545"

# 🔑 IMPORTANT: Yahan apni Ganache Key paste karain
PRIVATE_KEY = "0xf7bc8f80fc6e41301bf8348275b5202b28909e0c208a9813876af06ec18bf93b" 

# 🏗️ IMPORTANT: Yahan apna Deploy kiya hua Address paste karain
CONTRACT_ADDRESS = "0x25D5573da633E42b2525f1402097E2D3c0159074" 

web3 = Web3(Web3.HTTPProvider(RPC_URL))

def save_audit_to_blockchain(filename, risk_score, audit_data_json):
    if not CONTRACT_ADDRESS:
        return {"status": "Skipped", "detail": "Contract Address Missing"}
    
    if not web3.is_connected():
        return {"status": "Error", "detail": "Blockchain not connected"}

    try:
        account = web3.eth.account.from_key(PRIVATE_KEY)
        
        contract_abi = '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"auditor","type":"address"},{"indexed":false,"internalType":"string","name":"filename","type":"string"},{"indexed":false,"internalType":"uint256","name":"riskScore","type":"uint256"},{"indexed":false,"internalType":"string","name":"auditHash","type":"string"}],"name":"AuditRecorded","type":"event"},{"inputs":[{"internalType":"string","name":"_filename","type":"string"},{"internalType":"uint256","name":"_riskScore","type":"uint256"},{"internalType":"string","name":"_auditHash","type":"string"}],"name":"recordAudit","outputs":[],"stateMutability":"nonpayable","type":"function"}]'
        
        contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=json.loads(contract_abi))
        
        # --- 🔥 CONCEPT: RANDOMIZATION & PRIVACY ---
        # 1. Random Salt generate kar rahay hain (Randomization)
        nonce_salt = random.randint(100000, 999999) 
        
        # 2. Salt ko data ke sath mix kar rahay hain (Privacy/ZKP Concept)
        data_string = json.dumps(audit_data_json) + str(nonce_salt)
        audit_hash = Web3.keccak(text=data_string).hex()

        # Build Transaction
        tx = contract.functions.recordAudit(
            filename,
            int(risk_score),
            audit_hash 
        ).build_transaction({
            'from': account.address,
            'nonce': web3.eth.get_transaction_count(account.address),
            'gas': 2000000,
            'gasPrice': web3.to_wei('20', 'gwei')
        })

        signed_tx = web3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)

        print(f"✅ Blockchained with Salt! Hash: {tx_hash.hex()}")
        
        # ✅ Return Salt & Hash so Frontend can show it
        return {
            "status": "Success", 
            "tx_hash": tx_hash.hex(), 
            "salt": nonce_salt,
            "block_explorer": f"Block # {web3.eth.block_number}"
        }

    except Exception as e:
        print(f"❌ Blockchain Error: {e}")
        return {"status": "Error", "detail": str(e)}