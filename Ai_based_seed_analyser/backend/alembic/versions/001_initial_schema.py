\"\"\"initial schema

Revision ID: 001_initial
Revises: 
Create Date: 2026-08-19 12:00:00.000000

\"\"\"
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. analyses table
    op.create_table(
        'analyses',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('seed_type', sa.String(length=50), nullable=False, server_default='general'),
        sa.Column('image_path', sa.String(length=500), nullable=False),
        sa.Column('annotated_image_path', sa.String(length=500), nullable=True),
        sa.Column('total_seeds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('healthy_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('damaged_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('discolored_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('broken_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('other_defect_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('quality_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('grade', sa.String(length=10), nullable=False, server_default='N/A'),
        sa.Column('model_version', sa.String(length=50), nullable=False),
        sa.Column('processing_time_ms', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('image_quality_status', sa.String(length=50), nullable=False, server_default='VALID'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index(op.f('ix_analyses_id'), 'analyses', ['id'], unique=False)
    op.create_index(op.f('ix_analyses_user_id'), 'analyses', ['user_id'], unique=False)
    op.create_index(op.f('ix_analyses_seed_type'), 'analyses', ['seed_type'], unique=False)
    op.create_index(op.f('ix_analyses_created_at'), 'analyses', ['created_at'], unique=False)

    # 3. predictions table
    op.create_table(
        'predictions',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('analysis_id', sa.Integer(), sa.ForeignKey('analyses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('class_name', sa.String(length=50), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('x', sa.Float(), nullable=False),
        sa.Column('y', sa.Float(), nullable=False),
        sa.Column('width', sa.Float(), nullable=False),
        sa.Column('height', sa.Float(), nullable=False),
    )
    op.create_index(op.f('ix_predictions_id'), 'predictions', ['id'], unique=False)
    op.create_index(op.f('ix_predictions_analysis_id'), 'predictions', ['analysis_id'], unique=False)
    op.create_index(op.f('ix_predictions_class_name'), 'predictions', ['class_name'], unique=False)

def downgrade() -> None:
    op.drop_table('predictions')
    op.drop_table('analyses')
    op.drop_table('users')
