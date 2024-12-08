<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getSpotifyToken } from '../lib/spotify'

const props = defineProps({
  tracks: {
    type: Array,
    required: true
  },
  filters: {
    type: Object,
    default: () => ({
      genre: '',
      decade: '',
      difficulty: ''
    })
  }
})

const player = ref(null)
const currentTrack = ref(null)
const showAnswer = ref(false)
const timer = ref(null)
const timeLeft = ref(15)
const deviceId = ref(null)
const playerReady = ref(false)
const usedArtists = ref(new Set())

// Получаем треки с уникальными артистами
const availableTracks = computed(() => {
  const uniqueArtistTracks = props.tracks.filter(track => !usedArtists.value.has(track.artist))
  console.log('Доступные треки:', {
    unique: uniqueArtistTracks.length
  })
  return uniqueArtistTracks
})

// Получаем 20 случайных треков с уникальными артистами
const randomTracks = computed(() => {
  const shuffled = [...availableTracks.value].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 20)
})

// Сброс использованных артистов
const resetUsedArtists = () => {
  usedArtists.value.clear()
}

const initializePlayer = async () => {
  try {
    const token = await getSpotifyToken()
    if (!token) return

    player.value = new window.Spotify.Player({
      name: 'Music Quiz Player',
      getOAuthToken: cb => { cb(token) }
    })

    // Обработчики событий
    player.value.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id)
      deviceId.value = device_id
      playerReady.value = true
    })

    player.value.addListener('player_state_changed', state => {
      console.log('Player State Changed', state)
    })

    player.value.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id)
      playerReady.value = false
    })

    // Подключаем плеер
    await player.value.connect()
  } catch (error) {
    console.error('Error initializing player:', error)
  }
}

onMounted(() => {
  // Если SDK уже загружен
  if (window.spotifyReady) {
    initializePlayer()
  } else {
    // Ждем загрузки SDK
    window.addEventListener('spotify-sdk-ready', initializePlayer, { once: true })
  }
})

onUnmounted(() => {
  if (player.value) {
    player.value.disconnect()
  }
  window.removeEventListener('spotify-sdk-ready', initializePlayer)
})

// Начать новый раунд
const startNewRound = async () => {
  if (!playerReady.value) {
    console.error('Player not ready')
    return
  }

  // Проверяем, есть ли доступные треки
  if (availableTracks.value.length === 0) {
    console.log('Все артисты использованы, сбрасываем список')
    resetUsedArtists()
  }

  showAnswer.value = false
  timeLeft.value = 15
  
  // Выбираем случайный трек
  const randomIndex = Math.floor(Math.random() * randomTracks.value.length)
  const newTrack = randomTracks.value[randomIndex]
  
  if (!newTrack) {
    console.error('Нет доступных треков')
    return
  }

  currentTrack.value = newTrack
  usedArtists.value.add(newTrack.artist)
  
  try {
    // Получаем информацию о треке для определения его длительности
    const trackInfo = await fetch(`https://api.spotify.com/v1/tracks/${currentTrack.value.spotify_id}`, {
      headers: {
        'Authorization': `Bearer ${await getSpotifyToken()}`
      }
    }).then(res => res.json())

    // Вычисляем случайную позицию (оставляем 15 секунд для прослушивания)
    const duration = trackInfo.duration_ms
    const maxStartPosition = Math.max(0, duration - 30000) // 30 секунд от конца
    const randomPosition = Math.floor(Math.random() * maxStartPosition)

    // Воспроизводим трек с случайной позиции
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId.value}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getSpotifyToken()}`
      },
      body: JSON.stringify({
        uris: [`spotify:track:${currentTrack.value.spotify_id}`],
        position_ms: randomPosition
      })
    })
    
    // Запускаем таймер
    if (timer.value) clearInterval(timer.value)
    timer.value = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        showAnswer.value = true
        stopPlaying()
        
        // Добавляем автоматическое переключение через 3 секунды
        setTimeout(() => {
          startNewRound()
        }, 3000)
      }
    }, 1000)
  } catch (error) {
    console.error('Error playing track:', error)
  }
}

// Остановить воспроизведение
const stopPlaying = async () => {
  if (playerReady.value) {
    try {
      await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId.value}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getSpotifyToken()}`
        }
      })
    } catch (error) {
      console.error('Error stopping playback:', error)
    }
  }
  
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

// Показать ответ досрочно
const revealAnswer = () => {
  showAnswer.value = true
  stopPlaying()
  
  // Добавляем автоматическое переключение через 3 секунды
  setTimeout(() => {
    startNewRound()
  }, 3000)
}
</script>

<template>
  <div class="quiz-container">
    <div v-if="randomTracks.length < 20" class="error-message">
      Недостаточно треков для квиза 
      (нужно минимум 20, найдено {{ randomTracks.length }})
      <br>
      <small>Всего треков: {{ props.tracks.length }}</small>
      <br>
      <small>Доступно уникальных артистов: {{ availableTracks.length }}</small>
    </div>
    
    <div v-else class="quiz-content">
      <div v-if="!currentTrack" class="start-screen">
        <h2>Музыкальный квиз</h2>
        <p>Угадайте песню за 15 секунд!</p>
        <button @click="startNewRound" class="start-btn">
          Начать игру
        </button>
      </div>
      
      <div v-else class="game-screen">
        <div class="timer">
          {{ timeLeft }} сек
        </div>
        
        <div v-if="showAnswer" class="answer">
          <img 
            :src="currentTrack.image_url" 
            :alt="currentTrack.name"
            class="track-image"
          >
          <div class="track-info">
            <h3>{{ currentTrack.name }}</h3>
            <p>{{ currentTrack.artist }}</p>
          </div>
        </div>
        
        <div v-else class="question">
          <div class="placeholder-image">
            <span>?</span>
          </div>
          <button @click="revealAnswer" class="reveal-btn">
            Показать ответ
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quiz-container {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 20px 0;
}

.error-message {
  color: #ff4444;
  text-align: center;
  padding: 20px;
}

.quiz-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.start-screen {
  text-align: center;
}

.timer {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.game-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.answer, .question {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.track-image {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  object-fit: cover;
}

.placeholder-image {
  width: 200px;
  height: 200px;
  background: #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #666;
}

.track-info {
  text-align: center;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  color: white;
}

.start-btn, .next-btn {
  background: #44aa44;
}

.reveal-btn {
  background: #666;
}
</style> 