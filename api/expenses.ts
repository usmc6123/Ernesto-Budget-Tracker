import { getDb, verifyToken, handleError } from './shared';

export default async function handler(req: any, res: any) {
  try {
    verifyToken(req);
    const dbObj = getDb();
    
    // Check if this is a recurring template collection request
    if (req.query?.recurring === 'true') {
      if (req.method === 'GET') {
        let list: any[] = [];
        if (dbObj.isMock) {
          list = await dbObj.getCollection('recurringExpenses');
        } else {
          const snap = await dbObj.realDb!.collection('recurringExpenses').get();
          list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        return res.status(200).json(list);
      }

      if (req.method === 'POST') {
        const { category, description, amount, dayOfMonth } = req.body || {};
        if (!category || !description || amount === undefined) {
          return res.status(400).json({ error: 'Missing required recurring fields' });
        }
        const newId = dbObj.isMock
          ? Math.random().toString(36).substring(2, 11)
          : dbObj.realDb!.collection('recurringExpenses').doc().id;
        const newRecurring = {
          id: newId,
          category,
          description,
          amount: Number(amount),
          dayOfMonth: Number(dayOfMonth) || new Date().getDate(),
          createdAt: Date.now()
        };
        if (dbObj.isMock) {
          const existing = await dbObj.getCollection('recurringExpenses');
          existing.unshift(newRecurring);
          await dbObj.saveCollection('recurringExpenses', existing);
        } else {
          await dbObj.realDb!.collection('recurringExpenses').doc(newId).set(newRecurring);
        }
        return res.status(201).json(newRecurring);
      }

      if (req.method === 'DELETE') {
        const id = req.query.id || req.params?.id;
        if (!id) {
          return res.status(400).json({ error: 'Id parameter is required' });
        }
        if (dbObj.isMock) {
          const existing = await dbObj.getCollection('recurringExpenses');
          const filtered = existing.filter((e: any) => e.id !== id);
          await dbObj.saveCollection('recurringExpenses', filtered);
        } else {
          await dbObj.realDb!.collection('recurringExpenses').doc(id).delete();
        }
        return res.status(200).json({ success: true });
      }

      return res.status(405).end('Method Not Allowed');
    }
    
    if (req.method === 'GET') {
      const { month } = req.query || {};
      if (!month) {
        return res.status(400).json({ error: 'Month parameter is required' });
      }
      
      let list: any[] = [];
      if (dbObj.isMock) {
        const raw = await dbObj.getCollection('expenses');
        list = raw.filter((e: any) => e.monthKey === month);
      } else {
        const snap = await dbObj.realDb!.collection('expenses')
          .where('monthKey', '==', month)
          .get();
        list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      // Sort: newest first
      list.sort((a, b) => b.createdAt - a.createdAt);
      return res.status(200).json(list);
    } 
    
    if (req.method === 'POST') {
      const { monthKey, category, description, amount, date, note, isRecurring, imported, isSplit } = req.body || {};
      
      if (!monthKey || !category || !description || amount === undefined || !date) {
        return res.status(400).json({ error: 'Missing required expense fields' });
      }
      
      // Strict rule: Historical months (Jan-May 2026) are read-only
      if (monthKey < '2026-06') {
        return res.status(403).json({ error: 'Historical months prior to June 2026 are read-only' });
      }
      
      const newId = dbObj.isMock 
        ? Math.random().toString(36).substring(2, 11) 
        : dbObj.realDb!.collection('expenses').doc().id;
        
      const newExpense = {
        id: newId,
        monthKey,
        category,
        description,
        amount: Number(amount),
        date,
        note: note || '',
        isRecurring: !!isRecurring,
        imported: !!imported,
        isSplit: !!isSplit,
        createdAt: Date.now()
      };
      
      if (dbObj.isMock) {
        const existing = await dbObj.getCollection('expenses');
        existing.unshift(newExpense);
        await dbObj.saveCollection('expenses', existing);
      } else {
        await dbObj.realDb!.collection('expenses').doc(newId).set(newExpense);
      }
      
      // Persist recurring templates if flagged
      if (isRecurring) {
        const recId = dbObj.isMock
          ? Math.random().toString(36).substring(2, 11)
          : dbObj.realDb!.collection('recurringExpenses').doc().id;
        const newRecurring = {
          id: recId,
          category,
          description,
          amount: Number(amount),
          dayOfMonth: new Date().getDate(),
          createdAt: Date.now()
        };
        if (dbObj.isMock) {
          const existingRec = await dbObj.getCollection('recurringExpenses');
          existingRec.unshift(newRecurring);
          await dbObj.saveCollection('recurringExpenses', existingRec);
        } else {
          await dbObj.realDb!.collection('recurringExpenses').doc(recId).set(newRecurring);
        }
      }
      
      return res.status(201).json(newExpense);
    }
    
    return res.status(405).end('Method Not Allowed');
  } catch (error) {
    return handleError(res, error);
  }
}
