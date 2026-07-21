"""
SolShield Pro - Multi-Model AI Router
Supports: Groq, Cerebras, OpenRouter, HuggingFace
Automatic failover if primary fails
"""

import os
import httpx
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

class ModelRouter:
    def __init__(self):
        self.providers = {
            'groq': {
                'api_key': os.getenv('GROQ_API_KEY', ''),
                'base_url': 'https://api.groq.com/openai/v1',
                'model': 'llama-3.3-70b-versatile',
                'priority': 1
            },
            'cerebras': {
                'api_key': os.getenv('CEREBRAS_API_KEY', ''),
                'base_url': 'https://api.cerebras.ai/v1',
                'model': 'llama3.1-70b',
                'priority': 2
            },
            'openrouter': {
                'api_key': os.getenv('OPENROUTER_API_KEY', ''),
                'base_url': 'https://openrouter.ai/api/v1',
                'model': 'deepseek/deepseek-chat',
                'priority': 3
            }
        }
        
        self.huggingface_token = os.getenv('HUGGINGFACE_TOKEN', '')
        
    async def analyze_contract(self, code: str, prompt_type: str = 'audit') -> Dict:
        """
        Try providers in priority order
        Return first successful response
        """
        # Sort providers by priority
        sorted_providers = sorted(
            self.providers.items(),
            key=lambda x: x[1]['priority']
        )
        
        errors = []
        
        for provider_name, config in sorted_providers:
            if not config['api_key']:
                continue
                
            try:
                result = await self._call_provider(provider_name, config, code, prompt_type)
                return {
                    'success': True,
                    'provider': provider_name,
                    'data': result
                }
            except Exception as e:
                errors.append(f"{provider_name}: {str(e)}")
                continue
        
        # Try HuggingFace as last resort
        if self.huggingface_token:
            try:
                result = await self._call_huggingface(code, prompt_type)
                return {
                    'success': True,
                    'provider': 'huggingface',
                    'data': result
                }
            except Exception as e:
                errors.append(f"huggingface: {str(e)}")
        
        return {
            'success': False,
            'errors': errors
        }
    
    async def _call_provider(self, provider_name: str, config: Dict, code: str, prompt_type: str) -> Dict:
        """Call specific AI provider"""
        
        prompts = {
            'audit': f"""Analyze this Solidity smart contract for vulnerabilities:
{code}

Return JSON array with: title, severity (Critical/High/Medium/Low), description, remediation, affected_lines""",
            
            'attack': f"""Generate attack simulation for these vulnerabilities in this contract:
Code: {code}

Return JSON with: attack_name, difficulty, prerequisites, steps (step number, action, code, explanation), funds_at_risk, success_probability""",
            
            'heal': f"""Fix the vulnerability in this Solidity code:
{code}

Return JSON with: fixed_code, remediation_applied"""
        }
        
        prompt = prompts.get(prompt_type, prompts['audit'])
        
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{config['base_url']}/chat/completions",
                headers={
                    'Authorization': f"Bearer {config['api_key']}",
                    'Content-Type': 'application/json'
                },
                json={
                    'model': config['model'],
                    'messages': [{'role': 'user', 'content': prompt}],
                    'temperature': 0.1,
                    'max_tokens': 4096,
                    'response_format': {'type': 'json_object'}
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"API error: {response.status_code}")
            
            data = response.json()
            content = data['choices'][0]['message']['content']
            
            import json
            return json.loads(content)
    
    async def _call_huggingface(self, code: str, prompt_type: str) -> Dict:
        """Call HuggingFace Inference API"""
        
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                "https://api-inference.huggingface.co/models/codellama/CodeLlama-34b-Instruct-hf",
                headers={
                    'Authorization': f"Bearer {self.huggingface_token}",
                    'Content-Type': 'application/json'
                },
                json={
                    'inputs': f"Analyze this Solidity contract:\n{code}",
                    'parameters': {
                        'max_new_tokens': 2048,
                        'temperature': 0.1,
                        'return_full_text': False
                    }
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"HF error: {response.status_code}")
            
            return response.json()
    
    def get_status(self) -> Dict:
        """Get status of all providers"""
        status = {}
        for name, config in self.providers.items():
            status[name] = {
                'configured': bool(config['api_key']),
                'priority': config['priority'],
                'model': config['model']
            }
        status['huggingface'] = {
            'configured': bool(self.huggingface_token),
            'priority': 4,
            'model': 'CodeLlama-34b-Instruct'
        }
        return status

# Global instance
router = ModelRouter()