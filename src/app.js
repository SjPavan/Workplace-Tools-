import express from 'express';
import documentsRouter from './routes/documents.js';
import searchRouter from './routes/search.js';
import { ensureDataDirectories } from './config/paths.js';
import { errorHandler } from './middleware/errorHandler.js';

await ensureDataDirectories();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/documents', documentsRouter);
app.use('/api/search', searchRouter);

app.use(errorHandler);

export default app;
