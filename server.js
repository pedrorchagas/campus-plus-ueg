import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import api from './src/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', api);
app.use(express.static(path.join(__dirname, 'public')));

// SPA: qualquer outra rota devolve o index (a navegação é feita por hash)
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  const codespace = process.env.CODESPACE_NAME;
  const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  console.log(`Campus+ (protótipo) rodando na porta ${PORT}`);
  console.log(codespace && domain ? `Acesse: https://${codespace}-${PORT}.${domain}` : `Acesse: http://localhost:${PORT}`);
});
