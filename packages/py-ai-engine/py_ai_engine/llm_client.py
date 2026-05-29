"""LLM Chat Completion 客户端模块。"""

import httpx
from py_config.settings import settings


class LLMClient:
    """LLM Chat Completion 客户端，封装 OpenAI 兼容接口调用。"""

    def __init__(self) -> None:
        """初始化实例，设置核心属性。"""
        self.base_url = settings.DOUBAO_BASE_URL or "https://dashscope.aliyuncs.com/compatible-mode/v1"
        self.api_key = settings.DOUBAO_API_KEY

    async def chat(self, model: str, messages: list[dict], **kwargs: object) -> dict:
        """调用 LLM Chat Completion 接口。

        Args:
            model: 模型标识。
            messages: 对话消息列表。
            **kwargs: 传递给接口的额外参数。

        Returns:
            接口返回的 JSON 字典。
        """
        async with httpx.AsyncClient(base_url=self.base_url, timeout=120) as client:
            resp = await client.post(
                "/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"model": model, "messages": messages, **kwargs},
            )
            resp.raise_for_status()
            return resp.json()
