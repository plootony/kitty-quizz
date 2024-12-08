<script setup>
import { ref, watch, onMounted } from 'vue'

const emit = defineEmits(['filter-change'])

const decades = [
  { label: 'Все десятилетия', value: '' },
  { label: '1960-е', value: '1960' },
  { label: '1970-е', value: '1970' },
  { label: '1980-е', value: '1980' },
  { label: '1990-е', value: '1990' },
  { label: '2000-е', value: '2000' },
  { label: '2010-е', value: '2010' },
  { label: '2020-е', value: '2020' }
]

const genres = ref([
  { label: 'Все жанры', value: '' },
  { label: 'Рок', value: 'rock' },
  { label: 'Поп', value: 'pop' },
  { label: 'Хип-хоп', value: 'hiphop' }
])

const difficultyOptions = [
  { label: 'Все уровни', value: '' },
  { label: 'Легко', value: 'легко' },
  { label: 'Нормально', value: 'нормально' },
  { label: 'Сложно', value: 'сложно' }
]

const selectedDecade = ref('')
const selectedGenre = ref('')
const selectedDifficulty = ref('')

const debug = (message, data) => {
  console.log(`[TrackFilters] ${message}:`, data)
}

watch([selectedDecade, selectedGenre, selectedDifficulty], (newValues, oldValues) => {
  debug('Изменение значений фильтров', {
    old: {
      decade: oldValues[0],
      genre: oldValues[1],
      difficulty: oldValues[2]
    },
    new: {
      decade: newValues[0],
      genre: newValues[1],
      difficulty: newValues[2]
    }
  })
  
  const filters = {
    decade: selectedDecade.value,
    genre: selectedGenre.value,
    difficulty: selectedDifficulty.value
  }
  
  debug('Отправка фильтров в родительский компонент', filters)
  emit('filter-change', filters)
})

// Добавим логирование при монтировании компонента
onMounted(() => {
  debug('Компонент смонтирован', {
    initialValues: {
      decade: selectedDecade.value,
      genre: selectedGenre.value,
      difficulty: selectedDifficulty.value
    },
    availableGenres: genres.value,
    availableDifficulties: difficultyOptions
  })
})
</script>

<template>
  <div class="filters">
    <div class="filter-group">
      <label>Десятилетие:</label>
      <select v-model="selectedDecade">
        <option v-for="decade in decades" 
                :key="decade.value" 
                :value="decade.value">
          {{ decade.label }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <label>Жанр:</label>
      <select v-model="selectedGenre">
        <option v-for="genre in genres" 
                :key="genre.value" 
                :value="genre.value">
          {{ genre.label }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <label>Сложность:</label>
      <select v-model="selectedDifficulty">
        <option v-for="option in difficultyOptions" 
                :key="option.value" 
                :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 5px;

    label {
      font-size: 14px;
      color: #666;
    }

    select {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      min-width: 200px;

      &:focus {
        outline: none;
        border-color: #666;
      }
    }
  }
}
</style> 