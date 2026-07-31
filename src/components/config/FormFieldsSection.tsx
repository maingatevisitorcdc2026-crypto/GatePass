import React from 'react';

interface FormFieldsSectionProps {
  config: any;
  setConfig: (config: any) => void;
  savingBranding: boolean;
}

export const FormFieldsSection: React.FC<FormFieldsSectionProps> = ({
  config,
  setConfig,
  savingBranding,
}) => {
  const fields = config.requiredFields || {};

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="bg-slate-950/30 p-5 rounded-xl border border-slate-800/80">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
          กำหนดฟิลด์ความต้องการสำหรับแบบฟอร์ม 
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(fields).map(([field, isRequired]) => (
            <label
              key={field}
              className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer text-xs font-bold text-slate-300"
            >
              <input
                type="checkbox"
                checked={!!isRequired}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    requiredFields: {
                      ...fields,
                      [field]: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-500 border-slate-800 rounded focus:ring-blue-500 accent-blue-500 cursor-pointer"
              />
              <span className="capitalize">
                {field === 'name'
                  ? 'ชื่อ-นามสกุล'
                  : field === 'passportId'
                  ? 'เลขบัตร/Passport'
                  : field === 'phone'
                  ? 'เบอร์ติดต่อ'
                  : field === 'vehiclePlate'
                  ? 'ทะเบียนรถ'
                  : field === 'address'
                  ? 'ที่อยู่ตามบัตร'
                  : field === 'company'
                  ? 'ชื่อบริษัท'
                  : field === 'visitorType'
                  ? 'ประเภทผู้ติดต่อ'
                  : field === 'contactArea'
                  ? 'พื้นที่เข้าติดต่อ'
                  : field}
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        id="saveFieldsBtn"
        type="submit"
        disabled={savingBranding}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition duration-150 uppercase tracking-wider text-xs cursor-pointer"
      >
        {savingBranding ? 'กำลังบันทึกรูปแบบธีมและการตั้งค่าฟอร์ม...' : 'บันทึกการตั้งค่าฟิลด์แบบฟอร์ม'}
      </button>
    </div>
  );
};
