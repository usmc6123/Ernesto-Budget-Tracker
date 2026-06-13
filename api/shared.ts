import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Local storage fallback paths for when Firebase Admin is not yet configured
const LOCAL_DB_PATH = path.join(process.cwd(), 'local-budget-db.json');

// Memory cache or file state initialization helper
function getLocalDB() {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const initialDB = {
      expenses: [],
      income: [],
      budgetLimits: [
        { id: 'Groceries', category: 'Groceries', limit: 450, type: 'variable', color: '#8db88e' },
        { id: 'Food & Dining', category: 'Food & Dining', limit: 150, type: 'variable', color: '#c8a97e' },
        { id: 'Dining Out', category: 'Dining Out', limit: 150, type: 'variable', color: '#e8c07a' },
        { id: 'Gas', category: 'Gas', limit: 250, type: 'variable', color: '#7aace8' },
        { id: 'Personal Care', category: 'Personal Care', limit: 200, type: 'variable', color: '#e89b7a' },
        { id: 'Clothing', category: 'Clothing', limit: 100, type: 'variable', color: '#c87aaa' },
        { id: 'Health & Fitness', category: 'Health & Fitness', limit: 200, type: 'variable', color: '#7ac8a9' },
        { id: 'Shopping', category: 'Shopping', limit: 100, type: 'variable', color: '#c87aaa' },
        { id: 'Gifts', category: 'Gifts', limit: 50, type: 'variable', color: '#c87ab8' },
        { id: 'Entertainment', category: 'Entertainment', limit: 50, type: 'variable', color: '#b8c87a' },
        { id: 'Cigars & Leisure', category: 'Cigars & Leisure', limit: 30, type: 'variable', color: '#c8a87a' },
        { id: 'Parking', category: 'Parking', limit: 30, type: 'variable', color: '#9b8ec8' },
        { id: 'Other', category: 'Other', limit: 100, type: 'variable', color: '#888888' },
        { id: 'Housing', category: 'Housing', limit: 908, type: 'fixed', color: '#d4b483' },
        { id: 'Auto', category: 'Auto', limit: 650, type: 'fixed', color: '#e87a7a' },
        { id: 'Bills & Utilities', category: 'Bills & Utilities', limit: 239, type: 'fixed', color: '#8ab8d4' },
        { id: 'Subscriptions', category: 'Subscriptions', limit: 71, type: 'fixed', color: '#a8b8c8' }
      ],
      settings: {
        id: 'user-settings',
        theme: 'MONOCHROME',
        budgetCeiling: 2615,
        savingsTarget: 2000,
        defaultIncome: 0
      }
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialDB, null, 2), 'utf-8');
  }
  const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

export function writeLocalDB(data: any) {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function getDb() {
  const firebaseConfig = process.env.FIREBASE_CONFIG;
  if (!firebaseConfig) {
    // Return a mocked object mapping common firestore-like requests to local JSON file operations
    console.warn('⚠️ FIREBASE_CONFIG is not defined. Falling back to local storage file: ' + LOCAL_DB_PATH);
    return {
      isMock: true,
      async getCollection(colName: string) {
        const db = getLocalDB();
        return db[colName] || [];
      },
      async saveCollection(colName: string, items: any[]) {
        const db = getLocalDB();
        db[colName] = items;
        writeLocalDB(db);
      },
      async getSettings() {
        const db = getLocalDB();
        return db.settings;
      },
      async saveSettings(settings: any) {
        const db = getLocalDB();
        db.settings = settings;
        writeLocalDB(db);
      },
      async getBudgetLimits() {
        const db = getLocalDB();
        return db.budgetLimits;
      },
      async saveBudgetLimit(limit: any) {
        const db = getLocalDB();
        const idx = db.budgetLimits.findIndex((b: any) => b.id === limit.id);
        if (idx >= 0) {
          db.budgetLimits[idx] = limit;
        } else {
          db.budgetLimits.push(limit);
        }
        writeLocalDB(db);
      }
    };
  }

  // Real Firebase Initialization
  const firebaseAdmin = admin as any;
  if (!firebaseAdmin.apps.length) {
    try {
      const config = JSON.parse(firebaseConfig);
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(config)
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (err) {
      console.error('❌ Failed to parse FIREBASE_CONFIG or initialize Firebase Admin:', err);
      throw err;
    }
  }
  const firestoreDb = firebaseAdmin.firestore();
  return {
    isMock: false,
    realDb: firestoreDb,
    async getCollection(colName: string) {
      const snap = await firestoreDb.collection(colName).get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async saveCollection(colName: string, items: any[]) {
      // Typically used for custom bulk operations, otherwise use individually
      const batch = firestoreDb.batch();
      items.forEach(item => {
        const ref = firestoreDb.collection(colName).doc(item.id);
        batch.set(ref, item);
      });
      await batch.commit();
    },
    async getSettings() {
      const doc = await firestoreDb.collection('settings').doc('user-settings').get();
      if (!doc.exists) {
        const defaultSettings = {
          id: 'user-settings',
          theme: 'MONOCHROME',
          budgetCeiling: 2615,
          savingsTarget: 2000,
          defaultIncome: 0
        };
        await firestoreDb.collection('settings').doc('user-settings').set(defaultSettings);
        return defaultSettings;
      }
      return doc.data();
    },
    async saveSettings(settings: any) {
      await firestoreDb.collection('settings').doc('user-settings').set(settings, { merge: true });
    },
    async getBudgetLimits() {
      const snap = await firestoreDb.collection('budgetLimits').get();
      if (snap.empty) {
        // Bootstrap standard limits
        const defaultLimits = [
          { id: 'Groceries', category: 'Groceries', limit: 450, type: 'variable', color: '#8db88e' },
          { id: 'Food & Dining', category: 'Food & Dining', limit: 150, type: 'variable', color: '#c8a97e' },
          { id: 'Dining Out', category: 'Dining Out', limit: 150, type: 'variable', color: '#e8c07a' },
          { id: 'Gas', category: 'Gas', limit: 250, type: 'variable', color: '#7aace8' },
          { id: 'Personal Care', category: 'Personal Care', limit: 200, type: 'variable', color: '#e89b7a' },
          { id: 'Clothing', category: 'Clothing', limit: 100, type: 'variable', color: '#c87aaa' },
          { id: 'Health & Fitness', category: 'Health & Fitness', limit: 200, type: 'variable', color: '#7ac8a9' },
          { id: 'Shopping', category: 'Shopping', limit: 100, type: 'variable', color: '#c87aaa' },
          { id: 'Gifts', category: 'Gifts', limit: 50, type: 'variable', color: '#c87ab8' },
          { id: 'Entertainment', category: 'Entertainment', limit: 50, type: 'variable', color: '#b8c87a' },
          { id: 'Cigars & Leisure', category: 'Cigars & Leisure', limit: 30, type: 'variable', color: '#c8a87a' },
          { id: 'Parking', category: 'Parking', limit: 30, type: 'variable', color: '#9b8ec8' },
          { id: 'Other', category: 'Other', limit: 100, type: 'variable', color: '#888888' },
          { id: 'Housing', category: 'Housing', limit: 908, type: 'fixed', color: '#d4b483' },
          { id: 'Auto', category: 'Auto', limit: 650, type: 'fixed', color: '#e87a7a' },
          { id: 'Bills & Utilities', category: 'Bills & Utilities', limit: 239, type: 'fixed', color: '#8ab8d4' },
          { id: 'Subscriptions', category: 'Subscriptions', limit: 71, type: 'fixed', color: '#a8b8c8' }
        ];
        const batch = firestoreDb.batch();
        defaultLimits.forEach(item => {
          const ref = firestoreDb.collection('budgetLimits').doc(item.id);
          batch.set(ref, item);
        });
        await batch.commit();
        return defaultLimits;
      }
      return snap.docs.map(doc => doc.data());
    },
    async saveBudgetLimit(limit: any) {
      await firestoreDb.collection('budgetLimits').doc(limit.id).set(limit, { merge: true });
    }
  };
}

export function verifyToken(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: No authorization header found');
  }
  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev';
  try {
    const decoded = jwt.verify(token, secret) as any;
    if (decoded.uid !== 'reyes-budget-uid') {
      throw new Error('Unauthorized: Invalid UID');
    }
    return decoded;
  } catch (err) {
    throw new Error('Unauthorized: Token verification failed');
  }
}

// Global exception helper for express responses
export function handleError(res: any, error: any) {
  console.error('🚨 [API ERROR]:', error);
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('Unauthorized')) {
    return res.status(401).json({ error: msg });
  }
  return res.status(500).json({ error: msg });
}
