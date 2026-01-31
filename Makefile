.PHONY: dev down reset

dev:
	docker-compose up -d database
	npm run db:push
	npm run dev

down:
	docker-compose down

reset:
	docker-compose down -v
	docker-compose up -d database
