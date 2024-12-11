<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { supabase } from './lib/supabase'
import TrackFilter from './components/TrackFilter.vue'
import MusicQuiz from './components/MusicQuiz.vue'
import DatabaseManager from './components/DatabaseManager.vue'

const loading = ref(false)
const error = ref(null)
const allTracks = ref([])

const filteredTracks = computed(() => {
  return allTracks.value.filter(track => {
    if (!filters.value.genre && !filters.value.decade && !filters.value.difficulty) {
      return true
    }
    
    if (filters.value.genre && track.genre !== filters.value.genre) {
      return false
    }
    
    if (filters.value.decade) {
      const trackDecade = Math.floor(track.year / 10) * 10
      const selectedDecade = parseInt(filters.value.decade)
      if (trackDecade !== selectedDecade) {
        return false
      }
    }
    
    if (filters.value.difficulty) {
      const difficulty = getDifficulty(track.popularity).level
      const selectedDifficulty = parseInt(filters.value.difficulty)
      if (difficulty !== selectedDifficulty) {
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
  console.log('Новые фильтры:', newFilters)
  filters.value = newFilters
}

// Добавим пагинацию для больших наборов данных
const loadAllTracks = async () => {
  const pageSize = 1000
  const allData = []
  let lastId = 0
  
  while (true) {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .gt('id', lastId)
      .order('id')
      .limit(pageSize)
    
    if (error) throw error
    if (!data || data.length === 0) break
    
    allData.push(...data)
    lastId = data[data.length - 1].id
    
    if (data.length < pageSize) break
  }
  
  return allData
}

onMounted(async () => {
  loading.value = true
  try {
    const data = await loadAllTracks()
    
    if (!data || data.length === 0) {
      error.value = 'Нет доступных треков. Пожалуйста, заполните базу данных.'
      return
    }
    
    allTracks.value = data
    console.log(`Загружено ${data.length} треков из базы данных`)
  } catch (err) {
    error.value = err.message
    console.error('Ошибка:', err)
  } finally {
    loading.value = false
  }
})

const getDifficulty = (popularity) => {
  if (popularity >= 50) return { level: 1, text: 'Легко' }
  if (popularity >= 40) return { level: 2, text: 'Нормально' }
  return { level: 3, text: 'Сложно' }
}

// Добавим вспомогательную функцию для отладки
const getDifficultyText = (popularity) => {
  if (popularity >= 50) return 'Легко (50-100)'
  if (popularity >= 40) return 'Нормально (40-49)'
  return 'Сложно (0-39)'
}

// Добавляем состояние для отслеживания активной игры
const isGameActive = ref(false)

// Добавляем обработчик изменения состояния игры
const handleGameStateChange = (state) => {
  isGameActive.value = state
}

// Добавим логирование для отладки
watch(filteredTracks, (newTracks) => {
  console.log('Фильтры:', filters.value)
  console.log('Всего треков:', allTracks.value.length)
  console.log('После фильтрации:', newTracks.length)
  console.log('Примеры треков:', newTracks.slice(0, 3))
})

// Обновим отладочную информацию
watch(filters, (newFilters) => {
  console.log('Применяемые фильтры:', {
    genre: newFilters.genre,
    decade: newFilters.decade ? parseInt(newFilters.decade) : null,
    difficulty: newFilters.difficulty ? parseInt(newFilters.difficulty) : null
  })
  
  const examples = filteredTracks.value.slice(0, 3)
  console.log('Примеры отфильтрованных треков:', examples.map(track => ({
    name: track.name,
    artist: track.artist,
    year: track.year,
    decade: Math.floor(track.year / 10) * 10,
    popularity: track.popularity,
    difficulty: getDifficulty(track.popularity).level,
    difficultyText: getDifficultyText(track.popularity),
    popularityScore: track.popularity
  })))
}, { deep: true })
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
      :total-tracks="allTracks.length"
      :filtered-count="filteredTracks.length"
    />

    <DatabaseManager v-if="!loading && !isGameActive" />

    <MusicQuiz 
      v-if="!loading && !error"
      :tracks="filteredTracks"
      :filters="filters"
      @game-state-change="handleGameStateChange"
    />

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
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

.error-message {
  background: rgba(211, 47, 47, 0.1);
  border: 1px solid #d32f2f;
  color: #ff6b6b;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: center;
}
</style>