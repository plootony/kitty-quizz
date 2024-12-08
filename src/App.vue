<script setup>
import { onMounted, ref, computed } from 'vue'
import { supabase } from './lib/supabase'
import TrackFilter from './components/TrackFilter.vue'
import MusicQuiz from './components/MusicQuiz.vue'

const loading = ref(false)
const error = ref(null)
const allTracks = ref([])

// Добавляем состояние для фильтрованных треков
const filteredTracks = computed(() => {
  return allTracks.value.filter(track => {
    // Фильтр по жанру
    if (filters.value.genre && track.genre !== filters.value.genre) {
      return false
    }
    
    // Фильтр по десятилетию
    if (filters.value.decade) {
      const trackDecade = Math.floor(track.year / 10) * 10
      if (trackDecade.toString() !== filters.value.decade) {
        return false
      }
    }
    
    // Фильтр по сложности
    if (filters.value.difficulty) {
      const difficulty = getDifficulty(track.popularity).level
      if (difficulty !== parseInt(filters.value.difficulty)) {
        return false
      }
    }
    
    return true
  })
})

// Добавляем сост��яние фильтров
const filters = ref({
  genre: '',
  decade: '',
  difficulty: ''
})

// Обработчик изменения фильтров
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

// Функция определения сложности
const getDifficulty = (popularity) => {
  if (popularity >= 55) return { level: 1, text: 'Легко' }
  if (popularity >= 35) return { level: 2, text: 'Нормально' }
  return { level: 3, text: 'Сложно' }
}
</script>

<template>
  <div class="app">
    <h1>Музыкальный квиз</h1>
    
    <TrackFilter 
      v-if="!loading && !error" 
      @update:filters="handleFiltersUpdate" 
    />
    
    <!-- Скрытые элементы остаются как есть -->
    <div class="admin-buttons">
      <!-- ... -->
    </div>
    
    <MusicQuiz 
      v-if="!loading && !error"
      :tracks="filteredTracks"
      :filters="filters"
    />
  </div>
</template>

<style lang="scss">
@import './assets/styles/main.scss';
</style>
