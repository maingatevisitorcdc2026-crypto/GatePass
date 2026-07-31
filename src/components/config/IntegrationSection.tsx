import React from 'react';
import { FileSpreadsheet, Mail, Database } from 'lucide-react';

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Google Connection */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black uppercase text-slate-200 tracking-wider">
              ฐานข้อมูลระบบ Google Sheets
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                วิธีการเชื่อมต่อ Google Workspace
              </label>
              <select
                value={config.googleAuthType || 'oauth'}
                onChange={(e) => setConfig({ ...config, googleAuthType: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-bold"
              >
                <option value="oauth">Standard OAuth2 (สำหรับผู้ใช้ทั่วไป / ล็อกอินเบราว์เซอร์)</option>
                <option value="service_account">Google Cloud Service Account (เชื่อมต่อผ่านคีย์ .json บัญชีบริการ)</option>
                <option value="apps_script">Google Apps Script Web App (เชื่อมต่อถาวร 24 ชม. เสถียรที่สุด 🚀 ไม่ต้องใช้คีย์ .json)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                ระบุ Google Spreadsheet ID โดยตรง
              </label>
              <input
                type="text"
                value={config.googleSpreadsheetId || ''}
                onChange={(e) => setConfig({ ...config, googleSpreadsheetId: e.target.value })}
                placeholder="เช่น 1aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890 "
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-mono"
              />
              <span className="text-[9px] text-slate-500 leading-normal block mt-1">
                💡 <strong>วิธีใช้:</strong> คัดลอก ID จากแถบที่อยู่เว็บของ Google Sheet  มาใส่ช่องนี้ได้เลย ระบบจะผูกกับชีตนี้ทันทีโดยไม่ต้องคอยกดค้นหา/สร้างใหม่
              </span>
            </div>

            {config.googleAuthType === 'apps_script' && (
              <div className="flex flex-col gap-2">
                <label className="block text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                  Google Apps Script Web App URL (ลิงก์เว็บแอปสคริปต์)
                </label>
                <input
                  type="text"
                  value={config.googleAppsScriptUrl || ''}
                  onChange={(e) => setConfig({ ...config, googleAppsScriptUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-mono"
                />
                <span className="text-[9px] text-slate-400 leading-normal">
                  💡 <strong>วิธีใช้:</strong> วางลิงก์ Web App URL ที่ได้จากการ Deploy สคริปต์บน Google Sheets
                </span>

                <div className="mt-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2.5">
                  <span className="text-[10px] font-bold text-slate-200">📋 คัดลอกโค้ดสคริปต์ด้านล่างนี้ไปใช้งาน</span>
                  <div className="text-[9px] text-slate-400 leading-normal space-y-1">
                    <p>1. ใน Google Sheet ของคุณ ไปที่เมนู <strong>ส่วนขยาย </strong> &gt; <strong>Apps Script</strong></p>
                    <p>2. ลบโค้ดเดิมออกทั้งหมด และวางโค้ดในช่องด้านล่างนี้ลงไปแทน</p>
                    <p>3. กดบันทึก  แล้วกดปุ่ม <strong>การทำให้ใช้งานได้ </strong> &gt; <strong>การทำให้ใช้งานได้ใหม่ </strong></p>
                    <p>4. คลิกรูปฟันเฟือง เลือกประเภทเป็น <strong>เว็บแอป </strong></p>
                    <p>5. กำหนดหัวข้อดั่งนี้: คำอธิบายอะไรก็ได้, รันในนาม: <strong>ฉัน </strong>, ผู้เข้าถึง: <strong>ทุกคน </strong> และกด Deploy</p>
                    <p>6. คัดลอก <strong>เว็บแอป URL </strong> มาวางในช่องสีเขียวด้านบนนี้</p>
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
    
    if (action === "drive.files.list") {
      if (data.name === "MainGate_Pass_System_Database") {
        return ContentService.createTextOutput(JSON.stringify({ files: [{ id: ss.getId(), name: ss.getName() }] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      if (data.name === "MainGate_Pass_Photos") {
        var folders = DriveApp.getFoldersByName("MainGate_Pass_Photos");
        var folderId = "";
        if (folders.hasNext()) {
          folderId = folders.next().getId();
        } else {
          var folder = DriveApp.createFolder("MainGate_Pass_Photos");
          folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          folderId = folder.getId();
        }
        return ContentService.createTextOutput(JSON.stringify({ files: [{ id: folderId, name: "MainGate_Pass_Photos" }] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    if (action === "drive.files.create") {
      var parentId = data.parentId;
      var folder = parentId ? DriveApp.getFolderById(parentId) : DriveApp.getRootFolder();
      var contentType = data.mimeType || "image/jpeg";
      var blob = Utilities.newBlob(Utilities.base64Decode(data.base64Body), contentType, data.name);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return ContentService.createTextOutput(JSON.stringify({ id: file.getId(), name: file.getName() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "drive.files.get") {
      var file = DriveApp.getFileById(data.fileId);
      var bytes = file.getBlob().getBytes();
      var base64 = Utilities.base64Encode(bytes);
      return ContentService.createTextOutput(JSON.stringify({ base64: base64, mimeType: file.getMimeType() }))
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[9px] text-emerald-400 font-mono h-24 resize-none focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            )}

            {config.googleAuthType === 'service_account' && (
              <div className="flex flex-col gap-2">
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  คีย์สิทธิ์บัญชีบริการ (Google Service Account Credentials JSON)
                </label>
                <textarea
                  value={config.googleServiceAccountJson || ''}
                  onChange={(e) => setConfig({ ...config, googleServiceAccountJson: e.target.value })}
                  placeholder='วางโค้ด JSON คีย์บัญชีบริการ  เช่น {"type": "service_account", "project_id": ...}'
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-[11px] focus:border-blue-500 focus:outline-none font-mono h-28 leading-relaxed resize-none"
                />
                <span className="text-[9px] text-slate-500 leading-normal">
                  💡 <strong>วิธีใช้:</strong> สร้างคีย์ Service Account บน Google Cloud Console ดาวน์โหลดไฟล์ .json และวางเนื้อหาที่นี่ อย่าลืมแชร์สิทธิ์การเข้าถึง  ให้กับที่อยู่อีเมลของ Service Account ในชีตของคุณด้วย
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Email Settings */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
            <Mail className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-black uppercase text-slate-200 tracking-wider">
              ช่องทางการส่งอีเมลรายงาน
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                ผู้ให้บริการและวิธีจัดส่ง
              </label>
              <select
                value={config.emailServiceType || 'gmail_api'}
                onChange={(e) => setConfig({ ...config, emailServiceType: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-bold"
              >
                <option value="gmail_api">Gmail API (ส่งผ่านการอนุมัติสิทธิ์ Google Drive/OAuth)</option>
                <option value="smtp">SMTP Server (ส่งผ่านเซิร์ฟเวอร์อีเมลองค์กร หรือ Gmail App Password)</option>
              </select>
            </div>

            {config.emailServiceType === 'smtp' && (
              <div className="flex flex-col gap-2.5">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-8">
                    <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">SMTP Host</label>
                    <input
                      type="text"
                      value={config.smtpHost || ''}
                      onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                      placeholder="เช่น smtp.gmail.com หรือ mail.org.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-blue-500 focus:outline-none font-semibold"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">SMTP Port</label>
                    <input
                      type="text"
                      value={config.smtpPort || ''}
                      onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })}
                      placeholder="587 หรือ 465"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-blue-500 focus:outline-none font-semibold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Username (อีเมลผู้ส่ง)</label>
                    <input
                      type="text"
                      value={config.smtpUser || ''}
                      onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                      placeholder="เช่น user@gmail.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-blue-500 focus:outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Password / App Password</label>
                    <input
                      type="password"
                      value={config.smtpPass || ''}
                      onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })}
                      placeholder="รหัสผ่านเชื่อมต่อ หรือ App Password"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={!!config.smtpSecure}
                    onChange={(e) => setConfig({ ...config, smtpSecure: e.target.checked })}
                    className="w-3.5 h-3.5 text-blue-500 border-slate-800 rounded focus:ring-blue-500 accent-blue-500 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-400">ใช้การเชื่อมต่อ SSL/TLS ปลอดภัย </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        id="saveIntegrationBtn"
        type="submit"
        disabled={savingBranding}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition duration-150 uppercase tracking-wider text-xs cursor-pointer"
      >
        {savingBranding ? 'กำลังบันทึกรูปแบบธีมและการตั้งค่าฟอร์ม...' : 'บันทึกการเชื่อมต่อ Google Sheets & อีเมล'}
      </button>
    </div>
  );
};
