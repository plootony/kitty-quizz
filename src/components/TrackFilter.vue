<script setup>
import { ref, watch } from 'vue'

const emit = defineEmits(['update:filters'])

// Конфигурация фильтров
const genres = [
  { value: '', label: 'Все жанры' },
  { value: 'rock', label: 'Рок' },
  { value: 'pop', label: 'Поп' },
  { value: 'hiphop', label: 'Хип-хоп' }
]

const decades = [
  { value: '', label: 'Все десятилетия' },
  { value: '1970', label: '70-е' },
  { value: '1980', label: '80-е' },
  { value: '1990', label: '90-е' },
  { value: '2000', label: '2000-е' },
  { value: '2010', label: '2010-е' },
  { value: '2020', label: '2020-е' }
]

const difficulties = [
  { value: '', label: 'Любая сложность' },
  { value: 1, label: 'Легко' },
  { value: 2, label: 'Нормально' },
  { value: 3, label: 'Сложно' }
]

// Состояния фильтров
const selectedGenre = ref('')
const selectedDecade = ref('')
const selectedDifficulty = ref('')

// Определение сложности по популярности
const getDifficulty = (popularity) => {
  if (popularity >= 55) return 'easy'
  if (popularity >= 35) return 'medium'
  return 'hard'
}

// Отслеживание изменений фильтров
watch([selectedGenre, selectedDecade, selectedDifficulty], () => {
  emit('update:filters', {
    genre: selectedGenre.value,
    decade: selectedDecade.value,
    difficulty: selectedDifficulty.value
  })
})
</script>

<template>
  <div class="filters-container">
    <!-- Фильтр по жанру -->
    <div class="filter-group">
      <label>Жанр</label>
      <select v-model="selectedGenre">
        <option 
          v-for="genre in genres" 
          :key="genre.value" 
          :value="genre.value"
        >
          {{ genre.label }}
        </option>
      </select>
    </div>

    <!-- Фильтр по десятилетию -->
    <div class="filter-group">
      <label>Десятилетие</label>
      <select v-model="selectedDecade">
        <option 
          v-for="decade in decades" 
          :key="decade.value" 
          :value="decade.value"
        >
          {{ decade.label }}
        </option>
      </select>
    </div>

    <!-- Фильтр по сложности -->
    <div class="filter-group">
      <label>Сложность</label>
      <select v-model="selectedDifficulty">
        <option 
          v-for="difficulty in difficulties" 
          :key="difficulty.value" 
          :value="difficulty.value"
        >
          {{ difficulty.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.filters-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 14px;
  color: #666;
}

select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 160px;
  background: white;
}

select:focus {
  outline: none;
  border-color: #666;
}
</style> 