"""Multi-agent workflow (OpenAI Agents SDK) + image creator tool.

Requires OPENAI_API_KEY. Optional: OPENAI_DEFAULT_MODEL (see SDK docs).
"""

from __future__ import annotations

import json
import logging
import os
from functools import lru_cache
from typing import Any

from agents import Agent, Runner, function_tool
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX
from agents.items import HandoffOutputItem, MessageOutputItem, ToolCallItem, ToolCallOutputItem
from agents.result import RunResult
from openai import APIConnectionError, AsyncOpenAI, OpenAIError, RateLimitError

logger = logging.getLogger(__name__)

_agents_client: AsyncOpenAI | None = None


def openai_agents_configured() -> bool:
    return bool(os.getenv("OPENAI_API_KEY", "").strip())


def _get_async_client() -> AsyncOpenAI:
    global _agents_client
    key = os.getenv("OPENAI_API_KEY", "").strip()
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    if _agents_client is None:
        _agents_client = AsyncOpenAI(api_key=key)
    return _agents_client


@function_tool
async def generate_image_with_dalle(prompt: str, style_notes: str = "") -> str:
    """Generate one image from a text description (DALL·E 3).

    Args:
        prompt: Subject, composition, lighting, colors, and mood (Japanese or English).
        style_notes: Optional style hints (e.g. flat vector poster, soft watercolor, photo-realistic).
    """
    client = _get_async_client()
    text = prompt.strip()
    if style_notes.strip():
        text = f"{text}\nStyle notes: {style_notes.strip()}"
    # DALL·E 3 prompt limit is enforced server-side; keep a safe bound.
    if len(text) > 3900:
        text = text[:3900]
    try:
        resp = await client.images.generate(
            model="dall-e-3",
            prompt=text,
            size="1024x1024",
            quality="standard",
            n=1,
        )
    except (OpenAIError, APIConnectionError, RateLimitError) as e:
        logger.warning("image generation failed: %s", e)
        return json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False)

    data = resp.data[0] if resp.data else None
    if not data:
        return json.dumps({"ok": False, "error": "empty response"}, ensure_ascii=False)

    payload: dict[str, Any] = {"ok": True, "url": getattr(data, "url", None)}
    revised = getattr(data, "revised_prompt", None)
    if revised:
        payload["revised_prompt"] = revised
    return json.dumps(payload, ensure_ascii=False)


@lru_cache(maxsize=1)
def _build_agents() -> Agent[Any]:
    general_agent = Agent(
        name="General assistant",
        handoff_description="General questions, product help, or conversation where no image file is required.",
        instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
You are a concise assistant for campaign administrators (voting / landing pages).
Answer in the same language as the user when possible. Keep replies short unless asked for detail.
If the user wants an image, logo, illustration, or mock visual, do not improvise—tell them you will route to the Creator (they should ask explicitly for image generation).""",
    )

    creator_agent = Agent(
        name="Creator",
        handoff_description="When the user wants to generate an image, illustration, banner, icon mock, or visual from text.",
        instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
You are the Creator specialist. You generate images via the tool.

Workflow:
1. Read the user's intent and translate it into one clear, concrete image brief (composition, subject, palette, mood).
2. Call `generate_image_with_dalle` once with `prompt` and optional `style_notes`.
3. Parse the tool JSON result. If ok=true, give the user the image URL and mention the revised_prompt briefly if useful.
4. If ok=false, explain the error briefly and suggest a simpler prompt.

Always produce a helpful final message after using the tool.""",
        tools=[generate_image_with_dalle],
    )

    coordinator = Agent(
        name="Coordinator",
        instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
You are the front desk for an internal admin assistant.

- If the user wants to **create / generate / draw / illustrate** an image or visual from text, hand off to **Creator**.
- Otherwise hand off to **General assistant** for explanations and help.

If a request is ambiguous, ask one short clarifying question yourself (stay Coordinator) before handing off.""",
        handoffs=[creator_agent, general_agent],
    )

    return coordinator


def summarize_run_steps(result: RunResult) -> list[dict[str, Any]]:
    steps: list[dict[str, Any]] = []
    for item in result.new_items:
        if isinstance(item, HandoffOutputItem):
            tgt = getattr(item.target_agent, "name", None) or "unknown"
            steps.append({"kind": "handoff", "to": tgt})
        elif isinstance(item, ToolCallItem):
            ri = item.raw_item
            name = getattr(ri, "name", None)
            if name is None and isinstance(ri, dict):
                name = ri.get("name")
            steps.append({"kind": "tool_call", "name": name})
        elif isinstance(item, ToolCallOutputItem):
            preview = str(item.output)
            if len(preview) > 400:
                preview = preview[:400] + "…"
            steps.append({"kind": "tool_result", "preview": preview})
        elif isinstance(item, MessageOutputItem):
            raw = getattr(item.raw_item, "content", None)
            text = str(raw) if raw is not None else ""
            if len(text) > 200:
                text = text[:200] + "…"
            if text.strip():
                steps.append({"kind": "assistant_message", "preview": text})
    return steps


async def run_coordinator(message: str, *, max_turns: int = 20) -> RunResult:
    if not openai_agents_configured():
        raise RuntimeError("OPENAI_API_KEY is not set")
    coordinator = _build_agents()
    return await Runner.run(coordinator, message.strip(), max_turns=max_turns)


__all__ = [
    "openai_agents_configured",
    "run_coordinator",
    "summarize_run_steps",
]
