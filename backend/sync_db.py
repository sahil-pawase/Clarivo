from app.core.database import init_db, save_dataset_to_db, load_datasets_from_db, get_db_tables_info
from app.services.dataset_service import dataset_service
import json

print("Initializing PostgreSQL tables on Neon...")
initialized = init_db()
print("Init DB success:", initialized)

print("\nSyncing local datasets to PostgreSQL...")
count = 0
for ds_id, info in dataset_service.datasets.items():
    df = info.get("dataframe")
    print(f"Syncing dataset '{info.get('name')}' ({ds_id}) with {len(df) if df is not None else 0} rows...")
    saved = save_dataset_to_db(ds_id, info, df)
    if saved:
        count += 1

print(f"\nSynced {count} datasets to Neon PostgreSQL!")

print("\nDatabase tables in Neon PostgreSQL now:")
tables = get_db_tables_info()
for t in tables:
    print(f" - Table '{t['name']}': {t['row_count']} rows, {len(t['columns'])} columns")
