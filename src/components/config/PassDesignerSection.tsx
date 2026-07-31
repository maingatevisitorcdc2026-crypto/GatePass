import React from 'react';
import { Sliders, CheckCircle } from 'lucide-react';
import PassBadge from '../PassBadge';

interface PassDesignerSectionProps {
  config: any;
  setConfig: (config: any) => void;
  savingBranding: boolean;
  mockVisitorForPreview: any;
}

export const PassDesignerSection: React.FC<PassDesignerSectionProps> = ({
  config,
  setConfig,
  savingBranding,
  mockVisitorForPreview,
}) => {
  const currentTemplate = config.passTemplate || {
    layout: 'receipt',
    badgeWidth: '220px',
    fontSize: 'base',
    textColor: '#000000',
    bgColor: '#ffffff',
    borderColor: '#10b981',
    borderWidth: '2px',
    borderRadius: 'lg',
    headerText: 'บัตรผ่านเข้า-ออก',
    footerText: 'กรุณาติดบัตรตลอดเวลาที่อยู่ในพื้นที่',
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
  };

  const updateTemplate = (key: string, value: any) => {
    setConfig({
      ...config,
      passTemplate: {
        ...currentTemplate,
        [key]: value,
      },
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor controls */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold mb-1.5">
                รูปแบบโครงสร้าง 
              </label>
              <div className="w-full bg-slate-900 border border-emerald-500/20 rounded-xl px-3 py-2 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>สลิปเครื่องพิมพ์ใบเสร็จ </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1.5">
                ความกว้างใบผ่าน 
              </label>
              <input
                type="text"
                value={currentTemplate.badgeWidth || '380px'}
                onChange={(e) => updateTemplate('badgeWidth', e.target.value)}
                placeholder="เช่น 350px, 380px, 100%"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1.5">
                ชุดฟอนต์ 
              </label>
              <select
                value={currentTemplate.fontFamily || 'Inter'}
                onChange={(e) => updateTemplate('fontFamily', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-bold"
              >
                <option value="Inter">Inter </option>
                <option value="IBM Plex Sans Thai">IBM Plex Sans Thai - โมเดิร์น สุภาพ</option>
                <option value="Sarabun">สารบรรณ - ทางการ</option>
                <option value="Kanit">คณิต - ทันสมัย สะดุดตา</option>
                <option value="Prompt">พร้อมท์ - กระชับ</option>
                <option value="Chonburi">ชลบุรี - พาดหัวหนา ย้อนยุค</option>
                <option value="JetBrains Mono">JetBrains Mono - ดิจิทัล</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1.5">
                ขนาดอักษรเฉลี่ย 
              </label>
              <select
                value={currentTemplate.fontSize || 'base'}
                onChange={(e) => updateTemplate('fontSize', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-bold"
              >
                <option value="sm">เล็กกะทัดรัด</option>
                <option value="base">ขนาดปกติ</option>
                <option value="lg">ใหญ่ชัดเจน</option>
                <option value="xl">ใหญ่พิเศษ</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1.5">
                ระยะชิดบรรทัด 
              </label>
              <select
                value={currentTemplate.lineHeight || 'normal'}
                onChange={(e) => updateTemplate('lineHeight', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-bold"
              >
                <option value="tight">ชิดสุด - 1.1</option>
                <option value="snug">ค่อนข้างชิด - 1.25</option>
                <option value="normal">ปกติ - 1.5</option>
                <option value="relaxed">ห่างเล็กน้อย - 1.75</option>
                <option value="loose">ห่างพิเศษ - 2.0</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1.5">
                สีพื้นหลังใบผ่าน 
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={currentTemplate.bgColor || '#ffffff'}
                  onChange={(e) => updateTemplate('bgColor', e.target.value)}
                  className="w-8 h-8 border border-slate-800 rounded-lg cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={currentTemplate.bgColor || '#ffffff'}
                  onChange={(e) => updateTemplate('bgColor', e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1.5">
                สีข้อความหลัก 
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={currentTemplate.textColor || '#000000'}
                  onChange={(e) => updateTemplate('textColor', e.target.value)}
                  className="w-8 h-8 border border-slate-800 rounded-lg cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={currentTemplate.textColor || '#000000'}
                  onChange={(e) => updateTemplate('textColor', e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1.5">
                สีเส้นขอบบัตร 
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={currentTemplate.borderColor || '#10b981'}
                  onChange={(e) => updateTemplate('borderColor', e.target.value)}
                  className="w-8 h-8 border border-slate-800 rounded-lg cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={currentTemplate.borderColor || '#10b981'}
                  onChange={(e) => updateTemplate('borderColor', e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1.5">
                ความหนาเส้นขอบ 
              </label>
              <select
                value={currentTemplate.borderWidth || '2px'}
                onChange={(e) => updateTemplate('borderWidth', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-bold"
              >
                <option value="0px">ไม่มีขอบ 0px</option>
                <option value="1px">ขอบบาง 1px</option>
                <option value="2px">ขอบปกติ 2px</option>
                <option value="4px">ขอบหนา 4px</option>
                <option value="8px">ขอบหนาพิเศษ 8px</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1.5">
                ความโค้งมนของขอบบัตร
              </label>
              <select
                value={currentTemplate.borderRadius || 'lg'}
                onChange={(e) => updateTemplate('borderRadius', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-bold"
              >
                <option value="none">เหลี่ยมคมดิบ</option>
                <option value="sm">โค้งมนน้อย</option>
                <option value="md">โค้งมนปานกลาง</option>
                <option value="lg">โค้งมนสวยงาม</option>
                <option value="full">วงกลมโค้งมนสูง</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1.5">
                คำลายน้ำด้านหลัง
              </label>
              <input
                type="text"
                value={currentTemplate.watermarkText || ''}
                onChange={(e) => updateTemplate('watermarkText', e.target.value)}
                placeholder="เช่น APPROVED, GATEPASS, CONFIRMED"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1.5">
                ข้อความพาดหัวหลักบนบัตร
              </label>
              <input
                type="text"
                value={currentTemplate.headerText || ''}
                onChange={(e) => updateTemplate('headerText', e.target.value)}
                placeholder="เช่น บัตรผ่านเข้า-ออก"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1.5">
                กฎความปลอดภัยด้านล่าง
              </label>
              <input
                type="text"
                value={currentTemplate.securityNotice || ''}
                onChange={(e) => updateTemplate('securityNotice', e.target.value)}
                placeholder="เช่น บัตรนี้เป็นทรัพย์สินของบริษัทฯ กรุณาคืน ณ จุดแลกบัตรเมื่อเดินทางออก"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1.5">
                ข้อความประกาศด้านล่างสุด
              </label>
              <input
                type="text"
                value={currentTemplate.footerText || ''}
                onChange={(e) => updateTemplate('footerText', e.target.value)}
                placeholder="เช่น กรุณาแสดงใบผ่านนี้แก่เจ้าหน้าที่เมื่อเดินทางเข้า-ออก"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-bold"
              />
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-3">
              แสดงผลองค์ประกอบในบัตร
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={!!currentTemplate.showQrCode}
                  onChange={(e) => updateTemplate('showQrCode', e.target.checked)}
                  className="w-4 h-4 text-emerald-500 border-slate-800 rounded focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <span>แสดงคิวอาร์โค้ด</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={!!currentTemplate.showPhoto}
                  onChange={(e) => updateTemplate('showPhoto', e.target.checked)}
                  className="w-4 h-4 text-emerald-500 border-slate-800 rounded focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <span>แสดงรูปถ่ายผู้ติดต่อ</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={!!currentTemplate.showContactArea}
                  onChange={(e) => updateTemplate('showContactArea', e.target.checked)}
                  className="w-4 h-4 text-emerald-500 border-slate-800 rounded focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <span>แสดงพื้นที่ติดต่อ</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={!!currentTemplate.showCompany}
                  onChange={(e) => updateTemplate('showCompany', e.target.checked)}
                  className="w-4 h-4 text-emerald-500 border-slate-800 rounded focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <span>แสดงสังกัด / บริษัท</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={!!currentTemplate.showVehiclePlate}
                  onChange={(e) => updateTemplate('showVehiclePlate', e.target.checked)}
                  className="w-4 h-4 text-emerald-500 border-slate-800 rounded focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <span>แสดงเลขทะเบียนรถ</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={!!currentTemplate.showTimeIn}
                  onChange={(e) => updateTemplate('showTimeIn', e.target.checked)}
                  className="w-4 h-4 text-emerald-500 border-slate-800 rounded focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <span>แสดงวันที่เวลาเช็คอิน</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={!!currentTemplate.signatureLine}
                  onChange={(e) => updateTemplate('signatureLine', e.target.checked)}
                  className="w-4 h-4 text-emerald-500 border-slate-800 rounded focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <span>แสดงเส้นประเซ็นชื่อ</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live Pass Preview */}
        <div className="lg:col-span-5 flex flex-col items-center justify-start bg-slate-950 p-5 rounded-2xl border border-slate-800/60 sticky top-4">
          <div className="text-center mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              ✨ แสดงผลสด
            </span>
            <p className="text-[9px] text-slate-500 mt-2">ภาพตัวอย่างจะเปลี่ยนแปลงสดทันทีเมื่อแก้ไขช่องต่าง ๆ</p>
          </div>
          <div className="w-full flex justify-center scale-90 origin-top">
            <PassBadge visitor={mockVisitorForPreview} config={config} />
          </div>
        </div>
      </div>

      <button
        id="saveDesignerBtn"
        type="submit"
        disabled={savingBranding}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition duration-150 uppercase tracking-wider text-xs cursor-pointer"
      >
        {savingBranding ? 'กำลังบันทึกรูปแบบธีมและการตั้งค่าฟอร์ม...' : 'บันทึกรูปแบบดีไซน์บัตรผ่าน'}
      </button>
    </div>
  );
};
