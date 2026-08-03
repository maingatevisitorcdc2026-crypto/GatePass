/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Sheet, Google Drive, and Gmail scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/gmail.send');

let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null;
let isSigningIn = false;

// Initialize auth listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null);
      if (token) {
        cachedAccessToken = token;
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        // Since Firebase SDK persists user login but doesn't persist the Google Access Token,
        // we can trigger signInWithPopup or let the application know we need to re-authenticate
        // to obtain a fresh access token.
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('google_access_token');
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth Provider');
    }

    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_access_token', credential.accessToken);
      localStorage.setItem('google_access_token_timestamp', Date.now().toString());
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null);
};

export const setAccessToken = (token: string) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('google_access_token', token);
      if (!localStorage.getItem('google_access_token_timestamp')) {
        localStorage.setItem('google_access_token_timestamp', Date.now().toString());
      }
    } else {
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_access_token_timestamp');
    }
  }
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_access_token_timestamp');
  }
};

export interface TokenExpiryInfo {
  timeLeft: number; // in seconds
  percent: number;  // 0 to 100
  totalDuration: number; // 3600 seconds
  formattedTime: string; // "MM:SS" or "X นาที Y วินาที"
}

export const getTokenExpiryInfo = (): TokenExpiryInfo | null => {
  const token = getAccessToken();
  if (!token) return null;

  const timestampStr = typeof window !== 'undefined' ? localStorage.getItem('google_access_token_timestamp') : null;
  let timestamp = timestampStr ? parseInt(timestampStr, 10) : null;
  
  if (!timestamp) {
    timestamp = Date.now();
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_access_token_timestamp', timestamp.toString());
    }
  }

  const durationMs = 3600 * 1000; // 1 hour session duration
  const elapsedMs = Date.now() - timestamp;
  const timeLeftMs = Math.max(0, durationMs - elapsedMs);
  
  const timeLeftSec = Math.floor(timeLeftMs / 1000);
  const percent = Math.min(100, Math.max(0, (timeLeftMs / durationMs) * 100));
  
  const minutes = Math.floor(timeLeftSec / 60);
  const seconds = timeLeftSec % 60;
  
  let formattedTime = '';
  if (minutes > 0) {
    formattedTime += `${minutes} นาที `;
  }
  formattedTime += `${seconds} วินาที`;

  return {
    timeLeft: timeLeftSec,
    percent,
    totalDuration: 3600,
    formattedTime,
  };
};
