//Redirecionamento do usuário por padrão para /dashboard

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
