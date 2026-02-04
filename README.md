# WDP_G2
🎬 Movie Ticket Booking Web (WDP_G2)
Introduction
The Movie Ticket Booking Web project allows users to:

View the list of currently showing and upcoming movies.

Check showtimes by cinema, date, and screening session.

Book tickets online and select seats.

Make payments online or at the counter.

Manage account information and booking history.

The application is built using the Fullstack JavaScript model with Frontend (React) and Backend (Node.js/Express + MongoDB).

Project Structure
Mã
WDP_G2/
│
├── frontend/        # User interface (ReactJS)
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── README.md
│
├── server/          # Backend API (Node.js + Express)
│   ├── config/      # Database and environment configuration
│   ├── controllers/ # Business logic
│   ├── models/      # Data models (MongoDB)
│   ├── routes/      # API definitions
│   ├── server.js    # Server entry point
│   └── README.md
│
└── README.md        # Main project documentation
Technologies Used
Frontend: ReactJS, React Router, Axios, TailwindCSS/Bootstrap.

Backend: Node.js, Express.js, MongoDB (Mongoose).

Authentication: JWT, OTP via email/SMS.

Deployment: Docker, Vercel/Netlify (frontend), Heroku/Render (backend).

Installation and Running the Project
1. Clone the repository
bash
git clone https://github.com/username/WDP_G2.git
cd WDP_G2
2. Install dependencies
Frontend:

bash
cd frontend
npm install
Backend:

bash
cd server
npm install
3. Configure environment variables
Create a .env file inside the server/ directory:

Mã
PORT=5000
MONGO_URI=mongodb://localhost:27017/cinema_booking
JWT_SECRET=your_secret_key
EMAIL_SERVICE=your_email_service
EMAIL_USER=your_email
EMAIL_PASS=your_password
4. Run the application
Backend:

bash
cd server
npm start
Frontend:

bash
cd frontend
npm start
The application will run at:

Frontend: http://localhost:3000

Backend API: http://localhost:5000

Key Features
📌 Register/Login with OTP verification.

🎥 Movie list, trailers, detailed descriptions.

🗓️ Showtimes by cinema, date, and session.

🎟️ Online ticket booking with seat selection.

💳 Online/offline payment options.

👤 Account management and booking history.

🔑 Admin dashboard: manage movies, showtimes, cinemas.

Contribution
Fork the project.

Create a new branch:

bash
git checkout -b feature/feature-name
Commit your changes:

bash
git commit -m "Add feature X"
Push the branch:

bash
git push origin feature/feature-name
Create a Pull Request.

License
This project is released under the MIT License.
You are free to use, modify, and distribute it as long as the copyright notice is retained.
