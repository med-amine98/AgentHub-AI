import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Numeric, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="user") # 'user', 'admin'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="user", cascade="all, delete-orphan")
    workflows = relationship("Workflow", back_populates="user", cascade="all, delete-orphan")
    files = relationship("UserFile", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("AgentSession", back_populates="user", cascade="all, delete-orphan")

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(100), primary_key=True, index=True) # e.g. 'finance-roi-calculator'
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False) # e.g. 'finance', 'marketing', 'hr'
    tier = Column(String(50), nullable=False) # 'free', 'premium', 'enterprise'
    price_month = Column(Numeric(10, 2), default=0.00)
    price_use = Column(Numeric(10, 2), default=0.00)
    input_schema = Column(JSON, nullable=True) # Description of required inputs
    output_schema = Column(JSON, nullable=True) # Description of outputs
    system_prompt = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    subscriptions = relationship("Subscription", back_populates="agent", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="agent", cascade="all, delete-orphan")
    sessions = relationship("AgentSession", back_populates="agent", cascade="all, delete-orphan")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_id = Column(String(100), ForeignKey("agents.id"), nullable=False)
    status = Column(String(50), default="active") # 'active', 'cancelled'
    start_date = Column(DateTime, default=datetime.datetime.utcnow)
    end_date = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="subscriptions")
    agent = relationship("Agent", back_populates="subscriptions")

class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_id = Column(String(100), ForeignKey("agents.id"), nullable=False)
    tokens_or_calls = Column(Integer, default=1)
    cost = Column(Numeric(10, 4), default=0.0000)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="usage_logs")
    agent = relationship("Agent", back_populates="usage_logs")

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    definition = Column(JSON, nullable=False) # JSON list of steps (agent sequence)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="workflows")


class UserFile(Base):
    """Stores files uploaded by users to be used as agent inputs."""
    __tablename__ = "user_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=True)
    size_bytes = Column(Integer, default=0)
    file_path = Column(String(500), nullable=False)
    parsed_content = Column(Text, nullable=True)  # JSON or plain text extracted from file
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="files")


class AgentSession(Base):
    """Stores execution history per agent per user."""
    __tablename__ = "agent_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_id = Column(String(100), ForeignKey("agents.id"), nullable=False)
    inputs = Column(JSON, nullable=True)
    outputs = Column(JSON, nullable=True)
    file_ids = Column(JSON, nullable=True)   # List of UserFile IDs used
    cost = Column(Numeric(10, 4), default=0.0)
    status = Column(String(50), default="success")  # success, error
    executed_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="sessions")
    agent = relationship("Agent", back_populates="sessions")
