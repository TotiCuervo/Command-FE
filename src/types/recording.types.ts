export type RecordingStatus =
    | 'uploading'
    | 'uploaded'
    | 'transcribing'
    | 'transcribed'
    | 'processing'
    | 'processed'
    | 'embedding'
    | 'ready'
    | 'failed'

export type SyncStatus = 'pending' | 'uploading' | 'synced'

export interface Recording {
    id: number
    localId: string | null
    folderId: number | null
    title: string | null
    transcript: string | null
    audioFormat: string
    fileSize: number
    duration: number | null
    waveformData: number[] | null
    status: RecordingStatus
    syncStatus: SyncStatus
    failedReason?: string
    recordedAt: string
    createdAt: string
    audioUrl?: string
}

export interface PendingRecording {
    localId: string
    audioUri: string
    title: string | null
    transcript: string | null
    duration: number
    folderId: number | null
    recordedAt: string
    createdAt: string
    syncStatus: 'pending' | 'uploading'
}

export interface PendingEdit {
    id: number
    recordingId: number
    type: 'update' | 'delete'
    changes: string | null
    createdAt: string
}

export interface RecordingsPage {
    data: Recording[]
    meta: {
        currentPage: number
        lastPage: number
        total: number
    }
}
