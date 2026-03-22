import * as SQLite from 'expo-sqlite'

import type { PendingRecording, PendingEdit } from '@/types/recording.types'

let db: SQLite.SQLiteDatabase | null = null

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
    if (db) return db
    db = await SQLite.openDatabaseAsync('command.db')
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS pending_recordings (
            localId TEXT PRIMARY KEY,
            audioUri TEXT NOT NULL,
            title TEXT,
            transcript TEXT,
            duration INTEGER NOT NULL,
            folderId INTEGER,
            recordedAt TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            syncStatus TEXT NOT NULL DEFAULT 'pending'
        );

        CREATE TABLE IF NOT EXISTS pending_edits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recordingId INTEGER NOT NULL,
            type TEXT NOT NULL,
            changes TEXT,
            createdAt TEXT NOT NULL
        );
    `)
    return db
}

// ── Pending Recordings ───────────────────────────────────────────────────────

export async function insertPendingRecording(recording: PendingRecording): Promise<void> {
    const conn = await getDb()
    await conn.runAsync(
        `INSERT INTO pending_recordings (localId, audioUri, title, transcript, duration, folderId, recordedAt, createdAt, syncStatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        recording.localId,
        recording.audioUri,
        recording.title,
        recording.transcript,
        recording.duration,
        recording.folderId,
        recording.recordedAt,
        recording.createdAt,
        recording.syncStatus
    )
}

export async function getPendingRecordings(): Promise<PendingRecording[]> {
    const conn = await getDb()
    return conn.getAllAsync<PendingRecording>(
        'SELECT * FROM pending_recordings ORDER BY createdAt DESC'
    )
}

export async function updatePendingRecording(
    localId: string,
    updates: Partial<Pick<PendingRecording, 'title' | 'transcript' | 'folderId' | 'syncStatus'>>
): Promise<void> {
    const conn = await getDb()
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.title !== undefined) {
        fields.push('title = ?')
        values.push(updates.title)
    }
    if (updates.transcript !== undefined) {
        fields.push('transcript = ?')
        values.push(updates.transcript)
    }
    if (updates.folderId !== undefined) {
        fields.push('folderId = ?')
        values.push(updates.folderId)
    }
    if (updates.syncStatus !== undefined) {
        fields.push('syncStatus = ?')
        values.push(updates.syncStatus)
    }

    if (fields.length === 0) return

    values.push(localId)
    await conn.runAsync(
        `UPDATE pending_recordings SET ${fields.join(', ')} WHERE localId = ?`,
        ...values
    )
}

export async function deletePendingRecording(localId: string): Promise<void> {
    const conn = await getDb()
    await conn.runAsync('DELETE FROM pending_recordings WHERE localId = ?', localId)
}

export async function getPendingRecordingByLocalId(localId: string): Promise<PendingRecording | null> {
    const conn = await getDb()
    return conn.getFirstAsync<PendingRecording>(
        'SELECT * FROM pending_recordings WHERE localId = ?',
        localId
    )
}

// ── Pending Edits ────────────────────────────────────────────────────────────

export async function insertPendingEdit(
    recordingId: number,
    type: 'update' | 'delete',
    changes?: Record<string, unknown>
): Promise<void> {
    const conn = await getDb()
    await conn.runAsync(
        `INSERT INTO pending_edits (recordingId, type, changes, createdAt) VALUES (?, ?, ?, ?)`,
        recordingId,
        type,
        changes ? JSON.stringify(changes) : null,
        new Date().toISOString()
    )
}

export async function getPendingEdits(): Promise<PendingEdit[]> {
    const conn = await getDb()
    return conn.getAllAsync<PendingEdit>(
        'SELECT * FROM pending_edits ORDER BY createdAt ASC'
    )
}

export async function deletePendingEdit(id: number): Promise<void> {
    const conn = await getDb()
    await conn.runAsync('DELETE FROM pending_edits WHERE id = ?', id)
}

export async function deletePendingEditsForRecording(recordingId: number): Promise<void> {
    const conn = await getDb()
    await conn.runAsync('DELETE FROM pending_edits WHERE recordingId = ?', recordingId)
}
