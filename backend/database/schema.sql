-- =============================================================================
-- SIH26034 - Legal Metrology Compliance Checking System
-- Initial PostgreSQL Database Schema (MVP)
-- Table: inspections
-- =============================================================================

-- Enable pgcrypto extension for UUID generation (standard in PostgreSQL & Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Table: inspections
-- Purpose: Records individual inspection tasks for packaged commodities under
--          the Legal Metrology (Packaged Commodities) Rules, 2011.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspections (
    -- Primary Key: Automatically generated UUID for each inspection event
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Key Placeholder: Associated product ID (nullable until products table is created)
    product_id UUID NULL,

    -- Foreign Key Placeholder: Inspector/Officer ID (nullable until users/inspectors table is created)
    inspector_id UUID NULL,

    -- Inspection processing lifecycle status (defaults to 'UPLOADED')
    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADED',

    -- Computed overall compliance score (0.00 to 100.00%, nullable until rules engine runs)
    compliance_score NUMERIC(5, 2) NULL,

    -- Geographical location or retail market description where the commodity was inspected
    location TEXT NULL,

    -- Date & time when the physical inspection occurred (defaults to now)
    inspection_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Record audit timestamp (defaults to current system time)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance indices for frequent dashboard and query filters
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections (status);
CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON inspections (created_at DESC);
