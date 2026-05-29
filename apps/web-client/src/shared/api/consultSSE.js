const SSE_EVENTS = {
  THOUGHT: 'thought',
  TEXT: 'text',
  SOURCE: 'source',
  DONE: 'done',
  ERROR: 'error',
  HEARTBEAT: 'heartbeat',
};

export async function consultSSE(url, body, callbacks = {}, signal) {
  const controller = new AbortController();
  if (signal) signal.addEventListener('abort', () => controller.abort());

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  if (!response.ok) {
    throw new Error(`SSE request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          callbacks.onDone?.();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const eventType = parsed.type || parsed.event;
          switch (eventType) {
            case SSE_EVENTS.THOUGHT:
              callbacks.onThought?.(parsed);
              break;
            case SSE_EVENTS.TEXT:
              callbacks.onText?.(parsed);
              break;
            case SSE_EVENTS.SOURCE:
              callbacks.onSource?.(parsed);
              break;
            case SSE_EVENTS.ERROR:
              callbacks.onError?.(parsed);
              break;
            case SSE_EVENTS.HEARTBEAT:
              break;
            default:
              callbacks.onMessage?.(parsed);
          }
        } catch {
          callbacks.onRaw?.(data);
        }
      }
    }
  }
}

export { SSE_EVENTS };
