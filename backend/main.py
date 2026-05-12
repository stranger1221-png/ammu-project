"""GENVO backend — FastAPI app with AI endpoints, email+password auth, cloud sync."""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Header, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import httpx
import logging
import json
import re
import uuid
import secrets
import bcrypt
import jwt as pyjwt
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("genvo")

# Debug: Log all available env var keys (not values) to help diagnose Vercel issues
logger.info(f"Available Environment Keys: {list(os.environ.keys())}")

db_error = None
db = None
mongo_url = (os.environ.get('MONGO_URI') or os.environ.get('MONGO_URL', '')).strip()

if not mongo_url:
    db_error = "MONGO_URI environment variable is missing from Vercel"
    logger.error(db_error)
else:
    try:
        import certifi
        ca = certifi.where()
        client = AsyncIOMotorClient(mongo_url, tlsCAFile=ca)
        db_name = os.environ.get('DB_NAME', 'genvo_db')
        db = client[db_name]
        logger.info(f"MongoDB client initialized for database: {db_name} (using certifi)")
    except Exception as e:
        db_error = str(e)
        logger.error(f"Failed to initialize MongoDB client: {e}")
        db = None

# Check for API keys
GEMINI_API_KEY = (os.environ.get('GEMINI_API_KEY') or os.environ.get('EMERGENT_LLM_KEY', '')).strip()
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY / EMERGENT_LLM_KEY is not set. AI features will fail.")
else:
    logger.info("Gemini API key found (prefix: %s...)", GEMINI_API_KEY[:6])

# Use a model id your API key can call (see Google AI Studio / listModels). Override with GEMINI_MODEL.
GEMINI_MODEL = (os.environ.get("GEMINI_MODEL") or "gemini-2.5-flash").strip()


JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me-in-production')
JWT_ALG = "HS256"
ACCESS_TTL_MIN = 60          # access token lifetime
REFRESH_TTL_SHORT_DAYS = 7   # refresh without "remember me"
REFRESH_TTL_LONG_DAYS = 90   # refresh with "remember me"

app = FastAPI()
api_router = APIRouter(prefix="/api")



# ========================================================================
# Helpers
# ========================================================================

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def now_utc():
    return datetime.now(timezone.utc)


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": now_utc() + timedelta(minutes=ACCESS_TTL_MIN),
        "iat": now_utc(),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def create_refresh_token(user_id: str, sid: str, remember: bool) -> str:
    days = REFRESH_TTL_LONG_DAYS if remember else REFRESH_TTL_SHORT_DAYS
    payload = {
        "sub": user_id,
        "sid": sid,
        "type": "refresh",
        "exp": now_utc() + timedelta(days=days),
        "iat": now_utc(),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    return pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])


async def get_current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Not authenticated")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(401, "Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(401, "User not found")
        return user
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


def public_user(u: dict) -> dict:
    return {
        "id": u.get("id"),
        "email": u.get("email"),
        "name": u.get("name"),
        "icon": u.get("icon"),
        "two_factor_enabled": bool(u.get("two_factor_enabled", False)),
        "created_at": u.get("created_at"),
    }


# ========================================================================
# Models
# ========================================================================

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    icon: Optional[str] = "🦊"
    remember: Optional[bool] = False


class LoginIn(BaseModel):
    email: EmailStr
    password: str
    remember: Optional[bool] = False


class RefreshIn(BaseModel):
    refresh_token: str


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    password: str


class ProfileUpdateIn(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str


class SyncIn(BaseModel):
    progress: Optional[dict] = None
    custom_words: Optional[list] = None
    theme: Optional[str] = None


class LookupRequest(BaseModel):
    query: str


class StoryRequest(BaseModel):
    theme: str
    word: str
    learned_words: Optional[List[str]] = []


class TutorMessage(BaseModel):
    role: str
    content: str


class TutorRequest(BaseModel):
    message: str
    history: Optional[List[TutorMessage]] = []


# ========================================================================
# AI helpers (unchanged)
# ========================================================================

def extract_json(text: str) -> dict:
    # First, remove common markdown fencing
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*\n?", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\n?```\s*$", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.strip()
    
    # Try direct JSON parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    
    # Find and extract JSON object
    start_idx = cleaned.find("{")
    end_idx = cleaned.rfind("}")
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        json_str = cleaned[start_idx:end_idx + 1]
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            pass
    
    # Clear error message with context
    raise ValueError(f"Could not extract valid JSON from response. Raw text: {text[:200]}")


async def call_gemini(system_message: str, user_message: str, max_tokens: int = 1024) -> str:
    """Call Google Gemini API via REST."""
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY is missing")
        raise HTTPException(503, "Gemini API key not configured on server")

    import asyncio

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"INSTRUCTIONS: {system_message}\n\nUSER REQUEST: {user_message}"}]
            }
        ],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 0.3,
            "topP": 0.9,
            "topK": 40
        }
    }

    # Only retry on true transient errors (429, 503) — NOT on 400/404 config errors
    max_retries = 3
    async with httpx.AsyncClient(timeout=60.0) as client:
        for attempt in range(max_retries):
            try:
                logger.info(f"Gemini call attempt {attempt + 1}/{max_retries} -> {GEMINI_MODEL}")
                resp = await client.post(url, headers={"Content-Type": "application/json"}, json=payload)
                logger.info(f"Gemini response status: {resp.status_code}")

                # Surface real error immediately for non-retryable failures
                if resp.status_code in (400, 401, 403, 404):
                    body = resp.text[:600]
                    logger.error(f"Gemini non-retryable error {resp.status_code}: {body}")
                    raise HTTPException(503, f"Gemini API error {resp.status_code}: {body}")

                # Retry only on transient overload / rate-limit
                if resp.status_code in (429, 500, 503, 504):
                    wait_time = min((2 ** attempt) * 2, 20)
                    logger.warning(f"Gemini transient {resp.status_code}, retrying in {wait_time}s")
                    await asyncio.sleep(wait_time)
                    continue

                if resp.status_code != 200:
                    body = resp.text[:400]
                    logger.error(f"Gemini unexpected status {resp.status_code}: {body}")
                    raise HTTPException(503, f"Gemini returned {resp.status_code}: {body}")

                data = resp.json()
                logger.info(f"Gemini response keys: {list(data.keys())}")

                if "candidates" not in data or not data["candidates"]:
                    feedback = data.get("promptFeedback", {})
                    logger.error(f"No candidates. promptFeedback={feedback}, full={data}")
                    if feedback:
                        return "I'm sorry, I can't help with that request."
                    raise HTTPException(503, f"Gemini returned no candidates: {data}")

                candidate = data["candidates"][0]
                if "content" not in candidate or not candidate["content"].get("parts"):
                    finish = candidate.get("finishReason", "UNKNOWN")
                    logger.error(f"No content in candidate. finishReason={finish}, candidate={candidate}")
                    raise HTTPException(503, f"Gemini stopped with reason: {finish}")

                text_response = candidate["content"]["parts"][0]["text"]
                logger.info(f"Gemini success (attempt {attempt + 1}), length={len(text_response)}")
                return text_response

            except httpx.TimeoutException:
                logger.warning(f"Gemini timeout on attempt {attempt + 1}")
                if attempt < max_retries - 1:
                    continue
                raise HTTPException(504, "Gemini API timed out after 60s. Try again.")
            except HTTPException:
                raise
            except Exception as e:
                logger.exception(f"Unexpected error calling Gemini attempt {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    continue
                raise HTTPException(500, f"Internal AI error: {str(e)}")

    raise HTTPException(503, "Gemini API failed after retries")


# ========================================================================
# Auth endpoints
# ========================================================================



@api_router.post("/auth/register")
async def register(body: RegisterIn, request: Request):
    if db is None:
        raise HTTPException(503, f"Database connection is not available. Error: {db_error or 'Unknown error'}. Check your MONGO_URI.")
    email = body.email.lower().strip()
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    if not body.name.strip():
        raise HTTPException(400, "Name is required")
    existing = await db.users.find_one({"email": email}, {"_id": 0, "id": 1})
    if existing:
        raise HTTPException(409, "An account with this email already exists. Try signing in.")

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "name": body.name.strip(),
        "icon": body.icon or "🦊",
        "password_hash": hash_pw(body.password),
        "two_factor_enabled": False,
        "created_at": now_utc().isoformat(),
    }
    await db.users.insert_one(user_doc)

    sid = str(uuid.uuid4())
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "")
    await db.sessions.insert_one({
        "id": sid, "user_id": user_id,
        "ip": ip, "user_agent": ua,
        "remember": bool(body.remember),
        "created_at": now_utc().isoformat(),
        "last_seen": now_utc().isoformat(),
        "revoked": False,
    })
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id, sid, bool(body.remember))
    return {
        "user": public_user(user_doc),
        "access_token": access,
        "refresh_token": refresh,
    }


@api_router.post("/auth/login")
async def login(body: LoginIn, request: Request):
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    # brute-force lockout
    rec = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if rec and rec.get("locked_until"):
        try:
            until = datetime.fromisoformat(rec["locked_until"])
            if until > now_utc():
                raise HTTPException(429, "Too many failed attempts. Try again in 15 minutes.")
        except ValueError:
            pass

    user = await db.users.find_one({"email": email})
    if not user or not verify_pw(body.password, user.get("password_hash", "")):
        # increment fails
        fails = (rec.get("failed", 0) if rec else 0) + 1
        update = {"identifier": identifier, "failed": fails, "last_attempt": now_utc().isoformat(), "last_attempt_dt": now_utc()}
        if fails >= 5:
            update["locked_until"] = (now_utc() + timedelta(minutes=15)).isoformat()
            update["failed"] = 0
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        raise HTTPException(401, "Invalid email or password")

    # success — clear fails
    await db.login_attempts.delete_one({"identifier": identifier})

    sid = str(uuid.uuid4())
    await db.sessions.insert_one({
        "id": sid, "user_id": user["id"],
        "ip": ip, "user_agent": request.headers.get("user-agent", ""),
        "remember": bool(body.remember),
        "created_at": now_utc().isoformat(),
        "last_seen": now_utc().isoformat(),
        "revoked": False,
    })

    access = create_access_token(user["id"], email)
    refresh = create_refresh_token(user["id"], sid, bool(body.remember))
    return {
        "user": public_user(user),
        "access_token": access,
        "refresh_token": refresh,
    }


@api_router.post("/auth/refresh")
async def refresh(body: RefreshIn):
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid token type")
        sid = payload.get("sid")
        user_id = payload["sub"]
        sess = await db.sessions.find_one({"id": sid, "user_id": user_id, "revoked": False}, {"_id": 0})
        if not sess:
            raise HTTPException(401, "Session revoked or missing")
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(401, "User not found")
        await db.sessions.update_one({"id": sid}, {"$set": {"last_seen": now_utc().isoformat()}})
        access = create_access_token(user_id, user["email"])
        return {"access_token": access}
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(401, "Refresh token expired. Please sign in again.")
    except pyjwt.InvalidTokenError:
        raise HTTPException(401, "Invalid refresh token")


@api_router.post("/auth/logout")
async def logout(body: RefreshIn, current=Depends(get_current_user)):
    try:
        payload = decode_token(body.refresh_token)
        await db.sessions.update_one({"id": payload.get("sid"), "user_id": current["id"]}, {"$set": {"revoked": True}})
    except Exception:
        pass
    return {"ok": True}


@api_router.get("/auth/me")
async def me(current=Depends(get_current_user)):
    return {"user": public_user(current)}


@api_router.put("/auth/profile")
async def update_profile(body: ProfileUpdateIn, current=Depends(get_current_user)):
    update = {}
    if body.name is not None and body.name.strip():
        update["name"] = body.name.strip()
    if body.icon is not None:
        update["icon"] = body.icon
    if update:
        await db.users.update_one({"id": current["id"]}, {"$set": update})
    user = await db.users.find_one({"id": current["id"]})
    return {"user": public_user(user)}


@api_router.put("/auth/password")
async def change_password(body: PasswordChangeIn, current=Depends(get_current_user)):
    user = await db.users.find_one({"id": current["id"]})
    if not user or not verify_pw(body.current_password, user.get("password_hash", "")):
        raise HTTPException(400, "Current password is incorrect")
    if len(body.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    await db.users.update_one({"id": current["id"]}, {"$set": {"password_hash": hash_pw(body.new_password)}})
    return {"ok": True}


@api_router.post("/auth/forgot-password")
async def forgot_password(body: ForgotIn):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email}, {"_id": 0, "id": 1})
    # Always return identical shape regardless of whether the user exists,
    # to prevent account enumeration. In production, send the token via
    # email and DROP it from the response body entirely.
    token = None
    if user:
        token = secrets.token_urlsafe(32)
        expires_at = now_utc() + timedelta(hours=1)
        await db.password_reset_tokens.insert_one({
            "token": token,
            "user_id": user["id"],
            "expires_at": expires_at.isoformat(),
            "used": False,
            "created_at": now_utc().isoformat(),
        })
        logger.info("Password reset link generated for user_id=%s", user["id"])
    # TODO: integrate Resend/SendGrid and remove `reset_token` from response.
    return {"ok": True, "reset_token": token}


@api_router.post("/auth/reset-password")
async def reset_password(body: ResetIn):
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    rec = await db.password_reset_tokens.find_one({"token": body.token, "used": False}, {"_id": 0})
    if not rec:
        raise HTTPException(400, "Invalid or already-used reset token")
    try:
        expires_at = datetime.fromisoformat(rec["expires_at"])
    except Exception:
        raise HTTPException(400, "Invalid token")
    if expires_at < now_utc():
        raise HTTPException(400, "Reset token has expired. Request a new one.")
    await db.users.update_one({"id": rec["user_id"]}, {"$set": {"password_hash": hash_pw(body.password)}})
    await db.password_reset_tokens.update_one({"token": body.token}, {"$set": {"used": True}})
    # Revoke all existing sessions for safety
    await db.sessions.update_many({"user_id": rec["user_id"]}, {"$set": {"revoked": True}})
    return {"ok": True}


@api_router.get("/auth/sessions")
async def list_sessions(current=Depends(get_current_user)):
    sessions = await db.sessions.find(
        {"user_id": current["id"], "revoked": False},
        {"_id": 0, "id": 1, "ip": 1, "user_agent": 1, "created_at": 1, "last_seen": 1, "remember": 1},
    ).to_list(50)
    return {"sessions": sessions}


@api_router.delete("/auth/sessions/{sid}")
async def revoke_session(sid: str, current=Depends(get_current_user)):
    await db.sessions.update_one({"id": sid, "user_id": current["id"]}, {"$set": {"revoked": True}})
    return {"ok": True}


@api_router.post("/auth/logout-everywhere")
async def logout_everywhere(current=Depends(get_current_user)):
    await db.sessions.update_many({"user_id": current["id"]}, {"$set": {"revoked": True}})
    return {"ok": True}


# ========================================================================
# Cloud sync (authenticated)
# ========================================================================

@api_router.get("/sync")
async def sync_get(current=Depends(get_current_user)):
    rec = await db.user_data.find_one({"user_id": current["id"]}, {"_id": 0})
    if not rec:
        return {"progress": None, "custom_words": [], "theme": "light"}
    return {
        "progress": rec.get("progress"),
        "custom_words": rec.get("custom_words", []),
        "theme": rec.get("theme", "light"),
        "updated_at": rec.get("updated_at"),
    }


@api_router.post("/sync")
async def sync_set(body: SyncIn, current=Depends(get_current_user)):
    update: dict[str, Any] = {"user_id": current["id"], "updated_at": now_utc().isoformat()}
    if body.progress is not None:
        update["progress"] = body.progress
    if body.custom_words is not None:
        update["custom_words"] = body.custom_words
    if body.theme is not None:
        update["theme"] = body.theme
    await db.user_data.update_one({"user_id": current["id"]}, {"$set": update}, upsert=True)
    return {"ok": True}


# ========================================================================
# AI endpoints (unchanged)
# ========================================================================

@api_router.get("/")
async def root():
    return {"message": "GENVO API ready"}


@api_router.post("/ai/lookup")
async def ai_lookup(req: LookupRequest):
    if not req.query.strip():
        raise HTTPException(400, "query is required")
    system = (
        'You are a vocabulary dictionary. Return ONLY a valid JSON object, no markdown, '
        'no explanation, no backticks. Use exactly this shape:\n'
        '{\n'
        '  "word": "",\n'
        '  "pronunciation": "",\n'
        '  "emoji": "",\n'
        '  "difficulty": "Easy|Medium|Hard",\n'
        '  "period": "Modern|Academic|Slang|Historical",\n'
        '  "origin": "",\n'
        '  "meanings": {\n'
        '    "formal": "", "genZ": "", "millennial": "",\n'
        '    "medieval": "", "victorian": "", "oldEnglish": ""\n'
        '  },\n'
        '  "synonyms": [],\n'
        '  "antonyms": [],\n'
        '  "examples": { "formal": "", "genZ": "", "medieval": "" },\n'
        '  "evolution": [],\n'
        '  "tenses": { "past": "", "present": "", "future": "" }\n'
        '}'
    )
    try:
        raw = await call_gemini(system, f'Define the word: "{req.query.strip()}"', max_tokens=2048)
        return {"ok": True, "data": extract_json(raw)}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("ai_lookup failed")
        raise HTTPException(500, f"AI lookup failed: {str(e)}")


@api_router.post("/ai/story")
async def ai_story(req: StoryRequest):
    if not req.word.strip() or not req.theme.strip():
        raise HTTPException(400, "theme and word are required")
    system = (
        "You are a simple story writer for vocabulary learners.\n\n"
        "Rules:\n"
        "1. Write a simple, easy-to-read story of MAXIMUM 120 words\n"
        "2. Use simple sentences — short, clear, beginner-friendly\n"
        "3. Naturally include the word the user gave you\n"
        "4. Also naturally include 3 to 5 interesting vocabulary words\n"
        "5. Keep the story fun and engaging for the theme given\n"
        "6. After the story, on a new line write exactly:\n"
        "   VOCAB: word1|meaning|pronunciation|emoji, word2|meaning|pronunciation|emoji\n"
        "   List ONLY the interesting vocabulary words you used (not common words like \"the\", \"and\", \"was\")\n"
        "   List maximum 6 words\n\n"
        "Return nothing else. No titles. No extra explanation."
    )
    user_msg = f'Write a {req.theme} story using the word "{req.word.strip()}". Maximum 120 words.'
    try:
        raw = await call_gemini(system, user_msg)
        text = raw.strip()
        story_text = text
        vocab_list = []
        m = re.search(r"VOCAB:\s*(.+)$", text, re.IGNORECASE | re.DOTALL)
        if m:
            story_text = text[:m.start()].strip()
            vocab_raw = m.group(1).strip()
            entries = [e.strip() for e in vocab_raw.split(",") if e.strip()]
            for entry in entries[:6]:
                parts = [p.strip() for p in entry.split("|")]
                if len(parts) >= 2:
                    vocab_list.append({
                        "word": parts[0],
                        "meaning": parts[1] if len(parts) > 1 else "",
                        "pronunciation": parts[2] if len(parts) > 2 else "",
                        "emoji": parts[3] if len(parts) > 3 else "✨",
                    })
        word_count = len(re.findall(r"\b[\w']+\b", story_text))
        return {"ok": True, "story": story_text, "vocab": vocab_list, "word_count": word_count}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("ai_story failed")
        raise HTTPException(500, f"AI story failed: {str(e)}")


@api_router.post("/ai/tutor")
async def ai_tutor(req: TutorRequest):
    system = (
        "You are Hoot, GENVO's vocabulary tutor. Be encouraging, concise (\u2264120 words per reply), "
        "educational. Help with word meanings, origins, language evolution, pronunciation tips. "
        "Use plain text, no markdown headings. Friendly owl personality."
    )
    history_text = ""
    last_history = (req.history or [])[-8:]
    for m in last_history:
        role = "User" if m.role == "user" else "Hoot"
        history_text += f"{role}: {m.content}\n"
    user_msg = f"{history_text}User: {req.message}\nHoot:" if history_text else req.message
    try:
        reply = await call_gemini(system, user_msg)
        return {"ok": True, "reply": reply.strip()}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("ai_tutor failed")
        raise HTTPException(500, f"AI tutor failed: {str(e)}")


# ========================================================================
# Speech-to-Text (server-side, bypasses Brave Shields)
# ========================================================================

class TranscribeRequest(BaseModel):
    audio: str        # base64-encoded audio
    mimeType: str = "audio/webm"


@api_router.post("/transcribe")
async def transcribe_audio(req: TranscribeRequest):
    """Transcribe audio using Gemini multimodal API — no ffmpeg needed, works with WebM from Brave."""
    if not req.audio:
        raise HTTPException(400, "No audio data provided")
    if not GEMINI_API_KEY:
        logger.error("transcribe: GEMINI_API_KEY missing")
        raise HTTPException(503, "Gemini API key not configured on server")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    
    payload = {
        "contents": [{
            "parts": [
                {
                    "text": (
                        "Listen to the audio carefully. Transcribe ONLY the exact words spoken. "
                        "Return nothing but the spoken words — no punctuation, no explanation, no quotes. "
                        "If nothing is spoken or audio is silent, return exactly: SILENT"
                    )
                },
                {
                    "inlineData": {
                        "mimeType": req.mimeType.split(";")[0],  # strip codecs suffix
                        "data": req.audio,
                    }
                },
            ]
        }],
        "generationConfig": {"maxOutputTokens": 100, "temperature": 0},
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers={"Content-Type": "application/json"}, json=payload)
            if resp.status_code != 200:
                logger.error("Gemini transcribe error %s: %s", resp.status_code, resp.text)
                raise HTTPException(503, f"Gemini API error: {resp.status_code}")
            data = resp.json()
            if not data.get("candidates"):
                logger.error("transcribe: no candidates: %s", str(data)[:500])
                raise HTTPException(503, "Transcription model returned no result")
            parts = data["candidates"][0].get("content", {}).get("parts") or []
            if not parts or not parts[0].get("text"):
                raise HTTPException(503, "Transcription returned empty text")
            raw = parts[0]["text"].strip()
            transcript = "" if raw.upper() == "SILENT" else raw
            return {"ok": True, "transcript": transcript}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("transcribe failed")
        raise HTTPException(500, f"Transcription error: {str(e)}")

app.include_router(api_router)

# Robust CORS setup
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
allow_all = "*" in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=[] if allow_all else cors_origins,
    allow_origin_regex=".*" if allow_all else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        await db.sessions.create_index("id", unique=True)
        await db.sessions.create_index("user_id")
        await db.password_reset_tokens.create_index("token", unique=True)
        await db.login_attempts.create_index("identifier")
        # TTL: auto-purge brute-force counters 24h after last attempt.
        try:
            await db.login_attempts.create_index("last_attempt_dt", expireAfterSeconds=86400)
        except Exception:
            pass
        await db.user_data.create_index("user_id", unique=True)
        logger.info("MongoDB indexes ensured")
    except Exception as e:
        logger.warning("Index creation issue: %s", e)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()