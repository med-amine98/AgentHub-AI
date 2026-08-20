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
