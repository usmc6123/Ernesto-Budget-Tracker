import { getDb, verifyToken, handleError } from './shared';

export default async function handler(req: any, res: any) {
  try {
    verifyToken(req);
    const dbObj = getDb();

    if (req.method === 'GET') {
      const settings = await dbObj.getSettings();
      return res.status(200).json(settings);
    }

    if (req.method === 'PUT') {
      const { theme, budgetCeiling, savingsTarget, defaultIncome } = req.body || {};
      
      const currentSettings = await dbObj.getSettings();
      const updatedSettings = {
        id: 'user-settings',
        theme: theme !== undefined ? theme : currentSettings.theme,
        budgetCeiling: budgetCeiling !== undefined ? Number(budgetCeiling) : currentSettings.budgetCeiling,
        savingsTarget: savingsTarget !== undefined ? Number(savingsTarget) : currentSettings.savingsTarget,
        defaultIncome: defaultIncome !== undefined ? Number(defaultIncome) : currentSettings.defaultIncome,
      };

      await dbObj.saveSettings(updatedSettings);
      return res.status(200).json(updatedSettings);
    }

    return res.status(405).end('Method Not Allowed');
  } catch (error) {
    return handleError(res, error);
  }
}
