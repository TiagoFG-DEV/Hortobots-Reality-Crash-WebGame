// TERMINAL/server.js - Servidor Express do Terminal Retro (ESM)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3333;

// Servir arquivos estáticos do Terminal
app.use(express.static(path.join(__dirname, 'public')));

import fs from 'fs';

// Servir pasta de áudios e referências
const refsPath = fs.existsSync(path.join(__dirname, 'refs'))
  ? path.join(__dirname, 'refs')
  : path.join(__dirname, '..', 'refs');

app.use('/audio', express.static(path.join(refsPath, 'audio')));
app.use('/refs', express.static(refsPath));
app.use('/images', express.static(path.join(refsPath, 'images')));
app.use('/sprites', express.static(path.join(refsPath, 'projects_and_3d', 'IVYL 4500', 'IVYL 4500', 'Ivyl3000', 'Sprites')));

// Fallback SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` [QUEZAS-DOS] TERMINAL VIRTUAL ATIVO: http://localhost:${PORT}`);
  console.log(` Modos: CRT Retro | Scanlines | BGM Integrado | Blackout QTE`);
  console.log(`=======================================================`);
});
