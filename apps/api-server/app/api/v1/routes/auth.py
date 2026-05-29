import json

from fastapi import APIRouter, Request, Response, status, HTTPException, Depends
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import UserLogin, UserOut, UserUpdate, UserRegisterRequest, VolunteerProfileOut, ExpertProfileOut
from app.services import auth as auth_service
from app.services.user_service import get_user_by_username, update_user, delete_user
from app.dependencies.deps import get_current_user, require_roles

router = APIRouter()


@router.get("/me", response_model=UserOut, summary="获取当前用户信息", description="返回当前登录用户的信息，敏感字段按角色脱敏")
@require_roles(["user", "family", "volunteer", "expert", "admin"])
async def read_users_me(current_user=Depends(get_current_user)):
    if hasattr(current_user, 'dict'):
        user_dict = current_user.dict()
    elif hasattr(current_user, '__dict__'):
        user_dict = vars(current_user)
    else:
        user_dict = {}
    if "admin" not in current_user.roles and "expert" not in current_user.roles:
        user_dict.pop("phone", None)
    return user_dict


@router.put("/me", response_model=UserOut, summary="更新当前用户信息", description="仅允许本人或管理员修改")
@require_roles(["user", "family", "admin"])
async def update_me(payload: UserUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    data = payload.dict(exclude_unset=True)
    if "password" in data:
        data.pop("password")
    user = update_user(db, current_user, data)
    return user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT, summary="注销当前用户", description="仅允许本人或管理员注销")
@require_roles(["user", "family", "admin"])
async def delete_me(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    delete_user(db, current_user)
    return None


@router.post("/login", response_model=UserOut, summary="用户登录", description="登录成功后写 session 表，Web 端 set_cookie，App 端返回 session_id")
async def login(user_in: UserLogin, response: Response, request: Request, db: Session = Depends(get_db)):
    user, session_id = await auth_service.login(db, user_in, request)
    user_agent = request.headers.get("user-agent", "")
    if "web" in user_agent.lower():
        response.set_cookie(key="session_id", value=session_id, httponly=True)
        return user
    else:
        return {"user": user, "session_id": session_id}


@router.post("/logout", summary="用户登出", description="清理 session 表记录，清除 Cookie/Header")
async def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    await auth_service.logout(db, request)
    user_agent = request.headers.get("user-agent", "")
    if "web" in user_agent.lower():
        response.delete_cookie(key="session_id")
    return {"msg": "logout success"}


@router.post("/register", response_model=UserOut, summary="用户注册", description="支持多角色注册，自动创建 profile，事务一致性")
async def register(user_in: UserRegisterRequest, db: Session = Depends(get_db)):
    if any(role in ["admin", "maintainer"] for role in user_in.roles):
        raise HTTPException(status_code=403, detail="管理员/维护人员仅允许后台创建")
    try:
        user = auth_service.register(db, user_in)
    except (IntegrityError, ValueError) as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"注册失败: {e}")

    from app.schemas.user import UserOut, VolunteerProfileOut, ExpertProfileOut
    user_dict = {**user.__dict__}
    roles = user_dict.get("roles")
    if isinstance(roles, str):
        try:
            user_dict["roles"] = json.loads(roles)
        except json.JSONDecodeError:
            user_dict["roles"] = []

    volunteer_profile = getattr(user, 'volunteer_profile', None)
    expert_profile = getattr(user, 'expert_profile', None)

    if volunteer_profile:
        vp_dict = dict(volunteer_profile.__dict__)
        if isinstance(vp_dict.get("skills"), str):
            try:
                vp_dict["skills"] = json.loads(vp_dict["skills"])
            except json.JSONDecodeError:
                vp_dict["skills"] = []
        user_dict["volunteer_profile"] = VolunteerProfileOut(**vp_dict)
    if expert_profile:
        ep_dict = dict(expert_profile.__dict__)
        if isinstance(ep_dict.get("skills"), str):
            try:
                ep_dict["skills"] = json.loads(ep_dict["skills"])
            except json.JSONDecodeError:
                ep_dict["skills"] = []
        user_dict["expert_profile"] = ExpertProfileOut(**ep_dict)
    user_out = UserOut(**user_dict)
    return user_out
