---
inclusion: always
---

# Data Source Policy

## Single Source of Truth: SQL Database

**CRITICAL RULE**: The SQL database is the ONLY source of truth for all application data.

### Strict Guidelines

1. **NO Hardcoded Data**: Never hardcode data in frontend components, configuration files, or any part of the application code.

2. **All Data Must Come From Database**: 
   - Election data
   - Candidate information
   - District/constituency data
   - Results and statistics
   - Any dynamic content

3. **Data Flow**:
   - SQL → Backend API → Frontend
   - Never: Hardcoded → Frontend

4. **When Adding New Data**:
   - Create or update SQL migration files in `/sql/` directory
   - Update backend API endpoints if needed
   - Frontend fetches from API only

5. **Violations Are Considered Bugs**:
   - Hardcoding data in frontend is a critical violation
   - Must be refactored to use database + API

### Enforcement

When reviewing or writing code:
- ✅ Data fetched from API endpoints
- ✅ Backend queries database
- ❌ Hardcoded arrays/objects with business data
- ❌ Static data files (JSON, JS objects) for dynamic content

**Exception**: Only UI constants (colors, layout configs, static labels) can be hardcoded. Business data MUST come from SQL.
