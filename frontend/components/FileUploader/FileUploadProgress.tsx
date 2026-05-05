/**
 * FileUploadProgress Component
 * Displays file upload progress with percentage and formatted details.
 */

import React, { useMemo } from 'react';
import type { ProgressEvent } from './types';
import { calculateUploadSpeed, estimateRemainingTime, formatTime } from './utils';

interface FileUploadProgressProps {
  /** Progress event data */
  progress: ProgressEvent;
  /** Optional start time for speed/ETA calculations */
  startTime?: number;
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * FileUploadProgress component
 * Shows progress bar with percentage, speed, and estimated time remaining
 */
export const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  progress,
  startTime,
  testId = 'file-upload-progress',
}) => {
  const metrics = useMemo(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Date.now() is needed to calculate elapsed time
    const elapsedMs = startTime ? Date.now() - startTime : 0;
    const uploadSpeedMbps = calculateUploadSpeed(progress.loaded, elapsedMs);
    const remainingSeconds = estimateRemainingTime(progress.total, progress.loaded, uploadSpeedMbps);
    const etaString = formatTime(remainingSeconds);
    return { uploadSpeedMbps, etaString };
  }, [progress, startTime]);

  return (
    <div data-testid={testId} className="w-full space-y-2">
      {/* Progress bar container */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress.percentage, 100)}%` }}
          role="progressbar"
          aria-valuenow={progress.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Progress details */}
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center space-x-4">
          {/* Percentage */}
          <span className="font-semibold text-gray-700">{progress.percentage}%</span>

          {/* Speed if available */}
          {metrics.uploadSpeedMbps > 0 && (
            <span className="text-gray-600">
              {metrics.uploadSpeedMbps.toFixed(2)} Mbps
            </span>
          )}

          {/* ETA if available */}
          {metrics.etaString && (
            <span className="text-gray-600">
              ETA: {metrics.etaString}
            </span>
          )}
        </div>

        {/* Bytes info */}
        <span className="text-gray-500">
          {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
        </span>
      </div>
    </div>
  );
};

/**
 * Helper function to format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default FileUploadProgress;
