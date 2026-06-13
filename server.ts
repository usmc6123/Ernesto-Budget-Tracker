import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environmental variables
dotenv.config();

// Vercel-style api handlers for local Express proxying
import authHandler from './api/auth';
import expensesHandler from './api/expenses';
import expensesIdHandler from './api/expenses/[id]';
import incomeHandler from './api/income';
import incomeIdHandler from './api/income/[id]';
import statsHandler from './api/stats';
import settingsHandler from './api/settings';
import budgetLimitsHandler from './api/budget-limits';
import analyzeReceiptHandler from './api/analyze-receipt';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global parse middlewares
  app.use(express.json());

  // Mount API paths first
  app.post('/api/auth', authHandler);

  app.get('/api/expenses', expensesHandler);
  app.post('/api/expenses', expensesHandler);
  app.put('/api/expenses/:id', (req, res) => {
    req.query = { ...req.query, id: req.params.id };
    return expensesIdHandler(req, res);
  });
  app.delete('/api/expenses/:id', (req, res) => {
    req.query = { ...req.query, id: req.params.id };
    return expensesIdHandler(req, res);
  });

  app.get('/api/recurring-expenses', (req, res) => {
    req.query = { ...req.query, recurring: 'true' };
    return expensesHandler(req, res);
  });
  app.post('/api/recurring-expenses', (req, res) => {
    req.query = { ...req.query, recurring: 'true' };
    return expensesHandler(req, res);
  });
  app.delete('/api/recurring-expenses/:id', (req, res) => {
    req.query = { ...req.query, recurring: 'true', id: req.params.id };
    return expensesHandler(req, res);
  });

  app.get('/api/income', incomeHandler);
  app.post('/api/income', incomeHandler);
  app.delete('/api/income/:id', (req, res) => {
    req.query = { ...req.query, id: req.params.id };
    return incomeIdHandler(req, res);
  });

  app.get('/api/stats', statsHandler);

  app.get('/api/settings', settingsHandler);
  app.put('/api/settings', settingsHandler);

  app.get('/api/budget-limits', budgetLimitsHandler);
  app.put('/api/budget-limits', budgetLimitsHandler);

  app.post('/api/analyze-receipt', analyzeReceiptHandler);

  // Serve static assets or mount Vite live compilation matching env setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BUDGET 2026 server running at http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
