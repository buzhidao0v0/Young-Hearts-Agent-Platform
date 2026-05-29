import httpx
from py_config.settings import settings


class LLMClient:
    def __init__(self) -> None:
        self.base_url = settings.DOUBAO_BASE_URL or "https://dashscope.aliyuncs.com/compatible-mode/v1"
        self.api_key = settings.DOUBAO_API_KEY

    async def chat(self, model: str, messages: list[dict], **kwargs: object) -> dict:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=120) as client:
            resp = await client.post(
                "/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"model": model, "messages": messages, **kwargs},
            )
            resp.raise_for_status()
            return resp.json()
