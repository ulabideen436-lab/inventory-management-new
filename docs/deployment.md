# Deployment Guide

This guide covers how to deploy your StoreFlow application to various platforms.

## Firebase Hosting (Recommended)

Firebase Hosting provides fast, secure hosting for your web app with SSL certificates and global CDN.

### Prerequisites

1. **Firebase CLI**: Install if you haven't already
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

### Build and Deploy

1. **Build the production version**:
   ```bash
   npm run build
   ```

2. **Initialize Firebase Hosting** (if not already done):
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory to `build`
   - Configure as single-page app: Yes
   - Set up automatic builds with GitHub: Optional

3. **Deploy to Firebase**:
   ```bash
   firebase deploy
   ```

4. **Deploy specific services**:
   ```bash
   firebase deploy --only hosting
   firebase deploy --only firestore:rules
   firebase deploy --only storage:rules
   ```

### Custom Domain (Optional)

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Enter your domain name
4. Follow the DNS configuration instructions

## Netlify Deployment

### Method 1: Drag and Drop

1. Build your project:
   ```bash
   npm run build
   ```

2. Go to [Netlify](https://netlify.com)
3. Drag the `build` folder to the deploy area

### Method 2: Git Integration

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `build`
5. Add environment variables if needed

## Vercel Deployment

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

Or connect your GitHub repository to Vercel dashboard.

## Environment Variables

### Production Environment Variables

Create a `.env.production` file:

```bash
REACT_APP_FIREBASE_API_KEY=your-production-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-production-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=your-production-app-id
```

### Platform-Specific Environment Variables

#### Firebase Hosting
Environment variables are handled through the Firebase config.

#### Netlify
1. Go to Site Settings > Environment Variables
2. Add your `REACT_APP_*` variables

#### Vercel
1. Go to Project Settings > Environment Variables
2. Add your variables for Production environment

## Pre-deployment Checklist

- [ ] **Firebase Configuration**: Verify all Firebase services are properly configured
- [ ] **Security Rules**: Test and deploy Firestore and Storage rules
- [ ] **Environment Variables**: Set all required environment variables
- [ ] **Build Test**: Run `npm run build` locally to ensure it builds without errors
- [ ] **Functionality Test**: Test key features in production build
- [ ] **Authentication**: Verify authentication works in production
- [ ] **Database Rules**: Ensure security rules are properly configured
- [ ] **Performance**: Run Lighthouse audit for performance optimization

## Post-deployment Steps

### 1. Create Admin User

After deployment, create your first admin user:

1. Go to your deployed app
2. Register a new user
3. Go to Firebase Console > Authentication
4. Find the user and copy their UID
5. Go to Firestore Database
6. Find the user document and update the `role` field to `admin`

### 2. Set Up Firestore Indexes

If you encounter errors about missing indexes:

1. Check the browser console for index creation links
2. Click the links to create the required indexes
3. Or manually create indexes in Firebase Console > Firestore > Indexes

### 3. Configure Domains

Update your Firebase Auth configuration:

1. Go to Firebase Console > Authentication > Settings
2. Add your production domain to "Authorized domains"

### 4. Monitor Performance

1. Set up Firebase Performance Monitoring
2. Configure Google Analytics (if enabled)
3. Monitor error reports in Firebase Crashlytics

## Troubleshooting Deployment Issues

### Build Errors

1. **Module not found errors**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Memory issues during build**:
   ```bash
   export NODE_OPTIONS="--max_old_space_size=4096"
   npm run build
   ```

### Firebase Deployment Issues

1. **Permission denied**:
   ```bash
   firebase login --reauth
   ```

2. **Project not found**:
   - Check `.firebaserc` file
   - Verify project ID is correct

3. **Rules deployment failed**:
   ```bash
   firebase deploy --only firestore:rules --debug
   ```

### Runtime Errors

1. **Firebase not initialized**:
   - Check Firebase configuration
   - Verify all required environment variables

2. **Authentication errors**:
   - Check authorized domains in Firebase Console
   - Verify authentication is enabled

3. **Database permission errors**:
   - Check Firestore security rules
   - Ensure user has proper role assigned

## Performance Optimization

### Code Splitting

The app already uses React.lazy for code splitting. Additional optimizations:

```javascript
// Example: Lazy load heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```

### Bundle Analysis

Analyze your bundle size:

```bash
npm install --save-dev webpack-bundle-analyzer
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

### Firebase Performance

1. **Firestore Optimization**:
   - Use composite indexes for complex queries
   - Implement pagination for large datasets
   - Use real-time listeners judiciously

2. **Storage Optimization**:
   - Compress images before upload
   - Use appropriate file formats
   - Implement lazy loading for images

## Monitoring and Maintenance

### Health Checks

Set up monitoring for:
- Application uptime
- Firebase quota usage
- Error rates
- Performance metrics

### Backup Strategy

1. **Firestore Backup**:
   ```bash
   gcloud firestore export gs://your-bucket/backup-folder
   ```

2. **Regular exports**: Set up automated backups using Cloud Functions

### Updates and Maintenance

1. **Dependencies**: Regularly update npm packages
2. **Firebase SDK**: Keep Firebase SDK updated
3. **Security**: Monitor security advisories
4. **Performance**: Regular performance audits

## Scaling Considerations

### Firebase Limits

Monitor these Firebase limits:
- Firestore: 1 million document reads/day (free tier)
- Authentication: 10k verifications/month (free tier)
- Hosting: 1GB storage, 10GB transfer/month (free tier)

### Upgrade Paths

When you outgrow the free tier:
1. **Blaze Plan**: Pay-as-you-go pricing
2. **Firebase Extensions**: Add advanced functionality
3. **Cloud Functions**: Server-side processing

## Support and Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)

---

For additional help, create an issue in the project repository or consult the Firebase community forums.