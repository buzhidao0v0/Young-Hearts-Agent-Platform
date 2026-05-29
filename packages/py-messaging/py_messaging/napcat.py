import httpx


class NapCatClient:
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url

    async def send_group_message(self, group_id: int, message: str) -> dict:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=30) as client:
            resp = await client.post(
                "/send_group_msg",
                json={"group_id": group_id, "message": [{"type": "text", "data": {"text": message}}]},
            )
            resp.raise_for_status()
            return resp.json()

    async def send_private_message(self, user_id: int, message: str) -> dict:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=30) as client:
            resp = await client.post(
                "/send_private_msg",
                json={"user_id": user_id, "message": [{"type": "text", "data": {"text": message}}]},
            )
            resp.raise_for_status()
            return resp.json()
