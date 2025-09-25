// Firebase error code to user-friendly message mapping
export interface FirebaseError {
  code: string;
  message: string;
}

export const getCustomErrorMessage = (error: unknown): string => {
  // Handle known error types
  if (error && typeof error === 'object') {
    // Handle Firebase Auth errors
    if ('code' in error) {
      const firebaseError = error as FirebaseError;
      
      switch (firebaseError.code) {
        // Authentication errors
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          return 'Invalid email or password. Please check your credentials and try again.';
        
        case 'auth/invalid-email':
          return 'Please enter a valid email address.';
        
        case 'auth/email-already-in-use':
          return 'An account with this email already exists. Please sign in instead.';
        
        case 'auth/weak-password':
          return 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.';
        
        case 'auth/operation-not-allowed':
          return 'This sign-in method is not enabled. Please contact support.';
        
        case 'auth/user-disabled':
          return 'This account has been disabled. Please contact support for assistance.';
        
        case 'auth/too-many-requests':
          return 'Too many failed attempts. Please wait a few minutes before trying again.';
        
        case 'auth/network-request-failed':
          return 'Network error. Please check your internet connection and try again.';
        
        case 'auth/requires-recent-login':
          return 'For security reasons, please sign in again to complete this action.';
        
        case 'auth/invalid-verification-code':
          return 'Invalid verification code. Please check the code and try again.';
        
        case 'auth/invalid-verification-id':
          return 'Invalid verification ID. Please restart the verification process.';
        
        case 'auth/code-expired':
          return 'Verification code has expired. Please request a new code.';
        
        case 'auth/missing-email':
          return 'Please enter your email address.';
        
        case 'auth/missing-password':
          return 'Please enter your password.';
        
        case 'auth/popup-blocked':
          return 'Sign-in popup was blocked. Please allow popups for this site and try again.';
        
        case 'auth/popup-closed-by-user':
          return 'Sign-in was cancelled. Please try again.';
        
        case 'auth/unauthorized-domain':
          return 'This domain is not authorized for authentication. Please contact support.';
        
        // Firestore errors
        case 'permission-denied':
          return 'You do not have permission to perform this action.';
        
        case 'not-found':
          return 'The requested data was not found.';
        
        case 'already-exists':
          return 'This data already exists.';
        
        case 'resource-exhausted':
          return 'Service is temporarily unavailable. Please try again later.';
        
        case 'failed-precondition':
          return 'Operation failed due to a conflict. Please refresh and try again.';
        
        case 'aborted':
          return 'Operation was cancelled. Please try again.';
        
        case 'out-of-range':
          return 'Invalid input provided.';
        
        case 'unimplemented':
          return 'This feature is not yet available.';
        
        case 'internal':
          return 'An internal error occurred. Please try again later.';
        
        case 'unavailable':
          return 'Service is temporarily unavailable. Please try again later.';
        
        case 'data-loss':
          return 'Data corruption detected. Please contact support.';
        
        case 'unauthenticated':
          return 'Please sign in to continue.';
        
        // Custom app errors
        case 'cancelled':
          return 'Operation was cancelled.';
        
        default:
          // Log unknown Firebase errors for debugging
          console.warn('Unknown Firebase error code:', firebaseError.code, firebaseError.message);
          return 'An unexpected error occurred. Please try again.';
      }
    }
    
    // Handle regular Error objects with custom messages
    if ('message' in error && typeof error.message === 'string') {
      const message = error.message;
      
      // Check if it's a custom validation error (don't change these)
      if (message.includes('Passwords do not match') || 
          message.includes('Password must be at least') ||
          message.includes('Operation cancelled')) {
        return message;
      }
      
      // Check for Firebase error patterns in the message
      if (message.includes('Firebase:') || message.includes('auth/')) {
        return 'Authentication failed. Please check your credentials and try again.';
      }
      
      return message;
    }
  }
  
  // Fallback for unknown error types
  return 'An unexpected error occurred. Please try again.';
};

// Success messages for different operations
export const getSuccessMessage = (operation: string): string => {
  switch (operation) {
    case 'sign-in':
      return 'Welcome back! You have successfully signed in.';
    
    case 'sign-up':
      return 'Account created successfully! Welcome to Islamic Quiz.';
    
    case 'sign-out':
      return 'You have been signed out successfully.';
    
    case 'password-reset':
      return 'Password reset link has been sent to your email.';
    
    case 'password-update':
      return 'Your password has been updated successfully.';
    
    case 'profile-update':
      return 'Your profile has been updated successfully.';
    
    case 'quiz-complete':
      return 'Quiz completed! Great job on your performance.';
    
    case 'data-save':
      return 'Your data has been saved successfully.';
    
    default:
      return 'Operation completed successfully!';
  }
};