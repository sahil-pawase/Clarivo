# -*- mode: python ; coding: utf-8 -*-
# Clarivo Professional Build Specification

import sys
import os
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# Collect all data files and submodules
datas = []
datas += collect_data_files('fastapi')
datas += collect_data_files('uvicorn')
datas += collect_data_files('pydantic')
datas += [('app', 'app')]
datas += [('.env', '.')]

# Hidden imports for all dependencies
hiddenimports = []
hiddenimports += collect_submodules('fastapi')
hiddenimports += collect_submodules('uvicorn')
hiddenimports += collect_submodules('pydantic')
hiddenimports += collect_submodules('sqlalchemy')
hiddenimports += collect_submodules('pandas')
hiddenimports += collect_submodules('numpy')

# Additional hidden imports
hiddenimports += [
    'uvicorn.lifespan.on',
    'uvicorn.lifespan.off',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.protocols.websockets.websockets_impl',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.http.h11_impl',
    'uvicorn.protocols.http.httptools_impl',
    'uvicorn.loops.auto',
    'uvicorn.loops.asyncio',
    'fastapi.routing',
    'fastapi.middleware',
    'fastapi.middleware.cors',
    'starlette.middleware',
    'starlette.middleware.cors',
    'multipart',
    'email.mime.multipart',
    'email.mime.text',
    'email.mime.base',
]

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='clarivo-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='../frontend/public/favicon.ico'
)
