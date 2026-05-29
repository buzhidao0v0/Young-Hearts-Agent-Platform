import httpx


class WxPusherClient:
    def __init__(self, app_token: str) -> None:
        self.app_token = app_token
        self.base_url = "https://wxpusher.zjiecode.com/api/send"

    async def send(self, content: str, uids: list[str] | None = None, topic_ids: list[int] | None = None) -> dict:
        payload: dict = {"appToken": self.app_token, "content": content, "contentType": 1}
        if uids:
            payload["uids"] = uids
        if topic_ids:
            payload["topicIds"] = topic_ids
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(self.base_url, json=payload)
            resp.raise_for_status()
            return resp.json()


class NapCatClient:
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url

    async def send_group_msg(self, group_id: int, message: str) -> dict:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=30) as client:
            resp = await client.post("/send_group_msg", json={"group_id": group_id, "message": [{"type": "text", "data": {"text": message}}]})
            resp.raise_for_status()
            return resp.json()
