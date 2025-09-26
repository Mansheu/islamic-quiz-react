import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  type User,
  type UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, firestore, googleProvider, storage } from './config';
import { getCustomErrorMessage } from '../utils/errorMessages';

// Helper function to handle Firebase errors gracefully
const handleFirebaseError = (error: unknown, context: string = 'Firebase operation'): never => {
  // Ignore AbortErrors as they're normal cleanup operations
  if (error && typeof error === 'object' && ('name' in error && error.name === 'AbortError' || 'code' in error && error.code === 'cancelled')) {
    console.log(`🔄 ${context} was cancelled (normal cleanup)`);
    throw new Error('Operation cancelled'); // Still throw but with a cleaner message
  }
  
  // Log the original error for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.error(`❌ ${context} error:`, error);
  }
  
  // Get user-friendly error message
  const userFriendlyMessage = getCustomErrorMessage(error);
  throw new Error(userFriendlyMessage);
};

// Interface for user profile data
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  location?: string; // Added location field
  totalScore: number;
  highScores: Record<string, number>;
  timedChallengeResults?: Record<string, {
    challengeId: string;
    score: number;
    grade: string;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number;
    accuracy: number;
    completedAt: Date;
  }>;
  joinedAt: Date;
  lastPlayed: Date;
}

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<User> => {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    await createUserProfile(user, { displayName });
    
    return user;
  } catch (error) {
    return handleFirebaseError(error, 'Email sign up');
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    return handleFirebaseError(error, 'Email sign in');
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const userCredential: UserCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;
    
    // Check if user profile exists, if not create one
    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    if (!userDoc.exists()) {
      await createUserProfile(user);
    }
    
    return user;
  } catch (error) {
    // Special handling for popup-related errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        throw new Error('Popup was blocked or closed. Please try again and allow popups for this site.');
      }
      if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Another sign-in popup is already open. Please close it and try again.');
      }
    }
    return handleFirebaseError(error, 'Google sign in');
  }
};

// Sign out
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    handleFirebaseError(error, 'Sign out');
  }
};

// Create user profile in Firestore with better error handling
export const createUserProfile = async (
  user: User, 
  additionalData: { displayName?: string } = {}
): Promise<void> => {
  if (!user) {
    console.log('❌ No user provided to createUserProfile');
    return;
  }
  
  console.log('🔄 Creating user profile for:', user.email);
  
  try {
    const userDocRef = doc(firestore, 'users', user.uid);
    const userSnapshot = await getDoc(userDocRef);
    
    if (!userSnapshot.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = new Date();
      
      const userProfile: UserProfile = {
        uid: user.uid,
        email: email || '',
        displayName: additionalData.displayName || displayName || 'Anonymous',
        ...(photoURL && { photoURL }), // Only include photoURL if it exists
        totalScore: 0,
        highScores: {},
        joinedAt: createdAt,
        lastPlayed: createdAt
      };
      
      console.log('📝 Setting user document:', userProfile);
      await setDoc(userDocRef, userProfile);
      console.log('✅ User profile created successfully');
    } else {
      console.log('ℹ️ User profile already exists');
    }
  } catch (error) {
    handleFirebaseError(error, 'Creating user profile');
  }
};

// Update user quiz results
export const updateUserQuizResults = async (
  userId: string,
  topic: string,
  score: number
): Promise<void> => {
  try {
    console.log('🔄 Updating quiz results for user:', userId);
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      const currentHighScore = userData.highScores?.[topic] || 0;
      const newHighScore = Math.max(currentHighScore, score);
      
      const updatedData = {
        ...userData,
        totalScore: (userData.totalScore || 0) + score,
        highScores: {
          ...(userData.highScores || {}),
          [topic]: newHighScore
        },
        lastPlayed: new Date()
      };
      
      console.log('💾 Updating user document with:', {
        userId,
        topic,
        score,
        newHighScore,
        newTotalScore: updatedData.totalScore
      });
      
      await setDoc(userDocRef, updatedData);
      console.log('✅ Quiz results updated successfully!');
    } else {
      console.log('❌ User document does not exist. Creating it first...');
      
      // If user document doesn't exist, create a basic one and then update
      const basicProfile: UserProfile = {
        uid: userId,
        email: '',
        displayName: 'Anonymous',
        totalScore: score,
        highScores: { [topic]: score },
        joinedAt: new Date(),
        lastPlayed: new Date()
      };
      
      await setDoc(userDocRef, basicProfile);
      console.log('✅ Created user profile and saved quiz results!');
    }
  } catch (error) {
    handleFirebaseError(error, 'Updating user quiz results');
  }
};

// Update user timed challenge results
export const updateUserTimedChallengeResults = async (
  userId: string,
  challengeResult: {
    challengeId: string;
    score: number;
    grade: string;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number;
    accuracy: number;
    completedAt: string;
  }
): Promise<void> => {
  try {
    console.log('🔄 Updating timed challenge results for user:', userId);
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      
      // Initialize timedChallengeResults if it doesn't exist
      const timedChallengeResults = userData.timedChallengeResults || {};
      
      // Store the challenge result
      timedChallengeResults[challengeResult.challengeId] = {
        ...challengeResult,
        completedAt: new Date(challengeResult.completedAt)
      };
      
      // Update total score (add timed challenge score to regular score)
      const updatedData = {
        ...userData,
        totalScore: (userData.totalScore || 0) + challengeResult.score,
        timedChallengeResults,
        lastPlayed: new Date()
      };
      
      console.log('💾 Updating user document with timed challenge result:', {
        userId,
        challengeId: challengeResult.challengeId,
        score: challengeResult.score,
        grade: challengeResult.grade,
        newTotalScore: updatedData.totalScore
      });
      
      await setDoc(userDocRef, updatedData);
      console.log('✅ Timed challenge results updated successfully!');
    } else {
      console.log('❌ User document does not exist for timed challenge. Creating it first...');
      
      // If user document doesn't exist, create a basic one and then update
      const basicProfile: UserProfile = {
        uid: userId,
        email: '',
        displayName: 'Anonymous',
        totalScore: challengeResult.score,
        highScores: {},
        timedChallengeResults: {
          [challengeResult.challengeId]: {
            ...challengeResult,
            completedAt: new Date(challengeResult.completedAt)
          }
        },
        joinedAt: new Date(),
        lastPlayed: new Date()
      };
      
      await setDoc(userDocRef, basicProfile);
      console.log('✅ Created user profile and saved timed challenge results!');
    }
  } catch (error) {
    handleFirebaseError(error, 'Updating user timed challenge results');
  }
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    
    return null;
  } catch (error) {
    handleFirebaseError(error, 'Getting user profile');
    return null;
  }
};

// Ensure user profile exists - creates one if missing
export const ensureUserProfile = async (user: User): Promise<void> => {
  try {
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log('🔄 User profile missing, creating one...');
      await createUserProfile(user);
    }
  } catch (error) {
    handleFirebaseError(error, 'Ensuring user profile exists');
  }
};

// Update user profile information
export const updateUserProfile = async (
  user: User,
  updates: {
    displayName?: string;
    photoURL?: string;
    location?: string;
  }
): Promise<void> => {
  try {
    console.log('🔄 Updating user profile:', updates);
    
    // Update Firebase Auth profile
    if (updates.displayName !== undefined || updates.photoURL !== undefined) {
      await updateProfile(user, {
        ...(updates.displayName !== undefined && { displayName: updates.displayName }),
        ...(updates.photoURL !== undefined && { photoURL: updates.photoURL })
      });
    }

    // Update Firestore document
    const userDocRef = doc(firestore, 'users', user.uid);
    const updateData: Partial<UserProfile> = {};
    
    if (updates.displayName !== undefined) updateData.displayName = updates.displayName;
    if (updates.photoURL !== undefined) updateData.photoURL = updates.photoURL;
    if (updates.location !== undefined) updateData.location = updates.location;

    await updateDoc(userDocRef, updateData);
    console.log('✅ User profile updated successfully');
  } catch (error) {
    handleFirebaseError(error, 'Updating user profile');
  }
};

// Upload profile picture (with fallback to base64)
export const uploadProfilePicture = async (
  user: User,
  file: File,
  useBase64Fallback: boolean = false
): Promise<string> => {
  try {
    console.log('🔄 Uploading profile picture');
    
    // Always try Firebase Storage first (even for small files)
    if (!useBase64Fallback) {
      const fileExtension = file.type.split('/')[1] || 'jpg';
      const fileName = `${user.uid}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `profile-pictures/${fileName}`);
      
      // Set metadata for the file
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: user.uid,
          originalName: file.name
        }
      };
      
      console.log('📤 Uploading to Firebase Storage:', `profile-pictures/${fileName}`);
      
      // Upload the file with metadata
      const uploadResult = await uploadBytes(storageRef, file, metadata);
      
      console.log('✅ File uploaded, getting download URL...');
      
      // Get the download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      console.log('✅ Profile picture uploaded successfully:', downloadURL);
      return downloadURL;
    }
    
    // Fallback: Use a compressed base64 version
    console.log('📝 Using compressed base64 encoding for image');
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate dimensions to keep image under reasonable size
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        
        let { width, height } = img;
        
        // Calculate scaling
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
        
        // Check if still too long (Firebase limit is ~2000 chars)
        if (compressedBase64.length > 1800) {
          reject(new Error('Image too large even after compression'));
        } else {
          console.log('✅ Image compressed to:', compressedBase64.length, 'characters');
          resolve(compressedBase64);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to process image'));
      };
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
    
  } catch (error) {
    console.error('❌ Profile picture upload failed:', error);
    
    // Check for CORS error and fallback to base64
    if (error instanceof Error && 
        (error.message.includes('cors') || 
         error.message.includes('Cross-Origin') || 
         error.message.includes('preflight'))) {
      console.log('🔄 CORS error detected, trying compressed base64 fallback...');
      
      if (!useBase64Fallback) {
        // Retry with base64 fallback
        return uploadProfilePicture(user, file, true);
      }
    }
    
    handleFirebaseError(error, 'Uploading profile picture');
    throw error; // Re-throw since we need to return the URL
  }
};

// Change user password
export const changeUserPassword = async (
  user: User,
  newPassword: string
): Promise<void> => {
  try {
    console.log('🔄 Changing user password');
    await updatePassword(user, newPassword);
    console.log('✅ Password changed successfully');
  } catch (error) {
    handleFirebaseError(error, 'Changing password');
  }
};

// Send password reset email
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    console.log('🔄 Sending password reset email to:', email);
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent');
  } catch (error) {
    handleFirebaseError(error, 'Sending password reset email');
  }
};