# NoteApp - Desktop Note-Taking Application

## About

NoteApp is a simple yet powerful desktop note-taking application built with Wails, Go, React, and Quill. It allows users to create, edit, and manage rich-text notes with automatic saving and a clean user interface.

## Features

*   **Note Creation & Management**: Easily create, load, and manage your notes.
*   **Rich Text Editing**: Utilize the integrated Quill editor for text formatting, image insertion, and more.
*   **Automatic Saving**: All changes are automatically saved as you type, eliminating the need for a manual save button.
*   **Context Menu Delete**: Delete notes conveniently via a right-click context menu on the note list.
*   **Persistent Storage**: Notes are saved locally using SQLite, ensuring your data is safe across sessions.

## Technologies Used

*   **Backend**:
    *   **Go**: Primary language for backend logic.
    *   **Wails**: Framework for building cross-platform desktop applications with Go and web technologies.
    *   **modernc.org/sqlite**: SQLite driver for local data persistence.
*   **Frontend**:
    *   **TypeScript**: Typed superset of JavaScript for robust frontend development.
    *   **React**: JavaScript library for building user interfaces.
    *   **React-Quill**: React component for the Quill rich text editor.
    *   **Vite**: Fast frontend build tool.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Go**: [Download and Install Go](https://golang.org/doc/install)
*   **Node.js & npm**: [Download and Install Node.js](https://nodejs.org/en/download/) (npm is included)
*   **Wails CLI**: Install the Wails CLI by running:
    ```bash
    go install github.com/wailsapp/wails/v2/cmd/wails@latest
    ```
*   **WebView2 Runtime (Windows)**: Ensure you have the [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) installed.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd NoteApp
    ```
    *(Note: If you downloaded the project as a zip, extract it and navigate into the `NoteApp` directory.)*

2.  **Install dependencies**:
    Use the provided `Makefile` to install both Go and Node.js dependencies:
    ```bash
    make tidy
    ```
    This command will run `go mod tidy` for backend dependencies and `npm install` for frontend dependencies.

### Running in Development Mode

To run the application in development mode with hot-reloading for frontend changes:

```bash
make dev
```
This will open the desktop application window. Frontend changes will be reflected instantly. You can also access the frontend dev server in your browser at `http://localhost:5173/` and the Wails dev server at `http://localhost:34115` (check your terminal output for exact URLs).

### Building for Production

To build a redistributable, production-ready executable:

```bash
make build
```
The executable will be generated in the `build/bin` directory (e.g., `build/bin/NoteApp.exe` on Windows).

### Running the Built Application

After building, you can run the executable directly:

```bash
make run
```
*(This command is Windows-specific and assumes the executable is `NoteApp.exe` in `build/bin`)*

### Cleaning Project

To remove build artifacts and `node_modules`:

```bash
make clean
```

## Usage

1.  **Create a New Note**: Click the "+ New Note" button in the sidebar.
2.  **Edit Note**: Type your title in the input field and use the rich text editor for content. All changes are automatically saved.
3.  **Select Note**: Click on a note in the sidebar to load it into the editor.
4.  **Delete Note**: Right-click on a note in the sidebar and select "Delete" from the context menu. Confirm the deletion when prompted.

---
