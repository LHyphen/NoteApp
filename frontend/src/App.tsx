import { useState, useEffect, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './App.css';
import { CreateNote, GetNotes, GetNote, UpdateNote, DeleteNote } from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";
import ConfirmModal from './components/ConfirmModal';

// Define the Note interface based on your Go struct
interface Note extends main.Note {}

// Custom useDebounce hook
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const timer = useRef<number | null>(null);

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
    timer.current = window.setTimeout(() => {
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

    const [contextMenu, setContextMenu] = useState<{ 
        visible: boolean;
        x: number;
        y: number;
        noteId: string | null;
    }>({ visible: false, x: 0, y: 0, noteId: null });

    const [modalState, setModalState] = useState<{ 
        isOpen: boolean;
        noteId: string | null;
        noteTitle: string;
    }>({ isOpen: false, noteId: null, noteTitle: '' });

    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        loadNotes();
    }, []);

    useEffect(() => {
        const handleClickOutside = () => {
            if (contextMenu.visible) {
                setContextMenu({ visible: false, x: 0, y: 0, noteId: null });
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [contextMenu.visible]);

    const loadNotes = async () => {
        try {
            const result = await GetNotes();
            setNotes(result || []);
        } catch (err) {
            console.error("Error loading notes:", err);
            setNotes([]);
        }
    };

    const handleNewNote = () => {
        isInitialLoadRef.current = true;
        setSelectedNote(null);
        setNoteTitle('');
        setEditorContent('');
    };

    const handleSelectNote = async (note: Note) => {
        try {
            isInitialLoadRef.current = true;
            const fetchedNote = await GetNote(note.id);
            setSelectedNote(fetchedNote);
            setNoteTitle(fetchedNote.title);
            setEditorContent(fetchedNote.content || '');
        } catch (err) {
            console.error("Error fetching note:", err);
        }
    };

    const autoSaveNote = useDebounce(async (noteId: string | null, title: string, content: string) => {
        if (!title.trim()) {
            console.warn("Note title is empty. Auto-save skipped.");
            return;
        }
        try {
            if (noteId) {
                await UpdateNote(noteId, title, content);
            } else {
                const newNote = await CreateNote(title, content);
                setSelectedNote(newNote);
            }
            await loadNotes();
        } catch (err) {
            console.error("Error during auto-save:", err);
        }
    }, 1000);

    useEffect(() => {
        if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            return;
        }
        if (selectedNote || noteTitle.trim() || editorContent.trim()) {
            autoSaveNote(selectedNote?.id || null, noteTitle, editorContent);
        }
    }, [noteTitle, editorContent]);

    const triggerDeleteConfirmation = (noteId: string) => {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            setModalState({ isOpen: true, noteId: note.id, noteTitle: note.title });
        }
        setContextMenu({ visible: false, x: 0, y: 0, noteId: null });
    };

    const executeDelete = async () => {
        if (!modalState.noteId) return;
        try {
            await DeleteNote(modalState.noteId);
            if (selectedNote?.id === modalState.noteId) {
                handleNewNote();
            }
            await loadNotes();
        } catch (err) {
            console.error("Error deleting note:", err);
            alert("Failed to delete note.");
        } finally {
            setModalState({ isOpen: false, noteId: null, noteTitle: '' });
        }
    };

    const handleContextMenu = (event: React.MouseEvent, note: Note) => {
        event.preventDefault();
        setContextMenu({ visible: true, x: event.clientX, y: event.clientY, noteId: note.id });
    };

    const modules = { toolbar: [[{ 'header': [1, 2, false] }], ['bold', 'italic', 'underline', 'strike', 'blockquote'], [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }], ['link', 'image'], ['clean']] };
    const formats = ['header', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'list', 'bullet', 'indent', 'link', 'image'];

    return (
        <div id="App">
            <div className="sidebar">
                <button className="new-note-btn" onClick={handleNewNote}>+ New Note</button>
                <div className="note-list">
                    {notes.map((note) => (
                        note && (
                            <div
                                key={note.id}
                                className={`note-list-item ${selectedNote?.id === note.id ? 'selected' : ''}`}
                                onClick={() => handleSelectNote(note)}
                                onContextMenu={(e) => handleContextMenu(e, note)}
                            >
                                {note.title || "Untitled"}
                            </div>
                        )
                    ))}
                </div>
            </div>
            <div className="main-content">
                <input type="text" className="note-title-input" placeholder="Note Title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
                <ReactQuill theme="snow" value={editorContent} onChange={setEditorContent} modules={modules} formats={formats} className="quill-editor" />
            </div>

            {contextMenu.visible && (
                <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
                    <div className="context-menu-item" onClick={() => contextMenu.noteId && triggerDeleteConfirmation(contextMenu.noteId)}>
                        Delete
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, noteId: null, noteTitle: '' })}
                onConfirm={executeDelete}
                title="删除笔记"
            >
                <p>你确定要删除笔记 "{modalState.noteTitle}" 吗？</p>
            </ConfirmModal>
        </div>
    );
}

export default App;
