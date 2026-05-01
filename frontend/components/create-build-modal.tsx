'use client';

import { useState, type ReactElement, SubmitEvent, useEffect } from "react";

interface CreateBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (buildName: string) => Promise<void>;
  isLoading?: boolean;
}

export function CreateBuildModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateBuildModalProps): ReactElement | null {
  const [buildName, setBuildName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setBuildName('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: SubmitEvent): Promise<void> => {
    e.preventDefault();
    if (!buildName.trim()) {
      setError('Build name is required');
      return;
    }
    try {
      await onSubmit(buildName);
      setBuildName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create build');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-lg font-bold mb-4">Create Build</h2>
        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="build-name" className="block text-sm font-medium mb-2">
              Build Name
            </label>
            <input
              id="build-name"
              data-testid="build-name-input"
              type="text"
              value={buildName}
              onChange={(e) => setBuildName(e.target.value)}
              placeholder="Enter build name (e.g., Platform v2.1)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isLoading}
              autoFocus
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="create-build-submit"
              disabled={isLoading || !buildName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
