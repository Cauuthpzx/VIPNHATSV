import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { appConfig } from "../config/app.js";

async function swaggerPlugin(app: FastifyInstance) {
  // Only enable in non-production
  if (appConfig.isProduction) return;

  await app.register(swagger, {
    openapi: {
      info: {
        title: "MAXHUB API",
        description: "MAXHUB Backend API Documentation",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://localhost:${appConfig.port}`,
          description: "Local development",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });
}

export default fp(swaggerPlugin, { name: "swagger" });
