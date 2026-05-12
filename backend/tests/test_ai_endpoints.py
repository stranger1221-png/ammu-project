"""Backend tests for GENVO AI endpoints (lookup, story, tutor)."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # Fallback to reading frontend .env
    try:
        with open('/app/frontend/.env') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                    break
    except Exception:
        pass

TIMEOUT = 90  # AI calls are slow


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ===== Health =====
class TestHealth:
    def test_root(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        assert "GENVO" in r.json().get("message", "")


# ===== AI Lookup =====
class TestAiLookup:
    def test_lookup_obfuscate(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/ai/lookup",
                            json={"query": "obfuscate"}, timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True
        data = body.get("data", {})
        assert isinstance(data, dict)
        assert data.get("word", "").lower().startswith("obfuscat")
        assert "meanings" in data and isinstance(data["meanings"], dict)
        # at least formal meaning
        assert data["meanings"].get("formal", "").strip() != ""
        assert isinstance(data.get("synonyms", []), list)
        assert isinstance(data.get("antonyms", []), list)

    def test_lookup_empty_returns_400(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/ai/lookup",
                            json={"query": ""}, timeout=15)
        assert r.status_code == 400


# ===== AI Story =====
class TestAiStory:
    def test_story_fantasy_valiant(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/ai/story",
                            json={"theme": "fantasy", "word": "valiant"},
                            timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True
        story = body.get("story", "")
        assert isinstance(story, str) and len(story) > 0
        wc = body.get("word_count", 0)
        assert isinstance(wc, int) and wc > 0
        # ≤120 words rule (allow small drift)
        assert wc <= 130, f"Story exceeded 120 words: {wc}"
        vocab = body.get("vocab", [])
        assert isinstance(vocab, list)
        # Story should include or reference the seed word loosely
        assert "valiant" in story.lower() or any("valiant" in (v.get("word", "")).lower() for v in vocab)

    def test_story_missing_fields_returns_400(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/ai/story",
                            json={"theme": "", "word": ""}, timeout=15)
        assert r.status_code == 400


# ===== AI Tutor =====
class TestAiTutor:
    def test_tutor_basic(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/ai/tutor",
                            json={"message": "What is rizz?", "history": []},
                            timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True
        reply = body.get("reply", "")
        assert isinstance(reply, str) and len(reply) > 5

    def test_tutor_with_history(self, api_client):
        history = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
        ]
        r = api_client.post(f"{BASE_URL}/api/ai/tutor",
                            json={"message": "Tell me about etymology",
                                  "history": history},
                            timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True
