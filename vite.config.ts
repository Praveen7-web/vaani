import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import understandHandler from "./api/understand";

export default defineConfig(({ mode }) => {
  // Load env variables (such as GEMINI_API_KEY from .env.local)
  const env = loadEnv(mode, process.cwd(), "");
  process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  process.env.GEMINI_MODEL = env.GEMINI_MODEL || process.env.GEMINI_MODEL;

  return {
    plugins: [
      react(),
      {
        name: "local-api-understand",
        configureServer(server) {
          server.middlewares.use("/api/understand", async (req, res) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: "Method not allowed" }));
              return;
            }

            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });

            req.on("end", async () => {
              try {
                const parsedBody = body ? JSON.parse(body) : {};
                const mockReq = { method: req.method, body: parsedBody };
                const mockRes = {
                  status(code: number) {
                    res.statusCode = code;
                    return this;
                  },
                  json(data: any) {
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify(data));
                  },
                };

                await understandHandler(mockReq, mockRes);
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: err?.message || "Internal Server Error" }));
              }
            });
          });

          server.middlewares.use("/api/audit", async (req, res) => {
            try {
              const mockReq = { method: req.method, query: {}, body: {} };
              const mockRes = {
                status(code: number) {
                  res.statusCode = code;
                  return this;
                },
                json(data: any) {
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data));
                },
              };
              const { default: auditHandler } = await import("./api/audit");
              await auditHandler(mockReq, mockRes);
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: err?.message || "Internal Server Error" }));
            }
          });
        },
      },
    ],
    server: {
      port: 5173,
      host: true,
    },
  };
});
