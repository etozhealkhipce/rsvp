.PHONY: dev down

dev:
	docker-compose up -d database
	npm run db:push
	npm run dev

down:
	docker-compose down
