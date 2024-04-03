import swaggerJsdoc from "swagger-jsdoc"

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SimpleFinance API",
      version: "1.0.0",
      description: "Documentação da API SimpleFinance",
    },
    servers: [
      {
        url: [
          "http://localhost:3000",
          "https://simplefinance-prod.vercel.app/",
        ],
      },
    ],
  },
  apis: ["./pages/api/*.ts"],
}

const swaggerSpec = swaggerJsdoc(options)

export default swaggerSpec
