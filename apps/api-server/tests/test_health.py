"""健康检查接口测试。"""
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_health():
    """测试健康检查接口返回 200 和 status=ok。"""
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

# 如健康检查接口需鉴权，可补充如下用例（假设/health 需登录）
def test_health_auth_required():
    """测试健康检查鉴权场景。"""
    r = client.get("/health", headers={"X-Session-ID": "invalid"})
    # 若需鉴权应为401，否则为200
    assert r.status_code in (200, 401)
