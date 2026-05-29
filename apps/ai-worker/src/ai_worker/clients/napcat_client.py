"""NapCatQQ Worker 客户端封装模块。"""

from py_messaging.napcat import NapCatClient


class WorkerNapCatClient:
    """NapCatQQ 客户端封装，供 Worker 任务调用。"""

    def __init__(self, base_url: str) -> None:
        """初始化实例，设置核心属性。"""
        self._client = NapCatClient(base_url)

    async def send_group_message(self, group_id: int, message: str) -> dict:
        """发送 QQ 群消息。"""
        return await self._client.send_group_message(group_id, message)
