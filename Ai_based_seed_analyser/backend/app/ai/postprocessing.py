from typing import List, Dict
from app.schemas.analysis import SeedPredictionDetail

def aggregate_seed_statistics(predictions: List[SeedPredictionDetail]) -> Dict[str, int]:
    stats = {
        "total": len(predictions),
        "healthy": 0,
        "damaged": 0,
        "discolored": 0,
        "broken": 0,
        "other": 0
    }

    for p in predictions:
        c_name = p.class_name.lower().strip()
        if "healthy" in c_name:
            stats["healthy"] += 1
        elif "damage" in c_name:
            stats["damaged"] += 1
        elif "discolor" in c_name:
            stats["discolored"] += 1
        elif "broken" in c_name:
            stats["broken"] += 1
        else:
            stats["other"] += 1

    return stats
