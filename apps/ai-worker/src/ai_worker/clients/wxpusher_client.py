from py_messaging.wxpusher import WxPusherClient


class WorkerWxPusherClient:
    """WxPusher 客户端封装，供 Worker 任务调用。"""

    def __init__(self, app_token: str) -> None:
        self._client = WxPusherClient(app_token)

    async def send(self, content: str, uids: list[str] | None = None, topic_ids: list[int] | None = None) -> dict:
        """发送 WxPusher 消息。"""
        return await self._client.send(content, uids, topic_ids)
