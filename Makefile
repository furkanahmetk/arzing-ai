.PHONY: install build dev start test clean

# Install dependencies for both frontend and backend
install:
	cd backend && npm install
	cd frontend && npm install --legacy-peer-deps

# Run both frontend and backend in development mode
dev:
	npx concurrently "cd backend && npm run dev" "cd frontend && npm run dev"

# Build both applications
build:
	cd backend && npm run build
	cd frontend && npm run build

# Start both applications (production)
start:
	npx concurrently "cd backend && npm start" "cd frontend && npm start"

# Clean node_modules
clean:
	rm -rf backend/node_modules frontend/node_modules
