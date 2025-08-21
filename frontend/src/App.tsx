import { useState, useEffect, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill's CSS
import './App.css';
import { CreateNote, GetNotes, GetNote, UpdateNote, DeleteNote } from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";

// Define the Note interface based on your Go struct
interface Note extends main.Note {}

// Custom useDebounce hook
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const timer = useRef<number | null>(null); // Use number for browser setTimeout ID

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(() => { // Use window.setTimeout
      callback(...args);
    }, delay);
  }, [callback, delay]);

  return debouncedCallback;
}

function App() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [editorContent, setEditorContent] = useState<string>('');
    const [noteTitle, setNoteTitle] = useState<string>('');

    // State for context menu
    const [contextMenu, setContextMenu] = useState<{ 
        visible: boolean;
        x: number;
        y: number;
        noteId: string | null;
    }>({ visible: false, x: 0, y: 0, noteId: null });

    // Ref to track if it's the initial load/selection to prevent immediate auto-save
    const isInitialLoadRef = useRef(true);

    // Load notes on startup
    useEffect(() => {
        loadNotes();
    }, []);

    // Hide context menu on click outside
    useEffect(() => {
        const handleClickOutside = () => {
            setContextMenu({ visible: false, x: 0, y: 0, noteId: null });
        };
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);


    const loadNotes = async () => {
        try {
            const result = await GetNotes();
            setNotes(result || []); // Ensure notes is always an array
        } catch (err) {
            console.error("Error loading notes:", err);
            setNotes([]); // Set to empty array on error as well
        }
    };

    const handleNewNote = () => {
        isInitialLoadRef.current = true; // Prevent auto-save on new note
        setSelectedNote(null);
        setNoteTitle('');
        setEditorContent('');
    };

    const handleSelectNote = async (note: Note) => {
        try {
            isInitialLoadRef.current = true; // Set flag BEFORE content changes
            const fetchedNote = await GetNote(note.id); // Use note.id
            setSelectedNote(fetchedNote);
            setNoteTitle(fetchedNote.title); // Use fetchedNote.title
            setEditorContent(fetchedNote.content || ''); // Ensure content is always a string
        } catch (err) {
            console.error("Error fetching note:", err);
        }
    };

    // Auto-save logic using useDebounce hook
    const autoSaveNote = useDebounce(async (noteId: string | null, title: string, content: string) => {
        if (!title.trim()) {
            console.warn("Note title is empty. Auto-save skipped.");
            return;
        }

        try {
            if (noteId) {
                // Update existing note
                await UpdateNote(noteId, title, content);
                console.log("Note auto-saved (updated):");
            } else {
                // Create new note
                const newNote = await CreateNote(title, content);
                setSelectedNote(newNote); // Select the new note
                console.log("Note auto-saved (created):");
            }
            await loadNotes(); // Refresh the notes list
        } catch (err) {
            console.error("Error during auto-save:", err);
        }
    }, 1000); // Debounce by 1 second

    useEffect(() => {
        // Prevent auto-save on initial load/selection
        if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false; // Reset the flag
            return; // And skip saving
        }

        // Only auto-save if a note is selected or being created
        if (selectedNote || noteTitle.trim() || editorContent.trim()) {
            autoSaveNote(selectedNote?.id || null, noteTitle, editorContent);
        }
    }, [noteTitle, editorContent]); // Dependencies trigger save only on content change

    const handleDeleteNote = async (noteIdToDelete: string) => { // Modified to accept noteId
        const noteToDelete = notes.find(n => n.id === noteIdToDelete);
        if (noteToDelete && window.confirm(`Are you sure you want to delete "${noteToDelete.title}"?`)) {
            try {
                await DeleteNote(noteIdToDelete); // Use noteIdToDelete
                if (selectedNote?.id === noteIdToDelete) {
                    handleNewNote(); // Clear editor if the deleted note was selected
                }
                await loadNotes(); // Refresh the notes list
            } catch (err) {
                console.error("Error deleting note:", err);
                alert("Failed to delete note.");
            }
        }
        setContextMenu({ visible: false, x: 0, y: 0, noteId: null }); // Hide context menu
    };

    const handleContextMenu = (event: React.MouseEvent, note: Note) => {
        event.preventDefault(); // Prevent default browser context menu
        setContextMenu({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            noteId: note.id,
        });
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image'
    ];

    return (
        <div id="App">
            <div className="sidebar">
                <button className="new-note-btn" onClick={handleNewNote}>+ New Note</button>
                <div className="note-list">
                    {notes.length === 0 ? (
                        <p className="no-notes-msg">No notes yet. Click "New Note" to create one!</p>
                    ) : (
                        notes.map((note) => (
                            note ? (
                                <div
                                    key={note.id}
                                    className={`note-list-item ${selectedNote?.id === note.id ? 'selected' : ''}`}
                                    onClick={() => handleSelectNote(note)}
                                    onContextMenu={(e) => handleContextMenu(e, note)} // Add context menu handler
                                >
                                    {note.title || "Untitled"}
                                </div>
                            ) : null
                        ))
                    )}
                </div>
            </div>
            <div className="main-content">
                <input
                    type="text"
                    className="note-title-input"
                    placeholder="Note Title"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                />
                <ReactQuill
                    theme="snow"
                    value={editorContent}
                    onChange={setEditorContent}
                    modules={modules}
                    formats={formats}
                    className="quill-editor"
                />
                <div className="actions">
                    {/* Delete button moved to context menu */}
                </div>
            </div>

            {contextMenu.visible && (
                <div
                    className="context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <div
                        className="context-menu-item"
                        onClick={() => contextMenu.noteId && handleDeleteNote(contextMenu.noteId)}
                    >
                        Delete
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;