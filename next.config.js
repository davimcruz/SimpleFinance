module.exports = {
  devServer: () => ({
    headers: {
      "Access-Control-Allow-Origin": null,
    },
  }),
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
