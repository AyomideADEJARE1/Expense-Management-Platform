
import { formatCurrency } from '../../utils/currency';

export default function RecentTransactions({
  transactions = [],
  currency = 'NGN (₦)',
  isDarkMode = false,
}) {
  const recentList = transactions.slice(0, 5);

  const cardStyle = isDarkMode
    ? 'bg-slate-800 border-slate-700'
    : 'bg-white border-gray-200/80';
  const titleStyle = isDarkMode ? 'text-slate-100' : 'text-gray-900';
  const textStyle = isDarkMode ? 'text-slate-300' : 'text-gray-500';
  const dividerStyle = isDarkMode ? 'divide-slate-700' : 'divide-gray-100';

  return (
    <div className={`${cardStyle} rounded-2xl border shadow-sm p-6`}>
      <h2 className={`text-lg font-bold ${titleStyle} mb-4`}>
        Recent Transactions
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-100'} ${textStyle} text-xs uppercase font-semibold`}>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Amount</th>
            </tr>
          </thead>

          <tbody className={`divide-y ${dividerStyle}`}>
            {recentList.length === 0 ? (
              <tr>
                <td colSpan="4" className={`py-6 text-center ${textStyle}`}>
                  No recent transactions recorded.
                </td>
              </tr>
            ) : (
              recentList.map((tx, index) => (
                <tr key={tx.id || `transaction-${index}`}>
                  <td className={`py-3.5 px-4 font-semibold ${titleStyle}`}>
                    {tx.desc || tx.description || tx.source || 'Expense'}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs ${
                      isDarkMode
                        ? 'bg-slate-700 text-slate-200'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {typeof tx.category === 'object'
                        ? tx.category?.name || 'Uncategorized'
                        : tx.category || 'Uncategorized'}
                    </span>
                  </td>

                  <td className={`py-3.5 px-4 ${textStyle} text-xs`}>
                    {tx.date || tx.expense_date}
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                    -{formatCurrency(tx.amount, currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
