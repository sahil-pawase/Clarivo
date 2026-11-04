from app.core.config import settings
import psycopg2

try:
    conn = psycopg2.connect(settings.DATABASE_URL)
    cur = conn.cursor()
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    tables = cur.fetchall()
    print("Tables found:", [t[0] for t in tables])
    for t in tables:
        tname = t[0]
        cur.execute(f'SELECT count(*) FROM "{tname}"')
        count = cur.fetchone()[0]
        cur.execute(f'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'{tname}\'')
        cols = cur.fetchall()
        print(f"Table '{tname}' has {count} rows. Columns: {[c[0] for c in cols]}")
    conn.close()
except Exception as e:
    print("Error:", e)
