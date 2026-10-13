import React from 'react';
import SummaryCards from '../Components/Dashboard/SummaryCards';
import IncomeVsExpensesChart from '../Components/Dashboard/IncomeVsExpensesChart';
import CategoryDonutChart from '../Components/Dashboard/CategoryDonutChart';
import RecentTransactions from '../Components/Dashboard/RecentTransactions';
import BudgetOverview from '../Components/Dashboard/BudgetOverview';

export default function Dashboard({ 
  budgets = [], 
  incomes = [], 
  transactions = [], 
  toggleMobileSidebar 
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-h-screen">
      
      
      {/* Pass incomes, transactions, and budgets to Summary Cards */}
      <SummaryCards 
        incomes={incomes} 
        transactions={transactions} 
        budgets={budgets} 
      />

      {/* Row 1: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          {/* Pass incomes and transactions to the Bar/Area Chart */}
          <IncomeVsExpensesChart 
            incomes={incomes} 
            transactions={transactions} 
          />
        </div>
        <div>
          {/* Pass budgets & transactions to the Donut Chart */}
          <CategoryDonutChart 
            budgets={budgets} 
            transactions={transactions} 
          />
        </div>
      </div>

      {/* Row 2: Transactions & Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Pass live transactions to Recent Transactions */}
          <RecentTransactions transactions={transactions} />
        </div>
        <div>
          <BudgetOverview budgets={budgets} />
        </div>
      </div>
    </div>
  );
}