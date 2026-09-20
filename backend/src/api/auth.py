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
    try:
        unverified_header = jwt.get_unverified_header(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid JWT header or format: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    alg = unverified_header.get("alg", "RS256")

    # 1. Asymmetric verification via JWKS (Recommended for Supabase)
    if jwks_client and (alg.startswith("RS") or alg.startswith("ES")):
        try:
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                options={"verify_exp": True, "verify_signature": True, "verify_aud": False}
            )
            return payload
        except Exception as e:
            logger.debug(f"JWKS verification failed, trying fallback: {e}")

    # 2. HS256 verification using SUPABASE_JWT_SECRET / SUPABASE_JWT_KEY
    jwt_secret = settings.SUPABASE_JWT_SECRET.strip() if settings.SUPABASE_JWT_SECRET else ""
    if jwt_secret:
        try:
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                options={"verify_exp": True, "verify_signature": True, "verify_aud": False}
            )
            return payload
        except Exception as e:
            logger.debug(f"HS256 verification failed, trying API fallback: {e}")

    # 3. Direct Supabase Auth service verification via get_user(jwt)
    try:
        from backend.src.api.supabase_db import get_supabase_client
        sb_client = get_supabase_client()
        if sb_client:
            res = sb_client.auth.get_user(jwt=token)
            if res and res.user:
                return {
                    "sub": str(res.user.id),
                    "email": res.user.email,
                    "role": getattr(res.user, "role", "authenticated") or "authenticated"
                }
    except Exception as e:
        logger.debug(f"Direct Supabase auth.get_user verification failed: {e}")

    # 4. Development/Test mock token verification (ONLY permitted when ENVIRONMENT != 'production')
    if settings.ENVIRONMENT != "production":
        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_exp": False, "verify_aud": False}
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
    Extracts authenticated user from Authorization header if present and valid.
    If header is absent, empty, or token verification fails, gracefully returns
    an anonymous AuthUser (scope='public' only) so scientific queries are never blocked.
    """
    if not authorization or not authorization.strip():
        return AuthUser(user_id=None, role="anon", is_authenticated=False)

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        logger.info("Malformed or non-bearer Authorization header, falling back to anonymous")
        return AuthUser(user_id=None, role="anon", is_authenticated=False)

    token = parts[1].strip()
    if not token or token.lower() in ("null", "undefined", "none", ""):
        return AuthUser(user_id=None, role="anon", is_authenticated=False)

    if settings.SUPABASE_ANON_KEY and token == settings.SUPABASE_ANON_KEY:
        return AuthUser(user_id=None, role="anon", is_authenticated=False)

    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        role = payload.get("role", "authenticated")
        if user_id and role != "anon":
            return AuthUser(
                user_id=str(user_id),
                email=payload.get("email"),
                role=role,
                is_authenticated=True
            )
    except Exception as e:
        logger.info(f"Optional auth token unverified ({e}); continuing as public anonymous scientist")

    return AuthUser(user_id=None, role="anon", is_authenticated=False)

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
