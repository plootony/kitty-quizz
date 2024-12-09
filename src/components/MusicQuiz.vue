<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getSpotifyToken } from '../lib/spotify'

const props = defineProps({
  tracks: {
    type: Array,
    required: true
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

const emit = defineEmits(['game-state-change'])

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
  emit('game-state-change', false)
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

  // Сообщаем что игра началась
  emit('game-state-change', true)

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
          <div class="placeholder-container">
            <div class="placeholder-content">
              <span class="question-mark">?</span>
            </div>
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
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  color: #fff;
}

.error-message {
  background-color: rgba(211, 47, 47, 0.2);
  border: 1px solid #d32f2f;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  color: #ff6b6b;
}

.quiz-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.start-screen {
  text-align: center;
  padding: 40px;
}

.start-screen h2 {
  color: #ff69b4; /* Hot Pink */
  margin-bottom: 16px;
}

.start-btn {
  background-color: #ff69b4;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.2s;
}

.start-btn:hover {
  background-color: #ff1493; /* Deep Pink */
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.3);
}

.game-screen {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.timer {
  font-size: 2em;
  font-weight: bold;
  color: #ff69b4;
  text-shadow: 0 0 10px rgba(255, 105, 180, 0.3);
}

.answer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  animation: fadeIn 0.3s ease-in;
}

.track-image {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(255, 105, 180, 0.3);
  object-fit: cover;
  animation: pulseShadow 3s ease-in-out infinite;
}

.track-info {
  text-align: center;
}

.track-info h3 {
  margin: 0;
  font-size: 1.4em;
  color: #ff69b4;
}

.track-info p {
  margin: 5px 0 0;
  color: #ccc;
}

.question {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.placeholder-container {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 20px rgba(255, 105, 180, 0.3);
  animation: pulseShadow 3s ease-in-out infinite;
}

.placeholder-content {
  width: 100%;
  height: 100%;
  background-color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-mark {
  font-size: 5em;
  font-weight: bold;
  background: linear-gradient(45deg, #ff69b4, #ff1493);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 5px rgba(255, 105, 180, 0.7));
}

.reveal-btn {
  background-color: transparent;
  color: #ff69b4;
  border: 2px solid #ff69b4;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.reveal-btn:hover {
  background-color: #ff69b4;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Адаптивный дизайн */
@media (max-width: 600px) {
  .quiz-container {
    padding: 10px;
  }

  .track-image,
  .placeholder-container {
    width: 150px;
    height: 150px;
  }

  .timer {
    font-size: 1.5em;
  }

  .track-info h3 {
    font-size: 1.2em;
  }

  .placeholder-container {
    width: 150px;
    height: 150px;
  }
  
  .question-mark {
    font-size: 4em;
  }
}

/* Добавляем анимацию пульсации тени */
@keyframes pulseShadow {
  0% {
    box-shadow: 0 0 20px rgba(255, 105, 180, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 105, 180, 0.5);
  }
  100% {
    box-shadow: 0 0 20px rgba(255, 105, 180, 0.3);
  }
}
</style> 