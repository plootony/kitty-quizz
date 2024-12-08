<script setup>
import { computed } from 'vue'

const props = defineProps({
  tracks: {
    type: Array,
    required: true
  }
})

const GENRES_CONFIG = {
  rock: { id: 'rock', name: 'Rock', label: 'Рок' },
  pop: { id: 'pop', name: 'Pop', label: 'Поп' },
  hiphop: { id: 'hiphop', name: 'Hip Hop', label: 'Хип-хоп' }
}

const tracksByGenre = computed(() => {
  const result = Object.keys(GENRES_CONFIG).reduce((acc, key) => {
    acc[key] = []
    return acc
  }, {})

  props.tracks.forEach(track => {
    if (track.genre in result) {
      result[track.genre].push({
        id: track.id,
        name: track.name,
        year: track.year,
        popularity: track.popularity,
        difficulty: getDifficulty(track.popularity).text
      })
    }
  })

  return result
})

const getDifficulty = (popularity) => {
  if (popularity >= 55) return { level: 1, text: 'Легко' }
  if (popularity >= 35) return { level: 2, text: 'Нормально' }
  return { level: 3, text: 'Сложно' }
}
</script>

<template>
  <div class="dev-info">
    <button @click="$refs.modal.showModal()" class="dev-btn">
      Dev Info
    </button>

    <dialog ref="modal" class="dev-modal">
      <div class="modal-content">
        <h2>Dev Information</h2>
        
        <div class="genre-sections">
          <div v-for="(tracks, genre) in tracksByGenre" :key="genre" class="genre-section">
            <h3>{{ GENRES_CONFIG[genre].label.toUpperCase() }} ({{ tracks.length }} tracks)</h3>
            <div class="tracks-stats">
              <div>Легко: {{ tracks.filter(t => t.difficulty === 'Легко').length }}</div>
              <div>Нормально: {{ tracks.filter(t => t.difficulty === 'Нормально').length }}</div>
              <div>Сложно: {{ tracks.filter(t => t.difficulty === 'Сложно').length }}</div>
            </div>
            <div class="tracks-list">
              <div v-for="track in tracks" :key="track.id" class="track-item">
                <div class="track-name">{{ track.name }}</div>
                <div class="track-details">
                  Year: {{ track.year }} | 
                  Popularity: {{ track.popularity }} | 
                  Difficulty: {{ track.difficulty }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button @click="$refs.modal.close()" class="close-btn">
          Close
        </button>
      </div>
    </dialog>
  </div>
</template>

<style lang="scss" scoped>
.dev-info {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;

  .dev-btn {
    padding: 8px 16px;
    background: #666;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background: #555;
    }
  }
}

.dev-modal {
  padding: 0;
  border: none;
  border-radius: 8px;
  max-width: 90vw;
  width: 1200px;
  max-height: 90vh;

  &::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .modal-content {
    padding: 20px;
    max-height: 90vh;
    overflow-y: auto;

    h2 {
      margin-top: 0;
      text-align: center;
    }

    .genre-sections {
      display: flex;
      flex-direction: column;
      gap: 20px;

      .genre-section {
        h3 {
          margin: 0 0 10px;
          padding-bottom: 5px;
          border-bottom: 2px solid #eee;
        }

        .tracks-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 10px;
          font-size: 14px;
          color: #666;
        }

        .tracks-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 10px;

          .track-item {
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
            font-size: 14px;

            .track-name {
              font-weight: 500;
              margin-bottom: 5px;
            }

            .track-details {
              color: #666;
              font-size: 12px;
            }
          }
        }
      }
    }

    .close-btn {
      display: block;
      margin: 20px auto 0;
      padding: 8px 16px;
      background: #666;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background: #555;
      }
    }
  }
}
</style> 