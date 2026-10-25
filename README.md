# Task Manager — SYD204 Practical

A complete full-stack Task Management application built for the SYD204 backend practical. This project features a Node.js/Express REST API, an MVC architecture, a MySQL database hosted on Aiven Cloud, and a vanilla JavaScript frontend.

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** MySQL 8 (Aiven Cloud), `mysql2/promise`
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (Fetch API)
- **Configuration:** `dotenv`
- **Development Tooling:** `nodemon` it is an automatic server restarter.

## Project Structure

```text
TaskAPIs-main/
├── public/                  # Frontend files (HTML, CSS, JS)
│   ├── index.html
│   ├── style.css
│   └── script.js
├── database/                # SQL schema
│   └── schema.sql
├── src/                     # Backend source code (MVC)
│   ├── controllers/
│   │   └── taskController.js
│   ├── models/
│   │   └── taskModel.js
│   ├── routes/
│   │   └── taskRoutes.js
│   └── db.js                # Database connection pool
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
├── server.js                # Application entry point
├── test-db.js               # Database connection test script
└── README.md