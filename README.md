# Virtual Queue Management System

A full-stack web application designed to streamline student advising services through an intelligent queue management system. Built as a modern replacement for traditional queue systems with real-time updates and comprehensive admin controls.

## 🚀 Live Demo

**Frontend:** [https://virtual-advising-queue.vercel.app/](https://virtual-advising-queue.vercel.app/)  
**Backend API:** [Deployed on Render]([https://your-backend-url.render.com](https://virtual-advising-queue.onrender.com))

## 📋 Features

### Student Interface
- **Multi-Queue System**: Join Academic, Career, or Financial Aid queues
- **Real-Time Updates**: Live position tracking and wait time estimates
- **Queue Management**: Join, leave, or defer appointments seamlessly
- **Mobile Responsive**: Optimized for all device sizes
- **Session Persistence**: Maintains queue position across page refreshes

### Admin Dashboard
- **Live Queue Monitoring**: Real-time view of all active queues
- **Student Management**: Handle no-shows, call next student, manage appointments
- **Analytics Dashboard**: Queue statistics and performance metrics
- **CSV Export**: Download queue data and analytics reports
- **Multi-Queue Control**: Manage all queue types from one interface

### Technical Features
- **Real-Time Communication**: Socket.IO for instant updates
- **Session Management**: Secure user session handling
- **Data Persistence**: MongoDB for reliable data storage
- **Cloud Deployment**: Production-ready deployment pipeline

## 🛠️ Tech Stack

### Frontend
- **React.js** - Component-based UI framework
- **Socket.IO Client** - Real-time communication
- **CSS3** - Custom styling and responsive design
- **JavaScript (ES6+)** - Modern JavaScript features

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **CORS** - Cross-origin resource sharing

### Deployment & DevOps
- **Vercel** - Frontend hosting and deployment
- **Render** - Backend hosting and deployment
- **MongoDB Atlas** - Cloud database hosting
- **Git** - Version control with automated deployment

## 🚀 Getting Started

### Prerequisites
```bash
node.js
npm
MongoDB (local) or MongoDB Atlas account
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/nityzt/virtual_advising_queue.git
```

2. **Install Backend Dependencies**
```bash
cd server
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../client
npm install
```

4. **Environment Variables**

Create `.env` file in the backend directory:
```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
NODE_ENV=development
```

5. **Run the Application**

Backend (Terminal 1):
```bash
cd server
npm start
```

Frontend (Terminal 2):
```bash
cd client
npm start
```

The application will be available at `http://localhost:3000`

## 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   MongoDB Atlas │
│     (Vercel)    │◄──►│    (Render)     │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────Socket.IO───────┘
              (Real-time)
```

## 🎯 Key Implementation Highlights

- **Component Architecture**: Modular React components for scalability
- **State Management**: Efficient state handling with React hooks
- **Real-Time Sync**: Socket.IO ensures all clients stay synchronized
- **Error Handling**: Comprehensive error handling and user feedback
- **Responsive Design**: Mobile-first approach with CSS Grid/Flexbox
- **Production Ready**: Environment-specific configurations and optimizations

## 📱 Usage

### For Students
1. Visit the application URL
2. Click on "Student Login"
3. Enter your school email and full name
4. Select appropriate queue (Academic/Career/Financial Aid)
5. Monitor your position and estimated wait time
6. Receive real-time notifications about your status (pending implementation)

### For Administrators
1. Access admin dashboard via `/admin` route
2. Monitor all active queues in real-time
3. Call next students, handle no-shows
4. Export queue data and view analytics
5. Manage multiple queue types simultaneously

## 🔧 Development Notes

This project was developed as a proof-of-concept to demonstrate:
- Full-stack development capabilities
- Real-time application architecture
- Modern deployment practices
- User experience design for institutional software

**Development Timeline**: Built in 1 week as a learning exercise for modern web technologies.

## 🚦 Future Enhancements

- [ ] SMS/Email notification system
- [ ] Appointment scheduling integration
- [ ] Advanced analytics and reporting
- [ ] Integration with university systems
- [ ] Enhanced admin role management

## 🤝 Contributing

This is a prototype project developed for learning purposes. While it demonstrates functional queue management, it would require additional security, testing, and features for production use in an institutional environment.
