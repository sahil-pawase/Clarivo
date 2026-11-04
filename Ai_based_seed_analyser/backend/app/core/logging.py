import logging
import sys

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] [%(name)s:%(lineno)d] - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    # Suppress verbose multipart/passlib logs
    logging.getLogger("multipart").setLevel(logging.WARNING)
    logging.getLogger("passlib").setLevel(logging.WARNING)
    
logger = logging.getLogger("seed_quality_assessment")
