/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  UserPlus, 
  QrCode, 
  Lock, 
  Settings, 
  FileSpreadsheet, 
  Users, 
  Activity, 
  RefreshCw,
  Mail, 
  Slash, 
  Check, 
  CheckCircle,
  Clock,
  Save,
  Printer,
  AlertTriangle, 
  Eye, 
  Sparkles, 
  Fingerprint, 
  Ban, 
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ChevronRight, 
  LogOut,
  LogIn,
  Sliders,
  HelpCircle,
  FileText,
  X,
  ExternalLink,
  MapPin,
  User,
  Upload,
  Camera,
  Key,
  Edit3,
  Loader2,
  Search,
  Chrome,
  Database,
  Smartphone,
  Download,
  HardDrive,
  Wifi,
  Radio,
  Globe,
  Zap,
  UserCheck,
  Moon,
  Sun,
  Calendar,
  Maximize2,
  Minimize2,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Visitor, ActivityLog, BrandingConfig, DashboardStats } from './types';
import CameraCapture from './components/CameraCapture';
import PassBadge from './components/PassBadge';
import DashboardCharts from './components/DashboardCharts';
import { googleSignIn, initAuth, logout, setAccessToken, getAccessToken, getTokenExpiryInfo, TokenExpiryInfo } from './auth';

import { BrandingSection } from './components/config/BrandingSection';
import { FormFieldsSection } from './components/config/FormFieldsSection';
import { PassDesignerSection } from './components/config/PassDesignerSection';
import { IntegrationSection } from './components/config/IntegrationSection';
import { StorageSection } from './components/config/StorageSection';

const mockVisitorForPreview: Visitor = {
  id: "GP-8888",
  name: "สมชาย รักดี",
  passportId: "1-1002-00345-67-8",
  phone: "081-234-5678",
  vehiclePlate: "กข 1234 กรุงเทพฯ",
  address: "99/1 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ",
  company: "บริษัท สิริ เทคโนโลยี จำกัด",
  visitorType: "Contractor",
  contactArea: "อาคาร A ชั้น 15",
  photoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
  photoDriveId: "",
  status: "checked-in",
  registeredAt: new Date().toISOString()
};

const getVisitorStatusBadge = (status: string, isEn?: boolean) => {
  const s = status || 'ยังไม่ถูกเช็คอิน';
  if (s === 'checked-in' || s.startsWith("เช็คอินโดย") || s.startsWith("Checked-in by")) {
    return {
      text: s === 'checked-in' ? (isEn ? 'Inside Area' : 'ภายในพื้นที่') : s,
      className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
    };
  }
  if (s === 'checked-out' || s.startsWith("เช็คเอาท์โดย") || s.startsWith("Checked-out by")) {
    return {
      text: s === 'checked-out' ? (isEn ? 'Checked Out' : 'ออกไปแล้ว') : s,
      className: 'bg-slate-800 text-slate-400 border border-slate-700/60'
    };
  }
  if (s === 'banned') {
    return {
      text: isEn ? 'Banned' : 'ถูกระงับสิทธิ์',
      className: 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
    };
  }
  return {
    text: (s === 'pending' || s === 'registered' || s === 'ยังไม่ถูกเช็คอิน' || !s)
      ? (isEn ? 'Not Checked In' : 'ยังไม่ถูกเช็คอิน')
      : s,
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
  };
};

const VISITOR_TYPES = [
  'โหลดเดอร์',
  'ส่งสินค้าภายในคลัง',
  'ส่งสินค้าร้านจำหน่ายอาหาร',
  'รับสินค้า',
  'รับภาชนะ',
  'ส่งภาชนะ',
  'พนักงานโรงอาหาร',
  'ส่งเอกสาร',
  'รับซื้อขยะ',
  'เจ้าหน้าที่อบรม',
  'ผู้จัดกิจกรรม',
  'ผู้รับเหมา',
  'ประกัน',
  'ออดิท',
  'ส่งพัสดุ',
  'อื่นๆ'
];

const ROLE_PERMISSIONS: Record<string, { desc: string; allowed: boolean }[]> = {
  'Staff': [
    { desc: 'สแกนใบหน้าและบันทึกประวัติ ณ จุดตรวจเข้า-ออก', allowed: true },
    { desc: 'เพิ่มใบผ่านผู้ติดต่อและบันทึกประวัติรูปหน้าใหม่', allowed: true },
    { desc: 'จัดการสถานะผู้ติดต่อและแบนบุคคลต้องห้าม', allowed: false },
    { desc: 'เข้าถึงสถิติแดชบอร์ดภาพรวมและรายงานส่งออก', allowed: false },
    { desc: 'แก้ไขค่าปรับแต่งตราสัญลักษณ์ & การเชื่อมต่อระบบคลาวด์', allowed: false }
  ],
  'Security Guard': [
    { desc: 'สแกนใบหน้าและบันทึกประวัติ ณ จุดตรวจเข้า-ออก', allowed: true },
    { desc: 'เพิ่มใบผ่านผู้ติดต่อและบันทึกประวัติรูปหน้าใหม่', allowed: true },
    { desc: 'จัดการสถานะผู้ติดต่อและแบนบุคคลต้องห้าม', allowed: false },
    { desc: 'เข้าถึงสถิติแดชบอร์ดภาพรวมและรายงานส่งออก', allowed: false },
    { desc: 'แก้ไขค่าปรับแต่งตราสัญลักษณ์ & การเชื่อมต่อระบบคลาวด์', allowed: false }
  ],
  'Supervisor': [
    { desc: 'สแกนใบหน้าและบันทึกประวัติ ณ จุดตรวจเข้า-ออก', allowed: true },
    { desc: 'เพิ่มใบผ่านผู้ติดต่อและบันทึกประวัติรูปหน้าใหม่', allowed: true },
    { desc: 'จัดการสถานะผู้ติดต่อและแบนบุคคลต้องห้าม', allowed: true },
    { desc: 'เข้าถึงสถิติแดชบอร์ดภาพรวมและรายงานส่งออก', allowed: true },
    { desc: 'แก้ไขค่าปรับแต่งตราสัญลักษณ์ & การเชื่อมต่อระบบคลาวด์', allowed: false }
  ],
  'Manager': [
    { desc: 'สแกนใบหน้าและบันทึกประวัติ ณ จุดตรวจเข้า-ออก', allowed: true },
    { desc: 'เพิ่มใบผ่านผู้ติดต่อและบันทึกประวัติรูปหน้าใหม่', allowed: true },
    { desc: 'จัดการสถานะผู้ติดต่อและแบนบุคคลต้องห้าม', allowed: true },
    { desc: 'เข้าถึงสถิติแดชบอร์ดภาพรวมและรายงานส่งออก', allowed: true },
    { desc: 'แก้ไขค่าปรับแต่งตราสัญลักษณ์ & การเชื่อมต่อระบบคลาวด์', allowed: true }
  ],
  'Administrator': [
    { desc: 'สแกนใบหน้าและบันทึกประวัติ ณ จุดตรวจเข้า-ออก', allowed: true },
    { desc: 'เพิ่มใบผ่านผู้ติดต่อและบันทึกประวัติรูปหน้าใหม่', allowed: true },
    { desc: 'จัดการสถานะผู้ติดต่อและแบนบุคคลต้องห้าม', allowed: true },
    { desc: 'เข้าถึงสถิติแดชบอร์ดภาพรวมและรายงานส่งออก', allowed: true },
    { desc: 'แก้ไขค่าปรับแต่งตราสัญลักษณ์ & การเชื่อมต่อระบบคลาวด์', allowed: true }
  ]
};

const ROLES_LIST = [
  'Administrator',
  'Manager',
  'Supervisor',
  'Staff',
  'Security Guard'
];

const CONTACT_AREAS = [
  'Fulfilment Inbound',
  'Fulfilment Dishpatch',
  'Dry Inbound',
  'Dry Dishpatch',
  'Fresh Dishpatch',
  'Dry Transport',
  'Fresh Transport',
  'A-Zone',
  'B-Zone',
  'C-Zone',
  'M-Zone',
  'R-Zone',
  'Maintenance',
  'Good Return',
  'Facility',
  'จุดทิ้งขยะ Fresh',
  'จุดทิ้งขยะ Dry',
  'จุดทิ้งขยะ Canteen',
  'MainGate',
  'ลานจอดผู้รับเหมา',
  'Main Office',
  'Fruit and Vegetable',
  'Chill',
  'Frozen',
  'Asset Control',
  'Seafood',
  'Gatekeeper',
  'โรงอาหารด้านหลัง',
  'Canteen',
  'Siamfood',
  'MOWI'
];

const resizeAndCompressImage = (base64Str: string, maxWidth = 150, maxHeight = 150): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!base64Str) {
      resolve('');
      return;
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio and scale
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str); // Fallback to original
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Compress as jpeg with 0.7 quality to ensure small size
      const compressed = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressed);
    };
    img.onerror = (err) => {
      reject(err);
    };
  });
};

const LOCALES = {
  TH: {
    // Header
    sysStatus: "สถานะระบบ:",
    ready: "🟢 พร้อมใช้งาน",
    maintenance: "🟡 ปรับปรุงชั่วคราว",
    offline: "🔴 ปิดระบบ",
    dbConnected: "เชื่อมต่อฐานข้อมูล Google Sheets สำเร็จ",
    dbOffline: "ระบบฐานข้อมูลหลักพร้อมใช้งาน",
    connectCloud: "เชื่อมต่อคลาวด์",
    editProfile: "แก้ไขโปรไฟล์",
    logout: "ลงชื่อออก",
    mainGateSub: "MainGate Smart Pass & Facial Recognizer",
    
    // Sidebar Navigation
    tabGate: "เช็คอิน เข้า-ออก",
    tabRegister: "ลงทะเบียนใหม่",
    tabPass: "พิมพ์ใบผ่าน",
    tabAdmin: "ผู้ดูแลระบบ",

    // Banner Alert
    maintenanceTitle: "⚠️ ระบบอยู่ระหว่างการปรับปรุงชั่วคราว",
    maintenanceDesc: "ขณะนี้ผู้ดูแลระบบกำลังดำเนินการปรับปรุงระบบประจำวันหรืออัปเกรดฐานข้อมูล การลงทะเบียนสแกนใบหน้าและออกใบผ่านอาจพบความล่าช้าชั่วคราว ขออภัยในความไม่สะดวก",
    offlineTitle: "⛔ ปิดระบบชั่วคราว",
    offlineDesc: "ระบบตรวจคัดกรองความปลอดภัย MainGate ถูกปิดให้บริการเป็นการชั่วคราวตามนโยบายองค์กรหรือเหตุขัดข้องทางเทคนิค กรุณาติดต่อหัวหน้าฝ่ายความปลอดภัยโดยตรง",

    // Gate Control View
    gateTabScan: "ด่านตรวจผ่านเข้า-ออกพื้นที่",
    gateTabLost: "กรณีใบผ่านชำรุด / สูญหาย",
    gateTitle: "ด่านตรวจผ่านเข้า-ออกพื้นที่",
    gateDesc: "สแกนรหัสคิวอาร์โค้ดบนใบผ่านเพื่อบันทึกประวัติการเข้าออกอย่างปลอดภัย",
    lostTitle: "กรณีใบผ่านชำรุด / สูญหาย",
    lostDesc: "ถ่ายภาพใบหน้าเพื่อยืนยันตัวตนในกรณีที่ไม่มีใบผ่านหรือใบผ่านเสียหาย",
    passIdLabel: "รหัสผ่านทาง",
    passIdPlaceholder: "ระบุรหัส เช่น P123456",
    checkInBtn: "เช็คอินเข้าพื้นที่",
    checkOutBtn: "เช็คเอาท์ออกพื้นที่",
    saveGateBtn: "บันทึกประวัติเข้าพื้นที่",
    saveGateExitBtn: "บันทึกประวัติออกพื้นที่",
    simulateQr: "จำลองการสแกนคิวอาร์",
    noRecent: "ไม่มีรายชื่อผู้ผ่านลงทะเบียนล่าสุดในระบบ",
    scanningActive: "กำลังจำลองสแกนคิวอาร์...",
    quickScanHeader: "ค้นหาข้อมูลใบหน้าด้วยสแกนกล้อง",
    cameraButton: "ถ่ายรูปสแกนและเข้า/ออกพื้นที่",

    // Visitor Registration View
    regHeader: "ระบบขอรับใบผ่านเข้าออก",
    regSub: "ลงทะเบียนข้อมูลผู้ติดต่อเข้าพื้นที่ หรือดึงข้อมูลเก่าได้ด้วยการสแกนใบหน้า",
    retrieveTab: "ดึงข้อมูลจากใบหน้า",
    newRegTab: "ลงทะเบียนใหม่",
    scanFaceTitle: "สแกนใบหน้าเพื่อค้นหาข้อมูลเดิมของคุณ",
    scanFaceDesc: "ระบบจะนำภาพใบหน้าของคุณไปเปรียบเทียบในคลาวด์ หากพบข้อมูล ระบบจะนำมากรอกในฟอร์มลงทะเบียนเดิมให้คุณโดยอัตโนมัติ",
    scanFaceBtn: "ถ่ายรูปสแกนและค้นหาประวัติ",
    originalFound: "ระบบพบประวัติข้อมูลเก่าของคุณ!",
    importPrompt: "ต้องการนำเข้าข้อมูลเดิม เพื่อความรวดเร็วในการลงทะเบียนใหม่ในครั้งนี้หรือไม่?",
    importConfirmBtn: "ตกลง, นำเข้าข้อมูลเก่าทันที",
    importCancelBtn: "ไม่นำเข้า, ต้องการกรอกแบบฟอร์มใหม่ทั้งหมด",
    importSuccessMsg: 'ระบบได้นำเข้าข้อมูลประวัติเดิมของ "{name}" เรียบร้อยแล้ว โปรดตรวจสอบและกดลงทะเบียนใหม่',
    photoLabel: "รูปถ่ายประจำตัวผู้ติดต่อ",
    takePhotoBtn: "ถ่ายรูปสแกนหน้า",
    uploadBtn: "อัปโหลดภาพใบหน้า",
    nameLabel: "ชื่อ-นามสกุลผู้ติดต่อ",
    idLabel: "หมายเลขบัตรประชาชน / พาสปอร์ต",
    phoneLabel: "เบอร์โทรศัพท์",
    vehicleLabel: "ทะเบียนรถยนต์ / รถจักรยานยนต์",
    vehicleNone: "ไม่มี",
    companyLabel: "บริษัท / หน่วยงานต้นสังกัด",
    addressLabel: "ที่อยู่ / รายละเอียดเพิ่มเติม",
    typeLabel: "ประเภทผู้ติดต่อ",
    areaLabel: "พื้นที่ติดต่อ",
    photoWarning: "⚠️ ต้องทำการถ่ายภาพใบหน้าก่อนจึงจะกดลงทะเบียนได้",
    submitRegBtn: "ลงทะเบียนและขอใบผ่านเข้าออก",

    // Print Pass View
    printHeader: "พิมพ์ใบผ่าน",
    printSub: "เลือกใบผ่านเข้าออกที่ต้องการตรวจสอบและพิมพ์",
    filterType: "กรองประเภทผู้ติดต่อ",
    searchPlaceholder: "ค้นหาด้วย ชื่อ / บริษัท",
    noPassFound: "ไม่พบข้อมูลผู้ขอใบผ่าน",
    selectHistoryPass: "-- กรุณาเลือกประวัติเพื่อจัดพิมพ์ใบผ่านเก่า ({count} รายการ) --",
    printNotice: "* ค้นหาหรือเลือกรายชื่อผู้ติดต่อจากช่องด้านบนเพื่อนำกลับมาแสดงภาพและพิมพ์ใบผ่านใหม่ได้ทันที",
    noPassSelectedTitle: "ยังไม่ได้เลือกใบผ่านทาง",
    noPassSelectedDesc: "กรุณาเลือกประวัติใบผ่านเก่าจากเมนูด้านบน หรือ ไปที่หน้าสมัครใบผ่านใหม่เพื่อสร้างข้อมูลเข้าระบบ",

    // Admin Tabs
    adminDashboard: "แดชบอร์ดสรุปสถิติ",
    adminCheckpoints: "จัดการด่านจุดตรวจ รปภ.",
    adminReports: "ส่งออกประวัติ PDF",
    adminConfig: "ตั้งค่าองค์กรและโลโก้",
    adminPermissions: "จัดการและแก้ไขสิทธิ์ใช้งาน",
    adminVisitors: "รายชื่อผู้ติดต่อเข้าพื้นที่",

    // Common / Buttons
    close: "ปิดหน้าต่างนี้",
    cancel: "ยกเลิก",
    save: "บันทึกการเปลี่ยนแปลง",
    saveStaff: "บันทึกข้อมูลเจ้าหน้าที่",
    username: "ชื่อผู้ใช้งาน",
    role: "ตำแหน่งระบบ",
    email: "ที่อยู่อีเมลติดต่อ",
    passwordReset: "เปลี่ยนรหัสผ่านใหม่",
    successSave: "บันทึกสำเร็จ",
    errorSave: "เกิดข้อขัดข้อง",

    // --- Newly Added for Compatibility ---
    regMainTitle: "ระบบขอรับใบผ่านเข้าออก",
    regMainDesc: "ลงทะเบียนข้อมูลผู้ติดต่อเข้าพื้นที่ หรือดึงข้อมูลเก่าได้ด้วยการสแกนใบหน้า",
    regTabRetrieve: "ดึงข้อมูลจากใบหน้า",
    regTabNew: "ลงทะเบียนใหม่",
    retrieveTitle: "สแกนใบหน้าเพื่อค้นหาข้อมูลเดิมของคุณ",
    retrieveDesc: "ระบบจะนำภาพใบหน้าของคุณไปเปรียบเทียบในคลาวด์ หากพบข้อมูล ระบบจะนำมากรอกในฟอร์มลงทะเบียนเดิมให้คุณโดยอัตโนมัติ",
    retrieveBtn: "ถ่ายรูปสแกนและค้นหาประวัติ",
    retrieveSuccess: "ระบบพบประวัติข้อมูลเก่าของคุณ!",
    retrievePrompt: "ต้องการนำเข้าข้อมูลเดิม เพื่อความรวดเร็วในการลงทะเบียนใหม่ในครั้งนี้หรือไม่?",
    agreeImport: "ตกลง, นำเข้าข้อมูลเก่าทันที",
    declineImport: "ไม่นำเข้า, ต้องการกรอกแบบฟอร์มใหม่ทั้งหมด",
    requiredField: "บังคับถ่ายรูป",
    captureRegFaceBtn: "ถ่ายภาพลงทะเบียนใบหน้า",
    mustCaptureWarning: "จำเป็นต้องถ่ายภาพใบหน้าจริงเพื่อความปลอดภัย ก่อนลงทะเบียนขอใบผ่าน",
    captureSuccess: "ได้รับไฟล์ภาพสแกนใบหน้าพร้อมลงทะเบียน",
    namePlaceholder: "กรอกชื่อและนามสกุล",
    passportLabel: "เลขบัตรประชาชน / Passport",
    passportPlaceholder: "เลข 13 หลัก หรือเลขพาสปอร์ต",
    phonePlaceholder: "กรอกเบอร์มือถือ",
    plateLabel: "ทะเบียนรถ",
    platePlaceholder: "เช่น 9กข-9999 กรุงเทพ",
    companyPlaceholder: "ระบุบริษัทต้นสังกัด",
    visitorTypeLabel: "ประเภทผู้ติดต่อ",
    contactAreaLabel: "พื้นที่เข้าติดต่อ",
    addressPlaceholder: "ระบุที่อยู่ของท่านตามกฎหมาย",
    registeringBtn: "กำลังส่งข้อมูลเข้าสู่คลาวด์และจัดทำรหัสผ่านทาง...",
    mustPhotoWarningBtn: "ต้องทำการถ่ายภาพใบหน้าก่อนจึงจะกดลงทะเบียนได้",
    lostInputLabel: "เพื่อความรวดเร็วในการจับคู่อินเตอร์เฟส กรุณาระบุรหัสบัตรประชาชน หรือคำค้นหาชื่อ",
    lostInputPlaceholder: "ระบุเลขบัตรประชาชน หรือชื่อ เพื่อยืนยันตัวตนพิเศษ",
    startFaceScanBtn: "เริ่มสแกนใบหน้าอัจฉริยะ",
    captureFaceBtn: "ถ่ายรูปสแกนและตรวจจับหน้าผู้ใช้",
    cancelBackBtn: "ยกเลิกและกลับ",
    lastMatchedFace: "สแกนพบคู่ใบหน้าตรงล่าสุด",
    foundByAiScan: "ค้นพบผ่าน AI สแกน",
    none: "ไม่มี"
  },
  EN: {
    // Header
    sysStatus: "System Status:",
    ready: "🟢 Ready",
    maintenance: "🟡 Maintenance",
    offline: "🔴 Offline",
    dbConnected: "Google Sheets Synced",
    dbOffline: "System Database Ready",
    connectCloud: "Connect Cloud",
    editProfile: "Edit Profile",
    logout: "Log Out",
    mainGateSub: "MainGate Smart Pass & Facial Recognizer",

    // Sidebar Navigation
    tabGate: "Check-In / Out",
    tabRegister: "New Registration",
    tabPass: "Print Pass",
    tabAdmin: "Admin Panel",

    // Banner Alert
    maintenanceTitle: "⚠️ System Under Maintenance",
    maintenanceDesc: "The administrator is performing system maintenance or database upgrades. Registration and pass issuance may experience temporary delays. We apologize for any inconvenience.",
    offlineTitle: "⛔ System Offline",
    offlineDesc: "The MainGate security screening system has been temporarily suspended due to organizational policy or technical issues. Please contact the security supervisor directly.",

    // Gate Control View
    gateTabScan: "Checkpoint Entry/Exit",
    gateTabLost: "Damaged / Lost Pass",
    gateTitle: "Checkpoint Entry/Exit",
    gateDesc: "Scan the QR code on the pass to record secure entry/exit history.",
    lostTitle: "Damaged / Lost Pass",
    lostDesc: "Take a face photo to verify identity in case of lost or damaged pass.",
    passIdLabel: "Pass ID",
    passIdPlaceholder: "Enter code, e.g., P123456",
    checkInBtn: "CHECK-IN",
    checkOutBtn: "CHECK-OUT",
    saveGateBtn: "Record Entry",
    saveGateExitBtn: "Record Exit",
    simulateQr: "Simulate QR Scan",
    noRecent: "No recently registered visitors found",
    scanningActive: "Simulating QR scan...",
    quickScanHeader: "Scan Face to Retrieve",
    cameraButton: "Take Photo & Enter/Exit Area",

    // Visitor Registration View
    regHeader: "Visitor Registration",
    regSub: "Register visitor information, or retrieve existing data by scanning face.",
    retrieveTab: "Retrieve from Face",
    newRegTab: "New Registration",
    scanFaceTitle: "Scan Face to Retrieve Profile",
    scanFaceDesc: "The system compares your face in the cloud. If matched, it will auto-populate your form with previous details.",
    scanFaceBtn: "Take Photo & Search History",
    originalFound: "Original Profile Found!",
    importPrompt: "Do you want to import your previous data for faster registration?",
    importConfirmBtn: "Yes, Import Previous Data",
    importCancelBtn: "No, fill out a new form",
    importSuccessMsg: 'Imported previous profile of "{name}" successfully. Please review and submit registration.',
    photoLabel: "Face Photo",
    takePhotoBtn: "Capture Face",
    uploadBtn: "Upload Face Photo",
    nameLabel: "Full Name",
    idLabel: "ID / Passport Number",
    phoneLabel: "Phone Number",
    vehicleLabel: "Vehicle Plate Number",
    vehicleNone: "None",
    companyLabel: "Company / Affiliation",
    addressLabel: "Address / More Details",
    typeLabel: "Visitor Type",
    areaLabel: "Contact Area",
    photoWarning: "⚠️ Face photo is required before registration.",
    submitRegBtn: "Register & Request Pass",

    // Print Pass View
    printHeader: "Print Pass",
    printSub: "Select pass to verify and print",
    filterType: "Filter Visitor Type",
    searchPlaceholder: "Search Name / Company",
    noPassFound: "No passes found",
    selectHistoryPass: "-- Please select historical profile to print ({count} items) --",
    printNotice: "* Search or select visitor's name from the field above to view and reprint the pass immediately.",
    noPassSelectedTitle: "No Pass Selected",
    noPassSelectedDesc: "Please select a historical pass from the menu above, or register a new pass to generate the record.",

    // Admin Tabs
    adminDashboard: "Analytics Dashboard",
    adminCheckpoints: "Security Duty Stations",
    adminReports: "Export PDF Reports",
    adminConfig: "Branding Config",
    adminPermissions: "Role Permissions",
    adminVisitors: "Visitor Logs",

    // Common / Buttons
    close: "Close",
    cancel: "Cancel",
    save: "Save Changes",
    saveStaff: "Save Staff Info",
    username: "Username",
    role: "System Role",
    email: "Email",
    passwordReset: "Change Password",
    successSave: "Saved successfully",
    errorSave: "An error occurred",

    // --- Newly Added for Compatibility ---
    regMainTitle: "Visitor Registration",
    regMainDesc: "Register visitor information, or retrieve existing data by scanning face.",
    regTabRetrieve: "Retrieve from Face",
    regTabNew: "New Registration",
    retrieveTitle: "Scan Face to Retrieve Profile",
    retrieveDesc: "The system compares your face in the cloud. If matched, it will auto-populate your form with previous details.",
    retrieveBtn: "Take Photo & Search History",
    retrieveSuccess: "Original Profile Found!",
    retrievePrompt: "Do you want to import your previous data for faster registration?",
    agreeImport: "Yes, Import Previous Data",
    declineImport: "No, fill out a new form",
    requiredField: "required",
    captureRegFaceBtn: "Capture Registration Face",
    mustCaptureWarning: "Face photo is required for safety before registration.",
    captureSuccess: "Face photo captured successfully.",
    namePlaceholder: "Enter full name",
    passportLabel: "ID / Passport Number",
    passportPlaceholder: "13-digit ID or Passport number",
    phonePlaceholder: "Enter mobile number",
    plateLabel: "Vehicle Plate",
    platePlaceholder: "e.g., 9AB-9999 Bangkok",
    companyPlaceholder: "Enter affiliation company",
    visitorTypeLabel: "Visitor Type",
    contactAreaLabel: "Contact Area",
    addressPlaceholder: "Enter your legal address",
    registeringBtn: "Submitting to cloud and generating pass...",
    mustPhotoWarningBtn: "Face photo is required to register.",
    lostInputLabel: "For faster matching, please provide ID Card Number or Name search.",
    lostInputPlaceholder: "Enter ID or name for special verification",
    startFaceScanBtn: "Start Intelligent Face Scan",
    captureFaceBtn: "Capture and detect face",
    cancelBackBtn: "Cancel and Go Back",
    lastMatchedFace: "Last matched face profile",
    foundByAiScan: "Discovered via AI Face Scan",
    none: "None"
  }
};

const getApiUrl = (endpoint: string): string => {
  const customApiUrl = (import.meta as any).env?.VITE_API_URL;
  if (customApiUrl) {
    return `${customApiUrl}${endpoint}`;
  }
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
    return `https://cdc-gate-pass-421795389485.us-west1.run.app${endpoint}`;
  }
  return endpoint;
};

const getDisplayPhotoUrl = (url: string | null | undefined): string => {
  if (!url) return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  if (url.startsWith('/api/photo/')) {
    const driveId = url.substring('/api/photo/'.length);
    if (driveId && driveId !== 'local_fallback' && driveId !== 'local_fallback_on_error') {
      return getApiUrl(url);
    }
  }
  return url;
};

// Locally-scoped fetch wrapper to automatically route API requests to the production backend on GitHub Pages and guard against HTML error fallbacks
const fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' && input.startsWith('/api/') ? getApiUrl(input) : input;
  const res = await window.fetch(url, init);
  
  // Safely guard res.json() to prevent "Unexpected token '<'" exceptions if backend returns HTML fallback
  res.json = async () => {
    try {
      const text = await res.clone().text();
      const trimmed = text.trim();
      if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE')) {
        console.warn(`[API returned HTML instead of JSON for ${url}]`, trimmed.substring(0, 100));
        return { error: 'Invalid API response format', message: 'Server returned HTML instead of JSON' };
      }
      return JSON.parse(text);
    } catch (e) {
      console.warn(`[API returned invalid JSON for ${url}]`);
      return { error: 'Invalid API response format', message: 'Failed to parse JSON response' };
    }
  };
  
  return res;
};

export default function App() {
  // Language States
  const [lang, setLang] = useState<'TH' | 'EN'>(() => {
    return (localStorage.getItem('appLanguage') as any) || 'TH';
  });

  const t = (key: keyof typeof LOCALES.TH) => {
    return LOCALES[lang][key] || LOCALES.TH[key];
  };

  const tWithParams = (key: keyof typeof LOCALES.TH, params: Record<string, string>) => {
    let str = t(key);
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, v);
    });
    return str;
  };

  const tText = (th: string, en: string) => {
    return lang === 'TH' ? th : en;
  };

  // Global States
  const [activeTab, setActiveTab] = useState<'gate' | 'register' | 'pass' | 'admin'>('register');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [config, setConfig] = useState<BrandingConfig>({
    organizationName: 'GatePass Systeam CDC',
    logoUrl: 'https://lh3.googleusercontent.com/d/179vF02W0h7sP5eWfpD6fQZ4539VNYcr4',
    logoDriveId: '179vF02W0h7sP5eWfpD6fQZ4539VNYcr4',
    primaryColor: '#0f172a',
    accentColor: '#10b981',
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
    passTemplate: {
      layout: 'receipt',
      badgeWidth: '220px',
      fontSize: 'base',
      textColor: '#000000',
      bgColor: '#ffffff',
      borderColor: '#10b981',
      borderWidth: '2px',
      borderRadius: 'lg',
      headerText: 'บัตรผ่านเข้า-ออก Visitor Pass',
      footerText: 'กรุณาแสดงใบผ่านต่อเจ้าหน้าที่รักษาความปลอดภัย',
      showQrCode: true,
      showPhoto: true,
      showContactArea: true,
      showCompany: true,
      showVehiclePlate: true,
      showTimeIn: true,
      watermarkText: 'APPROVED',
      signatureLine: true,
      securityNotice: 'บัตรนี้เป็นทรัพย์สินของบริษัทฯ กรุณาพกติดตัวขณะเข้าพื้นที่',
      fontFamily: 'Inter',
      lineHeight: 'normal',
    },
    faceMatchThreshold: 0.80,
    googleAuthType: 'apps_script',
    googleServiceAccountJson: '',
    googleAppsScriptUrl: 'https://script.google.com/macros/s/AKfycbzyU27Baxs9_C-ux3LwS_2Db4BpZ7G9W7sJoiuLf-MqlVgmJ2v3fxJdoPj8AnsypO1e/exec',
    emailServiceType: 'gmail_api',
    smtpHost: '',
    smtpPort: '587',
    smtpSecure: false,
    smtpUser: '',
    smtpPass: ''
  });

  // Custom Beautiful Success/Notification Popup State
  const [customNotification, setCustomNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    subMessage?: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    subMessage: ''
  });

  const showSuccessNotification = (title: string, message: string, subMessage?: string) => {
    setCustomNotification({
      isOpen: true,
      type: 'success',
      title,
      message,
      subMessage
    });
  };

  // Auto-close custom success notification after 4 seconds
  useEffect(() => {
    if (customNotification.isOpen) {
      const timer = setTimeout(() => {
        setCustomNotification(prev => ({ ...prev, isOpen: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [customNotification.isOpen]);

  // PWA Install states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(true);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [config.logoUrl]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setShowInstallBtn(false);
    } else {
      setShowInstallBtn(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA Install Choice: ${outcome}`);
        setDeferredPrompt(null);
        setShowInstallBtn(false);
      } catch (err) {
        console.error('PWA prompt failed, showing modal instead:', err);
        setShowInstallModal(true);
      }
    } else {
      // Show instruction modal for iOS / manual installation
      setShowInstallModal(true);
    }
  };

  const [dbConnected, setDbConnected] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [tokenExpiry, setTokenExpiry] = useState<TokenExpiryInfo | null>(null);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Real-time Clock Ticker for Time-in-Area Tracking (updates every 1 second)
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [showActiveVisitorsModal, setShowActiveVisitorsModal] = useState(false);
  const [activeVisitorSearch, setActiveVisitorSearch] = useState('');
  const [activeVisitorsModalFilter, setActiveVisitorsModalFilter] = useState<'all' | 'overstay'>('all');

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format milliseconds into human-readable duration (hours, minutes, seconds)
  const formatDurationFromMs = (diffMs: number, language: 'TH' | 'EN' = lang): string => {
    if (diffMs <= 0 || isNaN(diffMs)) return language === 'TH' ? '0 วินาที' : '0s';
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return language === 'TH' 
        ? `${hours} ชม. ${minutes} นาที ${seconds} วินาที` 
        : `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return language === 'TH' 
        ? `${minutes} นาที ${seconds} วินาที` 
        : `${minutes}m ${seconds}s`;
    }
    return language === 'TH' 
      ? `${seconds} วินาที` 
      : `${seconds}s`;
  };

  // Helper to determine visitor duration inside facility
  const getVisitorDurationInfo = (visitorId: string, visitorStatus?: string, lastActivityAt?: string) => {
    const isCheckedIn = !!(
      visitorStatus && 
      (visitorStatus.toLowerCase().includes('check-in') || 
       visitorStatus.includes('เช็คอิน') || 
       visitorStatus === 'checked-in')
    );

    // Find latest check-in log for this visitor
    const userLogs = dashboardStats.recentLogs.filter(l => l.visitorId === visitorId);
    const checkInLog = userLogs.find(l => l.action === 'check-in');
    const checkOutLog = userLogs.find(l => l.action === 'check-out' && new Date(l.timestamp) > new Date(checkInLog?.timestamp || 0));

    if (isCheckedIn) {
      const startTimeIso = checkInLog?.timestamp || lastActivityAt;
      if (!startTimeIso) return { isInside: true, durationText: '-', diffMs: 0, isOverstay24h: false };
      const startMs = new Date(startTimeIso).getTime();
      if (isNaN(startMs)) return { isInside: true, durationText: '-', diffMs: 0, isOverstay24h: false };
      const diffMs = Math.max(0, nowMs - startMs);
      const isOverstay24h = diffMs >= 24 * 60 * 60 * 1000;
      return {
        isInside: true,
        checkInTime: startTimeIso,
        durationText: formatDurationFromMs(diffMs, lang),
        diffMs,
        isOverstay24h
      };
    } else {
      if (checkInLog && checkOutLog) {
        const startMs = new Date(checkInLog.timestamp).getTime();
        const endMs = new Date(checkOutLog.timestamp).getTime();
        const diffMs = Math.max(0, endMs - startMs);
        return {
          isInside: false,
          checkInTime: checkInLog.timestamp,
          checkOutTime: checkOutLog.timestamp,
          durationText: formatDurationFromMs(diffMs, lang),
          diffMs,
          isOverstay24h: false
        };
      }
      return { isInside: false, durationText: '-', diffMs: 0, isOverstay24h: false };
    }
  };

  // Helpers for Age & Work Permit Validation
  const calculateAgeFromDob = (dobStr: string): number | null => {
    if (!dobStr) return null;
    const birthDate = new Date(dobStr);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const checkWorkPermitExpired = (expiryStr: string): boolean => {
    if (!expiryStr) return false;
    const expiryDate = new Date(expiryStr);
    if (isNaN(expiryDate.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiryDate.getTime() < today.getTime();
  };

  // Visitor Registration States
  const [regForm, setRegForm] = useState({
    registrationCategory: 'thai' as 'thai' | 'foreigner',
    name: '',
    passportId: '', // เลขบัตรประจำตัวประชาชน (คนไทย)
    nationality: 'ไทย',
    gender: '', // เพศ (ชาย / หญิง / อื่นๆ)
    dob: '',
    phone: '',
    vehiclePlate: '',
    address: '',
    company: '',
    visitorType: 'โหลดเดอร์',
    contactArea: 'MainGate',
    // Foreigner / Migrant Worker fields
    passportNumber: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    workPermitNumber: '',
    workPermitIssueDate: '',
    workPermitExpiryDate: '',
  });
  const [regPhoto, setRegPhoto] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRetrievingByPassport, setIsRetrievingByPassport] = useState(false);
  const [newPass, setNewPass] = useState<Visitor | null>(null);
  const [passSearch, setPassSearch] = useState('');
  const [passCurrentPage, setPassCurrentPage] = useState(1);
  const [showRegSuccess, setShowRegSuccess] = useState(false);
  const [searchFaceRetrieving, setSearchFaceRetrieving] = useState(false);
  const [showFaceRetrievalCamera, setShowFaceRetrievalCamera] = useState(false);
  const [retrievalStatus, setRetrievalStatus] = useState<string | null>(null);
  const [matchedVisitorToImport, setMatchedVisitorToImport] = useState<Visitor | null>(null);
  const [registerSubTab, setRegisterSubTab] = useState<'new' | 'retrieve'>('new');

  // Gate Scanner / Face Matcher States
  const [gateIdInput, setGateIdInput] = useState('');
  const [scannedOrSearchedVisitor, setScannedOrSearchedVisitor] = useState<Visitor | null>(null);
  const [multipleSearchResults, setMultipleSearchResults] = useState<Visitor[]>([]);
  const [gateLogAction, setGateLogAction] = useState<'check-in' | 'check-out'>('check-in');
  const [gateStatusMsg, setGateStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isGateScanning, setIsGateScanning] = useState(false);
  const [showGateFaceCam, setShowGateFaceCam] = useState(false);
  const [passportHint, setPassportHint] = useState('');
  const [gateFaceVerificationResult, setGateFaceVerificationResult] = useState<any>(null);
  const [gateSubTab, setGateSubTab] = useState<'scan' | 'lost'>('scan');
  const [hideVisitorDetails, setHideVisitorDetails] = useState(false);
  const [expandedImage, setExpandedImage] = useState<{ url: string; title?: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // QR Code Scanner States
  const [showGateQRScanner, setShowGateQRScanner] = useState(false);
  const [isQRScanningAI, setIsQRScanningAI] = useState(false);
  const [qrScanError, setQrScanError] = useState<string | null>(null);

  // Admin Portal States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  // System Users for Guard/Admin Login & Registration
  const [systemUsers, setSystemUsers] = useState<any[]>(() => {
    const saved = localStorage.getItem('systemUsers');
    const list = saved ? JSON.parse(saved) : [
      {
        username: 'Adminmaingate',
        password: 'Admin**5596',
        name: 'Super Admin',
        email: 'kittisak.s99631@gmail.com',
        role: tText(tText("ผู้ดูแลระบบระดับสูง", "Administrator"), "Administrator"),
        createdAt: new Date().toISOString()
      }
    ];
    return list.map((u: any) => {
      if (u.role === 'Safety Officer' || u.role === 'เจ้าหน้าที่ความปลอดภัย' || u.role === 'เจ้าหน้าที่ระบบ') {
        return { ...u, role: 'Staff' };
      }
      return u;
    });
  });
  const [loggedInSystemUser, setLoggedInSystemUser] = useState<any>(() => {
    const saved = localStorage.getItem('loggedInSystemUser');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.role === 'Safety Officer' || parsed.role === 'เจ้าหน้าที่ความปลอดภัย' || parsed.role === 'เจ้าหน้าที่ระบบ')) {
        parsed.role = 'Staff';
      }
      return parsed;
    }
    return null;
  });

  // Profile Edit States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: '' as string | null
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileCameraOpen, setProfileCameraOpen] = useState(false);

  // System Status State (ready, maintenance, offline)
  const [systemStatus, setSystemStatus] = useState<'ready' | 'maintenance' | 'offline'>(() => {
    return (localStorage.getItem('systemStatus') as any) || 'ready';
  });

  // Admin Editing Staff States
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [showStaffEditModal, setShowStaffEditModal] = useState(false);
  const [isStaffCreateMode, setIsStaffCreateMode] = useState(false);
  const [staffForm, setStaffForm] = useState({
    username: '',
    name: '',
    email: '',
    role: '',
    avatar: '' as string | null,
    password: '',
    confirmPassword: ''
  });
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);
  const [staffCameraOpen, setStaffCameraOpen] = useState(false);

  // Sign up mode states
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [signUpForm, setSignUpForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: tText(tText("เจ้าหน้าที่รักษาความปลอดภัย", "Security Guard"), "Security Guard"),
  });
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);

  const [roleMenuPermissions, setRoleMenuPermissions] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('roleMenuPermissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (parsed['Safety Officer']) {
            parsed['Staff'] = parsed['Safety Officer'];
            delete parsed['Safety Officer'];
          }
          return parsed;
        }
      } catch (e) {
        // ignore fallback to default
      }
    }
    return {
      'Administrator': {
        gate: true, register: true, pass: true, admin: true,
        admin_dashboard: true, admin_visitors: true, admin_staff: true, admin_online: true, admin_checkpoints: true, admin_reports: true, admin_config: true, admin_permissions: true
      },
      'Manager': {
        gate: true, register: true, pass: true, admin: true,
        admin_dashboard: true, admin_visitors: true, admin_staff: true, admin_online: true, admin_checkpoints: true, admin_reports: true, admin_config: true, admin_permissions: true
      },
      'Supervisor': {
        gate: true, register: true, pass: true, admin: true,
        admin_dashboard: true, admin_visitors: true, admin_staff: true, admin_online: true, admin_checkpoints: true, admin_reports: true, admin_config: false, admin_permissions: false
      },
      'Staff': {
        gate: true, register: true, pass: true, admin: false,
        admin_dashboard: false, admin_visitors: false, admin_staff: false, admin_online: false, admin_checkpoints: false, admin_reports: false, admin_config: false, admin_permissions: false
      },
      'Security Guard': {
        gate: true, register: true, pass: true, admin: false,
        admin_dashboard: false, admin_visitors: false, admin_staff: false, admin_online: false, admin_checkpoints: false, admin_reports: false, admin_config: false, admin_permissions: false
      }
    };
  });

  useEffect(() => {
    localStorage.setItem('roleMenuPermissions', JSON.stringify(roleMenuPermissions));

    if (!isConfigLoaded) return;

    const syncPermissions = async () => {
      const token = getAccessToken();
      try {
        const response = await fetch('/api/branding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            ...config,
            roleMenuPermissions,
          }),
        });
        if (response.ok) {
          const updatedConfig = await response.json();
          if (updatedConfig.roleMenuPermissions && JSON.stringify(updatedConfig.roleMenuPermissions) !== JSON.stringify(config.roleMenuPermissions)) {
            setConfig(prev => ({
              ...prev,
              roleMenuPermissions: updatedConfig.roleMenuPermissions,
              organizationName: updatedConfig.organizationName,
              logoUrl: updatedConfig.logoUrl,
              logoDriveId: updatedConfig.logoDriveId,
              primaryColor: updatedConfig.primaryColor,
              accentColor: updatedConfig.accentColor,
              requiredFields: updatedConfig.requiredFields
            }));
          }
        }
      } catch (err) {
        console.error('Failed to auto-sync role permissions to database:', err);
      }
    };

    const timer = setTimeout(() => {
      syncPermissions();
    }, 1000);

    return () => clearTimeout(timer);
  }, [roleMenuPermissions, isConfigLoaded]);

  const [selectedRoleToConfig, setSelectedRoleToConfig] = useState<string>(tText(tText("ผู้ดูแลระบบระดับสูง", "Administrator"), "Administrator"));

  const [adminTab, setAdminTab] = useState<'dashboard' | 'visitors' | 'staff' | 'online' | 'config' | 'reports' | 'checkpoints' | 'permissions'>('dashboard');
  const [onlineUsersList, setOnlineUsersList] = useState<any[]>([]);
  const [onlineUsersCount, setOnlineUsersCount] = useState<number>(0);
  const [isFetchingOnline, setIsFetchingOnline] = useState<boolean>(false);
  const [onlineSearchQuery, setOnlineSearchQuery] = useState<string>('');
  const [onlineRoleFilter, setOnlineRoleFilter] = useState<string>('all');
  const [configSubTab, setConfigSubTab] = useState<'branding' | 'fields' | 'designer' | 'integration' | 'storage'>('branding');
  const [guardAssignments, setGuardAssignments] = useState<any[]>(() => {
    const saved = localStorage.getItem('guardAssignments');
    return saved ? JSON.parse(saved) : [];
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalVisitsToday: 0,
    currentlyInside: 0,
    totalBanned: 0,
    registeredNotCheckedIn: 0,
    visitsByArea: [],
    visitsByType: [],
    visitsByHour: [],
    recentLogs: [],
  });
  const [visitorsList, setVisitorsList] = useState<Visitor[]>([]);
  
  // Compute visitors inside area for >24 hours
  const overstay24hVisitors = visitorsList.filter(v => {
    const durationInfo = getVisitorDurationInfo(v.id, v.status, v.lastActivityAt);
    return durationInfo.isInside && durationInfo.isOverstay24h;
  });

  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingVisitors, setLoadingVisitors] = useState(false);

  // Pagination States
  const [logsCurrentPage, setLogsCurrentPage] = useState(1);
  const logsPageSize = 10;
  const [visitorsCurrentPage, setVisitorsCurrentPage] = useState(1);
  const visitorsPageSize = 5;
  const [checkpointsCurrentPage, setCheckpointsCurrentPage] = useState(1);
  const checkpointsPageSize = 5;
  const [staffCurrentPage, setStaffCurrentPage] = useState(1);
  const staffPageSize = 5;

  // Checkpoint assignment editing state
  const [editingCheckpointGuard, setEditingCheckpointGuard] = useState<any | null>(null);
  const [tempActiveCheckpoint, setTempActiveCheckpoint] = useState<string>('');
  const [tempAllowedAreas, setTempAllowedAreas] = useState<string[]>([]);
  
  // Dashboard Filtering states
  const [filterPreset, setFilterPreset] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all' | 'custom'>('today');
  
  // PDF Report & Export States
  const [pdfReportTheme, setPdfReportTheme] = useState<'dark' | 'light'>('light');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfReportPreset, setPdfReportPreset] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all'>('today');
  const [pdfVisitorType, setPdfVisitorType] = useState<string>('all');
  const [pdfReportStats, setPdfReportStats] = useState<DashboardStats | null>(null);
  const [loadingPdfStats, setLoadingPdfStats] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [filterEndDate, setFilterEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [filterVisitorType, setFilterVisitorType] = useState<string>('');
  const [filterContactArea, setFilterContactArea] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  
  // Custom logo upload
  const [logoFileBase64, setLogoFileBase64] = useState<string | null>(null);
  const [savingBranding, setSavingBranding] = useState(false);
  const [seedingMock, setSeedingMock] = useState(false);
  const [clearingMock, setClearingMock] = useState(false);

  // Google Sheets Capacity & Archiving States (Method 2)
  const [sheetsStatus, setSheetsStatus] = useState<any>(null);
  const [loadingSheetsStatus, setLoadingSheetsStatus] = useState(false);
  const [archivingSheets, setArchivingSheets] = useState(false);
  const [archiveSuccessMsg, setArchiveSuccessMsg] = useState<string | null>(null);

  // Security Report States
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingReport, setSendingReport] = useState(false);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [showAuthIframeWarning, setShowAuthIframeWarning] = useState(false);

  // Scheduled Email Report States
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailCcRecipients, setEmailCcRecipients] = useState('');
  const [emailSendTime, setEmailSendTime] = useState('01:00');
  const [savingEmailConfig, setSavingEmailConfig] = useState(false);

  useEffect(() => {
    if (config?.emailReportConfig) {
      setEmailEnabled(config.emailReportConfig.enabled ?? false);
      setEmailRecipients(config.emailReportConfig.recipients || '');
      setEmailCcRecipients(config.emailReportConfig.ccRecipients || '');
      setEmailSendTime(config.emailReportConfig.sendTime || '01:00');
      if (config.emailReportConfig.recipients) {
        setRecipientEmail(config.emailReportConfig.recipients);
      }
    }
  }, [config]);

  // Ban management state
  const [bannedVisitorId, setBannedVisitorId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [submittingBan, setSubmittingBan] = useState(false);

  // Fullscreen state & handler
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const isFull = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isFull) {
      const docEl = document.documentElement as any;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } else {
      const doc = document as any;
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };

  // Entry Splash Loading Timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  // Initialize Auth & Load configuration
  useEffect(() => {
    initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        setDbConnected(true);
        fetchBrandingConfig(token);
        fetchDashboardData(token);
        fetchSystemUsers(token);
        fetchSheetsStatus();
      },
      () => {
        setGoogleUser(null);
        // Try fetching branding config and dashboard with empty token (server uses local fallback DB)
        const token = getAccessToken() || '';
        fetchBrandingConfig(token);
        fetchDashboardData(token);
        fetchSystemUsers(token);
        fetchSheetsStatus();
      }
    );
  }, []);

  const fetchSheetsStatus = async () => {
    try {
      setLoadingSheetsStatus(true);
      const token = getAccessToken();
      const res = await fetch('/api/sheets/capacity', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setSheetsStatus(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSheetsStatus(false);
    }
  };

  const handleArchiveSheets = async () => {
    try {
      setArchivingSheets(true);
      const token = getAccessToken();
      const res = await fetch('/api/sheets/archive', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setArchiveSuccessMsg(data.message || (lang === 'TH' ? 'ย้ายข้อมูลสถิติสำเร็จ' : 'Archived successfully'));
        fetchSheetsStatus();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setArchivingSheets(false);
    }
  };

  const parseCodeFromQRString = (rawText: string): string => {
    if (!rawText) return '';
    let str = rawText.trim();

    // Ignore base64 image data strings
    if (str.startsWith('data:image/') || str.length > 500) {
      return '';
    }

    // Filter out legacy native code artifact string
    if (str.includes('function encodeURIComponent') || str.includes('[native code]')) {
      return '';
    }

    // If scanned content is a URL
    if (str.startsWith('http://') || str.startsWith('https://')) {
      try {
        const url = new URL(str);
        // Check query parameters
        const queryId = url.searchParams.get('id') || 
                        url.searchParams.get('passId') || 
                        url.searchParams.get('code') || 
                        url.searchParams.get('v') || 
                        url.searchParams.get('passportId') || 
                        url.searchParams.get('phone');
        if (queryId && queryId.trim()) {
          return queryId.trim();
        }

        // Check path segments (e.g. /pass/P100201 or /P100201)
        const pathname = url.pathname.replace(/\/+$/, '');
        const segments = pathname.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1];
        if (lastSegment && !['pass', 'visitor', 'checkin', 'gate', 'app'].includes(lastSegment.toLowerCase())) {
          return decodeURIComponent(lastSegment).trim();
        }
      } catch (e) {
        const match = str.match(/([A-Za-z0-9\-]{3,30})$/);
        if (match) return match[1];
      }
    }

    return str;
  };

  const handleQRScanCaptured = async (imageOrText: string, textFromQR?: string) => {
    setQrScanError(null);
    let rawScanned = textFromQR || '';
    if (!rawScanned && !imageOrText.startsWith('data:image/')) {
      rawScanned = imageOrText;
    }

    let cleanId = parseCodeFromQRString(rawScanned);

    if (cleanId) {
      setGateIdInput(cleanId);
      setShowGateQRScanner(false);
      setQrScanError(null);
      handlePerformGateSearch(cleanId);
      return;
    }

    // Fallback: If local jsQR did not decode QR text, call AI QR scanner API
    const base64Img = imageOrText.startsWith('data:image/') ? imageOrText : null;
    if (base64Img) {
      try {
        setIsQRScanningAI(true);
        const res = await fetch('/api/scan-qr-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ capturedBase64: base64Img })
        });
        if (res.ok) {
          const data = await res.json();
          const aiId = data.passId || parseCodeFromQRString(data.qrText || '');
          if (aiId) {
            setGateIdInput(aiId);
            setShowGateQRScanner(false);
            setQrScanError(null);
            handlePerformGateSearch(aiId);
            return;
          }
        }
      } catch (err) {
        console.error("AI QR scanning error:", err);
      } finally {
        setIsQRScanningAI(false);
      }
    }

    // If no valid QR code was detected, display clear error message in scanner and do NOT insert base64 into input
    setQrScanError(
      lang === 'TH'
        ? 'ไม่พบข้อมูลคิวอาร์โค้ดที่ถูกต้องในรูปภาพ กรุณาชูใบผ่านที่มี QR Code หน้ากล้องให้ชัดเจน แล้วลองใหม่อีกครั้ง'
        : 'Could not extract a valid Pass ID from the scanned QR Code. Please align the QR Code clearly.'
    );
  };

  const handleAdminCheckInOut = async (id: string, action: 'check-in' | 'check-out') => {
    await handleGateCheckInOutDirectly(id, action);
  };

  const handleUnban = async (id: string) => {
    const token = getAccessToken() || '';
    try {
      const res = await fetch(`/api/visitors/${id}/unban`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchDashboardData(token);
        showSuccessNotification(
          lang === 'TH' ? 'ปลดแบนสำเร็จ' : 'Unbanned successfully',
          lang === 'TH' ? `ปลดแบนรหัส ${id} เรียบร้อยแล้ว` : `Visitor ${id} has been unbanned.`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBranding = async () => {
    try {
      setSavingBranding(true);
      const token = getAccessToken();
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        showSuccessNotification(
          lang === 'TH' ? 'บันทึกการตั้งค่าสำเร็จ' : 'Settings Saved',
          lang === 'TH' ? 'ปรับเปลี่ยนการตั้งค่าองค์กรเรียบร้อยแล้ว' : 'Brand settings updated.'
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingBranding(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setConfig(prev => ({ ...prev, logoUrl: event.target!.result as string }));
        setLogoError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSeedMockData = async () => {
    await handleSeedMockVisitors();
  };

  const handleClearMockData = async () => {
    await handleClearMockVisitors();
  };

  // Sync and tick token expiry session timer
  useEffect(() => {
    if (!dbConnected) {
      setTokenExpiry(null);
      return;
    }

    const updateExpiry = () => {
      const info = getTokenExpiryInfo();
      setTokenExpiry(info);
      
      // Automatic disconnect if expired to prevent API errors
      if (info && info.timeLeft <= 0) {
        handleGoogleDisconnect();
      }
    };

    updateExpiry();
    const interval = setInterval(updateExpiry, 1000);
    return () => clearInterval(interval);
  }, [dbConnected]);

  // Persist system users to local storage
  useEffect(() => {
    localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
  }, [systemUsers]);

  // Persist system status to local storage
  useEffect(() => {
    localStorage.setItem('systemStatus', systemStatus);
  }, [systemStatus]);

  // Persist guard assignments to local storage
  useEffect(() => {
    localStorage.setItem('guardAssignments', JSON.stringify(guardAssignments));
  }, [guardAssignments]);

  // Sync loggedInSystemUser with localStorage and administrative privilege state
  useEffect(() => {
    if (loggedInSystemUser) {
      localStorage.setItem('loggedInSystemUser', JSON.stringify(loggedInSystemUser));
      // Allow Admin Portal based on dynamic role permissions state
      const userPermissions = roleMenuPermissions[loggedInSystemUser.role] || { admin: false };
      const hasAdminRights = !!userPermissions.admin;
      setIsAdminLoggedIn(hasAdminRights);
    } else {
      localStorage.removeItem('loggedInSystemUser');
      setIsAdminLoggedIn(false);
    }
  }, [loggedInSystemUser, roleMenuPermissions]);

  // Redirect activeTab & adminTab based on dynamic role permissions state
  useEffect(() => {
    if (loggedInSystemUser) {
      const perms = roleMenuPermissions[loggedInSystemUser.role];
      if (perms) {
        // 1. Validate activeTab
        const isTabAllowed = !!perms[activeTab];
        if (!isTabAllowed) {
          const mainTabs: ('gate' | 'register' | 'pass' | 'admin')[] = ['gate', 'register', 'pass', 'admin'];
          const firstAllowed = mainTabs.find(tab => !!perms[tab]);
          if (firstAllowed) {
            setActiveTab(firstAllowed);
          }
        }

        // 2. Validate adminTab
        if (activeTab === 'admin') {
          const adminTabKey = `admin_${adminTab}` as keyof typeof perms;
          const isAdminTabAllowed = adminTab === 'staff'
            ? (perms.admin_staff !== undefined ? !!perms.admin_staff : !!perms.admin_visitors)
            : adminTab === 'online'
            ? (perms.admin_online !== undefined ? !!perms.admin_online : true)
            : !!perms[adminTabKey];
          if (!isAdminTabAllowed) {
            const adminSubTabs: ('dashboard' | 'visitors' | 'staff' | 'online' | 'checkpoints' | 'reports' | 'config' | 'permissions')[] = [
              'dashboard', 'visitors', 'staff', 'online', 'checkpoints', 'reports', 'config', 'permissions'
            ];
            const firstAllowedAdmin = adminSubTabs.find(tab => {
              const p = perms[`admin_${tab}` as keyof typeof perms];
              if (tab === 'staff') {
                return p !== undefined ? !!p : !!perms.admin_visitors;
              }
              if (tab === 'online') {
                return p !== undefined ? !!p : true;
              }
              return !!p;
            });
            if (firstAllowedAdmin) {
              setAdminTab(firstAllowedAdmin);
            }
          }
        }
      }
    }
  }, [loggedInSystemUser, activeTab, adminTab, roleMenuPermissions]);

  // Ref to track last user interaction timestamp for inactivity auto-logout
  const lastActivityRef = useRef<number>(Date.now());

  // Helper to check if a user is Super Admin
  const isSuperAdminUser = (user: any) => {
    if (!user) return false;
    const username = String(user.username || '').toLowerCase();
    const role = String(user.role || '').toLowerCase();
    const name = String(user.name || '').toLowerCase();

    return (
      username === 'adminmaingate' ||
      name === 'super admin' ||
      role.includes('administrator') ||
      role.includes('ผู้ดูแลระบบระดับสูง') ||
      role.includes('super admin')
    );
  };

  // Listen to user interaction events to keep activity timer fresh
  useEffect(() => {
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'wheel'];
    activityEvents.forEach(event => window.addEventListener(event, handleUserActivity, { passive: true }));

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, handleUserActivity));
    };
  }, []);

  // 30-Minute Inactivity Auto-Logout Effect for Non-Super Admin Users
  useEffect(() => {
    if (!loggedInSystemUser) return;

    // Reset activity timer when user logs in or user session changes
    lastActivityRef.current = Date.now();

    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes (1,800,000 ms)

    const interval = setInterval(() => {
      if (!loggedInSystemUser) return;

      // Skip auto-logout only for Super Admin
      if (!isSuperAdminUser(loggedInSystemUser)) {
        const now = Date.now();
        const inactiveMs = now - lastActivityRef.current;

        if (inactiveMs >= INACTIVITY_LIMIT_MS) {
          setLoggedInSystemUser(null);
          setIsAdminLoggedIn(false);
          setActiveTab('gate');
          setCustomNotification({
            isOpen: true,
            type: 'warning',
            title: lang === 'TH' ? '⏰ ออกจากระบบอัตโนมัติ' : '⏰ Automatic Logout',
            message: lang === 'TH' 
              ? 'ระบบได้ลงชื่อออกจากระบบอัตโนมัติเนื่องจากไม่มีการใช้งานนานเกิน 30 นาที เพื่อความปลอดภัย' 
              : 'You have been automatically logged out due to 30 minutes of inactivity for system security.'
          });
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [loggedInSystemUser, lang]);

  // Heartbeat & Online users real-time polling
  useEffect(() => {
    if (!loggedInSystemUser) {
      setOnlineUsersList([]);
      setOnlineUsersCount(0);
      return;
    }

    const activeCheckpoint = guardAssignments.find(a => a.username === loggedInSystemUser.username)?.activeCheckpoint;

    const sendHeartbeat = async () => {
      try {
        const res = await fetch('/api/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: loggedInSystemUser.username,
            name: loggedInSystemUser.name,
            role: loggedInSystemUser.role,
            avatar: loggedInSystemUser.avatar,
            activeCheckpoint: activeCheckpoint || undefined,
            currentTab: activeTab === 'admin' ? `Admin (${adminTab})` : activeTab,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.forcedLogout) {
            setLoggedInSystemUser(null);
            setIsAdminLoggedIn(false);
            setActiveTab('gate');
            setCustomNotification({
              isOpen: true,
              type: 'error',
              title: lang === 'TH' ? '🚫 ถูกให้ออกจากระบบ' : '🚫 Forced Logout',
              message: lang === 'TH' ? 'บัญชีของคุณถูกผู้ดูแลระบบสั่งให้ออกจากระบบ' : 'Your session was terminated by an administrator.'
            });
          } else if (data.onlineCount !== undefined) {
            setOnlineUsersCount(data.onlineCount);
          }
        }
      } catch (err) {
        console.warn('Heartbeat failed:', err);
      }
    };

    const fetchOnlineUsers = async () => {
      try {
        setIsFetchingOnline(true);
        const res = await fetch('/api/online-users');
        if (res.ok) {
          const data = await res.json();
          setOnlineUsersList(data.sessions || []);
          setOnlineUsersCount(data.onlineCount || 0);
        }
      } catch (err) {
        console.warn('Fetch online users error:', err);
      } finally {
        setIsFetchingOnline(false);
      }
    };

    sendHeartbeat();
    fetchOnlineUsers();

    const heartbeatInterval = setInterval(sendHeartbeat, 12000); // 12s
    const fetchInterval = setInterval(fetchOnlineUsers, 6000); // 6s

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(fetchInterval);
    };
  }, [loggedInSystemUser, activeTab, adminTab, guardAssignments, lang]);

  const handleForceLogoutUser = async (usernameToKick: string) => {
    if (!window.confirm(lang === 'TH' ? `คุณต้องการบังคับให้ผู้ใช้ @${usernameToKick} ออกจากระบบใช่หรือไม่?` : `Are you sure you want to force logout @${usernameToKick}?`)) {
      return;
    }
    try {
      const res = await fetch('/api/force-logout-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameToKick })
      });
      if (res.ok) {
        setCustomNotification({
          isOpen: true,
          type: 'success',
          title: lang === 'TH' ? 'บังคับออกจากระบบสำเร็จ' : 'Force Logout Successful',
          message: lang === 'TH' ? `ผู้ใช้ @${usernameToKick} ถูกให้ออกจากระบบเรียบร้อยแล้ว` : `User @${usernameToKick} has been force logged out.`
        });
        const resOnline = await fetch('/api/online-users');
        if (resOnline.ok) {
          const data = await resOnline.json();
          setOnlineUsersList(data.sessions || []);
          setOnlineUsersCount(data.onlineCount || 0);
        }
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Helper: Get guard's active assignment
  const getGuardAssignment = (username: string) => {
    const found = guardAssignments.find(a => a.username === username);
    if (found) return found;
    // Default assignment: MainGate checkpoint with full area permissions
    return {
      username,
      activeCheckpoint: 'MainGate',
      allowedAreas: CONTACT_AREAS,
      assignedBy: tText(tText("ระบบตั้งต้น", "Default system preset"), "Default system preset"),
      updatedAt: new Date().toISOString()
    };
  };

  const openCheckpointEdit = (user: any) => {
    setEditingCheckpointGuard(user);
    const assignment = getGuardAssignment(user.username);
    setTempActiveCheckpoint(assignment.activeCheckpoint);
    setTempAllowedAreas(assignment.allowedAreas);
  };

  // Fetch all system users from database
  const fetchSystemUsers = async (token?: string) => {
    try {
      const headers: Record<string, string> = {};
      const authToken = token || getAccessToken() || '';
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      const res = await fetch('/api/system-users', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSystemUsers(data);
        }
      }
    } catch (err) {
      console.error('Error fetching system users:', err);
    }
  };

  // Fetch branding from Sheets
  const fetchBrandingConfig = async (token: string) => {
    try {
      setLoadingConfig(true);
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/branding', { headers });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data.roleMenuPermissions) {
          setRoleMenuPermissions(data.roleMenuPermissions);
        }
        setDbConnected(true);
        setIsConfigLoaded(true);
      }
    } catch (err) {
      console.error('Error loading branding config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  // Fetch Dashboard Stats and Visitor logs
  const fetchDashboardData = async (
    token: string,
    customParams?: {
      startDate?: string;
      endDate?: string;
      visitorType?: string;
      contactArea?: string;
      action?: string;
      search?: string;
    }
  ) => {
    try {
      setLoadingDashboard(true);
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const params = new URLSearchParams();
      
      if (customParams) {
        if (customParams.startDate) params.append('startDate', customParams.startDate);
        if (customParams.endDate) params.append('endDate', customParams.endDate);
        if (customParams.visitorType) params.append('visitorType', customParams.visitorType);
        if (customParams.contactArea) params.append('contactArea', customParams.contactArea);
        if (customParams.action) params.append('action', customParams.action);
        if (customParams.search) params.append('search', customParams.search);
      } else {
        // use state values
        if (filterPreset !== 'all') {
          if (filterStartDate) params.append('startDate', filterStartDate);
          if (filterEndDate) params.append('endDate', filterEndDate);
        }
        if (filterVisitorType) params.append('visitorType', filterVisitorType);
        if (filterContactArea) params.append('contactArea', filterContactArea);
        if (filterAction) params.append('action', filterAction);
        if (filterSearch) params.append('search', filterSearch);
      }

      const queryString = params.toString();
      const res = await fetch(`/api/dashboard${queryString ? '?' + queryString : ''}`, { headers });
      if (res.ok) {
        const stats = await res.json();
        setDashboardStats(stats);
        setLogsCurrentPage(1);
        if (stats.visitors) {
          setVisitorsList(stats.visitors);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handlePresetChange = (preset: 'today' | 'yesterday' | '7days' | '30days' | 'all' | 'custom') => {
    setFilterPreset(preset);
    const today = new Date();
    let startStr = '';
    let endStr = '';

    if (preset === 'today') {
      const d = today.toISOString().split('T')[0];
      startStr = d;
      endStr = d;
    } else if (preset === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const d = yesterday.toISOString().split('T')[0];
      startStr = d;
      endStr = d;
    } else if (preset === '7days') {
      const prev7 = new Date(today);
      prev7.setDate(today.getDate() - 6);
      startStr = prev7.toISOString().split('T')[0];
      endStr = today.toISOString().split('T')[0];
    } else if (preset === '30days') {
      const prev30 = new Date(today);
      prev30.setDate(today.getDate() - 29);
      startStr = prev30.toISOString().split('T')[0];
      endStr = today.toISOString().split('T')[0];
    } else if (preset === 'all') {
      startStr = '';
      endStr = '';
    } else if (preset === 'custom') {
      startStr = filterStartDate;
      endStr = filterEndDate;
    }

    if (preset !== 'custom') {
      setFilterStartDate(startStr);
      setFilterEndDate(endStr);
    }

    // Instantly load data for the preset
    const token = getAccessToken() || '';
    fetchDashboardData(token, {
      startDate: startStr,
      endDate: endStr,
      visitorType: filterVisitorType,
      contactArea: filterContactArea,
      action: filterAction,
      search: filterSearch,
    });
  };

  // Fetch Report statistics and data specifically for the PDF report tab
  const fetchPdfReportData = async (
    token: string,
    presetOverride?: 'today' | 'yesterday' | '7days' | '30days' | 'all',
    typeOverride?: string
  ) => {
    try {
      setLoadingPdfStats(true);
      const activePreset = presetOverride || pdfReportPreset;
      const activeType = typeOverride || pdfVisitorType;
      
      const today = new Date();
      let startStr = '';
      let endStr = '';

      if (activePreset === 'today') {
        startStr = today.toISOString().split('T')[0];
        endStr = startStr;
      } else if (activePreset === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startStr = yesterday.toISOString().split('T')[0];
        endStr = startStr;
      } else if (activePreset === '7days') {
        const prev7 = new Date(today);
        prev7.setDate(today.getDate() - 6);
        startStr = prev7.toISOString().split('T')[0];
        endStr = today.toISOString().split('T')[0];
      } else if (activePreset === '30days') {
        const prev30 = new Date(today);
        prev30.setDate(today.getDate() - 29);
        startStr = prev30.toISOString().split('T')[0];
        endStr = today.toISOString().split('T')[0];
      } else if (activePreset === 'all') {
        startStr = '';
        endStr = '';
      }

      const params = new URLSearchParams();
      if (activePreset !== 'all') {
        if (startStr) params.append('startDate', startStr);
        if (endStr) params.append('endDate', endStr);
      }
      if (activeType && activeType !== 'all') {
        params.append('visitorType', activeType);
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const queryString = params.toString();
      const res = await fetch(`/api/dashboard${queryString ? '?' + queryString : ''}`, { headers });
      if (res.ok) {
        const stats = await res.json();
        setPdfReportStats(stats);
      }
    } catch (err) {
      console.error('Error fetching PDF report data:', err);
    } finally {
      setLoadingPdfStats(false);
    }
  };

  // Download rendered PDF report
  const handleDownloadPDF = async () => {
    const element = document.getElementById('pdf-report-canvas');
    if (!element) return;

    try {
      setExportingPdf(true);
      
      // Select appropriate background color based on theme
      const bgHex = pdfReportTheme === 'light' ? '#ffffff' : '#0c1524';
      
      // Configure html2canvas to be extremely robust inside iframe sandboxes:
      // useCORS: true and allowTaint: false allows loading external resources with CORS,
      // preventing SecurityError in sandboxed previews while preserving canvas clean state.
      const canvas = await html2canvas(element, {
        scale: 1.5, // High resolution yet light on memory
        useCORS: true,
        allowTaint: false,
        logging: true,
        backgroundColor: bgHex,
        windowWidth: 1024, // Fix width for consistent rendering ratio
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      // Calculate height of image in PDF keeping aspect ratio
      const imgHeightInPdf = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeightInPdf;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add subsequent pages if content overflows A4 height
      while (heightLeft >= 0) {
        position = heightLeft - imgHeightInPdf;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `Security_Report_${pdfReportPreset}_${dateStr}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setExportingPdf(false);
    }
  };

  // Fetch Visitor List
  const fetchVisitorsList = async () => {
    const token = getAccessToken() || '';
    try {
      setLoadingVisitors(true);
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/dashboard', { headers });
      if (res.ok) {
        const stats = await res.json();
        setDashboardStats(stats);
        if (stats.visitors) {
          setVisitorsList(stats.visitors);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVisitors(false);
    }
  };

  // Connect Google account for OAuth Sheet Database
  const handleGoogleConnect = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        const email = result.user.email || '';
        if (email.toLowerCase() !== 'kittisak.s99631@gmail.com') {
          await logout();
          setGoogleUser(null);
          setDbConnected(false);
          alert(tText(tText("ขออภัย ระบบอนุญาตเฉพาะบัญชี kittisak.s99631@gmail.com เท่านั้น", "Unauthorized. Access restricted to kittisak.s99631@gmail.com."), "Unauthorized. Access restricted to kittisak.s99631@gmail.com."));
          return;
        }
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        setDbConnected(true);
        fetchBrandingConfig(result.accessToken);
        fetchDashboardData(result.accessToken);
        if (result.user.email) setRecipientEmail(result.user.email);
        setShowAuthIframeWarning(false);
      }
    } catch (err: any) {
      console.error('Connection failed:', err);
      const isIframe = window.self !== window.top;
      const isPopupError = err?.code === 'auth/popup-closed-by-user' || 
                           err?.message?.includes('popup-closed-by-user') ||
                           err?.code === 'auth/cancelled-popup-request';
                           
      if (isIframe || isPopupError) {
        setShowAuthIframeWarning(true);
      } else {
        alert(`เชื่อมต่อ Google API ล้มเหลว: ${err?.message || err}`);
      }
    }
  };

  // Manual trigger for OAuth disconnect
  const handleGoogleDisconnect = async () => {
    await logout();
    setGoogleUser(null);
    setDbConnected(false);
  };

  // Google Authentication with Automatic System User mapping / registration
  const handleGoogleSystemLogin = async () => {
    try {
      setAdminError(null);
      const result = await googleSignIn();
      if (result) {
        const email = result.user.email || '';
        if (email.toLowerCase() !== 'kittisak.s99631@gmail.com') {
          await logout();
          setGoogleUser(null);
          setDbConnected(false);
          setAdminError(tText(tText("ขออภัย ระบบอนุญาตเฉพาะบัญชี kittisak.s99631@gmail.com เท่านั้น", "Unauthorized. Access restricted to kittisak.s99631@gmail.com."), "Unauthorized. Access restricted to kittisak.s99631@gmail.com."));
          return;
        }
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        setDbConnected(true);
        fetchBrandingConfig(result.accessToken);
        fetchDashboardData(result.accessToken);
        if (result.user.email) setRecipientEmail(result.user.email);
        setShowAuthIframeWarning(false);

        const name = result.user.displayName || email.split('@')[0] || 'Google User';

        // Fetch up-to-date system users
        let currentUsers = systemUsers;
        try {
          const res = await fetch('/api/system-users', {
            headers: {
              'Authorization': `Bearer ${result.accessToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data)) {
              setSystemUsers(data);
              currentUsers = data;
            }
          }
        } catch (e) {
          console.error('Failed to fetch system users during Google login:', e);
        }

        // Try to match existing user by email or username part
        const foundUser = currentUsers.find(
          u => u && ((u.email && String(u.email).toLowerCase() === email.toLowerCase()) || 
               (u.username && String(u.username).toLowerCase() === email.split('@')[0].toLowerCase()))
        );

        if (foundUser) {
          setLoggedInSystemUser(foundUser);
          setIsAdminLoggedIn(
            foundUser.role.includes('Administrator') || 
            foundUser.role.includes('Manager') || 
            foundUser.role.includes('Supervisor')
          );
        } else {
          // Auto-register new Google user as Guard / Staff
          const usernamePart = email ? email.split('@')[0] : 'google_' + result.user.uid.substring(0, 5);
          let finalUsername = usernamePart;
          let suffix = 1;
          while (currentUsers.some(u => u && u.username && String(u.username).toLowerCase() === finalUsername.toLowerCase())) {
            finalUsername = usernamePart + suffix;
            suffix++;
          }

          const newUser = {
            username: finalUsername,
            password: 'GoogleLoginPass**' + Math.random().toString(36).slice(-8),
            name: name,
            email: email,
            role: tText(tText("เจ้าหน้าที่รักษาความปลอดภัย", "Security Guard"), "Security Guard"),
            createdAt: new Date().toISOString(),
            avatar: result.user.photoURL || null
          };

          // Save on the server
          try {
            await fetch('/api/system-users', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${result.accessToken}`
              },
              body: JSON.stringify(newUser)
            });
            setSystemUsers(prev => [...prev, newUser]);
          } catch (saveErr) {
            console.error('Failed to save auto-registered user to server:', saveErr);
          }

          setLoggedInSystemUser(newUser);
          setIsAdminLoggedIn(false);
        }
      }
    } catch (err: any) {
      console.error('Google login failed:', err);
      const isIframe = window.self !== window.top;
      const isPopupError = err?.code === 'auth/popup-closed-by-user' || 
                           err?.message?.includes('popup-closed-by-user') ||
                           err?.code === 'auth/cancelled-popup-request';
                           
      if (isIframe || isPopupError) {
        setShowAuthIframeWarning(true);
      } else {
        setAdminError(`ลงชื่อเข้าใช้ด้วย Google ล้มเหลว: ${err?.message || err}`);
      }
    }
  };

  // Admin credentials verification with custom users support
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find matching user in systemUsers list
    const foundUser = systemUsers.find(
      u => u && u.username && String(u.username).toLowerCase() === adminUsername.trim().toLowerCase() && u.password === adminPassword
    );

    if (foundUser) {
      setIsAdminLoggedIn(true);
      setLoggedInSystemUser(foundUser);
      setAdminError(null);
      // Clear inputs
      setAdminUsername('');
      setAdminPassword('');
      const token = getAccessToken();
      if (token) {
        fetchDashboardData(token);
      }
    } else {
      setAdminError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือยังไม่ได้สมัครใช้บริการ');
    }
  };

  // Admin / Guard user registration (Sign up)
  const handleAdminSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);
    setSignUpSuccess(null);

    // Form validation
    if (!signUpForm.name.trim()) {
      setSignUpError('กรุณากรอกชื่อ-นามสกุลจริง');
      return;
    }
    if (!signUpForm.username.trim()) {
      setSignUpError('กรุณากรอกชื่อผู้ใช้งาน');
      return;
    }
    if (signUpForm.username.trim().length < 4) {
      setSignUpError('ชื่อผู้ใช้งานต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (signUpForm.password.length < 6) {
      setSignUpError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (signUpForm.password !== signUpForm.confirmPassword) {
      setSignUpError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    // Check if username already exists
    const usernameExists = systemUsers.some(
      u => u && u.username && String(u.username).toLowerCase() === signUpForm.username.trim().toLowerCase()
    );
    if (usernameExists) {
      setSignUpError('ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น');
      return;
    }

    // Append new user
    const newUser = {
      username: signUpForm.username.trim(),
      password: signUpForm.password,
      name: signUpForm.name.trim(),
      email: signUpForm.email.trim(),
      role: signUpForm.role,
      createdAt: new Date().toISOString()
    };

    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/system-users', {
        method: 'POST',
        headers,
        body: JSON.stringify(newUser)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'สมัครสิทธิ์ผู้ใช้งานระบบไม่สำเร็จ');
      }

      setSystemUsers(prev => [...prev, newUser]);
      setSignUpSuccess('สมัครสิทธิ์ผู้ใช้งานระบบสำเร็จแล้ว! ระบบกำลังนำท่านกลับสู่หน้าเข้าสู่ระบบ...');
      
      // Reset fields
      setSignUpForm({
        name: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: tText(tText("เจ้าหน้าที่รักษาความปลอดภัย", "Security Guard"), "Security Guard"),
      });

      // Auto switch back to login after showing success state
      setTimeout(() => {
        setIsSignUpMode(false);
        setSignUpSuccess(null);
      }, 2500);
    } catch (err: any) {
      setSignUpError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูลระบบ');
    }
  };

  const openProfileEdit = () => {
    if (!loggedInSystemUser) return;
    setProfileForm({
      name: loggedInSystemUser.name || '',
      email: loggedInSystemUser.email || '',
      password: '',
      confirmPassword: '',
      avatar: loggedInSystemUser.avatar || null
    });
    setProfileError(null);
    setProfileSuccess(null);
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!profileForm.name.trim()) {
      setProfileError('กรุณากรอกชื่อ-นามสกุลจริง');
      return;
    }

    if (profileForm.password) {
      if (profileForm.password.length < 6) {
        setProfileError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
      }
      if (profileForm.password !== profileForm.confirmPassword) {
        setProfileError('การยืนยันรหัสผ่านใหม่ไม่ตรงกัน');
        return;
      }
    }

    // Prepare updated user object
    const targetUser = systemUsers.find(u => u && u.username && String(u.username).toLowerCase() === String(loggedInSystemUser?.username || '').toLowerCase());
    if (!targetUser) {
      setProfileError('ไม่พบข้อมูลโปรไฟล์ของท่าน');
      return;
    }

    const updatedUser = {
      ...targetUser,
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      avatar: profileForm.avatar
    };
    if (profileForm.password) {
      updatedUser.password = profileForm.password;
    }

    // Auto-compress avatar to prevent Google Sheets 50,000 character cell limit error
    if (updatedUser.avatar && updatedUser.avatar.startsWith('data:image') && updatedUser.avatar.length > 30000) {
      try {
        updatedUser.avatar = await resizeAndCompressImage(updatedUser.avatar, 200, 200);
      } catch (err) {
        console.warn('Profile avatar compression failed:', err);
      }
    }

    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/system-users', {
        method: 'POST',
        headers,
        body: JSON.stringify(updatedUser)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'อัปเดตข้อมูลโปรไฟล์ไม่สำเร็จ');
      }

      // Update system users list and active session
      const updatedUsers = systemUsers.map(u => {
        if (u && u.username && String(u.username).toLowerCase() === String(loggedInSystemUser?.username || '').toLowerCase()) {
          return updatedUser;
        }
        return u;
      });

      setSystemUsers(updatedUsers);
      
      // Also update loggedInSystemUser
      setLoggedInSystemUser(updatedUser);

      setProfileSuccess('อัปเดตข้อมูลโปรไฟล์และรหัสผ่านเรียบร้อยแล้ว!');
      setTimeout(() => {
        setShowProfileModal(false);
      }, 1500);
    } catch (err: any) {
      setProfileError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูลระบบ');
    }
  };

  const openStaffEdit = (user: any) => {
    setIsStaffCreateMode(false);
    setEditingStaff(user);
    setStaffForm({
      username: user.username,
      name: user.name || '',
      email: user.email || '',
      role: user.role || tText(tText("เจ้าหน้าที่รักษาความปลอดภัย", "Security Guard"), "Security Guard"),
      avatar: user.avatar || null,
      password: '',
      confirmPassword: ''
    });
    setStaffError(null);
    setStaffSuccess(null);
    setShowStaffEditModal(true);
  };

  const openStaffCreate = () => {
    setIsStaffCreateMode(true);
    setEditingStaff({
      username: '',
      name: '',
      email: '',
      role: tText(tText("เจ้าหน้าที่รักษาความปลอดภัย", "Security Guard"), "Security Guard"),
      avatar: null,
      password: '',
      confirmPassword: ''
    });
    setStaffForm({
      username: '',
      name: '',
      email: '',
      role: tText(tText("เจ้าหน้าที่รักษาความปลอดภัย", "Security Guard"), "Security Guard"),
      avatar: null,
      password: '',
      confirmPassword: ''
    });
    setStaffError(null);
    setStaffSuccess(null);
    setShowStaffEditModal(true);
  };

  const handleSaveStaffByAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);
    setStaffSuccess(null);

    const isCreate = isStaffCreateMode;

    if (isCreate) {
      if (!staffForm.username.trim()) {
        setStaffError('กรุณากรอกชื่อผู้ใช้งาน');
        return;
      }
      if (staffForm.username.trim().length < 4) {
        setStaffError('ชื่อผู้ใช้งานต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
        return;
      }
      const usernameExists = systemUsers.some(u => u && u.username && String(u.username).toLowerCase() === staffForm.username.trim().toLowerCase());
      if (usernameExists) {
        setStaffError('ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว');
        return;
      }
      if (!staffForm.password) {
        setStaffError('กรุณากรอกรหัสผ่านเริ่มต้น');
        return;
      }
      if (staffForm.password.length < 6) {
        setStaffError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
      }
      if (staffForm.password !== staffForm.confirmPassword) {
        setStaffError('การยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }
    } else {
      if (staffForm.password) {
        if (staffForm.password.length < 6) {
          setStaffError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
          return;
        }
        if (staffForm.password !== staffForm.confirmPassword) {
          setStaffError('การยืนยันรหัสผ่านใหม่ไม่ตรงกัน');
          return;
        }
      }
    }

    if (!staffForm.name.trim()) {
      setStaffError('กรุณากรอกชื่อ-นามสกุลจริง');
      return;
    }

    let targetUserToSave: any;
    if (isCreate) {
      targetUserToSave = {
        username: staffForm.username.trim(),
        password: staffForm.password,
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
        role: staffForm.role || tText(tText("เจ้าหน้าที่รักษาความปลอดภัย", "Security Guard"), "Security Guard"),
        createdAt: new Date().toISOString(),
        avatar: staffForm.avatar || null
      };
    } else {
      // Find the target user being edited
      const targetUser = systemUsers.find(u => u && u.username && String(u.username).toLowerCase() === String(editingStaff?.username || '').toLowerCase());
      if (!targetUser) {
        setStaffError('ไม่พบข้อมูลเจ้าหน้าที่คนนี้');
        return;
      }

      targetUserToSave = {
        ...targetUser,
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
        role: staffForm.role,
        avatar: staffForm.avatar
      };
      if (staffForm.password) {
        targetUserToSave.password = staffForm.password;
      }
    }

    // Auto-compress avatar to prevent Google Sheets 50,000 character cell limit error
    if (targetUserToSave.avatar && targetUserToSave.avatar.startsWith('data:image') && targetUserToSave.avatar.length > 30000) {
      try {
        targetUserToSave.avatar = await resizeAndCompressImage(targetUserToSave.avatar, 200, 200);
      } catch (err) {
        console.warn('Staff avatar compression failed:', err);
      }
    }

    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/system-users', {
        method: 'POST',
        headers,
        body: JSON.stringify(targetUserToSave)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || (isCreate ? 'สร้างบัญชีผู้ใช้งานระบบไม่สำเร็จ' : 'อัปเดตข้อมูลสิทธิ์เจ้าหน้าที่ไม่สำเร็จ'));
      }

      // Update the systemUsers list
      let updatedUsers: any[];
      if (isCreate) {
        updatedUsers = [...systemUsers, targetUserToSave];
      } else {
        updatedUsers = systemUsers.map(u => {
          if (u && u.username && String(u.username).toLowerCase() === String(editingStaff?.username || '').toLowerCase()) {
            return targetUserToSave;
          }
          return u;
        });
      }

      setSystemUsers(updatedUsers);

      // If the admin edited their own account, update loggedInSystemUser too!
      if (!isCreate && loggedInSystemUser && String(loggedInSystemUser.username || '').toLowerCase() === String(editingStaff?.username || '').toLowerCase()) {
        const updatedSelf = updatedUsers.find(u => u && u.username && String(u.username).toLowerCase() === String(loggedInSystemUser.username || '').toLowerCase());
        if (updatedSelf) {
          setLoggedInSystemUser(updatedSelf);
        }
      }

      setStaffSuccess(isCreate ? 'สร้างบัญชีผู้ใช้งานระบบและสิทธิ์เรียบร้อยแล้ว!' : 'อัปเดตข้อมูลเจ้าหน้าที่และสิทธิ์เรียบร้อยแล้ว!');
      setTimeout(() => {
        setShowStaffEditModal(false);
        setEditingStaff(null);
        setIsStaffCreateMode(false);
      }, 1500);
    } catch (err: any) {
      setStaffError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูลระบบ');
    }
  };

  // Submit visitor registration form
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken() || '';

    // Check guard checkpoint permissions based on contactArea
    if (loggedInSystemUser && (loggedInSystemUser.role.includes('Guard') || loggedInSystemUser.role.includes('Staff'))) {
      const assignment = getGuardAssignment(loggedInSystemUser.username);
      if (!assignment.allowedAreas.includes(regForm.contactArea)) {
        alert(`❌ จำกัดสิทธิ์จุดเข้าติดต่อในวันนี้!\n\nคุณไม่สามารถออกใบผ่านสำหรับพื้นที่ "${regForm.contactArea}" ได้\nเนื่องจากในวันนี้คุณถูกกำหนดให้ประจำจุด "${assignment.activeCheckpoint}" และไม่มีสิทธิ์ในการดูแลพื้นที่ผู้ติดต่อนี้\n\n(กรุณาติดต่อ Supervisor หรือแอดมินระบบเพื่ออัปเดตสิทธิ์การเปลี่ยนจุดประจำวัน)`);
        return;
      }
    }

    // 1. Validation for Foreigner Document Expiry (Passport & Work Permit)
    if (regForm.registrationCategory === 'foreigner') {
      const isPassportExpired = checkWorkPermitExpired(regForm.passportExpiryDate);
      const isWorkPermitExpired = checkWorkPermitExpired(regForm.workPermitExpiryDate);

      if (isPassportExpired || isWorkPermitExpired) {
        const expiredDocs = [];
        if (isPassportExpired) expiredDocs.push(`พาสปอร์ต (หมดอายุ ${regForm.passportExpiryDate || 'ไม่ได้ระบุ'})`);
        if (isWorkPermitExpired) expiredDocs.push(`ใบอนุญาตทำงาน Work Permit (หมดอายุ ${regForm.workPermitExpiryDate || 'ไม่ได้ระบุ'})`);

        setCustomNotification({
          isOpen: true,
          type: 'error',
          title: '⛔ ไม่อนุญาตให้เข้าพื้นที่ (เอกสารหมดอายุ)',
          message: 'เอกสารประจำตัวหรือใบอนุญาตทำงานของแรงงานต่างชาติ/ต่างด้าวหมดอายุแล้ว',
          subMessage: `รายการเอกสารที่หมดอายุ: ${expiredDocs.join(', ')} — ระบบปฏิเสธการออกใบผ่านสำหรับเอกสารที่หมดอายุแล้ว`
        });
        return;
      }
    }

    // 2. Validation for Age limit (18 - 55 years old rule for Loaders and Workers)
    const calculatedAge = calculateAgeFromDob(regForm.dob);
    const isLoaderType = regForm.visitorType.includes('โหลดเดอร์') || regForm.visitorType.toLowerCase().includes('loader');

    if (calculatedAge !== null && (isLoaderType || regForm.registrationCategory === 'foreigner')) {
      if (calculatedAge < 18 || calculatedAge > 55) {
        setCustomNotification({
          isOpen: true,
          type: 'error',
          title: '⛔ ไม่อนุญาตให้เข้าพื้นที่ (ผิดเงื่อนไขอายุ)',
          message: `ผู้มาติดต่อประเภท "${regForm.visitorType}" ต้องมีอายุระหว่าง 18 - 55 ปีเท่านั้น`,
          subMessage: `อายุที่คำนวณได้จากวันเกิดคือ ${calculatedAge} ปี (${calculatedAge < 18 ? 'ต่ำกว่า 18 ปี' : 'เกิน 55 ปี'}) - ระบบไม่อนุญาตให้เข้าพื้นที่ตามกฎระเบียบความปลอดภัย`
        });
        return;
      }
    }

    if (!regPhoto) {
      setCustomNotification({
        isOpen: true,
        type: 'warning',
        title: lang === 'TH' ? '⚠️ ยังไม่ได้ถ่ายรูป' : '⚠️ Photo Required',
        message: lang === 'TH' 
          ? 'กรุณาทำการสแกนถ่ายรูปใบหน้าก่อนกดลงทะเบียนเข้าพื้นที่' 
          : 'Please capture a face photo before submitting visitor registration.',
        subMessage: lang === 'TH' 
          ? 'ระบบสแกนความปลอดภัยต้องการภาพถ่ายเพื่อออกใบผ่านอิเล็กทรอนิกส์' 
          : 'Security policy requires a facial photo for pass issuance.'
      });
      return;
    }

    try {
      setIsRegistering(true);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const effectivePassportId = regForm.registrationCategory === 'foreigner' 
        ? (regForm.passportNumber || regForm.passportId)
        : regForm.passportId;

      const isExpired = regForm.registrationCategory === 'foreigner' && checkWorkPermitExpired(regForm.workPermitExpiryDate);

      const response = await fetch('/api/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...regForm,
          passportId: effectivePassportId,
          age: calculatedAge || undefined,
          isWorkPermitExpired: isExpired,
          photoBase64: regPhoto,
          registeredBy: loggedInSystemUser?.name || tText(tText("ไม่ได้ระบุ", "Unspecified"), "Unspecified"),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setNewPass(data.visitor);
        if (data.visitor) {
          setVisitorsList(prev => [data.visitor, ...prev.filter(v => v.id !== data.visitor.id)]);
        }
        setShowRegSuccess(true);
        setActiveTab('pass');
        // Clear form
        setRegForm({
          registrationCategory: 'thai',
          name: '',
          passportId: '',
          nationality: 'ไทย',
          gender: '',
          dob: '',
          phone: '',
          vehiclePlate: '',
          address: '',
          company: '',
          visitorType: 'โหลดเดอร์',
          contactArea: 'MainGate',
          passportNumber: '',
          passportIssueDate: '',
          passportExpiryDate: '',
          workPermitNumber: '',
          workPermitIssueDate: '',
          workPermitExpiryDate: '',
        });
        setRegPhoto(null);
        fetchDashboardData(token);
      } else {
        alert(data.error || 'การลงทะเบียนล้มเหลว');
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      alert('เกิดข้อผิดพลาดในการลงทะเบียน: ' + err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  // Retrieve previous registration details using National ID/Passport (Optimized ultra-fast autofill)
  const handleRetrieveByPassport = async () => {
    const rawPassport = String(
      regForm.registrationCategory === 'foreigner' 
        ? (regForm.passportNumber || regForm.passportId || '')
        : (regForm.passportId || '')
    ).trim();
    if (!rawPassport) return;
    const token = getAccessToken() || '';

    // Step 1: Instant Client-Side Fill (0ms UI latency - always pick the latest updated profile)
    const cleanQuery = rawPassport.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const matchingVisitors = visitorsList.filter(v => {
      const pClean = String(v.passportId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const phClean = String(v.phone || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const idClean = String(v.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const vPass = String(v.passportId || '');
      const vPhone = String(v.phone || '');
      const vId = String(v.id || '');
      return vPass === rawPassport || vPhone === rawPassport || vId === rawPassport ||
             (cleanQuery && cleanQuery.length >= 3 && (pClean === cleanQuery || phClean === cleanQuery || idClean === cleanQuery));
    });

    matchingVisitors.sort((a, b) => {
      const timeA = new Date(a.registeredAt || a.lastActivityAt || 0).getTime();
      const timeB = new Date(b.registeredAt || b.lastActivityAt || 0).getTime();
      return timeB - timeA;
    });

    const localMatch = matchingVisitors[0];

    if (localMatch) {
      setRegForm(prev => ({
        ...prev,
        registrationCategory: localMatch.registrationCategory || (localMatch.nationality && localMatch.nationality !== 'ไทย' ? 'foreigner' : 'thai'),
        name: String(localMatch.name || prev.name || ''),
        passportId: String(localMatch.passportId || rawPassport),
        nationality: String(localMatch.nationality || (localMatch.registrationCategory === 'foreigner' ? 'ต่างด้าว' : 'ไทย')),
        gender: String(localMatch.gender || prev.gender || ''),
        dob: String(localMatch.dob || prev.dob || ''),
        phone: String(localMatch.phone || prev.phone || ''),
        vehiclePlate: String(localMatch.vehiclePlate || prev.vehiclePlate || ''),
        address: String(localMatch.address || prev.address || ''),
        company: String(localMatch.company || prev.company || ''),
        visitorType: String(localMatch.visitorType || prev.visitorType || 'โหลดเดอร์'),
        contactArea: String(localMatch.contactArea || prev.contactArea || 'MainGate'),
        passportNumber: String(localMatch.passportNumber || prev.passportNumber || ''),
        passportIssueDate: String(localMatch.passportIssueDate || prev.passportIssueDate || ''),
        passportExpiryDate: String(localMatch.passportExpiryDate || prev.passportExpiryDate || ''),
        workPermitNumber: String(localMatch.workPermitNumber || prev.workPermitNumber || ''),
        workPermitIssueDate: String(localMatch.workPermitIssueDate || prev.workPermitIssueDate || ''),
        workPermitExpiryDate: String(localMatch.workPermitExpiryDate || prev.workPermitExpiryDate || ''),
      }));
      if (localMatch.photoUrl) {
        setRegPhoto(localMatch.photoUrl);
      }
      setRetrievalStatus('');
    } else {
      setIsRetrievingByPassport(true);
    }

    // Step 2: Background Server Fetch (Uses server in-memory cache)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/retrieve-by-passport', {
        method: 'POST',
        headers,
        body: JSON.stringify({ passportId: rawPassport })
      });

      const data = await res.json();
      const visitorToUse = (res.ok && data.success && data.visitor) ? data.visitor : null;

      if (visitorToUse) {
        setRegForm(prev => ({
          ...prev,
          registrationCategory: visitorToUse.registrationCategory || (visitorToUse.nationality && visitorToUse.nationality !== 'ไทย' ? 'foreigner' : 'thai'),
          name: String(visitorToUse.name || prev.name || ''),
          passportId: String(visitorToUse.passportId || rawPassport),
          nationality: String(visitorToUse.nationality || prev.nationality || ''),
          gender: String(visitorToUse.gender || prev.gender || ''),
          dob: String(visitorToUse.dob || prev.dob || ''),
          phone: String(visitorToUse.phone || prev.phone || ''),
          vehiclePlate: String(visitorToUse.vehiclePlate || prev.vehiclePlate || ''),
          address: String(visitorToUse.address || prev.address || ''),
          company: String(visitorToUse.company || prev.company || ''),
          visitorType: String(visitorToUse.visitorType || prev.visitorType || 'โหลดเดอร์'),
          contactArea: String(visitorToUse.contactArea || prev.contactArea || 'MainGate'),
          passportNumber: String(visitorToUse.passportNumber || prev.passportNumber || ''),
          passportIssueDate: String(visitorToUse.passportIssueDate || prev.passportIssueDate || ''),
          passportExpiryDate: String(visitorToUse.passportExpiryDate || prev.passportExpiryDate || ''),
          workPermitNumber: String(visitorToUse.workPermitNumber || prev.workPermitNumber || ''),
          workPermitIssueDate: String(visitorToUse.workPermitIssueDate || prev.workPermitIssueDate || ''),
          workPermitExpiryDate: String(visitorToUse.workPermitExpiryDate || prev.workPermitExpiryDate || ''),
        }));
        if (visitorToUse.photoUrl) {
          setRegPhoto(visitorToUse.photoUrl);
        }
        setRetrievalStatus('');
      }
    } catch (err: any) {
      console.error('Retrieve by passport error:', err);
    } finally {
      setIsRetrievingByPassport(false);
    }
  };

  // Retrieve previous registration details using Smart Face Recognition
  const handleRetrieveByFace = async (capturedBase64: string) => {
    const token = getAccessToken() || '';

    try {
      setSearchFaceRetrieving(true);
      setRetrievalStatus(lang === 'TH' ? 'กำลังวิเคราะห์ใบหน้าและเปรียบเทียบในคลังข้อมูลอัจฉริยะ...' : 'Analyzing face and matching in secure smart cloud repository...');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/retrieve-by-face', {
        method: 'POST',
        headers,
        body: JSON.stringify({ capturedBase64 })
      });

      const data = await response.json();
      if (response.ok) {
        if (data.matchFound) {
          const vis = data.visitor;
          setMatchedVisitorToImport(vis);
          setRegForm(prev => ({
            ...prev,
            registrationCategory: vis.registrationCategory || (vis.nationality && vis.nationality !== 'ไทย' ? 'foreigner' : 'thai'),
            name: String(vis.name || prev.name || ''),
            passportId: String(vis.passportId || prev.passportId || ''),
            nationality: String(vis.nationality || (vis.registrationCategory === 'foreigner' ? 'ต่างด้าว' : 'ไทย')),
            gender: String(vis.gender || prev.gender || ''),
            dob: String(vis.dob || prev.dob || ''),
            phone: String(vis.phone || prev.phone || ''),
            vehiclePlate: String(vis.vehiclePlate || prev.vehiclePlate || ''),
            address: String(vis.address || prev.address || ''),
            company: String(vis.company || prev.company || ''),
            visitorType: String(vis.visitorType || prev.visitorType || 'โหลดเดอร์'),
            contactArea: String(vis.contactArea || prev.contactArea || 'MainGate'),
            passportNumber: String(vis.passportNumber || prev.passportNumber || ''),
            passportIssueDate: String(vis.passportIssueDate || prev.passportIssueDate || ''),
            passportExpiryDate: String(vis.passportExpiryDate || prev.passportExpiryDate || ''),
            workPermitNumber: String(vis.workPermitNumber || prev.workPermitNumber || ''),
            workPermitIssueDate: String(vis.workPermitIssueDate || prev.workPermitIssueDate || ''),
            workPermitExpiryDate: String(vis.workPermitExpiryDate || prev.workPermitExpiryDate || ''),
          }));
          if (vis.photoUrl) setRegPhoto(vis.photoUrl);
          setRetrievalStatus(lang === 'TH' ? `ระบบพบประวัติเก่าของคุณ ${vis.name} ในคลังข้อมูล!` : `System found existing records for ${vis.name} in the repository!`);
          setShowFaceRetrievalCamera(false);
        } else {
          setMatchedVisitorToImport(null);
          setRetrievalStatus(lang === 'TH' ? 'ไม่พบประวัติใบหน้าของคุณในฐานข้อมูล กรุณากรอกแบบฟอร์มเพื่อลงทะเบียนใหม่' : 'No matching face record found in database. Please fill out the registration form.');
        }
      } else {
        setMatchedVisitorToImport(null);
        setRetrievalStatus(data.error || (lang === 'TH' ? 'สแกนใบหน้าขัดข้อง' : 'Face recognition scan failure'));
      }
    } catch (err: any) {
      console.error('Face retrieval error:', err);
      setRetrievalStatus(lang === 'TH' ? 'เกิดข้อผิดพลาดในการประมวลผลใบหน้า' : 'Error processing face recognition');
    } finally {
      setSearchFaceRetrieving(false);
    }
  };

  const handlePerformGateSearch = (query: string) => {
    if (!query.trim()) {
      setGateStatusMsg({ type: 'error', text: lang === 'TH' ? 'กรุณากรอกรหัสใบผ่าน, ชื่อ-นามสกุล, เลขบัตรประชาชน หรือเลขทะเบียนรถเพื่อค้นหา' : 'Please enter a Pass ID, Name, Citizen ID, or Vehicle Plate to search' });
      return;
    }

    const q = query.trim().toUpperCase();
    const matches = visitorsList.filter(v => {
      const vId = String(v.id || '').toUpperCase();
      const vName = String(v.name || '').toUpperCase();
      const vPass = String(v.passportId || '');
      const vPhone = String(v.phone || '');
      const vPlate = String(v.vehiclePlate || '').toUpperCase();
      return (
        vId === q ||
        vName.includes(q) ||
        (vPass && vPass === q) ||
        (vPhone && vPhone === q) ||
        (vPlate && vPlate.includes(q))
      );
    });

    if (matches.length === 1) {
      const visitor = matches[0];
      setScannedOrSearchedVisitor(visitor);
      setMultipleSearchResults([]);
      setGateIdInput(visitor.id);
      
      if (visitor.status && (visitor.status.startsWith(tText(tText("เช็คอิน", "Check-In"), "Check-In")) || visitor.status === 'checked-in')) {
        setGateLogAction('check-out');
      } else {
        setGateLogAction('check-in');
      }
      setGateStatusMsg(null);
    } else if (matches.length > 1) {
      setMultipleSearchResults(matches);
      setScannedOrSearchedVisitor(null);
      setGateStatusMsg({ type: 'success', text: `พบผู้เข้าติดต่อที่ตรงกับเงื่อนไข ${matches.length} รายการ กรุณาเลือกบุคคลที่ต้องการ` });
    } else {
      setMultipleSearchResults([]);
      setScannedOrSearchedVisitor(null);
      setGateStatusMsg({ type: 'error', text: `ไม่พบข้อมูลผู้ผ่านทางที่ตรงกับ "${query}" ในระบบ` });
    }
  };

  // Check-In and Check-Out Trigger at the Gate
  const handleGateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken() || '';

    if (!gateIdInput.trim()) {
      setGateStatusMsg({ type: 'error', text: 'กรุณาระบุรหัสใบผ่านเข้าออก' });
      return;
    }

    try {
      setIsGateScanning(true);
      const activeAssignment = loggedInSystemUser ? getGuardAssignment(loggedInSystemUser.username) : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/check-in-out', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: gateIdInput.trim().toUpperCase(),
          action: gateLogAction,
          guardRole: loggedInSystemUser?.role,
          guardName: loggedInSystemUser?.name,
          guardCheckpoint: activeAssignment?.activeCheckpoint,
          guardAllowedAreas: activeAssignment?.allowedAreas,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setGateStatusMsg({
          type: 'success',
          text: lang === 'TH' 
            ? `ทำรายการ ${gateLogAction === 'check-in' ? 'เช็คอิน' : 'เช็คเอาท์'} สำเร็จ! คุณ ${data.visitorName} (${data.id})`
            : `${gateLogAction === 'check-in' ? 'Check-In' : 'Check-Out'} successful! ${data.visitorName} (${data.id})`
        });
        
        const updatedStatus = data.status || (gateLogAction === 'check-in' ? `เช็คอินโดย ${loggedInSystemUser?.name || 'N/A'}` : `เช็คเอาท์โดย ${loggedInSystemUser?.name || 'N/A'}`);
        const updatedTime = data.timestamp || new Date().toISOString();

        setVisitorsList(prev => prev.map(v => {
          if (v.id === data.id) {
            return {
              ...v,
              status: updatedStatus as any,
              lastActivityAt: updatedTime,
            };
          }
          return v;
        }));

        if (gateLogAction === 'check-in') {
          showSuccessNotification(
            lang === 'TH' ? '🟢 เช็คอินสำเร็จ!' : '🟢 Check-In Successful!',
            lang === 'TH'
              ? `คุณ ${data.visitorName} (${data.id}) ได้เข้าพื้นที่เรียบร้อยแล้ว`
              : `Visitor ${data.visitorName} (${data.id}) has entered the premises.`
          );
          setScannedOrSearchedVisitor(null);
          setGateIdInput('');
          setGateStatusMsg(null);
        } else {
          showSuccessNotification(
            lang === 'TH' ? '🔴 เช็คเอาท์สำเร็จ!' : '🔴 Check-Out Successful!',
            lang === 'TH'
              ? `คุณ ${data.visitorName} (${data.id}) ได้ออกจากพื้นที่เรียบร้อยแล้ว`
              : `Visitor ${data.visitorName} (${data.id}) has departed.`
          );
          setScannedOrSearchedVisitor(null);
          setGateIdInput('');
          setGateStatusMsg(null);
        }
        
        fetchDashboardData(token);
      } else {
        setGateStatusMsg({ type: 'error', text: data.error || (lang === 'TH' ? 'ทำรายการล้มเหลว' : 'Operation failed') });
      }
    } catch (err: any) {
      console.error('Gate check failed:', err);
      setGateStatusMsg({ type: 'error', text: (lang === 'TH' ? 'เกิดข้อผิดพลาด: ' : 'Error: ') + err.message });
    } finally {
      setIsGateScanning(false);
    }
  };

  // Direct Check-In/Out for Guards from the Pending Requests List
  const handleGateCheckInOutDirectly = async (passId: string, action: 'check-in' | 'check-out') => {
    const token = getAccessToken() || '';
    try {
      setIsGateScanning(true);
      const activeAssignment = loggedInSystemUser ? getGuardAssignment(loggedInSystemUser.username) : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/check-in-out', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: passId.trim().toUpperCase(),
          action: action,
          guardRole: loggedInSystemUser?.role,
          guardName: loggedInSystemUser?.name,
          guardCheckpoint: activeAssignment?.activeCheckpoint,
          guardAllowedAreas: activeAssignment?.allowedAreas,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const updatedStatus = data.status || (action === 'check-in' ? `เช็คอินโดย ${loggedInSystemUser?.name || 'N/A'}` : `เช็คเอาท์โดย ${loggedInSystemUser?.name || 'N/A'}`);
        const updatedTime = data.timestamp || new Date().toISOString();

        setVisitorsList(prev => prev.map(v => {
          if (v.id === data.id) {
            return {
              ...v,
              status: updatedStatus as any,
              lastActivityAt: updatedTime,
            };
          }
          return v;
        }));

        setGateStatusMsg({
          type: 'success',
          text: lang === 'TH'
            ? `ทำรายการ ${action === 'check-in' ? 'เช็คอิน' : 'เช็คเอาท์'} สำเร็จ! ยินดีต้อนรับคุณ ${data.visitorName} (${data.id})`
            : `${action === 'check-in' ? 'Check-In' : 'Check-Out'} successful! Welcome, ${data.visitorName} (${data.id})`
        });
        if (action === 'check-in') {
          showSuccessNotification(
            lang === 'TH' ? '🟢 เช็คอินสำเร็จ!' : '🟢 Check-In Successful!',
            lang === 'TH'
              ? `คุณ ${data.visitorName} (${data.id}) ได้เข้าพื้นที่เรียบร้อยแล้ว`
              : `Visitor ${data.visitorName} (${data.id}) has entered the premises.`
          );
        } else {
          showSuccessNotification(
            lang === 'TH' ? '🔴 เช็คเอาท์สำเร็จ!' : '🔴 Check-Out Successful!',
            lang === 'TH'
              ? `คุณ ${data.visitorName} (${data.id}) ได้ออกจากพื้นที่เรียบร้อยแล้ว`
              : `Visitor ${data.visitorName} (${data.id}) has exited the premises.`
          );
        }
        fetchDashboardData(token);
      } else {
        setGateStatusMsg({ type: 'error', text: data.error || (lang === 'TH' ? 'ทำรายการล้มเหลว' : 'Operation failed') });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGateScanning(false);
    }
  };

  const handleBanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannedVisitorId) return;
    const token = getAccessToken() || '';
    setSubmittingBan(true);
    try {
      const response = await fetch(`/api/visitors/${bannedVisitorId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: banReason }),
      });
      if (response.ok) {
        setBannedVisitorId(null);
        setBanReason('');
        fetchDashboardData(token);
      } else {
        const d = await response.json();
        alert(d.error || (lang === 'TH' ? 'เกิดข้อผิดพลาดในการระงับสิทธิ์' : 'Error banning visitor'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingBan(false);
    }
  };

  const handleSeedMockVisitors = async () => {
    const token = getAccessToken() || '';

    try {
      setSeedingMock(true);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/seed-mock-visitors', {
        method: 'POST',
        headers,
      });

      const data = await response.json();
      if (response.ok) {
        showSuccessNotification(
          lang === 'TH' ? 'จำลองข้อมูลสำเร็จ!' : 'Data Seeded Successfully!',
          data.message || (lang === 'TH' ? 'สร้างข้อมูลจำลองสำเร็จแล้ว!' : 'Mock data has been created successfully.')
        );
        // Refresh dashboard statistics
        fetchDashboardData(token);
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการจำลองข้อมูล');
      }
    } catch (err: any) {
      console.error('Failed to seed mock data:', err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ' + err.message);
    } finally {
      setSeedingMock(false);
    }
  };

  const handleClearMockVisitors = async () => {
    const token = getAccessToken() || '';
    const confirmClear = confirm(lang === 'TH'
      ? 'คุณต้องการลบข้อมูลจำลองทั้งหมดออกจากระบบใช่หรือไม่?'
      : 'Are you sure you want to delete all mock records?');
    if (!confirmClear) return;

    try {
      setClearingMock(true);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/clear-mock-visitors', {
        method: 'POST',
        headers,
      });

      const data = await response.json();
      if (response.ok) {
        showSuccessNotification(
          lang === 'TH' ? 'ลบข้อมูลจำลองสำเร็จ!' : 'Mock Data Cleared!',
          data.message || (lang === 'TH' ? 'ลบข้อมูลจำลองเรียบร้อยแล้ว' : 'Mock data has been cleared.')
        );
        fetchDashboardData(token);
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการลบข้อมูลจำลอง');
      }
    } catch (err: any) {
      console.error('Failed to clear mock data:', err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ' + err.message);
    } finally {
      setClearingMock(false);
    }
  };

  // Send Manual Daily summary email to Security Department
  const handleSendReportEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) {
      alert('⚠️ ไม่สามารถส่งรายงานด่วนได้เนื่องจากไม่ได้เชื่อมต่อบัญชี Google\n\nกรุณาไปที่แผงแอดมิน -> การเชื่อมต่อคลาวด์ เพื่อทำการเข้าสู่ระบบและให้สิทธิ์ Gmail/Sheets API ก่อนใช้งานฟังก์ชันนี้');
      return;
    }

    if (!recipientEmail.trim()) {
      alert(lang === 'TH' ? 'กรุณากรอกอีเมลของแผนกรักษาความปลอดภัย' : 'Please enter the email of the security department');
      return;
    }

    try {
      setSendingReport(true);
      setReportStatus(lang === 'TH' ? 'กำลังจัดทำสรุปสถิติผู้เข้าติดต่อและส่งผ่านระบบเมลของบริษัท...' : 'Compiling visitor statistics summary and sending via corporate mail system...');
      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          recipientEmail,
          ccEmail: emailCcCcInput || emailCcRecipients 
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setReportStatus(lang === 'TH' ? `ส่งอีเมลรายงานเข้า-ออกพื้นที่สรุปเสร็จสมบูรณ์ ไปยัง ${recipientEmail} เรียบร้อยแล้ว!` : `Successfully sent the summarized entry-exit report to ${recipientEmail}!`);
      } else {
        setReportStatus((lang === 'TH' ? 'การส่งล้มเหลว: ' : 'Sending failed: ') + (data.error || (lang === 'TH' ? 'ไม่สามารถติดต่อเซิร์ฟเวอร์เมลได้' : 'Could not contact mail server')));
      }
    } catch (err: any) {
      console.error(err);
      setReportStatus((lang === 'TH' ? 'เกิดข้อผิดพลาดในการส่งรายงาน: ' : 'Error sending report: ') + err.message);
    } finally {
      setSendingReport(false);
    }
  };

  const [emailCcCcInput, setEmailCcCcInput] = useState('');

  // Save Scheduled Email configuration
  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken() || '';

    try {
      setSavingEmailConfig(true);
      const updatedConfig = {
        ...config,
        emailReportConfig: {
          enabled: emailEnabled,
          recipients: emailRecipients,
          ccRecipients: emailCcRecipients,
          sendTime: emailSendTime,
        }
      };

      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...updatedConfig,
          roleMenuPermissions,
          logoBase64: null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setConfig(data);
        showSuccessNotification(
          lang === 'TH' ? 'บันทึกการตั้งค่าสำเร็จ!' : 'Settings Saved!',
          lang === 'TH' 
            ? 'บันทึกการตั้งค่าตารางเวลาและผู้รับรายงานสรุปเรียบร้อยแล้ว!' 
            : 'Schedule and recipient summary configurations have been saved successfully.'
        );
      } else {
        alert(data.error || 'ไม่สามารถบันทึกการตั้งค่าได้');
      }
    } catch (err: any) {
      console.error('Failed to save email config:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message);
    } finally {
      setSavingEmailConfig(false);
    }
  };

  // Pull existing visitors from dashboard statistics to show in Admin user table
  // Filter them based on search queries
  const [visitorSearch, setVisitorSearch] = useState('');
  const [guardSearch, setGuardSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  // Since we save visitors inside sheets, we can extract them from the logs or mockup registered visitors if needed.
  // To keep it 100% accurate, we can extract visitors from Logs or keep a running client-side list.
  // Wait, to populate visitors list nicely, we can extract them from our unique log history names,
  // or we can query our in-memory list which pulls all visitors.
  // Let's mock a beautiful complete table containing current registrations if the Sheets is loaded,
  // or we can dynamically build the unique visitor database from today's active logs.
  // Let's create a beautiful comprehensive list of visitors!

  const uniqueVisitorsFromLogs: Visitor[] = [];
  const addedIds = new Set<string>();

  if (dashboardStats.visitors && dashboardStats.visitors.length > 0) {
    const reversedVisitors = [...dashboardStats.visitors].reverse();
    reversedVisitors.forEach(v => {
      if (v.id && !addedIds.has(v.id)) {
        addedIds.add(v.id);
        uniqueVisitorsFromLogs.push(v);
      }
    });
    uniqueVisitorsFromLogs.reverse(); // Maintain original order initially
  } else {
    // Extract from recent logs to populate visitors table
    const addedPassports = new Set<string>();
    dashboardStats.recentLogs.forEach(log => {
      if (log.visitorId && !addedPassports.has(log.visitorId)) {
        addedPassports.add(log.visitorId);
        // Try to find if currently inside or not based on last action
        const lastAction = dashboardStats.recentLogs.find(l => l.visitorId === log.visitorId)?.action;
        const isInside = lastAction === 'check-in';
        uniqueVisitorsFromLogs.push({
          id: log.visitorId,
          name: log.visitorName,
          passportId: log.visitorId, // we map pass id
          phone: '08X-XXX-XXXX',
          vehiclePlate: log.vehiclePlate,
          address: 'ที่อยู่ตามระบบ',
          company: log.company,
          visitorType: log.visitorType,
          contactArea: log.area,
          photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', // placeholder if not registered
          photoDriveId: '',
          status: isInside ? 'checked-in' : 'checked-out',
          registeredAt: log.timestamp,
        });
      }
    });
  }

  // Strictly sort them by Pass ID descending (e.g., P000008 -> P000007 -> P000006...)
  // This guarantees that the sequence is beautifully sequenced and newly registered passes appear on top
  uniqueVisitorsFromLogs.sort((a, b) => {
    const aMatch = (a.id || '').match(/\d+/);
    const bMatch = (b.id || '').match(/\d+/);
    if (aMatch && bMatch) {
      const aNum = parseInt(aMatch[0], 10);
      const bNum = parseInt(bMatch[0], 10);
      return bNum - aNum;
    }
    return (b.id || '').localeCompare(a.id || '');
  });

  const filteredVisitors = uniqueVisitorsFromLogs.filter(v => 
    (v.name || '').toLowerCase().includes(visitorSearch.toLowerCase()) ||
    (v.id || '').toLowerCase().includes(visitorSearch.toLowerCase()) ||
    (v.company || '').toLowerCase().includes(visitorSearch.toLowerCase())
  );

  const visitorsStartIndex = (visitorsCurrentPage - 1) * visitorsPageSize;
  const paginatedVisitors = filteredVisitors.slice(visitorsStartIndex, visitorsStartIndex + visitorsPageSize);

  const logsStartIndex = (logsCurrentPage - 1) * logsPageSize;
  const paginatedLogs = dashboardStats.recentLogs.slice(logsStartIndex, logsStartIndex + logsPageSize);

  // Paginated/Filtered Guards (Checkpoint Tab)
  const filteredGuards = systemUsers.filter(u => {
    if (!u) return false;
    const roleStr = String(u.role || '');
    const isGuardRole = roleStr.includes('Guard') || roleStr.includes('Staff') || roleStr.includes('Supervisor') || roleStr.includes('Manager');
    if (!isGuardRole) return false;
    const searchLower = guardSearch.toLowerCase();
    return (
      String(u.name || '').toLowerCase().includes(searchLower) ||
      String(u.username || '').toLowerCase().includes(searchLower) ||
      String(u.role || '').toLowerCase().includes(searchLower)
    );
  });

  const checkpointsStartIndex = (checkpointsCurrentPage - 1) * checkpointsPageSize;
  const paginatedGuards = filteredGuards.slice(checkpointsStartIndex, checkpointsStartIndex + checkpointsPageSize);

  // Paginated/Filtered Staff (Visitors Tab secondary section)
  const filteredStaff = systemUsers.filter(u => {
    if (!u) return false;
    const searchLower = staffSearch.toLowerCase();
    return (
      String(u.name || '').toLowerCase().includes(searchLower) ||
      String(u.username || '').toLowerCase().includes(searchLower) ||
      String(u.role || '').toLowerCase().includes(searchLower)
    );
  });

  const staffStartIndex = (staffCurrentPage - 1) * staffPageSize;
  const paginatedStaff = filteredStaff.slice(staffStartIndex, staffStartIndex + staffPageSize);

  return (
    <div className="h-screen max-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-blue-600 selection:text-white overflow-hidden">
      
      {/* Dynamic Entrance Splash Loading Animation */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
            className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-center text-slate-100 select-none overflow-hidden"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center gap-5 p-6"
            >
              {/* Logo / Brand Symbol */}
              {config.logoUrl && !logoError ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border border-slate-800 p-3 flex items-center justify-center shadow-xl">
                  <img 
                    src={config.logoUrl} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-xl">
                  <span className="font-sans font-black text-slate-100 text-xl tracking-wider">MG</span>
                </div>
              )}

              {/* Minimal Loading Indicator */}
              <div className="flex items-center gap-2.5 mt-2">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-sm font-bold tracking-widest text-slate-300 uppercase font-mono">
                  Loading...
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Slide-over Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && loggedInSystemUser && (
          <div className="fixed inset-0 z-50 md:hidden no-print">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Slide-in Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 shadow-2xl p-5 flex flex-col gap-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Menu className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-slate-200 text-sm">
                    {lang === 'TH' ? 'เมนูระบบ' : 'System Navigation'}
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items in Drawer */}
              <div className="flex flex-col gap-2">
                {!!(roleMenuPermissions[loggedInSystemUser?.role]?.register ?? true) && (
                  <button
                    onClick={() => {
                      setActiveTab('register');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`relative flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition cursor-pointer text-left ${
                      activeTab === 'register' 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/60 animate-pulse' 
                        : 'text-blue-200 bg-blue-950/40 border border-blue-500/30 hover:text-white hover:bg-blue-900/40 animate-pulse'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <UserPlus className="w-5 h-5 shrink-0 text-blue-300" />
                      <span className="truncate text-[15px] font-extrabold">{t('tabRegister')}</span>
                    </div>
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  </button>
                )}

                {!!(roleMenuPermissions[loggedInSystemUser?.role]?.gate ?? true) && (
                  <button
                    onClick={() => {
                      setActiveTab('gate');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition cursor-pointer text-left ${
                      activeTab === 'gate' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <QrCode className="w-5 h-5 shrink-0" />
                    <span className="truncate">{t('tabGate')}</span>
                  </button>
                )}

                {!!(roleMenuPermissions[loggedInSystemUser?.role]?.pass ?? true) && (
                  <button
                    onClick={() => {
                      setActiveTab('pass');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition cursor-pointer text-left ${
                      activeTab === 'pass' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-5 h-5 shrink-0" />
                    <span className="truncate">{t('tabPass')}</span>
                  </button>
                )}

                {!!(roleMenuPermissions[loggedInSystemUser?.role]?.admin ?? false) && (
                  <div className="flex flex-col gap-1 w-full mt-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                      }}
                      style={activeTab === 'admin' ? { backgroundColor: '#7f98f7', color: '#0f172a' } : undefined}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition cursor-pointer text-left ${
                        activeTab === 'admin' 
                          ? 'bg-[#7f98f7] text-slate-950 font-extrabold shadow-md' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Shield className={`w-5 h-5 shrink-0 ${activeTab === 'admin' ? 'text-slate-950' : 'text-blue-400'}`} />
                      <span className="truncate">{t('tabAdmin')}</span>
                    </button>

                    <div className="pl-4 border-l border-slate-800 ml-5 flex flex-col gap-1 mt-1">
                      {!!roleMenuPermissions[loggedInSystemUser?.role]?.admin_dashboard && (
                        <button
                          onClick={() => {
                            setAdminTab('dashboard');
                            setActiveTab('admin');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${
                            activeTab === 'admin' && adminTab === 'dashboard' 
                              ? 'bg-blue-600/20 text-[#7f98f7] border border-blue-500/20' 
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          <Activity className="w-4 h-4 shrink-0" />
                          <span className="truncate">{t('adminDashboard')}</span>
                        </button>
                      )}

                      {!!roleMenuPermissions[loggedInSystemUser?.role]?.admin_visitors && (
                        <button
                          onClick={() => {
                            setAdminTab('visitors');
                            setActiveTab('admin');
                            fetchVisitorsList();
                            setIsMobileMenuOpen(false);
                          }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${
                            activeTab === 'admin' && adminTab === 'visitors' 
                              ? 'bg-blue-600/20 text-[#7f98f7] border border-blue-500/20' 
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          <Users className="w-4 h-4 shrink-0" />
                          <span className="truncate">{tText("ข้อมูลผู้ถือใบผ่านล่าสุด", "Visitor Pass Database")}</span>
                        </button>
                      )}

                      {!!(roleMenuPermissions[loggedInSystemUser?.role]?.admin_staff ?? roleMenuPermissions[loggedInSystemUser?.role]?.admin_visitors) && (
                        <button
                          onClick={() => {
                            setAdminTab('staff');
                            setActiveTab('admin');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${
                            activeTab === 'admin' && adminTab === 'staff' 
                              ? 'bg-blue-600/20 text-[#7f98f7] border border-blue-500/20' 
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          <User className="w-4 h-4 shrink-0" />
                          <span className="truncate">{tText("บัญชีเจ้าหน้าที่ระบบ", "Staff Accounts")}</span>
                        </button>
                      )}

                      {!!(roleMenuPermissions[loggedInSystemUser?.role]?.admin_online ?? true) && (
                        <button
                          onClick={() => {
                            setAdminTab('online');
                            setActiveTab('admin');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            activeTab === 'admin' && adminTab === 'online' 
                              ? 'bg-blue-600/20 text-[#7f98f7] border border-blue-500/20' 
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Wifi className="w-4 h-4 shrink-0 text-emerald-400 animate-pulse" />
                            <span className="truncate">{tText("สถานะผู้ใช้งานออนไลน์", "Online Users")}</span>
                          </div>
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                            {onlineUsersCount}
                          </span>
                        </button>
                      )}

                      {!!roleMenuPermissions[loggedInSystemUser?.role]?.admin_checkpoints && (
                        <button
                          onClick={() => {
                            setAdminTab('checkpoints');
                            setActiveTab('admin');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${
                            activeTab === 'admin' && adminTab === 'checkpoints' 
                              ? 'bg-blue-600/20 text-[#7f98f7] border border-blue-500/20' 
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{t('adminCheckpoints')}</span>
                        </button>
                      )}

                      {!!roleMenuPermissions[loggedInSystemUser?.role]?.admin_config && (
                        <button
                          onClick={() => {
                            setAdminTab('config');
                            setActiveTab('admin');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${
                            activeTab === 'admin' && adminTab === 'config' 
                              ? 'bg-blue-600/20 text-[#7f98f7] border border-blue-500/20' 
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          <Sliders className="w-4 h-4 shrink-0" />
                          <span className="truncate">{t('adminConfig')}</span>
                        </button>
                      )}

                      {!!roleMenuPermissions[loggedInSystemUser?.role]?.admin_permissions && (
                        <button
                          onClick={() => {
                            setAdminTab('permissions');
                            setActiveTab('admin');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${
                            activeTab === 'admin' && adminTab === 'permissions' 
                              ? 'bg-blue-600/20 text-[#7f98f7] border border-blue-500/20' 
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          <Key className="w-4 h-4 shrink-0" />
                          <span className="truncate">{t('adminPermissions')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Logout Button at bottom of Mobile Drawer */}
              {loggedInSystemUser && (
                <div className="pt-4 mt-auto border-t border-slate-800/80 w-full">
                  <button
                    onClick={() => {
                      setLoggedInSystemUser(null);
                      setIsAdminLoggedIn(false);
                      setActiveTab('gate');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer text-left w-full shadow-sm"
                    title={t('logout')}
                  >
                    <LogOut className="w-5 h-5 shrink-0 text-rose-400" />
                    <span className="truncate">{tText("ออกจากระบบ", "Log Out")}</span>
                  </button>
                </div>
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* 1. Header Banner */}
      <header className="no-print bg-slate-900 border-b border-slate-800 shadow-md shrink-0 z-40">
        <div className="w-full px-3 md:px-5 py-2 flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Clickable Logo & Brand Header Button to Toggle Sidebar */}
            {loggedInSystemUser ? (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }}
                className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none transition-all p-1 -ml-1 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60"
                title={lang === 'TH' ? (isSidebarCollapsed ? 'คลิกโลโก้เพื่อแสดงเมนูระบบ' : 'คลิกโลโก้เพื่อซ่อนเมนูระบบ') : (isSidebarCollapsed ? 'Click logo to show menu' : 'Click logo to hide menu')}
              >
                <div className="relative shrink-0">
                  {config.logoUrl && !logoError ? (
                    <img 
                      src={config.logoUrl} 
                      alt="Logo" 
                      className="w-9 h-9 object-contain rounded-lg p-0.5 border border-white/60 text-white transition-transform duration-200 group-hover:scale-105 group-active:scale-95 shadow-sm" 
                      style={{ backgroundColor: '#f7f2f2' }} 
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-slate-900 font-black text-xs md:text-sm shadow border border-white transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
                      MG
                    </div>
                  )}
                  {/* Subtle menu icon overlay badge on logo */}
                  <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 shadow-md border border-slate-900 group-hover:bg-blue-500 transition-colors">
                    <Menu className="w-2.5 h-2.5" />
                  </span>
                </div>

                <div className="min-w-0">
                  <h1 className="text-xs md:text-sm font-black tracking-wider uppercase text-slate-100 group-hover:text-blue-300 transition-colors max-w-[180px] sm:max-w-none truncate">
                    {config.organizationName ? config.organizationName.replace(/\s*\([^)]*\)/g, '').trim() : ''}
                  </h1>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                {config.logoUrl && !logoError ? (
                  <img 
                    src={config.logoUrl} 
                    alt="Logo" 
                    className="w-9 h-9 object-contain rounded-lg p-0.5 border border-white/60 text-white shrink-0" 
                    style={{ backgroundColor: '#f7f2f2' }} 
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-slate-900 font-black text-xs md:text-sm shadow border border-white shrink-0">
                    MG
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-xs md:text-sm font-black tracking-wider uppercase text-slate-100 max-w-[180px] sm:max-w-none truncate">
                    {config.organizationName ? config.organizationName.replace(/\s*\([^)]*\)/g, '').trim() : ''}
                  </h1>
                </div>
              </div>
            )}
          </div>

          {/* User profile & Controls */}
          <div className="flex items-center gap-1.5 md:gap-2 justify-end shrink-0">
            
            {/* PWA Install Button */}
            {showInstallBtn && (
              <button
                onClick={triggerInstall}
                className="h-8 flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-[10px] md:text-xs px-2.5 rounded-lg border border-blue-500/30 shadow transition-all cursor-pointer uppercase tracking-wider animate-pulse no-print shrink-0"
                title={lang === 'TH' ? 'ติดตั้งแอปบนอุปกรณ์' : 'Install App on Device'}
              >
                <Smartphone className="w-3.5 h-3.5 shrink-0 text-blue-200" />
                <span className="inline-block whitespace-nowrap">{lang === 'TH' ? 'ติดตั้งแอป' : 'Install App'}</span>
              </button>
            )}

            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer border no-print shrink-0 bg-slate-950/60 text-slate-300 border-slate-800/80 hover:bg-slate-800 hover:text-white"
              title={isFullscreen ? (lang === 'TH' ? 'ออกจากโหมดเต็มจอ' : 'Exit Fullscreen') : (lang === 'TH' ? 'เข้าโหมดเต็มจอ' : 'Enter Full Screen')}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Language Toggle Button */}
            <div className="h-8 flex items-center gap-0.5 bg-slate-950/60 border border-slate-800/80 p-0.5 rounded-lg shrink-0 no-print">
              <button
                onClick={() => {
                  setLang('TH');
                  localStorage.setItem('appLanguage', 'TH');
                }}
                className={`h-full px-2 rounded text-[10px] font-black transition-all cursor-pointer flex items-center justify-center ${
                  lang === 'TH'
                    ? 'bg-[#7f98f7] text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                TH
              </button>
              <button
                onClick={() => {
                  setLang('EN');
                  localStorage.setItem('appLanguage', 'EN');
                }}
                className={`h-full px-2 rounded text-[10px] font-black transition-all cursor-pointer flex items-center justify-center ${
                  lang === 'EN'
                    ? 'bg-[#7f98f7] text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
            </div>

            {/* Profile Widget */}
            {loggedInSystemUser && (
              <div className="h-8 flex items-center gap-1.5 md:gap-2 bg-slate-950/60 border border-slate-800/80 px-1.5 md:px-2.5 rounded-lg text-left shadow-inner shrink-0">
                <button 
                  onClick={openProfileEdit}
                  className="w-6 h-6 rounded-md bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold overflow-hidden hover:opacity-85 transition cursor-pointer shrink-0 text-xs"
                  title={t('editProfile')}
                >
                  {loggedInSystemUser.avatar ? (
                    <img src={loggedInSystemUser.avatar} className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    loggedInSystemUser.name.charAt(0).toUpperCase()
                  )}
                </button>
                <div onClick={openProfileEdit} className="cursor-pointer hover:opacity-80 transition hidden lg:block max-w-[120px] truncate leading-none">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    {loggedInSystemUser.role}
                  </div>
                  <div className="text-xs font-black text-slate-200 truncate mt-0.5">{loggedInSystemUser.name}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Primary Tabs Navigation & Content */}
      {loggedInSystemUser === null ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/5">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-base font-extrabold text-slate-100">{tText(tText("เข้าสู่ระบบรักษาความปลอดภัย", "Security Portal Access"), "Security Portal Access")}</h2>
              <p className="text-xs text-slate-400">{tText(tText("กรุณาเข้าสู่ระบบด้วยบัญชีระบบเพื่อเริ่มใช้งาน", "Please log in with system credentials to activate security checkpoint tools"), "Please log in with system credentials to activate security checkpoint tools")}</p>
            </div>

            {/* Admin/Local Login Form */}
            <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Username</label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder={tText(tText("ป้อนชื่อผู้ใช้งาน (เช่น Adminmaingate)", "Enter username"), "Enter username")}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder={tText(tText("ป้อนรหัสผ่าน", "Enter password"), "Enter password")}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              {adminError && (
                <div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/15 p-2.5 rounded-lg text-center font-semibold">
                  {adminError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition duration-150 cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" /> ลงชื่อเข้าใช้งานบัญชีระบบ
              </button>
            </form>
          </div>
        </main>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row w-full items-stretch min-h-0 overflow-hidden">
          {/* 2. Primary Left Sidebar Navigation */}
          <nav 
            className={`no-print hidden md:flex flex-col bg-slate-900/50 border-r border-slate-800/80 shrink-0 transition-all duration-300 z-30 h-full overflow-x-hidden ${
              isSidebarCollapsed 
                ? 'w-0 p-0 border-r-0 opacity-0 overflow-hidden pointer-events-none' 
                : 'w-72 p-4 opacity-100'
            }`}
          >
            <div className="flex flex-col gap-2 w-full overflow-y-auto overflow-x-hidden flex-1 pr-1 custom-scrollbar">
              {/* Navigation Section Title */}
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400/80 px-3 py-1 mb-1">
                {lang === 'TH' ? 'เมนูระบบ' : 'Navigation'}
              </div>

              {/* Navigation Items */}
              {!!(roleMenuPermissions[loggedInSystemUser?.role]?.register ?? true) && (
                <button
                  onClick={() => setActiveTab('register')}
                  title={t('tabRegister')}
                  className={`relative flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer text-left w-full ${
                    activeTab === 'register' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/60 animate-pulse' 
                      : 'text-blue-200 bg-blue-950/40 border border-blue-500/30 hover:bg-blue-900/40 hover:text-white animate-pulse'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <UserPlus className="w-5 h-5 shrink-0 text-blue-300" />
                    <span className="truncate text-[15px] font-extrabold leading-[20px]">{t('tabRegister')}</span>
                  </div>
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </button>
              )}

              {!!(roleMenuPermissions[loggedInSystemUser?.role]?.gate ?? true) && (
                <button
                  onClick={() => setActiveTab('gate')}
                  title={t('tabGate')}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold tracking-wide transition duration-150 cursor-pointer text-left w-full ${
                    activeTab === 'gate' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`}
                >
                  <QrCode className="w-5 h-5 shrink-0" />
                  <span className="truncate text-[15px] font-normal leading-[20px]">{t('tabGate')}</span>
                </button>
              )}

              {!!(roleMenuPermissions[loggedInSystemUser?.role]?.pass ?? true) && (
                <button
                  onClick={() => setActiveTab('pass')}
                  title={t('tabPass')}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold tracking-wide transition duration-150 cursor-pointer text-left w-full ${
                    activeTab === 'pass' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : `text-slate-400 hover:text-slate-100 hover:bg-slate-800 ${newPass ? 'animate-pulse text-blue-400' : ''}`
                  }`}
                >
                  <FileText className="w-5 h-5 shrink-0" />
                  <span className="truncate text-[15px] font-normal leading-[20px]">{t('tabPass')}</span>
                </button>
              )}

              {!!(roleMenuPermissions[loggedInSystemUser?.role]?.admin ?? false) && (
                <div className="flex flex-col gap-1 w-full">
                  <button
                    onClick={() => setActiveTab('admin')}
                    title={t('tabAdmin')}
                    style={activeTab === 'admin' ? { backgroundColor: '#7f98f7', color: '#0f172a' } : undefined}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold tracking-wide transition duration-150 cursor-pointer text-left w-full ${
                      activeTab === 'admin' 
                        ? 'bg-[#7f98f7] text-slate-950 font-extrabold shadow-md' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <Shield className={`w-5 h-5 shrink-0 ${activeTab === 'admin' ? 'text-slate-950' : 'text-blue-400'}`} />
                    <span className="truncate text-[15px] font-extrabold leading-[20px]">{t('tabAdmin')}</span>
                  </button>

                  {activeTab === 'admin' && (
                    <div className="pl-3 border-l border-slate-800 ml-4 flex flex-col gap-1 mt-1.5 w-full">
                      {!!roleMenuPermissions[loggedInSystemUser?.role]?.admin_dashboard && (
                        <button
                          onClick={() => setAdminTab('dashboard')}
                          title={t('adminDashboard')}
                          style={{ height: '30px', width: '220px' }}
                          className={`flex items-center gap-2 px-3 rounded-xl text-[11px] font-bold text-left transition cursor-pointer max-w-full ${
                            adminTab === 'dashboard' 
                              ? 'bg-blue-600/10 text-[#7f98f7] border border-blue-500/15 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          <Activity className="w-4 h-4 shrink-0" />
                          <span className="truncate">{t('adminDashboard')}</span>
                        </button>
                      )}

                      {!!roleMenuPermissions[loggedInSystemUser?.role]?.admin_visitors && (
                        <button
                          onClick={() => {
                            setAdminTab('visitors');
                            fetchVisitorsList();
                          }}
                          title={tText("ข้อมูลผู้ถือใบผ่านล่าสุด", "Visitor Pass Database")}
                          style={{ height: '30px', width: '220px' }}
                          className={`flex items-center gap-2 px-3 rounded-xl text-[11px] font-bold text-left transition cursor-pointer max-w-full ${
                            adminTab === 'visitors' 
                              ? 'bg-blue-600/10 text-[#7f98f7] border border-blue-500/15 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          <Users className="w-4 h-4 shrink-0" />
                          <span className="truncate">{tText("ข้อมูลผู้ถือใบผ่านล่าสุด", "Visitor Pass Database")}</span>
                        </button>
                      )}

                      {!!(roleMenuPermissions[loggedInSystemUser?.role]?.admin_staff ?? roleMenuPermissions[loggedInSystemUser?.role]?.admin_visitors) && (
                        <button
                          onClick={() => {
                            setAdminTab('staff');
                          }}
                          title={tText("บัญชีเจ้าหน้าที่ระบบ", "Staff Accounts")}
                          style={{ height: '30px', width: '220px' }}
                          className={`flex items-center gap-2 px-3 rounded-xl text-[11px] font-bold text-left transition cursor-pointer max-w-full ${
                            adminTab === 'staff' 
                              ? 'bg-blue-600/10 text-[#7f98f7] border border-blue-500/15 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          <User className="w-4 h-4 shrink-0" />
                          <span className="truncate">{tText("บัญชีเจ้าหน้าที่ระบบ", "Staff Accounts")}</span>
                        </button>
                      )}

                      {!!(roleMenuPermissions[loggedInSystemUser?.role]?.admin_online ?? true) && (
                        <button
                          onClick={() => setAdminTab('online')}
                          title={tText("สถานะผู้ใช้งานออนไลน์", "Online Users Status")}
                          style={{ height: '30px', width: '220px' }}
                          className={`flex items-center justify-between px-3 rounded-xl text-[11px] font-bold transition cursor-pointer max-w-full ${
                            adminTab === 'online' 
                              ? 'bg-blue-600/10 text-[#7f98f7] border border-blue-500/15 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Wifi className="w-4 h-4 shrink-0 text-emerald-400 animate-pulse" />
                            <span className="truncate">{tText("สถานะผู้ใช้งานออนไลน์", "Online Users")}</span>
                          </div>
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                            {onlineUsersCount}
                          </span>
                        </button>
                      )}

                      {!!roleMenuPermissions[loggedInSystemUser?.role]?.admin_checkpoints && (
                        <button
                          onClick={() => setAdminTab('checkpoints')}
                          title={t('adminCheckpoints')}
                          style={{ height: '30px', width: '220px' }}
                          className={`flex items-center gap-2 px-3 rounded-xl text-[11px] font-bold text-left transition cursor-pointer max-w-full ${
                            adminTab === 'checkpoints' 
                              ? 'bg-blue-600/10 text-[#7f98f7] border border-blue-500/15 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{t('adminCheckpoints')}</span>
                        </button>
                      )}

                      {!!roleMenuPermissions[loggedInSystemUser?.role]?.admin_config && (
                        <button
                          onClick={() => setAdminTab('config')}
                          title={t('adminConfig')}
                          style={{ height: '30px', width: '220px' }}
                          className={`flex items-center gap-2 px-3 rounded-xl text-[11px] font-bold text-left transition cursor-pointer max-w-full ${
                            adminTab === 'config' 
                              ? 'bg-blue-600/10 text-[#7f98f7] border border-blue-500/15 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          <Sliders className="w-4 h-4 shrink-0" />
                          <span className="truncate">{t('adminConfig')}</span>
                        </button>
                      )}

                      {!!roleMenuPermissions[loggedInSystemUser?.role]?.admin_permissions && (
                        <button
                          onClick={() => setAdminTab('permissions')}
                          title={t('adminPermissions')}
                          style={{ height: '30px', width: '220px' }}
                          className={`flex items-center gap-2 px-3 rounded-xl text-[11px] font-bold text-left transition cursor-pointer max-w-full ${
                            adminTab === 'permissions' 
                              ? 'bg-blue-600/10 text-[#7f98f7] border border-blue-500/15 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          <Key className="w-4 h-4 shrink-0" />
                          <span className="truncate">{t('adminPermissions')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Connect for Cloud Integration (only shown on desktop/sidebar when system user is logged in) */}
            {loggedInSystemUser && config.googleAuthType !== 'apps_script' && (
              <div className="hidden md:flex border-t border-slate-800/80 pt-3 mt-auto flex-col gap-2 w-full animate-fadeIn shrink-0">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 px-3">Google Workspace Cloud Connect</span>
                {dbConnected ? (
                  <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex flex-col gap-2 shadow-inner">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wide">{tText(tText("เชื่อมต่อคลาวด์แล้ว", "Cloud Connection Enabled"), "Cloud Connection Enabled")}</span>
                      </div>
                      {tokenExpiry && (
                        <span className="text-[9px] font-mono text-emerald-400 font-semibold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/30">
                          {tokenExpiry.formattedTime}
                        </span>
                      )}
                    </div>

                    {/* Session Progress Bar */}
                    {tokenExpiry && (
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                          <span>{tText(tText("ระยะเวลาสิทธิ์เชื่อมต่อ", "Session Token Lifespan"), "Session Token Lifespan")}</span>
                          <span className={tokenExpiry.percent < 20 ? 'text-rose-400' : tokenExpiry.percent < 50 ? 'text-amber-400' : 'text-emerald-400'}>
                            {Math.round(tokenExpiry.percent)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className={`h-full transition-all duration-1000 rounded-full ${
                              tokenExpiry.percent > 50 
                                ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' 
                                : tokenExpiry.percent > 20 
                                  ? 'bg-gradient-to-r from-amber-600 to-amber-400 animate-pulse' 
                                  : 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse'
                            }`}
                            style={{ width: `${tokenExpiry.percent}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-slate-500 leading-tight">
                          * มาตรฐาน Google กำหนดอายุเซสชัน 1 ชม. เพื่อความปลอดภัย
                        </span>
                      </div>
                    )}

                    <span className="text-[9px] font-medium text-slate-400 truncate block mt-0.5">เมลแอดมิน: {googleUser?.email || tText(tText("เชื่อมต่อสำเร็จ", "Connected Successfully"), "Connected Successfully")}</span>
                    
                    <div className="flex items-center justify-between mt-1.5 border-t border-slate-800/80 pt-2 gap-2">
                      <button
                        onClick={handleGoogleConnect}
                        title={tText(tText("ต่ออายุสิทธิ์ใหม่ (รีเฟรช 1 ชม.)", "Renew Token"), "Renew Token")}
                        className="text-[9.5px] font-black text-blue-400 hover:text-blue-300 transition cursor-pointer flex items-center gap-0.5"
                      >
                        ⚡ ต่ออายุสิทธิ์
                      </button>
                      <button
                        onClick={handleGoogleDisconnect}
                        className="text-[9.5px] font-bold text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      >
                        ยกเลิกผูกสิทธิ์
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleConnect}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider shadow cursor-pointer transition"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    เชื่อมต่อ Google Sheet & Drive
                  </button>
                )}
              </div>
            )}

            {/* Logout Button at bottom of Sidebar Navigation */}
            {loggedInSystemUser && (
              <div className="pt-2.5 mt-auto border-t border-slate-800/80 w-full shrink-0">
                <button
                  onClick={() => {
                    setLoggedInSystemUser(null);
                    setIsAdminLoggedIn(false);
                    setActiveTab('gate');
                  }}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer text-left w-full shadow-sm"
                  title={t('logout')}
                >
                  <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="truncate">{tText("ออกจากระบบ", "Log Out")}</span>
                </button>
              </div>
            )}
          </nav>



          {/* 3. Main Views Container */}
          <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto h-full custom-scrollbar min-w-0">
        
        {/* System Status Alert Banner */}
        {systemStatus !== 'ready' && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 shadow-lg ${
            systemStatus === 'maintenance'
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="font-extrabold text-sm flex items-center gap-2">
                {systemStatus === 'maintenance' ? t('maintenanceTitle') : t('offlineTitle')}
              </h4>
              <p className="text-xs mt-1 opacity-80 leading-relaxed">
                {systemStatus === 'maintenance' ? t('maintenanceDesc') : t('offlineDesc')}
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* TAB 1: GATE CONTROL */}
          {activeTab === 'gate' && !!(roleMenuPermissions[loggedInSystemUser?.role]?.gate ?? true) && (
            <motion.div
              key="gate-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6 max-w-2xl mx-auto"
            >
              {/* Informative DB Status Card */}
              {!dbConnected && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-slate-300 p-4 rounded-2xl flex items-start gap-3">
                  <Database className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="font-extrabold text-sm text-emerald-400 flex items-center gap-1.5">
                      ระบบทำงานในโหมด "ฐานข้อมูลความเร็วสูง" (Local Server Active)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">{tText(tText("ท่านสามารถลงทะเบียน พิมพ์ใบผ่าน และบันทึกเวลา เข้า-ออก ประมวลผลบนเซิร์ฟเวอร์หลักได้อย่างสมบูรณ์ โดยไม่จำเป็นต้องเชื่อมต่อ Google Sheets ตลอดเวลา", "You can fully register, print, and check-in/out locally on the server without active sheets connection."), "You can fully register, print, and check-in/out locally on the server without active sheets connection.")}</p>
                  </div>
                </div>
              )}

              {/* Check In / Out Control */}
              {true && (
                scannedOrSearchedVisitor ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between animate-[fadeIn_0.2s_ease-out]">
                    <div>
                      {/* Header bar with Back button */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setScannedOrSearchedVisitor(null);
                              setGateIdInput('');
                              setGateStatusMsg(null);
                            }}
                            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition cursor-pointer"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <span className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">
                            {lang === 'TH' ? tText(tText("ข้อมูลบัตรผ่านทาง", "Pass Identity details"), "Pass Identity details") : 'Pass Identity'}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full font-extrabold">
                          {scannedOrSearchedVisitor.id}
                        </span>
                      </div>

                      {/* Visitor Core Profile (Photo & Complete Identity Details) */}
                      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 mb-5 flex flex-col gap-5">
                        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                          {/* Photo Section */}
                          <div 
                            onClick={() => {
                              const displayUrl = getDisplayPhotoUrl(scannedOrSearchedVisitor.photoUrl);
                              if (displayUrl) {
                                setExpandedImage({
                                  url: displayUrl,
                                  title: `รูปถ่ายผู้ผ่านทาง: ${scannedOrSearchedVisitor.name || scannedOrSearchedVisitor.id}`
                                });
                              }
                            }}
                            className={`relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-lg ${
                              scannedOrSearchedVisitor.photoUrl ? 'cursor-pointer hover:border-blue-400/80 group transition-all' : ''
                            }`}
                            title={scannedOrSearchedVisitor.photoUrl ? "คลิกเพื่อขยายรูปถ่าย" : undefined}
                          >
                            {scannedOrSearchedVisitor.photoUrl ? (
                              <>
                                <img
                                  src={getDisplayPhotoUrl(scannedOrSearchedVisitor.photoUrl)}
                                  alt="Visitor"
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                                  }}
                                />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white font-extrabold text-[10px]">
                                  <Maximize2 className="w-5 h-5 text-white drop-shadow" />
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-600">
                                <User className="w-12 h-12" />
                              </div>
                            )}
                            {/* Visitor Type mini badge */}
                            <span className="absolute bottom-1 left-1 right-1 text-center bg-slate-900/95 border border-slate-800 text-[9px] font-black text-[#7f98f7] rounded py-0.5 uppercase tracking-wide truncate">
                              {scannedOrSearchedVisitor.visitorType || tText(tText("ผู้ผ่านทาง", "Visitor"), "Visitor")}
                            </span>
                          </div>

                          {/* Info Header */}
                          <div className="flex-1 text-center sm:text-left">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                              <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 font-mono">
                                PASS: {scannedOrSearchedVisitor.id}
                              </span>
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                {scannedOrSearchedVisitor.visitorType || 'ผู้ผ่านทาง'}
                              </span>
                            </div>
                            <h3 className="text-xl font-black text-slate-100 mb-1">
                              {scannedOrSearchedVisitor.name}
                            </h3>
                            <p className="text-xs text-slate-400">
                              {scannedOrSearchedVisitor.company ? `สังกัด/บริษัท: ${scannedOrSearchedVisitor.company}` : 'ไม่ระบุสังกัดบริษัท'}
                            </p>
                          </div>
                        </div>

                        {/* All Visitor Information Grid (แสดงข้อมูลทั้งหมด พร้อมปุ่ม ซ่อน/แสดงข้อมูล) */}
                        <div className="border-t border-slate-800/80 pt-4">
                          <div className="flex items-center justify-between mb-3 gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              📋 {tText("ข้อมูลผู้ผ่านทางทั้งหมด", "Complete Pass & Visitor Information")}
                            </span>
                            <button
                              type="button"
                              onClick={() => setHideVisitorDetails(!hideVisitorDetails)}
                              className="text-[11px] font-extrabold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/30 px-3 py-1 rounded-lg border border-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                              title={hideVisitorDetails ? 'แสดงรายละเอียดเพิ่มเติม' : 'ซ่อนรายละเอียด'}
                            >
                              {hideVisitorDetails ? (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                  <span>{tText("แสดงข้อมูลรายละเอียด", "Show Details")}</span>
                                </>
                              ) : (
                                <>
                                  <ChevronUp className="w-3.5 h-3.5" />
                                  <span>{tText("ซ่อนข้อมูล", "Hide Details")}</span>
                                </>
                              )}
                            </button>
                          </div>

                          {!hideVisitorDetails && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800/60 text-xs animate-in fade-in duration-200">
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">ชื่อ-นามสกุล</span>
                                <span className="text-slate-200 font-extrabold block truncate">{scannedOrSearchedVisitor.name || '-'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">เลขบัตรประชาชน / Passport</span>
                                <span className="text-slate-200 font-mono font-bold block truncate">{scannedOrSearchedVisitor.passportId || '-'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">เบอร์โทรศัพท์</span>
                                <span className="text-slate-200 font-bold block truncate">{scannedOrSearchedVisitor.phone || '-'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">ประเภทผู้ติดต่อ</span>
                                <span className="text-amber-400 font-extrabold block truncate">{scannedOrSearchedVisitor.visitorType || '-'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">สังกัด / บริษัท</span>
                                <span className="text-slate-200 font-bold block truncate">{scannedOrSearchedVisitor.company || '-'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">ทะเบียนรถ</span>
                                <span className="text-slate-200 font-mono font-bold block truncate">{scannedOrSearchedVisitor.vehiclePlate || '-'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">พื้นที่เข้าติดต่อ</span>
                                <span className="text-[#7f98f7] font-extrabold block truncate">{scannedOrSearchedVisitor.contactArea || '-'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">ที่อยู่ติดต่อ</span>
                                <span className="text-slate-300 font-medium block truncate" title={scannedOrSearchedVisitor.address}>{scannedOrSearchedVisitor.address || '-'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">ผู้ออกใบผ่าน</span>
                                <span className="text-amber-400 font-extrabold block truncate">{scannedOrSearchedVisitor.registeredBy || 'ระบบอัตโนมัติ'}</span>
                              </div>
                              {scannedOrSearchedVisitor.gender && (
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">เพศ</span>
                                  <span className="text-slate-200 font-bold block truncate">{scannedOrSearchedVisitor.gender}</span>
                                </div>
                              )}
                              {scannedOrSearchedVisitor.nationality && (
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">สัญชาติ</span>
                                  <span className="text-slate-200 font-bold block truncate">{scannedOrSearchedVisitor.nationality}</span>
                                </div>
                              )}
                              {scannedOrSearchedVisitor.dob && (
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">วันเกิด / อายุ</span>
                                  <span className="text-slate-200 font-bold block truncate">
                                    {scannedOrSearchedVisitor.dob} {scannedOrSearchedVisitor.age ? `(${scannedOrSearchedVisitor.age} ปี)` : ''}
                                  </span>
                                </div>
                              )}
                              {scannedOrSearchedVisitor.passportNumber && (
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">เลขพาสปอร์ต (Passport)</span>
                                  <span className="text-amber-300 font-mono font-bold block truncate">{scannedOrSearchedVisitor.passportNumber}</span>
                                </div>
                              )}
                              {scannedOrSearchedVisitor.passportExpiryDate && (
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">วันหมดอายุพาสปอร์ต</span>
                                  <span className={`font-mono font-bold block truncate ${checkWorkPermitExpired(scannedOrSearchedVisitor.passportExpiryDate) ? 'text-rose-400' : 'text-slate-200'}`}>
                                    {scannedOrSearchedVisitor.passportExpiryDate} {checkWorkPermitExpired(scannedOrSearchedVisitor.passportExpiryDate) ? '⛔ หมดอายุ' : ''}
                                  </span>
                                </div>
                              )}
                              {scannedOrSearchedVisitor.workPermitNumber && (
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">เลข Work Permit</span>
                                  <span className="text-blue-300 font-mono font-bold block truncate">{scannedOrSearchedVisitor.workPermitNumber}</span>
                                </div>
                              )}
                              {scannedOrSearchedVisitor.workPermitExpiryDate && (
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">วันหมดอายุ Work Permit</span>
                                  <span className={`font-mono font-bold block truncate ${checkWorkPermitExpired(scannedOrSearchedVisitor.workPermitExpiryDate) ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {scannedOrSearchedVisitor.workPermitExpiryDate} {checkWorkPermitExpired(scannedOrSearchedVisitor.workPermitExpiryDate) ? '⛔ หมดอายุ' : '✅ ปกติ'}
                                  </span>
                                </div>
                              )}
                              <div className="sm:col-span-2 md:col-span-3 border-t border-slate-800/60 pt-2.5 mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                <span className="text-slate-400 font-bold">📅 วันที่-เวลาออกใบผ่านลงทะเบียน:</span>
                                <span className="text-slate-200 font-mono font-bold">
                                  {scannedOrSearchedVisitor.registeredAt ? new Date(scannedOrSearchedVisitor.registeredAt).toLocaleString('th-TH') : '-'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status indicator & Time/Duration summary banner for this visit round */}
                      <div className="mb-6">
                        {(() => {
                          const durationInfo = getVisitorDurationInfo(
                            scannedOrSearchedVisitor.id, 
                            scannedOrSearchedVisitor.status, 
                            scannedOrSearchedVisitor.lastActivityAt
                          );

                          const vLogs = dashboardStats.recentLogs.filter(
                            l => l.visitorId === scannedOrSearchedVisitor.id
                          );
                          const checkInLog = vLogs.find(l => l.action === 'check-in');
                          const checkOutLog = vLogs.find(l => l.action === 'check-out');

                          const formatDateTime = (isoString?: string) => {
                            if (!isoString) return null;
                            try {
                              const d = new Date(isoString);
                              if (isNaN(d.getTime())) return null;
                              return d.toLocaleString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              }) + ' น.';
                            } catch {
                              return null;
                            }
                          };

                          const checkInTimeFormatted = formatDateTime(durationInfo.checkInTime) || 
                            formatDateTime(checkInLog?.timestamp) || 
                            (scannedOrSearchedVisitor.status?.includes('เช็คอิน') ? formatDateTime(scannedOrSearchedVisitor.lastActivityAt) : null);

                          const checkOutTimeFormatted = formatDateTime(durationInfo.checkOutTime) || 
                            formatDateTime(checkOutLog?.timestamp) || 
                            (scannedOrSearchedVisitor.status?.includes('เช็คเอาท์') ? formatDateTime(scannedOrSearchedVisitor.lastActivityAt) : null);

                          if (scannedOrSearchedVisitor.status === 'banned') {
                            return (
                              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3">
                                <Ban className="w-5 h-5 shrink-0 mt-0.5 text-rose-500 animate-pulse" />
                                <div>
                                  <h4 className="font-extrabold text-sm uppercase">{tText(tText("พบบุคคลบัญชีดำ", "BLACKLISTED PROFILE IDENTIFIED"), "BLACKLISTED PROFILE IDENTIFIED")}</h4>
                                  <p className="text-xs text-rose-400/80 mt-1 leading-relaxed">
                                    บุคคลนี้ถูกระงับสิทธิ์การเข้าพื้นที่เด็ดขาด! เหตุผล: {scannedOrSearchedVisitor.banReason || tText(tText("ผิดกฎระเบียบความปลอดภัย", "Violating safety and security regulations"), "Violating safety and security regulations")}
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          const isCheckedIn = scannedOrSearchedVisitor.status && (
                            scannedOrSearchedVisitor.status.startsWith(tText(tText("เช็คอิน", "Check-In"), "Check-In")) || 
                            scannedOrSearchedVisitor.status === 'checked-in' ||
                            scannedOrSearchedVisitor.status.includes('เช็คอิน')
                          );

                          const isCheckedOut = scannedOrSearchedVisitor.status && (
                            scannedOrSearchedVisitor.status === 'checked-out' || 
                            scannedOrSearchedVisitor.status.startsWith(tText(tText("เช็คเอาท์", "Check-Out"), "Check-Out")) ||
                            scannedOrSearchedVisitor.status.includes('เช็คเอาท์')
                          );

                          return (
                            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
                              {/* Status Badge Line */}
                              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                                <div className="flex items-center gap-2">
                                  {isCheckedIn ? (
                                    <span className="flex h-3 w-3 relative">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                    </span>
                                  ) : isCheckedOut ? (
                                    <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                                  ) : (
                                    <span className="h-3 w-3 rounded-full bg-slate-500"></span>
                                  )}
                                  <span className="font-extrabold text-sm uppercase text-slate-200">
                                    {isCheckedIn 
                                      ? tText("สถานะ: อยู่ภายในพื้นที่ (Checked-In)", "Status: Inside Area") 
                                      : isCheckedOut 
                                      ? tText("สถานะ: เช็คเอาท์ออกพื้นที่เรียบร้อยแล้ว", "Status: Checked Out") 
                                      : tText("สถานะ: ยังไม่ได้เช็คอิน (อยู่ภายนอกพื้นที่)", "Status: Outside Area")}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {scannedOrSearchedVisitor.status || 'พร้อมเช็คอิน'}
                                </span>
                              </div>

                              {/* Timestamps & Area Duration Table */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                {/* Check-In Time */}
                                <div className="bg-white border border-emerald-400/80 p-3 rounded-xl flex flex-col justify-between gap-1 shadow-sm">
                                  <span className="text-[10px] font-black text-[#00d86e] uppercase tracking-wider flex items-center gap-1">
                                    <LogIn className="w-3.5 h-3.5 text-[#00d86e]" />
                                    {tText("เวลาเช็คอินเข้าพื้นที่", "Check-In Time")}
                                  </span>
                                  <span className="font-mono font-black text-[#00d86e] text-xs mt-1">
                                    {checkInTimeFormatted || (isCheckedIn ? 'บันทึกแล้ว' : 'ยังไม่ได้เช็คอิน')}
                                  </span>
                                </div>

                                {/* Check-Out Time */}
                                <div className="bg-white border border-amber-400/80 p-3 rounded-xl flex flex-col justify-between gap-1 shadow-sm">
                                  <span className="text-[10px] font-black text-[#ffb900] uppercase tracking-wider flex items-center gap-1">
                                    <LogOut className="w-3.5 h-3.5 text-[#ffb900]" />
                                    {tText("เวลาเช็คเอาท์ออกพื้นที่", "Check-Out Time")}
                                  </span>
                                  <span className="font-mono font-black text-[#ffb900] text-xs mt-1">
                                    {checkOutTimeFormatted || (isCheckedIn ? 'กำลังอยู่ในพื้นที่' : 'ยังไม่มีเวลาเช็คเอาท์')}
                                  </span>
                                </div>

                                {/* Duration in Area */}
                                <div className="bg-white border border-blue-400/80 p-3 rounded-xl flex flex-col justify-between gap-1 shadow-sm">
                                  <span className="text-[10px] font-black text-[#006eff] uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-[#006eff] animate-pulse" />
                                    {tText("ระยะเวลาอยู่ในพื้นที่รอบนี้", "Duration in Area")}
                                  </span>
                                  <span className="font-mono font-black text-[#006eff] text-xs mt-1">
                                    {durationInfo.durationText && durationInfo.durationText !== '-' 
                                      ? (
                                          durationInfo.diffMs && durationInfo.diffMs >= 3600000
                                            ? `${durationInfo.durationText} (รวม ${Math.floor(durationInfo.diffMs / 60000)} นาที)`
                                            : durationInfo.durationText
                                        ) 
                                      : (isCheckedIn ? 'กำลังคำนวณ...' : '0 นาที')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Submit Section */}
                      {scannedOrSearchedVisitor.status !== 'banned' && (
                        scannedOrSearchedVisitor.status && (scannedOrSearchedVisitor.status === 'checked-out' || scannedOrSearchedVisitor.status.startsWith(tText(tText("เช็คเอาท์", "Check-Out"), "Check-Out"))) ? (
                          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                              <Ban className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                              <div>
                                <h4 className="font-extrabold text-sm uppercase">{tText(tText("ใบผ่านนี้สิ้นสุดอายุการใช้งาน", "ENTRY PASS EXPIRED"), "ENTRY PASS EXPIRED")}</h4>
                                <p className="text-xs text-amber-400/80 mt-1 leading-relaxed">
                                  {lang === 'TH'
                                    ? tText(tText("ใบผ่านนี้ถูกเช็คเอาท์ออกพื้นที่เรียบร้อยแล้ว ไม่สามารถเช็คอินซ้ำได้อีกตามระบบรักษาความปลอดภัยแบบ 1 ใบผ่านต่อ 1 ครั้ง กรุณาออกใบผ่านใหม่", "This pass has already been checked out. Passcodes are single-use only."), "This pass has already been checked out. Passcodes are single-use only.")
                                    : 'This pass has already been checked out and expired. It cannot be used to check-in again due to security policy. Please issue a new pass.'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('register');
                                setScannedOrSearchedVisitor(null);
                                setGateIdInput('');
                                setGateStatusMsg(null);
                              }}
                              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl transition text-center cursor-pointer shadow-lg shadow-amber-500/10 font-bold"
                            >
                              {lang === 'TH' ? tText(tText("➕ ไปลงทะเบียนทำใบผ่านใหม่", "➕ Go to register new pass"), "➕ Go to register new pass") : '➕ Register New Pass'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">{tText(tText("การดำเนินการตามสิทธิ์", "Action Authorization"), "Action Authorization")}</span>
                              
                              {/* Allow override switch */}
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setGateLogAction('check-in')}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                                    gateLogAction === 'check-in' 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-slate-950 border border-slate-850 text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  เข้า (In)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGateLogAction('check-out')}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                                    gateLogAction === 'check-out' 
                                      ? 'bg-slate-750 text-slate-100 shadow' 
                                      : 'bg-slate-950 border border-slate-850 text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  ออก (Out)
                                </button>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleGateAction(e as any)}
                              disabled={isGateScanning}
                              className={`w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider text-white shadow-lg transition duration-150 cursor-pointer ${
                                gateLogAction === 'check-in'
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-500/20'
                                  : 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-650 hover:to-slate-750 border border-slate-600/20'
                              }`}
                            >
                              {isGateScanning ? (
                                <span className="flex items-center justify-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  {lang === 'TH' ? tText(tText("กำลังส่งข้อมูลบันทึกเวลา...", "Submitting transaction log..."), "Submitting transaction log...") : 'Sending transaction...'}
                                </span>
                              ) : (
                                <span className="text-black font-black">
                                  {gateLogAction === 'check-in' 
                                    ? (lang === 'TH' ? tText(tText("🟢 บันทึกเวลาเข้าพื้นที่", "🟢 CONFIRM CHECK-IN"), "🟢 CONFIRM CHECK-IN") : 'Confirm Check-In')
                                    : (lang === 'TH' ? tText(tText("🔴 บันทึกเวลาออกพื้นที่", "🔴 CONFIRM CHECK-OUT"), "🔴 CONFIRM CHECK-OUT") : 'Confirm Check-Out')
                                  }
                                </span>
                              )}
                            </button>
                          </div>
                        )
                      )}

                      <div className="mt-5 border-t border-slate-800/80 pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setScannedOrSearchedVisitor(null);
                            setGateIdInput('');
                            setGateStatusMsg(null);
                          }}
                          className="flex-1 py-3 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                        >
                          {lang === 'TH' ? tText(tText("← กลับหน้าค้นหา / สแกนคิวอาร์ใหม่", "← Back to Search / Scan New QR"), "← Back to Search / Scan New QR") : '← Back to Search / Scan New'}
                        </button>
                      </div>
                    </div>

                    {/* Operational Status Display */}
                    {gateStatusMsg && (
                      <div className={`mt-6 p-4 rounded-2xl border flex items-start gap-3 ${
                        gateStatusMsg.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {gateStatusMsg.type === 'success' ? (
                          <Check className="w-5 h-5 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <h4 className="font-bold text-xs">{gateStatusMsg.type === 'success' ? t('successSave') : t('errorSave')}</h4>
                          <p className="text-xs leading-relaxed mt-0.5">{gateStatusMsg.text}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between animate-[fadeIn_0.2s_ease-out]">
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-base font-extrabold text-slate-100">{t('gateTitle')}</h2>
                          <p className="text-xs text-slate-400">
                            {lang === 'TH' 
                              ? tText(tText("ค้นหาจากระบบ คีย์รหัส หรือสแกนคิวอาร์โค้ดใบผ่าน เพื่อเช็คอิน-เช็คเอาท์เข้าออกพื้นที่อย่างปลอดภัย", "Search system, enter Pass ID, or scan QR code to perform check-in/out."), "Search system, enter Pass ID, or scan QR code to perform check-in/out.") 
                              : 'Scan or search by ID, Name, Plate or Phone to log gate activities.'}
                          </p>
                        </div>
                      </div>

                      {showGateQRScanner ? (
                        <div className="flex flex-col gap-4">
                          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                            <div className="text-center mb-3">
                              <span className="text-xs text-blue-400 font-bold flex items-center justify-center gap-1.5 animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                                กล้องสแกน QR Code (AI-Powered)
                              </span>
                              <p className="text-[10px] text-slate-500 mt-1">
                                ชูใบผ่านที่มี QR Code หน้ากล้องเพื่ออ่านรหัสและเรียกข้อมูลอัตโนมัติ
                              </p>
                            </div>
                            
                            <CameraCapture 
                              onCapture={handleQRScanCaptured} 
                              buttonText="สแกนใบผ่านด้วยภาพถ่าย" 
                              autoCapture={true}
                              isProcessing={isQRScanningAI}
                              scanType="qr"
                            />

                            {qrScanError && (
                              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5">
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <span className="text-[11px] text-rose-300 leading-normal">{qrScanError}</span>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setShowGateQRScanner(false);
                              setQrScanError(null);
                            }}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-4 rounded-2xl shadow transition duration-150 cursor-pointer text-xs uppercase tracking-wider"
                          >
                            กลับไปหน้าค้นหา
                          </button>
                        </div>
                      ) : (
                        <>
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              handlePerformGateSearch(gateIdInput);
                            }} 
                            className="flex flex-col gap-4"
                          >
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
                                {lang === 'TH' ? tText(tText("ค้นหาหรือป้อนรหัสใบผ่านเข้าออก (Pass ID / ชื่อ / ทะเบียนรถ / เบอร์โทร)", "Search/Enter Pass details"), "Search/Enter Pass details") : 'Search or Enter Pass details'}
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={gateIdInput}
                                  onChange={(e) => setGateIdInput(e.target.value)}
                                  placeholder={tText(tText("พิมพ์รหัสใบผ่าน เช่น P123456, ชื่อ, หรือทะเบียนรถ...", "Search Pass ID, name, or vehicle plate..."), "Search Pass ID, name, or vehicle plate...")}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-4 pr-12 py-3.5 text-slate-100 text-sm font-bold focus:border-blue-500 focus:outline-none transition"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowGateQRScanner(true)}
                                  className="absolute right-3.5 top-3.5 text-blue-400 hover:text-blue-300 transition duration-150 cursor-pointer"
                                  title="สแกนด้วยกล้อง AI"
                                >
                                  <Camera className="w-5 h-5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex gap-2.5">
                              <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg transition duration-150 cursor-pointer uppercase text-xs tracking-wider"
                              >
                                {lang === 'TH' ? tText(tText("🔍 ตรวจสอบและค้นหาข้อมูล", "Verify & Query Data"), "Verify & Query Data") : '🔍 Search & Verify'}
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => setShowGateQRScanner(true)}
                                className="px-4.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-2xl border border-slate-700/60 transition duration-150 cursor-pointer flex items-center justify-center shrink-0"
                                title={tText(tText("เปิดกล้องสแกน QR Code", "Open QR Scan Camera"), "Open QR Scan Camera")}
                              >
                                <QrCode className="w-5 h-5" />
                              </button>
                            </div>
                          </form>

                          {/* Multiple search results matching list */}
                          {multipleSearchResults.length > 0 && (
                            <div className="mt-5 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col gap-3">
                              <span className="block text-[10px] uppercase tracking-wider text-blue-400 font-extrabold">
                                👥 ผลการค้นหาที่ตรวจพบ ({multipleSearchResults.length} รายการ)
                              </span>
                              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                                {multipleSearchResults.map((v, idx) => (
                                  <button
                                    key={`${v.id}-${idx}`}
                                    type="button"
                                    onClick={() => {
                                      setScannedOrSearchedVisitor(v);
                                      setMultipleSearchResults([]);
                                      setGateIdInput(v.id);
                                      if (v.status && (v.status.startsWith(tText(tText("เช็คอิน", "Check-In"), "Check-In")) || v.status === 'checked-in')) {
                                        setGateLogAction('check-out');
                                      } else {
                                        setGateLogAction('check-in');
                                      }
                                      setGateStatusMsg(null);
                                    }}
                                    className="w-full text-left p-3 bg-slate-900 border border-slate-800 hover:border-[#7f98f7]/50 rounded-xl transition duration-150 cursor-pointer flex items-center justify-between gap-3 text-xs"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-black shrink-0">
                                        {v.id.substring(0, 3)}
                                      </div>
                                      <div className="truncate">
                                        <div className="text-slate-200 font-extrabold truncate max-w-[150px]">{v.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">{v.id} • {v.company || tText(tText("ไม่ระบุสังกัด", "No Company Affiliation"), "No Company Affiliation")}</div>
                                      </div>
                                    </div>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                                      v.status && v.status.startsWith(tText(tText("เช็คอิน", "Check-In"), "Check-In")) 
                                        ? 'bg-emerald-500/10 text-emerald-400' 
                                        : 'bg-slate-800 text-slate-400'
                                    }`}>
                                      {v.status && v.status.startsWith(tText(tText("เช็คอิน", "Check-In"), "Check-In")) ? tText(tText("อยู่ในพื้นที่", "Inside"), "Inside") : tText(tText("อยู่ภายนอก", "Outside"), "Outside")}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}


                        </>
                      )}
                    </div>

                    {/* Operational Status Display */}
                    {gateStatusMsg && (
                      <div className={`mt-6 p-4 rounded-2xl border flex items-start gap-3 ${
                        gateStatusMsg.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {gateStatusMsg.type === 'success' ? (
                          <Check className="w-5 h-5 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <h4 className="font-bold text-xs">{gateStatusMsg.type === 'success' ? t('successSave') : t('errorSave')}</h4>
                          <p className="text-xs leading-relaxed mt-0.5">{gateStatusMsg.text}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </motion.div>
          )}

          {/* TAB 2: VISITOR REGISTRATION */}
          {activeTab === 'register' && !!(roleMenuPermissions[loggedInSystemUser?.role]?.register ?? true) && (
            <motion.div
              key="register-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl"
            >
              <div className="mb-4 pb-2.5 border-b border-slate-800">
                <h2 className="text-xl font-extrabold text-slate-100">{t('regMainTitle')}</h2>
                <p className="text-xs text-slate-400 mt-1">{t('regMainDesc')}</p>
              </div>

              {/* Registration Tab Content */}
              {true && (
                <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4 animate-[fadeIn_0.2s_ease-out]">
                  {retrievalStatus && (
                    <div className={`p-2.5 border text-xs font-bold text-center w-full rounded-xl transition-all ${
                      retrievalStatus.includes('สำเร็จ') || retrievalStatus.includes('Successfully')
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                        : retrievalStatus.includes('กำลัง')
                        ? 'bg-blue-500/10 border-blue-500/25 text-blue-400 animate-pulse'
                        : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                    }`}>
                      {retrievalStatus}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left Column: Photo Capture (Compact Size) */}
                    <div className="lg:col-span-4 flex flex-col gap-2.5 w-full">
                      <label className="block text-xs uppercase tracking-wider text-slate-400 font-black text-center lg:text-left">
                        {t('photoLabel')} <span className="text-rose-500">*</span>
                      </label>
                      <div className="w-full max-w-[280px] sm:max-w-[300px] mx-auto">
                        <CameraCapture 
                          onCapture={(base64) => setRegPhoto(base64)} 
                          buttonText={t('captureRegFaceBtn')} 
                          autoCapture={false}
                          showLightingControls={true}
                          showCameraSwitch={true}
                        />
                      </div>
                      {!regPhoto ? (
                        <div className="text-xs text-rose-400 font-bold flex items-center justify-center gap-1.5 bg-rose-500/10 border border-rose-500/25 py-2 px-3 rounded-xl text-center">
                          ⚠️ {t('mustCaptureWarning')}
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 py-2 px-3 rounded-xl text-center">
                          <Check className="w-4 h-4 stroke-[3]" /> {t('captureSuccess')}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Registration Fields (Thai vs Foreigner) */}
                    <div className="lg:col-span-8 flex flex-col gap-3.5">
                      {/* Registration Category Switcher */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setRegForm(prev => ({
                              ...prev,
                              registrationCategory: 'thai',
                              nationality: 'ไทย',
                              passportNumber: '',
                              passportIssueDate: '',
                              passportExpiryDate: '',
                              workPermitNumber: '',
                              workPermitIssueDate: '',
                              workPermitExpiryDate: '',
                            }));
                          }}
                          className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            regForm.registrationCategory === 'thai'
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/50'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          <span className="font-bold">{lang === 'TH' ? 'คนไทย' : 'Thai Citizen'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRegForm(prev => ({
                              ...prev,
                              registrationCategory: 'foreigner',
                              nationality: prev.nationality === 'ไทย' ? 'พม่า' : prev.nationality,
                              passportId: '',
                            }));
                          }}
                          className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            regForm.registrationCategory === 'foreigner'
                              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400/50'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          <span className="text-base">🌐</span>
                          <span className="font-bold">{lang === 'TH' ? 'แรงงานต่างด้าว / ต่างชาติ' : 'Foreigner Worker'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="block text-xs uppercase tracking-wider text-slate-300 font-black">
                          {regForm.registrationCategory === 'thai'
                            ? '📋 ฟอร์มลงทะเบียนบุคคลสัญชาติไทย'
                            : '📋 ฟอร์มลงทะเบียนแรงงานต่างด้าว / ผู้ติดต่อต่างชาติ'}
                        </label>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                          regForm.registrationCategory === 'thai' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {regForm.registrationCategory === 'thai' ? '🇹🇭 สัญชาติไทย' : '🌐 แรงงานต่างด้าว'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Name */}
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">{t('nameLabel')} <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={regForm.name}
                            onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                            placeholder={t('namePlaceholder')}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        {/* THAI FORM: Citizen ID */}
                        {regForm.registrationCategory === 'thai' && (
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                              เลขบัตรประจำตัวประชาชน 13 หลัก <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                required
                                value={regForm.passportId}
                                onChange={(e) => setRegForm({ ...regForm, passportId: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleRetrieveByPassport();
                                  }
                                }}
                                onBlur={() => {
                                  if (String(regForm.passportId || '').trim().length >= 5 && !regForm.name) {
                                    handleRetrieveByPassport();
                                  }
                                }}
                                placeholder="X-XXXX-XXXXX-XX-X"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-[110px] py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleRetrieveByPassport}
                                disabled={isRetrievingByPassport || !String(regForm.passportId || '').trim()}
                                className={`absolute right-1.5 text-[10px] font-extrabold px-2 py-1 rounded-lg transition duration-150 flex items-center gap-1 cursor-pointer select-none ${
                                  !String(regForm.passportId || '').trim()
                                    ? 'text-slate-500 cursor-not-allowed bg-slate-900/40'
                                    : 'text-[#7f98f7] hover:text-[#7f98f7]/80 bg-[#7f98f7]/10 border border-[#7f98f7]/20 hover:bg-[#7f98f7]/20'
                                }`}
                              >
                                <Sparkles className="w-3 h-3" />
                                {isRetrievingByPassport ? 'กำลังดึง...' : 'ดึงประวัติ'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* FOREIGNER FORM: Nationality Select */}
                        {regForm.registrationCategory === 'foreigner' && (
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                              สัญชาติ <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={regForm.nationality}
                              onChange={(e) => setRegForm({ ...regForm, nationality: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-amber-500 focus:outline-none cursor-pointer"
                            >
                              <option value="พม่า">🇲🇲 พม่า</option>
                              <option value="กัมพูชา">🇰🇭 กัมพูชา</option>
                              <option value="ลาว">🇱🇦 ลาว</option>
                              <option value="เวียดนาม">🇻🇳 เวียดนาม</option>
                              <option value="ต่างชาติอื่นๆ">🌐 อื่นๆ</option>
                            </select>
                          </div>
                        )}

                        {/* FOREIGNER FORM: Passport Number */}
                        {regForm.registrationCategory === 'foreigner' && (
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                              หมายเลขพาสปอร์ต <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                required
                                value={regForm.passportNumber}
                                onChange={(e) => setRegForm({ ...regForm, passportNumber: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleRetrieveByPassport();
                                  }
                                }}
                                onBlur={() => {
                                  if (String(regForm.passportNumber || '').trim().length >= 4 && !regForm.name) {
                                    handleRetrieveByPassport();
                                  }
                                }}
                                placeholder="ระบุเลขพาสปอร์ต..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-[110px] py-2.5 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleRetrieveByPassport}
                                disabled={isRetrievingByPassport || !String(regForm.passportNumber || '').trim()}
                                className={`absolute right-1.5 text-[10px] font-extrabold px-2 py-1 rounded-lg transition duration-150 flex items-center gap-1 cursor-pointer select-none ${
                                  !String(regForm.passportNumber || '').trim()
                                    ? 'text-slate-500 cursor-not-allowed bg-slate-900/40'
                                    : 'text-[#7f98f7] hover:text-[#7f98f7]/80 bg-[#7f98f7]/10 border border-[#7f98f7]/20 hover:bg-[#7f98f7]/20'
                                }`}
                              >
                                <Sparkles className="w-3 h-3" />
                                {isRetrievingByPassport ? 'กำลังดึง...' : 'ดึงประวัติ'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* FOREIGNER FORM: Passport Issue Date */}
                        {regForm.registrationCategory === 'foreigner' && (
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                              วันออกพาสปอร์ต
                            </label>
                            <input
                              type="date"
                              value={regForm.passportIssueDate}
                              onChange={(e) => setRegForm({ ...regForm, passportIssueDate: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        )}

                        {/* FOREIGNER FORM: Passport Expiry Date */}
                        {regForm.registrationCategory === 'foreigner' && (
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                              วันหมดอายุพาสปอร์ต <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              value={regForm.passportExpiryDate}
                              onChange={(e) => setRegForm({ ...regForm, passportExpiryDate: e.target.value })}
                              className={`w-full bg-slate-950 border rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:outline-none ${
                                regForm.passportExpiryDate && checkWorkPermitExpired(regForm.passportExpiryDate)
                                  ? 'border-rose-500 text-rose-300 font-bold bg-rose-950/20'
                                  : 'border-slate-800 focus:border-amber-500'
                              }`}
                            />
                          </div>
                        )}

                        {/* FOREIGNER FORM: Work Permit Number */}
                        {regForm.registrationCategory === 'foreigner' && (
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                              เลขใบอนุญาตทำงาน <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={regForm.workPermitNumber}
                              onChange={(e) => setRegForm({ ...regForm, workPermitNumber: e.target.value })}
                              placeholder="ระบุเลขใบอนุญาตทำงาน..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        )}

                        {/* FOREIGNER FORM: Work Permit Issue Date */}
                        {regForm.registrationCategory === 'foreigner' && (
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                              วันออกบัตร Work Permit
                            </label>
                            <input
                              type="date"
                              value={regForm.workPermitIssueDate}
                              onChange={(e) => setRegForm({ ...regForm, workPermitIssueDate: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        )}

                        {/* FOREIGNER FORM: Work Permit Expiry Date */}
                        {regForm.registrationCategory === 'foreigner' && (
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                              วันหมดอายุ Work Permit <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              value={regForm.workPermitExpiryDate}
                              onChange={(e) => setRegForm({ ...regForm, workPermitExpiryDate: e.target.value })}
                              className={`w-full bg-slate-950 border rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:outline-none ${
                                regForm.workPermitExpiryDate && checkWorkPermitExpired(regForm.workPermitExpiryDate)
                                  ? 'border-rose-500 text-rose-300 font-bold bg-rose-950/20'
                                  : 'border-slate-800 focus:border-amber-500'
                              }`}
                            />
                          </div>
                        )}

                        {/* BOTH FORMS: Date of Birth & Live Age Calculation */}
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                            วันเกิด <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={regForm.dob}
                            onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                          />
                          {regForm.dob && (() => {
                            const calculatedAge = calculateAgeFromDob(regForm.dob);
                            if (calculatedAge === null) return null;
                            const isLoader = regForm.visitorType.includes('โหลดเดอร์') || regForm.visitorType.toLowerCase().includes('loader');
                            const isRestricted = (isLoader || regForm.registrationCategory === 'foreigner') && (calculatedAge < 18 || calculatedAge > 55);
                            return (
                              <div className={`mt-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1.5 ${
                                isRestricted
                                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                                  : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                              }`}>
                                {isRestricted ? (
                                  <>
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                                    <span>อายุ {calculatedAge} ปี (⚠️ นอกเกณฑ์ 18-55 ปี)</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                                    <span>อายุ {calculatedAge} ปี (ผ่านเกณฑ์ 18-55 ปี)</span>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* BOTH FORMS: Gender */}
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                            เพศ
                          </label>
                          <select
                            value={regForm.gender}
                            onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">-- ไม่ระบุเพศ --</option>
                            <option value="ชาย">ชาย (Male)</option>
                            <option value="หญิง">หญิง (Female)</option>
                            <option value="อื่นๆ">อื่นๆ (Other)</option>
                          </select>
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">{t('phoneLabel')} <span className="text-rose-500">*</span></label>
                          <input
                            type="tel"
                            required
                            value={regForm.phone}
                            onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                            placeholder={t('phonePlaceholder')}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        {/* Vehicle Plate */}
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">{t('plateLabel')}</label>
                          <input
                            type="text"
                            value={regForm.vehiclePlate}
                            onChange={(e) => setRegForm({ ...regForm, vehiclePlate: e.target.value })}
                            placeholder={t('platePlaceholder')}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        {/* Company */}
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">{t('companyLabel')} <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={regForm.company}
                            onChange={(e) => setRegForm({ ...regForm, company: e.target.value })}
                            placeholder={t('companyPlaceholder')}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        {/* Visitor Type */}
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">{t('visitorTypeLabel')} <span className="text-rose-500">*</span></label>
                          <select
                            value={regForm.visitorType}
                            onChange={(e) => setRegForm({ ...regForm, visitorType: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none cursor-pointer text-slate-300"
                          >
                            {VISITOR_TYPES.map(t => (
                              <option key={t} value={t} className="bg-slate-900 text-slate-100">{t}</option>
                            ))}
                          </select>
                        </div>

                        {/* Contact Area */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">{t('contactAreaLabel')} <span className="text-rose-500">*</span></label>
                          <select
                            value={regForm.contactArea}
                            onChange={(e) => setRegForm({ ...regForm, contactArea: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none cursor-pointer text-slate-300"
                          >
                            {CONTACT_AREAS.map(a => (
                              <option key={a} value={a} className="bg-slate-900 text-slate-100">{a}</option>
                            ))}
                          </select>
                        </div>

                        {/* Address */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">{t('addressLabel')} <span className="text-rose-500">*</span></label>
                          <textarea
                            required
                            rows={2}
                            value={regForm.address}
                            onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                            placeholder={t('addressPlaceholder')}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none resize-none"
                          />
                        </div>
                      </div>

                      {/* Live Warnings Banner before submit */}
                      {regForm.registrationCategory === 'foreigner' && (regForm.passportExpiryDate || regForm.workPermitExpiryDate) && (
                        (() => {
                          const isPassExpired = checkWorkPermitExpired(regForm.passportExpiryDate);
                          const isWpExpired = checkWorkPermitExpired(regForm.workPermitExpiryDate);
                          if (!isPassExpired && !isWpExpired) return null;
                          return (
                            <div className="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-3 text-rose-300 text-xs font-bold flex items-start gap-2.5 animate-pulse">
                              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                              <div className="space-y-0.5">
                                <div className="font-extrabold text-rose-200">⛔ เอกสารประจำตัว/ใบอนุญาตทำงานหมดอายุ!</div>
                                {isPassExpired && (
                                  <div className="text-[11px] text-rose-300">
                                    • วันหมดอายุพาสปอร์ต: {regForm.passportExpiryDate} (หมดอายุแล้ว)
                                  </div>
                                )}
                                {isWpExpired && (
                                  <div className="text-[11px] text-rose-300">
                                    • วันหมดอายุ Work Permit: {regForm.workPermitExpiryDate} (หมดอายุแล้ว)
                                  </div>
                                )}
                                <div className="text-[10px] text-rose-400 font-normal pt-0.5">
                                  ระบบปฏิเสธการลงทะเบียนเข้าพื้นที่สำหรับเอกสารที่หมดอายุแล้ว
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      )}

                      {regForm.dob && (() => {
                        const calculatedAge = calculateAgeFromDob(regForm.dob);
                        const isLoader = regForm.visitorType.includes('โหลดเดอร์') || regForm.visitorType.toLowerCase().includes('loader');
                        if (calculatedAge !== null && (isLoader || regForm.registrationCategory === 'foreigner') && (calculatedAge < 18 || calculatedAge > 55)) {
                          return (
                            <div className="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-3 text-rose-300 text-xs font-bold flex items-start gap-2.5 animate-pulse">
                              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                              <div>
                                <div className="font-extrabold text-rose-200">⛔ ไม่อนุญาตให้เข้าพื้นที่ (คำนวณอายุได้ {calculatedAge} ปี)</div>
                                <div className="text-[11px] text-rose-300 mt-0.5">ผู้มาติดต่อประเภท "{regForm.visitorType}" หรือต่างด้าว ต้องมีอายุระหว่าง 18 - 55 ปีเท่านั้น</div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <button
                        type="submit"
                        disabled={isRegistering || !regPhoto}
                        className={`w-full font-black py-3.5 px-4 rounded-xl shadow-lg transition duration-150 uppercase tracking-wider text-xs mt-2 flex items-center justify-center gap-2 ${
                          !regPhoto 
                            ? 'bg-slate-800/80 text-slate-500 border border-slate-750/80 cursor-not-allowed opacity-75'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-[0.99] cursor-pointer'
                        }`}
                      >
                        {isRegistering 
                          ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>{t('registeringBtn')}</span>
                            </>
                          ) 
                          : !regPhoto 
                            ? (
                              <>
                                <Camera className="w-4 h-4 text-amber-400 animate-pulse" />
                                <span>⚠️ {t('mustPhotoWarningBtn')}</span>
                              </>
                            ) 
                            : (
                              <>
                                <UserPlus className="w-4 h-4" />
                                <span>{t('submitRegBtn')}</span>
                              </>
                            )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          {/* TAB 3: PASS VIEWER */}
          {activeTab === 'pass' && !!(roleMenuPermissions[loggedInSystemUser?.role]?.pass ?? true) && (
            <motion.div
              key="pass-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full flex flex-col gap-6"
            >
              {/* Table Container */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col gap-5 no-print">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                      <Printer className="w-5 h-5 text-blue-400" />
                      {tText("ระบบสืบค้นและจัดพิมพ์ใบผ่าน", "Visitor Pass Directory")}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      ค้นหา ตรวจสอบข้อมูล และจัดพิมพ์ใบผ่านทางสำหรับบุคคลภายนอกและรถบรรทุกเข้าออกทั้งหมด
                    </p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="flex flex-col md:flex-row items-stretch gap-3">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-4 w-4 text-slate-500" />
                    </span>
                    <input
                      type="text"
                      value={passSearch}
                      onChange={(e) => {
                        setPassSearch(e.target.value);
                        setPassCurrentPage(1); // reset to page 1 on search
                      }}
                      placeholder={tText(tText("พิมพ์ชื่อผู้ติดต่อ, รหัสใบผ่าน, บริษัท, เลขที่บัตร, ทะเบียนรถ เพื่อค้นหา...", "Type visitor name, Pass ID, company, ID/Passport, vehicle plate to search..."), "Type visitor name, Pass ID, company, ID/Passport, vehicle plate to search...")}
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {passSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setPassSearch('');
                          setPassCurrentPage(1);
                        }}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center font-mono shrink-0 bg-slate-950/40 border border-slate-800/80 px-3 py-1.5 rounded-xl">
                    พบทั้งหมด {
                      uniqueVisitorsFromLogs.filter(v => {
                        if (!passSearch) return true;
                        const searchLower = passSearch.toLowerCase();
                        return (
                          String(v.name || '').toLowerCase().includes(searchLower) ||
                          String(v.id || '').toLowerCase().includes(searchLower) ||
                          String(v.company || '').toLowerCase().includes(searchLower) ||
                          String(v.vehiclePlate || '').toLowerCase().includes(searchLower) ||
                          String(v.passportId || '').toLowerCase().includes(searchLower)
                        );
                      }).length
                    } รายการ
                  </div>
                </div>

                {/* Responsive Table of Passes */}
                <div className="w-full">
                  {(() => {
                    const filteredPasses = uniqueVisitorsFromLogs.filter(v => {
                      if (!passSearch) return true;
                      const searchLower = passSearch.toLowerCase();
                      return (
                        String(v.name || '').toLowerCase().includes(searchLower) ||
                        String(v.id || '').toLowerCase().includes(searchLower) ||
                        String(v.company || '').toLowerCase().includes(searchLower) ||
                        String(v.vehiclePlate || '').toLowerCase().includes(searchLower) ||
                        String(v.passportId || '').toLowerCase().includes(searchLower)
                      );
                    });

                    const passPageSize = 8;
                    const totalPassPages = Math.ceil(filteredPasses.length / passPageSize) || 1;
                    const currentPassPage = Math.min(passCurrentPage, totalPassPages);
                    const passStartIndex = (currentPassPage - 1) * passPageSize;
                    const paginatedPasses = filteredPasses.slice(passStartIndex, passStartIndex + passPageSize);

                    if (filteredPasses.length === 0) {
                      return (
                        <div className="py-12 text-center text-slate-500 font-mono text-xs border border-slate-800 bg-slate-950/40 rounded-2xl">
                          ไม่พบข้อมูลใบผ่านประวัติการติดต่อในระบบที่ตรงกับคำค้นหา
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col gap-4">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto border border-slate-800/80 bg-slate-950/40 rounded-2xl">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-bold bg-slate-950/80">
                                <th className="py-3.5 px-4 font-extrabold">{tText(tText("รหัสใบผ่าน", "Pass ID"), "Pass ID")}</th>
                                <th className="py-3.5 px-4 font-extrabold">{tText(tText("รูปถ่าย", "Photo"), "Photo")}</th>
                                <th className="py-3.5 px-4 font-extrabold">{tText(tText("ชื่อผู้เข้าติดต่อ", "Visitor Name"), "Visitor Name")}</th>
                                <th className="py-3.5 px-4 font-extrabold">{tText(tText("บริษัท / สังกัด", "Company / Affiliation"), "Company / Affiliation")}</th>
                                <th className="py-3.5 px-4 font-extrabold">{tText(tText("ทะเบียนรถ", "Vehicle Plate"), "Vehicle Plate")}</th>
                                <th className="py-3.5 px-4 font-extrabold">{tText(tText("พื้นที่เข้าติดต่อ", "Contact Area"), "Contact Area")}</th>
                                <th className="py-3.5 px-4 font-extrabold">{tText(tText("สถานะ", "Status"), "Status")}</th>
                                <th className="py-3.5 px-4 text-right font-extrabold">{tText(tText("การจัดการ", "Actions"), "Actions")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
                              {paginatedPasses.map((visitor, idx) => (
                                <tr key={`${visitor.id}-${idx}`} className="hover:bg-slate-800/20 transition duration-150">
                                  <td className="py-3 px-4 font-mono font-black text-blue-400">
                                    {visitor.id}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                                      <img 
                                        src={getDisplayPhotoUrl(visitor.photoUrl)} 
                                        alt={visitor.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                                        }}
                                      />
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 font-extrabold text-slate-100">
                                    {visitor.name}
                                    {visitor.registrationCategory === 'foreigner' && (
                                      <span className="ml-2 text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                        {visitor.nationality || 'ต่างด้าว'}
                                      </span>
                                    )}
                                    <div className="text-[10px] text-slate-500 font-mono font-normal mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                      <span>เลขบัตร: {visitor.passportId || tText(tText("ไม่ได้ระบุ", "Unspecified"), "Unspecified")}</span>
                                      {visitor.dob && (
                                        <span className="text-slate-400">| เกิด: {visitor.dob} {visitor.age ? `(${visitor.age} ปี)` : ''}</span>
                                      )}
                                      {visitor.gender && (
                                        <span className="text-slate-400">| เพศ: {visitor.gender}</span>
                                      )}
                                    </div>
                                    {(visitor.passportNumber || visitor.workPermitNumber) && (
                                      <div className="text-[10px] font-mono text-amber-300/90 font-bold mt-0.5 flex flex-wrap items-center gap-x-2">
                                        {visitor.passportNumber && <span>Passport: {visitor.passportNumber}</span>}
                                        {visitor.workPermitNumber && <span>WorkPermit: {visitor.workPermitNumber}</span>}
                                      </div>
                                    )}
                                    <div className="text-[10px] text-amber-400/90 font-mono font-normal mt-0.5">
                                      ออกใบผ่านโดย: {visitor.registeredBy || tText(tText("ระบบอัตโนมัติ", "Automated System"), "Automated System")}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-slate-300">
                                    {visitor.company || <span className="text-slate-600">-</span>}
                                  </td>
                                  <td className="py-3 px-4 font-mono font-extrabold">
                                    {visitor.vehiclePlate || <span className="text-slate-600 font-normal">{tText(tText("เดินเท้า", "Walk-in"), "Walk-in")}</span>}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                      {visitor.contactArea || tText(tText("ไม่ได้ระบุ", "Unspecified"), "Unspecified")}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    {(() => {
                                      const badge = getVisitorStatusBadge(visitor.status, lang === 'EN');
                                      return (
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.className}`}>
                                          {badge.text}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setNewPass(visitor)}
                                      className="bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition duration-150 flex items-center gap-1.5 inline-flex"
                                    >
                                      <Search className="w-3.5 h-3.5" /> ตรวจสอบและพิมพ์
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Grid */}
                        <div className="block md:hidden flex flex-col gap-3">
                          {paginatedPasses.map((visitor, idx) => (
                            <div key={`${visitor.id}-${idx}`} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                              <div className="flex items-center justify-between pb-2.5 border-b border-slate-900">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shrink-0">
                                    <img 
                                      src={getDisplayPhotoUrl(visitor.photoUrl)} 
                                      alt={visitor.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <h5 className="font-extrabold text-xs text-slate-200">{visitor.name}</h5>
                                    <p className="text-[9px] text-slate-500 font-mono">ID: {visitor.id}</p>
                                    {(visitor.dob || visitor.gender || visitor.nationality) && (
                                      <p className="text-[9px] text-slate-400">
                                        {[visitor.gender, visitor.nationality, visitor.dob ? `เกิด ${visitor.dob}` : null, visitor.age ? `อายุ ${visitor.age} ปี` : null].filter(Boolean).join(' | ')}
                                      </p>
                                    )}
                                    {(visitor.passportNumber || visitor.workPermitNumber) && (
                                      <p className="text-[9px] text-amber-300 font-mono">
                                        {[visitor.passportNumber ? `Passport: ${visitor.passportNumber}` : null, visitor.workPermitNumber ? `WP: ${visitor.workPermitNumber}` : null].filter(Boolean).join(' | ')}
                                      </p>
                                    )}
                                    <p className="text-[9px] text-amber-400/90 font-mono">ออกโดย: {visitor.registeredBy || tText(tText("ระบบอัตโนมัติ", "Automated System"), "Automated System")}</p>
                                  </div>
                                </div>
                                <span className="text-[10px] font-mono font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                                  {visitor.visitorType}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                  <span className="text-slate-500 block text-[8px] uppercase font-bold">{tText(tText("ทะเบียนรถ", "Vehicle Plate"), "Vehicle Plate")}</span>
                                  <span className="text-slate-300 font-extrabold">{visitor.vehiclePlate || tText(tText("เดินเท้า", "Walk-in"), "Walk-in")}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[8px] uppercase font-bold">{tText(tText("พื้นที่ติดต่อ", "Contact Area"), "Contact Area")}</span>
                                  <span className="text-blue-400 font-extrabold">{visitor.contactArea || tText(tText("ไม่ได้ระบุ", "Unspecified"), "Unspecified")}</span>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/40 flex items-center justify-between">
                                <span className="text-[9px] text-slate-500">สังกัด: {visitor.company || '-'}</span>
                                <button
                                  type="button"
                                  onClick={() => setNewPass(visitor)}
                                  className="bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition duration-150 flex items-center gap-1"
                                >
                                  <Search className="w-3.5 h-3.5" /> ตรวจสอบ
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination Footer */}
                        {totalPassPages > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t border-slate-800/40">
                            <button
                              onClick={() => setPassCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPassPage === 1}
                              className="bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300 text-[11px] font-extrabold py-2 px-4 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              ก่อนหน้า (Prev)
                            </button>
                            <span className="text-xs text-slate-400 font-mono">
                              หน้า {currentPassPage} / {totalPassPages}
                            </span>
                            <button
                              onClick={() => setPassCurrentPage(prev => Math.min(prev + 1, totalPassPages))}
                              disabled={currentPassPage === totalPassPages}
                              className="bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300 text-[11px] font-extrabold py-2 px-4 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              ถัดไป (Next)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: ADMIN PORTAL */}
          {activeTab === 'admin' && (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              {loggedInSystemUser && !roleMenuPermissions[loggedInSystemUser?.role]?.admin ? (
                /* INSUFFICIENT PERMISSIONS PAGE FOR GUARDS */
                <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center flex flex-col gap-5">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/5">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-100 tracking-wide">
                      จำกัดสิทธิ์การเข้าถึงข้อมูลระบบ
                    </h3>
                    <p className="text-xs text-rose-400 font-bold mt-1.5 uppercase tracking-wider">
                      บทบาทปัจจุบัน: {loggedInSystemUser.role}
                    </p>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      บัญชีของท่านได้รับการจำกัดสิทธิ์การเข้าใช้เมนูผู้ดูแลระบบ ตามที่กำหนดไว้โดยแอดมินสูงสุดในหน้าระบบควบคุมสิทธิ์ตามบทบาท (Role Permissions Customization)
                    </p>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      หากต้องการเข้าดูหรือใช้เครื่องมือต่างๆ ในส่วนสำหรับ ADMIN นี้ กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดใช้สิทธิ์ หรือสลับเข้าใช้ด้วยบัญชีที่มีสิทธิ์ระดับสูงกว่า
                    </p>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-left flex flex-col gap-1.5 relative overflow-hidden">
                    <div className="absolute right-3 top-3 w-12 h-12 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-black overflow-hidden">
                      {loggedInSystemUser.avatar ? (
                        <img src={loggedInSystemUser.avatar} className="w-full h-full object-cover" alt="avatar" />
                      ) : (
                        loggedInSystemUser.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">{tText(tText("บัญชีรักษาความปลอดภัย:", "Security Account:"), "Security Account:")}</div>
                    <div className="text-xs font-bold text-slate-300">{tText("ชื่อ:", "Name:")} {loggedInSystemUser.name}</div>
                    <div className="text-xs font-bold text-slate-300 font-mono">Username: @{loggedInSystemUser.username}</div>
                    <button 
                      onClick={openProfileEdit}
                      className="mt-2 text-left text-[11px] font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1 cursor-pointer w-fit"
                    >
                      <Settings className="w-3.5 h-3.5" /> {tText("แก้ไขโปรไฟล์ & อัปโหลดรูปภาพ", "Edit Profile & Upload Photo")}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setLoggedInSystemUser(null);
                      setIsAdminLoggedIn(false);
                      setActiveTab('gate');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition duration-150 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    {tText("ลงชื่อออกเพื่อสลับบัญชี", "Log Out / Switch Account")}
                  </button>
                </div>
              ) : (
                /* Admin Dashboard & Management views */
                <div className="w-full flex flex-col gap-6">
                  
                  {/* Right Content Panel */}
                  <div className="w-full flex flex-col gap-6">
                    
                    {/* ADMIN VIEW 1: DASHBOARD */}
                    {adminTab === 'dashboard' && !!roleMenuPermissions[loggedInSystemUser?.role]?.admin_dashboard && (
                      <div className="flex flex-col gap-6 w-full animate-fade-in">
                        
                        {/* Advanced Filters & Date Range Picker */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl text-left flex flex-col gap-4">
                          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-[#7f98f7]" />
                                {tText("ตัวกรองสถิติและประวัติการเข้าออกแบบละเอียด", "Detailed Traffic & Dashboard Filters")}
                              </h3>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {tText("ค้นหาผู้เข้าติดต่อ กำหนดช่วงเวลากรองข้อมูล ย้อนหลัง หรือกรองตามจุดตรวจและประเภทบุคคลเพื่อวิเคราะห์ความปลอดภัย", "Search visitors, set custom dates, or filter by checkpoint and category for security analysis.")}
                              </p>
                            </div>
                            
                            {/* Preset Buttons */}
                            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950/90 rounded-2xl border border-slate-800/80 shadow-inner mt-2 xl:mt-0">
                              {(['today', 'yesterday', '7days', '30days', 'all', 'custom'] as const).map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => handlePresetChange(preset)}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                                    filterPreset === preset
                                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold shadow-md shadow-blue-500/20 border border-blue-400/30'
                                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                                  }`}
                                >
                                  {preset === 'today' ? tText(tText("วันนี้", "Today"), "Today") :
                                   preset === 'yesterday' ? tText(tText("เมื่อวาน", "Yesterday"), "Yesterday") :
                                   preset === '7days' ? tText(tText("7 วันที่ผ่านมา", "Past 7 Days"), "Past 7 Days") :
                                   preset === '30days' ? tText(tText("30 วันที่ผ่านมา", "Past 30 Days"), "Past 30 Days") :
                                   preset === 'all' ? tText(tText("ประวัติทั้งหมด", "All Historical Logs"), "All Historical Logs") : tText(tText("เลือกวันเอง", "Custom Range"), "Custom Range")}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Filter Fields Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Date Pickers */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tText(tText("วันเริ่มต้น", "Start Date"), "Start Date")}</label>
                              <input
                                type="date"
                                disabled={filterPreset !== 'custom' && filterPreset !== 'all'}
                                value={filterStartDate}
                                onChange={(e) => {
                                  setFilterPreset('custom');
                                  setFilterStartDate(e.target.value);
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-[#7f98f7] focus:outline-none disabled:opacity-50 font-mono"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tText(tText("วันสิ้นสุด", "End Date"), "End Date")}</label>
                              <input
                                type="date"
                                disabled={filterPreset !== 'custom' && filterPreset !== 'all'}
                                value={filterEndDate}
                                onChange={(e) => {
                                  setFilterPreset('custom');
                                  setFilterEndDate(e.target.value);
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-[#7f98f7] focus:outline-none disabled:opacity-50 font-mono"
                              />
                            </div>

                            {/* Visitor Type */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tText(tText("ประเภทผู้ติดต่อ", "Visitor Type"), "Visitor Type")}</label>
                              <select
                                value={filterVisitorType}
                                onChange={(e) => setFilterVisitorType(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-[#7f98f7] focus:outline-none"
                              >
                                <option value="">{tText(tText("ทั้งหมด", "All Types"), "All Types")}</option>
                                {VISITOR_TYPES.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>

                            {/* Contact Area */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tText(tText("พื้นที่/หน่วยงานปลายทาง", "Destination Contact Area"), "Destination Contact Area")}</label>
                              <select
                                value={filterContactArea}
                                onChange={(e) => setFilterContactArea(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-[#7f98f7] focus:outline-none"
                              >
                                <option value="">{tText(tText("ทั้งหมด", "All Areas"), "All Areas")}</option>
                                {CONTACT_AREAS.map((area) => (
                                  <option key={area} value={area}>{area}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end border-t border-slate-800/60 pt-4 mt-1">
                            {/* Action Filter */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tText(tText("การดำเนินการ", "Action"), "Action")}</label>
                              <select
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-[#7f98f7] focus:outline-none"
                              >
                                <option value="">{tText(tText("ทั้งหมด", "All Actions"), "All Actions")}</option>
                                <option value="check-in">{tText(tText("เช็คอิน (เข้าพื้นที่ เท่านั้น)", "Check-In Only"), "Check-In Only")}</option>
                                <option value="check-out">{tText(tText("เช็คเอาท์ (ออกพื้นที่ เท่านั้น)", "Check-Out Only"), "Check-Out Only")}</option>
                              </select>
                            </div>

                            {/* Keyword Search */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tText(tText("คำค้นหาพิเศษ", "Search Keyword"), "Search Keyword")}</label>
                              <input
                                type="text"
                                value={filterSearch}
                                onChange={(e) => setFilterSearch(e.target.value)}
                                placeholder={tText(tText("พิมพ์ชื่อ, รหัส, บริษัท, ทะเบียนรถ...", "Search name, ID, company, plate..."), "Search name, ID, company, plate...")}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-[#7f98f7] focus:outline-none placeholder:text-slate-650"
                              />
                            </div>

                            {/* Actions Buttons */}
                            <div className="flex items-center gap-2 w-full mt-2 sm:mt-0">
                              <button
                                type="button"
                                onClick={() => fetchDashboardData(getAccessToken() || '')}
                                className="flex-1 bg-[#7f98f7] hover:bg-[#7f98f7]/80 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs transition shadow-lg shadow-[#7f98f7]/10 flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Search className="w-4 h-4" />
                                {tText("อัปเดตการกรองข้อมูล", "Update Filters")}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterPreset('today');
                                  const todayStr = new Date().toISOString().split('T')[0];
                                  setFilterStartDate(todayStr);
                                  setFilterEndDate(todayStr);
                                  setFilterVisitorType('');
                                  setFilterContactArea('');
                                  setFilterAction('');
                                  setFilterSearch('');
                                  fetchDashboardData(getAccessToken() || '', {
                                    startDate: todayStr,
                                    endDate: todayStr,
                                    visitorType: '',
                                    contactArea: '',
                                    action: '',
                                    search: '',
                                  });
                                }}
                                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                title={tText(tText("ล้างค่าตัวกรองทั้งหมดเป็นค่าเริ่มต้น", "Clear all filters to defaults"), "Clear all filters to defaults")}
                              >
                                {tText("ล้างค่ากรอง", "Clear Filters")}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Stat Widget Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                          
                          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                {filterPreset === 'today' ? tText("สถิติเข้าพื้นที่วันนี้", "Total Entry Scans Today") :
                                 filterPreset === 'yesterday' ? tText("สถิติเข้าพื้นที่เมื่อวาน", "Total Entry Scans Yesterday") :
                                 filterPreset === 'all' ? tText("สถิติเข้าพื้นที่ทั้งหมด", "Total Visits Lifetime") :
                                 tText("สถิติเข้าพื้นที่ย้อนหลัง", "Total Entry Scans")}
                              </span>
                              <strong className="text-xl font-black text-slate-100 mt-1 block font-mono">
                                {loadingDashboard ? '...' : `${dashboardStats.totalVisitsToday} ${tText("ครั้ง", "times")}`}
                              </strong>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shrink-0">
                              <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                          </div>

                          <div 
                            onClick={() => {
                              setActiveVisitorsModalFilter('all');
                              setShowActiveVisitorsModal(true);
                            }}
                            className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 shadow-md flex items-center justify-between cursor-pointer transition-all duration-200 group"
                          >
                            <div>
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{tText("ผู้อยู่ในพื้นที่ขณะนี้", "Currently Inside Area")}</span>
                              <strong className="text-xl font-black text-indigo-400 mt-1 block font-mono">
                                {loadingDashboard ? '...' : `${dashboardStats.currentlyInside} ${tText("คน", "persons")}`}
                              </strong>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold group-hover:scale-105 transition shrink-0">
                              <Users className="w-5 h-5 text-indigo-400" />
                            </div>
                          </div>

                          {/* Overstay >24 Hours Card */}
                          <div 
                            onClick={() => {
                              setActiveVisitorsModalFilter('overstay');
                              setShowActiveVisitorsModal(true);
                            }}
                            className={`bg-slate-900/90 border ${overstay24hVisitors.length > 0 ? 'border-rose-500/40 hover:border-rose-500 shadow-rose-950/30' : 'border-slate-800 hover:border-amber-500/40'} rounded-2xl p-4 shadow-md flex items-center justify-between cursor-pointer transition-all duration-200 group relative overflow-hidden`}
                          >
                            {overstay24hVisitors.length > 0 && (
                              <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500"></div>
                            )}
                            <div>
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{tText("ผู้ที่อยู่เกิน 24 ชั่วโมง", "Overstay >24 Hours")}</span>
                              <strong className={`text-xl font-black mt-1 block font-mono ${overstay24hVisitors.length > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                                {loadingDashboard ? '...' : `${overstay24hVisitors.length} ${tText("คน", "persons")}`}
                              </strong>
                            </div>
                            <div className={`w-10 h-10 rounded-xl ${overstay24hVisitors.length > 0 ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400' : 'bg-slate-800/80 border border-slate-700 text-slate-400'} flex items-center justify-center font-bold group-hover:scale-105 transition shrink-0`}>
                              <AlertTriangle className={`w-5 h-5 ${overstay24hVisitors.length > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
                            </div>
                          </div>

                          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{tText("ผู้ลงทะเบียน ยังไม่เช็คอิน", "Registered but Not Checked In")}</span>
                              <strong className="text-xl font-black text-amber-400 mt-1 block font-mono">
                                {loadingDashboard ? '...' : `${dashboardStats.registeredNotCheckedIn ?? 0} ${tText("คน", "persons")}`}
                              </strong>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                              <Clock className="w-5 h-5 text-amber-400" />
                            </div>
                          </div>

                          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{tText("ผู้ใช้ที่โดนระงับ", "Banned/Suspended Users")}</span>
                              <strong className="text-xl font-black text-rose-400 mt-1 block font-mono">
                                {loadingDashboard ? '...' : `${dashboardStats.totalBanned} ${tText("คน", "persons")}`}
                              </strong>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold shrink-0">
                              <Ban className="w-5 h-5 text-rose-400" />
                            </div>
                          </div>

                        </div>

                        {/* Overstayed Visitors Alert Panel */}
                        <div className={`bg-gradient-to-r ${overstay24hVisitors.length > 0 ? 'from-rose-950/50 via-slate-900 to-slate-900 border-rose-500/40 shadow-rose-950/20' : 'from-slate-900 via-slate-900 to-slate-900 border-slate-800'} border rounded-2xl p-5 shadow-xl flex flex-col gap-4 transition-all`}>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl ${overstay24hVisitors.length > 0 ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'} flex items-center justify-center font-bold shrink-0`}>
                                <AlertTriangle className={`w-5 h-5 ${overstay24hVisitors.length > 0 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                              </div>
                              <div>
                                <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                                  {tText("ผู้ที่อยู่เกิน 24 ชั่วโมง (Overstayed > 24h)", "Overstayed Visitors Alert (> 24 Hours)")}
                                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-black border ${overstay24hVisitors.length > 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                    {overstay24hVisitors.length} {tText("คน", "persons")}
                                  </span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {tText("รายชื่อผู้เข้าติดต่อที่เช็คอินเข้าพื้นที่และยังไม่ออกเกิน 24 ชั่วโมงเพื่อความปลอดภัยสูงสุด", "List of visitors currently inside the facility for over 24 hours without checkout.")}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setActiveVisitorsModalFilter('overstay');
                                setShowActiveVisitorsModal(true);
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-extrabold px-3.5 py-2 rounded-xl text-xs border border-slate-700 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                            >
                              <Eye className="w-4 h-4 text-indigo-400" />
                              {tText("ดูรายละเอียดทั้งหมด", "View All Overstayed")}
                            </button>
                          </div>

                          {overstay24hVisitors.length === 0 ? (
                            <div className="py-4 text-center text-slate-500 text-xs flex items-center justify-center gap-2 font-medium">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span>{tText("ไม่มีผู้เข้าติดต่อที่อยู่เกิน 24 ชั่วโมงในขณะนี้ (สถิติปกติ)", "No visitors currently overstaying over 24 hours.")}</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {overstay24hVisitors.slice(0, 6).map((v, idx) => {
                                const durationInfo = getVisitorDurationInfo(v.id, v.status, v.lastActivityAt);
                                return (
                                  <div key={`${v.id}-${idx}`} className="bg-slate-950/80 border border-rose-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-md">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <img
                                        src={getDisplayPhotoUrl(v.photoUrl)}
                                        alt={v.name}
                                        className="w-10 h-10 rounded-lg object-cover border border-slate-800 bg-slate-900 shrink-0"
                                        onError={(e) => {
                                          e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                                        }}
                                      />
                                      <div className="min-w-0">
                                        <h4 className="font-extrabold text-xs text-slate-100 truncate">{v.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-mono">ID: {v.id}</p>
                                        <p className="text-[10px] text-amber-400 truncate">📍 {v.contactArea || 'MainGate'}</p>
                                      </div>
                                    </div>

                                    <div className="flex flex-col items-end shrink-0 gap-1">
                                      <span className="text-[10px] font-black text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded font-mono">
                                        ⏱️ {durationInfo.durationText}
                                      </span>
                                      <button
                                        onClick={() => handleAdminCheckInOut(v.id, 'check-out')}
                                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border border-slate-700"
                                      >
                                        Check-Out
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Charts View */}
                        {loadingDashboard ? (
                          <div className="bg-slate-900 border border-slate-800 h-96 rounded-2xl flex items-center justify-center text-slate-500">
                            {tText("กำลังโหลดชาร์ตวิเคราะห์สถิติเรียลไทม์...", "Loading real-time analytics charts...")}
                          </div>
                        ) : (
                          <DashboardCharts stats={dashboardStats} />
                        )}

                        {/* Recent Activity Log Table */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">{tText(tText("บันทึกกิจกรรมล่าสุด", "Recent Activity Logs"), "Recent Activity Logs")}</h3>
                          
                          {/* Desktop View (Table) */}
                          <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                                  <th className="pb-3 pr-3">{tText(tText("เวลาบันทึก", "Timestamp"), "Timestamp")}</th>
                                  <th className="pb-3 px-3">{tText(tText("ผู้ติดต่อ (รหัส)", "Visitor"), "Visitor")}</th>
                                  <th className="pb-3 px-3">{tText(tText("ประเภท", "Type"), "Type")}</th>
                                  <th className="pb-3 px-3">{tText(tText("พื้นที่ติดต่อ", "Contact Area"), "Contact Area")}</th>
                                  <th className="pb-3 px-3">{tText(tText("การดำเนินการ", "Action"), "Action")}</th>
                                  <th className="pb-3 px-3">{tText(tText("ระยะเวลาอยู่ในพื้นที่", "Duration in Area"), "Duration in Area")}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                                {dashboardStats.recentLogs.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="py-4 text-center text-slate-500">{tText(tText("ไม่มีกิจกรรมการเข้าออกที่ถูกบันทึกในวันนี้", "No check-in/out activity recorded today"), "No check-in/out activity recorded today")}</td>
                                  </tr>
                                ) : (
                                  paginatedLogs.map((log, idx) => (
                                    <tr key={`${log.id}-${idx}`}>
                                      <td className="py-3 pr-3 font-mono text-slate-400">
                                        {new Date(log.timestamp).toLocaleTimeString(lang === 'TH' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}{lang === 'TH' ? ' น.' : ''}
                                      </td>
                                      <td className="py-3 px-3 text-slate-100 font-extrabold">{log.visitorName} ({log.visitorId})</td>
                                      <td className="py-3 px-3">{log.visitorType}</td>
                                      <td className="py-3 px-3">{log.area}</td>
                                      <td className="py-3 px-3">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                          log.action === 'check-in' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-300'
                                        }`}>
                                          {log.action === 'check-in' ? tText(tText("เข้า", "Check-In"), "Check-In") : tText(tText("ออก", "Check-Out"), "Check-Out")}
                                        </span>
                                      </td>
                                      <td className="py-3 px-3">
                                        {(() => {
                                          const durationInfo = getVisitorDurationInfo(log.visitorId, log.action === 'check-in' ? 'checked-in' : 'checked-out', log.timestamp);
                                          if (log.action === 'check-in') {
                                            if (durationInfo.isInside) {
                                              return (
                                                <span className="inline-flex items-center gap-1 font-mono text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-[10px]">
                                                  <Clock className="w-3 h-3 text-emerald-400 animate-pulse" />
                                                  {tText("อยู่ในพื้นที่:", "In area:")} {durationInfo.durationText}
                                                </span>
                                              );
                                            } else {
                                              return (
                                                <span className="inline-flex items-center gap-1 font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md text-[10px]">
                                                  <Clock className="w-3 h-3 text-slate-400" />
                                                  {durationInfo.durationText}
                                                </span>
                                              );
                                            }
                                          } else {
                                            return (
                                              <span className="inline-flex items-center gap-1 font-mono text-slate-400 text-[10px]">
                                                <Clock className="w-3 h-3 text-slate-500" />
                                                {tText("รวมเวลา:", "Total:")} {durationInfo.durationText}
                                              </span>
                                            );
                                          }
                                        })()}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile View (Timeline Cards) */}
                          <div className="block md:hidden flex flex-col gap-3">
                            {dashboardStats.recentLogs.length === 0 ? (
                              <div className="py-8 text-center text-slate-500 text-xs">{tText(tText("ไม่มีกิจกรรมการเข้าออกที่ถูกบันทึกในวันนี้", "No check-in/out activity recorded today"), "No check-in/out activity recorded today")}</div>
                            ) : (
                              paginatedLogs.map((log, idx) => (
                                <div key={`${log.id}-${idx}`} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-2 shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] text-slate-500 font-bold">
                                      {new Date(log.timestamp).toLocaleTimeString(lang === 'TH' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}{lang === 'TH' ? ' น.' : ''}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      log.action === 'check-in' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10' : 'bg-slate-800 text-slate-400'
                                    }`}>
                                      {log.action === 'check-in' ? tText(tText("เข้า", "In"), "In") : tText(tText("ออก", "Out"), "Out")}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-extrabold text-xs text-slate-200">{log.visitorName}</h4>
                                    <p className="font-mono text-[9px] text-slate-500 mt-0.5">{tText("รหัสผู้ติดต่อ:", "Visitor ID:")} {log.visitorId}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-slate-900 text-[10px] text-slate-400">
                                    <div>
                                      <span className="block text-[8px] uppercase font-bold text-slate-600">{tText(tText("ประเภท", "Type"), "Type")}</span>
                                      <span className="font-medium text-slate-300">{log.visitorType}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[8px] uppercase font-bold text-slate-600">{tText(tText("พื้นที่ติดต่อ", "Contact Area"), "Contact Area")}</span>
                                      <span className="font-medium text-slate-300 truncate block">{log.area}</span>
                                    </div>
                                  </div>
                                  <div className="mt-1 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
                                    <span className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      {tText("ระยะเวลาอยู่ในพื้นที่:", "Duration in area:")}
                                    </span>
                                    {(() => {
                                      const durationInfo = getVisitorDurationInfo(log.visitorId, log.action === 'check-in' ? 'checked-in' : 'checked-out', log.timestamp);
                                      return (
                                        <span className={`font-mono font-bold ${durationInfo.isInside ? 'text-emerald-400' : 'text-slate-300'}`}>
                                          {durationInfo.durationText}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Pagination Controls for Activity Logs */}
                          {Math.ceil(dashboardStats.recentLogs.length / logsPageSize) > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/60 pt-4 mt-2">
                              <div className="text-[11px] text-slate-400 font-medium">
                                {tText("แสดง", "Showing")}{" "}
                                <span className="text-slate-200 font-bold">{dashboardStats.recentLogs.length > 0 ? (logsCurrentPage - 1) * logsPageSize + 1 : 0}</span>{" "}
                                {tText("ถึง", "to")}{" "}
                                <span className="text-slate-200 font-bold">{Math.min((logsCurrentPage - 1) * logsPageSize + logsPageSize, dashboardStats.recentLogs.length)}</span>{" "}
                                {tText("จาก", "of")}{" "}
                                <span className="text-slate-200 font-bold">{dashboardStats.recentLogs.length}</span>{" "}
                                {tText("รายการ", "entries")}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={logsCurrentPage === 1}
                                  onClick={() => setLogsCurrentPage(prev => Math.max(prev - 1, 1))}
                                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 flex items-center justify-center cursor-pointer select-none"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="text-xs text-slate-300 font-bold px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
                                  {tText("หน้า", "Page")} {logsCurrentPage} / {Math.ceil(dashboardStats.recentLogs.length / logsPageSize)}
                                </div>
                                <button
                                  type="button"
                                  disabled={logsCurrentPage === Math.ceil(dashboardStats.recentLogs.length / logsPageSize)}
                                  onClick={() => setLogsCurrentPage(prev => Math.min(prev + 1, Math.ceil(dashboardStats.recentLogs.length / logsPageSize)))}
                                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 flex items-center justify-center cursor-pointer select-none"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ADMIN VIEW 2: VISITORS & BAN MANAGEMENT */}
                    {adminTab === 'visitors' && !!roleMenuPermissions[loggedInSystemUser?.role]?.admin_visitors && (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-100">{tText(tText("รายชื่อผู้ถือใบผ่านเข้าพื้นที่ล่าสุด", "Recent Pass Holder Database"), "Recent Pass Holder Database")}</h3>
                            <p className="text-xs text-slate-400">{tText(tText("ระงับสิทธิ์ (แบน) หรืออนุมัติการตรวจสอบประวัติของบุคคลภายนอก", "Suspend or approve external visitor security clearances"), "Suspend or approve external visitor security clearances")}</p>
                          </div>
                          
                          <input
                            type="text"
                            value={visitorSearch}
                            onChange={(e) => setVisitorSearch(e.target.value)}
                            placeholder={tText(tText("ค้นหาชื่อ, รหัส, บริษัท...", "Search name, ID, company..."), "Search name, ID, company...")}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs focus:border-amber-500 focus:outline-none w-full sm:w-64"
                          />
                        </div>

                        {/* Ban modal overlay popup */}
                        {bannedVisitorId && (
                          <div className="bg-slate-950 border border-rose-500/30 rounded-2xl p-4 flex flex-col gap-3">
                            <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Ban className="w-4 h-4" /> {tText("ระบบบันทึกพฤติกรรมความเสี่ยง (แบนผู้ใช้)", "Risk Behavior Log")}
                            </h4>
                            <form onSubmit={handleBanSubmit} className="flex gap-3">
                              <input
                                type="text"
                                required
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                placeholder={tText(tText("ระบุสาเหตุการแบน เช่น ขับรถเร็วเกินกำหนด, ไม่สวมหมวกนิรภัย", "Specify reason"), "Specify reason")}
                                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 text-xs focus:border-rose-500 focus:outline-none"
                              />
                              <button
                                type="submit"
                                disabled={submittingBan}
                                className="bg-rose-600 hover:bg-rose-500 text-slate-100 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer"
                              >
                                {tText("ยืนยันแบน", "Confirm Ban")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setBannedVisitorId(null)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-3 rounded-xl text-xs cursor-pointer"
                              >
                                {tText("ยกเลิก", "Cancel")}
                              </button>
                            </form>
                          </div>
                        )}

                        {/* Desktop View (Table) */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                                <th className="pb-3 pr-3">{tText(tText("รูปภาพ", "Photo"), "Photo")}</th>
                                <th className="pb-3 px-3">{tText(tText("ผู้ถือใบผ่าน (รหัส)", "Pass Holder"), "Pass Holder")}</th>
                                <th className="pb-3 px-3">{tText(tText("บริษัท / ประเภท", "Company / Type"), "Company / Type")}</th>
                                <th className="pb-3 px-3">{tText(tText("สถานะพื้นที่", "Gate Status"), "Gate Status")}</th>
                                <th className="pb-3 pl-3 text-right">{tText(tText("สิทธิ์ / การดำเนินการ", "Cleared Status / Actions"), "Cleared Status / Actions")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                              {filteredVisitors.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">{tText(tText("ไม่มีข้อมูลผู้ใช้สอดคล้องตามเกณฑ์ค้นหา", "No profiles match current query"), "No profiles match current query")}</td>
                                </tr>
                              ) : (
                                paginatedVisitors.map((visitor, idx) => (
                                  <tr key={`${visitor.id}-${idx}`}>
                                    <td className="py-3 pr-3">
                                      <img 
                                        src={getDisplayPhotoUrl(visitor.photoUrl)} 
                                        alt={visitor.name} 
                                        className="w-10 h-10 rounded-lg object-cover border border-slate-800 bg-slate-950" 
                                        onError={(e) => {
                                          e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                                        }}
                                      />
                                    </td>
                                    <td className="py-3 px-3">
                                      <h4 className="font-extrabold text-slate-100 text-sm">{visitor.name}</h4>
                                      <p className="font-mono text-[10px] text-slate-400 mt-0.5">{visitor.id}</p>
                                    </td>
                                    <td className="py-3 px-3">
                                      <span className="block font-bold text-slate-300">{visitor.company}</span>
                                      <span className="text-[10px] text-slate-500">{visitor.visitorType}</span>
                                    </td>
                                    <td className="py-3 px-3">
                                      {(() => {
                                        const badge = getVisitorStatusBadge(visitor.status, lang === 'EN');
                                        const durationInfo = getVisitorDurationInfo(visitor.id, visitor.status, visitor.lastActivityAt);
                                        return (
                                          <div className="flex flex-col gap-1 items-start">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.className}`}>
                                              {badge.text}
                                            </span>
                                            {durationInfo.isInside && (
                                              <span className="inline-flex items-center gap-1 font-mono text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-[9.5px]">
                                                <Clock className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                                                {durationInfo.durationText}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </td>
                                    <td className="py-3 pl-3 text-right">
                                      <div className="flex gap-1.5 justify-end items-center">
                                        <button
                                          onClick={() => {
                                            setNewPass(visitor);
                                            setActiveTab('pass');
                                          }}
                                          className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 text-xs transition duration-150 cursor-pointer"
                                          title={tText(tText("ดูใบผ่านและพิมพ์ใบผ่าน", "View & Print Pass"), "View & Print Pass")}
                                        >
                                          <Printer className="w-3.5 h-3.5" /> {tText("พิมพ์ใบผ่าน", "Print Pass")}
                                        </button>

                                        {visitor.status === 'banned' ? (
                                          <button
                                            onClick={() => handleUnban(visitor.id)}
                                            className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 border border-emerald-500/10 text-xs"
                                          >
                                            Unban
                                          </button>
                                        ) : (
                                          <>
                                            {visitor.status && visitor.status.startsWith(tText(tText("เช็คเอาท์โดย", "Checked-out by"), "Checked-out by")) ? (
                                              <span className="text-[10px] text-slate-500 font-extrabold px-2 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                                                🔒 {tText("เช็คเอาท์แล้ว (ต้องลงทะเบียนใหม่)", "Checked out")}
                                              </span>
                                            ) : visitor.status && visitor.status.startsWith(tText(tText("เช็คอินโดย", "Checked-in by"), "Checked-in by")) ? (
                                              <button
                                                onClick={() => handleAdminCheckInOut(visitor.id, 'check-out')}
                                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg font-bold text-xs cursor-pointer"
                                              >
                                                Check-Out
                                              </button>
                                            ) : (
                                              <button
                                                onClick={() => handleAdminCheckInOut(visitor.id, 'check-in')}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-slate-100 px-2.5 py-1.5 rounded-lg font-bold text-xs cursor-pointer"
                                              >
                                                Check-In
                                              </button>
                                            )}

                                            <button
                                              onClick={() => setBannedVisitorId(visitor.id)}
                                              className="bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-slate-950 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 border border-rose-500/10 text-xs cursor-pointer"
                                            >
                                              Ban
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile View (Polished Visitor Cards) */}
                        <div className="block md:hidden flex flex-col gap-4">
                          {filteredVisitors.length === 0 ? (
                            <div className="py-8 text-center text-slate-500 text-xs font-mono">{tText(tText("ไม่มีข้อมูลผู้ใช้สอดคล้องตามเกณฑ์ค้นหา", "No profiles match current query"), "No profiles match current query")}</div>
                          ) : (
                            paginatedVisitors.map((visitor, idx) => (
                              <div key={`${visitor.id}-${idx}`} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-md">
                                <div className="flex items-start gap-3">
                                  <img 
                                    src={getDisplayPhotoUrl(visitor.photoUrl)} 
                                    alt={visitor.name} 
                                    className="w-14 h-14 rounded-xl object-cover border border-slate-800 bg-slate-900 shrink-0" 
                                    onError={(e) => {
                                      e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-extrabold text-sm text-slate-100 truncate">{visitor.name}</h4>
                                    <p className="font-mono text-[9px] text-slate-500 mt-0.5">ID: {visitor.id}</p>
                                    <p className="text-xs text-slate-300 font-bold mt-1 truncate">{visitor.company}</p>
                                    <span className="text-[10px] text-slate-500">{visitor.visitorType}</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/55 text-xs">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">{tText(tText("พื้นที่ติดต่อ", "Contact Area"), "Contact Area")}</span>
                                    <span className="font-medium text-slate-300 font-mono text-[10px]">{visitor.contactArea || tText(tText("ยังไม่กำหนด", "Not set"), "Not set")}</span>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    {(() => {
                                      const badge = getVisitorStatusBadge(visitor.status, lang === 'EN');
                                      const durationInfo = getVisitorDurationInfo(visitor.id, visitor.status, visitor.lastActivityAt);
                                      return (
                                        <>
                                          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold ${badge.className}`}>
                                            {badge.text}
                                          </span>
                                          {durationInfo.isInside && (
                                            <span className="inline-flex items-center gap-1 font-mono text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-[9px]">
                                              <Clock className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                                              {durationInfo.durationText}
                                            </span>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-1">
                                  {visitor.status === 'banned' ? (
                                    <button
                                      onClick={() => handleUnban(visitor.id)}
                                      className="col-span-2 flex items-center justify-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 py-2.5 rounded-xl font-bold text-xs cursor-pointer min-h-[44px]"
                                    >
                                      Unban
                                    </button>
                                  ) : (
                                    <>
                                      {visitor.status && visitor.status.startsWith(tText(tText("เช็คเอาท์โดย", "Checked-out by"), "Checked-out by")) ? (
                                        <span className="col-span-2 text-center text-[10px] text-slate-500 font-extrabold px-2 py-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                                          🔒 {tText("เช็คเอาท์แล้ว (ต้องลงทะเบียนใหม่)", "Checked out")}
                                        </span>
                                      ) : (
                                        <>
                                          {visitor.status && visitor.status.startsWith(tText(tText("เช็คอินโดย", "Checked-in by"), "Checked-in by")) ? (
                                            <button
                                              onClick={() => handleAdminCheckInOut(visitor.id, 'check-out')}
                                              className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl font-bold text-xs cursor-pointer min-h-[44px]"
                                            >
                                              Check-Out
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => handleAdminCheckInOut(visitor.id, 'check-in')}
                                              className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-slate-100 py-2.5 rounded-xl font-bold text-xs cursor-pointer min-h-[44px]"
                                            >
                                              Check-In
                                            </button>
                                          )}

                                          <button
                                            onClick={() => setBannedVisitorId(visitor.id)}
                                            className="flex items-center justify-center gap-1 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 py-2.5 rounded-xl font-bold text-xs cursor-pointer min-h-[44px]"
                                          >
                                            Ban
                                          </button>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    setNewPass(visitor);
                                    setActiveTab('pass');
                                  }}
                                  className="w-full flex items-center justify-center gap-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer mt-2 transition duration-150 min-h-[44px]"
                                >
                                  <Printer className="w-3.5 h-3.5" /> {tText("ดูและพิมพ์ใบผ่านเก่า", "View & Print Previous Pass")}
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Pagination Controls for Visitors List */}
                        {Math.ceil(filteredVisitors.length / visitorsPageSize) > 1 && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/60 pt-4 mt-2">
                            <div className="text-[11px] text-slate-400 font-medium">
                              {tText("แสดง", "Showing")}{" "}
                              <span className="text-slate-200 font-bold">{filteredVisitors.length > 0 ? (visitorsCurrentPage - 1) * visitorsPageSize + 1 : 0}</span>{" "}
                              {tText("ถึง", "to")}{" "}
                              <span className="text-slate-200 font-bold">{Math.min((visitorsCurrentPage - 1) * visitorsPageSize + visitorsPageSize, filteredVisitors.length)}</span>{" "}
                              {tText("จาก", "of")}{" "}
                              <span className="text-slate-200 font-bold">{filteredVisitors.length}</span>{" "}
                              {tText("รายการ", "entries")}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={visitorsCurrentPage === 1}
                                onClick={() => setVisitorsCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 flex items-center justify-center cursor-pointer select-none"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <div className="text-xs text-slate-300 font-bold px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
                                {tText("หน้า", "Page")} {visitorsCurrentPage} / {Math.ceil(filteredVisitors.length / visitorsPageSize)}
                              </div>
                              <button
                                type="button"
                                disabled={visitorsCurrentPage === Math.ceil(filteredVisitors.length / visitorsPageSize)}
                                onClick={() => setVisitorsCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredVisitors.length / visitorsPageSize)))}
                                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 flex items-center justify-center cursor-pointer select-none"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ADMIN VIEW: SYSTEM USERS & STAFF ACCOUNTS */}
                    {adminTab === 'staff' && !!(roleMenuPermissions[loggedInSystemUser?.role]?.admin_staff ?? roleMenuPermissions[loggedInSystemUser?.role]?.admin_visitors) && (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-5">
                        {/* System Users / Staff Management List */}
                        <div className="text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-5 h-5 text-blue-400" />
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-100">{tText("บัญชีเจ้าหน้าที่ผู้ใช้งานระบบ", "System User / Staff Accounts")} ({filteredStaff.length})</h4>
                                <p className="text-[11px] text-slate-400">{tText(tText("รายชื่อเจ้าหน้าที่รักษาความปลอดภัยและแอดมินที่มีสิทธิเข้าใช้งานแผงควบคุม", "Guards and Administrators authorized to access the system dashboard"), "Guards and Administrators authorized to access the system dashboard")}</p>
                              </div>
                            </div>
                            
                            {/* Actions and Search bar for Staff */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                              {(loggedInSystemUser?.role.includes('Administrator') || loggedInSystemUser?.role.includes('Manager')) && (
                                <button
                                  type="button"
                                  onClick={openStaffCreate}
                                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-3 rounded-xl shadow transition duration-150 cursor-pointer text-xs flex items-center justify-center gap-1.5 shrink-0"
                                >
                                  <UserPlus className="w-3.5 h-3.5" /> {tText("เพิ่มบัญชีผู้ใช้งานใหม่", "Add New System User")}
                                </button>
                              )}
                              
                              <div className="w-full sm:w-64 relative">
                                <input
                                  type="text"
                                  value={staffSearch}
                                  onChange={(e) => {
                                    setStaffSearch(e.target.value);
                                    setStaffCurrentPage(1);
                                  }}
                                  placeholder={tText(tText("ค้นหาชื่อเจ้าหน้าที่...", "Search guard name..."), "Search guard name...")}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-bold placeholder:text-slate-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Desktop View (Table) */}
                          <div className="hidden md:block overflow-x-auto bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                                  <th className="pb-2 pr-3">{tText(tText("ชื่อ-นามสกุล", "Full Name"), "Full Name")}</th>
                                  <th className="pb-2 px-3">Username</th>
                                  <th className="pb-2 px-3">{tText(tText("บทบาท / ตำแหน่ง", "Role / Title"), "Role / Title")}</th>
                                  {(loggedInSystemUser?.role.includes('Administrator') || loggedInSystemUser?.role.includes('Manager')) && (
                                    <th className="pb-2 px-3 text-center">{tText(tText("การจัดการ", "Actions"), "Actions")}</th>
                                  )}
                                  <th className="pb-2 pl-3 text-right">{tText(tText("วันที่ลงทะเบียน", "Registration Date"), "Registration Date")}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/40 font-medium text-slate-400">
                                {paginatedStaff.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="py-6 text-center text-slate-500 font-mono text-xs">{tText(tText("ไม่พบรายชื่อเจ้าหน้าที่ที่ตรงกับเงื่อนไขค้นหา", "No system user records match search filter"), "No system user records match search filter")}</td>
                                  </tr>
                                ) : (
                                  paginatedStaff.map((user, idx) => (
                                  <tr key={idx} className="hover:bg-slate-800/20">
                                    <td className="py-2.5 pr-3">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-[#7f98f7]/10 border border-[#7f98f7]/25 text-[#7f98f7] flex items-center justify-center font-black text-[10px] shadow-inner shrink-0 overflow-hidden">
                                          {user.avatar ? (
                                            <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                                          ) : (
                                            user.name.charAt(0).toUpperCase()
                                          )}
                                        </div>
                                        <span className="text-slate-200 font-semibold">{user.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-slate-300">{user.username}</td>
                                    <td className="py-2.5 px-3">
                                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                        user.role.includes('Administrator') 
                                          ? 'bg-amber-500/10 text-amber-400' 
                                          : user.role.includes('Manager')
                                          ? 'bg-purple-500/10 text-purple-400'
                                          : user.role.includes('Supervisor')
                                          ? 'bg-indigo-500/10 text-indigo-400'
                                          : 'bg-blue-500/10 text-blue-400'
                                      }`}>
                                        {user.role}
                                      </span>
                                    </td>
                                    {(loggedInSystemUser?.role.includes('Administrator') || loggedInSystemUser?.role.includes('Manager')) && (
                                      <td className="py-2.5 px-3 text-center">
                                        <button
                                          onClick={() => openStaffEdit(user)}
                                          className="bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition duration-150 flex items-center justify-center gap-1 mx-auto"
                                        >
                                          <Edit3 className="w-3 h-3" /> {tText("แก้ไขข้อมูล", "Edit User")}
                                        </button>
                                      </td>
                                    )}
                                    <td className="py-2.5 pl-3 text-right font-mono text-[10px] text-slate-500">
                                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH', { dateStyle: 'short' }) : tText(tText("ระบบตั้งต้น", "Default system preset"), "Default system preset")}
                                    </td>
                                  </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile View (Polished List Cards) */}
                          <div className="block md:hidden flex flex-col gap-2.5">
                            {paginatedStaff.length === 0 ? (
                              <div className="py-6 text-center text-slate-500 font-mono text-xs">{tText(tText("ไม่พบรายชื่อเจ้าหน้าที่ที่ตรงกับเงื่อนไขค้นหา", "No system user records match search filter"), "No system user records match search filter")}</div>
                            ) : (
                              paginatedStaff.map((user, idx) => (
                                <div key={idx} className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-md bg-[#7f98f7]/10 border border-[#7f98f7]/25 text-[#7f98f7] flex items-center justify-center font-black text-[9px] shadow-inner shrink-0 overflow-hidden">
                                        {user.avatar ? (
                                          <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                                        ) : (
                                          user.name.charAt(0).toUpperCase()
                                        )}
                                      </div>
                                      <h5 className="font-bold text-xs text-slate-200">{user.name}</h5>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                      user.role.includes('Administrator') 
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                        : user.role.includes('Manager')
                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                        : user.role.includes('Supervisor')
                                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    }`}>
                                      {user.role}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900/60 text-[10px]">
                                    <div>
                                      <span className="text-slate-500 block text-[8px] uppercase font-bold">Username</span>
                                      <span className="font-mono text-slate-300">@{user.username}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-slate-500 block text-[8px] uppercase font-bold">{tText(tText("วันที่ลงทะเบียน", "Registration Date"), "Registration Date")}</span>
                                      <span className="font-mono text-slate-400">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH', { dateStyle: 'short' }) : tText(tText("ระบบตั้งต้น", "Default system preset"), "Default system preset")}
                                      </span>
                                    </div>
                                  </div>
                                  {(loggedInSystemUser?.role.includes('Administrator') || loggedInSystemUser?.role.includes('Manager')) && (
                                    <div className="pt-2 border-t border-slate-900/40 flex justify-end">
                                      <button
                                        onClick={() => openStaffEdit(user)}
                                        className="bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition duration-150 flex items-center gap-1"
                                      >
                                        <Edit3 className="w-3 h-3" /> {tText("แก้ไขข้อมูล & สิทธิ์", "Edit Info & Permissions")}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>

                          {/* Pagination Controls for Staff List */}
                          {Math.ceil(filteredStaff.length / staffPageSize) > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/60 pt-4 mt-4">
                              <div className="text-[11px] text-slate-400 font-medium">
                                {tText("แสดง", "Showing")}{" "}
                                <span className="text-slate-200 font-bold">{filteredStaff.length > 0 ? (staffCurrentPage - 1) * staffPageSize + 1 : 0}</span>{" "}
                                {tText("ถึง", "to")}{" "}
                                <span className="text-slate-200 font-bold">{Math.min((staffCurrentPage - 1) * staffPageSize + staffPageSize, filteredStaff.length)}</span>{" "}
                                {tText("จาก", "of")}{" "}
                                <span className="text-slate-200 font-bold">{filteredStaff.length}</span>{" "}
                                {tText("คน", "users")}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={staffCurrentPage === 1}
                                  onClick={() => setStaffCurrentPage(prev => Math.max(prev - 1, 1))}
                                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 flex items-center justify-center cursor-pointer select-none"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <div className="text-xs text-slate-300 font-bold px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg">
                                  {tText("หน้า", "Page")} {staffCurrentPage} / {Math.ceil(filteredStaff.length / staffPageSize)}
                                </div>
                                <button
                                  type="button"
                                  disabled={staffCurrentPage === Math.ceil(filteredStaff.length / staffPageSize)}
                                  onClick={() => setStaffCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredStaff.length / staffPageSize)))}
                                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 flex items-center justify-center cursor-pointer select-none"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ADMIN VIEW: REAL-TIME ONLINE USERS MONITORING DASHBOARD */}
                    {adminTab === 'online' && (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-6 animate-fadeIn">
                        {/* Header & Refresh */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                              <Wifi className="w-5 h-5 text-emerald-400 animate-pulse" /> 
                              {tText("สถานะผู้ใช้งานออนไลน์แบบ Real-time", "Real-time Online Users Status")}
                              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ml-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                {onlineUsersCount} {tText("คนออนไลน์", "Online")}
                              </span>
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                              {tText("ตรวจสอบรายชื่อเจ้าหน้าที่และแอดมินที่กำลังเปิดใช้งานระบบอยู่ในขณะนี้ พร้อมจุดตรวจและตำแหน่งหน้าต่างการทำงานล่าสุด", "Monitor active guards and system administrators online in real-time, including duty stations and active app screens.")}
                            </p>
                          </div>

                          <button
                            onClick={async () => {
                              setIsFetchingOnline(true);
                              try {
                                const res = await fetch('/api/online-users');
                                if (res.ok) {
                                  const data = await res.json();
                                  setOnlineUsersList(data.sessions || []);
                                  setOnlineUsersCount(data.onlineCount || 0);
                                }
                              } catch (e) {}
                              setIsFetchingOnline(false);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer self-start sm:self-auto shrink-0 min-h-[38px]"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isFetchingOnline ? 'animate-spin' : ''}`} />
                            {tText("อัปเดตข้อมูลสด", "Refresh Live")}
                          </button>
                        </div>

                        {/* Metric Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">{tText("ออนไลน์ขณะนี้", "Currently Online")}</span>
                              <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black font-mono text-emerald-300">{onlineUsersList.length}</span>
                              <span className="text-xs text-emerald-500 font-bold">{tText("เซสชัน", "sessions")}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-2 block font-medium">🟢 {tText("อัปเดตอัตโนมัติทุก 6 วินาที", "Auto-syncs every 6s")}</span>
                          </div>

                          <div className="bg-slate-950/80 border border-blue-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] uppercase font-black text-blue-400 tracking-wider">{tText("รปภ. ประจำจุดตรวจ", "Guards On Duty")}</span>
                              <MapPin className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black font-mono text-blue-300">
                                {onlineUsersList.filter(u => u.activeCheckpoint).length}
                              </span>
                              <span className="text-xs text-blue-500 font-bold">{tText("จุดตรวจ", "stations")}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-2 block font-medium">📍 {tText("ประจำการตามด่านสแกน", "Assigned to gate stations")}</span>
                          </div>

                          <div className="bg-slate-950/80 border border-purple-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] uppercase font-black text-purple-400 tracking-wider">{tText("แอดมินออนไลน์", "Active Admins")}</span>
                              <Shield className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black font-mono text-purple-300">
                                {onlineUsersList.filter(u => String(u.role || '').toLowerCase().includes('admin') || String(u.role || '').toLowerCase().includes('ผู้ดูแล')).length}
                              </span>
                              <span className="text-xs text-purple-500 font-bold">{tText("ท่าน", "users")}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-2 block font-medium">🛡️ {tText("เข้าใช้งานแผงควบคุม", "Accessing admin portal")}</span>
                          </div>

                          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">{tText("สถานะระบบเซิร์ฟเวอร์", "Server Status")}</span>
                              <Zap className="w-4 h-4 text-amber-400" />
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {tText("ปกติ (Online)", "Healthy")}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-2 block font-mono font-bold">⚡ Heartbeat Active</span>
                          </div>
                        </div>

                        {/* Search & Role Filter Toolbar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                          <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={onlineSearchQuery}
                              onChange={(e) => setOnlineSearchQuery(e.target.value)}
                              placeholder={tText("ค้นหาผู้ใช้งาน, Username, จุดตรวจ หรือตำแหน่ง...", "Search username, name, checkpoint, or tab...")}
                              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:border-blue-500 outline-none transition placeholder:text-slate-500"
                            />
                            {onlineSearchQuery && (
                              <button
                                onClick={() => setOnlineSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={onlineRoleFilter}
                              onChange={(e) => setOnlineRoleFilter(e.target.value)}
                              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:border-blue-500 outline-none cursor-pointer"
                            >
                              <option value="all">{tText("แสดงทุกบทบาท", "All Roles")}</option>
                              <option value="admin">{tText("เฉพาะผู้ดูแลระบบ (Admins)", "Admins Only")}</option>
                              <option value="guard">{tText("เฉพาะเจ้าหน้าที่ รปภ. (Guards)", "Guards Only")}</option>
                              <option value="staff">{tText("เฉพาะพนักงานทั่วไป (Staff)", "Staff Only")}</option>
                            </select>
                          </div>
                        </div>

                        {/* Online Users Cards / List */}
                        {(() => {
                          const filtered = onlineUsersList.filter(user => {
                            const query = onlineSearchQuery.toLowerCase().trim();
                            const matchesQuery = !query || 
                              String(user.name || '').toLowerCase().includes(query) ||
                              String(user.username || '').toLowerCase().includes(query) ||
                              String(user.role || '').toLowerCase().includes(query) ||
                              String(user.activeCheckpoint || '').toLowerCase().includes(query) ||
                              String(user.currentTab || '').toLowerCase().includes(query);

                            let matchesRole = true;
                            if (onlineRoleFilter === 'admin') {
                              matchesRole = String(user.role || '').toLowerCase().includes('admin') || String(user.role || '').toLowerCase().includes('ผู้ดูแล');
                            } else if (onlineRoleFilter === 'guard') {
                              matchesRole = String(user.role || '').toLowerCase().includes('guard') || String(user.role || '').toLowerCase().includes('รักษาความปลอดภัย') || String(user.role || '').toLowerCase().includes('รปภ');
                            } else if (onlineRoleFilter === 'staff') {
                              matchesRole = String(user.role || '').toLowerCase().includes('staff') || String(user.role || '').toLowerCase().includes('พนักงาน');
                            }

                            return matchesQuery && matchesRole;
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3">
                                <Wifi className="w-10 h-10 text-slate-700" />
                                <h4 className="text-sm font-bold text-slate-400">
                                  {tText("ไม่พบผู้ใช้งานออนไลน์ตรงตามเงื่อนไข", "No online users match your filters")}
                                </h4>
                                <p className="text-xs text-slate-500 max-w-sm">
                                  {tText("ระบบจะแสดงรายชื่อเจ้าหน้าที่และแอดมินอัตโนมัติทันทีที่มีการส่งสัญญาณเข้าสู่ระบบ", "Active users will appear here automatically when logged into the application.")}
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filtered.map((user) => {
                                const now = Date.now();
                                const inactiveSec = Math.floor((now - (user.lastActiveAt || now)) / 1000);
                                const isIdle = inactiveSec > 30;
                                const loginMinAgo = Math.floor((now - (user.loginTime || user.lastActiveAt || now)) / 60000);

                                const isCurrentUser = Boolean(loggedInSystemUser?.username) && String(loggedInSystemUser?.username || '').toLowerCase() === String(user?.username || '').toLowerCase();
                                const isUserAdmin = String(user.role || '').toLowerCase().includes('admin') || String(user.role || '').toLowerCase().includes('ผู้ดูแล');

                                return (
                                  <div 
                                    key={user.username}
                                    className={`bg-slate-950 border rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all duration-200 hover:border-slate-700 shadow-lg relative overflow-hidden ${
                                      isCurrentUser ? 'border-blue-500/40 bg-slate-900/40' : 'border-slate-800/80'
                                    }`}
                                  >
                                    {/* User Header */}
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-center gap-3">
                                        {/* Avatar with live pulse badge */}
                                        <div className="relative shrink-0">
                                          {user.avatar ? (
                                            <img 
                                              src={user.avatar} 
                                              alt={user.name} 
                                              className="w-11 h-11 rounded-xl object-cover border border-slate-700 shadow-inner"
                                            />
                                          ) : (
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-base flex items-center justify-center border border-blue-400/30 shadow">
                                              {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                          {/* Active Status Pulse Dot */}
                                          <span 
                                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                                              isIdle ? 'bg-amber-400' : 'bg-emerald-400'
                                            }`}
                                            title={isIdle ? 'Idle / พักใช้งาน' : 'Active / กำลังใช้งาน'}
                                          >
                                            {!isIdle && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>}
                                          </span>
                                        </div>

                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <h4 className="text-xs font-black text-slate-100 truncate">{user.name}</h4>
                                            {isCurrentUser && (
                                              <span className="bg-blue-500/20 text-blue-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded border border-blue-500/30">
                                                {tText("คุณ", "You")}
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[10px] font-mono text-slate-400 block truncate">@{user.username}</span>
                                        </div>
                                      </div>

                                      {/* Status Tag */}
                                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${
                                        isIdle 
                                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isIdle ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                                        {isIdle ? tText("พักใช้งาน", "Idle") : tText("ออนไลน์", "Active")}
                                      </span>
                                    </div>

                                    {/* Info Block */}
                                    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2 text-xs">
                                      <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-500 font-bold flex items-center gap-1">
                                          <Shield className="w-3 h-3 text-purple-400" /> {tText("บทบาท:", "Role:")}
                                        </span>
                                        <span className={`font-bold px-2 py-0.5 rounded-lg text-[10px] ${
                                          isUserAdmin ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                                        }`}>
                                          {user.role}
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-500 font-bold flex items-center gap-1">
                                          <MapPin className="w-3 h-3 text-blue-400" /> {tText("จุดตรวจประจำการ:", "Station:")}
                                        </span>
                                        <span className="font-bold text-slate-200 text-[10px] truncate max-w-[140px]">
                                          {user.activeCheckpoint ? `📍 ${user.activeCheckpoint}` : `— ${tText("ไม่ได้ประจำจุด", "None")}`}
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-500 font-bold flex items-center gap-1">
                                          <Eye className="w-3 h-3 text-indigo-400" /> {tText("หน้าต่างล่าสุด:", "Active Screen:")}
                                        </span>
                                        <span className="font-mono text-slate-300 text-[10px] truncate max-w-[140px]">
                                          {user.currentTab || 'Gate'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Session Timestamps & Actions */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="flex items-center gap-1 font-mono text-slate-400">
                                          <Clock className="w-3 h-3 text-slate-500" />
                                          {tText("เข้าเมื่อ:", "Online:")} {loginMinAgo < 1 ? tText("เมื่อสักครู่", "Just now") : `${loginMinAgo} ${tText("นาทีที่แล้ว", "m ago")}`}
                                        </span>
                                        <span className="text-slate-500 font-mono">
                                          Signal: {inactiveSec <= 0 ? tText("เมื่อสักครู่", "Just now") : `${inactiveSec}s ago`} {user.ip ? `• ${user.ip}` : ''}
                                        </span>
                                      </div>

                                      {/* Force Logout Action for Super Admin / Admin */}
                                      {(loggedInSystemUser?.role?.includes('Administrator') || loggedInSystemUser?.role?.includes('Super Admin')) && !isCurrentUser && (
                                        <button
                                          onClick={() => handleForceLogoutUser(user.username)}
                                          className="bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer text-[10px] flex items-center gap-1 shrink-0"
                                          title={tText("สั่งเตะผู้ใช้นี้ออกจากระบบ", "Force logout user")}
                                        >
                                          <LogOut className="w-3 h-3" />
                                          {tText("เตะออก", "Kick")}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* ADMIN VIEW 3: INTERACTIVE PDF REPORT EXPORTER WITH BEAUTIFUL CHARTS */}
                    {adminTab === 'reports' && !!roleMenuPermissions[loggedInSystemUser?.role]?.admin_reports && (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-500" /> {tText("ระบบจัดทำและส่งออกรายงานประวัติ PDF", "PDF History Report Exporter System")}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                              {tText("เลือกกรองช่วงเวลา ออกแบบดีไซน์เทมเพลต และสั่งส่งออกรายงานเอกสารความปลอดภัยเป็นไฟล์ PDF คุณภาพสูง พร้อมกราฟสรุปสถิติที่สวยงาม", "Configure range, select theme style, and export high-quality security reports with beautiful analytics charts.")}
                            </p>
                          </div>
                        </div>

                        {/* Two-Column Workspace Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          
                          {/* COLUMN 1: CONTROLS & SETTINGS (4 Cols) */}
                          <div className="lg:col-span-4 flex flex-col gap-5">
                            
                            {/* Card: Configuration Panel */}
                            <div className="border border-slate-800 bg-slate-950 p-5 rounded-2xl flex flex-col gap-4">
                              <span className="text-xs font-black uppercase text-blue-400 tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800/60">
                                <Sliders className="w-4 h-4 text-blue-400" /> {tText("ตั้งค่าโครงสร้างรายงาน", "Report Structure Settings")}
                              </span>

                              {/* 1. Report Preset Selection */}
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> {tText("เลือกช่วงเวลาของรายงาน", "Select Report Period")}
                                </label>
                                <select
                                  value={pdfReportPreset}
                                  onChange={(e) => {
                                    const preset = e.target.value as any;
                                    setPdfReportPreset(preset);
                                    const token = getAccessToken() || '';
                                    fetchPdfReportData(token, preset, pdfVisitorType);
                                  }}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs font-bold focus:border-blue-500 focus:outline-none cursor-pointer"
                                >
                                  <option value="today">{tText(tText("ประวัติการเข้าออกพื้นที่ วันนี้", "Check-in/out History Today"), "Check-in/out History Today")}</option>
                                  <option value="yesterday">{tText(tText("ประวัติการเข้าออกพื้นที่ เมื่อวานนี้", "Check-in/out History Yesterday"), "Check-in/out History Yesterday")}</option>
                                  <option value="7days">{tText(tText("ประวัติความปลอดภัยย้อนหลัง 7 วันล่าสุด", "Security History Past 7 Days"), "Security History Past 7 Days")}</option>
                                  <option value="30days">{tText(tText("รายงานความเสี่ยงรายเดือน 30 วันล่าสุด", "Monthly Safety Report"), "Monthly Safety Report")}</option>
                                  <option value="all">{tText(tText("ข้อมูลประวัติความปลอดภัยทั้งหมดในระบบ", "All security history logs in system"), "All security history logs in system")}</option>
                                </select>
                              </div>

                              {/* 2. Filter Visitor Type */}
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5 text-slate-500" /> {tText("กรองเฉพาะประเภทผู้เข้าติดต่อ", "Filter by Visitor Type")}
                                </label>
                                <select
                                  value={pdfVisitorType}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setPdfVisitorType(val);
                                    const token = getAccessToken() || '';
                                    fetchPdfReportData(token, pdfReportPreset, val);
                                  }}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs font-semibold focus:border-blue-500 focus:outline-none cursor-pointer"
                                >
                                  <option value="all">{tText(tText("แสดงผู้เข้าติดต่อทุกประเภท", "Show all visitor types"), "Show all visitor types")}</option>
                                  <option value={tText("ผู้ติดต่อทั่วไป", "General Visitor")}>{tText(tText("ผู้ติดต่อทั่วไป", "General Visitor"), "General Visitor")}</option>
                                  <option value={tText("ผู้รับเหมา", "Contractor")}>{tText(tText("ผู้รับเหมา", "Contractor"), "Contractor")}</option>
                                  <option value={tText("VIP / บุคคลสำคัญ", "VIP / Key Person")}>{tText(tText("VIP / บุคคลสำคัญ", "VIP / Key Person"), "VIP / Key Person")}</option>
                                  <option value="พนักงานส่งของ">{tText(tText("พนักงานส่งของ / พัสดุ", "Delivery / Parcel Service"), "Delivery / Parcel Service")}</option>
                                </select>
                              </div>

                              {/* Action: Generate PDF Button */}
                              <button
                                type="button"
                                onClick={handleDownloadPDF}
                                disabled={exportingPdf || loadingPdfStats}
                                className={`w-full py-3.5 rounded-xl text-xs uppercase tracking-wider font-black flex items-center justify-center gap-2 cursor-pointer transition shadow-lg ${
                                  exportingPdf
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                              >
                                {exportingPdf ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {tText("กำลังแปลงพิกเซลเป็น PDF...", "Converting pixels to PDF...")}
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-4 h-4" />
                                    {tText(tText("สร้างและบันทึกไฟล์ PDF ทันที", "Generate & Download PDF"), "Generate & Download PDF")}
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Info Box */}
                            <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl text-[11px] text-slate-400 leading-relaxed flex flex-col gap-1.5">
                              <span className="font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5" /> {tText("คำแนะนำความเที่ยงตรงการรายงาน", "Report Accuracy Guidelines")}
                              </span>
                              <p>{tText(tText("รายงาน PDF นี้รองรับระบบ Multi-Page Rendering อัตโนมัติ โดยระบบจัดรูปแบบ CSS Page-breaks และแผนภูมิกราฟิกแบบเวกเตอร์ คมชัด 100% เหมาะสำหรับนำเสนอในการประชุมผู้บริหาร ฝ่ายบริหารความเสี่ยง หรือยื่นตรวจสอบประวัติความปลอดภัย", "This PDF report supports automated Multi-Page Rendering with CSS Page-breaks and high-resolution vector charts. Perfect for executive reviews, audit validation, or compliance files."), "This PDF report supports automated Multi-Page Rendering with CSS Page-breaks and high-resolution vector charts. Perfect for executive reviews, audit validation, or compliance files.")}</p>
                            </div>
                          </div>

                          {/* COLUMN 2: LIVE PDF PREVIEW (8 Cols) */}
                          <div className="lg:col-span-8 flex flex-col gap-4">
                            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Eye className="w-4 h-4 text-slate-500" /> {tText("ตัวอย่างหน้าเอกสารจริงที่ระบบจะสร้างออก", "Actual document preview generated by the system")}
                            </span>

                            {/* Simulated Paper Wrapper */}
                            <div className="border border-slate-800/80 bg-slate-950 p-4 sm:p-6 rounded-2xl flex items-center justify-center overflow-x-auto">
                              
                              {/* The printable target container */}
                              <div
                                id="pdf-report-canvas"
                                className={`w-full max-w-[800px] aspect-[1/1.414] rounded-xl p-8 sm:p-10 flex flex-col gap-6 shadow-2xl transition duration-300 font-sans ${
                                  pdfReportTheme === 'light'
                                    ? 'bg-white text-slate-900'
                                    : 'bg-[#0c1524] text-slate-100 border border-slate-800/50'
                                }`}
                              >
                                {loadingPdfStats ? (
                                  /* Loading Overlay inside document preview */
                                  <div className="flex-1 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                    <span className="text-xs font-bold text-slate-400 font-mono">{tText(tText("กำลังประมวลผลข้อมูลกราฟและสถิติย้อนหลัง...", "Processing analytics..."), "Processing analytics...")}</span>
                                  </div>
                                ) : (
                                  <>
                                    {/* Inner State Container */}
                                    {(() => {
                                      const statsToUse = pdfReportStats || dashboardStats;
                                      
                                      // 1. Hourly calculation for vector line graph
                                      const hourlyData = statsToUse.visitsByHour && statsToUse.visitsByHour.length > 0 
                                        ? statsToUse.visitsByHour 
                                        : Array.from({ length: 12 }, (_, i) => ({ hour: `${8+i}:00`, count: [3, 5, 8, 12, 18, 14, 9, 7, 11, 15, 6, 2][i] }));
                                      
                                      const maxHourCount = Math.max(...hourlyData.map(d => d.count), 1);
                                      const svgW = 600;
                                      const svgH = 130;
                                      const padX = 25;
                                      const padY = 20;
                                      const cW = svgW - (padX * 2);
                                      const cH = svgH - (padY * 2);
                                      
                                      const points = hourlyData.map((d, index) => {
                                        const x = padX + (index * (cW / (hourlyData.length - 1 || 1)));
                                        const y = svgH - padY - ((d.count / maxHourCount) * cH);
                                        return { x, y };
                                      });
                                      
                                      const pathLine = points.length > 0 
                                        ? `M ${points[0].x} ${points[0].y} ` + points.slice.map(p => `L ${p.x} ${p.y}`).join(' ') 
                                        : '';
                                      
                                      const pathArea = points.length > 0 
                                        ? `${pathLine} L ${points[points.length-1].x} ${svgH - padY} L ${points[0].x} ${svgH - padY} Z` 
                                        : '';

                                      // 2. Compute Visitor Types Proportion bar
                                      const defaultTypes = [
                                        { name: tText(tText("ผู้รับเหมา", "Contractor"), "Contractor"), value: 45 },
                                        { name: tText(tText("ผู้ติดต่อทั่วไป", "General Visitor"), "General Visitor"), value: 25 },
                                        { name: tText(tText("VIP / บุคคลสำคัญ", "VIP / Key Person"), "VIP / Key Person"), value: 15 },
                                        { name: tText(tText("พนักงานส่งของ", "Delivery Personnel"), "Delivery Personnel"), value: 15 }
                                      ];
                                      const typesData = statsToUse.visitsByType && statsToUse.visitsByType.length > 0 
                                        ? statsToUse.visitsByType 
                                        : defaultTypes;
                                      
                                      const totalTypeSum = typesData.reduce((sum, entry) => sum + entry.value, 0) || 1;
                                      const colorAccents = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

                                      return (
                                        <div className="flex-1 flex flex-col justify-between">
                                          
                                          {/* TOP: Report Letterhead */}
                                          <div className="flex flex-col gap-4 border-b pb-5" style={{ borderColor: pdfReportTheme === 'light' ? '#e2e8f0' : '#1e293b' }}>
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-3">
                                                {config.logoDriveId ? (
                                                  <img 
                                                    src={`/api/photo/${config.logoDriveId}`} 
                                                    alt="Logo" 
                                                    crossOrigin="anonymous"
                                                    className="w-10 h-10 object-contain rounded-xl p-0.5 border border-slate-200 shadow-sm animate-fade-in" 
                                                    style={{ backgroundColor: '#f7f2f2' }} 
                                                    onError={() => setLogoError(true)}
                                                  />
                                                ) : config.logoUrl && !logoError ? (
                                                  <img 
                                                    src={config.logoUrl} 
                                                    alt="Logo" 
                                                    crossOrigin="anonymous"
                                                    className="w-10 h-10 object-contain rounded-xl p-0.5 border border-slate-200 shadow-sm animate-fade-in" 
                                                    style={{ backgroundColor: '#f7f2f2' }} 
                                                    onError={() => setLogoError(true)}
                                                  />
                                                ) : (
                                                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-900 font-black text-xs shadow border border-slate-200">
                                                    MG
                                                  </div>
                                                )}
                                                <div className="flex flex-col">
                                                  <span className="text-sm font-black tracking-tight uppercase">
                                                    {config?.organizationName || config?.title || 'Security Guard System'}
                                                  </span>
                                                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                                    Official Guard Operation Center
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="flex flex-col items-end text-right font-mono text-[9px] text-slate-400">
                                                <span>REF-NO: SEC-{new Date().getFullYear()}-{Math.floor(Math.random() * 90000) + 10000}</span>
                                                <span>{tText("วันที่ออกเอกสาร", "Date of Issue")}: {new Date().toLocaleDateString(lang === 'TH' ? 'th-TH' : 'en-US')} {new Date().toLocaleTimeString(lang === 'TH' ? 'th-TH' : 'en-US')}</span>
                                              </div>
                                            </div>

                                            <div className="flex flex-col gap-1.5 mt-2">
                                              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-blue-500" /> Visitor Report
                                              </h1>
                                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                                <span className="text-slate-400">
                                                  {tText("ช่วงเวลา", "Period")}: <strong className={pdfReportTheme === 'light' ? 'text-blue-600' : 'text-blue-400'}>
                                                    {pdfReportPreset === 'today' ? tText(tText("วันนี้", "Today"), "Today") :
                                                     pdfReportPreset === 'yesterday' ? tText(tText("เมื่อวานนี้", "Yesterday"), "Yesterday") :
                                                     pdfReportPreset === '7days' ? tText(tText("ย้อนหลัง 7 วัน", "Past 7 Days"), "Past 7 Days") :
                                                     pdfReportPreset === '30days' ? tText(tText("ย้อนหลัง 30 วัน", "Past 30 Days"), "Past 30 Days") : tText(tText("ประวัติทั้งหมด", "All Historical Logs"), "All Historical Logs")}
                                                  </strong>
                                                </span>
                                                <span className="text-slate-400">|</span>
                                                <span className="text-slate-400">
                                                  {tText("การกรอง", "Filter")}: <strong className={pdfReportTheme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}>
                                                    {pdfVisitorType === 'all' ? tText(tText("แสดงผู้ติดต่อทุกประเภท", "Show all visitor types"), "Show all visitor types") : pdfVisitorType}
                                                  </strong>
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* BODY SECTION: KPI Cards Grid */}
                                          <div className="grid grid-cols-4 gap-3.5 mt-2">
                                            <div className={`p-3.5 rounded-xl border flex flex-col gap-1 shadow-sm ${
                                              pdfReportTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                                            }`}>
                                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{tText(tText("ผู้ติดต่อเข้าพื้นที่สะสม", "Total Entry Pass Visits"), "Total Entry Pass Visits")}</span>
                                              <span className="text-xl font-black text-blue-500 font-mono">{statsToUse.totalVisitsToday || 128}</span>
                                              <span className="text-[8px] text-slate-500 font-medium">{tText(tText("รายการเข้าพื้นที่", "Visits Logged"), "Visits Logged")}</span>
                                            </div>

                                            <div className={`p-3.5 rounded-xl border flex flex-col gap-1 shadow-sm ${
                                              pdfReportTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                                            }`}>
                                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{tText(tText("กำลังอยู่ในพื้นที่", "Currently Inside Area"), "Currently Inside Area")}</span>
                                              <span className="text-xl font-black text-emerald-500 font-mono">{statsToUse.currentlyInside || 14}</span>
                                              <span className="text-[8px] text-slate-500 font-medium">{tText(tText("บุคคลยังไม่สแกนออก", "Inside Area"), "Inside Area")}</span>
                                            </div>

                                            <div className={`p-3.5 rounded-xl border flex flex-col gap-1 shadow-sm ${
                                              pdfReportTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                                            }`}>
                                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{tText(tText("การบล็อกความเสี่ยง", "Risk Prevention"), "Risk Prevention")}</span>
                                              <span className="text-xl font-black text-rose-500 font-mono">{statsToUse.totalBanned || 3}</span>
                                              <span className="text-[8px] text-slate-500 font-medium">{tText(tText("บุคคลติด Blacklist/ระงับ", "Blacklisted / Suspended Personnel"), "Blacklisted / Suspended Personnel")}</span>
                                            </div>

                                            <div className={`p-3.5 rounded-xl border flex flex-col gap-1 shadow-sm ${
                                              pdfReportTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                                            }`}>
                                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{tText(tText("ด่านตรวจที่ใช้งาน", "Active Duty Station"), "Active Duty Station")}</span>
                                              <span className="text-xl font-black text-amber-500 font-mono">{statsToUse.registeredNotCheckedIn || 5}</span>
                                              <span className="text-[8px] text-slate-500 font-medium">{tText(tText("จุดตรวจคัดกรองหลัก", "Main Gate Checkpoint"), "Main Gate Checkpoint")}</span>
                                            </div>
                                          </div>

                                          {/* GRAPH 1: Hourly Scan Frequency Waveform (Vector Graphics) */}
                                          <div className="flex flex-col gap-2 mt-4">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                                              <Activity className="w-3.5 h-3.5 text-blue-500" /> {tText("แผนภูมิแสดงช่วงเวลาความหนาแน่นของผู้เข้าติดต่อสะสม", "Hourly Visitor Volume Cumulative Distribution Chart")}
                                            </span>
                                            <div className={`border rounded-xl p-3 shadow-sm flex flex-col ${
                                              pdfReportTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800/80'
                                            }`}>
                                              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto overflow-visible select-none">
                                                <defs>
                                                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                                                  </linearGradient>
                                                </defs>
                                                {/* Grid Lines */}
                                                {Array.from({ length: 4 }).map((_, i) => {
                                                  const yVal = padY + (i * (cH / 3));
                                                  return (
                                                    <line
                                                      key={i}
                                                      x1={padX}
                                                      y1={yVal}
                                                      x2={svgW - padX}
                                                      y2={yVal}
                                                      stroke={pdfReportTheme === 'light' ? '#cbd5e1' : '#1e293b'}
                                                      strokeWidth="0.8"
                                                      strokeDasharray="4 4"
                                                    />
                                                  );
                                                })}
                                                {/* Vector Area Shading */}
                                                {pathArea && <path d={pathArea} fill="url(#areaGradient)" />}
                                                {/* Vector Stroke Line */}
                                                {pathLine && <path d={pathLine} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                                                {/* Visual dots on points */}
                                                {points.map((p, index) => (
                                                  <circle key={index} cx={p.x} cy={p.y} r="3.5" fill={pdfReportTheme === 'light' ? '#1e3a8a' : '#60a5fa'} stroke={pdfReportTheme === 'light' ? '#ffffff' : '#0c1524'} strokeWidth="1.5" />
                                                ))}
                                                {/* X Axis Labels */}
                                                {hourlyData.map((d, index) => {
                                                  const x = padX + (index * (cW / (hourlyData.length - 1 || 1)));
                                                  // Only render labels for every second point to avoid crowding
                                                  if (index % 2 !== 0 && index !== hourlyData.length - 1) return null;
                                                  return (
                                                    <text
                                                      key={index}
                                                      x={x}
                                                      y={svgH - 4}
                                                      textAnchor="middle"
                                                      fill="#94a3b8"
                                                      fontSize="8"
                                                      fontWeight="bold"
                                                      fontFamily="monospace"
                                                    >
                                                      {d.hour}
                                                    </text>
                                                  );
                                                })}
                                              </svg>
                                            </div>
                                          </div>

                                          {/* GRAPH 2: Swiss Bento Multi-Segment Indicator (Proportion Breakdown) */}
                                          <div className="flex flex-col gap-2 mt-4">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                                              <Users className="w-3.5 h-3.5 text-emerald-500" /> {tText("แผนภูมิสัดส่วนจัดประเภทผู้เข้าติดต่อสูงสุด", "Visitor Type Proportion Breakdown Chart")}
                                            </span>
                                            <div className={`border rounded-xl p-4 shadow-sm flex flex-col gap-3.5 ${
                                              pdfReportTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800/80'
                                            }`}>
                                              {/* Horizontal Segmented Bar */}
                                              <div className="w-full h-3 rounded-full flex overflow-hidden bg-slate-800/40 border border-slate-700/20">
                                                {typesData.map((entry, index) => {
                                                  const pct = (entry.value / totalTypeSum) * 100;
                                                  return (
                                                    <div
                                                      key={entry.name}
                                                      style={{ width: `${pct}%`, backgroundColor: colorAccents[index % colorAccents.length] }}
                                                      className="h-full transition duration-500"
                                                    />
                                                  );
                                                })}
                                              </div>

                                              {/* Grid Legend and Details */}
                                              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px] font-medium text-slate-400">
                                                {typesData.map((entry, index) => {
                                                  const pct = ((entry.value / totalTypeSum) * 100).toFixed(1);
                                                  return (
                                                    <div key={entry.name} className="flex items-center justify-between border-b pb-1" style={{ borderColor: pdfReportTheme === 'light' ? '#e2e8f0' : '#1e293b' }}>
                                                      <div className="flex items-center gap-2 truncate">
                                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorAccents[index % colorAccents.length] }} />
                                                        <span className="truncate text-slate-500 font-bold">{entry.name}</span>
                                                      </div>
                                                      <span className={`font-black font-mono shrink-0 ${pdfReportTheme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                                                        {entry.value} {tText("ครั้ง", "times")} ({pct}%)
                                                      </span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* LOWER SECTION: Recent scans compact preview table */}
                                          <div className="flex flex-col gap-2 mt-4">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                                              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" /> {tText("ตารางแสดงประวัติผู้เข้าพื้นที่ล่าสุดตามผลการกรอง", "Table showing recent visitors' history based on filter results")}
                                            </span>
                                            <div className="overflow-hidden rounded-xl border border-slate-800 shadow-sm">
                                              <table className="w-full text-[9px] text-left border-collapse">
                                                <thead>
                                                  <tr className={pdfReportTheme === 'light' ? 'bg-slate-100 text-slate-700 border-b' : 'bg-slate-900 text-slate-300 border-b border-slate-800'}>
                                                    <th className="py-2 px-3 font-bold">{tText(tText("ชื่อ-นามสกุล", "Full Name"), "Full Name")}</th>
                                                    <th className="py-2 px-3 font-bold">{tText(tText("ประเภท", "Type"), "Type")}</th>
                                                    <th className="py-2 px-3 font-bold">{tText(tText("จุดเข้าติดต่อ", "Checkpoint Gate"), "Checkpoint Gate")}</th>
                                                    <th className="py-2 px-3 font-bold">{tText(tText("เวลาสแกนเข้า", "Check-in Time"), "Check-in Time")}</th>
                                                    <th className="py-2 px-3 font-bold text-center">{tText(tText("สถานะ", "Status"), "Status")}</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/30">
                                                  {statsToUse.recentLogs && statsToUse.recentLogs.length > 0 ? (
                                                    statsToUse.recentLogs.slice(0, 4).map((log, index) => (
                                                      <tr key={index} className={pdfReportTheme === 'light' ? 'hover:bg-slate-50 text-slate-800' : 'hover:bg-slate-900/30 text-slate-300'}>
                                                        <td className="py-2 px-3 font-bold truncate max-w-[120px]">{log.name}</td>
                                                        <td className="py-2 px-3 font-medium text-slate-400">{log.visitorType}</td>
                                                        <td className="py-2 px-3 text-slate-500 font-medium">{log.entryArea || tText(tText("ฝ่ายผลิต", "Production Department"), "Production Department")}</td>
                                                        <td className="py-2 px-3 font-mono text-slate-400">
                                                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString(lang === 'TH' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '14:28'} {tText("น.", "")}
                                                        </td>
                                                        <td className="py-2 px-3 text-center">
                                                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                                            log.status === 'inside' || log.status === tText(tText("เช็คอินแล้ว", "Checked In"), "Checked In")
                                                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/10'
                                                          }`}>
                                                            {log.status === 'inside' || log.status === tText(tText("เช็คอินแล้ว", "Checked In"), "Checked In") ? 'Inside' : 'Out'}
                                                          </span>
                                                        </td>
                                                      </tr>
                                                    ))
                                                  ) : (
                                                    <tr>
                                                      <td colSpan={5} className="py-6 text-center text-slate-500 font-bold font-mono">
                                                        {tText("ไม่มีประวัติข้อมูลการสแกนในกลุ่มผู้ติดต่อนี้", "No scan history found for this group of visitors")}
                                                      </td>
                                                    </tr>
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>

                                          {/* BOTTOM: Digital Footer Seal */}
                                          <div className="flex items-center justify-between border-t pt-4 mt-4" style={{ borderColor: pdfReportTheme === 'light' ? '#e2e8f0' : '#1e293b' }}>
                                            <div className="flex items-center gap-2.5">
                                              <div className="w-8 h-8 rounded-full border border-blue-500/30 bg-blue-500/5 flex items-center justify-center font-bold text-blue-500 font-mono text-[9px]">
                                                CSOC
                                              </div>
                                              <div className="flex flex-col text-[8px] text-slate-400 leading-normal">
                                                <span className="font-extrabold uppercase tracking-widest text-slate-400">Security Operation Center</span>
                                                <span>{tText(tText("ระบบรายงานความปลอดภัยและข้อมูลดิจิทัลอัตโนมัติ", "Automated Safety & Digital Reporting System"), "Automated Safety & Digital Reporting System")}</span>
                                                <span className="font-mono text-slate-500">DIGITAL ARCHIVE SECURELY VERIFIED</span>
                                              </div>
                                            </div>
                                            <div className="font-mono text-[8px] text-slate-500">
                                              PAGE: 1 / 1
                                            </div>
                                          </div>

                                        </div>
                                      );
                                    })()}
                                  </>
                                )}
                              </div>

                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* ADMIN VIEW: DAILY CHECKPOINT & GUARD ASSIGNMENTS */}
                    {adminTab === 'checkpoints' && !!roleMenuPermissions[loggedInSystemUser?.role]?.admin_checkpoints && (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-blue-500 animate-bounce" /> {tText("กำหนดสิทธิ์การตรวจสอบ", "Inspection Authority Settings")}
                            </h3>
                          </div>
                        </div>



                        {/* Search Input for Guards */}
                        <div className="bg-slate-950/20 p-3 rounded-2xl border border-slate-800/50">
                          <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              value={guardSearch}
                              onChange={(e) => {
                                setGuardSearch(e.target.value);
                                setCheckpointsCurrentPage(1); // Reset page on search
                              }}
                              placeholder={tText(tText("ค้นหาชื่อเจ้าหน้าที่ / รหัสผู้ใช้ / บทบาท...", "Search guard name / username / role..."), "Search guard name / username / role...")}
                              className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-11 pr-4 py-2.5 text-slate-100 text-xs focus:border-[#7f98f7] focus:outline-none font-bold placeholder:text-slate-500 transition shadow-inner"
                            />
                          </div>
                        </div>

                        {/* Guards Beautiful Table View */}
                        <div className="w-full overflow-x-auto border border-slate-800 bg-slate-950/40 rounded-2xl shadow-xl">
                          {filteredGuards.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 font-sans text-xs flex flex-col items-center justify-center gap-2">
                              <Users className="w-8 h-8 text-slate-600 animate-pulse" />
                              <span className="font-bold">{tText(tText("ไม่พบบัญชีเจ้าหน้าที่รักษาความปลอดภัย", "Security guard profile not found"), "Security guard profile not found")}</span>
                              <span className="text-slate-500 text-[10px]">{tText(tText("กรุณาลองป้อนชื่อตัวสะกด หรือคำค้นหาอื่น", "Please try another spelling or keyword"), "Please try another spelling or keyword")}</span>
                            </div>
                          ) : (
                            <table className="w-full text-left border-collapse min-w-[800px]">
                              <thead>
                                <tr className="border-b border-slate-800/80 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold bg-slate-900/60 select-none">
                                  <th className="py-4 px-5 font-black text-slate-400">{tText(tText("เจ้าหน้าที่", "Guard Name"), "Guard Name")}</th>
                                  <th className="py-4 px-4 font-black text-slate-400">{tText(tText("บทบาท", "Role"), "Role")}</th>
                                  <th className="py-4 px-4 font-black text-slate-400">{tText(tText("จุดปฏิบัติงานประจำวัน", "Daily Duty Checkpoint"), "Daily Duty Checkpoint")}</th>
                                  <th className="py-4 px-4 font-black text-slate-400">{tText(tText("ขอบเขตพื้นที่อนุญาตสแกน", "Allowed Scanning Areas"), "Allowed Scanning Areas")}</th>
                                  <th className="py-4 px-4 font-black text-slate-400">{tText(tText("ผู้มอบหมาย / เวลาล่าสุด", "Assigned By / Updated At"), "Assigned By / Updated At")}</th>
                                  <th className="py-4 px-5 text-right font-black text-slate-400">{tText(tText("การจัดการ", "Actions"), "Actions")}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
                                {paginatedGuards.map((user) => {
                                  const assignment = getGuardAssignment(user.username);
                                  const isFullAccess = assignment.allowedAreas.length === CONTACT_AREAS.length;
                                  const isStrict = assignment.allowedAreas.length === 1 && assignment.allowedAreas[0] === assignment.activeCheckpoint;
                                  return (
                                    <tr key={user.username} className="hover:bg-slate-800/15 transition duration-150 group">
                                      <td className="py-3.5 px-5">
                                        <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-xl bg-[#7f98f7]/10 border border-[#7f98f7]/25 text-[#7f98f7] flex items-center justify-center font-black text-xs shadow-inner group-hover:scale-105 transition-all shrink-0 overflow-hidden">
                                            {user.avatar ? (
                                              <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                                            ) : (
                                              user.name.charAt(0).toUpperCase()
                                            )}
                                          </div>
                                          <div>
                                            <div className="text-slate-100 font-black text-xs group-hover:text-[#7f98f7] transition-colors">{user.name}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">@{user.username}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3.5 px-4">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-[#7f98f7] bg-[#7f98f7]/10 border border-[#7f98f7]/20 px-2.5 py-0.5 rounded-md">
                                          {user.role}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-[#5c7df5]/10 text-[#5c7df5] border border-[#5c7df5]/15">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#5c7df5] animate-pulse" />
                                          {assignment.activeCheckpoint}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 max-w-xs">
                                        {isFullAccess ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">
                                            <Check className="w-3 h-3 text-emerald-600" /> {tText("ทุกพื้นที่", "All Areas")}
                                          </span>
                                        ) : isStrict ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/15">
                                            <Lock className="w-3 h-3 text-amber-500" /> {tText("เฉพาะจุดตรวจนี้", "Strictly this checkpoint")}
                                          </span>
                                        ) : (
                                          <div className="flex flex-col gap-0.5">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 w-fit">
                                              {assignment.allowedAreas.length} {tText("พื้นที่", "Areas")}
                                            </span>
                                            <div className="text-[9px] text-slate-400 font-medium truncate max-w-[180px]" title={assignment.allowedAreas.join(', ')}>
                                              {assignment.allowedAreas.join(', ')}
                                            </div>
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-3.5 px-4">
                                        <div className="text-[10px] text-slate-400 font-mono">
                                          {tText("โดย", "By")}: <span className="text-slate-300 font-bold">{assignment.assignedBy}</span>
                                        </div>
                                        <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                          <Clock className="w-3 h-3" />
                                          {new Date(assignment.updatedAt).toLocaleTimeString(lang === 'TH' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })} {tText("น.", "")}
                                        </div>
                                      </td>
                                      <td className="py-3.5 px-5 text-right">
                                        <button
                                          type="button"
                                          onClick={() => openCheckpointEdit(user)}
                                          className="py-1.5 px-3 bg-[#7f98f7]/15 hover:bg-[#7f98f7] text-[#7f98f7] hover:text-slate-950 font-black text-xs uppercase rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer shadow-sm inline-flex active:scale-95"
                                        >
                                          <Sliders className="w-3.5 h-3.5" /> {tText("มอบหมายสิทธิ์", "Assign Permissions")}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>

                        {/* Pagination Controls for Guards List */}
                        {Math.ceil(filteredGuards.length / checkpointsPageSize) > 1 && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/60 pt-4 mt-2">
                            <div className="text-[11px] text-slate-400 font-medium">
                              {tText("แสดง", "Showing")}{" "}
                              <span className="text-slate-200 font-bold">{filteredGuards.length > 0 ? (checkpointsCurrentPage - 1) * checkpointsPageSize + 1 : 0}</span>{" "}
                              {tText("ถึง", "to")}{" "}
                              <span className="text-slate-200 font-bold">{Math.min((checkpointsCurrentPage - 1) * checkpointsPageSize + checkpointsPageSize, filteredGuards.length)}</span>{" "}
                              {tText("จาก", "of")}{" "}
                              <span className="text-slate-200 font-bold">{filteredGuards.length}</span>{" "}
                              {tText("คน", "users")}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={checkpointsCurrentPage === 1}
                                onClick={() => setCheckpointsCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 flex items-center justify-center cursor-pointer select-none"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <div className="text-xs text-slate-300 font-bold px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
                                {tText("หน้า", "Page")} {checkpointsCurrentPage} / {Math.ceil(filteredGuards.length / checkpointsPageSize)}
                              </div>
                              <button
                                type="button"
                                disabled={checkpointsCurrentPage === Math.ceil(filteredGuards.length / checkpointsPageSize)}
                                onClick={() => setCheckpointsCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredGuards.length / checkpointsPageSize)))}
                                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 flex items-center justify-center cursor-pointer select-none"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ADMIN VIEW 4: CONFIGURATION & BRANDING */}
                    {adminTab === 'config' && !!roleMenuPermissions[loggedInSystemUser?.role]?.admin_config && (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg animate-fadeIn">
                        <div className="mb-5 border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-100">{tText(tText("ปรับแต่งใบผ่านและตั้งค่าระบบ", "Branding & System Config"), "Branding & System Config")}</h3>
                            <p className="text-xs text-slate-400 mt-1">{tText(tText("สลับเมนูย่อยเพื่อปรับเปลี่ยนอัตลักษณ์องค์กร ฟิลด์ข้อมูลดีไซน์บัตร และเชื่อมโยง Google Sheets & อีเมล", "Toggle subtabs to customize brand style, mandatory fields, sheet sync & email reports."), "Toggle subtabs to customize brand style, mandatory fields, sheet sync & email reports.")}</p>
                          </div>
                        </div>

                        {/* Beautiful Sub-Tabs Selector */}
                        <div className="flex flex-wrap gap-2 mb-5 bg-slate-950 p-2 rounded-2xl border border-slate-800/60">
                          <button
                            type="button"
                            onClick={() => setConfigSubTab('branding')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer select-none ${
                              configSubTab === 'branding'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                          >
                            <span>{tText(tText("🎨 อัตลักษณ์ & โลโก้", "Identity & Logos"), "Identity & Logos")}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfigSubTab('fields')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer select-none ${
                              configSubTab === 'fields'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                          >
                            <span>{tText(tText("📋 ฟิลด์แบบฟอร์ม", "Registration Form Fields"), "Registration Form Fields")}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfigSubTab('designer')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer select-none ${
                              configSubTab === 'designer'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                          >
                            <span>{tText(tText("🎫 ดีไซน์บัตรผ่าน", "Card & Ticket Design"), "Card & Ticket Design")}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfigSubTab('integration')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer select-none ${
                              configSubTab === 'integration'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                          >
                            <span>{tText(tText("🌐 Google Sheets & อีเมล", "Google Sheets & SMTP sync"), "Google Sheets & SMTP sync")}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfigSubTab('storage')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer select-none ${
                              configSubTab === 'storage'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                                : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                          >
                            <span>{tText(tText("💾 ความจุ & ข้อมูลทดสอบ", "Storage Capacity & Mocking"), "Storage Capacity & Mocking")}</span>
                          </button>
                        </div>

                        {/* Interactive Banner Description for context */}
                        <div className="mb-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                          <h4 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider">
                            {configSubTab === 'branding' && tText(tText("🎨 ตั้งค่ารูปแบบแบรนด์ขององค์กร", "Brand Identity Design Setup"), "Brand Identity Design Setup")}
                            {configSubTab === 'fields' && tText(tText("📋 ตั้งค่าฟิลด์ความต้องการในแบบฟอร์มลงทะเบียน", "Registration Form Required Fields Setup"), "Registration Form Required Fields Setup")}
                            {configSubTab === 'designer' && tText(tText("🎫 ดีไซน์บัตรผ่านประตูและสลิปความปลอดภัย", "Visitor Pass Layout & Security Slip Designer"), "Visitor Pass Layout & Security Slip Designer")}
                            {configSubTab === 'integration' && tText(tText("🌐 ตั้งค่าระบบเชื่อมต่อ Google Sheets & ส่งอีเมล", "Google Sheets synchronization and report email setup"), "Google Sheets synchronization and report email setup")}
                            {configSubTab === 'storage' && tText(tText("💾 การจัดการข้อมูลทดสอบ & พื้นที่จัดเก็บประวัติ", "Mock records setup, sheet capacities and database storage settings"), "Mock records setup, sheet capacities and database storage settings")}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {configSubTab === 'branding' && tText(tText("ปรับแต่งชื่อองค์กรหลัก, กำหนดสีธีมระบบ (สีประจำองค์กร/สีไฮไลท์), และอัปโหลดไฟล์ภาพโลโก้แบรนด์ของคุณ", "Customize primary organization name, system theme colors, and brand logo image."), "Customize primary organization name, system theme colors, and brand logo image.")}
                            {configSubTab === 'fields' && tText(tText("กำหนดว่าในการลงทะเบียนเข้าติดต่อ จะต้องบังคับกรอกข้อมูลใดบ้าง เช่น ชื่อ-นามสกุล, ทะเบียนรถ, ชื่อบริษัท หรือประเภทผู้ติดต่อ", "Configure mandatory fields such as Name, Plate, Company, or Visitor Type."), "Configure mandatory fields such as Name, Plate, Company, or Visitor Type.")}
                            {configSubTab === 'designer' && tText(tText("ตกแต่งบัตรผ่านความปลอดภัย แบบ Real-time เช่น รูปแบบโครงสร้างสลิม ความกว้าง ชุดฟอนต์ ขนาดอักษร ความโค้งมน สี และเลือกเปิด/ปิดการแสดงคิวอาร์โค้ด", "Style the security pass in real-time, such as layout width, font, rounded corners, colors, and QR code visibility."), "Style the security pass in real-time, such as layout width, font, rounded corners, colors, and QR code visibility.")}
                            {configSubTab === 'integration' && tText(tText("เลือกระหว่างเชื่อมต่อผ่าน Google Web App หรือ Service Account และกำหนดค่า SMTP/Gmail สำหรับส่งอีเมลรายงานเข้าออก", "Choose Google Sheets App Script/Service Account and configure SMTP for reports."), "Choose Google Sheets App Script/Service Account and configure SMTP for reports.")}
                            {configSubTab === 'storage' && tText(tText("จำลองข้อมูลทดสอบ 1,000 รายการสำหรับสถิติแดชบอร์ด ตรวจสอบความจุแถวบนแผ่นงานชีต และจัดเก็บประวัติสำรองเพื่อความรวดเร็ว", "Generate 1,000 mock records for dashboard, check sheet row capacity, and archive history."), "Generate 1,000 mock records for dashboard, check sheet row capacity, and archive history.")}
                          </p>
                        </div>

                        <form onSubmit={handleSaveBranding} className="flex flex-col gap-6">
                          {configSubTab === 'branding' && (
                            <BrandingSection
                              config={config}
                              setConfig={setConfig}
                              savingBranding={savingBranding}
                              handleLogoUpload={handleLogoUpload}
                            />
                          )}

                          {configSubTab === 'fields' && (
                            <FormFieldsSection
                              config={config}
                              setConfig={setConfig}
                              savingBranding={savingBranding}
                            />
                          )}

                          {configSubTab === 'designer' && (
                            <PassDesignerSection
                              config={config}
                              setConfig={setConfig}
                              savingBranding={savingBranding}
                              mockVisitorForPreview={mockVisitorForPreview}
                            />
                          )}

                          {configSubTab === 'integration' && (
                            <IntegrationSection
                              config={config}
                              setConfig={setConfig}
                              savingBranding={savingBranding}
                            />
                          )}
                        </form>

                        {configSubTab === 'storage' && (
                          <StorageSection
                            seedingMock={seedingMock}
                            handleSeedMockData={handleSeedMockData}
                            clearingMock={clearingMock}
                            handleClearMockData={handleClearMockData}
                            fetchSheetsStatus={fetchSheetsStatus}
                            loadingSheetsStatus={loadingSheetsStatus}
                            sheetsStatus={sheetsStatus}
                            archiveSuccessMsg={archiveSuccessMsg}
                            archivingSheets={archivingSheets}
                            handleArchiveSheets={handleArchiveSheets}
                          />
                        )}
                      </div>
                    )}

                    {/* ADMIN VIEW 5: ROLE PERMISSIONS CUSTOMIZATION */}
                    {adminTab === 'permissions' && !!roleMenuPermissions[loggedInSystemUser?.role]?.admin_permissions && (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                        <div className="mb-5 border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                              <Key className="w-5 h-5 text-amber-400" />
                              {tText("ระบบกำหนดสิทธิ์การใช้งานตามบทบาท", "Role Permission Customization System")}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                              {tText("ปรับแต่งและล็อกหน้าต่างการใช้งาน เมนู และข้อมูลรายงานต่างๆ ของแต่ละตำแหน่งได้แบบเรียลไทม์", "Configure and lock main tabs, menus, and reports for each role in real-time.")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 py-1.5 px-3 rounded-lg text-emerald-400 text-xs font-bold animate-pulse">
                            <Check className="w-4 h-4 stroke-[3]" /> {tText("ระบบบันทึกอัตโนมัติเรียลไทม์", "Real-time Auto-Saved System")}
                          </div>
                        </div>

                        {/* Interactive UI with Role Selector on Left, Permissions List on Right */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                          
                          {/* Role Selector List */}
                          <div className="md:col-span-4 flex flex-col gap-2">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 px-1 mb-1">{tText(tText("เลือกตำแหน่ง / บทบาท", "Select System Role"), "Select System Role")}</span>
                            {ROLES_LIST.map((role) => {
                              const isSelected = selectedRoleToConfig === role;
                              return (
                                <button
                                  key={role}
                                  type="button"
                                  onClick={() => setSelectedRoleToConfig(role)}
                                  className={`w-full text-left px-4 py-3 rounded-xl transition duration-150 flex items-center justify-between border ${
                                    isSelected 
                                      ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-extrabold shadow-sm' 
                                      : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Shield className={`w-4 h-4 ${
                                      role.includes('Administrator') ? 'text-amber-400' :
                                      role.includes('Manager') ? 'text-purple-400' :
                                      role.includes('Supervisor') ? 'text-indigo-400' : 'text-blue-400'
                                    }`} />
                                    <span className="text-xs">{role.split(' ')[0]}</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                                </button>
                              );
                            })}
                          </div>

                          {/* Permissions Config Form */}
                          <div className="md:col-span-8 bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5 flex flex-col gap-5">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-500 block">{tText(tText("การตั้งค่าสิทธิ์เข้าถึงของตำแหน่ง", "Role Access Configuration"), "Role Access Configuration")}</span>
                                <span className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5 mt-0.5">
                                  <Shield className="w-4 h-4 text-blue-400" /> {selectedRoleToConfig}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  // Reset selected role to default
                                  const defaults: any = {
                                    'Administrator': {
                                      gate: true, register: true, pass: true, admin: true,
                                      admin_dashboard: true, admin_visitors: true, admin_staff: true, admin_checkpoints: true, admin_reports: true, admin_config: true, admin_permissions: true
                                    },
                                    'Manager': {
                                      gate: true, register: true, pass: true, admin: true,
                                      admin_dashboard: true, admin_visitors: true, admin_staff: true, admin_checkpoints: true, admin_reports: true, admin_config: true, admin_permissions: true
                                    },
                                    'Supervisor': {
                                      gate: true, register: true, pass: true, admin: true,
                                      admin_dashboard: true, admin_visitors: true, admin_staff: true, admin_checkpoints: true, admin_reports: true, admin_config: false, admin_permissions: false
                                    },
                                    'Staff': {
                                      gate: true, register: true, pass: true, admin: false,
                                      admin_dashboard: false, admin_visitors: false, admin_staff: false, admin_checkpoints: false, admin_reports: false, admin_config: false, admin_permissions: false
                                    },
                                    'Security Guard': {
                                      gate: true, register: true, pass: true, admin: false,
                                      admin_dashboard: false, admin_visitors: false, admin_staff: false, admin_checkpoints: false, admin_reports: false, admin_config: false, admin_permissions: false
                                    }
                                  };
                                  setRoleMenuPermissions(prev => ({
                                    ...prev,
                                    [selectedRoleToConfig]: defaults[selectedRoleToConfig]
                                  }));
                                }}
                                className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition underline cursor-pointer"
                              >
                                {tText("รีเซ็ตค่าเริ่มต้นสิทธิ์ของตำแหน่งนี้", "Reset this role's permissions to default")}
                              </button>
                            </div>

                            {/* Group 1: Main Tabs */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] uppercase font-extrabold text-blue-400 tracking-wider flex items-center gap-1.5">
                                <QrCode className="w-3.5 h-3.5" /> 1. {tText("สิทธิ์การเข้าถึงเมนูหลัก", "Main Tabs Access Permissions")}
                              </h4>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {[
                                  { key: 'gate', label: tText(tText("เช็คอิน เข้า-ออก", "Gate Control"), "Gate Control"), icon: QrCode },
                                  { key: 'register', label: tText(tText("ลงทะเบียนใบผ่าน", "Register Pass"), "Register Pass"), icon: UserPlus },
                                  { key: 'pass', label: tText(tText("พิมพ์ใบผ่าน", "Print Pass"), "Print Pass"), icon: FileText },
                                  { key: 'admin', label: tText(tText("ระบบจัดการหลังบ้าน", "System Admin"), "System Admin"), icon: Shield, warning: selectedRoleToConfig.includes('Guard') || selectedRoleToConfig.includes('Staff') },
                                ].map((tab) => {
                                  const Icon = tab.icon;
                                  const isChecked = !!(roleMenuPermissions[selectedRoleToConfig]?.[tab.key] ?? true);
                                  return (
                                    <label 
                                      key={tab.key} 
                                      className={`flex items-start gap-3 p-3 rounded-xl border transition duration-150 cursor-pointer ${
                                        isChecked 
                                          ? 'bg-blue-600/5 border-blue-500/20 text-slate-200' 
                                          : 'bg-slate-900/25 border-slate-850 text-slate-500'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          // Prevent administrator from disabling their own admin or permissions tab to avoid lockouts
                                          if (selectedRoleToConfig.includes('Administrator') && (tab.key === 'admin')) {
                                            alert(tText(tText("ไม่สามารถถอนสิทธิ์เมนูหลัก Administrator สำหรับบัญชีแอดมินสูงสุดได้เพื่อความปลอดภัย", "Administrator permission settings cannot be modified for safety."), "Administrator permission settings cannot be modified for safety."));
                                            return;
                                          }
                                          setRoleMenuPermissions(prev => {
                                            const roleData = prev[selectedRoleToConfig] || {};
                                            return {
                                              ...prev,
                                              [selectedRoleToConfig]: {
                                                ...roleData,
                                                [tab.key]: e.target.checked
                                              }
                                            };
                                          });
                                        }}
                                        className="w-4 h-4 mt-0.5 text-blue-600 border-slate-800 rounded focus:ring-blue-500 accent-blue-500"
                                      />
                                      <div>
                                        <span className="text-xs font-bold flex items-center gap-1.5">
                                          <Icon className={`w-3.5 h-3.5 ${isChecked ? 'text-blue-400' : 'text-slate-600'}`} />
                                          {tab.label}
                                        </span>
                                        {tab.warning && (
                                          <span className="block text-[9px] text-amber-500/80 mt-1 font-semibold leading-relaxed">
                                            * {tText("แนะนำให้ปิดส่วน Admin สำหรับตำแหน่งพนักงานปฏิบัติการจริง", "Recommended to disable Admin access for regular operational staff")}
                                          </span>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Group 2: Admin Subtabs */}
                            <div className="space-y-3 pt-2 border-t border-slate-800/80">
                              <h4 className="text-[10px] uppercase font-extrabold text-purple-400 tracking-wider flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5" /> 2. {tText("สิทธิ์ฟังก์ชันแผงควบคุมแอดมิน", "Admin Subtab Access Permissions")}
                              </h4>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {[
                                  { key: 'admin_dashboard', label: tText(tText("แดชบอร์ดสรุปสถิติ", "Summary Analytics Dashboard"), "Summary Analytics Dashboard"), icon: Activity },
                                  { key: 'admin_visitors', label: tText("จัดการผู้ถือใบผ่าน & แบน", "Visitor Logs & Blacklist"), icon: Users },
                                  { key: 'admin_staff', label: tText("จัดการบัญชีเจ้าหน้าที่ระบบ", "Staff Accounts & Management"), icon: User },
                                  { key: 'admin_online', label: tText("สถานะผู้ใช้งานออนไลน์", "Online Users Status"), icon: Wifi },
                                  { key: 'admin_checkpoints', label: tText(tText("จัดการด่านจุดตรวจ รปภ.", "Guard Duty Stations"), "Guard Duty Stations"), icon: MapPin },
                                  { key: 'admin_reports', label: tText(tText("ส่งออกเมลรายงาน", "Export Email Reports"), "Export Email Reports"), icon: Mail },
                                  { key: 'admin_config', label: tText(tText("ตั้งค่าองค์กรและโลโก้", "Branding Config"), "Branding Config"), icon: Sliders },
                                  { key: 'admin_permissions', label: tText(tText("จัดการและแก้ไขสิทธิ์ใช้งาน", "Role Permissions"), "Role Permissions"), icon: Key, danger: true },
                                ].map((sub) => {
                                  const Icon = sub.icon;
                                  const isChecked = sub.key === 'admin_staff'
                                    ? !!(roleMenuPermissions[selectedRoleToConfig]?.[sub.key] ?? roleMenuPermissions[selectedRoleToConfig]?.admin_visitors ?? false)
                                    : !!(roleMenuPermissions[selectedRoleToConfig]?.[sub.key] ?? false);
                                  return (
                                    <label 
                                      key={sub.key} 
                                      className={`flex items-start gap-3 p-3 rounded-xl border transition duration-150 cursor-pointer ${
                                        isChecked 
                                          ? 'bg-purple-600/5 border-purple-500/20 text-slate-200' 
                                          : 'bg-slate-900/25 border-slate-850 text-slate-500'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        disabled={!roleMenuPermissions[selectedRoleToConfig]?.admin}
                                        checked={roleMenuPermissions[selectedRoleToConfig]?.admin ? isChecked : false}
                                        onChange={(e) => {
                                          // Prevent administrator from disabling their own permissions tab to avoid lockouts
                                          if (selectedRoleToConfig.includes('Administrator') && (sub.key === 'admin_permissions')) {
                                            alert(tText(tText("ไม่สามารถถอนสิทธิ์การตั้งค่าสิทธิ์สำหรับแอดมินสูงสุดได้ เพื่อป้องกันปัญหาการเข้าถึงของแอดมิน", "Administrator role constraints cannot be cleared to ensure system access."), "Administrator role constraints cannot be cleared to ensure system access."));
                                            return;
                                          }
                                          setRoleMenuPermissions(prev => {
                                            const roleData = prev[selectedRoleToConfig] || {};
                                            return {
                                              ...prev,
                                              [selectedRoleToConfig]: {
                                                ...roleData,
                                                [sub.key]: e.target.checked
                                              }
                                            };
                                          });
                                        }}
                                        className="w-4 h-4 mt-0.5 text-purple-600 border-slate-800 rounded focus:ring-blue-500 accent-purple-500 disabled:opacity-40"
                                      />
                                      <div>
                                        <span className={`text-xs font-bold flex items-center gap-1.5 ${!roleMenuPermissions[selectedRoleToConfig]?.admin ? 'opacity-40' : ''}`}>
                                          <Icon className={`w-3.5 h-3.5 ${isChecked ? 'text-purple-400' : 'text-slate-600'}`} />
                                          {sub.label}
                                        </span>
                                        {!roleMenuPermissions[selectedRoleToConfig]?.admin && (
                                          <span className="block text-[8px] text-rose-500 font-semibold mt-1">
                                            ({tText("ต้องเปิดใช้ระบบจัดการหลังบ้านก่อน", "Requires System Admin access first")})
                                          </span>
                                        )}
                                        {sub.danger && isChecked && (
                                          <span className="block text-[8px] text-amber-500 font-bold mt-1">
                                            ⚠️ {tText("มีสิทธิ์แก้ไขความปลอดภัยระบบหลัก", "Authorized to modify core system security")}
                                          </span>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Descriptive Summary of Access Group */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-slate-400 text-xs leading-relaxed">
                              💡 <strong>{tText(tText("คำแนะนำนโยบายความปลอดภัย:", "Security Policy Guidelines:"), "Security Policy Guidelines:")}</strong> {tText(tText("บัญชีผู้ใช้ประเภท", "User account type"), "User account type")} <strong>{selectedRoleToConfig.split(' ')[0]}</strong> {
                                roleMenuPermissions[selectedRoleToConfig]?.admin 
                                  ? tText(tText("ได้รับอนุญาตให้เป็นผู้บริหารระบบความปลอดภัยระดับสูงและมีสิทธิ์เข้าถึงรายงานและฟังก์ชันของเจ้าหน้าที่ส่วนหน้าได้ทั้งหมด", "Granted root administrator level authorization with access to all front desk metrics."), "Granted root administrator level authorization with access to all front desk metrics.")
                                  : tText(tText("ได้รับอนุญาตให้ดำเนินงานเฉพาะหน้าด่านเข้า-ออกและจัดทำทะเบียนใหม่เท่านั้น ป้องกันปัญหาข้อมูลรั่วไหลสู่บุคคลภายนอก", "Authorized strictly for gate registration and verification to protect system integrity."), "Authorized strictly for gate registration and verification to protect system integrity.")
                              }
                            </div>

                          </div>

                        </div>
                      </div>
                    )}

                  </div>

                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>
        </div>
      )}


      {showRegSuccess && newPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print" id="reg-success-modal">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center flex flex-col gap-5"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-10 h-10" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-slate-100">{tText(tText("ลงทะเบียนสำเร็จ!", "Registration Successful!"), "Registration Successful!")}</h3>
              <p className="text-xs text-slate-400">{tText(tText("ระบบคลาวด์ได้ออกใบผ่านเข้า-ออกพื้นที่อิเล็กทรอนิกส์เรียบร้อยแล้ว", "The cloud system has successfully issued an electronic entry pass."), "The cloud system has successfully issued an electronic entry pass.")}</p>
            </div>

            {/* Visitor Summary */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center sm:items-start text-left">
              {/* Photo Thumbnail */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shrink-0 shadow-md">
                <img 
                  src={getDisplayPhotoUrl(newPass.photoUrl)} 
                  alt={newPass.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                  }}
                />
              </div>
              
              <div className="flex-1 space-y-2 w-full">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">{tText(tText("ชื่อผู้ติดต่อ:", "Visitor Name:"), "Visitor Name:")}</span>
                  <span className="text-slate-200 font-extrabold">{newPass.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">{tText(tText("บริษัท:", "Company:"), "Company:")}</span>
                  <span className="text-slate-200 font-bold">{newPass.company || tText(tText("ไม่ระบุ", "Unspecified"), "Unspecified")}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">{tText(tText("ประเภท:", "Type:"), "Type:")}</span>
                  <span className="text-blue-400 font-bold">{newPass.visitorType}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">{tText(tText("พื้นที่ติดต่อ:", "Contact Area:"), "Contact Area:")}</span>
                  <span className="text-emerald-400 font-bold font-mono">{newPass.contactArea}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">{tText("ออกใบผ่านโดย:", "Issued By:")}</span>
                  <span className="text-amber-400 font-extrabold">{newPass.registeredBy || tText(tText("ระบบอัตโนมัติ", "Automated System"), "Automated System")}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-800/60 pt-2">
                  <span className="text-slate-500 font-bold">PASS CODE:</span>
                  <span className="text-blue-500 font-mono font-black">{newPass.id}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => {
                  setShowRegSuccess(false);
                  setActiveTab('register');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/10 transition duration-150 cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                id="reg-success-ok-btn"
              >
                <Check className="w-4 h-4" /> {tText("ตกลง / ลงทะเบียนคนต่อไป", "OK & Register Next")}
              </button>
              <button
                onClick={() => {
                  setShowRegSuccess(false);
                }}
                className="w-full bg-slate-850 hover:bg-slate-800 text-slate-400 font-medium py-2 px-4 rounded-xl border border-slate-800 transition duration-150 cursor-pointer text-xs"
              >
                {tText("ปิดหน้าต่างนี้", "Close Window")}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 5. Google Auth Iframe / Popup Warning Modal */}
      {showAuthIframeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print" id="auth-warning-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 text-center relative">
            <button 
              onClick={() => setShowAuthIframeWarning(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition p-1 rounded-full hover:bg-slate-800 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mt-2">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-100 tracking-wide">
                {tText("ข้อจำกัดของระบบบราวเซอร์", "Browser Limitations")}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {tText("เนื่องจากระบบความปลอดภัยของเว็บบราวเซอร์ บล็อกการทำรายการล็อกอินด้วย Google Account เมื่อเปิดแอปพลิเคชันอยู่ภายในกรอบจำลองพรีวิว ของ AI Studio", "Due to web browser security policies, Google Account Sign-In popups are blocked inside the AI Studio sandbox iframe.")}
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left flex flex-col gap-2">
              <h4 className="text-xs font-bold text-slate-300">{tText("💡 วิธีแก้ไขปัญหาอย่างง่าย:", "💡 Quick Troubleshooting Tips:")}</h4>
              <ol className="text-xs text-slate-400 list-decimal pl-4 space-y-1">
                <li>{tText("คลิกที่ปุ่ม", "Click the button")} <strong className="text-blue-400">"{tText("เปิดแอปในแท็บใหม่", "Open App in New Tab")}"</strong> {tText("ด้านล่าง", "below")}</li>
                <li>{tText("บราวเซอร์จะเปิดตัวระบบของจริงขึ้นมาแยกอีกหน้าต่าง", "The browser will launch the actual application in a separate window.")}</li>
                <li>{tText("จากนั้นคลิก", "Then click")} <strong className="text-blue-400">"{tText("เชื่อมต่อคลาวด์", "Connect Cloud")}"</strong> {tText("ในแท็บใหม่ จะสามารถเข้าสู่ระบบและเชื่อมโยง Google Sheets & Drive ได้ทันที!", "in the new tab. You can authorize Google connection securely there!")}</li>
              </ol>
            </div>

            <div className="flex flex-col gap-2.5">
              <a 
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-4 rounded-xl shadow-lg transition duration-150 uppercase tracking-wider text-xs text-center flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {tText("เปิดแอปพลิเคชันในแท็บใหม่", "Open Application in New Tab")}
              </a>
              <button
                onClick={async () => {
                  setShowAuthIframeWarning(false);
                  try {
                    const result = await googleSignIn();
                    if (result) {
                      const email = result.user.email || '';
                      if (email.toLowerCase() !== 'kittisak.s99631@gmail.com') {
                        await logout();
                        setGoogleUser(null);
                        setDbConnected(false);
                        alert(tText(tText("ขออภัย ระบบอนุญาตเฉพาะบัญชี kittisak.s99631@gmail.com เท่านั้น", "Unauthorized. Access restricted to kittisak.s99631@gmail.com."), "Unauthorized. Access restricted to kittisak.s99631@gmail.com."));
                        return;
                      }
                      setGoogleUser(result.user);
                      setAccessToken(result.accessToken);
                      setDbConnected(true);
                      fetchBrandingConfig(result.accessToken);
                      fetchDashboardData(result.accessToken);
                      if (result.user.email) setRecipientEmail(result.user.email);
                    }
                  } catch (err: any) {
                    console.error(err);
                    alert(`เชื่อมต่อ Google API ล้มเหลว: ${err?.message || err}`);
                  }
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                {tText("พยายามเชื่อมต่อต่อในหน้านี้", "Try anyway in this page")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Profile & Permissions Edit Modal */}
      {showProfileModal && loggedInSystemUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in no-print" id="profile-edit-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-none flex flex-col gap-6">
            <button 
              onClick={() => {
                setShowProfileModal(false);
                setProfileCameraOpen(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition p-1.5 rounded-full hover:bg-slate-800 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100 tracking-wide">
                  {tText("แก้ไขข้อมูลโปรไฟล์เจ้าหน้าที่ & ตรวจสอบสิทธิ์การใช้งาน", "Edit Staff Profile & Verify Permissions")}
                </h3>
                <p className="text-xs text-slate-400">{tText(tText("อัปเดตชื่อ อีเมล รูปถ่ายประจำตัว และเปลี่ยนรหัสผ่านเพื่อความปลอดภัย", "Update name, email, profile photo and security password"), "Update name, email, profile photo and security password")}</p>
              </div>
            </div>

            {/* Error/Success banners */}
            {profileError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}
            {profileSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Column: Avatar & Permissions list */}
              <div className="md:col-span-5 flex flex-col gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-3">{tText(tText("รูปถ่ายประจำตัวผู้ใช้งาน", "User Profile Photo"), "User Profile Photo")}</label>
                  
                  {profileCameraOpen ? (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                      <CameraCapture 
                        onCapture={async (base64) => {
                          try {
                            const compressed = await resizeAndCompressImage(base64);
                            setProfileForm(prev => ({ ...prev, avatar: compressed }));
                          } catch (err) {
                            setProfileForm(prev => ({ ...prev, avatar: base64 }));
                          }
                          setProfileCameraOpen(false);
                        }}
                        buttonText={tText("ถ่ายภาพใบหน้า", "Capture Face")}
                        autoLandmarks={false}
                        autoCapture={false}
                      />
                      <button
                        type="button"
                        onClick={() => setProfileCameraOpen(false)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-3 rounded-xl text-xs transition cursor-pointer"
                      >
                        {tText("ยกเลิกกล้องถ่ายรูป", "Cancel Camera")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 bg-slate-950 border border-slate-800/80 rounded-2xl p-5 text-center">
                      <div className="relative w-[150px] h-[150px] rounded-2xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center font-black text-3xl text-blue-400 shadow-md overflow-hidden group shrink-0">
                        {profileForm.avatar ? (
                          <img src={profileForm.avatar} className="w-full h-full object-contain p-1.5 rounded-2xl bg-slate-950/40" alt="Avatar Preview" />
                        ) : (
                          profileForm.name ? profileForm.name.charAt(0).toUpperCase() : 'U'
                        )}
                        {profileForm.avatar && (
                          <button
                            type="button"
                            onClick={() => setProfileForm(prev => ({ ...prev, avatar: null }))}
                            className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-black text-rose-400 cursor-pointer animate-fade-in"
                          >
                            {tText("ลบรูปถ่าย", "Delete Photo")}
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 w-full">
                        {/* File upload input hidden, custom styled label */}
                        <label className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition flex items-center justify-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" /> {tText("อัปโหลดรูปภาพ", "Upload Image")}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  try {
                                    const compressed = await resizeAndCompressImage(reader.result as string);
                                    setProfileForm(prev => ({ ...prev, avatar: compressed }));
                                  } catch (err) {
                                    setProfileForm(prev => ({ ...prev, avatar: reader.result as string }));
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden" 
                          />
                        </label>
                        
                        <button
                          type="button"
                          onClick={() => setProfileCameraOpen(true)}
                          className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/25 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" /> {tText("ถ่ายภาพด้วยกล้องเว็บแคม", "Take Webcam Photo")}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">{tText(tText("รองรับไฟล์รูปภาพ JPG, PNG (สัดส่วนภาพแบบจัตุรัสจะแสดงผลดีที่สุด)", "Supports JPG, PNG"), "Supports JPG, PNG")}</p>
                    </div>
                  )}
                </div>

                {/* Permissions & Privileges Section */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">{tText(tText("ตรวจสอบสิทธิ์การใช้งานของกลุ่ม", "Check Group Permissions"), "Check Group Permissions")}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2.5 mt-1">
                    {(() => {
                      const perms = roleMenuPermissions[loggedInSystemUser.role] || {
                        gate: true, register: true, pass: true, admin: false,
                        admin_dashboard: false, admin_visitors: false, admin_checkpoints: false, admin_reports: false, admin_config: false, admin_permissions: false
                      };
                      const dynamicList = [
                        { desc: tText(tText("สแกนเช็คอิน เข้า-ออก", "Check-In / Out Gate Access"), "Check-In / Out Gate Access"), allowed: !!perms.gate },
                        { desc: tText(tText("ลงทะเบียนใบผ่านใหม่", "Register Pass"), "Register Pass"), allowed: !!perms.register },
                        { desc: tText(tText("ดูและพิมพ์บัตรผ่านทาง", "View & Print Pass"), "View & Print Pass"), allowed: !!perms.pass },
                        { desc: tText("สิทธิ์ระบบจัดการหลังบ้าน", "System Admin Access"), allowed: !!perms.admin },
                        { desc: tText(tText("สิทธิ์เข้าถึงรายงานสถิติวิเคราะห์", "Authorize analytics and trends"), "Authorize analytics and trends"), allowed: !!perms.admin_dashboard },
                        { desc: tText(tText("สิทธิ์จัดการบัญชีแบน / ข้อมูลพนักงาน", "Authorize visitor blacklist & employee log access"), "Authorize visitor blacklist & employee log access"), allowed: !!perms.admin_visitors },
                        { desc: tText(tText("สิทธิ์กำหนดจุดตั้งสถานีตรวจของ รปภ.", "Authorize duty station config for guards"), "Authorize duty station config for guards"), allowed: !!perms.admin_checkpoints },
                        { desc: tText(tText("สิทธิ์ส่งเมลไฟล์รายงานอัตโนมัติ", "Authorize automated email summaries"), "Authorize automated email summaries"), allowed: !!perms.admin_reports },
                        { desc: tText(tText("สิทธิ์เข้าถึงหน้าต่างตั้งค่าแบรนด์องค์กร", "Authorize branding configurations"), "Authorize branding configurations"), allowed: !!perms.admin_config },
                        { desc: tText(tText("สิทธิ์ปรับแต่งสิทธิ์ใช้งานตามตำแหน่ง", "Authorize role access modifications"), "Authorize role access modifications"), allowed: !!perms.admin_permissions }
                      ];
                      return dynamicList.map((perm, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-left">
                          {perm.allowed ? (
                            <div className="w-4.5 h-4.5 rounded bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4.5 h-4.5 rounded bg-rose-500/10 border border-rose-500/25 text-rose-500/60 flex items-center justify-center shrink-0 mt-0.5">
                              <X className="w-3 h-3 stroke-[2.5]" />
                            </div>
                          )}
                          <span className={`text-[11px] leading-tight font-medium ${perm.allowed ? 'text-slate-300' : 'text-slate-500 line-through decoration-slate-800/85'}`}>
                            {perm.desc}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 text-center bg-slate-900/45 p-2 rounded-lg border border-dashed border-slate-800">
                    {tText("บทบาทปัจจุบันของคุณคือ", "Your current role is")} <strong className="text-blue-400 font-black">{loggedInSystemUser.role}</strong> {tText("ซึ่งได้รับการตั้งค่าและอนุญาตสิทธิ์ตามกลุ่มนโยบายความมั่นคงปลอดภัย", "which has been configured and authorized under the security policy group.")}
                    {!isSuperAdminUser(loggedInSystemUser) && (
                      <span className="block mt-1 text-amber-400 font-medium">
                        ⏱️ {tText("ออกจากระบบอัตโนมัติหากไม่มีการใช้งานต่อเนื่องเกิน 30 นาที", "Auto-logout after 30 minutes of inactivity")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Profile Input fields */}
              <div className="md:col-span-7 flex flex-col gap-5 justify-between">
                <div className="flex flex-col gap-4">
                  {/* Read Only Stats Block */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-950 border border-slate-800/50 rounded-2xl p-4">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">{tText(tText("ชื่อผู้ใช้งาน", "Username"), "Username")}</span>
                      <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1 mt-0.5">
                        <Lock className="w-3 h-3 text-slate-500" /> @{loggedInSystemUser.username}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">{tText(tText("ตำแหน่งระบบ", "System Role"), "System Role")}</span>
                      <span className="text-xs font-extrabold text-blue-400 flex items-center gap-1 mt-0.5">
                        <Shield className="w-3 h-3 text-blue-500" /> {loggedInSystemUser.role.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">{tText(tText("ชื่อ-นามสกุลเจ้าหน้าที่", "Guard Full Name"), "Guard Full Name")} <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={tText(tText("กรอกชื่อและนามสกุลจริง", "Enter real name and surname"), "Enter real name and surname")}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs font-bold focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">{tText(tText("ที่อยู่อีเมลติดต่อ", "Contact Email Address"), "Contact Email Address")}</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="somchay.g@company.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* New Password Header */}
                  <div className="border-t border-slate-800/80 pt-4 mt-2">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Key className="w-4 h-4 text-blue-400" />
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">{tText(tText("เปลี่ยนรหัสผ่านส่วนตัว", "Reset Security Password"), "Reset Security Password")}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Password */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">{tText(tText("รหัสผ่านใหม่", "New Password"), "New Password")}</label>
                        <input
                          type="password"
                          value={profileForm.password}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder={tText(tText("กรอกรหัสผ่านใหม่", "Enter new password"), "Enter new password")}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">{tText(tText("ยืนยันรหัสผ่านใหม่อีกครั้ง", "Confirm New Password"), "Confirm New Password")}</label>
                        <input
                          type="password"
                          value={profileForm.confirmPassword}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder={tText(tText("กรอกเพื่อยืนยัน", "Enter to confirm"), "Enter to confirm")}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center gap-3 border-t border-slate-800/80 pt-5 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-4 rounded-xl shadow-lg transition duration-150 cursor-pointer text-xs uppercase tracking-wider text-center"
                  >
                    {tText("บันทึกการเปลี่ยนแปลง", "Save Profile")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileModal(false);
                      setProfileCameraOpen(false);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-5 rounded-xl border border-slate-700/80 transition duration-150 cursor-pointer text-xs"
                  >
                    {tText("ยกเลิก", "Cancel")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Administrative Staff Edit & Password Reset Modal */}
      {showStaffEditModal && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in no-print" id="staff-edit-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-none flex flex-col gap-6">
            <button 
              onClick={() => {
                setShowStaffEditModal(false);
                setStaffCameraOpen(false);
                setEditingStaff(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition p-1.5 rounded-full hover:bg-slate-800 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  {isStaffCreateMode ? <UserPlus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                </div>
                <h3 className="text-base font-extrabold text-slate-100">
                  {isStaffCreateMode ? 'สร้างบัญชีผู้ใช้งานระบบและกำหนดสิทธิ์' : tText(tText("แก้ไขข้อมูลบัญชีและสิทธิ์ใช้งาน", "Modify system profile and access role settings"), "Modify system profile and access role settings")}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isStaffCreateMode 
                  ? tText(tText("สร้างบัญชีใหม่เพื่อเข้าใช้งานระบบและควบคุมสิทธิ์ใช้งานตามตำแหน่งหน้าที่", "Create a system profile with role-based access controls."), "Create a system profile with role-based access controls.")
                  : tText(tText("ผู้ดูแลระบบและผู้จัดการสามารถปรับปรุงชื่อ อีเมล สิทธิ์การเข้าถึง และรีเซ็ตรหัสผ่านให้กับผู้ใช้ระบบ", "Admins and Managers can update guard name, email, access levels, and reset passwords."), "Admins and Managers can update guard name, email, access levels, and reset passwords.")}
              </p>
            </div>

            <form onSubmit={handleSaveStaffByAdmin} className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Column: Avatar Camera & Upload */}
              <div className="md:col-span-4 flex flex-col gap-4">
                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">{tText(tText("รูปถ่ายประจำตัว", "Profile Photo"), "Profile Photo")}</span>
                {staffCameraOpen ? (
                  <div className="flex flex-col gap-3">
                    <CameraCapture
                      onCapture={async (base64) => {
                        try {
                          const compressed = await resizeAndCompressImage(base64);
                          setStaffForm(prev => ({ ...prev, avatar: compressed }));
                        } catch (err) {
                          setStaffForm(prev => ({ ...prev, avatar: base64 }));
                        }
                        setStaffCameraOpen(false);
                      }}
                      buttonText={tText("ถ่ายภาพใบหน้า", "Capture Face")}
                      autoLandmarks={false}
                      autoCapture={false}
                    />
                    <button
                      type="button"
                      onClick={() => setStaffCameraOpen(false)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-3 rounded-xl text-xs transition cursor-pointer"
                    >
                      {tText("ยกเลิกกล้องถ่ายรูป", "Cancel Camera")}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 bg-slate-950 border border-slate-800/80 rounded-2xl p-5 text-center">
                    <div className="relative w-28 h-28 rounded-2xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center font-black text-3xl text-blue-400 shadow-md overflow-hidden group shrink-0">
                      {staffForm.avatar ? (
                        <img src={staffForm.avatar} className="w-full h-full object-contain p-1.5 rounded-2xl bg-slate-950/40" alt="Avatar Preview" />
                      ) : (
                        staffForm.name ? staffForm.name.charAt(0).toUpperCase() : 'U'
                      )}
                      {staffForm.avatar && (
                        <button
                          type="button"
                          onClick={() => setStaffForm(prev => ({ ...prev, avatar: null }))}
                          className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-black text-rose-400 cursor-pointer animate-fade-in"
                        >
                          {tText("ลบรูปถ่าย", "Delete Photo")}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                      <label className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition flex items-center justify-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" /> {tText("อัปโหลดรูปภาพ", "Upload Image")}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                try {
                                  const compressed = await resizeAndCompressImage(reader.result as string);
                                  setStaffForm(prev => ({ ...prev, avatar: compressed }));
                                } catch (err) {
                                  setStaffForm(prev => ({ ...prev, avatar: reader.result as string }));
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden" 
                        />
                      </label>
                      
                      <button
                        type="button"
                        onClick={() => setStaffCameraOpen(true)}
                        className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/25 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" /> {tText("ถ่ายภาพด้วยกล้องเว็บแคม", "Take Webcam Photo")}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">{tText("สัดส่วนภาพแบบจัตุรัสจะแสดงผลดีที่สุด", "Square aspect ratio works best")}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Account Details & Permissions */}
              <div className="md:col-span-8 flex flex-col justify-between">
                <div className="flex flex-col gap-4">
                  {/* Status Toast */}
                  {staffError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs font-bold animate-pulse">
                      ⚠️ {staffError}
                    </div>
                  )}
                  {staffSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-bold animate-pulse">
                      🎉 {staffSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                        {isStaffCreateMode ? tText(tText("ชื่อผู้ใช้งาน *", "Username *"), "Username *") : tText(tText("ชื่อผู้ใช้งาน - เปลี่ยนไม่ได้", "Username"), "Username")}
                      </label>
                      <input
                        type="text"
                        disabled={!isStaffCreateMode}
                        value={staffForm.username}
                        onChange={(e) => setStaffForm(prev => ({ ...prev, username: e.target.value }))}
                        placeholder={isStaffCreateMode ? tText("เช่น apichart_s", "e.g., apichart_s") : tText("ชื่อผู้ใช้งาน", "Username")}
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:border-blue-500 focus:outline-none ${
                          isStaffCreateMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100' 
                            : 'bg-slate-950/60 border-slate-850 text-slate-500 select-none'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">{tText(tText("บทบาทสิทธิ์ใช้งานระบบ", "System Role"), "System Role")} <span className="text-rose-500">*</span></label>
                      <select
                        value={staffForm.role}
                        onChange={(e) => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                      >
                        <option value={tText("เจ้าหน้าที่ระบบ", "Staff")}>{tText(tText("เจ้าหน้าที่ระบบ", "Staff"), "Staff")}</option>
                        <option value={tText("เจ้าหน้าที่รักษาความปลอดภัย", "Security Guard")}>{tText(tText("เจ้าหน้าที่รักษาความปลอดภัย", "Security Guard"), "Security Guard")}</option>
                        <option value={tText("หัวหน้าฝ่ายความปลอดภัย", "Supervisor")}>{tText(tText("หัวหน้าฝ่ายความปลอดภัย", "Supervisor"), "Supervisor")}</option>
                        <option value={tText("ผู้จัดการ", "Manager")}>{tText(tText("ผู้จัดการ", "Manager"), "Manager")}</option>
                        <option value={tText("ผู้ดูแลระบบระดับสูง", "Administrator")}>{tText(tText("ผู้ดูแลระบบระดับสูง", "Administrator"), "Administrator")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">{tText(tText("ชื่อ-นามสกุลจริง", "Full Name"), "Full Name")} <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={staffForm.name}
                        onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={tText(tText("เช่น นายอภิชาติ แสนดี", "e.g., John Doe"), "e.g., John Doe")}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">{tText(tText("อีเมลติดต่อ", "Contact Email"), "Contact Email")}</label>
                      <input
                        type="email"
                        value={staffForm.email}
                        onChange={(e) => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="apichart@security.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 my-2 pt-4">
                    <span className="block text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-1.5 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> {isStaffCreateMode ? tText(tText("รหัสผ่านเริ่มต้นสำหรับเข้าใช้งาน *", "Default Login Password *"), "Default Login Password *") : tText(tText("เปลี่ยนรหัสผ่านใหม่", "Password Reset"), "Password Reset")}
                    </span>
                    <p className="text-[10px] text-slate-500 mb-3">
                      {isStaffCreateMode 
                        ? tText(tText("กำหนดรหัสผ่านเริ่มต้นสำหรับบัญชีนี้ รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร", "Define default password. Must be at least 6 characters."), "Define default password. Must be at least 6 characters.")
                        : tText(tText("กรอกข้อมูลเฉพาะกรณีที่ต้องการรีเซ็ตตั้งรหัสผ่านใหม่ให้กับผู้ใช้นี้ หากเว้นว่างไว้จะเป็นการใช้รหัสผ่านเดิม", "Fill only to reset the password. Leave blank to keep original."), "Fill only to reset the password. Leave blank to keep original.")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                          {isStaffCreateMode ? tText(tText("รหัสผ่านเริ่มต้น *", "Default Password *"), "Default Password *") : tText(tText("รหัสผ่านใหม่", "New Password"), "New Password")}
                        </label>
                        <input
                          type="password"
                          value={staffForm.password}
                          onChange={(e) => setStaffForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder={isStaffCreateMode ? tText("กำหนดรหัสผ่านตั้งต้น", "Set initial password") : tText("กรอกเพื่อตั้งใหม่", "Enter to reset")}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                          {isStaffCreateMode ? tText(tText("ยืนยันรหัสผ่าน *", "Confirm Password *"), "Confirm Password *") : tText(tText("ยืนยันรหัสผ่านใหม่", "Confirm New Password"), "Confirm New Password")}
                        </label>
                        <input
                          type="password"
                          value={staffForm.confirmPassword}
                          onChange={(e) => setStaffForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder={isStaffCreateMode ? tText("ยืนยันรหัสผ่าน", "Confirm password") : tText("ยืนยันเพื่อความถูกต้อง", "Confirm for accuracy")}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center gap-3 border-t border-slate-800/80 pt-5 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-4 rounded-xl shadow-lg transition duration-150 cursor-pointer text-xs uppercase tracking-wider text-center"
                  >
                    {isStaffCreateMode ? 'สร้างบัญชีผู้ใช้งานระบบ' : tText(tText("บันทึกข้อมูลเจ้าหน้าที่", "Save Staff Info"), "Save Staff Info")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStaffEditModal(false);
                      setStaffCameraOpen(false);
                      setEditingStaff(null);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-5 rounded-xl border border-slate-700/80 transition duration-150 cursor-pointer text-xs"
                  >
                    {tText("ยกเลิก", "Cancel")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Checkpoint & Guard Duty Assignment Edit Modal */}
      {editingCheckpointGuard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in no-print" id="checkpoint-edit-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-none flex flex-col gap-5">
            <button 
              onClick={() => {
                setEditingCheckpointGuard(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition p-1.5 rounded-full hover:bg-slate-800 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-100">{tText(tText("มอบหมายจุดและพื้นที่สแกน", "Guard Station Settings"), "Guard Station Settings")}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">{tText(tText("ตั้งค่าจุดปฏิบัติงานประจำวันและขอบเขตพื้นที่ที่ได้รับอนุญาตให้เจ้าหน้าที่สแกน", "Set daily duty checkpoint and allowed areas for scanning."), "Set daily duty checkpoint and allowed areas for scanning.")}</p>
            </div>

            {/* Guard Profile Summary */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-black text-lg overflow-hidden shrink-0">
                {editingCheckpointGuard.avatar ? (
                  <img src={editingCheckpointGuard.avatar} className="w-full h-full object-cover" alt={editingCheckpointGuard.name} />
                ) : (
                  editingCheckpointGuard.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-left">
                <h4 className="text-sm font-extrabold text-slate-200">{editingCheckpointGuard.name}</h4>
                <p className="text-xs text-slate-500 font-mono">@{editingCheckpointGuard.username} | {editingCheckpointGuard.role}</p>
              </div>
            </div>

            {/* Select Active Checkpoint */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[11px] uppercase font-bold text-slate-400">{tText(tText("จุดตรวจปฏิบัติงานวันนี้", "Daily Duty Checkpoint"), "Daily Duty Checkpoint")}</label>
              <select
                value={tempActiveCheckpoint}
                onChange={(e) => {
                  setTempActiveCheckpoint(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-bold cursor-pointer"
              >
                {CONTACT_AREAS.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {/* Allowed Contact Areas (Checkboxes) */}
            <div className="flex flex-col gap-2 text-left">
              <label className="text-[11px] uppercase font-bold text-slate-400">{tText(tText("ขอบเขตพื้นที่ที่สแกนเช็คอินได้", "Allowed Scanning Areas"), "Allowed Scanning Areas")}</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 border border-slate-800 p-3.5 rounded-xl max-h-48 overflow-y-auto">
                {CONTACT_AREAS.map(area => {
                  const isChecked = tempAllowedAreas.includes(area);
                  return (
                    <label key={area} className="flex items-center gap-2 text-slate-300 hover:text-slate-100 cursor-pointer text-xs select-none py-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            if (!tempAllowedAreas.includes(area)) {
                              setTempAllowedAreas(prev => [...prev, area]);
                            }
                          } else {
                            setTempAllowedAreas(prev => prev.filter(a => a !== area));
                          }
                        }}
                        className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                      />
                      <span className="font-medium font-mono text-[11px] truncate">{area}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setTempAllowedAreas(CONTACT_AREAS);
                }}
                className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-2 px-3 rounded-xl text-[10px] transition cursor-pointer text-center"
              >
                {tText("อนุมัติครบทุกพื้นที่", "Full Access")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempAllowedAreas([tempActiveCheckpoint]);
                }}
                className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-2 px-3 rounded-xl text-[10px] transition cursor-pointer text-center"
              >
                {tText("เฉพาะจุดตรวจเดียว", "Strict Single Area")}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 border-t border-slate-800/80 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  // Save state back to guardAssignments
                  const updated = [...guardAssignments];
                  const index = updated.findIndex(a => a.username === editingCheckpointGuard.username);
                  const item = {
                    username: editingCheckpointGuard.username,
                    activeCheckpoint: tempActiveCheckpoint,
                    allowedAreas: tempAllowedAreas,
                    assignedBy: loggedInSystemUser?.name || 'Admin',
                    updatedAt: new Date().toISOString()
                  };
                  if (index > -1) {
                    updated[index] = item;
                  } else {
                    updated.push(item);
                  }
                  setGuardAssignments(updated);
                  setEditingCheckpointGuard(null);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-4 rounded-xl shadow-lg transition duration-150 cursor-pointer text-xs uppercase tracking-wider text-center"
              >
                {tText("บันทึกการมอบหมาย", "Save Assignment")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingCheckpointGuard(null);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-5 rounded-xl border border-slate-700/80 transition duration-150 cursor-pointer text-xs"
              >
                {tText("ยกเลิก", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Visitor Pass Print & Verify Modal */}
      {newPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in overflow-y-auto" id="pass-print-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col gap-5 my-8">
            <button 
              onClick={() => {
                setNewPass(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition p-1.5 rounded-full hover:bg-slate-800 cursor-pointer z-50"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-100">{tText(tText("ตรวจสอบและสั่งพิมพ์ใบผ่าน", "Verify & Print Pass"), "Verify & Print Pass")}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">{tText(tText("ตรวจสอบความถูกต้องของข้อมูลผู้เข้าติดต่อก่อนจัดทำใบผ่านทางเข้าพื้นที่", "Verify visitor details before printing the physical entry pass."), "Verify visitor details before printing the physical entry pass.")}</p>
            </div>

            {/* Scrollable Container for Pass Card */}
            <div className="bg-slate-950/40 border border-slate-800/80 p-4 sm:p-6 rounded-2xl max-h-[60vh] overflow-y-auto flex justify-center scrollbar-none">
              <PassBadge visitor={newPass} config={config} />
            </div>

            {/* Quick Actions Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => {
                  setNewPass(null);
                }}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-5 rounded-xl border border-slate-700/80 transition duration-150 cursor-pointer text-xs"
              >
                {tText("ปิดหน้าต่าง", "Close Window")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. PWA Install Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in no-print" id="pwa-install-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative flex flex-col gap-5">
            <button 
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition p-1 rounded-full hover:bg-slate-800 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center gap-3 mt-2">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/5">
                <Smartphone className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-wide text-slate-100">
                  {lang === 'TH' ? tText(tText("วิธีติดตั้งแอปบนหน้าจอโฮม", "PWA Home Screen Installation Guide"), "PWA Home Screen Installation Guide") : 'How to Install to Home Screen'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'TH' 
                    ? tText(tText("ติดตั้งแอปเพื่อใช้งานบนมือถือแบบแอปจริง รวดเร็ว ไม่ต้องเปิดหน้าเว็บซ้ำ", "Install the app for a native mobile experience, fast and lightweight."), "Install the app for a native mobile experience, fast and lightweight.") 
                    : 'Install the app to use it like a native mobile app for fast access.'}
                </p>
              </div>
            </div>

            <div className="w-full border-t border-slate-800/80 my-1"></div>

            {/* Instruction Steps */}
            <div className="flex flex-col gap-4 text-xs">
              {/* For iOS Devices */}
              <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-xl flex flex-col gap-2.5">
                <span className="font-extrabold text-blue-400 text-[10px] uppercase tracking-wider block">
                  {tText("📱 สำหรับ iPhone / iPad", "📱 For iPhone / iPad")}
                </span>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-300 font-bold leading-relaxed">
                  <li>{tText("เปิดหน้านี้ด้วยเบราว์เซอร์", "Open this page in browser")} <span className="text-blue-400 font-extrabold">Safari</span> {tText("เท่านั้น", "only")}</li>
                  <li>{tText("กดปุ่ม", "Click")} <span className="text-blue-400 font-extrabold">"{tText("แชร์", "Share")}"</span> {tText("ที่แถบเมนูด้านล่าง", "at the bottom menu")}</li>
                  <li>{tText("เลื่อนลงแล้วกดเลือก", "Scroll down and choose")} <span className="text-blue-400 font-extrabold">"{tText("เพิ่มไปยังหน้าจอโฮม", "Add to Home Screen")}"</span></li>
                  <li>{tText("กดปุ่ม", "Click")} <span className="text-blue-400 font-extrabold">"{tText("เพิ่ม", "Add")}"</span> {tText("ที่มุมขวาบนของจอ เพื่อเริ่มใช้งานทันที!", "at the top-right to start using immediately!")}</li>
                </ol>
              </div>

              {/* For Android Devices */}
              <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-xl flex flex-col gap-2.5">
                <span className="font-extrabold text-emerald-400 text-[10px] uppercase tracking-wider block">
                  {tText("🤖 สำหรับ Android", "🤖 For Android")}
                </span>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-300 font-bold leading-relaxed">
                  <li>{tText("กดปุ่ม", "Click")} <span className="text-emerald-400 font-extrabold">"{tText("จุดสามจุด", "three dots")}"</span> {tText("ที่มุมขวาบน", "at the top-right corner")}</li>
                  <li>{tText("กดเลือกเมนู", "Select menu")} <span className="text-emerald-400 font-extrabold">"{tText("ติดตั้งแอป", "Install App")}"</span> {tText("หรือ", "or")} <span className="text-emerald-400 font-extrabold">"{tText("เพิ่มลงในหน้าจอหลัก", "Add to Home Screen")}"</span></li>
                  <li>{tText("กดยืนยันเพื่อทำการสร้างทางลัดบนเครื่องคุณเป็นที่เรียบร้อย!", "Confirm to create the shortcut on your device!")}</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-black py-2.5 rounded-xl border border-slate-700 transition duration-150 cursor-pointer text-xs uppercase tracking-wider font-sans mt-1"
            >
              {tText("รับทราบและทำตามขั้นตอน", "Understood, follow guidelines")}
            </button>
          </div>
        </div>
      )}

      {/* Active Visitors Currently Inside Modal */}
      <AnimatePresence>
        {showActiveVisitorsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-2xl w-full p-6 relative flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                      {tText("รายชื่อผู้ที่อยู่ในพื้นที่ขณะนี้", "Active Visitors Currently Inside")}
                      <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {dashboardStats.currentlyInside} {tText("คน", "persons")}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {tText("แทร็กระยะเวลาคงอยู่ในพื้นที่แบบเรียลไทม์", "Real-time time-in-area tracking for all checked-in visitors")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowActiveVisitorsModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveVisitorsModalFilter('all')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeVisitorsModalFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    {tText("ผู้อยู่ในพื้นที่ทั้งหมด", "All Currently Inside")}
                    <span className="bg-slate-900/60 text-slate-200 px-1.5 py-0.2 text-[10px] rounded-full">
                      {dashboardStats.currentlyInside}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveVisitorsModalFilter('overstay')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeVisitorsModalFilter === 'overstay'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/30'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
                    {tText("อยู่เกิน 24 ชั่วโมง", "Overstay >24 Hours")}
                    <span className="bg-rose-950 text-rose-300 px-2 py-0.2 text-[10px] rounded-full font-black border border-rose-500/30">
                      {overstay24hVisitors.length}
                    </span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={activeVisitorSearch}
                    onChange={(e) => setActiveVisitorSearch(e.target.value)}
                    placeholder={tText("ค้นหาผู้ที่อยู่ในพื้นที่", "Search active visitors")}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Active Visitors List */}
              <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                {(() => {
                  const activeInsideList = visitorsList.filter(v => {
                    const durationInfo = getVisitorDurationInfo(v.id, v.status, v.lastActivityAt);
                    if (!durationInfo.isInside) return false;
                    if (activeVisitorsModalFilter === 'overstay' && !durationInfo.isOverstay24h) return false;
                    if (!activeVisitorSearch.trim()) return true;
                    const q = activeVisitorSearch.toLowerCase();
                    return (
                      String(v.name || '').toLowerCase().includes(q) ||
                      String(v.id || '').toLowerCase().includes(q) ||
                      (v.company && String(v.company).toLowerCase().includes(q)) ||
                      (v.vehiclePlate && String(v.vehiclePlate).toLowerCase().includes(q)) ||
                      (v.contactArea && String(v.contactArea).toLowerCase().includes(q))
                    );
                  });

                  if (activeInsideList.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                        <Users className="w-8 h-8 text-slate-600" />
                        <p>
                          {activeVisitorsModalFilter === 'overstay'
                            ? tText("ไม่มีผู้เข้าติดต่อที่อยู่เกิน 24 ชั่วโมงในขณะนี้", "No visitors currently overstaying over 24 hours.")
                            : tText("ไม่พบบุคคลที่อยู่ในพื้นที่ขณะนี้ตามเงื่อนไขค้นหา", "No active visitors found inside area matching your search.")}
                        </p>
                      </div>
                    );
                  }

                  return activeInsideList.map((v, idx) => {
                    const durationInfo = getVisitorDurationInfo(v.id, v.status, v.lastActivityAt);
                    return (
                      <div key={`${v.id}-${idx}`} className={`bg-slate-950/80 border ${durationInfo.isOverstay24h ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800 hover:border-indigo-500/30'} rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition`}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={getDisplayPhotoUrl(v.photoUrl)}
                            alt={v.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-800 bg-slate-900 shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm text-slate-100 truncate">{v.name}</h4>
                              <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-bold">{v.id}</span>
                              {durationInfo.isOverstay24h && (
                                <span className="bg-rose-500/20 text-rose-300 text-[9.5px] font-black px-2 py-0.5 rounded border border-rose-500/30 flex items-center gap-1 animate-pulse">
                                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                                  {tText("อยู่เกิน 24 ชั่วโมง", "Overstay >24h")}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                              <span>🏢 {v.company || '-'}</span>
                              <span>🚗 {v.vehiclePlate || '-'}</span>
                              <span className="text-amber-400 font-medium">📍 {v.contactArea || 'MainGate'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Live Duration Counter Badge & Actions */}
                        <div className="flex flex-row sm:flex-col items-end justify-between w-full sm:w-auto gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-900">
                          <div className="flex flex-col items-start sm:items-end">
                            <span className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-1">
                              <Clock className={`w-3 h-3 ${durationInfo.isOverstay24h ? 'text-rose-400 animate-bounce' : 'text-emerald-400 animate-pulse'}`} />
                              {tText("เวลาอยู่ในพื้นที่:", "Time in area:")}
                            </span>
                            <span className={`font-mono font-black text-sm px-2.5 py-1 rounded-lg border ${
                              durationInfo.isOverstay24h 
                                ? 'text-rose-300 bg-rose-950/80 border-rose-500/40 shadow-rose-950/30' 
                                : 'text-emerald-300 bg-emerald-950/80 border-emerald-500/30'
                            }`}>
                              {durationInfo.durationText}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              handleAdminCheckInOut(v.id, 'check-out');
                              setShowActiveVisitorsModal(false);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border border-slate-700"
                          >
                            Check-Out
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  {tText("เวลานับเพิ่มอัตโนมัติทุกๆ 1 วินาที", "Duration updates automatically every second")}
                </span>
                <button
                  onClick={() => setShowActiveVisitorsModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  {tText("ปิดหน้าต่าง", "Close")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 11. Custom Beautiful Notification Modal (Popup) */}
      <AnimatePresence>
        {customNotification.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`bg-slate-900 border ${
                customNotification.type === 'warning'
                  ? 'border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.2)]'
                  : customNotification.type === 'error'
                  ? 'border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.2)]'
                  : 'border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.2)]'
              } rounded-3xl max-w-sm w-full p-6 relative flex flex-col items-center text-center gap-5 overflow-hidden`}
            >
              {/* Pulsing ring background effect */}
              <div className={`absolute -top-10 -left-10 w-40 h-40 ${
                customNotification.type === 'warning' ? 'bg-amber-500/10' : customNotification.type === 'error' ? 'bg-rose-500/10' : 'bg-emerald-500/10'
              } rounded-full blur-2xl pointer-events-none`}></div>
              <div className={`absolute -bottom-10 -right-10 w-40 h-40 ${
                customNotification.type === 'warning' ? 'bg-amber-500/10' : customNotification.type === 'error' ? 'bg-rose-500/10' : 'bg-emerald-500/10'
              } rounded-full blur-2xl pointer-events-none`}></div>

              {/* Icon */}
              <div className="relative mt-2">
                <div className={`absolute inset-0 rounded-full ${
                  customNotification.type === 'warning' ? 'bg-amber-500/20' : customNotification.type === 'error' ? 'bg-rose-500/20' : 'bg-emerald-500/20'
                } animate-ping opacity-75`}></div>
                <div className={`w-20 h-20 rounded-full ${
                  customNotification.type === 'warning'
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-amber-500/20'
                    : customNotification.type === 'error'
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-rose-500/20'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-emerald-500/20'
                } flex items-center justify-center shadow-lg relative z-10`}>
                  {customNotification.type === 'warning' ? (
                    <AlertTriangle className="w-12 h-12" />
                  ) : customNotification.type === 'error' ? (
                    <AlertTriangle className="w-12 h-12" />
                  ) : (
                    <CheckCircle className="w-12 h-12" />
                  )}
                </div>
              </div>

              {/* Text */}
              <div className="space-y-2 relative z-10">
                <h3 className="text-2xl font-black tracking-wide text-slate-100 uppercase">
                  {customNotification.title}
                </h3>
                <p className="text-sm text-slate-200 font-bold leading-relaxed px-2">
                  {customNotification.message}
                </p>
                {customNotification.subMessage && (
                  <p className="text-xs text-slate-400 font-medium">
                    {customNotification.subMessage}
                  </p>
                )}
              </div>

              {/* Progress bar simulation for auto-close */}
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 4, ease: "linear" }}
                  className={
                    customNotification.type === 'warning' 
                      ? 'bg-amber-400 h-full' 
                      : customNotification.type === 'error' 
                      ? 'bg-rose-400 h-full' 
                      : 'bg-emerald-400 h-full'
                  }
                />
              </div>

              {/* Action Button */}
              <button
                onClick={() => setCustomNotification(prev => ({ ...prev, isOpen: false }))}
                className={`w-full ${
                  customNotification.type === 'warning'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : customNotification.type === 'error'
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                } font-black py-3 rounded-2xl transition duration-150 cursor-pointer text-xs uppercase tracking-wider font-sans relative z-10 shadow-lg`}
              >
                {tText("ตกลง", "OK / Dismiss")}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expanded Image Lightbox Modal */}
      <AnimatePresence>
        {expandedImage && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setExpandedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center bg-slate-900/95 border border-slate-700/80 rounded-3xl p-4 shadow-2xl overflow-hidden"
            >
              {/* Top Control Bar */}
              <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 gap-4">
                <span className="text-xs font-black text-slate-200 truncate">
                  {expandedImage.title || 'ดูรูปขนาดขยาย'}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={expandedImage.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                    title="เปิดรูปในแท็บใหม่"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setExpandedImage(null)}
                    className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-rose-600 transition cursor-pointer"
                    title="ปิด"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Image Display */}
              <div className="relative w-full flex-1 flex items-center justify-center overflow-auto p-2 my-2">
                <img
                  src={expandedImage.url}
                  alt="Expanded Preview"
                  className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg border border-slate-800"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600';
                  }}
                />
              </div>

              {/* Bottom hint */}
              <div className="text-[11px] text-slate-400 font-bold">
                คลิกที่บริเวณด้านนอก หรือกดปุ่ม ✕ / ESC เพื่อปิด
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
