import pytest
from app.utils.image_validation import check_image_quality

def test_valid_image_validation(sample_valid_seed_image):
    is_valid, metrics, img_bgr = check_image_quality(sample_valid_seed_image)
    assert is_valid is True
    assert metrics.is_valid is True
    assert metrics.blur_score > 0
    assert img_bgr is not None

def test_corrupted_image_validation():
    corrupted_bytes = b'NotARealImageDataCorrupted'
    is_valid, metrics, img_bgr = check_image_quality(corrupted_bytes)
    assert is_valid is False
    assert metrics.is_valid is False
    assert img_bgr is None

def test_dark_image_rejection(sample_blurry_image):
    is_valid, metrics, img_bgr = check_image_quality(sample_blurry_image)
    assert is_valid is False
    assert metrics.issue_message is not None
