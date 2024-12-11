<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  totalTracks: {
    type: Number,
    default: 0
  },
  filteredCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:filters'])

// Конфигурация фильтров
const genres = [
  { value: 'pop', label: 'Поп' },
  { value: 'rock', label: 'Рок' },
  { value: 'hiphop', label: 'Хип-хоп' }
]

const decades = [
  { value: 2020, label: '2020-е' },
  { value: 2010, label: '2010-е' },
  { value: 2000, label: '2000-е' }
]

const difficulties = [
  { value: 1, label: 'Легко' },
  { value: 2, label: 'Нормально' },
  { value: 3, label: 'Сложно' }
]

const filters = ref({
  genre: '',
  decade: '',
  difficulty: ''
})

// Отслеживание изменений фильтров
watch(filters, (newFilters) => {
  emit('update:filters', newFilters)
}, { deep: true })

// Добавим сброс фильтров
const resetFilters = () => {
  filters.value = {
    genre: '',
    decade: '',
    difficulty: ''
  }
  emit('update:filters', filters.value)
}
</script>

<template>
  <div class="filter-container">
    <div class="filter-stats">
      <div class="stat-item">
        <span class="stat-label">Всего треков:</span>
        <span class="stat-value">{{ totalTracks }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">После фильтрации:</span>
        <span class="stat-value">{{ filteredCount }}</span>
      </div>
    </div>

    <div class="filters">
      <select v-model="filters.genre">
        <option value="">Все жанры</option>
        <option 
          v-for="genre in genres" 
          :key="genre.value" 
          :value="genre.value"
        >
          {{ genre.label }}
        </option>
      </select>

      <select v-model="filters.decade">
        <option value="">Все декады</option>
        <option 
          v-for="decade in decades" 
          :key="decade.value" 
          :value="decade.value"
        >
          {{ decade.label }}
        </option>
      </select>

      <select v-model="filters.difficulty">
        <option value="">Любая сложность</option>
        <option 
          v-for="diff in difficulties" 
          :key="diff.value" 
          :value="diff.value"
        >
          {{ diff.label }}
        </option>
      </select>
    </div>

    <button @click="resetFilters" class="reset-btn">
      Сбросить фильтры
    </button>
  </div>
</template>

<style scoped>
.filter-container {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  border: 1px solid rgba(255, 105, 180, 0.2);
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

select {
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

select:hover {
  border-color: #ff69b4;
  background-color: rgba(255, 105, 180, 0.1);
}

select:focus {
  outline: none;
  border-color: #ff69b4;
  box-shadow: 0 0 0 2px rgba(255, 105, 180, 0.2);
}

select option {
  background-color: #1a1a1a;
  color: #fff;
  padding: 8px;
}

.reset-btn {
  padding: 10px 20px;
  background-color: transparent;
  color: #ff69b4;
  border: 2px solid #ff69b4;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  width: fit-content;
  align-self: center;
}

.reset-btn:hover {
  background-color: rgba(255, 105, 180, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.2);
}

/* Адаптивный дизайн */
@media (max-width: 768px) {
  .filter-container {
    gap: 15px;
  }

  .filters {
    margin-bottom: 0;
    grid-template-columns: 1fr;
  }
}

/* Анимации */
select {
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

.filter-stats {
  display: flex;
  justify-content: space-around;
  padding: 10px;
  background: rgba(255, 105, 180, 0.05);
  border-radius: 8px;
  margin-bottom: 15px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  color: #ff69b4;
  font-size: 0.9em;
  margin-right: 8px;
}

.stat-value {
  font-weight: bold;
  color: white;
}
</style> 