let accessToken = null
let tokenExpiration = null

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
const REDIRECT_URI = `${window.location.origin}/callback`
const SCOPES = [
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-email',
  'user-read-private',
  'playlist-modify-private',
  'playlist-modify-public'
]

const getSpotifyToken = async () => {
  // Проверяем существующий токен
  if (accessToken && tokenExpiration && Date.now() < tokenExpiration) {
    return accessToken
  }

  // Проверяем токен в URL (после редиректа)
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  if (hashParams.has('access_token')) {
    accessToken = hashParams.get('access_token')
    const expiresIn = hashParams.get('expires_in')
    tokenExpiration = Date.now() + (expiresIn * 1000)
    // Очищаем URL
    window.location.hash = ''
    return accessToken
  }

  // Если нет токена, редиректим на авторизацию
  const authUrl = new URL(SPOTIFY_AUTH_URL)
  authUrl.searchParams.append('client_id', import.meta.env.VITE_SPOTIFY_CLIENT_ID)
  authUrl.searchParams.append('response_type', 'token')
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI)
  authUrl.searchParams.append('scope', SCOPES.join(' '))
  authUrl.searchParams.append('show_dialog', 'true')
  
  window.location.href = authUrl.toString()
}

export { getSpotifyToken } 