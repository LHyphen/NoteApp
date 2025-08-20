.PHONY: install dev build clean tidy run

# Define the application name
APP_NAME := NoteApp

# Define the frontend directory
FRONTEND_DIR := frontend

# Define the build output directory
BUILD_DIR := build/bin

# Default target
all: build

# Install frontend dependencies
install:
	@echo "Installing frontend dependencies..."
	@cd $(FRONTEND_DIR) && npm install

# Run the application in development mode
dev:
	@echo "Starting development server..."
	@wails dev

# Build the application for production
build:
	@echo "Building application for production..."
	@wails build

# Clean build artifacts and node_modules
clean:
	@echo "Cleaning build artifacts and node_modules..."
	@rm -rf $(BUILD_DIR)
	@rm -rf $(FRONTEND_DIR)/node_modules
	@rm -rf $(FRONTEND_DIR)/dist
	@go clean -modcache

# Tidy Go modules and install frontend dependencies
tidy:
	@echo "Tidying Go modules and installing frontend dependencies..."
	@go mod tidy
	@cd $(FRONTEND_DIR) && npm install

# Run the built executable (Windows specific)
run: build
	@echo "Running the built application..."
	@$(BUILD_DIR)/$(APP_NAME).exe