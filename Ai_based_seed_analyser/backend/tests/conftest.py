import io
import pytest
import numpy as np
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.database import Base, get_db
from app.core.config import settings

# Test DB in memory
TEST_DATABASE_URL = "sqlite:///./test_seed_quality.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def sample_valid_seed_image():
    # Create a 400x400 clear image with simulated seed dots
    img = Image.new("RGB", (400, 400), color=(235, 235, 230))
    draw = ImageDraw.Draw(img)
    # Draw sample seeds
    for x in range(50, 350, 40):
        for y in range(50, 350, 40):
            draw.ellipse([x, y, x + 20, y + 20], fill=(180, 140, 70), outline=(100, 70, 30))
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    buf.seek(0)
    return buf.getvalue()

@pytest.fixture
def sample_blurry_image():
    # Solid black/uniform image that fails Laplacian blur or brightness check
    img = Image.new("RGB", (300, 300), color=(10, 10, 10))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf.getvalue()
