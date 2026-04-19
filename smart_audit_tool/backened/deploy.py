import json
from web3 import Web3
from solcx import compile_standard, install_solc
import os

# --- GANACHE SETTINGS ---
# Ganache App mein upar "RPC SERVER" likha hoga, wo yahan dalain (Zyadatar yehi hota hai)
RPC_URL = "http://127.0.0.1:7545"  

# 🔑 IMPORTANT: Yahan Ganache se Private Key copy kar k paste karain
# Example: PRIVATE_KEY = "0x8f2a..."
PRIVATE_KEY = "0xf7bc8f80fc6e41301bf8348275b5202b28909e0c208a9813876af06ec18bf93b" 

print("⚙️  Installing Solidity Compiler...")
install_solc('0.8.0')

def deploy():
    # 1. Solidity File Read
    print("📜 Reading Contract...")
    # Rasta check karain: backend -> blockchain -> AuditRegistry.sol
    with open("blockchain/AuditRegistry.sol", "r") as file:
        audit_contract_file = file.read()

    # 2. Compile
    print("🔨 Compiling...")
    compiled_sol = compile_standard(
        {
            "language": "Solidity",
            "sources": {"AuditRegistry.sol": {"content": audit_contract_file}},
            "settings": {
                "outputSelection": {
                    "*": {"*": ["abi", "metadata", "evm.bytecode", "evm.sourceMap"]}
                }
            },
        },
        solc_version="0.8.0",
    )

    # Bytecode aur ABI nikalo (Ye contract ki machine language hai)
    bytecode = compiled_sol["contracts"]["AuditRegistry.sol"]["AuditRegistry"]["evm"]["bytecode"]["object"]
    abi = compiled_sol["contracts"]["AuditRegistry.sol"]["AuditRegistry"]["abi"]

    # 3. Connect to Blockchain
    web3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not web3.is_connected():
        print("❌ Error: Ganache is not running! Please open Ganache App.")
        return

    chain_id = 1337 # Ganache ka ID
    account = web3.eth.account.from_key(PRIVATE_KEY)

    # 4. Deploy Transaction
    print("🚀 Deploying to Blockchain...")
    AuditContract = web3.eth.contract(abi=abi, bytecode=bytecode)
    
    # Transaction banao
    nonce = web3.eth.get_transaction_count(account.address)
    
    tx = AuditContract.constructor().build_transaction({
        "chainId": chain_id,
        "gasPrice": web3.eth.gas_price,
        "from": account.address,
        "nonce": nonce
    })

    # Sign & Send (Thappa lagao aur bhejo)
    signed_tx = web3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
    
    print("⏳ Waiting for confirmation...")
    tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

    print("-" * 50)
    print(f"🎉 SUCCESS! Contract Address: {tx_receipt.contractAddress}")
    print("-" * 50)
    print("👉 Is Address ko copy kar ke mehfooz kar lain. Aglay step mein chahiye hoga.")

if __name__ == "__main__":
    deploy()