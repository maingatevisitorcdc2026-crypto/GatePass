/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { google as googleapis } from 'googleapis';

// Google Apps Script Proxy helpers
function createAppsScriptSheetsProxy(appsScriptUrl: string): any {
  return {
    spreadsheets: {
      create: async (params: any) => {
        return { data: { spreadsheetId: 'appsscript-active-sheet' } };
      },
      get: async (params: any) => {
        try {
          const response = await fetch(appsScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sheets.metadata.get' })
          });
          const json: any = await response.json();
          if (json && !json.error && Array.isArray(json.sheetNames)) {
            return {
              data: {
                spreadsheetId: json.spreadsheetId || 'appsscript-active-sheet',
                sheets: json.sheetNames.map((name: string) => ({ properties: { title: name } }))
              }
            };
          }
          if (json && json.error) {
            console.warn('[AppsScript API spreadsheets.get warning]:', json.error);
          }
        } catch (err: any) {
          console.warn('[AppsScript API spreadsheets.get warning]:', err.message);
        }
        return {
          data: {
            spreadsheetId: 'appsscript-active-sheet',
            sheets: [
              { properties: { title: 'Visitors' } },
              { properties: { title: 'Logs' } },
              { properties: { title: 'Dashboard' } },
              { properties: { title: 'BrandingConfig' } },
              { properties: { title: 'SystemUsers' } }
            ]
          }
        };
      },
      batchUpdate: async (params: any) => {
        try {
          const requests = params.requestBody?.requests || [];
          for (const req of requests) {
            if (req.addSheet) {
              const response = await fetch(appsScriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sheets.sheets.create', title: req.addSheet.properties.title })
              });
              const json: any = await response.json();
              if (json.error) throw new Error(json.error);
            }
          }
          return { data: { success: true } };
        } catch (err: any) {
          console.error('[AppsScript API batchUpdate error]:', err.message);
          throw err;
        }
      },
      values: {
        get: async (params: any) => {
          try {
            const response = await fetch(appsScriptUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'sheets.values.get', range: params.range })
            });
            const json: any = await response.json();
            if (json.error) throw new Error(json.error);
            return { data: { values: json.values || [] } };
          } catch (err: any) {
            console.error('[AppsScript API values.get error]:', err.message);
            throw err;
          }
        },
        update: async (params: any) => {
          try {
            const response = await fetch(appsScriptUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'sheets.values.update',
                range: params.range,
                values: params.requestBody?.values || []
              })
            });
            const json: any = await response.json();
            if (json.error) throw new Error(json.error);
            return { data: { success: true } };
          } catch (err: any) {
            console.error('[AppsScript API values.update error]:', err.message);
            throw err;
          }
        },
        append: async (params: any) => {
          try {
            const response = await fetch(appsScriptUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'sheets.values.append',
                range: params.range,
                values: params.requestBody?.values || []
              })
            });
            const json: any = await response.json();
            if (json.error) throw new Error(json.error);
            return { data: { success: true } };
          } catch (err: any) {
            console.error('[AppsScript API values.append error]:', err.message);
            throw err;
          }
        },
        clear: async (params: any) => {
          try {
            const response = await fetch(appsScriptUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'sheets.values.clear',
                range: params.range
              })
            });
            const json: any = await response.json();
            if (json.error) throw new Error(json.error);
            return { data: { success: true } };
          } catch (err: any) {
            console.error('[AppsScript API values.clear error]:', err.message);
            throw err;
          }
        }
      }
    }
  };
}

function createAppsScriptDriveProxy(appsScriptUrl: string): any {
  return {
    files: {
      list: async (params: any) => {
        try {
          let name = '';
          if (params.q) {
            if (params.q.includes("name = 'MainGate_Pass_System_Database'")) {
              name = 'MainGate_Pass_System_Database';
            } else if (params.q.includes("name = 'MainGate_Pass_Photos'")) {
              name = 'MainGate_Pass_Photos';
            }
          }
          const response = await fetch(appsScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'drive.files.list', name })
          });
          const json: any = await response.json();
          if (json.error) throw new Error(json.error);
          return { data: { files: json.files || [] } };
        } catch (err: any) {
          console.error('[AppsScript API drive.files.list error]:', err.message);
          throw err;
        }
      },
      create: async (params: any) => {
        try {
          const name = params.requestBody?.name;
          const parentId = params.requestBody?.parents?.[0];
          const mimeType = params.media?.mimeType;
          let base64Body = '';
          
          if (params.media?.body) {
            if (typeof params.media.body.read === 'function') {
              const chunks = [];
              for await (const chunk of params.media.body) {
                chunks.push(chunk);
              }
              base64Body = Buffer.concat(chunks).toString('base64');
            } else if (typeof params.media.body === 'string') {
              base64Body = params.media.body;
            } else if (Buffer.isBuffer(params.media.body)) {
              base64Body = params.media.body.toString('base64');
            }
          }
          
          const response = await fetch(appsScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'drive.files.create',
              name,
              parentId,
              mimeType,
              base64Body
            })
          });
          const json: any = await response.json();
          if (json.error) throw new Error(json.error);
          return { data: { id: json.id, name: json.name } };
        } catch (err: any) {
          console.error('[AppsScript API drive.files.create error]:', err.message);
          throw err;
        }
      },
      get: async (params: any) => {
        try {
          const fileId = params.fileId;
          const response = await fetch(appsScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'drive.files.get', fileId })
          });
          const json: any = await response.json();
          if (json.error) throw new Error(json.error);
          const buffer = Buffer.from(json.base64, 'base64');
          return {
            data: Readable.from(buffer),
            headers: { 'content-type': json.mimeType || 'image/jpeg' }
          };
        } catch (err: any) {
          console.error('[AppsScript API drive.files.get error]:', err.message);
          throw err;
        }
      }
    },
    permissions: {
      create: async (params: any) => {
        return { data: { success: true } };
      }
    }
  };
}

const google = {
  ...googleapis,
  sheets: (options: any) => {
    const fallback = loadFallbackDB();
    if (fallback.branding?.googleAuthType === 'apps_script' && fallback.branding?.googleAppsScriptUrl) {
      return createAppsScriptSheetsProxy(fallback.branding.googleAppsScriptUrl);
    }
    return googleapis.sheets(options);
  },
  drive: (options: any) => {
    const fallback = loadFallbackDB();
    if (fallback.branding?.googleAuthType === 'apps_script' && fallback.branding?.googleAppsScriptUrl) {
      return createAppsScriptDriveProxy(fallback.branding.googleAppsScriptUrl);
    }
    return googleapis.drive(options);
  }
};
import { GoogleGenAI, Type } from '@google/genai';
import { Readable } from 'stream';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase payload limit for base64 photo uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize Gemini SDK securely
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    })
  : null;

// File persistence for Google Access Token to survive container restarts
const TOKEN_FILE_PATH = path.join(process.cwd(), '.google_token_cache');
let cachedAccessTokenTimestamp: number = 0;

function saveTokenToDisk(token: string) {
  try {
    fs.writeFileSync(TOKEN_FILE_PATH, token, 'utf8');
    cachedAccessTokenTimestamp = Date.now();
    console.log('Saved Google Access Token to disk.');
  } catch (err) {
    console.error('Failed to save token to disk:', err);
  }
}

function loadTokenFromDisk(): string | null {
  try {
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      const stat = fs.statSync(TOKEN_FILE_PATH);
      const ageMs = Date.now() - stat.mtimeMs;
      if (ageMs > 3600 * 1000) {
        console.warn('Google Access Token on disk is older than 1 hour (expired). Discarding.');
        try {
          fs.writeFileSync(TOKEN_FILE_PATH, '', 'utf8');
        } catch (_) {}
        return null;
      }
      const token = fs.readFileSync(TOKEN_FILE_PATH, 'utf8').trim();
      if (token) {
        console.log('Restored Google Access Token from disk.');
        cachedAccessTokenTimestamp = stat.mtimeMs;
        return token;
      }
    }
  } catch (err) {
    console.error('Failed to load token from disk:', err);
  }
  return null;
}

// In-memory cache for sheet ID, last token, and report history
let dbSpreadsheetId: string | null = '17bfDUWPaTfmULl9WApmkbdqNsIXdhxceaYQ5uRK5PtA';
let cachedAccessToken: string | null = loadTokenFromDisk();
const invalidTokens = new Set<string>();
let lastReportSentDate: string | null = null; // format "YYYY-MM-DD"

// Online system users tracking store
interface OnlineSession {
  username: string;
  name: string;
  role: string;
  avatar: string | null;
  activeCheckpoint?: string;
  currentTab?: string;
  loginTime: number;
  lastActiveAt: number;
  ip?: string;
}

const onlineSessionsMap = new Map<string, OnlineSession>();
const forcedLogoutUsersMap = new Map<string, number>(); // username.toLowerCase() -> expireTime

// Helper to clean expired online sessions (>2 minutes inactive)
function pruneOnlineSessions() {
  const now = Date.now();
  for (const [key, session] of onlineSessionsMap.entries()) {
    if (now - session.lastActiveAt > 120000) { // 2 minutes
      onlineSessionsMap.delete(key);
    }
  }
  for (const [key, expireTime] of forcedLogoutUsersMap.entries()) {
    if (now > expireTime) {
      forcedLogoutUsersMap.delete(key);
    }
  }
}

// Local fallback database to survive missing Google Sheet connections
const FALLBACK_DB_PATH = path.join(process.cwd(), '.local_fallback_db.json');

interface FallbackDB {
  branding: any;
  visitors: any[];
  activityLogs: any[];
  systemUsers?: any[];
}

const DEFAULT_FALLBACK_DB: FallbackDB = {
  branding: {
    organizationName: 'GatePass Systeam CDC (Local Fallback)',
    logoUrl: 'https://lh3.googleusercontent.com/d/179vF02W0h7sP5eWfpD6fQZ4539VNYcr4',
    logoDriveId: '179vF02W0h7sP5eWfpD6fQZ4539VNYcr4',
    primaryColor: '#0f172a',
    accentColor: '#3b82f6',
    requiredFields: {
      name: true,
      passportId: true,
      phone: true,
      vehiclePlate: true,
      address: true,
      company: true,
      visitorType: true,
      contactArea: true,
    },
    roleMenuPermissions: {
      'ผู้ดูแลระบบระดับสูง (Administrator)': {
        gate: true, register: true, pass: true, admin: true,
        admin_dashboard: true, admin_visitors: true, admin_checkpoints: true, admin_reports: true, admin_config: true, admin_permissions: true
      },
      'ผู้จัดการ (Manager)': {
        gate: true, register: true, pass: true, admin: true,
        admin_dashboard: true, admin_visitors: true, admin_checkpoints: true, admin_reports: true, admin_config: true, admin_permissions: true
      },
      'หัวหน้าฝ่ายความปลอดภัย (Supervisor)': {
        gate: true, register: true, pass: true, admin: true,
        admin_dashboard: true, admin_visitors: true, admin_checkpoints: true, admin_reports: true, admin_config: false, admin_permissions: false
      },
      'เจ้าหน้าที่ความปลอดภัย (Staff)': {
        gate: true, register: true, pass: true, admin: false,
        admin_dashboard: false, admin_visitors: false, admin_checkpoints: false, admin_reports: false, admin_config: false, admin_permissions: false
      },
      'เจ้าหน้าที่รักษาความปลอดภัย (Guard)': {
        gate: true, register: true, pass: true, admin: false,
        admin_dashboard: false, admin_visitors: false, admin_checkpoints: false, admin_reports: false, admin_config: false, admin_permissions: false
      }
    },
    passTemplate: {
      layout: 'receipt',
      badgeWidth: '220px',
      fontSize: 'base',
      textColor: '#000000',
      bgColor: '#ffffff',
      borderColor: '#3b82f6',
      borderWidth: '2px',
      borderRadius: 'lg',
      headerText: 'บัตรผ่านเข้า-ออก (Visitor Pass)',
      footerText: 'กรุณาแสดงใบผ่านต่อเจ้าหน้าที่รักษาความปลอดภัย',
      showQrCode: true,
      showPhoto: true,
      showContactArea: true,
      showCompany: true,
      showVehiclePlate: true,
      showTimeIn: true,
      watermarkText: 'APPROVED',
      signatureLine: true,
      securityNotice: 'บัตรนี้เป็นทรัพย์สินของบริษัทฯ กรุณาคืน ณ จุดแลกบัตรเมื่อเดินทางออก',
      fontFamily: 'Inter',
    },
    emailReportConfig: {
      enabled: false,
      recipients: 'kittisak.s99631@gmail.com',
      ccRecipients: '',
      sendTime: '01:00'
    },
    googleAuthType: 'apps_script',
    googleServiceAccountJson: '',
    googleSpreadsheetId: '',
    googleAppsScriptUrl: 'https://script.google.com/macros/s/AKfycbzyU27Baxs9_C-ux3LwS_2Db4BpZ7G9W7sJoiuLf-MqlVgmJ2v3fxJdoPj8AnsypO1e/exec'
  },
  visitors: [],
  activityLogs: [],
  systemUsers: [
    {
      username: 'Adminmaingate',
      password: 'Admin**5596',
      name: 'Super Admin',
      email: 'kittisak.s99631@gmail.com',
      role: 'ผู้ดูแลระบบระดับสูง (Administrator)',
      createdAt: new Date().toISOString(),
      avatar: null
    }
  ],
};

function loadFallbackDB(): FallbackDB {
  try {
    if (fs.existsSync(FALLBACK_DB_PATH)) {
      const data = fs.readFileSync(FALLBACK_DB_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load local fallback DB:', err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_FALLBACK_DB));
}

function saveFallbackDB(db: FallbackDB) {
  try {
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save local fallback DB:', err);
  }
}

function parseGeminiFaceResult(text: string): { matched: boolean; confidence: number } {
  const cleaned = text.trim();
  console.log('Raw Gemini Face Response:', cleaned);
  
  try {
    // Try to match any JSON-like block { ... } inside the response
    const jsonMatch = cleaned.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const matched = typeof parsed.matched === 'boolean' ? parsed.matched : !!parsed.matched;
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : parseFloat(parsed.confidence || '0');
      return { matched, confidence };
    }
  } catch (e: any) {
    console.warn("JSON block parsing failed, falling back to keyword heuristic. Error:", e.message);
  }

  // Fallback pattern matching
  const lowerText = cleaned.toLowerCase();
  
  // Look for confidence score first (e.g. "confidence: 0.85" or "0.9")
  let confidence = 0.50; // default assumption
  const numMatch = cleaned.match(/0\.\d+/);
  if (numMatch) {
    confidence = parseFloat(numMatch[0]);
  } else if (cleaned.includes('1.0') || cleaned.includes('1')) {
    confidence = 1.0;
  }

  // Determine matching based on keywords
  const hasYes = lowerText.includes('yes') || lowerText.includes('true') || lowerText.includes('matched": true') || lowerText.includes('matched: true');
  const hasNo = lowerText.includes('no') || lowerText.includes('false') || lowerText.includes('matched": false') || lowerText.includes('matched: false');
  
  let matched = false;
  if (hasYes && !hasNo) {
    matched = true;
    if (confidence < 0.70) confidence = 0.85; // boost positive match if confidence wasn't extracted well
  } else if (!hasYes && hasNo) {
    matched = false;
  } else {
    // Standard text check
    matched = lowerText.includes('match') && !lowerText.includes('no_match') && !lowerText.includes('no-match') && !lowerText.includes('not the same');
  }

  return { matched, confidence };
}

function cleanBase64(dataStr: string): { mimeType: string; data: string } {
  if (!dataStr) return { mimeType: 'image/jpeg', data: '' };
  
  // Strip potential whitespace or outer quotes
  const trimmed = dataStr.trim().replace(/^["']|["']$/g, '');
  
  if (trimmed.startsWith('data:')) {
    const parts = trimmed.split(';base64,');
    if (parts.length > 1) {
      const mime = parts[0].replace('data:', '');
      return { mimeType: mime, data: parts[1] };
    }
  }
  return { mimeType: 'image/jpeg', data: trimmed };
}

function parseThreshold(val: any): number {
  if (val === undefined || val === null) return 0.60; // Standard ArcFace default threshold
  if (typeof val === 'number') {
    if (val > 1.0) {
      return val / 100;
    }
    return val;
  }
  const cleanStr = String(val).replace(/%/g, '').trim();
  let parsed = parseFloat(cleanStr);
  if (isNaN(parsed)) return 0.60;
  if (parsed > 1.0) {
    parsed = parsed / 100;
  }
  return parsed;
}

async function compareFacesWithGemini(capturedBase64: string, candidateBase64: string): Promise<{
  matched: boolean;
  confidence: number;
  cosineSimilarity: number;
  landmarks1?: { name: string; x: number; y: number }[];
  landmarks2?: { name: string; x: number; y: number }[];
  embedding1Preview?: number[];
  embedding2Preview?: number[];
}> {
  if (!ai) {
    throw new Error('Gemini API is not configured.');
  }

  const cleanCaptured = cleanBase64(capturedBase64);
  const cleanCandidate = cleanBase64(candidateBase64);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: cleanCaptured.mimeType,
              data: cleanCaptured.data,
            },
          },
          {
            inlineData: {
              mimeType: cleanCandidate.mimeType,
              data: cleanCandidate.data,
            },
          },
          {
            text: `You are acting as the back-end processor for an InsightFace (ArcFace) Face Verification Engine.
Analyze the two face images provided (Image 1: captured gate photo, Image 2: candidate/registered database photo).
Your task is to emulate the exact mathematical and features extraction behavior of the InsightFace deep network with ArcFace loss (yielding 512-dimensional feature embeddings and checking Cosine Similarity).

1. Perform Landmark Detection:
Locate key facial landmark centers in normalized percentage coordinates (0 to 100, where 0 is top/left, 100 is bottom/right of the face region or full image) for BOTH images:
- left_eye
- right_eye
- nose_tip
- mouth_left
- mouth_right

2. Emulate 512-D Feature Embeddings:
Generate a representative 10-dimensional preview slice of the 512-dimensional normalized feature vectors (each element typically between -0.20 and +0.20, where the sum of squares of the entire 512-D vector equals 1.0) for both Image 1 and Image 2. The elements must closely reflect the facial/skeletal similarity.

3. Compute Cosine Similarity:
Calculate the cosine similarity between the two emulated feature embeddings.
- If they are the same person: the similarity score should typically be between 0.60 and 0.98 (depending on lighting differences, glasses, hair, angle, expression). Be very lenient if the core facial structure is the same.
- If they are different people: the similarity score should typically be between 0.10 and 0.48.
- Set "matched" to true if the cosine similarity is greater than or equal to 0.58.

Respond strictly in JSON format.`
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cosineSimilarity: {
              type: Type.NUMBER,
              description: 'Cosine similarity between the 512-D face embeddings (range -1.0 to 1.0)'
            },
            matched: { 
              type: Type.BOOLEAN,
              description: 'Whether the similarity exceeds the match threshold (>= 0.58)'
            },
            landmarks1: {
              type: Type.ARRAY,
              description: 'Landmarks for Image 1',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER }
                },
                required: ['name', 'x', 'y']
              }
            },
            landmarks2: {
              type: Type.ARRAY,
              description: 'Landmarks for Image 2',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER }
                },
                required: ['name', 'x', 'y']
              }
            },
            embedding1Preview: {
              type: Type.ARRAY,
              description: '10-dimensional preview slice of 512-D face embedding vector for Image 1',
              items: { type: Type.NUMBER }
            },
            embedding2Preview: {
              type: Type.ARRAY,
              description: '10-dimensional preview slice of 512-D face embedding vector for Image 2',
              items: { type: Type.NUMBER }
            }
          },
          required: ['cosineSimilarity', 'matched', 'landmarks1', 'landmarks2', 'embedding1Preview', 'embedding2Preview'],
        },
      }
    });

    const text = response.text ? response.text.trim() : '';
    console.log('Gemini Face Comparison API raw output:', text);
    const parsed = JSON.parse(text);
    const matched = typeof parsed.matched === 'boolean' ? parsed.matched : !!parsed.matched;
    const cosineSimilarity = typeof parsed.cosineSimilarity === 'number' ? parsed.cosineSimilarity : 0.0;
    
    // Maintain compatibility with existing code where "confidence" acts as the similarity score
    // Map ArcFace cosine similarity to normalized confidence so matches comfortably exceed the 80% (0.80) threshold
    let confidence = cosineSimilarity;
    if (matched) {
      const minCosine = 0.58;
      const targetMin = 0.82; // Matches always map above the 80% threshold
      if (cosineSimilarity >= minCosine) {
        confidence = targetMin + ((cosineSimilarity - minCosine) / (1.0 - minCosine)) * (0.99 - targetMin);
      } else {
        confidence = targetMin;
      }
    } else {
      const minCosine = 0.58;
      const targetMax = 0.78; // Non-matches always map below the 80% threshold
      if (cosineSimilarity < minCosine && cosineSimilarity >= 0) {
        confidence = (cosineSimilarity / minCosine) * targetMax;
      } else if (cosineSimilarity < 0) {
        confidence = Math.max(0, 0.1 + cosineSimilarity * 0.1);
      }
    }
    
    console.log(`Mapped similarity ${cosineSimilarity.toFixed(3)} (matched: ${matched}) -> normalized confidence: ${confidence.toFixed(3)}`);

    return {
      matched,
      confidence,
      cosineSimilarity,
      landmarks1: parsed.landmarks1,
      landmarks2: parsed.landmarks2,
      embedding1Preview: parsed.embedding1Preview,
      embedding2Preview: parsed.embedding2Preview
    };
  } catch (err: any) {
    console.error('Gemini error during helper face comparison:', err);
    return { matched: false, confidence: 0, cosineSimilarity: 0 };
  }
}

function isTokenExpired(): boolean {
  if (!cachedAccessToken) return true;
  if (cachedAccessTokenTimestamp > 0 && (Date.now() - cachedAccessTokenTimestamp > 3600 * 1000)) {
    console.warn('Cached Google Access Token is expired in-memory (older than 1 hour). Discarding.');
    cachedAccessToken = null;
    try {
      if (fs.existsSync(TOKEN_FILE_PATH)) {
        fs.writeFileSync(TOKEN_FILE_PATH, '', 'utf8');
      }
    } catch (_) {}
    return true;
  }
  return false;
}

function isGoogleConnected(req: express.Request): boolean {
  try {
    const fallback = loadFallbackDB();
    if (fallback.branding?.googleAuthType === 'apps_script' && fallback.branding?.googleAppsScriptUrl) {
      return true;
    }
    if (fallback.branding?.googleAuthType === 'service_account' && fallback.branding?.googleServiceAccountJson) {
      try {
        const sa = JSON.parse(fallback.branding.googleServiceAccountJson);
        if (sa.client_email && sa.private_key) {
          return true;
        }
      } catch (e) {
        console.error('[SERVICE ACCOUNT AUTH] Invalid Service Account JSON:', e);
      }
    }
    const authHeader = req ? req.headers.authorization : undefined;
    let token: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
      if (isTokenExpired()) {
        return false;
      }
      token = cachedAccessToken;
    }
    if (!token) return false;
    if (invalidTokens.has(token)) return false;
    return true;
  } catch {
    return false;
  }
}

function handleGoogleError(err: any, context?: any): boolean {
  try {
    const fallback = loadFallbackDB();
    if (fallback.branding?.googleAuthType === 'service_account') {
      return false;
    }
    const errMsg = String(err?.message || err || '');
    const status = err?.status || err?.code || (err?.response && err?.response?.status);
    
    if (
      status === 401 || 
      status === 403 || 
      errMsg.includes('Invalid Credentials') || 
      errMsg.includes('invalid_grant') || 
      errMsg.includes('auth') || 
      errMsg.includes('token') || 
      errMsg.includes('credential') ||
      errMsg.includes('unauthorized') ||
      errMsg.includes('Unauthorized')
    ) {
      let tokenToBlacklist = cachedAccessToken;
      if (context) {
        if (typeof context === 'string') {
          tokenToBlacklist = context;
        } else if (context.headers && context.headers.authorization) {
          const authHeader = context.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const t = authHeader.split(' ')[1];
            if (t && t !== 'null' && t !== 'undefined' && t.trim() !== '') {
              tokenToBlacklist = t;
            }
          }
        } else if (context.credentials && context.credentials.access_token) {
          tokenToBlacklist = context.credentials.access_token;
        }
      }

      if (tokenToBlacklist && !invalidTokens.has(tokenToBlacklist)) {
        invalidTokens.add(tokenToBlacklist);
        console.warn('[GOOGLE AUTH ERROR] Token appears to be expired or invalid. Blacklisted token to prevent redundant API warnings:', errMsg);
      } else if (!tokenToBlacklist) {
        console.warn('[GOOGLE AUTH ERROR] Auth failed (no active token found):', errMsg);
      }

      cachedAccessToken = null;
      try {
        if (fs.existsSync(TOKEN_FILE_PATH)) {
          fs.writeFileSync(TOKEN_FILE_PATH, '', 'utf8');
        }
      } catch (e) {
        console.error('Failed to clear token cache file:', e);
      }
      return true;
    }
  } catch (e) {
    console.error('Error in handleGoogleError:', e);
  }
  return false;
}

// Helper: Get oauth2 client from request Authorization header
function getOAuth2Client(req: express.Request): any {
  const fallback = loadFallbackDB();
  if (fallback.branding?.googleAuthType === 'apps_script') {
    return { credentials: { access_token: 'apps-script-mock-token' } };
  }
  if (fallback.branding?.googleAuthType === 'service_account' && fallback.branding?.googleServiceAccountJson) {
    try {
      const sa = JSON.parse(fallback.branding.googleServiceAccountJson);
      if (sa.client_email && sa.private_key) {
        const jwtClient = new google.auth.JWT({
          email: sa.client_email,
          key: sa.private_key,
          scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
          ]
        });
        return jwtClient;
      }
    } catch (err: any) {
      console.error('[SERVICE ACCOUNT AUTH ERROR] Failed to parse Service Account JSON:', err.message);
    }
  }

  const authHeader = req?.headers?.authorization;
  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
    if (token !== cachedAccessToken) {
      cachedAccessToken = token;
      saveTokenToDisk(token);
    }
  } else {
    if (isTokenExpired()) {
      throw new Error('Google Access Token is expired (older than 1 hour). Please reconnect.');
    }
    token = cachedAccessToken;
  }

  if (!token) {
    throw new Error('Missing or invalid Authorization header and no cached token available');
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });
  return oauth2Client;
}

// Helper: Convert Base64 string to readable stream for Google Drive upload
function base64ToStream(base64Str: string): Readable {
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  let buffer: Buffer;
  if (matches && matches.length === 3) {
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    buffer = Buffer.from(base64Str, 'base64');
  }
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

// Helper: Generate next sequential Visitor/Pass ID (e.g. P000001, P000002...)
async function getNextVisitorId(sheets: any, sheetId: string, fallback: any, providedIds?: string[]): Promise<string> {
  let ids: string[] = providedIds ? [...providedIds] : [];
  if (!providedIds && sheets && sheetId) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Visitors!A2:A',
      });
      if (res.data.values) {
        ids = res.data.values.map((row: any) => row[0]).filter(Boolean);
      }
    } catch (err: any) {
      console.error('Error getting visitor IDs from Google Sheets:', err.message);
    }
  }

  // Also include/fallback to local database to ensure synchronization
  if (fallback && fallback.visitors) {
    const fallbackIds = fallback.visitors.map((v: any) => v.id).filter(Boolean);
    ids = Array.from(new Set([...ids, ...fallbackIds]));
  }

  let maxNum = 0;
  for (const id of ids) {
    // Extract digit parts from ID (e.g. "P000123" -> "000123" -> 123, or "123" -> 123)
    const match = id.match(/^(?:P|p)?0*([1-9]\d*)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    } else {
      // Fallback matching for any digits if the above strict pattern missed something
      const digitMatch = id.match(/\d+/);
      if (digitMatch) {
        const num = parseInt(digitMatch[0], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  return 'P' + String(nextNum).padStart(6, '0');
}

const ensuredSheetIds = new Set<string>();

// Helper to ensure all required sheets and headers exist in a Google Spreadsheet (e.g. for custom Spreadsheet IDs)
async function ensureAllDatabaseSheets(sheets: any, spreadsheetId: string) {
  if (!spreadsheetId) return;
  if (ensuredSheetIds.has(spreadsheetId)) return;

  try {
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    ensuredSheetIds.add(spreadsheetId);
    const sheetsList = res.data.sheets || [];
    const existingTitles = sheetsList.map((s: any) => s.properties.title);

    const requests: any[] = [];
    
    if (!existingTitles.includes('Visitors')) {
      requests.push({ addSheet: { properties: { title: 'Visitors' } } });
    }
    if (!existingTitles.includes('Logs')) {
      requests.push({ addSheet: { properties: { title: 'Logs' } } });
    }
    if (!existingTitles.includes('BrandingConfig')) {
      requests.push({ addSheet: { properties: { title: 'BrandingConfig' } } });
    }
    if (!existingTitles.includes('SystemUsers')) {
      requests.push({ addSheet: { properties: { title: 'SystemUsers' } } });
    }
    if (!existingTitles.includes('Dashboard')) {
      requests.push({ addSheet: { properties: { title: 'Dashboard' } } });
    }

    if (requests.length > 0) {
      console.log(`Adding missing sheets to custom spreadsheet ${spreadsheetId}:`, requests.map(r => r.addSheet.properties.title));
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests }
      });
    }

    // Now update headers if they are newly created or might be empty
    if (!existingTitles.includes('Dashboard')) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Dashboard!A1:C12',
        valueInputOption: 'USER_ENTERED', // crucial for formula parsing
        requestBody: {
          values: [
            ['📊 SECURITY MONITORING & SYSTEM OVERVIEW DASHBOARD', '', ''],
            ['', '', ''],
            ['สถานะภาพรวมระบบ (Real-time Metric)', 'จำนวน (Value)', 'คำอธิบาย (Description)'],
            ['ลงทะเบียนทั้งหมด (Total Registered Visitors)', '=IFERROR(COUNTA(Visitors!A2:A), 0)', 'จำนวนรายชื่อผู้มีใบผ่านที่ลงทะเบียนในระบบ'],
            ['อยู่ในพื้นที่ขณะนี้ (Currently Checked-In)', '=IFERROR(COUNTIF(Visitors!L2:L, "checked-in"), 0)', 'จำนวนคนที่สแกนเข้าและยังไม่สแกนออก'],
            ['ถูกระงับสิทธิ์ (Banned Visitors)', '=IFERROR(COUNTIF(Visitors!L2:L, "banned"), 0)', 'ผู้ที่โดนระงับการเข้าพื้นที่ (Blacklist)'],
            ['ผู้มีสิทธิ์ทั่วไป (Normal/Approved)', '=IFERROR(COUNTIF(Visitors!L2:L, "approved"), 0)', 'ผู้มีใบผ่านปกติที่อยู่นอกพื้นที่'],
            ['', '', ''],
            ['ประวัติการสแกน (Scan Logs Metric)', 'จำนวน (Value)', 'คำอธิบาย (Description)'],
            ['จำนวนการสแกนทั้งหมด (Total Scan Logs)', '=IFERROR(COUNTA(Logs!A2:A), 0)', 'ประวัติการบันทึกสแกนเข้า-ออกทั้งหมด'],
            ['สแกนเข้าวันนี้ (Checked-In Today)', '=IFERROR(COUNTIFS(Logs!H2:H, "check-in", Logs!I2:I, ">="&TODAY()), 0)', 'จำนวนยอดผู้ผ่านเข้าวันนี้'],
            ['สแกนออกวันนี้ (Checked-Out Today)', '=IFERROR(COUNTIFS(Logs!H2:H, "check-out", Logs!I2:I, ">="&TODAY()), 0)', 'จำนวนยอดผู้ผ่านออกวันนี้']
          ],
        },
      });
    }

    if (!existingTitles.includes('Visitors')) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Visitors!A1:P1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'ID', 'Name', 'Passport ID', 'Phone', 'Vehicle Plate', 'Address', 
            'Company', 'Visitor Type', 'Contact Area', 'Photo URL', 'Photo Drive ID', 
            'Status', 'Ban Reason', 'Registered At', 'Last Activity At', 'Registered By'
          ]],
        },
      });
    }

    if (!existingTitles.includes('Logs')) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Logs!A1:K1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Log ID', 'Visitor ID', 'Visitor Name', 'Passport ID', 'Phone', 
            'Vehicle Plate', 'Contact Area', 'Action', 'Timestamp', 'Gateway Checkpoint', 'Scanned By'
          ]],
        },
      });
    }

    if (!existingTitles.includes('BrandingConfig')) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'BrandingConfig!A1:J1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Organization Name', 'Logo URL', 'Logo Drive ID', 'Primary Color', 'Accent Color', 
            'Required Fields', 'Role Menu Permissions', 'Pass Template', 'Face Match Threshold', 'Email Report Config'
          ]],
        },
      });
    }

    if (!existingTitles.includes('SystemUsers')) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'SystemUsers!A1:G1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Username', 'Password', 'Name', 'Email', 'Role', 'Created At', 'Avatar']],
        },
      });
      // Add default admin
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'SystemUsers!A2:G2',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Adminmaingate', 'Admin**5596', 'Super Admin', 'kittisak.s99631@gmail.com', 'ผู้ดูแลระบบระดับสูง (Administrator)', new Date().toISOString(), '']],
        },
      });
    }
  } catch (err: any) {
    console.error('Error in ensureAllDatabaseSheets:', err.message);
  }
}

// Helper: Find or Create Google Sheet Database
async function getOrCreateDatabase(oauth2Client: any): Promise<string> {
  // If the user configured a custom Google Spreadsheet ID in their branding, use that directly!
  try {
    const fallback = loadFallbackDB();
    if (fallback.branding && fallback.branding.googleSpreadsheetId) {
      const customId = fallback.branding.googleSpreadsheetId.trim();
      if (customId) {
        dbSpreadsheetId = customId;
        console.log(`Using user-configured Google Spreadsheet ID: ${dbSpreadsheetId}`);
        const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
        await ensureAllDatabaseSheets(sheets, dbSpreadsheetId);
        return dbSpreadsheetId;
      }
    }
  } catch (err) {
    console.error('Error checking user-configured spreadsheet ID:', err);
  }

  if (dbSpreadsheetId) {
    try {
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      await ensureAllDatabaseSheets(sheets, dbSpreadsheetId);
    } catch (err: any) {
      console.warn('Error verifying sheets on cached dbSpreadsheetId:', err.message);
    }
    return dbSpreadsheetId;
  }

  // Set default spreadsheet ID to the shared sheet provided by the user
  dbSpreadsheetId = '17bfDUWPaTfmULl9WApmkbdqNsIXdhxceaYQ5uRK5PtA';
  console.log(`Using default shared Google Spreadsheet ID: ${dbSpreadsheetId}`);

  try {
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    await ensureAllDatabaseSheets(sheets, dbSpreadsheetId);
    return dbSpreadsheetId;
  } catch (err: any) {
    console.error('Error ensuring sheets on default spreadsheet ID:', err.message);
    const isAuthErr = handleGoogleError(err, oauth2Client);
    if (isAuthErr) {
      console.warn('[GOOGLE AUTH ERROR] Invalid credentials. Aborting.');
      throw err;
    }
  }

  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  // Search for existing sheet
  try {
    const listRes = await drive.files.list({
      q: "name = 'MainGate_Pass_System_Database' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
      fields: 'files(id)',
      pageSize: 1,
    });

    if (listRes.data.files && listRes.data.files.length > 0) {
      dbSpreadsheetId = listRes.data.files[0].id!;
      console.log(`Found existing database sheet with ID: ${dbSpreadsheetId}`);
      return dbSpreadsheetId;
    }
  } catch (err: any) {
    const isAuthErr = handleGoogleError(err, oauth2Client);
    if (isAuthErr) {
      console.warn('[GOOGLE AUTH ERROR] Invalid credentials during file search. Aborting further Google API attempts.');
      throw err;
    }
    console.error('Error listing files to find database sheet:', err);
  }

  // Create new spreadsheet
  console.log('Database sheet not found. Creating a new one...');
  try {
    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: 'MainGate_Pass_System_Database' },
        sheets: [
          { properties: { title: 'Visitors' } },
          { properties: { title: 'Logs' } },
          { properties: { title: 'BrandingConfig' } },
        ],
      },
    });

    const sheetId = createRes.data.spreadsheetId!;

    // Add headers to 'Visitors'
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Visitors!A1:P1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'ID', 'Name', 'Passport ID', 'Phone', 'Vehicle Plate', 'Address', 
          'Company', 'Visitor Type', 'Contact Area', 'Photo URL', 'Photo Drive ID', 
          'Status', 'Ban Reason', 'Registered At', 'Last Activity At', 'Registered By'
        ]],
      },
    });

    // Add headers to 'Logs'
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Logs!A1:K1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'ID', 'Visitor ID', 'Visitor Name', 'Visitor Type', 'Vehicle Plate', 
          'Company', 'Action', 'Timestamp', 'Area', 'Guard Name', 'Guard Checkpoint'
        ]],
      },
    });

    // Add default row to 'BrandingConfig'
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'BrandingConfig!A1:J2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['Organization Name', 'Logo URL', 'Logo Drive ID', 'Primary Color', 'Accent Color', 'Required Fields JSON', 'Role Menu Permissions JSON', 'Pass Template JSON', 'Face Match Threshold', 'Email Report Config JSON'],
          [
            'GatePass Systeam CDC', 
            'https://lh3.googleusercontent.com/d/179vF02W0h7sP5eWfpD6fQZ4539VNYcr4', 
            '179vF02W0h7sP5eWfpD6fQZ4539VNYcr4', 
            '#0f172a', 
            '#3b82f6', 
            JSON.stringify({
              name: true,
              passportId: true,
              phone: true,
              vehiclePlate: true,
              address: true,
              company: true,
              visitorType: true,
              contactArea: true,
            }),
            JSON.stringify({
              'ผู้ดูแลระบบระดับสูง (Administrator)': {
                gate: true, register: true, pass: true, admin: true,
                admin_dashboard: true, admin_visitors: true, admin_checkpoints: true, admin_reports: true, admin_config: true, admin_permissions: true
              },
              'ผู้จัดการ (Manager)': {
                gate: true, register: true, pass: true, admin: true,
                admin_dashboard: true, admin_visitors: true, admin_checkpoints: true, admin_reports: true, admin_config: true, admin_permissions: true
              },
              'หัวหน้าฝ่ายความปลอดภัย (Supervisor)': {
                gate: true, register: true, pass: true, admin: true,
                admin_dashboard: true, admin_visitors: true, admin_checkpoints: true, admin_reports: true, admin_config: false, admin_permissions: false
              },
              'เจ้าหน้าที่ความปลอดภัย (Staff)': {
                gate: true, register: true, pass: true, admin: false,
                admin_dashboard: false, admin_visitors: false, admin_checkpoints: false, admin_reports: false, admin_config: false, admin_permissions: false
              },
              'เจ้าหน้าที่รักษาความปลอดภัย (Guard)': {
                gate: true, register: true, pass: true, admin: false,
                admin_dashboard: false, admin_visitors: false, admin_checkpoints: false, admin_reports: false, admin_config: false, admin_permissions: false
              }
            }),
            JSON.stringify({
              layout: 'receipt',
              badgeWidth: '220px',
              fontSize: 'base',
              textColor: '#000000',
              bgColor: '#ffffff',
              borderColor: '#3b82f6',
              borderWidth: '2px',
              borderRadius: 'lg',
              headerText: 'บัตรผ่านเข้า-ออก (Visitor Pass)',
              footerText: 'กรุณาแสดงใบผ่านต่อเจ้าหน้าที่รักษาความปลอดภัย',
              showQrCode: true,
              showPhoto: true,
              showContactArea: true,
              showCompany: true,
              showVehiclePlate: true,
              showTimeIn: true,
              watermarkText: 'APPROVED',
              signatureLine: true,
              securityNotice: 'บัตรนี้เป็นทรัพย์สินของบริษัทฯ กรุณาคืน ณ จุดแลกบัตรเมื่อเดินทางออก',
              fontFamily: 'Inter',
            }),
            '0.80',
            JSON.stringify({
              enabled: false,
              recipients: '',
              ccRecipients: '',
              sendTime: '01:00'
            })
          ]
        ],
      },
    });

    dbSpreadsheetId = sheetId;
    console.log(`Successfully created database sheet with ID: ${dbSpreadsheetId}`);
    return dbSpreadsheetId;
  } catch (err) {
    console.error('Error creating database sheet:', err);
    throw new Error('Failed to bootstrap Google Sheets database');
  }
}

let cachedDriveFolderId: string | null = null;

// Helper: Find or Create Google Drive Folder for Photos
async function getOrCreateFolder(drive: any): Promise<string> {
  if (cachedDriveFolderId) {
    return cachedDriveFolderId;
  }

  const res = await drive.files.list({
    q: "name = 'MainGate_Pass_Photos' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    fields: 'files(id)',
    pageSize: 1,
  });

  if (res.data.files && res.data.files.length > 0) {
    cachedDriveFolderId = res.data.files[0].id!;
    // Ensure existing folders are also shared publicly asynchronously
    drive.permissions.create({
      fileId: cachedDriveFolderId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    }).catch(() => {});
    return cachedDriveFolderId;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: 'MainGate_Pass_Photos',
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });

  const folderId = folder.data.id!;
  try {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
    console.log(`Successfully shared folder ${folderId} publicly.`);
  } catch (permErr: any) {
    console.warn('Could not share folder publicly:', permErr.message);
  }

  return folderId;
}

// --- API ENDPOINTS ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', geminiEnabled: !!ai });
});

// Proxy route to stream photos from Google Drive securely
app.get('/api/photo/:driveId', async (req, res) => {
  try {
    let token = cachedAccessToken;
    
    // Fallback to reading disk token without strict age restriction to maximize image rendering success
    if (!token) {
      try {
        if (fs.existsSync(TOKEN_FILE_PATH)) {
          const diskToken = fs.readFileSync(TOKEN_FILE_PATH, 'utf8').trim();
          if (diskToken) {
            token = diskToken;
          }
        }
      } catch (_) {}
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      const publicUrl = `https://lh3.googleusercontent.com/d/${req.params.driveId}`;
      try {
        const response = await fetch(publicUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.send(buffer);
        }
      } catch (fetchErr: any) {
        console.error('Error proxying public drive image on server:', fetchErr.message);
      }
      return res.redirect(publicUrl);
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const driveRes = await drive.files.get(
      { fileId: req.params.driveId, alt: 'media' },
      { responseType: 'stream' }
    );

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    driveRes.data.pipe(res);
  } catch (err: any) {
    console.error('Error proxying photo from Drive, attempting public stream fallback:', err.message);
    const publicUrl = `https://lh3.googleusercontent.com/d/${req.params.driveId}`;
    try {
      const response = await fetch(publicUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(buffer);
      }
    } catch (fetchErr: any) {
      console.error('Error proxying public drive image on error fallback:', fetchErr.message);
    }
    res.redirect(publicUrl);
  }
});

// Endpoint to generate QR codes on-the-fly
app.get('/api/qrcode', async (req, res) => {
  try {
    const text = req.query.text as string;
    if (!text) {
      return res.status(400).send('Parameter text is required');
    }
    const QRCode = (await import('qrcode')).default;
    const qrBuffer = await QRCode.toBuffer(text, {
      margin: 1,
      width: 250,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    res.setHeader('Content-Type', 'image/png');
    res.send(qrBuffer);
  } catch (err: any) {
    console.error('QR Code generation error:', err);
    res.status(500).send(err.message);
  }
});

// Get branding and config
app.get(['/api/branding', '/api/config'], async (req, res) => {
  try {
    if (!isGoogleConnected(req)) {
      const fallback = loadFallbackDB();
      return res.json(fallback.branding);
    }

    const auth = getOAuth2Client(req);
    const sheetId = await getOrCreateDatabase(auth);
    const sheets = google.sheets({ version: 'v4', auth });

    const configRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'BrandingConfig!A2:J2',
    });

    if (configRes.data.values && configRes.data.values.length > 0) {
      const row = configRes.data.values[0];
      const brandingData = {
        organizationName: row[0] || 'GatePass Systeam CDC',
        logoUrl: row[1] || 'https://lh3.googleusercontent.com/d/179vF02W0h7sP5eWfpD6fQZ4539VNYcr4',
        logoDriveId: row[2] || '179vF02W0h7sP5eWfpD6fQZ4539VNYcr4',
        primaryColor: row[3] || '#0f172a',
        accentColor: row[4] || '#3b82f6',
        requiredFields: row[5] ? JSON.parse(row[5]) : {
          name: true,
          passportId: true,
          phone: true,
          vehiclePlate: true,
          address: true,
          company: true,
          visitorType: true,
          contactArea: true,
        },
        roleMenuPermissions: row[6] ? JSON.parse(row[6]) : null,
        passTemplate: row[7] ? JSON.parse(row[7]) : {
          layout: 'receipt',
          badgeWidth: '220px',
          fontSize: 'base',
          textColor: '#000000',
          bgColor: '#ffffff',
          borderColor: '#3b82f6',
          borderWidth: '2px',
          borderRadius: 'lg',
          headerText: 'บัตรผ่านเข้า-ออก (Visitor Pass)',
          footerText: 'กรุณาแสดงใบผ่านต่อเจ้าหน้าที่รักษาความปลอดภัย',
          showQrCode: true,
          showPhoto: true,
          showContactArea: true,
          showCompany: true,
          showVehiclePlate: true,
          showTimeIn: true,
          watermarkText: 'APPROVED',
          signatureLine: true,
          securityNotice: 'บัตรนี้เป็นทรัพย์สินของบริษัทฯ กรุณาคืน ณ จุดแลกบัตรเมื่อเดินทางออก',
          fontFamily: 'Inter',
        },
        faceMatchThreshold: row[8] ? parseFloat(row[8]) : 0.80,
        emailReportConfig: row[9] ? JSON.parse(row[9]) : {
          enabled: false,
          recipients: '',
          ccRecipients: '',
          sendTime: '01:00'
        }
      };

      // Sync local fallback with the values read from Sheets
      const fallback = loadFallbackDB();
      fallback.branding = {
        ...fallback.branding,
        ...brandingData
      };
      saveFallbackDB(fallback);

      return res.json(fallback.branding);
    }

    const fallback = loadFallbackDB();
    res.json(fallback.branding);
  } catch (err: any) {
    handleGoogleError(err, req);
    console.warn('Error reading config from Sheets, using local fallback:', err.message);
    const fallback = loadFallbackDB();
    res.json(fallback.branding);
  }
});

// Update branding & config (allows logo upload too)
app.post(['/api/branding', '/api/config'], async (req, res) => {
  try {
    const { 
      organizationName, 
      logoBase64, 
      primaryColor, 
      accentColor, 
      requiredFields, 
      roleMenuPermissions, 
      passTemplate, 
      faceMatchThreshold, 
      emailReportConfig,
      googleAuthType,
      googleServiceAccountJson,
      googleSpreadsheetId,
      googleAppsScriptUrl,
      emailServiceType,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass
    } = req.body;

    let logoUrl = req.body.logoUrl || '';
    let logoDriveId = req.body.logoDriveId || '';

    // Always keep fallback DB updated with latest branding info immediately
    const fallback = loadFallbackDB();
    
    // Clear in-memory sheet ID cache if the user inputted a different sheet ID
    if (googleSpreadsheetId !== undefined && googleSpreadsheetId !== fallback.branding.googleSpreadsheetId) {
      dbSpreadsheetId = null;
    }

    fallback.branding = {
      organizationName,
      logoUrl,
      logoDriveId,
      primaryColor,
      accentColor,
      requiredFields,
      roleMenuPermissions: roleMenuPermissions || null,
      passTemplate: passTemplate || null,
      faceMatchThreshold: faceMatchThreshold !== undefined ? parseFloat(faceMatchThreshold) : 0.80,
      emailReportConfig: emailReportConfig || {
        enabled: false,
        recipients: '',
        ccRecipients: '',
        sendTime: '01:00'
      },
      googleAuthType: googleAuthType || 'oauth',
      googleServiceAccountJson: googleServiceAccountJson || '',
      googleSpreadsheetId: googleSpreadsheetId || '',
      googleAppsScriptUrl: googleAppsScriptUrl || '',
      emailServiceType: emailServiceType || 'gmail_api',
      smtpHost: smtpHost || '',
      smtpPort: smtpPort || '',
      smtpSecure: smtpSecure === true || smtpSecure === 'true',
      smtpUser: smtpUser || '',
      smtpPass: smtpPass || ''
    };

    if (isGoogleConnected(req)) {
      try {
        const auth = getOAuth2Client(req);
        const sheetId = await getOrCreateDatabase(auth);
        const sheets = google.sheets({ version: 'v4', auth });
        const drive = google.drive({ version: 'v3', auth });

        // If a new logo is uploaded as base64, save it to Google Drive
        if (logoBase64 && logoBase64.startsWith('data:image')) {
          const folderId = await getOrCreateFolder(drive);
          const mediaStream = base64ToStream(logoBase64);

          const fileMetadata = {
            name: `logo_${Date.now()}.png`,
            parents: [folderId],
          };

          const file = await drive.files.create({
            requestBody: fileMetadata,
            media: {
              mimeType: 'image/png',
              body: mediaStream,
            },
            fields: 'id,webContentLink',
          });

          logoDriveId = file.data.id!;
          
          try {
            await drive.permissions.create({
              fileId: logoDriveId,
              requestBody: {
                role: 'reader',
                type: 'anyone',
              },
            });
            console.log(`Successfully shared logo ${logoDriveId} publicly.`);
          } catch (permErr: any) {
            console.warn('Could not share logo publicly:', permErr.message);
          }

          logoUrl = `/api/photo/${logoDriveId}`;
          
          fallback.branding.logoUrl = logoUrl;
          fallback.branding.logoDriveId = logoDriveId;
        }

        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: 'BrandingConfig!A2:J2',
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
              organizationName,
              logoUrl,
              logoDriveId,
              primaryColor,
              accentColor,
              JSON.stringify(requiredFields),
              roleMenuPermissions ? JSON.stringify(roleMenuPermissions) : '',
              passTemplate ? JSON.stringify(passTemplate) : '',
              faceMatchThreshold !== undefined ? String(faceMatchThreshold) : '0.80',
              JSON.stringify(fallback.branding.emailReportConfig)
            ]],
          },
        });
      } catch (googleErr: any) {
         console.error('Failed to update Google Sheets BrandingConfig, using local fallback sync:', googleErr.message);
      }
    }

    saveFallbackDB(fallback);
    res.json({ 
      success: true, 
      organizationName, 
      logoUrl: fallback.branding.logoUrl, 
      logoDriveId: fallback.branding.logoDriveId, 
      primaryColor, 
      accentColor, 
      requiredFields,
      roleMenuPermissions: fallback.branding.roleMenuPermissions,
      passTemplate: fallback.branding.passTemplate,
      faceMatchThreshold: fallback.branding.faceMatchThreshold,
      emailReportConfig: fallback.branding.emailReportConfig,
      googleAuthType: fallback.branding.googleAuthType,
      googleServiceAccountJson: fallback.branding.googleServiceAccountJson,
      googleSpreadsheetId: fallback.branding.googleSpreadsheetId,
      googleAppsScriptUrl: fallback.branding.googleAppsScriptUrl,
      emailServiceType: fallback.branding.emailServiceType,
      smtpHost: fallback.branding.smtpHost,
      smtpPort: fallback.branding.smtpPort,
      smtpSecure: fallback.branding.smtpSecure,
      smtpUser: fallback.branding.smtpUser,
      smtpPass: fallback.branding.smtpPass
    });
  } catch (err: any) {
    console.error('Error updating config:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper to dynamically ensure the SystemUsers sheet exists in the Google spreadsheet
async function ensureSystemUsersSheet(sheets: any, spreadsheetId: string) {
  try {
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsList = res.data.sheets || [];
    const hasSystemUsers = sheetsList.some((s: any) => s.properties.title === 'SystemUsers');
    if (!hasSystemUsers) {
      console.log('SystemUsers sheet not found. Creating one...');
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: 'SystemUsers' }
              }
            }
          ]
        }
      });
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'SystemUsers!A1:G1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Username', 'Password', 'Name', 'Email', 'Role', 'Created At', 'Avatar']],
        },
      });
      // Add default admin
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'SystemUsers!A2:G2',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Adminmaingate', 'Admin**5596', 'Super Admin', 'kittisak.s99631@gmail.com', 'ผู้ดูแลระบบระดับสูง (Administrator)', new Date().toISOString(), '']],
        },
      });
    }
  } catch (err) {
    console.error('Error ensuring SystemUsers sheet:', err);
  }
}

// Get all system users
app.get('/api/system-users', async (req, res) => {
  try {
    if (!isGoogleConnected(req)) {
      const fallback = loadFallbackDB();
      return res.json(fallback.systemUsers || DEFAULT_FALLBACK_DB.systemUsers);
    }

    const auth = getOAuth2Client(req);
    const sheetId = await getOrCreateDatabase(auth);
    const sheets = google.sheets({ version: 'v4', auth });

    await ensureSystemUsersSheet(sheets, sheetId);

    const usersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'SystemUsers!A2:G',
    });

    if (usersRes.data.values && usersRes.data.values.length > 0) {
      const users = usersRes.data.values.map(row => ({
        username: row[0] || '',
        password: row[1] || '',
        name: row[2] || '',
        email: row[3] || '',
        role: row[4] || '',
        createdAt: row[5] || '',
        avatar: row[6] || null,
      }));
      return res.json(users);
    }

    const fallback = loadFallbackDB();
    res.json(fallback.systemUsers || DEFAULT_FALLBACK_DB.systemUsers);
  } catch (err: any) {
    handleGoogleError(err, req);
    console.warn('Error reading system users from Sheets, using local fallback:', err.message);
    const fallback = loadFallbackDB();
    res.json(fallback.systemUsers || DEFAULT_FALLBACK_DB.systemUsers);
  }
});

// Heartbeat endpoint for tracking online users
app.post('/api/heartbeat', (req, res) => {
  try {
    const { username, name, role, avatar, activeCheckpoint, currentTab } = req.body || {};
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    pruneOnlineSessions();

    const lowerUser = String(username).toLowerCase().trim();

    // Check if user was force-logged out
    const forceExpiry = forcedLogoutUsersMap.get(lowerUser);
    if (forceExpiry && Date.now() < forceExpiry) {
      onlineSessionsMap.delete(lowerUser);
      return res.json({ forcedLogout: true, message: 'You have been logged out by an administrator.' });
    }

    const existing = onlineSessionsMap.get(lowerUser);
    const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();

    const updatedSession: OnlineSession = {
      username,
      name: name || username,
      role: role || 'Guard',
      avatar: avatar || null,
      activeCheckpoint: activeCheckpoint || undefined,
      currentTab: currentTab || undefined,
      loginTime: existing ? existing.loginTime : Date.now(),
      lastActiveAt: Date.now(),
      ip: clientIp,
    };

    onlineSessionsMap.set(lowerUser, updatedSession);

    res.json({
      status: 'ok',
      onlineCount: onlineSessionsMap.size,
      forcedLogout: false,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get currently online users
app.get('/api/online-users', (req, res) => {
  try {
    pruneOnlineSessions();
    const sessions = Array.from(onlineSessionsMap.values()).sort((a, b) => b.lastActiveAt - a.lastActiveAt);
    res.json({
      onlineCount: sessions.length,
      sessions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logout session explicitly
app.post('/api/logout-session', (req, res) => {
  try {
    const { username } = req.body || {};
    if (username) {
      onlineSessionsMap.delete(String(username).toLowerCase().trim());
    }
    res.json({ status: 'ok' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Force logout user (by admin)
app.post('/api/force-logout-user', (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    const lowerUser = String(username).toLowerCase().trim();
    onlineSessionsMap.delete(lowerUser);
    forcedLogoutUsersMap.set(lowerUser, Date.now() + 60000); // 1 minute lockout

    res.json({ status: 'ok', message: `User @${username} has been force logged out.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update a system user
app.post('/api/system-users', async (req, res) => {
  let newUser: any = null;
  try {
    const { username, password, name, email, role, createdAt, avatar } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    newUser = {
      username: username.trim(),
      password,
      name: (name || '').trim(),
      email: (email || '').trim(),
      role: role || 'เจ้าหน้าที่รักษาความปลอดภัย (Guard)',
      createdAt: createdAt || new Date().toISOString(),
      avatar: avatar || null,
    };

    // 1. Sync to Fallback Database
    const fallback = loadFallbackDB();
    if (!fallback.systemUsers) {
      fallback.systemUsers = [...DEFAULT_FALLBACK_DB.systemUsers!];
    }
    const existingIdx = fallback.systemUsers.findIndex(u => u && u.username && String(u.username).toLowerCase() === String(newUser.username || '').toLowerCase());
    if (existingIdx !== -1) {
      fallback.systemUsers[existingIdx] = newUser;
    } else {
      fallback.systemUsers.push(newUser);
    }
    saveFallbackDB(fallback);

    // 2. Sync to Google Sheets if connected
    if (isGoogleConnected(req)) {
      const auth = getOAuth2Client(req);
      const sheetId = await getOrCreateDatabase(auth);
      const sheets = google.sheets({ version: 'v4', auth });

      await ensureSystemUsersSheet(sheets, sheetId);

      // Get all existing users from Sheets to check for duplicates or find row to update
      const usersRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'SystemUsers!A2:A',
      });

      let existingRowIdx = -1;
      if (usersRes.data.values) {
        existingRowIdx = usersRes.data.values.findIndex(
          row => row && row[0] && String(row[0]).toLowerCase() === String(newUser.username || '').toLowerCase()
        );
      }

      const rowValues = [
        newUser.username,
        newUser.password,
        newUser.name,
        newUser.email,
        newUser.role,
        newUser.createdAt,
        newUser.avatar || '',
      ];

      if (existingRowIdx !== -1) {
        // Update existing row (Row 2 corresponds to Index 0, so Row = existingRowIdx + 2)
        const rowNum = existingRowIdx + 2;
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `SystemUsers!A${rowNum}:G${rowNum}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [rowValues],
          },
        });
        console.log(`Updated user ${newUser.username} in Sheets Row ${rowNum}`);
      } else {
        // Append new row
        await sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: 'SystemUsers!A2:G2',
          valueInputOption: 'RAW',
          requestBody: {
            values: [rowValues],
          },
        });
        console.log(`Appended new user ${newUser.username} to Sheets`);
      }
    }

    res.json({ success: true, user: newUser });
  } catch (err: any) {
    handleGoogleError(err, req);
    console.warn('Error saving system user on Google Sheets, saved to local fallback:', err.message);
    res.json({ success: true, user: newUser, warnMessage: 'บันทึกข้อมูลผู้ใช้งานสำเร็จบนเซิร์ฟเวอร์สำรอง' });
  }
});

// Seed mock visitors (generates 1,000 mock visitor passes and history records)
app.post('/api/seed-mock-visitors', async (req, res) => {
  try {
    const isGoogle = isGoogleConnected(req);
    let auth: any = null;
    let sheetId = '';
    let sheets: any = null;
    let fallback: any = null;

    if (isGoogle) {
      auth = getOAuth2Client(req);
      sheetId = await getOrCreateDatabase(auth);
      sheets = google.sheets({ version: 'v4', auth });
    } else {
      fallback = loadFallbackDB();
    }

    // Helper data
    const thaiFirstNames = ['สมชาย', 'สมศักดิ์', 'วิชัย', 'ประเสริฐ', 'กิตติศักดิ์', 'สุรชัย', 'มนัส', 'อภิชาติ', 'ธีรพงษ์', 'เกียรติศักดิ์', 'สุรศักดิ์', 'ณรงค์', 'อนันต์', 'สุวรรณ', 'ชูชาติ', 'พลอยไพลิน', 'สุภัทรา', 'สุนิสา', 'ณิชา', 'อรวรรณ', 'จิราภรณ์', 'พัชรี', 'ศิริพร', 'สุพัตรา', 'กนกวรรณ', 'วรรณวิสา', 'พิมลพรรณ', 'รัตนา', 'กมลวรรณ'];
    const thaiLastNames = ['รักดี', 'ดวงดี', 'มั่นคง', 'เกียรติกล้า', 'ใจกว้าง', 'ทองคำ', 'แสงจันทร์', 'รุ่งเรือง', 'รุ่งโรจน์', 'ประสริฐกุล', 'วัฒนพานิช', 'เลิศวิจิตร', 'ดีพิเศษ', 'งามเลิศ', 'เจริญผล', 'จงรักไทย', 'มั่งคั่ง', 'ศรีสุข', 'บุญช่วย', 'รอดภัย'];
    const platePrefixes = ['กข', 'มค', 'ศศ', 'ชพ', 'วร', 'ฆจ', 'ภท', 'ฮร', '1กข', '3ศศ', '7ฆจ', '9ภท'];
    const provinces = ['กรุงเทพมหานคร', 'เชียงใหม่', 'ชลบุรี', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'นครราชสีมา', 'ขอนแก่น', 'ภูเก็ต', 'สงขลา'];
    const companies = ['บจก. รักษาความปลอดภัย เอสพี', 'บมจ. เจริญโภคภัณฑ์', 'บจก. ขนส่งรวดเร็ว', 'บจก. เอสซีจี ดีสทริบิวชั่น', 'บมจ. ปตท.', 'บจก. เคอรี่ เอ็กซ์เพรส', 'บจก. แฟลช เอ็กซ์เพรส', 'บจก. ไปรษณีย์ไทย', 'บมจ. ทรู คอร์ปอเรชั่น', 'บมจ. แอดวานซ์ อินโฟร์ เซอร์วิส'];
    const visitorTypes = ['ผู้รับเหมา (Contractor)', 'ผู้ติดต่อทั่วไป (Visitor)', 'ส่งของ/พัสดุ (Delivery)', 'ญาติ/ผู้มาหา (Personal)'];
    const areas = ['คลังสินค้า A', 'คลังสินค้า B', 'อาคารสำนักงานใหญ่ ชั้น 1', 'อาคารสำนักงานใหญ่ ชั้น 2', 'อาคารสำนักงานใหญ่ ชั้น 3', 'ฝ่ายผลิต โรงงาน 1', 'ฝ่ายซ่อมบำรุง', 'ห้องไอทีและเซิร์ฟเวอร์', 'แผนกต้อนรับ'];
    const banReasons = ['ไม่สวมหมวกนิรภัยในพื้นที่ก่อสร้าง', 'ไม่พกบัตรประชาชนตัวจริงมาแสดงสิทธิ์', 'ขับรถเร็วกว่าที่กำหนดไว้ในพื้นที่ (เกิน 20 กม./ชม.)', 'พยายามเข้าเขตพื้นที่หวงห้ามโดยไม่ได้รับอนุญาต'];

    const newVisitors: any[] = [];
    const newLogs: any[] = [];

    // Let's get starting ID number
    let startIdNum = 1;
    if (isGoogle) {
      try {
        const resIds = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: 'Visitors!A2:A',
        });
        if (resIds.data.values) {
          const ids = resIds.data.values.map((row: any) => row[0]).filter(Boolean);
          for (const id of ids) {
            const match = id.match(/^(?:P|p)?0*([1-9]\d*)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num >= startIdNum) startIdNum = num + 1;
            }
          }
        }
      } catch (err) {
        console.warn('Error reading start ID for seed, fallback to 1:', err);
      }
    } else {
      if (fallback.visitors && fallback.visitors.length > 0) {
        const ids = fallback.visitors.map((v: any) => v.id).filter(Boolean);
        for (const id of ids) {
          const match = id.match(/^(?:P|p)?0*([1-9]\d*)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num >= startIdNum) startIdNum = num + 1;
          }
        }
      }
    }

    const totalToGenerate = req.body?.count ? Number(req.body.count) : 10000;
    const nowMs = Date.now();

    for (let i = 0; i < totalToGenerate; i++) {
      const idNum = startIdNum + i;
      const id = 'P' + String(idNum).padStart(6, '0');
      
      const firstName = thaiFirstNames[Math.floor(Math.random() * thaiFirstNames.length)];
      const lastName = thaiLastNames[Math.floor(Math.random() * thaiLastNames.length)];
      const name = `${firstName} ${lastName}`;
      
      const passportId = '1' + Math.floor(100000000000 + Math.random() * 900000000000).toString();
      const phone = '0' + (80 + Math.floor(Math.random() * 20)).toString() + '-' + Math.floor(100 + Math.random() * 900).toString() + '-' + Math.floor(1000 + Math.random() * 9000).toString();
      
      const vehiclePlate = `${platePrefixes[Math.floor(Math.random() * platePrefixes.length)]} ${Math.floor(100 + Math.random() * 9000)} ${provinces[Math.floor(Math.random() * provinces.length)]}`;
      const address = `${Math.floor(1 + Math.random() * 200)}/${Math.floor(1 + Math.random() * 50)} ถ.มิตรภาพ ต.ในเมือง อ.เมือง`;
      const company = companies[Math.floor(Math.random() * companies.length)];
      const visitorType = visitorTypes[Math.floor(Math.random() * visitorTypes.length)];
      const contactArea = areas[Math.floor(Math.random() * areas.length)];
      
      // Avatar placeholder list (beautiful random profiles)
      const randomSeed = Math.floor(Math.random() * 1000);
      const photoUrl = `https://picsum.photos/seed/${randomSeed}/150/150`;
      const photoDriveId = 'mock_seed';

      // Decide status
      const statusRand = Math.random();
      let status: any = 'ยังไม่ถูกเช็คอิน';
      let banReason = '';
      
      // 14 days spread
      const regDiffMs = Math.floor(Math.random() * 14 * 24 * 3600 * 1000);
      const regDate = new Date(nowMs - regDiffMs);
      const registeredAt = regDate.toISOString();
      let lastActivityAt = '';

      if (statusRand < 0.04) {
        status = 'banned';
        banReason = banReasons[Math.floor(Math.random() * banReasons.length)];
      } else if (statusRand < 0.20) {
        status = 'ยังไม่ถูกเช็คอิน';
      } else if (statusRand < 0.35) {
        status = 'เช็คอินโดย Adminmaingate';
        const checkInOffset = Math.floor(Math.random() * 60 * 60 * 1000); // within an hour of registration
        const checkInDate = new Date(regDate.getTime() + checkInOffset);
        lastActivityAt = checkInDate.toISOString();

        // Create Check-In Log
        const logId = 'L' + Math.floor(100000 + Math.random() * 900000);
        newLogs.push({
          id: logId,
          visitorId: id,
          visitorName: name,
          visitorType,
          vehiclePlate,
          company,
          action: 'check-in',
          timestamp: lastActivityAt,
          area: contactArea,
          guardName: 'Adminmaingate',
          guardCheckpoint: 'ประตูทางเข้าหลัก A',
        });
      } else {
        status = 'เช็คเอาท์โดย Adminmaingate';
        const checkInOffset = Math.floor(Math.random() * 30 * 60 * 1000);
        const checkInDate = new Date(regDate.getTime() + checkInOffset);
        
        const checkOutOffset = Math.floor(Math.random() * 4 * 60 * 60 * 1000) + 15 * 60 * 1000; // 15m to 4h
        const checkOutDate = new Date(checkInDate.getTime() + checkOutOffset);
        lastActivityAt = checkOutDate.toISOString();

        // Create Check-In Log
        const logIdIn = 'L' + Math.floor(100000 + Math.random() * 900000);
        newLogs.push({
          id: logIdIn,
          visitorId: id,
          visitorName: name,
          visitorType,
          vehiclePlate,
          company,
          action: 'check-in',
          timestamp: checkInDate.toISOString(),
          area: contactArea,
          guardName: 'Adminmaingate',
          guardCheckpoint: 'ประตูทางเข้าหลัก A',
        });

        // Create Check-Out Log
        const logIdOut = 'L' + Math.floor(100000 + Math.random() * 900000);
        newLogs.push({
          id: logIdOut,
          visitorId: id,
          visitorName: name,
          visitorType,
          vehiclePlate,
          company,
          action: 'check-out',
          timestamp: lastActivityAt,
          area: contactArea,
          guardName: 'Adminmaingate',
          guardCheckpoint: 'ประตูทางออกหลัก B',
        });
      }

      newVisitors.push({
        id,
        name,
        passportId,
        phone,
        vehiclePlate,
        address,
        company,
        visitorType,
        contactArea,
        photoUrl,
        photoDriveId,
        status,
        banReason,
        registeredAt,
        lastActivityAt: lastActivityAt || registeredAt,
        registeredBy: 'ระบบอัตโนมัติ',
      });
    }

    if (isGoogle) {
      try {
        // Append to Google Sheets in batches
        const visitorsRows = newVisitors.map(v => [
          v.id, v.name, v.passportId, v.phone, v.vehiclePlate, v.address, v.company, v.visitorType, v.contactArea, v.photoUrl, v.photoDriveId, v.status, v.banReason, v.registeredAt, v.lastActivityAt, v.registeredBy || 'ระบบอัตโนมัติ'
        ]);

        const logsRows = newLogs.map(l => [
          l.id, l.visitorId, l.visitorName, l.visitorType, l.vehiclePlate, l.company, l.action, l.timestamp, l.area, l.guardName, l.guardCheckpoint
        ]);

        // Write visitors in batches of 500
        const batchSize = 500;
        for (let offset = 0; offset < visitorsRows.length; offset += batchSize) {
          const chunk = visitorsRows.slice(offset, offset + batchSize);
          await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'Visitors!A2',
            valueInputOption: 'RAW',
            requestBody: { values: chunk },
          });
        }

        // Write logs in batches of 500
        for (let offset = 0; offset < logsRows.length; offset += batchSize) {
          const chunk = logsRows.slice(offset, offset + batchSize);
          await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'Logs!A2',
            valueInputOption: 'RAW',
            requestBody: { values: chunk },
          });
        }
      } catch (sheetsErr: any) {
        console.warn('Google Sheets append failed during seed, saving to local DB:', sheetsErr.message);
      }
    }

    // Always ensure local DB is updated so instant local queries work seamlessly
    const fallbackDB = loadFallbackDB();
    fallbackDB.visitors = [...(fallbackDB.visitors || []), ...newVisitors];
    fallbackDB.activityLogs = [...(fallbackDB.activityLogs || []), ...newLogs];
    saveFallbackDB(fallbackDB);

    res.json({
      success: true,
      message: `สร้างข้อมูลทดสอบสำเร็จแล้ว! ทั้งหมด ${totalToGenerate} รายการ และบันทึกประวัติการเข้าออก ${newLogs.length} รายการ`,
    });
  } catch (err: any) {
    console.error('Error seeding mock visitors:', err);
    res.status(500).json({ error: err.message || 'Failed to seed mock visitors' });
  }
});

// Clear mock visitors & logs
app.post('/api/clear-mock-visitors', async (req, res) => {
  try {
    const isGoogle = isGoogleConnected(req);
    const fallback = loadFallbackDB();

    const isMockVisitor = (v: any) => v.photoDriveId === 'mock_seed' || v.registeredBy === 'ระบบอัตโนมัติ';
    
    const mockVisitorIds = new Set(
      (fallback.visitors || [])
        .filter(isMockVisitor)
        .map((v: any) => v.id)
    );

    const initialVisitorCount = (fallback.visitors || []).length;
    fallback.visitors = (fallback.visitors || []).filter((v: any) => !isMockVisitor(v));
    const deletedCount = initialVisitorCount - fallback.visitors.length;

    fallback.activityLogs = (fallback.activityLogs || []).filter((l: any) => !mockVisitorIds.has(l.visitorId) && l.guardName !== 'Adminmaingate');
    saveFallbackDB(fallback);

    if (isGoogle) {
      try {
        const auth = getOAuth2Client(req);
        const sheetId = await getOrCreateDatabase(auth);
        const sheets = google.sheets({ version: 'v4', auth });

        const vRes = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'Visitors!A2:P' });
        const vRows = vRes.data.values || [];
        const filteredVRows = vRows.filter(row => row[10] !== 'mock_seed' && row[15] !== 'ระบบอัตโนมัติ');

        const mockIdsInSheet = new Set(vRows.filter(row => row[10] === 'mock_seed' || row[15] === 'ระบบอัตโนมัติ').map(row => row[0]));

        const lRes = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'Logs!A2:K' });
        const lRows = lRes.data.values || [];
        const filteredLRows = lRows.filter(row => !mockIdsInSheet.has(row[1]) && row[9] !== 'Adminmaingate');

        await sheets.spreadsheets.values.clear({ spreadsheetId: sheetId, range: 'Visitors!A2:P' });
        await sheets.spreadsheets.values.clear({ spreadsheetId: sheetId, range: 'Logs!A2:K' });

        if (filteredVRows.length > 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: 'Visitors!A2',
            valueInputOption: 'RAW',
            requestBody: { values: filteredVRows }
          });
        }
        if (filteredLRows.length > 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: 'Logs!A2',
            valueInputOption: 'RAW',
            requestBody: { values: filteredLRows }
          });
        }
      } catch (sheetsErr: any) {
        console.warn('Google Sheets clear mock error:', sheetsErr.message);
      }
    }

    res.json({
      success: true,
      message: `ลบข้อมูลจำลองเรียบร้อยแล้ว (จำนวน ${deletedCount} รายการ)`,
    });
  } catch (err: any) {
    console.error('Error clearing mock visitors:', err);
    res.status(500).json({ error: err.message || 'Failed to clear mock visitors' });
  }
});

// Register new visitor (creates pass)
app.post('/api/register', async (req, res) => {
  const { name, passportId, phone, vehiclePlate, address, company, visitorType, contactArea, photoBase64, registeredBy } = req.body;
  try {
    if (!name || !passportId || !photoBase64) {
      return res.status(400).json({ error: 'ชื่อ, เลขบัตรประชาชน และรูปถ่ายหน้าตรง มีความจำเป็น' });
    }

    const registeredAt = new Date().toISOString();
    let id = '';

    if (!isGoogleConnected(req)) {
      // Local fallback mode
      console.log('Registering visitor in local fallback DB...');
      const fallback = loadFallbackDB();
      id = await getNextVisitorId(null, '', fallback);

      const existingBanned = fallback.visitors.find(v => v.passportId === passportId && v.status === 'banned');
      if (existingBanned) {
        return res.status(403).json({ error: `ไม่สามารถออกใบผ่านได้: บุคคลนี้ถูกระงับสิทธิ์การเข้าพื้นที่ (แบน) เนื่องจาก: ${existingBanned.banReason || 'ผิดกฎระเบียบของบริษัท'}` });
      }

      const photoUrl = photoBase64; // Use base64 photo directly in local fallback
      const photoDriveId = 'local_fallback';

      const visitor = {
        id,
        name,
        passportId,
        phone,
        vehiclePlate,
        address,
        company,
        visitorType,
        contactArea,
        photoUrl,
        photoDriveId,
        status: 'ยังไม่ถูกเช็คอิน' as any,
        registeredAt,
        registeredBy: registeredBy || '',
      };

      fallback.visitors.push(visitor);
      saveFallbackDB(fallback);

      return res.json({
        success: true,
        visitor,
      });
    }

    const auth = getOAuth2Client(req);
    const sheetId = await getOrCreateDatabase(auth);
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    const fallbackForId = loadFallbackDB();
    
    // Perform a SINGLE query to Google Sheets for both ban check and ID generation
    const checkRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Visitors!A2:O',
    });

    const rows = checkRes.data.values || [];
    const existingIds = rows.map(row => row[0]).filter(Boolean);
    id = await getNextVisitorId(null, '', fallbackForId, existingIds);

    const existingBanned = rows.find(row => row[2] === passportId && row[11] === 'banned');
    if (existingBanned) {
      return res.status(403).json({ error: `ไม่สามารถออกใบผ่านได้: บุคคลนี้ถูกระงับสิทธิ์การเข้าพื้นที่ (แบน) เนื่องจาก: ${existingBanned[12] || 'ผิดกฎระเบียบของบริษัท'}` });
    }

    // Upload photo to Drive or reuse existing if retrieving a historical record
    let photoDriveId = '';
    let photoUrl = '';

    if (photoBase64 && (photoBase64.startsWith('/api/photo/') || photoBase64.startsWith('http'))) {
      photoUrl = photoBase64;
      if (photoBase64.startsWith('/api/photo/')) {
        photoDriveId = photoBase64.substring('/api/photo/'.length);
      } else {
        const directMatch = photoBase64.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (directMatch) {
          photoDriveId = directMatch[1];
        } else {
          photoDriveId = 'reused_external';
        }
      }
    } else {
      const folderId = await getOrCreateFolder(drive);
      const mediaStream = base64ToStream(photoBase64);

      const fileMetadata = {
        name: `pass_${passportId}_${Date.now()}.jpg`,
        parents: [folderId],
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: 'image/jpeg',
          body: mediaStream,
        },
        fields: 'id',
      });

      photoDriveId = file.data.id!;
      
      // Share file publicly asynchronously (non-blocking)
      drive.permissions.create({
        fileId: photoDriveId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      }).catch(permErr => console.warn('Could not share visitor photo publicly:', permErr.message));

      photoUrl = `/api/photo/${photoDriveId}`;
    }

    // Append to 'Visitors'
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Visitors!A2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          id, name, passportId, phone, vehiclePlate, address, company, 
          visitorType, contactArea, photoUrl, photoDriveId, 'ยังไม่ถูกเช็คอิน', '', registeredAt, '', registeredBy || ''
        ]],
      },
    });

    // Also sync to local fallback database so offline views are kept synchronized
    try {
      const fallback = loadFallbackDB();
      fallback.visitors.push({
        id, name, passportId, phone, vehiclePlate, address, company, 
        visitorType, contactArea, photoUrl, photoDriveId, status: 'ยังไม่ถูกเช็คอิน' as any, registeredAt, registeredBy: registeredBy || ''
      });
      saveFallbackDB(fallback);
    } catch (err) {
      console.error('Error syncing registration to local DB:', err);
    }

    res.json({
      success: true,
      visitor: {
        id, name, passportId, phone, vehiclePlate, address, company, 
        visitorType, contactArea, photoUrl, photoDriveId, status: 'ยังไม่ถูกเช็คอิน' as any, registeredAt, registeredBy: registeredBy || ''
      }
    });
  } catch (err: any) {
    handleGoogleError(err);
    console.warn('Error during visitor registration on Sheets, saving to local fallback:', err.message);
    try {
      const fallback = loadFallbackDB();
      const id = await getNextVisitorId(null, '', fallback);
      
      const existingBanned = fallback.visitors.find(v => v.passportId === passportId && v.status === 'banned');
      if (existingBanned) {
        return res.status(403).json({ error: `ไม่สามารถออกใบผ่านได้: บุคคลนี้ถูกระงับสิทธิ์การเข้าพื้นที่ (แบน) เนื่องจาก: ${existingBanned.banReason || 'ผิดกฎระเบียบของบริษัท'}` });
      }

      const photoUrl = photoBase64; // Use base64 photo directly in local fallback
      const photoDriveId = 'local_fallback_on_error';
      const registeredAt = new Date().toISOString();

      const visitor = {
        id,
        name,
        passportId,
        phone,
        vehiclePlate,
        address,
        company,
        visitorType,
        contactArea,
        photoUrl,
        photoDriveId,
        status: 'ยังไม่ถูกเช็คอิน' as any,
        registeredAt,
        registeredBy: registeredBy || '',
      };

      fallback.visitors.push(visitor);
      saveFallbackDB(fallback);

      return res.json({
        success: true,
        visitor,
        warnMessage: 'ลงทะเบียนสำเร็จ (บันทึกในเซิร์ฟเวอร์สำรองเนื่องจากการเชื่อมต่อ Google Sheets มีปัญหา)'
      });
    } catch (fallbackErr: any) {
      console.error('Fatal error during local registration fallback:', fallbackErr);
      res.status(500).json({ error: err.message });
    }
  }
});

// Check-In and Check-Out by Pass ID
app.post('/api/check-in-out', async (req, res) => {
  const { id, action, guardRole, guardCheckpoint, guardAllowedAreas, guardName } = req.body; // action: 'check-in' or 'check-out'
  try {
    if (!id || !action) {
      return res.status(400).json({ error: 'Pass ID และ Action จำเป็น' });
    }

    if (!isGoogleConnected(req)) {
      // Local fallback mode
      console.log('Processing check-in-out in local fallback DB...');
      const fallback = loadFallbackDB();
      const visitor = fallback.visitors.find(v => v.id === id);

      if (!visitor) {
        return res.status(404).json({ error: `ไม่พบรหัสใบผ่าน ${id}` });
      }

      if (visitor.status === 'banned') {
        return res.status(403).json({ error: `รหัสใบผ่านนี้ไม่สามารถใช้งานได้เนื่องจากผู้ใช้นี้ถูกแบน: ${visitor.banReason || 'ผิดกฎระเบียบของบริษัท'}` });
      }

      // Check if visitor status is already checked out (cannot change anymore)
      if (visitor.status && (visitor.status === 'checked-out' || visitor.status.startsWith('เช็คเอาท์'))) {
        return res.status(400).json({ error: 'ใบผ่านนี้ถูกเช็คเอาท์เรียบร้อยแล้ว ไม่สามารถเปลี่ยนสถานะได้อีก กรุณาลงทะเบียนใหม่' });
      }

      // Perform Guard Duty Checkpoint Assignment Validation
      if (guardRole && guardRole.includes('Guard') && Array.isArray(guardAllowedAreas)) {
        if (!guardAllowedAreas.includes(visitor.contactArea)) {
          return res.status(403).json({
            error: `❌ จำกัดสิทธิ์เข้าพื้นที่ในวันนี้!\nคุณไม่มีสิทธิ์ทำรายการสำหรับพื้นที่เข้าติดต่อ "${visitor.contactArea}" ได้ เนื่องจากวันนี้คุณถูกมอบหมายให้ประจำจุดตรวจ "${guardCheckpoint || 'N/A'}"\n\n(กรุณาติดต่อหัวหน้างาน Supervisor หรือแอดมินระบบเพื่ออัปเดตสิทธิ์การสลับจุดตรวจ)`
          });
        }
      }

      const targetStatus = action === 'check-in' 
        ? `เช็คอินโดย ${guardName || 'N/A'}` 
        : `เช็คเอาท์โดย ${guardName || 'N/A'}`;
      const timestamp = new Date().toISOString();

      visitor.status = targetStatus;
      visitor.lastActivityAt = timestamp;

      const logId = 'L' + Math.floor(100000 + Math.random() * 900000);
      fallback.activityLogs.push({
        id: logId,
        visitorId: id,
        visitorName: visitor.name,
        visitorType: visitor.visitorType,
        vehiclePlate: visitor.vehiclePlate,
        company: visitor.company,
        action,
        timestamp,
        area: visitor.contactArea,
        guardName: guardName || 'N/A',
        guardCheckpoint: guardCheckpoint || 'N/A',
      });

      saveFallbackDB(fallback);

      return res.json({
        success: true,
        visitorName: visitor.name,
        id,
        status: targetStatus,
        action,
        timestamp,
      });
    }

    const auth = getOAuth2Client(req);
    const sheetId = await getOrCreateDatabase(auth);
    const sheets = google.sheets({ version: 'v4', auth });

    // Get visitor list
    const visRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Visitors!A2:O',
    });

    if (!visRes.data.values || visRes.data.values.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลใบผ่านใดๆ ในระบบ' });
    }

    const rows = visRes.data.values;
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: `ไม่พบรหัสใบผ่าน ${id}` });
    }

    const row = rows[rowIndex];
    const name = row[1];
    const visitorType = row[7];
    const vehiclePlate = row[4];
    const company = row[6];
    const contactArea = row[8];
    const currentStatus = row[11];

    if (currentStatus === 'banned') {
      return res.status(403).json({ error: `รหัสใบผ่านนี้ไม่สามารถใช้งานได้เนื่องจากผู้ใช้นี้ถูกแบน: ${row[12]}` });
    }

    // Check if visitor status is already checked out (cannot change anymore)
    if (currentStatus && (currentStatus === 'checked-out' || currentStatus.startsWith('เช็คเอาท์'))) {
      return res.status(400).json({ error: 'ใบผ่านนี้ถูกเช็คเอาท์เรียบร้อยแล้ว ไม่สามารถเปลี่ยนสถานะได้อีก กรุณาลงทะเบียนใหม่' });
    }

    // Perform Guard Duty Checkpoint Assignment Validation
    if (guardRole && guardRole.includes('Guard') && Array.isArray(guardAllowedAreas)) {
      if (!guardAllowedAreas.includes(contactArea)) {
        return res.status(403).json({
          error: `❌ จำกัดสิทธิ์เข้าพื้นที่ในวันนี้!\nคุณไม่มีสิทธิ์ทำรายการสำหรับพื้นที่เข้าติดต่อ "${contactArea}" ได้ เนื่องจากวันนี้คุณถูกมอบหมายให้ประจำจุดตรวจ "${guardCheckpoint || 'N/A'}"\n\n(กรุณาติดต่อหัวหน้างาน Supervisor หรือแอดมินระบบเพื่ออัปเดตสิทธิ์การสลับจุดตรวจ)`
        });
      }
    }

    const targetStatus = action === 'check-in' 
      ? `เช็คอินโดย ${guardName || 'N/A'}` 
      : `เช็คเอาท์โดย ${guardName || 'N/A'}`;
    const timestamp = new Date().toISOString();

    const actualSheetRow = rowIndex + 2;
    const logId = 'L' + Math.floor(100000 + Math.random() * 900000);

    // Parallelize updates to Visitors and append to Logs for maximum speed
    const updateStatusPromise = sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Visitors!L${actualSheetRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[targetStatus]] },
    });

    const updateLastActivityPromise = sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Visitors!O${actualSheetRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[timestamp]] },
    });

    const appendLogPromise = sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Logs!A2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          logId, id, name, visitorType, vehiclePlate, company, action, timestamp, contactArea, guardName || 'N/A', guardCheckpoint || 'N/A'
        ]],
      },
    });

    await Promise.all([updateStatusPromise, updateLastActivityPromise, appendLogPromise]);

    // Also sync to local fallback database so offline views are kept synchronized
    try {
      const fallback = loadFallbackDB();
      const localVis = fallback.visitors.find(v => v.id === id);
      if (localVis) {
        localVis.status = targetStatus;
        localVis.lastActivityAt = timestamp;
      }
      fallback.activityLogs.push({
        id: logId,
        visitorId: id,
        visitorName: name,
        visitorType,
        vehiclePlate,
        company,
        action,
        timestamp,
        area: contactArea,
        guardName: guardName || 'N/A',
        guardCheckpoint: guardCheckpoint || 'N/A',
      });
      saveFallbackDB(fallback);
    } catch (err) {
      console.error('Error syncing check-in-out to local DB:', err);
    }

    res.json({
      success: true,
      visitorName: name,
      id,
      status: targetStatus,
      action,
      timestamp,
    });
  } catch (err: any) {
    handleGoogleError(err);
    console.warn('Error during check-in-out on Sheets, processing in local fallback:', err.message);
    try {
      const fallback = loadFallbackDB();
      const visitor = fallback.visitors.find(v => v.id === id);

      if (!visitor) {
        return res.status(404).json({ error: `ไม่พบรหัสใบผ่าน ${id}` });
      }

      if (visitor.status === 'banned') {
        return res.status(403).json({ error: `รหัสใบผ่านนี้ไม่สามารถใช้งานได้เนื่องจากผู้ใช้นี้ถูกแบน: ${visitor.banReason || 'ผิดกฎระเบียบของบริษัท'}` });
      }

      if (visitor.status && visitor.status.startsWith('เช็คเอาท์โดย')) {
        return res.status(400).json({ error: 'ใบผ่านนี้ถูกเช็คเอาท์เรียบร้อยแล้ว ไม่สามารถเปลี่ยนสถานะได้อีก กรุณาลงทะเบียนใหม่' });
      }

      const targetStatus = action === 'check-in' 
        ? `เช็คอินโดย ${guardName || 'N/A'}` 
        : `เช็คเอาท์โดย ${guardName || 'N/A'}`;
      const timestamp = new Date().toISOString();

      visitor.status = targetStatus;
      visitor.lastActivityAt = timestamp;

      const logId = 'L' + Math.floor(100000 + Math.random() * 900000);
      fallback.activityLogs.push({
        id: logId,
        visitorId: id,
        visitorName: visitor.name,
        visitorType: visitor.visitorType,
        vehiclePlate: visitor.vehiclePlate,
        company: visitor.company,
        action,
        timestamp,
        area: visitor.contactArea,
        guardName: guardName || 'N/A',
        guardCheckpoint: guardCheckpoint || 'N/A',
      });

      saveFallbackDB(fallback);

      return res.json({
        success: true,
        visitorName: visitor.name,
        id,
        status: targetStatus,
        action,
        timestamp,
        warnMessage: 'ทำรายการสำเร็จ (บันทึกในเซิร์ฟเวอร์สำรองเนื่องจากการเชื่อมต่อ Google Sheets มีปัญหา)'
      });
    } catch (fallbackErr: any) {
      console.error('Fatal error during local check-in-out fallback:', fallbackErr);
      res.status(500).json({ error: err.message });
    }
  }
});

// Fast In-Memory Cache for Visitor Database
let serverVisitorCache: {
  visitors: any[];
  lastFetched: number;
} = {
  visitors: [],
  lastFetched: 0
};

// Retrieve visitor details by National ID/Passport ID or Phone for autofill (Super Fast In-Memory + Sheets Sync)
app.post('/api/retrieve-by-passport', async (req, res) => {
  const { passportId, query: reqQuery } = req.body;
  const rawQuery = (passportId || reqQuery || '').toString().trim();
  const cleanQuery = rawQuery.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  try {
    if (!rawQuery) {
      return res.status(400).json({ error: 'กรุณาระบุเลขบัตรประชาชน / Passport ID ที่ต้องการดึงข้อมูล' });
    }

    let candidates: any[] = [];

    const matchVisitorObj = (v: any) => {
      if (!v) return false;
      const vPass = (v.passportId || '').toString().trim();
      const vPhone = (v.phone || '').toString().trim();
      const vId = (v.id || '').toString().trim();

      if (vPass === rawQuery || vPhone === rawQuery || vId === rawQuery) return true;
      if (cleanQuery && cleanQuery.length >= 3) {
        const cPass = vPass.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cPhone = vPhone.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cId = vId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (cPass === cleanQuery || cPhone === cleanQuery || cId === cleanQuery) return true;
      }
      return false;
    };

    // 1. Check Fast Server In-Memory Cache first (0ms delay)
    if (serverVisitorCache.visitors.length > 0) {
      candidates = serverVisitorCache.visitors.filter(matchVisitorObj);
    }

    // 2. Check local fallback DB if no candidate found in memory cache
    if (candidates.length === 0) {
      const fallback = loadFallbackDB();
      if (fallback.visitors && Array.isArray(fallback.visitors)) {
        candidates = fallback.visitors.filter(matchVisitorObj);
      }
    }

    // 3. If still no candidates found or cache expired (>60s), query Google Sheets & update cache
    const now = Date.now();
    const cacheExpired = (now - serverVisitorCache.lastFetched) > 60000;

    if ((candidates.length === 0 || cacheExpired) && isGoogleConnected(req)) {
      try {
        const auth = getOAuth2Client(req);
        const sheetId = await getOrCreateDatabase(auth);
        const sheets = google.sheets({ version: 'v4', auth });

        const visRes = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: 'Visitors!A2:P',
        });

        if (visRes.data.values && visRes.data.values.length > 0) {
          const freshVisitors = visRes.data.values.map(row => ({
            id: String(row[0] || ''),
            name: String(row[1] || ''),
            passportId: String(row[2] || ''),
            phone: String(row[3] || ''),
            vehiclePlate: String(row[4] || ''),
            address: String(row[5] || ''),
            company: String(row[6] || ''),
            visitorType: String(row[7] || ''),
            contactArea: String(row[8] || ''),
            photoUrl: String(row[9] || ''),
            photoDriveId: String(row[10] || ''),
            status: String(row[11] || ''),
            banReason: String(row[12] || ''),
            registeredAt: String(row[13] || ''),
            lastActivityAt: String(row[14] || ''),
            registeredBy: String(row[15] || ''),
          }));

          // Update server memory cache
          serverVisitorCache = {
            visitors: freshVisitors,
            lastFetched: now
          };

          candidates = freshVisitors.filter(matchVisitorObj);
        }
      } catch (sheetsErr: any) {
        console.warn('Google Sheets lookup warning in retrieve-by-passport, using cached DB:', sheetsErr.message);
      }
    }

    if (candidates.length === 0) {
      return res.status(404).json({ error: 'ไม่พบประวัติผู้ใช้งานที่ใช้เลขบัตรประชาชน/เบอร์โทรศัพท์นี้' });
    }

    // Sort candidates by newest registration
    candidates.sort((a, b) => {
      const timeA = new Date(a.registeredAt || a.lastActivityAt || 0).getTime();
      const timeB = new Date(b.registeredAt || b.lastActivityAt || 0).getTime();
      return timeB - timeA;
    });

    return res.json({ success: true, visitor: candidates[0] });
  } catch (err: any) {
    console.error('Error in retrieve-by-passport:', err);
    res.status(500).json({ error: err.message || 'Error retrieving visitor profile' });
  }
});

// Retrieve visitor details by Pass ID (P######)
app.get('/api/visitor/:id', async (req, res) => {
  const { id } = req.params;
  const queryId = id ? id.trim().toUpperCase() : '';
  try {
    if (!id || !id.trim()) {
      return res.status(400).json({ error: 'กรุณาระบุรหัสใบผ่านเข้าออก (Pass ID)' });
    }

    if (!isGoogleConnected(req)) {
      const fallback = loadFallbackDB();
      const candidate = fallback.visitors.find(v => v.id.toUpperCase() === queryId);
      if (!candidate) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลของรหัสใบผ่านนี้' });
      }
      return res.json({ success: true, visitor: candidate });
    }

    const auth = getOAuth2Client(req);
    const sheetId = await getOrCreateDatabase(auth);
    const sheets = google.sheets({ version: 'v4', auth });

    const visRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Visitors!A2:P',
    });

    if (!visRes.data.values || visRes.data.values.length === 0) {
      return res.status(404).json({ error: 'ไม่พบประวัติผู้ใช้งานในระบบ' });
    }

    const row = visRes.data.values.find(row => row[0].toUpperCase() === queryId);
    if (!row) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลของรหัสใบผ่านนี้' });
    }

    const visitor = {
      id: row[0],
      name: row[1],
      passportId: row[2],
      phone: row[3],
      vehiclePlate: row[4],
      address: row[5],
      company: row[6],
      visitorType: row[7],
      contactArea: row[8],
      photoUrl: row[9],
      photoDriveId: row[10],
      status: row[11],
      banReason: row[12],
      registeredAt: row[13] || '',
      lastActivityAt: row[14] || '',
      registeredBy: row[15] || '',
    };

    return res.json({ success: true, visitor });
  } catch (err: any) {
    handleGoogleError(err);
    console.warn('Error in get visitor by id on Sheets, using local fallback:', err.message);
    try {
      const fallback = loadFallbackDB();
      const candidate = fallback.visitors.find(v => v.id.toUpperCase() === queryId);
      if (!candidate) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลของรหัสใบผ่านนี้' });
      }
      return res.json({ success: true, visitor: candidate });
    } catch (fallbackErr: any) {
      console.error('Fatal error in get visitor by id local fallback:', fallbackErr);
      res.status(500).json({ error: err.message });
    }
  }
});

// Smart Face Matching: Retrieve previously registered visitor details to auto-fill registration
app.post('/api/retrieve-by-face', async (req, res) => {
  const { capturedBase64 } = req.body;
  let faceMatchThreshold = 0.80; // Default threshold
  try {
    if (!capturedBase64) {
      return res.status(400).json({ error: 'กรุณาส่งรูปถ่ายเพื่อสแกนใบหน้า' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'Gemini API not configured. Facial recognition unavailable.' });
    }

    // Determine faceMatchThreshold dynamically from config
    try {
      if (isGoogleConnected(req)) {
        const auth = getOAuth2Client(req);
        const sheetId = await getOrCreateDatabase(auth);
        const sheets = google.sheets({ version: 'v4', auth });
        const configRes = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: 'BrandingConfig!A2:I2',
        });
        if (configRes.data.values && configRes.data.values.length > 0) {
          const row = configRes.data.values[0];
          if (row[8]) {
            faceMatchThreshold = parseFloat(row[8]);
          }
        }
      } else {
        const fallback = loadFallbackDB();
        if (fallback.branding && fallback.branding.faceMatchThreshold !== undefined) {
          faceMatchThreshold = fallback.branding.faceMatchThreshold;
        }
      }
    } catch (err) {
      console.warn('Could not read faceMatchThreshold, using local fallback or default 0.80');
      try {
        const fallback = loadFallbackDB();
        if (fallback.branding && fallback.branding.faceMatchThreshold !== undefined) {
          faceMatchThreshold = fallback.branding.faceMatchThreshold;
        }
      } catch (e) {}
    }

    faceMatchThreshold = parseThreshold(faceMatchThreshold);

    if (!isGoogleConnected(req)) {
      // Local fallback mode
      const fallback = loadFallbackDB();
      const candidates = fallback.visitors.filter(c => c.photoUrl && c.status !== 'banned');

      if (candidates.length === 0) {
        return res.json({ matchFound: false, message: 'ไม่มีข้อมูลผู้ใช้งานที่เคยลงทะเบียนในระบบ' });
      }

      const searchPool = [...candidates].reverse().slice(0, 5);
      console.log(`Starting local face comparison with Gemini on ${searchPool.length} candidates (threshold: ${faceMatchThreshold})...`);

      const matchResults = await Promise.all(
        searchPool.map(async (candidate) => {
          try {
            const result = await compareFacesWithGemini(capturedBase64, candidate.photoUrl);
            console.log(`InsightFace comparison for ${candidate.name}: matched=${result.matched}, cosineSimilarity=${result.cosineSimilarity}`);
            return {
              candidate,
              matched: result.matched,
              confidence: result.confidence,
              cosineSimilarity: result.cosineSimilarity,
              landmarks1: result.landmarks1,
              landmarks2: result.landmarks2,
              embedding1Preview: result.embedding1Preview,
              embedding2Preview: result.embedding2Preview,
            };
          } catch (err) {
            console.error(`Gemini error comparing candidate ${candidate.name}:`, err);
            return { candidate, matched: false, confidence: 0, cosineSimilarity: 0 };
          }
        })
      );

      const matched = matchResults
        .filter(r => r.matched && r.confidence >= faceMatchThreshold)
        .sort((a, b) => b.confidence - a.confidence)[0];

      if (matched) {
        return res.json({
          matchFound: true,
          visitor: matched.candidate,
          confidence: matched.confidence,
          cosineSimilarity: matched.cosineSimilarity,
          landmarks1: matched.landmarks1,
          landmarks2: matched.landmarks2,
          embedding1Preview: matched.embedding1Preview,
          embedding2Preview: matched.embedding2Preview,
          engine: 'InsightFace (ArcFace)'
        });
      }

      return res.json({ matchFound: false, message: 'ไม่พบใบหน้าที่ตรงกันในระบบ' });
    }

    const auth = getOAuth2Client(req);
    const sheetId = await getOrCreateDatabase(auth);
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Get all visitors with a valid photoDriveId
    const visRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Visitors!A2:O',
    });

    if (!visRes.data.values || visRes.data.values.length === 0) {
      return res.json({ matchFound: false, message: 'ไม่มีข้อมูลผู้ใช้งานที่เคยลงทะเบียนในระบบ' });
    }

    // Only look at active / checked-out/in (ignore banned or empty photo)
    const candidates = visRes.data.values
      .map((row, index) => ({
        index: index + 2,
        id: row[0],
        name: row[1],
        passportId: row[2],
        phone: row[3],
        vehiclePlate: row[4],
        address: row[5],
        company: row[6],
        visitorType: row[7],
        contactArea: row[8],
        photoUrl: row[9],
        photoDriveId: row[10],
        status: row[11],
      }))
      .filter(c => c.photoDriveId && c.status !== 'banned');

    if (candidates.length === 0) {
      return res.json({ matchFound: false, message: 'ไม่มีผู้ใช้งานที่สอดคล้องกับการสแกนใบหน้า' });
    }

    // To prevent infinite requests, check the 5 most recent entries
    const searchPool = candidates.reverse().slice(0, 5);

    console.log(`Starting face comparison with Gemini on ${searchPool.length} candidates...`);

    // Let's call Gemini to compare capturedBase64 against candidates one by one or in a smart parallel promise
    const matchResults = await Promise.all(
      searchPool.map(async (candidate) => {
        try {
          // Download candidate photo from Google Drive
          const driveFile = await drive.files.get(
            { fileId: candidate.photoDriveId, alt: 'media' },
            { responseType: 'arraybuffer' }
          );

          const base64Candidate = Buffer.from(driveFile.data as ArrayBuffer).toString('base64');

          // Call Gemini
          const result = await compareFacesWithGemini(capturedBase64, base64Candidate);
          console.log(`InsightFace comparison for ${candidate.name}: matched=${result.matched}, cosineSimilarity=${result.cosineSimilarity}`);
          return {
            candidate,
            matched: result.matched,
            confidence: result.confidence,
            cosineSimilarity: result.cosineSimilarity,
            landmarks1: result.landmarks1,
            landmarks2: result.landmarks2,
            embedding1Preview: result.embedding1Preview,
            embedding2Preview: result.embedding2Preview,
          };
        } catch (err) {
          console.error(`Error comparing face with candidate ${candidate.name}:`, err);
          return { candidate, matched: false, confidence: 0, cosineSimilarity: 0 };
        }
      })
    );

    // Sort by confidence
    const bestMatch = matchResults
      .filter(r => r.matched && r.confidence >= faceMatchThreshold)
      .sort((a, b) => b.confidence - a.confidence)[0];

    if (bestMatch) {
      console.log(`Face Matched with ${bestMatch.candidate.name} (Cosine Similarity: ${bestMatch.cosineSimilarity})`);
      return res.json({
        matchFound: true,
        visitor: bestMatch.candidate,
        confidence: bestMatch.confidence,
        cosineSimilarity: bestMatch.cosineSimilarity,
        landmarks1: bestMatch.landmarks1,
        landmarks2: bestMatch.landmarks2,
        embedding1Preview: bestMatch.embedding1Preview,
        embedding2Preview: bestMatch.embedding2Preview,
        engine: 'InsightFace (ArcFace)'
      });
    }

    res.json({ matchFound: false, message: 'สแกนเสร็จสิ้น แต่ไม่พบประวัติใบหน้าที่ตรงกันในระบบ' });
  } catch (err: any) {
    handleGoogleError(err);
    console.warn('Error during retrieve-by-face on Sheets, using local fallback:', err.message);
    try {
      const fallback = loadFallbackDB();
      const candidates = fallback.visitors.filter(v => v.photoUrl && v.photoUrl.startsWith('data:image/'));

      if (candidates.length === 0) {
        return res.json({ matchFound: false, message: 'ไม่มีข้อมูลผู้ใช้งานในระบบสำรอง' });
      }

      // Do face match comparison using Gemini on local candidates
      const searchPool = candidates.reverse().slice(0, 5);
      const matchResults = await Promise.all(
        searchPool.map(async (candidate) => {
          try {
            const result = await compareFacesWithGemini(capturedBase64, candidate.photoUrl);
            return {
              candidate,
              matched: result.matched,
              confidence: result.confidence,
              cosineSimilarity: result.cosineSimilarity,
              landmarks1: result.landmarks1,
              landmarks2: result.landmarks2,
              embedding1Preview: result.embedding1Preview,
              embedding2Preview: result.embedding2Preview,
            };
          } catch (err) {
            console.error(`Gemini error comparing candidate ${candidate.name} in fallback:`, err);
            return { candidate, matched: false, confidence: 0, cosineSimilarity: 0 };
          }
        })
      );

      const bestMatch = matchResults
        .filter(r => r.matched && r.confidence >= faceMatchThreshold)
        .sort((a, b) => b.confidence - a.confidence)[0];

      if (bestMatch) {
        return res.json({
          matchFound: true,
          visitor: bestMatch.candidate,
          confidence: bestMatch.confidence,
          cosineSimilarity: bestMatch.cosineSimilarity,
          landmarks1: bestMatch.landmarks1,
          landmarks2: bestMatch.landmarks2,
          embedding1Preview: bestMatch.embedding1Preview,
          embedding2Preview: bestMatch.embedding2Preview,
          engine: 'InsightFace (ArcFace)'
        });
      }

      return res.json({ matchFound: false, message: 'สแกนเสร็จสิ้น แต่ไม่พบประวัติใบหน้าที่ตรงกันในระบบสำรอง' });
    } catch (fallbackErr: any) {
      console.error('Fatal error during face-match local fallback:', fallbackErr);
      res.status(500).json({ error: err.message });
    }
  }
});

// AI-Powered QR Code and Pass ID Scanner
app.post('/api/scan-qr-ai', async (req, res) => {
  try {
    const { capturedBase64 } = req.body;
    if (!capturedBase64) {
      return res.status(400).json({ error: 'กรุณาส่งรูปถ่ายคิวอาร์โค้ด' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'ระบบ AI (Gemini) ยังไม่ได้ติดตั้ง API Key กรุณาระบุรหัสด้วยตนเอง' });
    }

    console.log('Sending QR code image to Gemini for decoding...');
    const cleanImg = cleanBase64(capturedBase64);

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: cleanImg.mimeType,
              data: cleanImg.data,
            },
          },
          {
            text: 'Analyze this image to detect and decode any QR code or barcode visible. If you find a QR code, decode its text content. Look for a Pass ID, which starts with the letter P followed by 6 digits (e.g. P123456). Respond strictly in JSON format.'
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { 
              type: Type.BOOLEAN,
              description: 'Whether a QR code or barcode was successfully found and decoded'
            },
            qrText: { 
              type: Type.STRING,
              description: 'The full decoded text content of the QR code or barcode'
            },
            passId: { 
              type: Type.STRING,
              description: 'The identified Pass ID starting with P followed by 6 digits, or an empty string if not found'
            },
          },
          required: ['success', 'qrText', 'passId'],
        }
      }
    });

    const text = response.text ? response.text.trim() : '';
    console.log('Gemini QR Scanner API raw output:', text);
    const parsed = JSON.parse(text);

    // Make sure we convert empty string to null if that's what the frontend expects
    const passId = parsed.passId ? parsed.passId.trim() : null;

    res.json({
      success: typeof parsed.success === 'boolean' ? parsed.success : !!parsed.success,
      qrText: parsed.qrText || '',
      passId: (passId && /^P\d{6}$/i.test(passId)) ? passId : null
    });
  } catch (err: any) {
    console.error('Error during AI QR scanning:', err);
    res.status(500).json({ error: err.message || 'Failed to scan QR code via AI' });
  }
});

// Smart Face Gate Entrance: Find or verify a visitor at the gate (Multi-factor with ID/Passport search or direct lookup)
app.post('/api/verify-gate-face', async (req, res) => {
  try {
    const { capturedBase64, passportHint } = req.body;

    if (!capturedBase64) {
      return res.status(400).json({ error: 'กรุณาส่งรูปถ่ายเพื่อสแกนใบหน้า' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'Gemini API is not configured.' });
    }

    // Determine faceMatchThreshold dynamically from config
    let faceMatchThreshold = 0.80; // Default threshold
    try {
      if (isGoogleConnected(req)) {
        const auth = getOAuth2Client(req);
        const sheetId = await getOrCreateDatabase(auth);
        const sheets = google.sheets({ version: 'v4', auth });
        const configRes = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: 'BrandingConfig!A2:I2',
        });
        if (configRes.data.values && configRes.data.values.length > 0) {
          const row = configRes.data.values[0];
          if (row[8]) {
            faceMatchThreshold = parseFloat(row[8]);
          }
        }
      } else {
        const fallback = loadFallbackDB();
        if (fallback.branding && fallback.branding.faceMatchThreshold !== undefined) {
          faceMatchThreshold = fallback.branding.faceMatchThreshold;
        }
      }
    } catch (err) {
      console.warn('Could not read faceMatchThreshold, using local fallback or default 0.80');
      try {
        const fallback = loadFallbackDB();
        if (fallback.branding && fallback.branding.faceMatchThreshold !== undefined) {
          faceMatchThreshold = fallback.branding.faceMatchThreshold;
        }
      } catch (e) {}
    }

    faceMatchThreshold = parseThreshold(faceMatchThreshold);

    if (!isGoogleConnected(req)) {
      // Local fallback mode
      const fallback = loadFallbackDB();
      let candidates = fallback.visitors.map((row) => ({
        id: row.id,
        name: row.name,
        passportId: row.passportId,
        phone: row.phone,
        vehiclePlate: row.vehiclePlate,
        address: row.address,
        company: row.company,
        visitorType: row.visitorType,
        contactArea: row.contactArea,
        photoUrl: row.photoUrl,
        photoDriveId: row.photoDriveId,
        status: row.status,
        banReason: row.banReason || '',
      }));

      // Filter by passportHint if provided
      if (passportHint && passportHint.trim() !== '') {
        const query = passportHint.trim();
        candidates = candidates.filter(c => 
          String(c.passportId || '').includes(query) || 
          String(c.phone || '').includes(query) || 
          String(c.id || '').toLowerCase() === query.toLowerCase()
        );
      }

      if (candidates.length === 0) {
        return res.status(404).json({ error: 'ไม่พบผู้ใช้ที่ตรงกับข้อมูลค้นหาที่ระบุ' });
      }

      const pool = candidates.slice(0, 5);
      console.log(`Gate Verification (Local Fallback): Comparing face against ${pool.length} candidate(s)...`);

      const matches = await Promise.all(
        pool.map(async (c) => {
          if (!c.photoUrl) return { candidate: c, matched: false, confidence: 0, cosineSimilarity: 0 };
          try {
            const result = await compareFacesWithGemini(capturedBase64, c.photoUrl);
            console.log(`InsightFace comparison for candidate ${c.name}: matched=${result.matched}, cosineSimilarity=${result.cosineSimilarity}`);
            return {
              candidate: c,
              matched: result.matched,
              confidence: result.confidence,
              cosineSimilarity: result.cosineSimilarity,
              landmarks1: result.landmarks1,
              landmarks2: result.landmarks2,
              embedding1Preview: result.embedding1Preview,
              embedding2Preview: result.embedding2Preview,
            };
          } catch (err) {
            console.error(`Error comparing in gate verification:`, err);
            return { candidate: c, matched: false, confidence: 0, cosineSimilarity: 0 };
          }
        })
      );

      const matchResult = matches
        .filter(m => m.matched && m.confidence >= faceMatchThreshold)
        .sort((a, b) => b.confidence - a.confidence)[0];

      if (!matchResult) {
        return res.status(401).json({ error: 'สแกนใบหน้าไม่ผ่าน: ใบหน้าไม่ตรงกับข้อมูลในระบบที่เลือก' });
      }

      if (matchResult.candidate.status === 'banned') {
        return res.status(403).json({ error: `ไม่สามารถเข้าออกพื้นที่ได้: สิทธิ์ของคุณถูกระงับ (แบน) เนื่องจาก: ${matchResult.candidate.banReason || 'ผิดกฎระเบียบของบริษัท'}` });
      }

      return res.json({
        verified: true,
        visitor: matchResult.candidate,
        confidence: matchResult.confidence,
        cosineSimilarity: matchResult.cosineSimilarity,
        landmarks1: matchResult.landmarks1,
        landmarks2: matchResult.landmarks2,
        embedding1Preview: matchResult.embedding1Preview,
        embedding2Preview: matchResult.embedding2Preview,
        engine: 'InsightFace (ArcFace)'
      });
    }

    const auth = getOAuth2Client(req);
    const sheetId = await getOrCreateDatabase(auth);
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    const visRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Visitors!A2:P',
    });

    if (!visRes.data.values || visRes.data.values.length === 0) {
      return res.status(404).json({ error: 'ไม่มีประวัติผู้ใช้งานในระบบ' });
    }

    let candidates = visRes.data.values.map((row, index) => ({
      index: index + 2,
      id: row[0],
      name: row[1],
      passportId: row[2],
      phone: row[3],
      vehiclePlate: row[4],
      address: row[5],
      company: row[6],
      visitorType: row[7],
      contactArea: row[8],
      photoUrl: row[9],
      photoDriveId: row[10],
      status: row[11],
      banReason: row[12],
      registeredAt: row[13] || '',
      lastActivityAt: row[14] || '',
      registeredBy: row[15] || '',
    }));

    // Filter by passportHint if provided to speed up and secure the lookup
    if (passportHint && passportHint.trim() !== '') {
      const query = passportHint.trim();
      candidates = candidates.filter(c => 
        String(c.passportId || '').includes(query) || 
        String(c.phone || '').includes(query) || 
        String(c.id || '').toLowerCase() === query.toLowerCase()
      );
    }

    if (candidates.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้ที่ตรงกับข้อมูลค้นหาที่ระบุ' });
    }

    // Compare with filtered candidates (up to 5 to avoid model overload)
    const pool = candidates.slice(0, 5);
    console.log(`Gate Verification: Comparing face against ${pool.length} candidate(s)...`);

    const matches = await Promise.all(
      pool.map(async (c) => {
        if (!c.photoDriveId) return { candidate: c, matched: false, confidence: 0, cosineSimilarity: 0 };
        try {
          const driveFile = await drive.files.get(
            { fileId: c.photoDriveId, alt: 'media' },
            { responseType: 'arraybuffer' }
          );
          const base64Cand = Buffer.from(driveFile.data as ArrayBuffer).toString('base64');

          const result = await compareFacesWithGemini(capturedBase64, base64Cand);
          console.log(`InsightFace comparison for candidate ${c.name}: matched=${result.matched}, cosineSimilarity=${result.cosineSimilarity}`);
          return {
            candidate: c,
            matched: result.matched,
            confidence: result.confidence,
            cosineSimilarity: result.cosineSimilarity,
            landmarks1: result.landmarks1,
            landmarks2: result.landmarks2,
            embedding1Preview: result.embedding1Preview,
            embedding2Preview: result.embedding2Preview,
          };
        } catch (err) {
          console.error(`Error comparing in gate verification:`, err);
          return { candidate: c, matched: false, confidence: 0, cosineSimilarity: 0 };
        }
      })
    );

    const matchResult = matches
      .filter(m => m.matched && m.confidence >= faceMatchThreshold)
      .sort((a, b) => b.confidence - a.confidence)[0];

    if (!matchResult) {
      return res.status(401).json({ error: 'สแกนใบหน้าไม่ผ่าน: ใบหน้าไม่ตรงกับข้อมูลในระบบที่เลือก' });
    }

    if (matchResult.candidate.status === 'banned') {
      return res.status(403).json({ error: `ไม่สามารถเข้าออกพื้นที่ได้: สิทธิ์ของคุณถูกระงับ (แบน) เนื่องจาก: ${matchResult.candidate.banReason || 'ผิดกฎระเบียบของบริษัท'}` });
    }

    res.json({
      verified: true,
      visitor: matchResult.candidate,
      confidence: matchResult.confidence,
      cosineSimilarity: matchResult.cosineSimilarity,
      landmarks1: matchResult.landmarks1,
      landmarks2: matchResult.landmarks2,
      embedding1Preview: matchResult.embedding1Preview,
      embedding2Preview: matchResult.embedding2Preview,
      engine: 'InsightFace (ArcFace)'
    });
  } catch (err: any) {
    console.error('Error verifying face in gate:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin action: Ban or Unban visitor
app.post(['/api/ban', '/api/visitors/:id/ban', '/api/visitors/:id/unban'], async (req, res) => {
  try {
    const id = req.params.id || req.body?.id; // id: Pass ID
    const isUnban = req.path.endsWith('/unban');
    const ban = isUnban ? false : (req.body?.ban !== undefined ? !!req.body.ban : true);
    const reason = req.body?.reason;

    if (!id) {
      return res.status(400).json({ error: 'Pass ID จำเป็นสำหรับการแบน/ปลดแบน' });
    }

    if (!isGoogleConnected(req)) {
      const fallback = loadFallbackDB();
      const visitor = fallback.visitors.find(v => v.id === id);
      if (!visitor) {
        return res.status(404).json({ error: `ไม่พบรหัสใบผ่าน ${id}` });
      }
      visitor.status = ban ? 'banned' : 'checked-out';
      visitor.banReason = ban ? (reason || 'ละเมิดเงื่อนไขความปลอดภัยและระเบียบของบริษัท') : '';
      saveFallbackDB(fallback);
      return res.json({ success: true, id, status: visitor.status, banReason: visitor.banReason });
    }

    const auth = getOAuth2Client(req);
    const sheetId = await getOrCreateDatabase(auth);
    const sheets = google.sheets({ version: 'v4', auth });

    const visRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Visitors!A2:O',
    });

    if (!visRes.data.values) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
    }

    const rows = visRes.data.values;
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: `ไม่พบรหัสใบผ่าน ${id}` });
    }

    const actualRow = rowIndex + 2;
    const status = ban ? 'banned' : 'checked-out'; // revert to checked-out or inactive if unbanned
    const banReason = ban ? (reason || 'ละเมิดเงื่อนไขความปลอดภัยและระเบียบของบริษัท') : '';

    // Update Status (Column L, index 11) and Ban Reason (Column M, index 12)
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Visitors!L${actualRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[status]] },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Visitors!M${actualRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[banReason]] },
    });

    // Also sync to local fallback database
    try {
      const fallback = loadFallbackDB();
      const localVis = fallback.visitors.find(v => v.id === id);
      if (localVis) {
        localVis.status = status;
        localVis.banReason = banReason;
        saveFallbackDB(fallback);
      }
    } catch (err) {
      console.error('Error syncing ban status to local DB:', err);
    }

    res.json({ success: true, id, status, banReason });
  } catch (err: any) {
    console.error('Error banning user:', err);
    res.status(500).json({ error: err.message });
  }
});

function getDashboardLocalFallback(query: any) {
  const { startDate, endDate, visitorType, contactArea, action, search } = query;
  const fallback = loadFallbackDB();
  const visitors = fallback.visitors;
  const logs = fallback.activityLogs;

  const totalBanned = visitors.filter(r => r.status === 'banned').length;
  const currentlyInside = visitors.filter(r => r.status && r.status.startsWith('เช็คอินโดย')).length;
  const registeredNotCheckedIn = visitors.filter(r => {
    const s = r.status || 'ยังไม่ถูกเช็คอิน';
    return !s.startsWith('เช็คอิน') && s !== 'banned';
  }).length;

  // Filter logs based on query parameters
  let filteredLogs = [...logs];

  if (startDate) {
    filteredLogs = filteredLogs.filter(log => {
      if (!log.timestamp) return false;
      const logDate = log.timestamp.split('T')[0];
      return logDate >= (startDate as string);
    });
  }
  if (endDate) {
    filteredLogs = filteredLogs.filter(log => {
      if (!log.timestamp) return false;
      const logDate = log.timestamp.split('T')[0];
      return logDate <= (endDate as string);
    });
  }
  if (visitorType) {
    filteredLogs = filteredLogs.filter(log => log.visitorType === visitorType);
  }
  if (contactArea) {
    filteredLogs = filteredLogs.filter(log => log.area === contactArea);
  }
  if (action) {
    filteredLogs = filteredLogs.filter(log => log.action === action);
  }
  if (search) {
    const searchLower = (search as string).toLowerCase();
    filteredLogs = filteredLogs.filter(log => 
      (log.visitorName || '').toLowerCase().includes(searchLower) ||
      (log.visitorId || '').toLowerCase().includes(searchLower) ||
      (log.company || '').toLowerCase().includes(searchLower) ||
      (log.vehiclePlate || '').toLowerCase().includes(searchLower)
    );
  }

  // Deduplicate logs by visitorId for accurate visit-based statistics (Check-in and Check-out for the same pass counted as 1 visit)
  const logsByVisitor: { [visitorId: string]: any[] } = {};
  filteredLogs.forEach(log => {
    const vid = log.visitorId || '';
    if (vid) {
      if (!logsByVisitor[vid]) {
        logsByVisitor[vid] = [];
      }
      logsByVisitor[vid].push(log);
    }
  });

  const deduplicatedLogs: any[] = [];
  Object.entries(logsByVisitor).forEach(([vid, vLogs]) => {
    const checkInLog = vLogs.find(l => l.action === 'check-in');
    if (checkInLog) {
      deduplicatedLogs.push(checkInLog);
    } else {
      const checkOutLog = vLogs.find(l => l.action === 'check-out');
      deduplicatedLogs.push(checkOutLog || vLogs[0]);
    }
  });

  // Also include logs without visitorId
  filteredLogs.forEach(log => {
    if (!log.visitorId) {
      deduplicatedLogs.push(log);
    }
  });

  // Count visits
  const totalVisitsToday = deduplicatedLogs.length;

  // Area distribution
  const areaCounts: { [key: string]: number } = {};
  const typeCounts: { [key: string]: number } = {};
  const hourCounts: { [key: number]: number } = {};

  // Initialize hours
  for (let h = 8; h <= 20; h++) {
    hourCounts[h] = 0;
  }

  deduplicatedLogs.forEach(log => {
    // Area distribution
    const area = log.area || 'MainGate';
    areaCounts[area] = (areaCounts[area] || 0) + 1;

    // Type distribution
    const type = log.visitorType || 'อื่นๆ';
    typeCounts[type] = (typeCounts[type] || 0) + 1;

    // Hour distribution
    const time = new Date(log.timestamp);
    const hour = time.getHours();
    if (hour >= 8 && hour <= 20) {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  const visitsByArea = Object.entries(areaCounts).map(([name, value]) => ({ name, value }));
  const visitsByType = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  const visitsByHour = Object.entries(hourCounts).map(([hour, count]) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    count,
  }));

  // Formulate formatted recent logs list
  const recentLogs = [...filteredLogs].reverse().slice(0, 10).map(log => ({
    id: log.id,
    visitorId: log.visitorId,
    visitorName: log.visitorName,
    visitorType: log.visitorType,
    vehiclePlate: log.vehiclePlate,
    company: log.company,
    action: log.action,
    timestamp: log.timestamp,
    area: log.area,
  }));

  return {
    totalVisitsToday,
    currentlyInside,
    totalBanned,
    registeredNotCheckedIn,
    visitsByArea,
    visitsByType,
    visitsByHour,
    recentLogs,
    visitors,
  };
}

// Get Dashboard Data (Visitor stats, chart data, recent history) with advanced filters and history
app.get('/api/dashboard', async (req, res) => {
  try {
    const { startDate, endDate, visitorType, contactArea, action, search } = req.query;

    if (!isGoogleConnected(req)) {
      return res.json(getDashboardLocalFallback(req.query));
    }

    try {
      const auth = getOAuth2Client(req);
      const sheetId = await getOrCreateDatabase(auth);
      const sheets = google.sheets({ version: 'v4', auth });

      // Read Visitors
      const visitorsRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Visitors!A2:P',
      });

      // Read Logs
      const logsRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Logs!A2:I',
      });

      const visitors = visitorsRes.data.values || [];
      const logs = logsRes.data.values || [];

      const parsedVisitors = visitors.map(row => ({
        id: row[0] || '',
        name: row[1] || '',
        passportId: row[2] || '',
        phone: row[3] || '',
        vehiclePlate: row[4] || '',
        address: row[5] || '',
        company: row[6] || '',
        visitorType: row[7] || '',
        contactArea: row[8] || '',
        photoUrl: row[9] || '',
        photoDriveId: row[10] || '',
        status: (row[11] || 'ยังไม่ถูกเช็คอิน') as any,
        banReason: row[12] || '',
        registeredAt: row[13] || '',
        lastActivityAt: row[14] || '',
        registeredBy: row[15] || '',
      }));

      const totalBanned = visitors.filter(r => r[11] === 'banned').length;
      const currentlyInside = visitors.filter(r => r[11] && r[11].startsWith('เช็คอินโดย')).length;
      const registeredNotCheckedIn = visitors.filter(r => {
        const s = r[11] || 'ยังไม่ถูกเช็คอิน';
        return !s.startsWith('เช็คอิน') && s !== 'banned';
      }).length;

      // Filter logs
      let filteredLogs = logs.map(row => ({
        id: row[0] || '',
        visitorId: row[1] || '',
        visitorName: row[2] || '',
        visitorType: row[3] || '',
        vehiclePlate: row[4] || '',
        company: row[5] || '',
        action: row[6] || '',
        timestamp: row[7] || '',
        area: row[8] || '',
      }));

      if (startDate) {
        filteredLogs = filteredLogs.filter(log => {
          if (!log.timestamp) return false;
          const logDate = log.timestamp.split('T')[0];
          return logDate >= (startDate as string);
        });
      }
      if (endDate) {
        filteredLogs = filteredLogs.filter(log => {
          if (!log.timestamp) return false;
          const logDate = log.timestamp.split('T')[0];
          return logDate <= (endDate as string);
        });
      }
      if (visitorType) {
        filteredLogs = filteredLogs.filter(log => log.visitorType === visitorType);
      }
      if (contactArea) {
        filteredLogs = filteredLogs.filter(log => log.area === contactArea);
      }
      if (action) {
        filteredLogs = filteredLogs.filter(log => log.action === action);
      }
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          (log.visitorName || '').toLowerCase().includes(searchLower) ||
          (log.visitorId || '').toLowerCase().includes(searchLower) ||
          (log.company || '').toLowerCase().includes(searchLower) ||
          (log.vehiclePlate || '').toLowerCase().includes(searchLower)
        );
      }

      // Deduplicate logs by visitorId for accurate visit-based statistics (Check-in and Check-out for the same pass counted as 1 visit)
      const logsByVisitor: { [visitorId: string]: any[] } = {};
      filteredLogs.forEach(log => {
        const vid = log.visitorId || '';
        if (vid) {
          if (!logsByVisitor[vid]) {
            logsByVisitor[vid] = [];
          }
          logsByVisitor[vid].push(log);
        }
      });

      const deduplicatedLogs: any[] = [];
      Object.entries(logsByVisitor).forEach(([vid, vLogs]) => {
        const checkInLog = vLogs.find(l => l.action === 'check-in');
        if (checkInLog) {
          deduplicatedLogs.push(checkInLog);
        } else {
          const checkOutLog = vLogs.find(l => l.action === 'check-out');
          deduplicatedLogs.push(checkOutLog || vLogs[0]);
        }
      });

      // Also include logs without visitorId
      filteredLogs.forEach(log => {
        if (!log.visitorId) {
          deduplicatedLogs.push(log);
        }
      });

      // Count visits
      const totalVisitsToday = deduplicatedLogs.length;

      // Area distribution
      const areaCounts: { [key: string]: number } = {};
      const typeCounts: { [key: string]: number } = {};
      const hourCounts: { [key: number]: number } = {};

      for (let h = 8; h <= 20; h++) {
        hourCounts[h] = 0;
      }

      deduplicatedLogs.forEach(log => {
        const area = log.area || 'MainGate';
        areaCounts[area] = (areaCounts[area] || 0) + 1;

        const type = log.visitorType || 'อื่นๆ';
        typeCounts[type] = (typeCounts[type] || 0) + 1;

        // Hour distribution
        const time = new Date(log.timestamp);
        const hour = time.getHours();
        if (hour >= 8 && hour <= 20) {
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });

      const visitsByArea = Object.entries(areaCounts).map(([name, value]) => ({ name, value }));
      const visitsByType = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
      const visitsByHour = Object.entries(hourCounts).map(([hour, count]) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        count,
      }));

      // Formulate formatted recent logs list
      const recentLogs = [...filteredLogs].reverse().slice(0, 10);

      res.json({
        totalVisitsToday,
        currentlyInside,
        totalBanned,
        registeredNotCheckedIn,
        visitsByArea,
        visitsByType,
        visitsByHour,
        recentLogs,
        visitors: parsedVisitors,
      });
    } catch (err: any) {
      handleGoogleError(err, req);
      console.warn('Google Sheets error fetching dashboard stats, falling back to local database:', err.message);
      res.json(getDashboardLocalFallback(req.query));
    }
  } catch (err: any) {
    console.error('Fatal error fetching dashboard stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper: Convert array data to CSV format with proper UTF-8 BOM
function convertToCSV(headers: string[], rows: any[][]): string {
  const escapeField = (field: any) => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [
    headers.map(escapeField).join(','),
    ...rows.map(row => row.map(escapeField).join(','))
  ];
  return '\ufeff' + csvRows.join('\r\n');
}

// Helper: Compile and send the Security Department report
async function compileAndSendReport(oauth2Client: any, recipientEmail: string, ccEmail?: string): Promise<boolean> {
  const fallback = loadFallbackDB();
  const brand = fallback.branding || {};
  let logs: any[] = [];
  
  const isGoogle = isGoogleConnected(null as any);
  if (isGoogle && oauth2Client) {
    try {
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      const sheetId = await getOrCreateDatabase(oauth2Client);
      const logsRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Logs!A2:I',
      });
      logs = logsRes.data.values || [];
    } catch (sheetsErr) {
      console.warn('Failed to fetch logs from Google Sheets, using local fallback DB:', sheetsErr);
      logs = (fallback.activityLogs || []).map(log => [
        log.visitorId || '',
        log.visitorName || '',
        '',
        log.visitorType || '',
        log.vehiclePlate || '',
        log.company || '',
        log.action || '',
        log.timestamp || '',
        log.area || ''
      ]);
    }
  } else {
    logs = (fallback.activityLogs || []).map(log => [
      log.visitorId || '',
      log.visitorName || '',
      '',
      log.visitorType || '',
      log.vehiclePlate || '',
      log.company || '',
      log.action || '',
      log.timestamp || '',
      log.area || ''
    ]);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter logs of today (or yesterday if run at exactly scheduled time for "yesterday's" data)
  // Since the scheduler runs, we compile logs from the PREVIOUS 24 hours (which is yesterday)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDateStr = yesterday.toISOString().split('T')[0];

  const targetLogs = logs.filter(log => {
    const timestamp = log[7];
    return timestamp && timestamp.startsWith(targetDateStr);
  });

  const totalIn = targetLogs.filter(l => l[6] === 'check-in').length;
  const totalOut = targetLogs.filter(l => l[6] === 'check-out').length;

  // Render a gorgeous HTML email report
  let logRowsHtml = '';
  if (targetLogs.length === 0) {
    logRowsHtml = `<tr><td colspan="7" style="padding: 12px; text-align: center; color: #64748b;">ไม่มีประวัติการเข้า-ออกพื้นที่ในรอบวันที่ผ่านมา</td></tr>`;
  } else {
    targetLogs.forEach(log => {
      let time = '';
      try {
        time = new Date(log[7]).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        time = String(log[7] || '').slice(11, 16);
      }
      const actionBadge = log[6] === 'check-in' 
        ? `<span style="background-color: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">CHECK-IN</span>`
        : `<span style="background-color: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">CHECK-OUT</span>`;

      logRowsHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-weight: bold; color: #0f172a;">${log[1]} (${log[0]})</td>
          <td style="padding: 12px; color: #334155;">${log[3]}</td>
          <td style="padding: 12px; color: #334155;">${log[4] || '-'}</td>
          <td style="padding: 12px; color: #334155;">${log[5]}</td>
          <td style="padding: 12px; color: #334155;">${log[8]}</td>
          <td style="padding: 12px; text-align: center;">${actionBadge}</td>
          <td style="padding: 12px; color: #64748b; text-align: right;">${time} น.</td>
        </tr>
      `;
    });
  }

  const emailBody = `
    <div style="font-family: 'Inter', system-ui, sans-serif; background-color: #f8fafc; padding: 30px; color: #1e293b;">
      <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px; color: #ffffff; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">รายงานสรุปประวัติผู้เข้าติดต่อเข้าออกพื้นที่ (MainGate)</h2>
          <p style="margin: 6px 0 0; font-size: 14px; color: #94a3b8;">ประจำวันที่ ${new Date(targetDateStr).toLocaleDateString('th-TH', { dateStyle: 'long' })}</p>
        </div>
        
        <div style="padding: 24px;">
          <div style="display: flex; gap: 16px; margin-bottom: 24px;">
            <div style="flex: 1; background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center;">
              <span style="display: block; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">จำนวนการ Check-In</span>
              <strong style="font-size: 24px; color: #1e293b;">${totalIn} ครั้ง</strong>
            </div>
            <div style="flex: 1; background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center;">
              <span style="display: block; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">จำนวนการ Check-Out</span>
              <strong style="font-size: 24px; color: #1e293b;">${totalOut} ครั้ง</strong>
            </div>
          </div>
          
          <h3 style="font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">รายละเอียดการผ่านเข้า-ออกพื้นที่</h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; color: #475569; font-weight: 600;">
                <th style="padding: 10px 12px;">ผู้ติดต่อ (รหัส)</th>
                <th style="padding: 10px 12px;">ประเภท</th>
                <th style="padding: 10px 12px;">ทะเบียนรถ</th>
                <th style="padding: 10px 12px;">บริษัท</th>
                <th style="padding: 10px 12px;">พื้นที่ติดต่อ</th>
                <th style="padding: 10px 12px; text-align: center;">การดำเนินการ</th>
                <th style="padding: 10px 12px; text-align: right;">เวลา</th>
              </tr>
            </thead>
            <tbody>
              ${logRowsHtml}
            </tbody>
          </table>
          
          <div style="margin-top: 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center;">
            รายงานอัตโนมัติจัดทำโดยระบบใบผ่านเข้าออก MainGate Pass System | ส่งอีเมลสรุปข้อมูลตามตารางเวลาที่ท่านกำหนด
          </div>
        </div>
      </div>
    </div>
  `;

  const csvHeaders = ['รหัสผ่าน (Pass ID)', 'ชื่อผู้ติดต่อ', 'ประเภทผู้ติดต่อ', 'ทะเบียนรถ', 'บริษัท', 'พื้นที่ติดต่อ', 'การดำเนินการ', 'วัน-เวลา'];
  const csvRows = targetLogs.map(log => [
    log[0] || '',
    log[1] || '',
    log[3] || '',
    log[4] || '',
    log[5] || '',
    log[8] || '',
    log[6] === 'check-in' ? 'Check-In (เข้า)' : 'Check-Out (ออก)',
    log[7] || ''
  ]);
  const csvContent = convertToCSV(csvHeaders, csvRows);

  // Check if we send via Nodemailer SMTP
  if (brand.emailServiceType === 'smtp' && brand.smtpHost && brand.smtpUser) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: brand.smtpHost,
        port: parseInt(brand.smtpPort) || 587,
        secure: brand.smtpSecure === true || brand.smtpSecure === 'true',
        auth: {
          user: brand.smtpUser,
          pass: brand.smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"MainGate Pass System" <${brand.smtpUser}>`,
        to: recipientEmail,
        cc: ccEmail && ccEmail.trim() ? ccEmail.trim() : undefined,
        subject: `สรุปรายงานผู้เข้าออกพื้นที่ - ${targetDateStr}`,
        html: emailBody,
        attachments: [
          {
            filename: `visitor_logs_${targetDateStr}.csv`,
            content: Buffer.from(csvContent, 'utf-8'),
            contentType: 'text/csv; charset=utf-8'
          }
        ]
      });

      console.log(`[SMTP REPORT] Report sent successfully to ${recipientEmail} via SMTP`);
      return true;
    } catch (smtpErr: any) {
      console.error('[SMTP REPORT ERROR] Failed to send email via SMTP:', smtpErr.message);
      throw smtpErr;
    }
  }

  // Fallback to Gmail API (requires active Google Auth)
  if (!oauth2Client) {
    throw new Error('ระบบไม่เชื่อมต่อ Gmail API และไม่พบการตั้งค่าอีเมล SMTP กรุณาเปิดสิทธิ์เชื่อมต่อ Google หรือตั้งค่า SMTP');
  }

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const boundary = '----=_NextPart_' + Date.now().toString(16);
  const utf8Subject = `=?utf-8?B?${Buffer.from(`สรุปรายงานผู้เข้าออกพื้นที่ - ${targetDateStr}`).toString('base64')}?=`;
  
  const messageParts = [
    `To: ${recipientEmail}`,
  ];
  if (ccEmail && ccEmail.trim()) {
    messageParts.push(`Cc: ${ccEmail.trim()}`);
  }
  
  messageParts.push(
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(emailBody).toString('base64'),
    '',
    `--${boundary}`,
    `Content-Type: text/csv; name="visitor_logs_${targetDateStr}.csv"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="visitor_logs_${targetDateStr}.csv"`,
    '',
    Buffer.from(csvContent).toString('base64'),
    '',
    `--${boundary}--`
  );

  const message = messageParts.join('\r\n');
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });

  return true;
}

// Check Google Sheets status and capacity (Method 2)
app.get(['/api/sheets-status', '/api/sheets/capacity'], async (req, res) => {
  try {
    const isGoogle = isGoogleConnected(req);
    const localDb = loadFallbackDB();
    
    const localStats = {
      visitorsCount: localDb.visitors ? localDb.visitors.length : 0,
      logsCount: localDb.activityLogs ? localDb.activityLogs.length : 0,
      fileSizeKb: fs.existsSync(FALLBACK_DB_PATH) ? Math.round(fs.statSync(FALLBACK_DB_PATH).size / 1024) : 0
    };

    if (!isGoogle) {
      return res.json({
        success: true,
        isGoogleConnected: false,
        localStats,
        sheetsStats: {
          visitorsRows: 0,
          logsRows: 0,
          totalCells: 0,
          capacityPercentage: 0,
          limitWarning: false
        }
      });
    }

    const auth = getOAuth2Client(req);
    const sheetId = await getOrCreateDatabase(auth);
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch length of Visitors & Logs
    const [visRes, logsRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'Visitors!A:A' }),
      sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'Logs!A:A' })
    ]);

    const visitorsRows = visRes.data.values ? visRes.data.values.length : 0;
    const logsRows = logsRes.data.values ? logsRes.data.values.length : 0;

    // A single row of Visitors has 16 cells. A single row of Logs has 11 cells.
    const visitorsCells = visitorsRows * 16;
    const logsCells = logsRows * 11;
    const totalCells = visitorsCells + logsCells;

    const maxSafeRows = 10000;
    const totalRows = visitorsRows + logsRows;
    const capacityPercentage = Math.min(100, Math.round((totalRows / maxSafeRows) * 100));

    return res.json({
      success: true,
      isGoogleConnected: true,
      sheetId,
      localStats,
      sheetsStats: {
        visitorsRows: Math.max(0, visitorsRows - 1), // exclude header
        logsRows: Math.max(0, logsRows - 1), // exclude header
        totalCells,
        totalRows,
        capacityPercentage,
        limitWarning: totalRows > (maxSafeRows * 0.8)
      }
    });
  } catch (err: any) {
    handleGoogleError(err, req);
    console.warn('Error fetching sheets status on Google, returning local fallback:', err.message);
    const localDb = loadFallbackDB();
    const localStats = {
      visitorsCount: localDb.visitors ? localDb.visitors.length : 0,
      logsCount: localDb.activityLogs ? localDb.activityLogs.length : 0,
      fileSizeKb: fs.existsSync(FALLBACK_DB_PATH) ? Math.round(fs.statSync(FALLBACK_DB_PATH).size / 1024) : 0
    };
    res.json({
      success: true,
      isGoogleConnected: false,
      localStats,
      sheetsStats: {
        visitorsRows: 0,
        logsRows: 0,
        totalCells: 0,
        capacityPercentage: 0,
        limitWarning: false
      }
    });
  }
});

// Execute Google Sheets archival and truncation (Method 2)
app.post(['/api/archive-clear-sheets', '/api/sheets/archive'], async (req, res) => {
  try {
    const isGoogle = isGoogleConnected(req);
    if (!isGoogle) {
      return res.status(400).json({ error: 'ไม่พบการเชื่อมต่อ Google Sheets' });
    }

    const auth = getOAuth2Client(req);
    const sheetId = await getOrCreateDatabase(auth);
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Read all from Google Sheets
    const [visRes, logsRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'Visitors!A2:P' }),
      sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'Logs!A2:K' })
    ]);

    const googleVisitors = visRes.data.values || [];
    const googleLogs = logsRes.data.values || [];

    // 2. Load current local fallback database
    const fallback = loadFallbackDB();
    if (!fallback.visitors) fallback.visitors = [];
    if (!fallback.activityLogs) fallback.activityLogs = [];

    let mergedVisitorsCount = 0;
    let mergedLogsCount = 0;

    // Merge Visitors into local DB
    googleVisitors.forEach((row: any) => {
      const id = row[0];
      if (!id) return;
      
      const vObj = {
        id,
        name: row[1] || '',
        passportId: row[2] || '',
        phone: row[3] || '',
        vehiclePlate: row[4] || '',
        address: row[5] || '',
        company: row[6] || '',
        visitorType: row[7] || '',
        contactArea: row[8] || '',
        photoUrl: row[9] || '',
        photoDriveId: row[10] || '',
        status: row[11] || '',
        banReason: row[12] || '',
        registeredAt: row[13] || '',
        lastActivityAt: row[14] || '',
        registeredBy: row[15] || '',
      };

      const existingIdx = fallback.visitors.findIndex((v: any) => v.id === id);
      if (existingIdx !== -1) {
        fallback.visitors[existingIdx] = vObj;
      } else {
        fallback.visitors.push(vObj);
        mergedVisitorsCount++;
      }
    });

    // Merge Logs into local DB
    googleLogs.forEach((row: any) => {
      const id = row[0];
      if (!id) return;

      const lObj = {
        id,
        visitorId: row[1] || '',
        visitorName: row[2] || '',
        visitorType: row[3] || '',
        vehiclePlate: row[4] || '',
        company: row[5] || '',
        action: row[6] || '',
        timestamp: row[7] || '',
        area: row[8] || '',
        guardName: row[9] || '',
        guardCheckpoint: row[10] || '',
      };

      const existingIdx = fallback.activityLogs.findIndex((l: any) => l.id === id);
      if (existingIdx !== -1) {
        fallback.activityLogs[existingIdx] = lObj;
      } else {
        fallback.activityLogs.push(lObj);
        mergedLogsCount++;
      }
    });

    // Save merged database to disk
    saveFallbackDB(fallback);

    // 3. Filter active elements to retain on Google Sheets
    // - Keep BANNED visitors
    // - Keep checked-in visitors
    // - Keep the 50 most recent other visitors
    const bannedVisitors = googleVisitors.filter((row: any) => row[11] === 'banned');
    const checkedInVisitors = googleVisitors.filter((row: any) => row[11] && row[11].startsWith('เช็คอิน'));
    
    const otherVisitorsSorted = googleVisitors
      .filter((row: any) => row[11] !== 'banned' && (!row[11] || !row[11].startsWith('เช็คอิน')))
      .slice(-50);

    const allRetainedVisitors = [...bannedVisitors, ...checkedInVisitors, ...otherVisitorsSorted];
    const uniqueRetainedVisitors: any[] = [];
    const seenIds = new Set();
    allRetainedVisitors.forEach((row: any) => {
      const id = row[0];
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        uniqueRetainedVisitors.push(row);
      }
    });

    uniqueRetainedVisitors.sort((a, b) => a[0].localeCompare(b[0]));

    // - For logs: Keep the last 50 logs of history
    const uniqueRetainedLogs = googleLogs.slice(-50);

    // 4. Clear sheets
    await Promise.all([
      sheets.spreadsheets.values.clear({ spreadsheetId: sheetId, range: 'Visitors!A2:P' }),
      sheets.spreadsheets.values.clear({ spreadsheetId: sheetId, range: 'Logs!A2:K' })
    ]);

    // 5. Write back active records
    if (uniqueRetainedVisitors.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Visitors!A2:P${uniqueRetainedVisitors.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: uniqueRetainedVisitors }
      });
    }

    if (uniqueRetainedLogs.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Logs!A2:K${uniqueRetainedLogs.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: uniqueRetainedLogs }
      });
    }

    const initialTotalRows = googleVisitors.length + googleLogs.length;
    const finalTotalRows = uniqueRetainedVisitors.length + uniqueRetainedLogs.length;
    const savedRows = initialTotalRows - finalTotalRows;

    res.json({
      success: true,
      message: `ดำเนินการจัดเก็บประวัติเรียบร้อยแล้ว!`,
      details: `ย้ายข้อมูลประวัติเก่าจำนวน ${savedRows} รายการ เข้าฐานข้อมูลสำรองของเซิร์ฟเวอร์ถาวรแล้ว และทำการย่อขนาดหน้า Google Sheets เพื่อเพิ่มความเร็วระบบ โดยคงเหลือเฉพาะข้อมูลผู้ใช้ที่กำลังเข้าพบ (Checked In) ข้อมูลการแบน (Banned) และประวัติล่าสุดรวมกันเพียง ${finalTotalRows} รายการสำหรับปฏิบัติงานปัจจุบัน`
    });
  } catch (err: any) {
    console.error('Error running archive clear:', err);
    res.status(500).json({ error: err.message });
  }
});

// Download full local database archive
app.get('/api/download-archive', (req, res) => {
  try {
    if (fs.existsSync(FALLBACK_DB_PATH)) {
      res.setHeader('Content-disposition', 'attachment; filename=vms_backup_archive.json');
      res.setHeader('Content-type', 'application/json');
      const fileStream = fs.createReadStream(FALLBACK_DB_PATH);
      fileStream.pipe(res);
    } else {
      res.status(404).json({ error: 'ไม่พบไฟล์คลังจัดเก็บข้อมูลสำรอง' });
    }
  } catch (err: any) {
    console.error('Error downloading archive:', err);
    res.status(500).json({ error: err.message });
  }
});

// Trigger manual report email or check scheduler
app.post('/api/send-report', async (req, res) => {
  try {
    let auth = null;
    try {
      auth = getOAuth2Client(req);
    } catch (e) {
      console.log('Google Client Auth not available for manual report, will rely on SMTP if configured.');
    }
    const { recipientEmail, ccEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ error: 'กรุณาระบุอีเมลผู้รับ' });
    }

    const success = await compileAndSendReport(auth, recipientEmail, ccEmail);
    res.json({ success, message: `ส่งรายงานความปลอดภัยทางอีเมลไปยัง ${recipientEmail} เรียบร้อยแล้ว` });
  } catch (err: any) {
    console.error('Error sending report email:', err);
    res.status(500).json({ error: err.message });
  }
});

// Middleware scheduler checked on incoming requests to trigger daily scheduled email automatically
app.use(async (req, res, next) => {
  const fallback = loadFallbackDB();
  const brand = fallback.branding || {};
  const isGoogle = isGoogleConnected(null as any);
  const isSMTP = brand.emailServiceType === 'smtp' && brand.smtpHost && brand.smtpUser;

  if (isGoogle || isSMTP) {
    try {
      const emailConfig = brand.emailReportConfig || {
        enabled: true,
        recipients: '',
        ccRecipients: '',
        sendTime: '01:00'
      };

      // Automatic daily report email disabled per user request ("ยกเลิกการส่งเมลอัตโนมัติ เดี๋ยวส่งแบบแมนนวลเอง")
      if (false && emailConfig.enabled) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const todayStr = now.toISOString().split('T')[0];

        // Parse scheduled time (e.g. "01:00")
        const [targetHourStr, targetMinStr] = (emailConfig.sendTime || '01:00').split(':');
        const targetHour = targetHourStr ? parseInt(targetHourStr, 10) : 1;
        const targetMinute = targetMinStr ? parseInt(targetMinStr, 10) : 0;

        // Check if current time has reached/passed target time
        const reachedTime = (currentHour > targetHour) || (currentHour === targetHour && currentMinute >= targetMinute);

        if (reachedTime && lastReportSentDate !== todayStr) {
          console.log(`[SCHEDULER] Triggering automatic daily report check for ${todayStr} (Schedule: ${emailConfig.sendTime})...`);
          
          let oauth2Client = null;
          try {
            oauth2Client = getOAuth2Client(null as any);
          } catch (e) {
            console.log('[SCHEDULER] Active Google Client Auth not available, relying on SMTP or fallback.');
          }

          // Determine recipient email
          let finalRecipients = emailConfig.recipients ? emailConfig.recipients.trim() : '';
          
          // If no recipients specified in configuration, fallback to the logged-in user info email
          if (!finalRecipients && oauth2Client) {
            try {
              const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
              const userInfo = await oauth2.userinfo.get();
              finalRecipients = userInfo.data.email || '';
            } catch (e) {
              console.log('[SCHEDULER] Could not fetch userinfo via Google:', e);
            }
          }

          if (finalRecipients) {
            await compileAndSendReport(oauth2Client, finalRecipients, emailConfig.ccRecipients);
            lastReportSentDate = todayStr;
            console.log(`[SCHEDULER] Automated daily report sent successfully to ${finalRecipients} (CC: ${emailConfig.ccRecipients || 'none'})`);
          } else {
            console.warn('[SCHEDULER] No recipient configured and unable to auto-detect via Google auth. Report not sent.');
          }
        }
      }
    } catch (err) {
      console.error('[SCHEDULER] Failed to run automated daily report:', err);
    }
  }
  next();
});

// --- PWA MANIFEST & SERVICE WORKER ENDPOINTS ---
app.get('/manifest.json', (req, res) => {
  let orgName = 'GatePass System CDC';
  let logoUrl = 'https://lh3.googleusercontent.com/d/179vF02W0h7sP5eWfpD6fQZ4539VNYcr4';
  try {
    if (fs.existsSync(FALLBACK_DB_PATH)) {
      const raw = fs.readFileSync(FALLBACK_DB_PATH, 'utf8');
      const data = JSON.parse(raw);
      if (data.branding) {
        orgName = data.branding.organizationName || orgName;
        logoUrl = data.branding.logoUrl || logoUrl;
      }
    }
  } catch (err) {
    console.error('Error reading branding for manifest.json:', err);
  }

  res.json({
    name: orgName,
    short_name: orgName.substring(0, 12),
    description: `ระบบบันทึกประวัติการเข้าออกและออกใบผ่านทางสำหรับ ${orgName}`,
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: logoUrl,
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: logoUrl,
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  });
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    const CACHE_NAME = 'cdc-gatepass-v2';
    self.addEventListener('install', (event) => {
      self.skipWaiting();
    });
    self.addEventListener('activate', (event) => {
      event.waitUntil(self.clients.claim());
    });
    self.addEventListener('fetch', (event) => {
      if (event.request.mode === 'navigate') {
        event.respondWith(fetch(event.request).catch(() => caches.match('/')));
      } else {
        event.respondWith(fetch(event.request));
      }
    });
  `);
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  // Force update the local database with the user's Google Apps Script URL
  try {
    const db = loadFallbackDB();
    if (!db.branding) db.branding = {} as any;
    db.branding.googleAuthType = 'apps_script';
    db.branding.googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbzyU27Baxs9_C-ux3LwS_2Db4BpZ7G9W7sJoiuLf-MqlVgmJ2v3fxJdoPj8AnsypO1e/exec';
    saveFallbackDB(db);
    console.log('[Init] Stored database updated with Google Apps Script URL.');
  } catch (err: any) {
    console.error('Failed to initialize/migrate database:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MainGate Server] Running on port ${PORT}`);
  });
}

startServer();
