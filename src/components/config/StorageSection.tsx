import React from 'react';
import {
  Database,
  Loader2,
  UserPlus,
  Trash2,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  Download,
  ExternalLink,
  Folder,
  FileSpreadsheet,
} from 'lucide-react';

interface StorageSectionProps {
  seedingMock: boolean;
  handleSeedMockData: () => void;
  clearingMock?: boolean;
  handleClearMockData?: () => void;
  handleClearAllData?: () => void;
  handleCreateNewDriveData?: () => void;
  fetchSheetsStatus: () => void;
  loadingSheetsStatus: boolean;
  sheetsStatus: any;
  archiveSuccessMsg: string;
  archivingSheets: boolean;
  handleArchiveSheets: () => void;
}

export const StorageSection: React.FC<StorageSectionProps> = ({
  seedingMock,
  handleSeedMockData,
  clearingMock = false,
  handleClearMockData,
  handleClearAllData,
  handleCreateNewDriveData,
  fetchSheetsStatus,
  loadingSheetsStatus,
  sheetsStatus,
  archiveSuccessMsg,
  archivingSheets,
  handleArchiveSheets,
}) => {
  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* Demo/Testing Seed Area */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-2.5 mb-3">
          <Database className="w-5 h-5 text-amber-500 animate-pulse" />
          <div>
            <h4 className="text-sm font-extrabold text-slate-100">พื้นที่จำลองและทดสอบระบบ</h4>
            <p className="text-[11px] text-slate-400">สร้างหรือลบข้อมูลผู้ลงทะเบียนและประวัติการเข้าออกสมจริงจำนวน 10,000 รายการเพื่อจำลองแผนภูมิแดชบอร์ด รายงาน และตัวกรองระบบ</p>
          </div>
        </div>
        
        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-300 max-w-lg">
            <strong>⚠️ คำเตือน:</strong> ข้อมูลนี้จะจำลองประวัติเข้าออกและการแบนตลอด 14 วันที่ผ่านมา เพื่อให้แผงสถิติรายงานต่างๆ แสดงผลแบบเสมือนจริง โดยชื่อและข้อมูลทั้งหมดเป็นแบบสมมติ
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="seedMockDataBtn"
              type="button"
              onClick={handleSeedMockData}
              disabled={seedingMock || clearingMock}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-xs rounded-xl transition duration-150 shadow-lg shadow-amber-600/10 cursor-pointer flex items-center gap-2"
            >
              {seedingMock ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังสร้างข้อมูลจำลอง...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>สร้างข้อมูลจำลอง 10,000 รายการ</span>
                </>
              )}
            </button>

            {handleClearMockData && (
              <button
                id="clearMockDataBtn"
                type="button"
                onClick={handleClearMockData}
                disabled={clearingMock || seedingMock}
                className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 disabled:opacity-50 font-extrabold text-xs rounded-xl transition duration-150 shadow-lg cursor-pointer flex items-center gap-2"
              >
                {clearingMock ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังลบข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>ลบข้อมูลจำลอง</span>
                  </>
                )}
              </button>
            )}

            {handleClearAllData && (
              <button
                id="clearAllDataBtn"
                type="button"
                onClick={handleClearAllData}
                disabled={clearingMock || seedingMock}
                className="px-4 py-2.5 bg-rose-700 hover:bg-rose-600 text-white border border-rose-500/40 disabled:opacity-50 font-extrabold text-xs rounded-xl transition duration-150 shadow-lg shadow-rose-700/20 cursor-pointer flex items-center gap-2"
              >
                {clearingMock ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังล้างระบบ...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-200" />
                    <span>ล้างข้อมูลหลังบ้านทั้งหมด (Reset All)</span>
                  </>
                )}
              </button>
            )}

            {handleCreateNewDriveData && (
              <button
                id="createNewDriveDataBtn"
                type="button"
                onClick={handleCreateNewDriveData}
                disabled={clearingMock || seedingMock}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40 disabled:opacity-50 font-extrabold text-xs rounded-xl transition duration-150 shadow-lg shadow-blue-600/20 cursor-pointer flex items-center gap-2"
              >
                {clearingMock ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังสร้างฐานข้อมูลใหม่...</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-4 h-4 text-blue-200" />
                    <span>สร้างฐานข้อมูล Google Drive ใหม่ทั้งหมด</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Google Sheets Storage & Archiving (Method 2) */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-blue-500 animate-pulse" />
            <div>
              <h4 className="text-sm font-extrabold text-slate-100">การจัดการพื้นที่และจัดเก็บประวัติ</h4>
              <p className="text-[11px] text-slate-400">ควบคุมปริมาณข้อมูลแผ่นงานแชร์ Google Sheets เพื่อป้องกันการสะสมจนเต็ม และเพิ่มความเร็วในการตอบสนองของระบบ</p>
            </div>
          </div>
          
          <button
            id="fetchSheetsStatusBtn"
            type="button"
            onClick={fetchSheetsStatus}
            disabled={loadingSheetsStatus}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="รีเฟรชข้อมูลพื้นที่"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSheetsStatus ? 'animate-spin' : ''}`} />
            <span>รีเฟรชความจุ</span>
          </button>
        </div>

        {/* Success Message Banner */}
        {archiveSuccessMsg && (
          <div className="mb-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs font-semibold whitespace-pre-line leading-relaxed">
            {archiveSuccessMsg}
          </div>
        )}

        {/* Google Drive / Sheets Backend Link Card */}
        {sheetsStatus && sheetsStatus.isGoogleConnected && (
          <div className="mb-5 bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/30 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-100 uppercase tracking-wide">ฐานข้อมูลหลังบ้าน Google Drive</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                    เชื่อมต่ออยู่
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-md">
                  ID: {sheetsStatus.sheetId || 'CDC_GatePass_System_Database'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={sheetsStatus.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetsStatus.sheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>เปิดไฟล์ Google Sheets</span>
                <ExternalLink className="w-3 h-3 text-emerald-200" />
              </a>

              <a
                href={sheetsStatus.driveFolderUrl || "https://drive.google.com/drive/folders/1an6N6l0Prp9q_ThtF1EhM3MCeiR3XG_W"}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>เปิดโฟลเดอร์ Google Drive</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        )}

        {/* Loading Status */}
        {loadingSheetsStatus && !sheetsStatus && (
          <div className="p-6 text-center text-xs text-slate-500 font-bold flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            กำลังตรวจสอบสถานะและความจุแผ่นงาน Google Sheets...
          </div>
        )}

        {sheetsStatus && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left Column: Row meter */}
            <div className="md:col-span-7 bg-slate-900 p-5 rounded-xl border border-slate-800/80 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">แผงวัดความจุแถว Google Sheets</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded ${
                  sheetsStatus.sheetsStats.limitWarning 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {sheetsStatus.sheetsStats.totalRows} แถวที่ใช้งาน
                </span>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      sheetsStatus.sheetsStats.limitWarning ? 'bg-rose-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${sheetsStatus.sheetsStats.capacityPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono font-bold">
                  <span>0 แถว</span>
                  <span>แนะนำไม่เกิน 10,000 แถว</span>
                  <span>10,000 แถว</span>
                </div>
              </div>

              {/* Table breakdown */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-4 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block">หน้าประวัติผู้ติดต่อ:</span>
                  <span className="text-slate-200 font-extrabold">{sheetsStatus.sheetsStats.visitorsRows.toLocaleString()} รายการ</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">หน้าบันทึกเข้า-ออก:</span>
                  <span className="text-slate-200 font-extrabold">{sheetsStatus.sheetsStats.logsRows.toLocaleString()} รายการ</span>
                </div>
              </div>

              {sheetsStatus.sheetsStats.limitWarning && (
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3 flex gap-2 text-rose-400 text-[11px] leading-normal font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>ความจุใกล้เต็มหรือเริ่มทำงานช้า:</strong> แผ่นงาน Google Sheets ของคุณมีปริมาณประวัติสะสมสูง แนะนำให้คลิกดำเนินงานเพื่อล้างและจัดเก็บประวัติสำรองด้านล่าง
                  </span>
                </div>
              )}
            </div>

            {/* Right Column: Server Backup / Archiving Actions */}
            <div className="md:col-span-5 bg-slate-900 p-5 rounded-xl border border-slate-800/80 flex flex-col justify-between gap-4">
              <div>
                <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">จัดเก็บสำรองประวัติถาวร</h5>
                <p className="text-[11px] text-slate-500 leading-normal mb-3">
                  ระบบจะย้ายข้อมูลประวัติทั้งหมดที่ผ่านการเช็คเอาท์เรียบร้อยไปเก็บยังคลังฐานข้อมูลเซิร์ฟเวอร์สำรองอย่างถาวร แล้วทำการล้างหน้า Google Sheets ให้เบาโล่งขึ้น 100% โดยผู้ใช้ที่ค้างอยู่ในระบบ และรายชื่อต้องห้าม จะไม่สูญหายและคงอยู่บนชีตตามเดิมเพื่อใช้งานต่อเนื่อง
                </p>

                <div className="bg-slate-950 border border-slate-800/60 rounded-lg p-3 text-xs mb-3 font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-400 font-bold">ในคลังสำรองเซิร์ฟเวอร์:</span>
                  </div>
                  <span className="text-blue-400 font-black font-mono">
                    {sheetsStatus ? (sheetsStatus.localStats.visitorsCount + sheetsStatus.localStats.logsCount).toLocaleString() : 0} รายการ {sheetsStatus ? sheetsStatus.localStats.fileSizeKb : 0} KB
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  id="archiveSheetsBtn"
                  type="button"
                  onClick={handleArchiveSheets}
                  disabled={archivingSheets || !sheetsStatus || !sheetsStatus.isGoogleConnected}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/10"
                >
                  {archivingSheets ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังจัดเก็บประวัติและล้างชีต...</span>
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-4 h-4" />
                      <span>ดำเนินงานวิธีที่ 2: จัดเก็บประวัติและล้างชีต</span>
                    </>
                  )}
                </button>

                <a
                  id="downloadBackupBtn"
                  href="/api/download-archive"
                  download="vms_backup_archive.json"
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border border-slate-750 text-center text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์แบ็คอัพสำรอง</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
