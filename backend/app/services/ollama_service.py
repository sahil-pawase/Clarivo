"""
Ollama AI service for offline/local LLM interactions
"""
from typing import Dict, Any, List, Optional
import httpx
import asyncio
from app.core.config import settings


class OllamaService:
    def __init__(self, host: Optional[str] = None, model: Optional[str] = None, timeout: float = 120.0):
        self.host = (host or getattr(settings, "OLLAMA_HOST", "http://localhost:11434")).rstrip("/")
        self.model = model or getattr(settings, "OLLAMA_MODEL", "llama3.1")
        self.timeout = timeout

    async def _post(self, path: str, json: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.host}{path}"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, json=json)
            resp.raise_for_status()
            return resp.json()

    async def ensure_model_pulled(self) -> None:
        try:
            await self._post("/api/pull", {"name": self.model, "stream": False})
        except Exception:
            # Best-effort; if pull fails but model exists, generation might still work
            pass

    async def generate(self, prompt: str, system: Optional[str] = None, temperature: float = 0.4, max_tokens: int = 512) -> str:
        await self.ensure_model_pulled()
        messages: List[Dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            },
            "stream": False
        }
        data = await self._post("/api/chat", payload)
        # Non-streaming chat returns {message: {content: ...}} or {response: ...} depending on version
        if isinstance(data, dict):
            if "message" in data and isinstance(data["message"], dict):
                return data["message"].get("content", "")
            if "response" in data:
                return str(data.get("response", ""))
        return ""


# Global instance
ollama_service = OllamaService()



