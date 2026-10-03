# Expense Management Platform — Backend

## Overview

The backend of the Expense Management Platform provides the REST API and server-side functionality for managing users, expenses, categories, budgets, and expense summaries.

The backend is built with Flask and PostgreSQL and communicates with the frontend through REST API endpoints.

---

## Technology Stack

- Python
- Flask
- Flask-SQLAlchemy
- SQLAlchemy
- PostgreSQL
- Psycopg
- Flask-JWT-Extended
- Flask-Limiter
- python-dotenv

---

## Backend Responsibilities

The backend is responsible for:

- User registration and authentication
- Password hashing
- JWT-based authentication
- Expense management
- Expense filtering
- CSV expense export
- Category management
- Budget management
- Monthly expense summaries
- Category-based expense summaries
- PostgreSQL database communication
- Input validation
- Error handling
- API rate limiting
- Application health checks
- Database health checks

---

## Architecture

The backend is part of the following application architecture:

```text
React Frontend
      |
      | HTTP / REST API
      v
Nginx Reverse Proxy
      |
      v
Flask REST API
      |
      | SQLAlchemy / Psycopg
      v
PostgreSQL Database

The frontend communicates with the Flask REST API, while the Flask backend communicates with PostgreSQL.

The frontend does not communicate directly with the PostgreSQL database.
Project Structure
backend/
│
├── docs/
│   └── troubleshooting.md
│
├── models/
│   ├── __init__.py
│   ├── user.py
│   ├── category.py
│   ├── expense.py
│   ├── budget.py
│   └── monthly_summary.py
│
├── routes/
│   ├── auth.py
│   ├── categories.py
│   ├── expenses.py
│   ├── budgets.py
│   └── summaries.py
│
├── utils/
│   └── responses.py
│
├── app.py
├── extensions.py
├── requirements.txt
└── README.md
Directory Responsibilities
Directory/File	Purpose
models/	SQLAlchemy database models
routes/	REST API endpoints
utils/	Shared backend utilities
docs/	Development and troubleshooting documentation
app.py	Flask application configuration and application entry point
extensions.py	Flask-SQLAlchemy and Flask-Limiter extensions
requirements.txt	Python dependencies
README.md	Backend documentation

1. Clone the Repository
git clone https://github.com/AyomideADEJARE1/Expense-Management-Platform.git

Move into the backend directory:

cd Expense-Management-Platform/backend
2. Create a Virtual Environment

Create a Python virtual environment:

python -m venv .venv
Windows PowerShell

Activate the virtual environment:

.\.venv\Scripts\Activate.ps1

If PowerShell blocks the activation script, run:

Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

Then activate the environment again:

.\.venv\Scripts\Activate.ps1
3. Install Dependencies

Install the backend dependencies:

python -m pip install -r requirements.txt
Environment Configuration

The backend uses environment variables for application configuration and database credentials.

Create a .env file for local development.

Example:

FLASK_ENV=development
FLASK_DEBUG=false
SECRET_KEY=your-secret-key

POSTGRES_DB=expense_management
POSTGRES_USER=expense_user
POSTGRES_PASSWORD=your-database-password

Do not place real passwords, secret keys, or other credentials in this README.

The .env file should not be committed to Git.

A .env.example file is provided as a template for the required configuration variables.

Database

The backend uses PostgreSQL as its relational database.

The main database entities include:

Users
Expense categories
Expenses
Budgets
Monthly expense summaries

The Flask application communicates with PostgreSQL through SQLAlchemy and Psycopg.

Financial amounts are stored using PostgreSQL's NUMERIC(12,2) type.

Running the Backend

From the backend directory, make sure the virtual environment is activated and run:

python .\app.py

The Flask development server runs locally at:

http://127.0.0.1:5000
API Endpoints
Authentication
Register
POST /api/auth/register

Creates a new user account.

Login
POST /api/auth/login

Authenticates a user and returns a JWT access token.

Current User
GET /api/auth/me

Returns information about the currently authenticated user.

Categories
Method	Endpoint	Description
GET	/api/categories	Get all categories
POST	/api/categories	Create a category
GET	/api/categories/<category_id>	Get one category
PUT	/api/categories/<category_id>	Update a category
DELETE	/api/categories/<category_id>	Delete a category
Expenses
Method	Endpoint	Description
GET	/api/expenses	Get authenticated user's expenses
POST	/api/expenses	Create an expense
GET	/api/expenses/<expense_id>	Get one expense
PUT	/api/expenses/<expense_id>	Update an expense
DELETE	/api/expenses/<expense_id>	Delete an expense
GET	/api/expenses/export	Export expenses as CSV
Expense Filtering

Expenses can be filtered by category or month.

Example:

GET /api/expenses?category_id=1

Example:

GET /api/expenses?month=2026-10
Budgets
Method	Endpoint	Description
GET	/api/budgets	Get authenticated user's budgets
POST	/api/budgets	Create a budget
GET	/api/budgets/<budget_id>	Get one budget
PUT	/api/budgets/<budget_id>	Update a budget
DELETE	/api/budgets/<budget_id>	Delete a budget

Budgets can be created for an entire month or for a specific expense category.

Expense Summaries
Monthly Summary
GET /api/summaries/monthly

Example:

GET /api/summaries/monthly?month=2026-10

Returns the total expenses for the specified month.

Category Summary
GET /api/summaries/category

Example:

GET /api/summaries/category?month=2026-10

Returns expenses grouped by category.

Health Checks
Application Health
GET /health

Used to verify that the Flask application is running.

Database Health
GET /health/db

Used to verify that the backend can communicate with PostgreSQL.

Authentication

The backend uses JWT-based authentication.

Available authentication endpoints:

POST /api/auth/register
POST /api/auth/login
GET /api/auth/me

Protected endpoints require an Authorization header:

Authorization: Bearer <access_token>

The backend handles:

Missing authentication tokens
Invalid authentication tokens
Expired authentication tokens

Passwords are hashed before being stored in the database.

Validation

The backend validates incoming data before storing it in the database.

Examples include:

Required fields
Email values
Category IDs
Monetary amounts
Expense dates
Budget months
Duplicate budgets
Authentication data
Monetary Validation

Expense and budget amounts must:

Be valid numbers
Be greater than zero
Contain no more than two decimal places

For example:

1500.50

is accepted.

While:

1500.567

is rejected.

Security

Security measures implemented in the backend include:

Password hashing
JWT authentication
Authentication-protected endpoints
User-specific data access
Environment-based secrets
.env excluded from Git
Authentication rate limiting
Input validation
Database transaction rollback on errors

Users can only access their own expenses and budgets through authenticated requests.

API Response Format

The backend uses a consistent response structure.

Successful Response
{
    "success": true,
    "message": "Operation successful",
    "data": {}
}
Error Response
{
    "success": false,
    "message": "Error message",
    "data": null
}
Testing

The backend was tested during development for:

Application health
Database connectivity
User registration
User login
JWT authentication
Invalid authentication tokens
Expired authentication tokens
Rate limiting
Category CRUD operations
Expense CRUD operations
Expense filtering
CSV export
Budget CRUD operations
Duplicate budget validation
Monthly summaries
Category summaries
Input validation

Python source files were also checked using:

python -m compileall .\routes .\models .\utils .\app.py .\extensions.py

No compilation errors were reported.

Development Workflow

Backend development is performed on the:

backend-development

branch.

The development workflow is:

Create / update backend
        |
        v
Test changes
        |
        v
Commit changes
        |
        v
Push backend-development
        |
        v
Create Pull Request
        |
        v
Code Review
        |
        v
Merge into main

Changes should not be pushed directly to main.

Development Documentation

A detailed record of development problems, troubleshooting steps, solutions, verification, and lessons learned is available in:

Backend Troubleshooting Log

