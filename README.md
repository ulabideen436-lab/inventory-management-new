# StoreFlow - Inventory Management System

A modern, professional inventory management system built with React and Firebase.

## 🚀 Features

- **Product Management**: Add, edit, delete, and track products
- **Real-time Data**: Firebase Firestore for real-time synchronization
- **User Authentication**: Secure login and user management
- **Point of Sale (POS)**: Complete cashier system
- **Reporting**: Generate detailed reports and analytics
- **PDF Export**: Export filtered product data to PDF
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router DOM
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Styling**: CSS3, Responsive Design
- **PDF Generation**: jsPDF
- **State Management**: React Context API + Custom Hooks

## 📁 Project Structure

```
storeflow/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/             # Main application pages
│   ├── hooks/             # Custom React hooks
│   ├── context/           # React Context providers
│   ├── services/          # Firebase services
│   ├── utils/             # Utility functions
│   ├── styles/            # CSS styles
│   └── config/            # Application configuration
├── firebase/              # Firebase configuration files
└── docs/                  # Documentation
```

## 🔥 Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication (Email/Password)
4. Copy your Firebase config to `src/config/firebase.js`

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/storeflow.git
   cd storeflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Update `src/config/firebase.js` with your Firebase config

4. **Start development server**
   ```bash
   npm start
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📚 Documentation

- [Getting Started Guide](docs/getting-started.md)
- [Firebase Setup](docs/firebase-setup.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for providing excellent backend services
- React team for the amazing framework
- Contributors and community members

---

**Made with ❤️ by StoreFlow Team**
