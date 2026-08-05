import React from 'react';
import { FileSpreadsheet, Lock, ShieldCheck } from 'lucide-react';

interface IntegrationSectionProps {
  config: any;
  setConfig: (config: any) => void;
  savingBranding: boolean;
}

export const IntegrationSection: React.FC<IntegrationSectionProps> = ({
  config,
  setConfig,
  savingBranding,
}) => {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex flex-col gap-6">
        {/* Google Connection Card */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-xs font-black uppercase text-slate-200 tracking-wider block">
                  ฐานข้อมูล Google Sheets & Google Apps Script
                </span>
                <span className="text-[10px] text-slate-400">
                  เชื่อมต่อตรงผ่าน Web App Script เพื่อความเสถียรและรวดเร็วตลอด 24 ชั่วโมง
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-lg">
              <Lock className="w-3 h-3" /> ยืนยันรหัสผ่าน Adminmaingate หากต้องการเปลี่ยน
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Field 1: Google Sheet ID */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                <span>1. Google Spreadsheet ID (ไอดีฐานข้อมูลชีต)</span>
                <span className="text-[9px] font-mono text-emerald-400 font-normal">
                  {config.googleSpreadsheetId === '1ZWUD33aJak-GV3auuLjdAE6liGjp5EHvH6nQIIuUiwM' ? '✓ ค่าเริ่มต้นฝังระบบ' : 'ไอดีคัสตอม'}
                </span>
              </label>
              <input
                type="text"
                value={config.googleSpreadsheetId || ''}
                onChange={(e) => setConfig({ ...config, googleSpreadsheetId: e.target.value, googleAuthType: 'apps_script' })}
                placeholder="1ZWUD33aJak-GV3auuLjdAE6liGjp5EHvH6nQIIuUiwM"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-mono"
              />
              <span className="text-[9px] text-slate-400 leading-normal block mt-1">
                💡 <strong>ไอดีปัจจุบัน:</strong> <code className="text-emerald-400 font-mono">1ZWUD33aJak-GV3auuLjdAE6liGjp5EHvH6nQIIuUiwM</code> (สามารถเปลี่ยนได้โดยต้องใส่รหัสผ่านแอดมินสูงสุด)
              </span>
            </div>

            {/* Field 2: Google Apps Script Web App URL */}
            <div className="flex flex-col gap-1.5">
              <label className="block text-[10px] uppercase tracking-wider text-slate-300 font-bold flex items-center justify-between">
                <span>2. Google Apps Script Web App URL (ลิงก์เว็บแอปสคริปต์)</span>
                <span className="text-[9px] font-mono text-emerald-400 font-normal">
                  {config.googleAppsScriptUrl === 'https://script.google.com/macros/s/AKfycbxwc6IOug_J8ktWe9NjrOWjOvEvm6mDxmSXYV9hc-DSxZOVPZgeWRfnXs0dBBWyICKmGg/exec' ? '✓ ค่าเริ่มต้นฝังระบบ' : 'ลิงก์คัสตอม'}
                </span>
              </label>
              <input
                type="text"
                value={config.googleAppsScriptUrl || ''}
                onChange={(e) => setConfig({ ...config, googleAppsScriptUrl: e.target.value, googleAuthType: 'apps_script' })}
                placeholder="https://script.google.com/macros/s/AKfycbxwc6IOug_J8ktWe9NjrOWjOvEvm6mDxmSXYV9hc-DSxZOVPZgeWRfnXs0dBBWyICKmGg/exec"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-mono"
              />
              <span className="text-[9px] text-slate-400 leading-normal">
                💡 <strong>ลิงก์ปัจจุบัน:</strong> <code className="text-emerald-400 font-mono">https://script.google.com/macros/s/.../exec</code>
              </span>
            </div>

            {/* Apps Script Guide & Code */}
            <div className="mt-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 📋 โค้ดต้นฉบับ Google Apps Script สสำหรับสร้างระบบเอง (ถ้าต้องการ)
                </span>
              </div>
              <div className="text-[9px] text-slate-400 leading-normal space-y-1">
                <p>1. เปิด Google Sheet ไปที่ <strong>ส่วนขยาย </strong> &gt; <strong>Apps Script</strong></p>
                <p>2. วางโค้ด กด <strong>การทำให้ใช้งานได้ </strong> &gt; <strong>การทำให้ใช้งานได้ใหม่ </strong> เลือกเป็น <strong>เว็บแอป (Web App)</strong></p>
                <p>3. ตั้งค่าเข้าถึงเป็น <strong>Everyone (ทุกคน)</strong> แล้วคัดลอก URL มาวางในช่องด้านบน</p>
              </div>
              <textarea
                readOnly
                value={`function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : null;
  if (action === "test") {
    return ContentService.createTextOutput(JSON.stringify({ status: "ok", message: "Connected to Google Sheets successfully!" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "ok", message: "MainGate AppsScript API is active" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "sheets.metadata.get") {
      var sheets = ss.getSheets();
      var names = sheets.map(function(s) { return s.getName(); });
      return ContentService.createTextOutput(JSON.stringify({ sheetNames: names, spreadsheetId: ss.getId() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "sheets.sheets.create") {
      var sheetName = data.title;
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        ss.insertSheet(sheetName);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "sheets.values.get") {
      var range = ss.getRange(data.range);
      var values = range.getValues();
      var formattedValues = values.map(function(row) {
        return row.map(function(cell) {
          if (cell instanceof Date) {
            return cell.toISOString();
          }
          return cell;
        });
      });
      if (data.range.indexOf(":") !== -1 && (data.range.endsWith("Z") || data.range.match(/[A-Za-z]$/))) {
        var lastNonEmptyIdx = -1;
        for (var i = 0; i < formattedValues.length; i++) {
          var isEmpty = true;
          for (var j = 0; j < formattedValues[i].length; j++) {
            if (formattedValues[i][j] !== "" && formattedValues[i][j] !== null && formattedValues[i][j] !== undefined) {
              isEmpty = false;
              break;
            }
          }
          if (!isEmpty) {
            lastNonEmptyIdx = i;
          }
        }
        formattedValues = formattedValues.slice(0, lastNonEmptyIdx + 1);
      }
      return ContentService.createTextOutput(JSON.stringify({ values: formattedValues }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "sheets.values.update") {
      var range = ss.getRange(data.range);
      var updateValues = data.values;
      range.clearContent();
      if (updateValues && updateValues.length > 0) {
        var numRows = updateValues.length;
        var numCols = updateValues[0].length;
        var sheetName = range.getSheet().getName();
        var targetRange = ss.getSheetByName(sheetName).getRange(range.getRow(), range.getColumn(), numRows, numCols);
        targetRange.setValues(updateValues);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "sheets.values.append") {
      var sheetName = data.range.split("!")[0];
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      var appendValues = data.values;
      for (var i = 0; i < appendValues.length; i++) {
        sheet.appendRow(appendValues[i]);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "sheets.values.clear") {
      var range = ss.getRange(data.range);
      range.clearContent();
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: "Unknown action: " + action }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                onClick={(e) => (e.target as any).select()}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[9px] text-emerald-400 font-mono h-20 resize-none focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        id="saveIntegrationBtn"
        type="submit"
        disabled={savingBranding}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition duration-150 uppercase tracking-wider text-xs cursor-pointer flex items-center justify-center gap-2"
      >
        <Lock className="w-4 h-4" />
        {savingBranding ? 'กำลังบันทึกรูปแบบธีมและการตั้งค่าฟอร์ม...' : 'บันทึกการเชื่อมต่อ Google Sheets (ต้องใช้รหัสผ่าน Adminmaingate)'}
      </button>
    </div>
  );
};

