import io
import pytest

def test_full_analysis_workflow(client, sample_valid_seed_image):
    # 1. Analyze Seed Sample
    files = {"image": ("test_wheat.jpg", sample_valid_seed_image, "image/jpeg")}
    data = {"seed_type": "wheat", "notes": "Batch A-101"}

    response = client.post("/api/analysis/analyze", files=files, data=data)
    assert response.status_code == 201
    res = response.json()
    assert res["success"] is True
    analysis = res["data"]
    
    assert analysis["total_seeds"] > 0
    assert analysis["quality_score"] >= 0.0
    assert analysis["grade"] in ["A+", "A", "B", "C", "D"]
    assert "annotated_image_url" in analysis
    assert len(analysis["predictions"]) == analysis["total_seeds"]
    analysis_id = analysis["analysis_id"]

    # 2. Get Analysis by ID
    get_res = client.get(f"/api/analysis/{analysis_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["analysis_id"] == analysis_id

    # 3. Get History
    hist_res = client.get("/api/analysis/history")
    assert hist_res.status_code == 200
    assert len(hist_res.json()["data"]) >= 1

    # 4. Get Dashboard Statistics
    dash_res = client.get("/api/analysis/dashboard")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()["data"]
    assert dash_data["total_analyses"] >= 1
    assert dash_data["total_seeds_analyzed"] >= analysis["total_seeds"]

    # 5. Delete Analysis
    del_res = client.delete(f"/api/analysis/{analysis_id}")
    assert del_res.status_code == 200

    # 6. Verify Deleted
    get_del_res = client.get(f"/api/analysis/{analysis_id}")
    assert get_del_res.status_code == 404
