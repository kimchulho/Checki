import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Remove the async function startServer() { wrapper
content = content.replace('async function startServer() {\n  const app = express();\n  const PORT = 3000;\n', 'const app = express();\nconst PORT = process.env.PORT || 3000;\n');

// Replace the end of the file
const endPattern = `  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();`;

const newEnd = `  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    (async () => {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(\`Server running on http://localhost:\${PORT}\`);
      });
    })();
  } else if (!process.env.VERCEL) {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
    app.listen(PORT, "0.0.0.0", () => {
      console.log(\`Server running on http://localhost:\${PORT}\`);
    });
  }

export default app;`;

content = content.replace(endPattern, newEnd);

fs.writeFileSync('server.ts', content);
console.log('server.ts rewritten');
