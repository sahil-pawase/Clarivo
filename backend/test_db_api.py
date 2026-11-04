import httpx
import asyncio
import sys

async def test():
    from main import app
    print("App imported!", flush=True)
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url='http://test') as client:
        print("Testing /api/v1/database/status ...", flush=True)
        r1 = await client.get('/api/v1/database/status')
        print('1. DB Status:', r1.status_code, r1.json(), flush=True)
        
        print("Testing /api/v1/datasets/ ...", flush=True)
        r2 = await client.get('/api/v1/datasets/')
        print('2. Datasets endpoint count:', len(r2.json()), 'datasets', flush=True)
        for ds in r2.json():
            print(f"   - {ds.get('name')} (rows: {ds.get('rows')}, columns: {ds.get('columns')})", flush=True)
        
        print("Testing /api/v1/database/query ...", flush=True)
        r3 = await client.post('/api/v1/database/query', json={'query': 'SELECT name, row_count, file_type FROM clarivo_datasets'})
        print('3. SQL Query response:', r3.status_code, r3.json(), flush=True)

if __name__ == '__main__':
    asyncio.run(test())
