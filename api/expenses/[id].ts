import { getDb, verifyToken, handleError } from '../shared';

export default async function handler(req: any, res: any) {
  try {
    verifyToken(req);
    const dbObj = getDb();
    
    // Support both Vercel dynamic query and path segments mapped under Express
    const id = req.query.id || req.params?.id;
    
    if (!id) {
      return res.status(400).json({ error: 'Id parameter is required' });
    }
    
    // Fetch current item to inspect monthKey and imported status
    let existingItem: any = null;
    if (dbObj.isMock) {
      const expenses = await dbObj.getCollection('expenses');
      existingItem = expenses.find((e: any) => e.id === id);
    } else {
      const doc = await dbObj.realDb!.collection('expenses').doc(id).get();
      if (doc.exists) {
        existingItem = { id: doc.id, ...doc.data() };
      }
    }
    
    if (!existingItem) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Safeguard: Historical or imported items are read-only
    if (existingItem.monthKey < '2026-06' || existingItem.imported) {
      return res.status(403).json({ error: 'Historical and imported entries are read-only' });
    }
    
    if (req.method === 'PUT') {
      const { category, description, amount, date, note, isRecurring } = req.body || {};
      
      const updatedItem = {
        ...existingItem,
        category: category !== undefined ? category : existingItem.category,
        description: description !== undefined ? description : existingItem.description,
        amount: amount !== undefined ? Number(amount) : existingItem.amount,
        date: date !== undefined ? date : existingItem.date,
        note: note !== undefined ? note : existingItem.note,
        isRecurring: isRecurring !== undefined ? !!isRecurring : existingItem.isRecurring,
      };
      
      if (dbObj.isMock) {
        const expenses = await dbObj.getCollection('expenses');
        const idx = expenses.findIndex((e: any) => e.id === id);
        if (idx >= 0) {
          expenses[idx] = updatedItem;
          await dbObj.saveCollection('expenses', expenses);
        }
      } else {
        await dbObj.realDb!.collection('expenses').doc(id).set(updatedItem, { merge: true });
      }
      
      return res.status(200).json(updatedItem);
    }
    
    if (req.method === 'DELETE') {
      if (dbObj.isMock) {
        const expenses = await dbObj.getCollection('expenses');
        const filtered = expenses.filter((e: any) => e.id !== id);
        await dbObj.saveCollection('expenses', filtered);
      } else {
        await dbObj.realDb!.collection('expenses').doc(id).delete();
      }
      
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).end('Method Not Allowed');
  } catch (error) {
    return handleError(res, error);
  }
}
