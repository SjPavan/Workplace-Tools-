from __future__ import annotations

from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class GrantType(str, Enum):
    PASSWORD = "password"
    REFRESH_TOKEN = "refresh_token"
    ID_TOKEN = "id_token"


class SessionExchangeRequest(BaseModel):
    grant_type: GrantType = Field(..., description="Supabase Auth grant type")
    email: Optional[EmailStr] = Field(
        default=None, description="User email for password grant"
    )
    password: Optional[str] = Field(
        default=None, description="User password for password grant"
    )
    refresh_token: Optional[str] = Field(
        default=None, description="Refresh token for refresh grant"
    )
    provider: Optional[str] = Field(
        default=None, description="OAuth provider for id_token grant"
    )
    id_token: Optional[str] = Field(
        default=None, description="ID token for id_token grant"
    )
    nonce: Optional[str] = Field(default=None, description="Nonce for id_token grant")

    @model_validator(mode="after")
    def validate_payload(self) -> "SessionExchangeRequest":
        if self.grant_type == GrantType.PASSWORD and not (
            self.email and self.password
        ):
            raise ValueError("Email and password are required for password grant")
        if self.grant_type == GrantType.REFRESH_TOKEN and not self.refresh_token:
            raise ValueError("Refresh token is required for refresh grant")
        if self.grant_type == GrantType.ID_TOKEN and not (
            self.provider and self.id_token
        ):
            raise ValueError("Provider and id_token are required for id_token grant")
        return self


class SessionTokenResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    access_token: str
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None
    token_type: Optional[str] = None
    user: Optional[Dict[str, Any]] = None


class RefreshRequest(BaseModel):
    refresh_token: str


class DeviceRegisterRequest(BaseModel):
    device_id: str
    refresh_token: str


class MessageResponse(BaseModel):
    message: str
