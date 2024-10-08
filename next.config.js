//Redirecionamento do usuário por padrão para /dashboard usando pages router

module.exports = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false,
      },
    ]
  },
}
