/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Visitor {
  id: string; // Auto-generated ID, e.g., pass ID or index
  name: string;
  passportId: string; // เลขบัตรประชาชน / Passport
  nationality?: string; // สัญชาติ
  gender?: string; // เพศ (ชาย / หญิง / อื่นๆ)
  dob?: string; // วันเดือนปีเกิด YYYY-MM-DD
  age?: number; // อายุ (คำนวณอัตโนมัติ)
  registrationCategory?: 'thai' | 'foreigner'; // ประเภทฟอร์ม: 'thai' | 'foreigner'
  passportNumber?: string; // หมายเลขพาสปอร์ต
  passportExpiryDate?: string; // วันหมดอายุพาสปอร์ต
  workPermitNumber?: string; // เลขใบอนุญาตทำงาน Work Permit
  workPermitIssueDate?: string; // วันที่ออกบัตรใบอนุญาตทำงาน
  workPermitExpiryDate?: string; // วันหมดอายุใบอนุญาตทำงาน
  isWorkPermitExpired?: boolean; // สถานะหมดอายุใบอนุญาตทำงาน
  phone: string;
  vehiclePlate: string;
  address: string;
  company: string;
  visitorType: string;
  contactArea: string;
  photoUrl: string; // URL on Google Drive or placeholder
  photoDriveId: string; // Drive ID
  status: string;
  banReason?: string;
  registeredAt: string; // ISO string
  lastActivityAt?: string;
  registeredBy?: string;
}

export interface ActivityLog {
  id: string;
  visitorId: string;
  visitorName: string;
  visitorType: string;
  vehiclePlate: string;
  company: string;
  action: 'check-in' | 'check-out';
  timestamp: string; // ISO string
  area: string;
}

export interface ElementPosition {
  left: number; // percentage (0-100)
  top: number;  // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
}

export interface PassTemplateConfig {
  layout: 'vertical' | 'horizontal' | 'custom' | 'receipt';
  badgeWidth: string;
  badgeHeight?: string; // height for custom canvas layout
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  textColor: string;
  bgColor: string;
  borderColor: string;
  borderWidth: '0px' | '1px' | '2px' | '4px' | '8px';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  headerText: string;
  footerText: string;
  showQrCode: boolean;
  showPhoto: boolean;
  showContactArea: boolean;
  showCompany: boolean;
  showVehiclePlate: boolean;
  showTimeIn: boolean;
  watermarkText?: string;
  signatureLine: boolean;
  securityNotice?: string;
  fontFamily?: string;
  lineHeight?: 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';
  positions?: {
    header?: ElementPosition;
    photo?: ElementPosition;
    qrCode?: ElementPosition;
    visitorInfo?: ElementPosition;
    detailsGrid?: ElementPosition;
    signatures?: ElementPosition;
    securityNotice?: ElementPosition;
    footer?: ElementPosition;
  };
}

export interface EmailReportConfig {
  enabled: boolean;
  recipients: string;
  ccRecipients: string;
  sendTime: string;
}

export interface BrandingConfig {
  organizationName: string;
  logoUrl?: string;
  logoDriveId?: string;
  primaryColor: string; // tailwind color class or hex, e.g., "#0f172a"
  accentColor: string;  // tailwind color class or hex, e.g., "#3b82f6"
  requiredFields: {
    name: boolean;
    passportId: boolean;
    phone: boolean;
    vehiclePlate: boolean;
    address: boolean;
    company: boolean;
    visitorType: boolean;
    contactArea: boolean;
  };
  roleMenuPermissions?: Record<string, any>;
  passTemplate?: PassTemplateConfig;
  faceMatchThreshold?: number;
  emailReportConfig?: EmailReportConfig;
  googleAuthType?: 'oauth' | 'service_account' | 'apps_script';
  googleServiceAccountJson?: string;
  googleSpreadsheetId?: string;
  googleAppsScriptUrl?: string;
  emailServiceType?: 'gmail_api' | 'smtp';
  smtpHost?: string;
  smtpPort?: string;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
}

export interface DashboardStats {
  totalVisitsToday: number;
  currentlyInside: number;
  totalBanned: number;
  registeredNotCheckedIn?: number;
  visitsByArea: { name: string; value: number }[];
  visitsByType: { name: string; value: number }[];
  visitsByHour: { hour: string; count: number }[];
  recentLogs: ActivityLog[];
  visitors?: Visitor[];
}
