import { getDb, verifyToken, handleError } from './shared';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default async function handler(req: any, res: any) {
  try {
    verifyToken(req);
    const dbObj = getDb();

    if (req.method !== 'GET') {
      return res.status(405).end('Method Not Allowed');
    }

    // Read settings, limits, expenses, manual incomes
    const settings = await dbObj.getSettings();
    const defaultIncome = settings.defaultIncome || 0;
    
    const limits = await dbObj.getBudgetLimits();
    const expenses = await dbObj.getCollection('expenses');
    const incomes = await dbObj.getCollection('income');

    // Prepare monthly summaries
    const monthlySummaries: any[] = [];
    let totalIncomeYTD = 0;
    let totalSpentYTD = 0;
    let totalCardsYTD = 0;

    for (let i = 0; i < 12; i++) {
      const monthNum = i + 1;
      const monthKey = `2026-${String(monthNum).padStart(2, '0')}`;
      
      const monthExpenses = expenses.filter((e: any) => e.monthKey === monthKey);
      const spent = monthExpenses.reduce((sum: number, curr: any) => sum + curr.amount, 0);
      const cards = monthExpenses
        .filter((e: any) => e.category === 'Card Payments')
        .reduce((sum: number, curr: any) => sum + curr.amount, 0);
      
      const monthManualIncomes = incomes.filter((inc: any) => inc.monthKey === monthKey);
      const manualIncomeSum = monthManualIncomes.reduce((sum: number, curr: any) => sum + curr.amount, 0);

      // A month has active data if there are manual entries or we are in the current/past months.
      // E.g., we include default income if there's any expense/income entry or the month represents 
      // a current/past month (January to June has default income).
      // Let's determine the active state: if there is any data or we are in a month <= current local month
      const localMonth = new Date().getMonth(); // 0-11
      const isPastOrCurrent = i <= localMonth;
      const hasEntries = monthExpenses.length > 0 || monthManualIncomes.length > 0;
      
      const income = (isPastOrCurrent || hasEntries) ? (defaultIncome + manualIncomeSum) : 0;
      const net = income - spent;

      monthlySummaries.push({
        month: MONTH_NAMES[i],
        key: monthKey,
        income,
        spent,
        net,
        cards
      });

      totalIncomeYTD += income;
      totalSpentYTD += spent;
      totalCardsYTD += cards;
    }

    // Spending trend line chart dataset (total spent per category, per month)
    const categorySpendsByMonth: { [monthKey: string]: { [category: string]: number } } = {};
    for (let i = 1; i <= 12; i++) {
      const monthKey = `2026-${String(i).padStart(2, '0')}`;
      categorySpendsByMonth[monthKey] = {};
      
      // Initialize with zero for all limits
      limits.forEach((lim: any) => {
        categorySpendsByMonth[monthKey][lim.category] = 0;
      });
      
      // Fill with actual expenses
      expenses
        .filter((e: any) => e.monthKey === monthKey)
        .forEach((e: any) => {
          if (!categorySpendsByMonth[monthKey][e.category]) {
            categorySpendsByMonth[monthKey][e.category] = 0;
          }
          categorySpendsByMonth[monthKey][e.category] += e.amount;
        });
    }

    const payload = {
      ytdIncome: totalIncomeYTD,
      ytdSpent: totalSpentYTD,
      ytdNet: totalIncomeYTD - totalSpentYTD,
      realSpent: totalSpentYTD - totalCardsYTD,
      cardPayments: totalCardsYTD,
      monthlySummaries,
      categorySpendsByMonth,
      budgetLimits: limits
    };

    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error);
  }
}
