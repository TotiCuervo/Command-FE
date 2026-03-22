import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ─── Types ────────────────────────────────────────────────────────────────────

type SheetState = 'mini' | 'full'
type VizMode = 'minimal' | 'waveform'

interface RecordingPreferences {
    defaultSheetState: SheetState
    vizMode: VizMode
}

const STORAGE_KEY = 'recording_preferences'

const DEFAULTS: RecordingPreferences = {
    defaultSheetState: 'full',
    vizMode: 'waveform',
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRecordingPreferences() {
    const [prefs, setPrefs] = useState<RecordingPreferences>(DEFAULTS)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
            if (raw) {
                try {
                    setPrefs({ ...DEFAULTS, ...JSON.parse(raw) })
                } catch {}
            }
            setIsLoaded(true)
        })
    }, [])

    const updatePrefs = useCallback(
        async (updates: Partial<RecordingPreferences>) => {
            const next = { ...prefs, ...updates }
            setPrefs(next)
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        },
        [prefs]
    )

    return { prefs, isLoaded, updatePrefs }
}
