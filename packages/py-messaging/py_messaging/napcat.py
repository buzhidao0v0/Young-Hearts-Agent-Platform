"""NapCatQQ HTTP 客户端模块。"""

import httpx


class NapCatClient:
    """NapCatQQ HTTP 客户端，封装群消息与私聊消息发送。"""

    def __init__(self, base_url: str) -> None:
        """初始化实例，设置核心属性。"""
        self.base_url = base_url

    async def send_group_message(self, group_id: int, message: str) -> dict:
        """发送 QQ 群消息。

        Args:
            group_id: 目标群号。
            message: 消息文本。

        Returns:
            接口返回的 JSON 字典。
        """
        async with httpx.AsyncClient(base_url=self.base_url, timeout=30) as client:
            resp = await client.post(
                "/send_group_msg",
                json={"group_id": group_id, "message": [{"type": "text", "data": {"text": message}}]},
            )
            resp.raise_for_status()
            return resp.json()

    async def send_private_message(self, user_id: int, message: str) -> dict:
        """发送 QQ 私聊消息。

        Args:
            user_id: 目标用户 QQ 号。
            message: 消息文本。

        Returns:
            接口返回的 JSON 字典。
        """
        async with httpx.AsyncClient(base_url=self.base_url, timeout=30) as client:
            resp = await client.post(
                "/send_private_msg",
                json={"user_id": user_id, "message": [{"type": "text", "data": {"text": message}}]},
            )
            resp.raise_for_status()
            return resp.json()
