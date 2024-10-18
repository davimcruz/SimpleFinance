import Redis from "ioredis"

const redisUrl = process.env.REDIS_URL
const redisToken = process.env.REDIS_TOKEN

if (!redisUrl || !redisToken) {
  throw new Error(
    "Variáveis de Ambiente REDIS_URL e REDIS_TOKEN não estão definidas."
  )
}

const redis = new Redis(redisUrl, {
  password: redisToken,
  maxRetriesPerRequest: 5,
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000)
    return delay
  },
  reconnectOnError: (err) => {
    const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"]
    if (targetErrors.some((targetError) => err.message.includes(targetError))) {
      return true
    }
    return false
  },
})

export async function invalidateSummaryCache(userId: number): Promise<void> {
  const currentYear = new Date().getFullYear()
  const cacheKey = `summary:${userId}:${currentYear}`

  try {
    await redis.del(cacheKey)
    console.log(`Cache invalidado para o usuário ${userId} e ano ${currentYear}`)
  } catch (error) {
    console.error("Erro ao invalidar o cache:", error)
  }
}
