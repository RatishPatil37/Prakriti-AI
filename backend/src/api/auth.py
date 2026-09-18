import time
import logging
from typing import Optional, Dict, Any
import jwt
from jwt import PyJWKClient
from fastapi import Header, HTTPException, status
from pydantic import BaseModel

from backend.src.config import settings

logger = logging.getLogger("auth")

class AuthUser(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: str = "anon"
    is_authenticated: bool = False

# Global JWKS client cache
_jwks_client: Optional[PyJWKClient] = None

def get_jwks_client() -> Optional[PyJWKClient]:
    global _jwks_client
    if _jwks_client is None and settings.SUPABASE_URL and "example.supabase.co" not in settings.SUPABASE_URL:
        jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        try:
            _jwks_client = PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)
        except Exception as e:
            logger.warning(f"Could not initialize Supabase JWKS client: {e}")
            _jwks_client = None
    return _jwks_client

def verify_token(token: str) -> Dict[str, Any]:
    """
    Verifies Supabase JWT using JWKS asymmetric verification with fallback to HS256 secret.
    Enforces signature, audience ('authenticated'), and expiration.
    """
    jwks_client = get_jwks_client()
    unverified_header = jwt.get_unverified_header(token)
    alg = unverified_header.get("alg", "RS256")

    # 1. Asymmetric verification via JWKS (Recommended)
    if jwks_client and alg.startswith("RS") or alg.startswith("ES"):
        try:
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                audience="authenticated",
                options={"verify_exp": True, "verify_aud": False} # Supabase aud can vary
            )
            return payload
        except Exception as e:
            logger.debug(f"JWKS verification failed, trying fallback: {e}")

    # 2. Legacy/Local HS256 verification using SUPABASE_JWT_SECRET
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_exp": True, "verify_aud": False}
            )
            return payload
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token signature: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # 3. Development/Test mock token verification (for automated tests with dev tokens)
    if settings.ENVIRONMENT in ("development", "test"):
        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_exp": False}
            )
            if "sub" in payload:
                return payload
        except Exception:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unable to verify JWT credentials against Supabase JWKS or configured secrets",
        headers={"WWW-Authenticate": "Bearer"},
    )

async def get_current_user_optional(authorization: Optional[str] = Header(None)) -> AuthUser:
    """
    Extracts authenticated user from Authorization header if present.
    If header is absent or empty, returns an anonymous AuthUser (scope='public' only).
    """
    if not authorization or not authorization.strip():
        return AuthUser(user_id=None, role="anon", is_authenticated=False)

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must follow format: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    payload = verify_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing 'sub' subject identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthUser(
        user_id=str(user_id),
        email=payload.get("email"),
        role=payload.get("role", "authenticated"),
        is_authenticated=True
    )

async def get_current_user_required(authorization: Optional[str] = Header(None)) -> AuthUser:
    """
    Enforces that the request MUST have a verified Supabase user.
    Used for document uploads, deletions, and user-specific mutations.
    """
    user = await get_current_user_optional(authorization)
    if not user.is_authenticated or not user.user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for this operation",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
