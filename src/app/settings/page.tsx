"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  getSavedPrompts,
  savePrompt,
  deletePrompt,
  getCurrentPromptId,
  setCurrentPromptId,
  getPromptById,
  SavedPrompt,
} from '@/lib/settings';

export default function SettingsPage() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedCurrentId, setSavedCurrentId] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const [viewModalId, setViewModalId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    // Load prompts and current selection
    const list = getSavedPrompts();
    setPrompts(list);
    const currentId = getCurrentPromptId();
    setSelectedId(currentId);
    setSavedCurrentId(currentId);
  }, []);

  const selectedPrompt = useMemo(() => getPromptById(selectedId), [selectedId]);

  const hasUnsaved = selectedId !== savedCurrentId;

  const handleSaveSettings = () => {
    if (!selectedId) return;
    setCurrentPromptId(selectedId);
    setSavedCurrentId(selectedId);
  };

  const openAddModal = () => {
    setNewTitle('');
    setNewContent('');
    setShowAddModal(true);
  };

  const saveNewPrompt = () => {
    const title = newTitle.trim() || 'Untitled';
    const content = newContent;
    const created = savePrompt({ title, content });
    setPrompts(getSavedPrompts());
    setShowAddModal(false);
    // Optionally select new prompt in UI, but not auto-saving settings
  };

  const openViewModal = (id: string) => {
    setViewModalId(id);
    const p = getPromptById(id);
    setEditTitle(p.title);
    setEditContent(p.content);
    setIsEditing(false);
  };

  const closeViewModal = () => {
    setViewModalId(null);
    setIsEditing(false);
  };

  const saveEditedPrompt = () => {
    if (!viewModalId) return;
    const p = getPromptById(viewModalId);
    savePrompt({ id: p.id, title: editTitle.trim() || 'Untitled', content: editContent });
    setPrompts(getSavedPrompts());
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    deletePrompt(id);
    setPrompts(getSavedPrompts());
    // If deleted selected in UI, reset selection to default
    if (selectedId === id) setSelectedId('default');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
        </header>

        {/* Saved Prompts - section title with Add */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Saved Prompts</h2>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              Add prompt
            </button>
          </div>

          {/* Saved Prompts - list */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {prompts.map((p) => (
              <div key={p.id} className="py-3 flex items-center gap-3">
                <input
                  type="radio"
                  name="currentPrompt"
                  className="h-4 w-4"
                  checked={selectedId === p.id}
                  onChange={() => setSelectedId(p.id)}
                />
                <div className="flex-1">
                  <div className="font-medium">{p.title}</div>
                  {p.id === 'default' && (
                    <div className="text-xs text-gray-500">Default prompt (cannot delete)</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openViewModal(p.id)}
                    className="px-3 py-1 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={p.id === 'default'}
                    className={`px-3 py-1 border rounded-md ${
                      p.id === 'default'
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:bg-red-50 dark:hover:bg-red-900/20 border-red-400 text-red-600 dark:text-red-400'
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Button area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Selected prompt: <span className="font-medium">{selectedPrompt.title}</span>
              </div>
              {hasUnsaved && (
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  You have unsaved changes
                </div>
              )}
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={!hasUnsaved}
              className={`px-4 py-2 rounded-md font-medium ${
                hasUnsaved
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* Add Prompt Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Add Prompt</h3>
            <button onClick={() => setShowAddModal(false)} aria-label="Close" className="p-1">
              <CloseIcon />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prompt title</label>
              <input
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Apparel influencer prompt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prompt content</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-40"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write your prompt..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={saveNewPrompt}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View/Edit Prompt Modal */}
      {viewModalId && (
        <Modal onClose={closeViewModal}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Prompt</h3>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} aria-label="Edit" className="p-1">
                  <EditIcon />
                </button>
              )}
              <button onClick={closeViewModal} aria-label="Close" className="p-1">
                <CloseIcon />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prompt title</label>
              <input
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${!isEditing ? 'opacity-70' : ''}`}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prompt content</label>
              <textarea
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-60 ${!isEditing ? 'opacity-70' : ''}`}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEditedPrompt}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    Save
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        {children}
      </div>
    </div>
  );
}

function EditIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
