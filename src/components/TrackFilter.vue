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
  <div class="filter-container">
    <!-- Фильтр по жанру -->
    <div class="filter-group">
      <label class="filter-label">Жанр</label>
      <select v-model="selectedGenre" class="filter-select">
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
      <label class="filter-label">Десятилетие</label>
      <select v-model="selectedDecade" class="filter-select">
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
      <label class="filter-label">Сложность</label>
      <select v-model="selectedDifficulty" class="filter-select">
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
.filter-container {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  border: 1px solid rgba(255, 105, 180, 0.2);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 0.9em;
  color: #ff69b4;
  font-weight: 500;
}

.filter-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(255, 105, 180, 0.3);
  border-radius: 8px;
  font-size: 1em;
  color: #fff;
  background-color: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ff69b4' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.filter-select:hover {
  border-color: #ff69b4;
  background-color: rgba(255, 105, 180, 0.1);
}

.filter-select:focus {
  outline: none;
  border-color: #ff69b4;
  box-shadow: 0 0 0 2px rgba(255, 105, 180, 0.2);
}

.filter-select option {
  background-color: #1a1a1a;
  color: #fff;
  padding: 8px;
}

/* Адаптивный дизайн */
@media (max-width: 768px) {
  .filter-container {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .filter-group {
    margin-bottom: 0;
  }
}

/* Анимации */
.filter-select {
  transition: all 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-container {
  animation: fadeIn 0.3s ease-out;
}
</style> 