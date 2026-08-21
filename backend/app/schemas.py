from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal

# User schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None

# Agent schemas
class AgentBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category: str
    tier: str
    price_month: Decimal = Field(default=0.00)
    price_use: Decimal = Field(default=0.00)
    input_schema: Optional[Dict[str, Any]] = None
    output_schema: Optional[Dict[str, Any]] = None
    system_prompt: Optional[str] = None

class AgentCreate(AgentBase):
    pass

class AgentResponse(AgentBase):
    created_at: datetime

    class Config:
        from_attributes = True

class AgentExecuteInput(BaseModel):
    inputs: Dict[str, Any]
    file_ids: Optional[List[int]] = []  # IDs of UserFile records to inject into this execution

class AgentExecuteResponse(BaseModel):
    agent_id: str
    status: str
    output: Dict[str, Any]
    usage: Dict[str, Any]
    session_id: Optional[int] = None

# File upload schemas
class UserFileResponse(BaseModel):
    id: int
    original_name: str
    mime_type: Optional[str]
    size_bytes: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

# Agent session history schemas
class AgentSessionResponse(BaseModel):
    id: int
    agent_id: str
    inputs: Optional[Dict[str, Any]]
    outputs: Optional[Dict[str, Any]]
    file_ids: Optional[List[int]]
    cost: float
    status: str
    executed_at: datetime

    class Config:
        from_attributes = True

# Subscription schemas
class SubscriptionBase(BaseModel):
    agent_id: str

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    agent_id: str
    status: str
    start_date: datetime
    end_date: Optional[datetime] = None
    agent: AgentResponse

    class Config:
        from_attributes = True

# Workflow schemas
class WorkflowStep(BaseModel):
    agent_id: str
    # Map previous agent output key or custom static value to next agent input key
    input_mappings: Dict[str, str]

class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    definition: List[Dict[str, Any]] # List of steps, e.g. [{"agent_id": "...", "input_mappings": {...}}]

class WorkflowCreate(WorkflowBase):
    pass

class WorkflowResponse(WorkflowBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class WorkflowRunInput(BaseModel):
    initial_inputs: Dict[str, Any]

class WorkflowRunStepResult(BaseModel):
    step_index: int
    agent_id: str
    agent_name: str
    inputs: Dict[str, Any]
    outputs: Dict[str, Any]

class WorkflowRunResponse(BaseModel):
    workflow_id: int
    status: str
    results: List[WorkflowRunStepResult]
    final_output: Dict[str, Any]

# Usage schemas
class UsageLogResponse(BaseModel):
    id: int
    agent_id: str
    tokens_or_calls: int
    cost: Decimal
    timestamp: datetime

    class Config:
        from_attributes = True


# Admin schemas
class AdminRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str
    admin_secret: str   # Must match settings.ADMIN_SECRET_KEY


class UserAdminResponse(BaseModel):
    id: int
    email: str
    role: str
    created_at: datetime
    subscription_count: int = 0
    usage_count: int = 0

    class Config:
        from_attributes = True


class PlatformStats(BaseModel):
    total_users: int
    total_agents: int
    total_subscriptions: int
    total_usage_calls: int
    total_revenue_eur: float
    users_this_month: int
    calls_this_month: int


class AgentAdminResponse(AgentBase):
    created_at: datetime
    subscription_count: int = 0
    usage_count: int = 0

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    role: str  # 'admin' or 'user'


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tier: Optional[str] = None
    price_month: Optional[Decimal] = None
    price_use: Optional[Decimal] = None
    input_schema: Optional[Dict[str, Any]] = None
    output_schema: Optional[Dict[str, Any]] = None
    system_prompt: Optional[str] = None


class AdminUsageLogResponse(BaseModel):
    id: int
    user_id: int
    user_email: Optional[str] = None
    agent_id: str
    tokens_or_calls: int
    cost: float
    timestamp: datetime

    class Config:
        from_attributes = True

