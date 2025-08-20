package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"
	"runtime" // Import runtime for GOOS

	"github.com/google/uuid"
	_ "modernc.org/sqlite" // SQLite driver
)

// Note struct represents a single note
type Note struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt int64 `json:"createdAt"`
	UpdatedAt int64 `json:"updatedAt"`
}

// App struct
type App struct {
	ctx context.Context
	db  *sql.DB
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// GetApplicationDataDir returns the appropriate application data directory for the current OS.
func GetApplicationDataDir(appName string) (string, error) {
	var dir string

	switch runtime.GOOS {
	case "windows":
		dir = os.Getenv("APPDATA")
		if dir == "" {
			return "", fmt.Errorf("APPDATA environment variable not set")
		}
	case "darwin": // macOS
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		dir = filepath.Join(home, "Library", "Application Support")
	case "linux":
		// XDG Base Directory Specification
		// Prefer XDG_DATA_HOME, otherwise ~/.local/share
		dir = os.Getenv("XDG_DATA_HOME")
		if dir == "" {
			home, err := os.UserHomeDir()
			if err != nil {
				return "", err
			}
			dir = filepath.Join(home, ".local", "share")
		}
	default:
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		dir = home // Fallback to home directory for other OS
	}

	return filepath.Join(dir, appName), nil
}

// startup is called when the app starts.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Get application data directory
	appDataDir, err := GetApplicationDataDir("NoteApp") // Use the new function
	if err != nil {
		log.Fatalf("Failed to get app data directory: %v", err)
	}
	// The GetApplicationDataDir already appends appName, so we don't need to append it again here.
	// dataDir := filepath.Join(appDataDir, "NoteApp")
	if err := os.MkdirAll(appDataDir, 0755); err != nil { // Use appDataDir directly
		log.Fatalf("Failed to create data directory: %v", err)
	}

	dbPath := filepath.Join(appDataDir, "notes.db") // Use appDataDir directly
	log.Printf("Opening database at: %s", dbPath)

	// Open the database
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	a.db = db

	// Create notes table if it doesn't exist
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS notes (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		content TEXT,
		created_at INTEGER DEFAULT (strftime('%s', 'now')),
		updated_at INTEGER DEFAULT (strftime('%s', 'now'))
	);
	`
	_, err = a.db.Exec(createTableSQL)
	if err != nil {
		log.Fatalf("Failed to create notes table: %v", err)
	}
	log.Println("Notes table ensured.")
}

// shutdown is called when the app is shutting down
func (a *App) shutdown(ctx context.Context) {
	if a.db != nil {
		log.Println("Closing database connection.")
		a.db.Close()
	}
}

// CreateNote creates a new note in the database
func (a *App) CreateNote(title string, content string) (Note, error) {
	id := uuid.New().String()
	now := time.Now().Unix() // Get Unix timestamp
	note := Note{
		ID:        id,
		Title:     title,
		Content:   content,
		CreatedAt: now,
		UpdatedAt: now,
	}

	insertSQL := `INSERT INTO notes (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
	_, err := a.db.Exec(insertSQL, note.ID, note.Title, note.Content, note.CreatedAt, note.UpdatedAt)
	if err != nil {
		return Note{}, fmt.Errorf("failed to create note: %w", err)
	}
	return note, nil
}

// GetNotes retrieves all notes from the database
func (a *App) GetNotes() ([]Note, error) {
	rows, err := a.db.Query("SELECT id, title, content, created_at, updated_at FROM notes ORDER BY updated_at DESC")
	if err != nil {
		return nil, fmt.Errorf("failed to get notes: %w", err)
	}
	defer rows.Close()

	var notes []Note
	for rows.Next() {
		var note Note
		var createdAtUnix, updatedAtUnix int64 // Temporary variables to scan Unix timestamps
		err := rows.Scan(&note.ID, &note.Title, &note.Content, &createdAtUnix, &updatedAtUnix)
		if err != nil {
			return nil, fmt.Errorf("failed to scan note: %w", err)
		}
		note.CreatedAt = createdAtUnix
		note.UpdatedAt = updatedAtUnix
		notes = append(notes, note)
	}
	return notes, nil
}

// GetNote retrieves a single note by ID from the database
func (a *App) GetNote(id string) (Note, error) {
	var note Note
	var createdAtUnix, updatedAtUnix int64
	row := a.db.QueryRow("SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ?", id)
	err := row.Scan(&note.ID, &note.Title, &note.Content, &createdAtUnix, &updatedAtUnix)
	if err != nil {
		if err == sql.ErrNoRows {
			return Note{}, fmt.Errorf("note with ID %s not found", id)
		}
		return Note{}, fmt.Errorf("failed to get note: %w", err)
	}
	note.CreatedAt = createdAtUnix
	note.UpdatedAt = updatedAtUnix
	return note, nil
}

// UpdateNote updates an existing note in the database
func (a *App) UpdateNote(id string, title string, content string) (Note, error) {
	now := time.Now().Unix() // Get Unix timestamp
	updateSQL := `UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?`
	res, err := a.db.Exec(updateSQL, title, content, now, id)
	if err != nil {
		return Note{}, fmt.Errorf("failed to update note: %w", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return Note{}, fmt.Errorf("failed to check rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return Note{}, fmt.Errorf("note with ID %s not found for update", id)
	}

	// Retrieve the updated note to return
	return a.GetNote(id)
}

// DeleteNote deletes a note from the database
func (a *App) DeleteNote(id string) error {
	deleteSQL := `DELETE FROM notes WHERE id = ?`
	res, err := a.db.Exec(deleteSQL, id)
	if err != nil {
		return fmt.Errorf("failed to delete note: %w", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("note with ID %s not found for deletion", id)
	}
	return nil
}
