from app.core.database import SessionLocal, DatasetModel, engine
from app.services.dataset_service import dataset_service
import json

session = SessionLocal()
try:
    for ds_id, info in dataset_service.datasets.items():
        ds = session.query(DatasetModel).filter(DatasetModel.id == ds_id).first()
        if ds:
            rows = len(info['dataframe']) if info.get('dataframe') is not None else info.get('rows', 0)
            cols = len(info['dataframe'].columns) if info.get('dataframe') is not None else info.get('columns', 0)
            if not rows and info.get('dataframe') is None:
                # Check CSV file
                import pandas as pd
                from pathlib import Path
                csv_p = Path("data") / f"{ds_id}.csv"
                if csv_p.exists():
                    df = pd.read_csv(csv_p)
                    rows = len(df)
                    cols = len(df.columns)
                    info['dataframe'] = df
                    info['rows'] = rows
                    info['columns'] = cols
            
            ds.row_count = int(rows)
            ds.column_count = int(cols)
            info['rows'] = int(rows)
            info['columns'] = int(cols)
            info['row_count'] = int(rows)
            info['column_count'] = int(cols)
            print(f"Updated {ds.name}: {rows} rows, {cols} columns")
    session.commit()
    print("Database dataset stats updated successfully!")
finally:
    session.close()
