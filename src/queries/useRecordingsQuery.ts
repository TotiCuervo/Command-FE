import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { recordingsApi } from '@/api/recordings'

export const RECORDINGS_KEY = ['recordings'] as const

export function useRecordingsQuery() {
    return useQuery({
        queryKey: RECORDINGS_KEY,
        queryFn: () => recordingsApi.list(),
    })
}

export function useUploadRecordingMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: recordingsApi.upload,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RECORDINGS_KEY })
        },
    })
}

export function useUpdateRecordingMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, ...params }: { id: number; title?: string; folderId?: number }) =>
            recordingsApi.update(id, params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RECORDINGS_KEY })
        },
    })
}

export function useDeleteRecordingMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => recordingsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RECORDINGS_KEY })
        },
    })
}
