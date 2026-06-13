import { getDb, verifyToken, handleError } from './shared';

export default async function handler(req: any, res: any) {
  try {
    verifyToken(req);
    const dbObj = getDb();

    if (req.method === 'GET') {
      const limits = await dbObj.getBudgetLimits();
      return res.status(200).json(limits);
    }

    if (req.method === 'PUT') {
      const { id, category, limit, type, color } = req.body || {};
      
      if (!id || limit === undefined) {
        return res.status(400).json({ error: 'Missing category id or limit value' });
      }

      // Read current category limits to find full metadata if fields are missing
      const currentLimits = await dbObj.getBudgetLimits();
      const currentLimit = currentLimits.find((l: any) => l.id === id);

      if (!currentLimit) {
        return res.status(404).json({ error: 'Budget limit category not found' });
      }

      const updatedLimit = {
        id,
        category: category || currentLimit.category,
        limit: Number(limit),
        type: type || currentLimit.type,
        color: color || currentLimit.color,
      };

      await dbObj.saveBudgetLimit(updatedLimit);
      return res.status(200).json(updatedLimit);
    }

    return res.status(405).end('Method Not Allowed');
  } catch (error) {
    return handleError(res, error);
  }
}
