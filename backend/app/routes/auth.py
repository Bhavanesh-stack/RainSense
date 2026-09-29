"""Authentication routes — register and login."""

from fastapi import APIRouter, HTTPException, status
from app.models.schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from app.utils.auth import hash_password, verify_password, create_access_token
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserRegister):
    """Register a new user."""
    db = get_db()

    # Validate passwords match
    if user.password != user.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    if db is not None:
        # Check if email already exists
        existing = await db.users.find_one({"email": user.email.lower()})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        # Create user document
        user_doc = {
            "name": user.name,
            "email": user.email.lower(),
            "password_hash": hash_password(user.password),
        }
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
    else:
        # No DB — use a temporary in-memory ID for demo purposes
        import hashlib
        user_id = hashlib.md5(user.email.encode()).hexdigest()

    token = create_access_token({
        "user_id": user_id,
        "email": user.email.lower(),
        "name": user.name,
    })

    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, name=user.name, email=user.email.lower()),
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Log in an existing user."""
    db = get_db()

    if db is not None:
        user = await db.users.find_one({"email": credentials.email.lower()})
        if not user or not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        user_id = str(user["_id"])
        name = user["name"]
    else:
        # Demo mode — accept any credentials
        import hashlib
        user_id = hashlib.md5(credentials.email.encode()).hexdigest()
        name = credentials.email.split("@")[0].title()

    token = create_access_token({
        "user_id": user_id,
        "email": credentials.email.lower(),
        "name": name,
    })

    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, name=name, email=credentials.email.lower()),
    )
