"""DashScope API 客户端封装模块。"""

import httpx
from py_ai_engine.llm_client import LLMClient
from py_config.settings import settings


class DashScopeClient:
    """DashScope API 客户端，封装 LLM 调用与嵌入。"""

    def __init__(self) -> None:
        """初始化实例，设置核心属性。"""
        self._llm = LLMClient()

    async def chat_completion(self, model: str, messages: list[dict], **kwargs: object) -> dict:
        """调用 DashScope Chat Completion 接口。"""
        return await self._llm.chat(model, messages, **kwargs)

    async def embed_texts(self, texts: list[str], model: str = "text-embedding-v3") -> list[list[float]]:
        """调用 DashScope 文本嵌入接口。"""
        async with httpx.AsyncClient(
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            timeout=60,
        ) as client:
            resp = await client.post(
                "/embeddings",
                headers={"Authorization": f"Bearer {settings.DOUBAO_API_KEY}"},
                json={"model": model, "input": texts},
            )
            resp.raise_for_status()
            return [item["embedding"] for item in resp.json().get("data", [])]
