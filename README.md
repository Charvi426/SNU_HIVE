SNU Hive – Hostel Management System for Shiv Nadar University

SNU Hive is a full-stack web application designed to streamline hostel management and support services at Shiv Nadar University. It brings together students, wardens, and support staff onto a single platform to improve efficiency and communication—eliminating the need for outdated systems like excessive emails and WhatsApp forwards.

Live Demo - https://snu-hivefrontend.onrender.com/

User Roles

- Student: Can log complaints, raise food requests, and report/view lost items.
- Warden: Approves/rejects food requests.
- Support Admin: Handles complaints based on their department (e.g., maintenance, security).

Features

1. 🛠 Complaint Management
- Students can log complaints under categories like maintenance, Wi-Fi, cleaning, etc.
- Support admins see only the complaints relevant to their department.
- Status tracking for raised issues.

2. 🍱 Food Request System
- Sick students can request meals from the mess.
- Requests are routed to the warden for approval or rejection.
- Request history is maintained.

3. 📦 Lost and Found
- Students can report lost or found items with images and descriptions.
- Public board for browsing and claiming items.

Tech Stack

| Layer           | Technology                         |
|----------------|-------------------------------------|
| **Frontend**    | React.js + Vite                    |
| **Backend**     | Node.js, Express.js                |
| **Database**    | MySQL                              |
| **Authentication** | JWT (JSON Web Tokens)           |
| **Image Uploads** | multer (stored locally)          |

Prerequisites

- Node.js and npm
- MySQL
- Git

1. Clone the repository
```bash
git clone https://github.com/Charvi426/SNUHive.git
cd SNUHive
```
2. Backend Setup
```
cd backend
npm install
```

Create a .env file and configure:

```
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=snu_hive
JWT_SECRET=your_jwt_secret
```

Start the backend:
```
node backend.js
```

3. Frontend Setup
```
cd frontend
npm install
npm run dev
```
Screenshots

![Homepage](Images/HomePage.png)
![Login Page](Images/LoginPage.png)
![Student Dashboard](Images/StudentDshboard.png)
![Lost and Found](Images/Lost&Found.png)
![Support Admin Dashboard](Images/SupportAdminDashboard.png)


Future Plans
Here are some features we are planning to add in upcoming versions:

🔐 Forgot Password Feature:
To help users securely reset their passwords.

🔔 Notifications:
Real-time alerts for status updates, approvals, and more.

🧺 Washing Machine Slot Booking:
Students will be able to book slots to use washing machines in their hostels.
