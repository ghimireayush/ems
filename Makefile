.PHONY: up down build logs ps clean db-shell api-shell regen-db

# Start all services
up:
	docker compose up -d

# Stop all services
down:
	docker compose down

# Build/rebuild containers
build:
	docker compose build

# View logs
logs:
	docker compose logs -f

# View logs for specific service
logs-api:
	docker compose logs -f backend

logs-web:
	docker compose logs -f frontend

logs-db:
	docker compose logs -f db

# Show running containers
ps:
	docker compose ps

# Clean everything (including volumes)
clean:
	docker compose down -v --rmi local

# Database shell
db-shell:
	docker compose exec db psql -U nepal -d nepal_elections

# API shell
api-shell:
	docker compose exec backend sh

# Regenerate database from JSON
regen-db:
	node scripts/generate-db.cjs --out=./sql
	docker compose exec db psql -U nepal -d nepal_elections -f /docker-entrypoint-initdb.d/001_schema.sql
	docker compose exec db psql -U nepal -d nepal_elections -f /docker-entrypoint-initdb.d/002_seed.sql
	docker compose exec db psql -U nepal -d nepal_elections -f /docker-entrypoint-initdb.d/003_reset_rsvp.sql

# Reset RSVP counts (run after seeding if needed)
reset-rsvp:
	docker compose exec db psql -U nepal -d nepal_elections -f /docker-entrypoint-initdb.d/003_reset_rsvp.sql

# Verify data integrity
verify-data:
	@echo "=== Parties ===" && docker compose exec db psql -U nepal -d nepal_elections -c "SELECT COUNT(*) as parties FROM parties;"
	@echo "=== Constituencies ===" && docker compose exec db psql -U nepal -d nepal_elections -c "SELECT COUNT(*) as constituencies FROM constituencies;"
	@echo "=== Events ===" && docker compose exec db psql -U nepal -d nepal_elections -c "SELECT COUNT(*) as events FROM events;"
	@echo "=== RSVPs ===" && docker compose exec db psql -U nepal -d nepal_elections -c "SELECT COUNT(*) as rsvps FROM rsvps;"
	@echo "=== Users ===" && docker compose exec db psql -U nepal -d nepal_elections -c "SELECT COUNT(*) as users FROM users;"
	@echo "=== RSVP Counts ===" && docker compose exec db psql -U nepal -d nepal_elections -c "SELECT id, title, rsvp_count FROM events ORDER BY id LIMIT 5;"

# Restart specific service
restart-api:
	docker compose restart backend

restart-web:
	docker compose restart frontend

# Full rebuild and restart
rebuild:
	docker compose down
	docker compose build --no-cache
	docker compose up -d

# Health check
health:
	@echo "=== Database ===" && docker compose exec db pg_isready -U nepal -d nepal_elections
	@echo "=== Backend ===" && curl -s http://localhost:5012/health | head -1
	@echo "=== Frontend ===" && curl -s http://localhost:3000/health | head -1
