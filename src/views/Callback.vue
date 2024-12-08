<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // После получения токена редиректим на главную
  router.push('/')
})
</script>

<template>
  <div class="callback">
    Авторизация...
  </div>
</template> 