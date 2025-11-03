from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.rate_limit import limiter

router = APIRouter(prefix="/api/ai", tags=["ai"])


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    model: str = "gpt-3.5-turbo"


class ChatResponse(BaseModel):
    response: str
    conversation_id: str | None = None
    model: str
    usage: dict[str, int]


@router.post("/complete", name="ai:complete")
@limiter.limit("20/minute")
async def complete_chat(request: ChatRequest) -> ChatResponse:
    """
    AI chat completion endpoint.
    
    Currently returns a mock response for development and testing.
    In production, this would integrate with AI providers like OpenAI, Anthropic, etc.
    """
    try:
        # Mock response for development
        mock_responses = [
            "I'm a mock AI response for development purposes. The actual AI integration will be implemented in production.",
            "This is a placeholder response. The real AI model will process your message once the service is fully deployed.",
            "Hello! I'm currently in development mode. Once configured with AI providers, I'll be able to provide intelligent responses.",
        ]
        
        import random
        mock_response = random.choice(mock_responses)
        
        return ChatResponse(
            response=mock_response,
            conversation_id=request.conversation_id,
            model=request.model,
            usage={
                "prompt_tokens": len(request.message.split()),
                "completion_tokens": len(mock_response.split()),
                "total_tokens": len(request.message.split()) + len(mock_response.split()),
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI service temporarily unavailable: {str(e)}",
        )


@router.get("/models", name="ai:models")
@limiter.limit("10/minute")
async def list_models() -> dict[str, Any]:
    """List available AI models."""
    return {
        "models": [
            {
                "id": "gpt-3.5-turbo",
                "name": "GPT-3.5 Turbo",
                "provider": "openai",
                "available": True,
            },
            {
                "id": "gpt-4",
                "name": "GPT-4",
                "provider": "openai", 
                "available": True,
            },
            {
                "id": "claude-3-sonnet",
                "name": "Claude 3 Sonnet",
                "provider": "anthropic",
                "available": True,
            },
        ],
        "default": "gpt-3.5-turbo",
    }