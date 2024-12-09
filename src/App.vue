<script setup>
import { onMounted, ref, computed } from 'vue'
import { supabase } from './lib/supabase'
import TrackFilter from './components/TrackFilter.vue'
import MusicQuiz from './components/MusicQuiz.vue'

const loading = ref(false)
const error = ref(null)
const allTracks = ref([])

const filteredTracks = computed(() => {
  return allTracks.value.filter(track => {
    if (filters.value.genre && track.genre !== filters.value.genre) {
      return false
    }
    
    if (filters.value.decade) {
      const trackDecade = Math.floor(track.year / 10) * 10
      if (trackDecade.toString() !== filters.value.decade) {
        return false
      }
    }
    
    if (filters.value.difficulty) {
      const difficulty = getDifficulty(track.popularity).level
      if (difficulty !== parseInt(filters.value.difficulty)) {
        return false
      }
    }
    
    return true
  })
})

const filters = ref({
  genre: '',
  decade: '',
  difficulty: ''
})

const handleFiltersUpdate = (newFilters) => {
  filters.value = newFilters
}

onMounted(async () => {
  loading.value = true
  try {
    const { data, error: supabaseError } = await supabase
      .from('tracks')
      .select('*')
    
    if (supabaseError) {
      error.value = supabaseError.message
      return
    }
    
    if (!data || data.length === 0) {
      error.value = 'Нет доступных треков. Пожалуйста, заполните базу данных.'
      return
    }
    
    allTracks.value = data
    console.log(`Загружено ${data.length} треков`)
  } catch (err) {
    error.value = err.message
    console.error('Ошибка:', err)
  } finally {
    loading.value = false
  }
})

const getDifficulty = (popularity) => {
  if (popularity >= 55) return { level: 1, text: 'Легко 1' }
  if (popularity >= 35) return { level: 2, text: 'Нормально' }
  return { level: 3, text: 'Сложно' }
}

// Добавляем состояние для отслеживания активной игры
const isGameActive = ref(false)

// Добавляем обработчик изменения состояния игры
const handleGameStateChange = (state) => {
  isGameActive.value = state
}
</script>

<template>
  <div class="app-container">
    <h1 class="title">
      <span class="title-letter">K</span>
      <span class="title-letter">i</span>
      <span class="title-letter">t</span>
      <span class="title-letter">t</span>
      <span class="title-letter">y</span>
      <span class="title-letter">Q</span>
      <span class="title-letter">u</span>
      <span class="title-letter">i</span>
      <span class="title-letter">z</span>
      <span class="title-letter">z</span>
    </h1>
    
    <TrackFilter 
      v-if="!loading && !error && !isGameActive" 
      @update:filters="handleFiltersUpdate" 
    />

    <MusicQuiz 
      v-if="!loading && !error"
      :tracks="filteredTracks"
      :filters="filters"
      @game-state-change="handleGameStateChange"
    />
  </div>
</template>

<style>
/* Глобальные стили */
body {
  margin: 0;
  padding: 0;
  background-color: #000000;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

#app {
  min-height: 100vh;
  background-color: #000000;
  color: #ffffff;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.title {
  text-align: center;
  font-size: 3.5em;
  margin: 30px 0;
  font-weight: 800;
  letter-spacing: 2px;
  position: relative;
}

.title-letter {
  display: inline-block;
  animation: letterFloat 2s infinite;
  animation-timing-function: ease-in-out;
  background-image: linear-gradient(45deg, #ff69b4, #ff1493);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 5px rgba(255, 105, 180, 0.7));
}

.title-letter:nth-child(2n) {
  animation-delay: 0.2s;
}

.title-letter:nth-child(3n) {
  animation-delay: 0.3s;
}

.title-letter:nth-child(4n) {
  animation-delay: 0.4s;
}

@keyframes letterFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes lineGlow {
  0%, 100% {
    opacity: 0.5;
    width: 150px;
  }
  50% {
    opacity: 1;
    width: 200px;
  }
}

/* Добавляем эффект свечения при наведении */
.title:hover .title-letter {
  animation: letterPop 0.5s ease forwards;
}

@keyframes letterPop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .title {
    font-size: 2.5em;
  }
  
  .title::after {
    width: 100px;
  }
  
  @keyframes lineGlow {
    0%, 100% {
      width: 100px;
    }
    50% {
      width: 150px;
    }
  }
}
</style>