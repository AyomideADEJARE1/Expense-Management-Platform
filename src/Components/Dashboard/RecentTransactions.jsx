import React from 'react';

export default function RecentTransactions({ transactions = [] }) {
  const recentList = transactions.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase font-semibold">
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentList.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-6 text-center text-gray-400">
                  No recent transactions recorded.
                </td>
              </tr>
            ) : (
              recentList.map((tx) => (
                <tr key={tx.id || Math.random()}>
                  <td className="py-3.5 px-4 font-semibold text-gray-900">{tx.desc || tx.source}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs">
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs">{tx.date}</td>
                  <td className={`py-3.5 px-4 text-right font-bold ${
                    tx.type === 'Income' ? 'text-emerald-600' : 'text-gray-900'
                  }`}>
                    {tx.type === 'Income' ? '+' : '-'}₦{Number(tx.amount || 0).toLocaleString()}
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