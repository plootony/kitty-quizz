import { defineStore } from 'pinia'
import axios from 'axios'

export const useSpotifyStore = defineStore('spotify', {
  state: () => ({
    accessToken: localStorage.getItem('spotify_token'),
    tracks: [],
    loading: false,
    error: null
  }),

  actions: {
    async authorize() {
      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
      const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
      
      try {
        const response = await axios.post('https://accounts.spotify.com/api/token', 
          new URLSearchParams({
            'grant_type': 'client_credentials'
          }), {
            headers: {
              'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
        
        this.accessToken = response.data.access_token
        localStorage.setItem('spotify_token', response.data.access_token)
        return response.data.access_token
      } catch (error) {
        this.error = 'Ошибка авторизации: ' + error.message
        console.error('Ошибка авторизации:', error)
        return null
      }
    },

    async fetchNewReleases() {
      try {
        this.loading = true
        
        // Если нет токена или получаем 401, пробуем авторизоваться
        if (!this.accessToken) {
          const token = await this.authorize()
          if (!token) return
          this.accessToken = token
        }

        const response = await axios.get('https://api.spotify.com/v1/browse/new-releases', {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
          params: {
            limit: 20,
            offset: 0,
            market: 'RU' // или другой код страны
          }
        })

        this.tracks = response.data.albums.items
        this.error = null
      } catch (error) {
        if (error.response?.status === 401) {
          // Токен истек, пробуем получить новый
          localStorage.removeItem('spotify_token')
          this.accessToken = null
          await this.fetchNewReleases() // Рекурсивный вызов после обновления токена
        } else {
          this.error = `Ошибка получения треков: ${error.response?.data?.error?.message || error.message}`
          console.error('Ошибка получения треков:', error)
          this.tracks = []
        }
      } finally {
        this.loading = false
      }
    }
  }
}) 