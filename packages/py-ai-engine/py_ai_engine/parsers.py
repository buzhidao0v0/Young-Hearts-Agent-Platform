"""LLM 响应解析工具模块。"""

import json
import re


def parse_llm_response(raw: str) -> dict:
    """解析 LLM 原始响应，尝试 JSON 解析，失败则包裹为 {"text": raw}。"""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"text": raw}


def extract_json_from_text(text: str) -> dict:
    """从文本中提取 JSON：优先匹配 ```json``` 代码块，其次匹配裸 JSON 对象。"""
    pattern = r"```(?:json)?\s*([\s\S]*?)```"
    match = re.search(pattern, text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass
    json_pattern = r"\{[\s\S]*\}"
    match = re.search(json_pattern, text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return {}
