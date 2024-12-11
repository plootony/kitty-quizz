<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { getSpotifyToken } from '../lib/spotify'

const isLoading = ref(false)
const status = ref('')
const logs = ref([])
const maxLogs = 100 // Максимальное количество сообщений в логе
const totalTracksInDb = ref(0)

const genres = ['pop', 'rock', 'hiphop']
// Константы для отслеживания прогресса
const TOTAL_TRACKS_LIMIT = 50000
const TRACKS_PER_GENRE = Math.floor(TOTAL_TRACKS_LIMIT / genres.length) // ~16,666 треков на жанр
const LIMIT = 50 // Spotify API ограничивает максимум 50 треков за запрос
const DELAY_BETWEEN_REQUESTS = 100 // ms

const progress = ref({
  current: 0,
  total: TOTAL_TRACKS_LIMIT,
  currentGenre: '',
  loadedTracks: 0,
  genreTracks: {
    pop: 0,
    rock: 0,
    hiphop: 0
  }
})

// Функция для добавления сообщения в лог
const addLog = (message) => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.unshift(`[${timestamp}] ${message}`)
  // Ограничиваем количество сообщений
  if (logs.value.length > maxLogs) {
    logs.value = logs.value.slice(0, maxLogs)
  }
}

// Функция для получения плейлистов по жанру
const getPlaylistsByGenre = async (genre, token) => {
  try {
    const genreMap = {
      'pop': ['pop', 'dance pop', 'indie pop', 'power pop', 'synth pop', 'electropop'],
      'rock': ['rock', 'alternative rock', 'indie rock', 'hard rock', 'classic rock', 'metal'],
      'hiphop': ['hip hop', 'rap', 'trap', 'drill', 'grime', 'urban']
    }
    
    const subgenres = genreMap[genre] || [genre]
    const playlists = []
    
    for (const subgenre of subgenres) {
      const response = await fetch(
        `https://api.spotify.com/v1/browse/categories/${encodeURIComponent(subgenre)}/playlists?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (!response.ok) continue
      
      const data = await response.json()
      playlists.push(...(data.playlists?.items || []))
    }
    
    return playlists
  } catch (error) {
    console.error('Ошибка при получении плейлистов:', error)
    return []
  }
}

// Функция для получения треков из плейлиста
const getTracksFromPlaylist = async (playlistId, token) => {
  const tracks = []
  let offset = 0
  const limit = 100 // Максимальный лимит для плейлистов
  
  while (true) {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) break
    
    const data = await response.json()
    if (!data.items?.length) break
    
    tracks.push(...data.items.map(item => item.track).filter(track => track && track.id))
    
    if (data.items.length < limit) break
    offset += limit
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS))
  }
  
  return tracks
}

// Функция для получения общего количества треков в базе
const fetchTotalTracks = async () => {
  try {
    const { count, error } = await supabase
      .from('tracks')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    totalTracksInDb.value = count || 0
  } catch (error) {
    console.error('Ошибка при получении количе��тва треков:', error)
    totalTracksInDb.value = 0
  }
}

// Вызываем при монтировании компонента и после операций с базой
onMounted(fetchTotalTracks)

const clearDatabase = async () => {
  try {
    isLoading.value = true
    status.value = 'Очистка базы данных...'
    
    const { error } = await supabase
      .from('tracks')
      .delete()
      .neq('id', 0) // Удаляем все записи
    
    if (error) throw error
    
    await fetchTotalTracks()
    status.value = 'База данных очищена успешно'
  } catch (error) {
    status.value = `Ошибка при очистке: ${error.message}`
    console.error('Ошибка при очистке БД:', error)
  } finally {
    isLoading.value = false
  }
}

const parseTracks = async () => {
  try {
    isLoading.value = true
    status.value = 'Начинаем парсинг треков...'
    logs.value = []
    
    const token = await getSpotifyToken()
    if (!token) throw new Error('Не удалось получить токен Spotify')
    
    // Получаем все треки из базы
    const { data: tracks, error } = await supabase
      .from('tracks')
      .select('spotify_id')
    
    if (error) throw error
    
    // Создаем плейлист в Spotify
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const userData = await response.json()
    
    // Создаем плейлист
    const playlistResponse = await fetch(
      `https://api.spotify.com/v1/users/${userData.id}/playlists`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'KittyQuiz Tracks',
          description: 'Tracks for KittyQuiz game',
          public: false
        })
      }
    )
    
    const playlistData = await playlistResponse.json()
    
    // Добавляем треки в плейлист порциями по 100 штук
    const batchSize = 100
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize)
      const uris = batch.map(track => `spotify:track:${track.spotify_id}`)
      
      await fetch(
        `https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: uris
          })
        }
      )
      
      addLog(`Добавлено ${batch.length} треков в плейлист (${i + batch.length}/${tracks.length})`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS))
    }
    
    addLog('🎉 Плейлист создан успешно')
    status.value = 'Плейлист создан успешно'
    
  } catch (error) {
    addLog(`❌ Ошибка: ${error.message}`)
    status.value = `Ошибка: ${error.message}`
    console.error('Ошибка:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="database-manager">
    <h2>Управление базой данных</h2>
    
    <div class="total-tracks-info">
      Всего треков в базе: {{ totalTracksInDb }}
    </div>
    
    <div class="controls">
      <button 
        @click="clearDatabase" 
        :disabled="isLoading"
        class="control-btn clear-btn"
      >
        Очистить базу данных
      </button>
      
      <button 
        @click="parseTracks" 
        :disabled="isLoading"
        class="control-btn parse-btn"
      >
        Запустить парсер
      </button>
    </div>
    
    <div v-if="status" :class="['status', { 'loading': isLoading }]">
      {{ status }}
    </div>
    
    <div v-if="logs.length" class="logs">
      <div v-for="(log, index) in logs" 
           :key="index" 
           class="log-entry"
      >
        {{ log }}
      </div>
    </div>
    
    <!-- Прогресс бар -->
    <div v-if="isLoading" class="progress-container">
      <div class="progress-info">
        <span class="genre-name">{{ progress.currentGenre.toUpperCase() }}</span>
        <span class="total-tracks">{{ progress.loadedTracks }} из {{ TOTAL_TRACKS_LIMIT }} треков</span>
      </div>
      
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :style="{ width: `${(progress.current / progress.total) * 100}%` }"
        ></div>
      </div>
      
      <!-- Статистика по жанрам -->
      <div class="genre-stats">
        <div v-for="(count, genre) in progress.genreTracks" 
             :key="genre" 
             class="genre-stat"
        >
          <span class="genre-label">{{ genre }}:</span>
          <span class="genre-count">{{ count }}/{{ TRACKS_PER_GENRE }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.database-manager {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
  border: 1px solid rgba(255, 105, 180, 0.2);
}

h2 {
  color: #ff69b4;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.5em;
}

.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.control-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-btn {
  background-color: #d32f2f;
  color: white;
}

.clear-btn:hover:not(:disabled) {
  background-color: #b71c1c;
}

.parse-btn {
  background-color: #ff69b4;
  color: white;
}

.parse-btn:hover:not(:disabled) {
  background-color: #ff1493;
}

.status {
  padding: 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  margin-top: 15px;
}

.status.loading {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}

.logs {
  margin-top: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 10px;
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
}

.log-entry {
  padding: 4px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9em;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-entry:last-child {
  border-bottom: none;
}

/* Стилизация скроллбара */
.logs::-webkit-scrollbar {
  width: 8px;
}

.logs::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.logs::-webkit-scrollbar-thumb {
  background: rgba(255, 105, 180, 0.5);
  border-radius: 4px;
}

.logs::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 105, 180, 0.7);
}

.progress-container {
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.genre-name {
  color: #ff69b4;
  font-weight: bold;
}

.total-tracks {
  color: #ff69b4;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 15px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff69b4, #ff1493);
  transition: width 0.3s ease;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(255, 105, 180, 0.5);
}

.genre-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.genre-stat {
  text-align: center;
}

.genre-label {
  color: #ff69b4;
  margin-right: 5px;
  font-weight: 500;
}

.genre-count {
  color: white;
}

.total-tracks-info {
  background: rgba(255, 105, 180, 0.1);
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
  text-align: center;
  font-weight: 500;
  color: #ff69b4;
  border: 1px solid rgba(255, 105, 180, 0.2);
}
</style> 