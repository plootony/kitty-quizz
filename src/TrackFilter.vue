- const debug = (message, data) => { ... } // Удалить функцию отладки

// Упростить watch
watch([selectedGenre, selectedDecade, selectedDifficulty], () => {
  emit('update:filters', {
    genre: selectedGenre.value,
    decade: selectedDecade.value,
    difficulty: selectedDifficulty.value
  })
}) 