import { getDb, verifyToken, handleError } from './shared';

export default async function handler(req: any, res: any) {
  try {
    verifyToken(req);
    const dbObj = getDb();
    
    if (req.method === 'GET') {
      const { month } = req.query || {};
      if (!month) {
        return res.status(400).json({ error: 'Month parameter is required' });
      }
      
      let list: any[] = [];
      if (dbObj.isMock) {
        const raw = await dbObj.getCollection('income');
        list = raw.filter((i: any) => i.monthKey === month);
      } else {
        const snap = await dbObj.realDb!.collection('income')
          .where('monthKey', '==', month)
          .get();
        list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      list.sort((a, b) => b.createdAt - a.createdAt);
      return res.status(200).json(list);
    }
    
    if (req.method === 'POST') {
      const { monthKey, description, amount, date } = req.body || {};
      
      if (!monthKey || !description || amount === undefined || !date) {
        return res.status(400).json({ error: 'Missing required income fields' });
      }
      
      // Pure rule: Historical months (Jan-May 2026) are read-only
      if (monthKey < '2026-06') {
        return res.status(403).json({ error: 'Historical months prior to June 2026 are read-only' });
      }
      
      const newId = dbObj.isMock 
        ? Math.random().toString(36).substring(2, 11) 
        : dbObj.realDb!.collection('income').doc().id;
        
      const newIncome = {
        id: newId,
        monthKey,
        description,
        amount: Number(amount),
        date,
        createdAt: Date.now()
      };
      
      if (dbObj.isMock) {
        const existing = await dbObj.getCollection('income');
        existing.unshift(newIncome);
        await dbObj.saveCollection('income', existing);
      } else {
        await dbObj.realDb!.collection('income').doc(newId).set(newIncome);
      }
      
      return res.status(201).json(newIncome);
    }
    
    return res.status(405).end('Method Not Allowed');
  } catch (error) {
    return handleError(res, error);
  }
}
