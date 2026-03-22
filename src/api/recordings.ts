import client from './client'
import type { Recording, RecordingsPage } from '@/types/recording.types'

export const recordingsApi = {
    list: async (page = 1): Promise<RecordingsPage> => {
        const { data } = await client.get('/recordings', { params: { page } })
        return data
    },

    get: async (id: number): Promise<Recording> => {
        const { data } = await client.get(`/recordings/${id}`)
        return data.data
    },

    upload: async (params: {
        uri: string
        duration: number
        recordedAt: string
        localId?: string
        transcript?: string
        folderId?: number
    }): Promise<Recording> => {
        const form = new FormData()

        form.append('audio', {
            uri: params.uri,
            name: `recording_${Date.now()}.m4a`,
            type: 'audio/m4a',
        } as unknown as Blob)
        form.append('duration', String(params.duration))
        form.append('recorded_at', params.recordedAt)
        if (params.localId) form.append('local_id', params.localId)
        if (params.transcript) form.append('transcript', params.transcript)
        if (params.folderId) form.append('folder_id', String(params.folderId))

        const { data } = await client.post('/recordings', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return data.data
    },

    update: async (id: number, params: { title?: string; folderId?: number }): Promise<Recording> => {
        const { data } = await client.patch(`/recordings/${id}`, params)
        return data.data
    },

    delete: async (id: number): Promise<void> => {
        await client.delete(`/recordings/${id}`)
    },
}
