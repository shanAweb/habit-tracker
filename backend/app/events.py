from typing import List

from fastapi import WebSocket


class EventHub:
    def __init__(self) -> None:
        self._connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self._connections:
            self._connections.remove(websocket)

    async def broadcast_change(self) -> None:
        stale_connections: List[WebSocket] = []
        for websocket in self._connections:
            try:
                await websocket.send_json({"type": "habits.changed"})
            except RuntimeError:
                stale_connections.append(websocket)

        for websocket in stale_connections:
            self.disconnect(websocket)


event_hub = EventHub()
