import React from 'react';

interface BrandingSectionProps {
  config: any;
  setConfig: (config: any) => void;
  savingBranding: boolean;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BrandingSection: React.FC<BrandingSectionProps> = ({
  config,
  setConfig,
  savingBranding,
  handleLogoUpload,
}) => {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">ชื่อองค์กร / บริษัทหลัก</label>
          <input
            id="organizationNameInput"
            type="text"
            value={config.organizationName || ''}
            onChange={(e) => setConfig({ ...config, organizationName: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-bold"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">สีประจำองค์กร </label>
          <div className="flex gap-2">
            <input
              id="primaryColorInput"
              type="color"
              value={config.primaryColor || '#3b82f6'}
              onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
              className="w-10 h-10 border border-slate-800 rounded-xl bg-transparent cursor-pointer"
            />
            <input
              id="primaryColorTextInput"
              type="text"
              value={config.primaryColor || '#3b82f6'}
              onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">สีไฮไลท์ส่วนเชื่อมต่อ </label>
          <div className="flex gap-2">
            <input
              id="accentColorInput"
              type="color"
              value={config.accentColor || '#10b981'}
              onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
              className="w-10 h-10 border border-slate-800 rounded-xl bg-transparent cursor-pointer"
            />
            <input
              id="accentColorTextInput"
              type="text"
              value={config.accentColor || '#10b981'}
              onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 text-slate-100 text-xs focus:border-blue-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">อัปโหลดตราสัญลักษณ์องค์กร </label>
          <input
            id="logoFileInput"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 file:cursor-pointer"
          />
        </div>
      </div>

      <button
        id="saveBrandingBtn"
        type="submit"
        disabled={savingBranding}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition duration-150 uppercase tracking-wider text-xs cursor-pointer"
      >
        {savingBranding ? 'กำลังบันทึกรูปแบบธีมและการตั้งค่าฟอร์ม...' : 'บันทึกอัตลักษณ์แบรนด์ & โลโก้'}
      </button>
    </div>
  );
};
