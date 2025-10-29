from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class GoogleOAuthRequest(BaseModel):
    authorization_code: str = Field(..., description="OAuth authorization code")


class GoogleDisconnectResponse(BaseModel):
    message: str


class CalendarListResponse(BaseModel):
    items: Optional[List[Dict[str, Any]]] = None


class SyncResponse(BaseModel):
    status: str
    calendars_synced: Optional[int] = None
