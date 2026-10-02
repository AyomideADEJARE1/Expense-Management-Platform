# Expense Tracker Web Application

A full-featured, responsive React-based financial management dashboard designed to track income, monitor expenses, create category spending limits, and generate monthly financial reports.

# Key Features
Interactive Dashboard: Core financial overview with summary metrics, income vs. expense visual charts, category spending distributions, and quick view of recent transactions.

Income Management: Track earnings across custom categories, log dates, add custom notes, and filter income entries.   Expense 

Tracking & Linkage: Log daily expenses with custom titles, optional notes, category tags, and direct linkages to specific budgets.   

Budget Limits & Automated Over-Budget Alerts: Set spending caps per category with visual progress indicators and active alert notifications when limits are exceeded.

Dynamic Category Customization: Manage income and expense categories complete with color palettes, Lucide icons, and protected system default locks.   

Centralized Transaction Ledger: Unified list showing all income and expense items with search, category filtering, and item deletion.   

Monthly Financial Reports: Automated grouping by month (e.g., YYYY-MM), savings rate calculations, category breakdowns, and export/print functionality.   

Global Search Engine: Real-time search across transactions, active budgets, and categories with instant navigation.   State 

Persistence & Dark Mode: Built-in dark mode toggle and localStorage persistence across sessions for all entities.   Authentication & Toast Feedback: User authentication context modal and toast system with confirmation modals for safe deletions.   

# System Architecture & Component Mapping

src/
├── App.jsx                       # Main application state, search, notifications & dark mode
├── Auth.jsx                      # User authentication provider and auth modal
├── Components/
│   ├── Layout/
│   │   ├── Sidebar.jsx           # Main navigation drawer
│   │   └── Header.jsx            # Top bar, notifications, search bar, theme toggle
│   ├── Dashboard/
│   │   ├── SummaryCards.jsx      # Metric cards (Total Income, Expenses, Net)
│   │   ├── IncomeVsExpensesChart # Bar/Area financial comparison chart
│   │   ├── CategoryDonutChart    # Category spending distribution chart
│   │   ├── RecentTransactions    # Dashboard transaction preview table
│   │   └── BudgetOverview        # Quick budget status widget
│   └── ConfirmationModal.jsx     # Reusable deletion confirmation modal
├── context/
│   └── ToastContext.jsx          # Application-wide toast notifications
└── pages/
    ├── Dashboard.jsx             # Main dashboard view
    ├── Income.jsx                # Income management page
    ├── Expenses.jsx              # Expense management page
    ├── Budgets.jsx               # Budget limits and progress tracker
    ├── Categories.jsx            # Category setup and icon management
    ├── Transactions.jsx          # Unified ledger page
    └── Reports.jsx               # Monthly summaries & breakdown modal
    
# Code Base Highlights & Business Logic

Automatic Budget Recalculation & Alert System (App.jsx & Budgets.jsx):
When an expense is recorded, handleAddExpense automatically recalculates total spending for the matching budget category and fires a Budget Alert ⚠️ notification if the limit is exceeded.

Categorization & Custom Aesthetics (Categories.jsx):
Categories support customized colors (Blue, Emerald, Orange, Purple, Pink, Amber, Red) and dynamic icon mapping (Lucide-react). System categories are locked against accidental modification or deletion.

Data Persistency Layer (App.jsx):
Uses React useEffect hooks synced with browser localStorage for zero-backend persistent state across sessions:   expense_tracker_transactions   
expense_tracker_incomes
expense_tracker_expenses
expense_tracker_budgets
expense_tracker_categories

Monthly Reports Calculation (Reports.jsx)
Dynamically aggregates transaction objects into monthly buckets (YYYY-MM), computing totalIncome, totalExpense, netSavings, savings percentage rates, and individual category spending breakdowns.

#Tech Stack
Frontend Library: React (Hooks: useState, useEffect, useMemo)   
Styling & UI: Tailwind CSS   
Icons: Lucide React (lucide-react)   
Build Tool: Vite   
State Management: React Context API (AuthProvider, ToastProvider)
