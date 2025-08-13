# Phase 1 Testing Guide

## 🚀 Quick Start
1. Run `npm run dev`
2. Open http://localhost:5173
3. Sign in with test credentials

## 📋 Test Scenarios

### Scenario 1: Regular User Flow
1. Sign in as regular user
2. Go to "Add Bottle" tab
3. Click "Start Scanning"
4. Scan QR code: `bin_001`
5. Wait for admin to simulate identification
6. Confirm identification is correct
7. Verify points awarded

### Scenario 2: Admin Demo Flow
1. Sign in as admin user
2. Go to "Add Bottle" tab
3. Scan QR code: `bin_001`
4. On waiting screen, select "Plastic" from dropdown
5. Click "Simulate Identification"
6. Verify identification screen shows "Plastic"
7. Click "No, that's wrong!"
8. Select "Glass" as correction
9. Submit correction
10. Verify alert created in Firebase

### Scenario 3: Error Handling
1. Try scanning invalid QR codes
2. Test network disconnection
3. Verify error messages are user-friendly

## ✅ Expected Results

### Waiting Screen
- ✅ SortiMate logo displays correctly
- ✅ Loading animation works
- ✅ Admin demo section (admin only)
- ✅ Responsive on mobile

### Identification Confirmation
- ✅ Bottle type displays with emoji
- ✅ Confidence percentage shows
- ✅ Both buttons work correctly
- ✅ Bin details display

### Correction Form
- ✅ Shows original incorrect identification
- ✅ Dropdown with all bottle types
- ✅ Submit button works
- ✅ Creates Firebase alert

### Points System
- ✅ Points awarded for correct identification
- ✅ No points for corrections
- ✅ User stats update in dashboard

## 🐛 Common Issues to Check

1. **Camera Access:** Ensure browser allows camera access
2. **Firebase Connection:** Check console for Firebase errors
3. **Mobile Responsiveness:** Test on different screen sizes
4. **Admin Role:** Verify admin users see demo section
5. **State Management:** Ensure proper transitions between screens

## 📊 Success Metrics

- [ ] All components load without errors
- [ ] QR scanner works on desktop and mobile
- [ ] Admin demo creates realistic waste events
- [ ] Points system updates user stats correctly
- [ ] Alerts are created in Firebase with correct structure
- [ ] UI is responsive and user-friendly
- [ ] Error handling works gracefully

## 🔧 Debug Commands

```bash
# Check for build errors
npm run build

# Check for linting issues
npm run lint

# View Firebase console
# Go to Firebase Console > Firestore > Alerts collection
``` 