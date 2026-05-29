"""WxPusher 与 NapCatQQ 消息推送客户端模块。"""

import httpx


class WxPusherClient:
    """WxPusher 消息推送客户端。"""

    def __init__(self, app_token: str) -> None:
        """初始化实例，设置核心属性。"""
        self.app_token = app_token
        self.base_url = "https://wxpusher.zjiecode.com/api/send"

    async def send(self, content: str, uids: list[str] | None = None, topic_ids: list[int] | None = None) -> dict:
        """发送 WxPusher 消息。

        Args:
            content: 消息内容。
            uids: 目标用户 UID 列表。
            topic_ids: 目标主题 ID 列表。

        Returns:
            接口返回的 JSON 字典。
        """
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
    """NapCatQQ HTTP 客户端，封装群消息发送。"""

    def __init__(self, base_url: str) -> None:
        """初始化实例，设置核心属性。"""
        self.base_url = base_url

    async def send_group_msg(self, group_id: int, message: str) -> dict:
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
                json={
                    "group_id": group_id,
                    "message": [{"type": "text", "data": {"text": message}}],
                },
            )
            resp.raise_for_status()
            return resp.json()
