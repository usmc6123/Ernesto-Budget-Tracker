import { getDb, verifyToken, handleError } from '../shared';

export default async function handler(req: any, res: any) {
  try {
    verifyToken(req);
    const dbObj = getDb();
    
    const id = req.query.id || req.params?.id;
    if (!id) {
      return res.status(400).json({ error: 'Id parameter is required' });
    }
    
    // Fetch current income to inspect monthKey
    let existingItem: any = null;
    if (dbObj.isMock) {
      const income = await dbObj.getCollection('income');
      existingItem = income.find((i: any) => i.id === id);
    } else {
      const doc = await dbObj.realDb!.collection('income').doc(id).get();
      if (doc.exists) {
        existingItem = { id: doc.id, ...doc.data() };
      }
    }
    
    if (!existingItem) {
      return res.status(404).json({ error: 'Income entry not found' });
    }
    
    // Safeguard: Historical entries are read-only
    if (existingItem.monthKey < '2026-06') {
      return res.status(403).json({ error: 'Historical entries are read-only' });
    }
    
    if (req.method === 'DELETE') {
      if (dbObj.isMock) {
        const income = await dbObj.getCollection('income');
        const filtered = income.filter((i: any) => i.id !== id);
        await dbObj.saveCollection('income', filtered);
      } else {
        await dbObj.realDb!.collection('income').doc(id).delete();
      }
      
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).end('Method Not Allowed');
  } catch (error) {
    return handleError(res, error);
  }
}
