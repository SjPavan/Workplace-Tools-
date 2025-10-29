import json
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


class NotificationBus:
    """Stub notification publisher for downstream push integrations."""

    def __init__(self, topic: str) -> None:
        self.topic = topic
        self._published: List[Dict] = []

    def publish(self, event: Dict) -> None:
        logger.info("Notification published to %s: %s", self.topic, json.dumps(event))
        self._published.append(event)

    @property
    def published_events(self) -> List[Dict]:
        return list(self._published)
