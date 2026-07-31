import json
import re

# Read unique Thai list
with open('unique_thai.json', 'r', encoding='utf-8') as f:
    unique_thai = json.load(f)

# Define translation dictionary
translations = {
  "\"ติดตั้งแอป\" (Install App)": '"Install App"',
  "\"เชื่อมต่อคลาวด์\"": '"Connect Cloud"',
  "\"เปิดแอปในแท็บใหม่\"": '"Open App in New Tab"',
  "\"เพิ่ม\" (Add)": '"Add"',
  "\"เพิ่มลงในหน้าจอหลัก\"": '"Add to Home Screen"',
  "\"เพิ่มไปยังหน้าจอโฮม\" (Add to Home Screen)": '"Add to Home Screen"',
  "\"แชร์\" (Share)": '"Share"',
  "30 วันที่ผ่านมา": "Past 30 Days",
  "7 วันที่ผ่านมา": "Past 7 Days",
  "VIP / บุคคลสำคัญ": "VIP / Key Person",
  "VIP / บุคคลสำคัญ (VIP)": "VIP / Key Person",
  "กดปุ่ม": "Click",
  "กดยืนยันเพื่อทำการสร้างทางลัดบนเครื่องคุณเป็นที่เรียบร้อย!": "Confirm to create the shortcut on your device!",
  "กดเลือกเมนู": "Select menu",
  "กรอกข้อมูลเฉพาะกรณีที่ต้องการรีเซ็ตตั้งรหัสผ่านใหม่ให้กับผู้ใช้นี้ หากเว้นว่างไว้จะเป็นการใช้รหัสผ่านเดิม": "Fill only to reset the password. Leave blank to keep original.",
  "กรอกชื่อและนามสกุลจริง": "Enter real name and surname",
  "กรอกรหัสผ่านใหม่": "Enter new password",
  "กรอกเพื่อยืนยัน": "Enter to confirm",
  "กรุณาลองป้อนชื่อตัวสะกด หรือคำค้นหาอื่น": "Please try another spelling or keyword",
  "กรุณาเข้าสู่ระบบด้วยบัญชีระบบเพื่อเริ่มใช้งาน": "Please log in with system credentials to activate security checkpoint tools",
  "การจัดการ": "Actions",
  "การจัดการ (Action)": "Actions",
  "การดำเนินการ": "Action",
  "การดำเนินการ (Action)": "Action",
  "การดำเนินการตามสิทธิ์ (Gate Action)": "Action Authorization",
  "การตั้งค่าสิทธิ์เข้าถึงของตำแหน่ง": "Role Access Configuration",
  "การบล็อกความเสี่ยง (Blocked)": "Risk Prevention (Blocked)",
  "กำลังดึง...": "Retrieving...",
  "กำลังประมวลผลข้อมูลกราฟและสถิติย้อนหลัง...": "Processing analytics...",
  "กำลังส่งข้อมูลบันทึกเวลา...": "Submitting transaction log...",
  "กำลังอยู่ในพื้นที่ (Inside)": "Currently Inside Area",
  "กำหนดรหัสผ่านเริ่มต้นสำหรับบัญชีนี้ รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร": "Define default password. Must be at least 6 characters.",
  "กำหนดว่าในการลงทะเบียนเข้าติดต่อ จะต้องบังคับกรอกข้อมูลใดบ้าง เช่น ชื่อ-นามสกุล, ทะเบียนรถ, ชื่อบริษัท หรือประเภทผู้ติดต่อ": "Configure mandatory fields such as Name, Plate, Company, or Visitor Type.",
  "ขอบเขตพื้นที่ที่สแกนเช็คอินได้ (Allowed Areas)": "Allowed Scanning Areas",
  "ขอบเขตพื้นที่อนุญาตสแกน (Allowed Areas)": "Allowed Scanning Areas",
  "ขออภัย ระบบอนุญาตเฉพาะบัญชี kittisak.s99631@gmail.com เท่านั้น": "Unauthorized. Access restricted to kittisak.s99631@gmail.com.",
  "ข้อมูลบัตรผ่านทาง": "Pass Identity details",
  "ข้อมูลประวัติความปลอดภัยทั้งหมดในระบบ": "All security history logs in system",
  "คลิกที่ปุ่ม": "Click the button",
  "คำค้นหาพิเศษ (Search Keyword)": "Search Keyword",
  "คำแนะนำนโยบายความปลอดภัย:": "Security Policy Guidelines:",
  "ค้นหาจากระบบ คีย์รหัส หรือสแกนคิวอาร์โค้ดใบผ่าน เพื่อเช็คอิน-เช็คเอาท์เข้าออกพื้นที่อย่างปลอดภัย": "Search system, enter Pass ID, or scan QR code to perform check-in/out.",
  "ค้นหาชื่อ, รหัส, บริษัท...": "Search name, ID, company...",
  "ค้นหาชื่อเจ้าหน้าที่ / รหัสผู้ใช้ / บทบาท...": "Search guard name / username / role...",
  "ค้นหาชื่อเจ้าหน้าที่...": "Search guard name...",
  "ค้นหาหรือป้อนรหัสใบผ่านเข้าออก (Pass ID / ชื่อ / ทะเบียนรถ / เบอร์โทร)": "Search/Enter Pass details (Pass ID, Name, Plate, Phone)",
  "จัดการด่านจุดตรวจ รปภ. (Duty Station)": "Guard Duty Stations",
  "จัดการผู้ใช้/พนักงาน & แบน (Users & Ban)": "Visitor Logs & Blacklist",
  "จัดการและแก้ไขสิทธิ์ใช้งาน (Role Permissions)": "Role Permissions",
  "จากนั้นคลิก": "Then click",
  "จำลองข้อมูลทดสอบ 1,000 รายการสำหรับสถิติแดชบอร์ด ตรวจสอบความจุแถวบนแผ่นงานชีต และจัดเก็บประวัติสำรองเพื่อความรวดเร็ว": "Generate 1,000 mock records for dashboard, check sheet row capacity, and archive history.",
  "จุดตรวจคัดกรองหลัก": "Main Gate Checkpoint",
  "จุดตรวจปฏิบัติงานวันนี้ (Duty Checkpoint)": "Daily Duty Checkpoint",
  "จุดปฏิบัติงานประจำวัน (Duty Checkpoint)": "Daily Duty Checkpoint",
  "จุดสามจุด (three dots)": "three dots",
  "จุดเข้าติดต่อ": "Checkpoint Gate",
  "ชื่อ-นามสกุล": "Full Name",
  "ชื่อ-นามสกุลจริง": "Full Name",
  "ชื่อ-นามสกุลเจ้าหน้าที่": "Guard Full Name",
  "ชื่อผู้ติดต่อ:": "Visitor Name:",
  "ชื่อผู้เข้าติดต่อ": "Visitor Name",
  "ชื่อผู้ใช้งาน (Username)": "Username",
  "ชื่อผู้ใช้งาน (Username) *": "Username *",
  "ชื่อผู้ใช้งาน (Username) - เปลี่ยนไม่ได้": "Username (Read-only)",
  "ฐานข้อมูลหลักออนไลน์": "Main Database Online",
  "ดึงข้อมูลเก่า": "Retrieve Profile",
  "ดูและพิมพ์บัตรผ่านทาง (Pass)": "View & Print Pass",
  "ดูใบผ่านและพิมพ์ใบผ่าน": "View & Print Pass",
  "ด่านตรวจที่ใช้งาน (Duty)": "Active Duty Station",
  "ด้านล่าง": "below",
  "ตกแต่งบัตรผ่านความปลอดภัย แบบ Real-time เช่น รูปแบบโครงสร้างสลิม ความกว้าง ชุดฟอนต์ ขนาดอักษร ความโค้งมน สี และเลือกเปิด/ปิดการแสดงคิวอาร์โค้ด": "Style the security pass in real-time, such as layout width, font, rounded corners, colors, and QR code visibility.",
  "ตรวจสอบความถูกต้องของข้อมูลผู้เข้าติดต่อก่อนจัดทำใบผ่านทางเข้าพื้นที่": "Verify visitor details before printing the physical entry pass.",
  "ตรวจสอบสิทธิ์การใช้งานของกลุ่ม": "Check Group Permissions",
  "ตรวจสอบและสั่งพิมพ์ใบผ่าน (Verify & Print)": "Verify & Print Pass",
  "ตั้งค่าจุดปฏิบัติงานประจำวันและขอบเขตพื้นที่ที่ได้รับอนุญาตให้เจ้าหน้าที่สแกน": "Set daily duty checkpoint and allowed areas for scanning.",
  "ตั้งค่าองค์กรและโลโก้ (Branding Config)": "Branding Config",
  "ตำแหน่งระบบ (System Role)": "System Role",
  "ติดตั้ง": "Install",
  "ติดตั้งแอปเพื่อใช้งานบนมือถือแบบแอปจริง รวดเร็ว ไม่ต้องเปิดหน้าเว็บซ้ำ": "Install the app for a native mobile experience, fast and lightweight.",
  "ต่อ": "Renew",
  "ต่ออายุสิทธิ์ใหม่ (รีเฟรช 1 ชม.)": "Renew Token (1hr)",
  "ทะเบียนรถ": "Vehicle Plate",
  "ทั้งหมด (All Areas)": "All Areas",
  "ทั้งหมด (All Types)": "All Types",
  "ทั้งหมด (In & Out)": "All Actions (In & Out)",
  "ที่มุมขวาบน": "at the top-right corner",
  "ที่มุมขวาบนของจอ เพื่อเริ่มใช้งานทันที!": "at the top-right to start using immediately!",
  "ที่อยู่อีเมลติดต่อ (Email)": "Contact Email Address (Email)",
  "ที่แถบเมนูด้านล่าง (ไอคอนรูปสี่เหลี่ยมลูกศรชี้ขึ้น)": "at the bottom menu (square icon with an upward arrow)",
  "ท่านสามารถลงทะเบียน พิมพ์ใบผ่าน และบันทึกเวลา เข้า-ออก ประมวลผลบนเซิร์ฟเวอร์หลักได้อย่างสมบูรณ์ โดยไม่จำเป็นต้องเชื่อมต่อ Google Sheets ตลอดเวลา": "You can fully register, print, and check-in/out locally on the server without active sheets connection.",
  "บทบาท (Role)": "Role",
  "บทบาท / ตำแหน่ง": "Role / Title",
  "บทบาทสิทธิ์ใช้งานระบบ": "System Role",
  "บราวเซอร์จะเปิดตัวระบบของจริงขึ้นมาแยกอีกหน้าต่าง": "The browser will launch the live system in a new window",
  "บริษัท / ประเภท": "Company / Type",
  "บริษัท / สังกัด": "Company / Affiliation",
  "บริษัท:": "Company:",
  "บัญชีผู้ใช้ประเภท": "User account type",
  "บัญชีระดับ": "Account Role Level",
  "บัญชีรักษาความปลอดภัย:": "Security Account:",
  "บันทึกกิจกรรมล่าสุด (Activity Logs)": "Recent Activity Logs",
  "บันทึกข้อมูลเจ้าหน้าที่ (Save Staff Info)": "Save Staff Info",
  "บุคคลติด Blacklist/ระงับ": "Blacklisted / Suspended Personnel",
  "บุคคลยังไม่สแกนออก": "Inside Area (Not scanned out)",
  "ประวัติการเข้าออกพื้นที่ วันนี้": "Check-in/out History Today",
  "ประวัติการเข้าออกพื้นที่ เมื่อวานนี้": "Check-in/out History Yesterday",
  "ประวัติความปลอดภัยย้อนหลัง 7 วันล่าสุด": "Security History Past 7 Days",
  "ประวัติทั้งหมด": "All Historical Logs",
  "ประเภท": "Type",
  "ประเภท:": "Type:",
  "ประเภทผู้ติดต่อ (Visitor Type)": "Visitor Type",
  "ปรับแต่งชื่อองค์กรหลัก, กำหนดสีธีมระบบ (สีประจำองค์กร/สีไฮไลท์), และอัปโหลดไฟล์ภาพโลโก้แบรนด์ของคุณ": "Customize primary organization name, system theme colors, and brand logo image.",
  "ปรับแต่งใบผ่านและตั้งค่าระบบ (Branding & System Configuration)": "Branding & System Config",
  "ป้อนชื่อผู้ใช้งาน (เช่น Adminmaingate)": "Enter username (e.g., Adminmaingate)",
  "ป้อนรหัสผ่าน": "Enter password",
  "ผิดกฎระเบียบความปลอดภัย": "Violating safety and security regulations",
  "ผูก": "Link",
  "ผู้จัดการ (Manager)": "Manager",
  "ผู้ดูแลระบบระดับสูง (Administrator)": "Administrator",
  "ผู้ดูแลระบบและผู้จัดการสามารถปรับปรุงชื่อ อีเมล สิทธิ์การเข้าถึง และรีเซ็ตรหัสผ่านให้กับผู้ใช้ระบบ": "Admins and Managers can update guard name, email, access levels, and reset passwords.",
  "ผู้ติดต่อ (รหัส)": "Visitor (ID)",
  "ผู้ติดต่อทั่วไป": "General Visitor",
  "ผู้ติดต่อทั่วไป (General)": "General Visitor",
  "ผู้ติดต่อเข้าพื้นที่สะสม": "Total Entry Pass Visits",
  "ผู้ถือใบผ่าน (รหัส)": "Pass Holder (ID)",
  "ผู้ผ่านทาง": "Visitor",
  "ผู้มอบหมาย / เวลาล่าสุด (Assigned By)": "Assigned By / Updated At",
  "ผู้รับเหมา (Contractor)": "Contractor",
  "ผู้ลงทะเบียน ยังไม่เช็คอิน": "Registered but Not Checked In",
  "ผู้อยู่ในพื้นที่ขณะนี้": "Currently Inside Area",
  "ผู้ใช้ที่โดนระงับ (Banned)": "Banned/Suspended Users",
  "ฝ่ายผลิต": "Production Department",
  "พนักงานส่งของ": "Delivery Personnel",
  "พนักงานส่งของ / พัสดุ (Delivery)": "Delivery / Parcel Service",
  "พบบุคคลบัญชีดำ (BLACKLISTED)": "BLACKLISTED PROFILE IDENTIFIED",
  "พิมพ์ชื่อ, รหัส, บริษัท, ทะเบียนรถ...": "Search name, ID, company, plate...",
  "พิมพ์ชื่อผู้ติดต่อ, รหัสใบผ่าน, บริษัท, เลขที่บัตร, ทะเบียนรถ เพื่อค้นหา...": "Type visitor name, Pass ID, company, ID/Passport, vehicle plate to search...",
  "พิมพ์รหัสใบผ่าน เช่น P123456, ชื่อ, หรือทะเบียนรถ...": "Search Pass ID (e.g. P123456), name, or vehicle plate...",
  "พิมพ์ใบผ่าน (Pass)": "Print Pass",
  "พื้นที่/หน่วยงานปลายทาง (Area)": "Destination Contact Area",
  "พื้นที่ติดต่อ": "Contact Area",
  "พื้นที่ติดต่อ:": "Contact Area:",
  "พื้นที่เข้าติดต่อ": "Contact Area",
  "มอบหมายจุดและพื้นที่สแกน (Duty Station Settings)": "Guard Station Settings",
  "ยังไม่กำหนด": "Not set",
  "ยังไม่ถูกเช็คอิน (พร้อมลงทะเบียนเช็คอินเข้าพื้นที่)": "Not checked in (Ready for entry scan)",
  "ยืนยันรหัสผ่าน *": "Confirm Password *",
  "ยืนยันรหัสผ่านใหม่": "Confirm New Password",
  "ยืนยันรหัสผ่านใหม่อีกครั้ง": "Confirm New Password",
  "ย้อนหลัง 30 วัน": "Past 30 Days",
  "ย้อนหลัง 7 วัน": "Past 7 Days",
  "รหัสผ่านเริ่มต้น *": "Default Password *",
  "รหัสผ่านเริ่มต้นสำหรับเข้าใช้งาน *": "Default Login Password *",
  "รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)": "New Password (min 6 characters)",
  "รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)": "New Password (min 6 chars)",
  "รหัสใบผ่าน (Pass ID)": "Pass ID",
  "รองรับไฟล์รูปภาพ JPG, PNG (สัดส่วนภาพแบบจัตุรัสจะแสดงผลดีที่สุด)": "Supports JPG, PNG (Square aspect ratio is best)",
  "ระงับสิทธิ์ (แบน) หรืออนุมัติการตรวจสอบประวัติของบุคคลภายนอก": "Suspend (ban) or approve external visitor security clearances",
  "ระบบคลาวด์ได้ออกใบผ่านเข้า-ออกพื้นที่อิเล็กทรอนิกส์เรียบร้อยแล้ว": "The cloud system has successfully issued an electronic entry pass.",
  "ระบบจัดการหลังบ้าน (Admin)": "System Admin",
  "ระบบตั้งต้น": "Default system preset",
  "ระบบรายงานความปลอดภัยและข้อมูลดิจิทัลอัตโนมัติ": "Automated Safety & Digital Reporting System",
  "ระบบอัตโนมัติ": "Automated System",
  "ระบุสาเหตุการแบน เช่น ขับรถเร็วเกินกำหนด, ไม่สวมหมวกนิรภัย": "Specify reason (e.g., speeding, no safety helmet...)",
  "ระยะเวลาสิทธิ์เชื่อมต่อ (Google Token)": "Session Token Lifespan (Google Token)",
  "รับทราบและทำตามขั้นตอน": "Understood, follow guidelines",
  "รายการเข้าพื้นที่": "Visits Logged",
  "รายงาน PDF นี้รองรับระบบ Multi-Page Rendering อัตโนมัติ โดยระบบจัดรูปแบบ CSS Page-breaks และแผนภูมิกราฟิกแบบเวกเตอร์ คมชัด 100% เหมาะสำหรับนำเสนอในการประชุมผู้บริหาร ฝ่ายบริหารความเสี่ยง หรือยื่นตรวจสอบประวัติความปลอดภัย": "This PDF report supports automated Multi-Page Rendering with CSS Page-breaks and high-resolution vector charts. Perfect for executive reviews, audit validation, or compliance files.",
  "รายงานความเสี่ยงรายเดือน 30 วันล่าสุด": "Monthly Safety Report (Past 30 Days)",
  "รายชื่อผู้ถือใบผ่านเข้าพื้นที่ล่าสุด": "Recent Pass Holder Database",
  "รายชื่อเจ้าหน้าที่รักษาความปลอดภัยและแอดมินที่มีสิทธิเข้าใช้งานแผงควบคุม": "Guards and Administrators authorized to access the system dashboard",
  "รูปถ่าย": "Photo",
  "รูปถ่ายประจำตัว (Profile Photo)": "Profile Photo",
  "รูปถ่ายประจำตัวผู้ใช้งาน (Profile Photo)": "User Profile Photo",
  "รูปภาพ": "Photo",
  "ลงทะเบียนสำเร็จ!": "Registration Successful!",
  "ลงทะเบียนใบผ่าน (Register)": "Register Pass",
  "ลงทะเบียนใบผ่านใหม่ (Register)": "Register Pass",
  "ล้างค่าตัวกรองทั้งหมดเป็นค่าเริ่มต้น": "Clear all filters to defaults",
  "วันที่ลงทะเบียน": "Registration Date",
  "วันนี้": "Today",
  "วันสิ้นสุด (End Date)": "End Date",
  "วันเริ่มต้น (Start Date)": "Start Date",
  "วิธีติดตั้งแอปบนหน้าจอโฮม": "PWA Home Screen Installation Guide",
  "สถานะ": "Status",
  "สถานะพื้นที่": "Gate Status",
  "สถิติเข้าพื้นที่ทั้งหมด": "Total Visits Lifetime",
  "สถิติเข้าพื้นที่ย้อนหลัง": "Historic Visits Statistics",
  "สถิติเข้าพื้นที่วันนี้": "Total Entry Scans Today",
  "สถิติเข้าพื้นที่เมื่อวาน": "Total Entry Scans Yesterday",
  "สลับเมนูย่อยเพื่อปรับเปลี่ยนอัตลักษณ์องค์กร ฟิลด์ข้อมูลดีไซน์บัตร และเชื่อมโยง Google Sheets & อีเมล": "Toggle subtabs to customize brand style, mandatory fields, sheet sync & email reports.",
  "สร้างบัญชีใหม่เพื่อเข้าใช้งานระบบและควบคุมสิทธิ์ใช้งานตามตำแหน่งหน้าที่": "Create a system profile with role-based access controls.",
  "สร้างและบันทึกไฟล์ PDF ทันที": "Generate & Download PDF",
  "สิทธิ์ / การดำเนินการ": "Cleared Status / Actions",
  "สิทธิ์การเข้าถึงเมนูหลัก (Main Tabs Access)": "Main Tabs Menu Access",
  "สิทธิ์กำหนดจุดตั้งสถานีตรวจของ รปภ.": "Authorize duty station config for guards",
  "สิทธิ์จัดการบัญชีแบน / ข้อมูลพนักงาน": "Authorize visitor blacklist & employee log access",
  "สิทธิ์ปรับแต่งสิทธิ์ใช้งานตามตำแหน่ง": "Authorize role access modifications",
  "สิทธิ์ฟังก์ชันแผงควบคุมแอดมิน (Admin Subtab Controls)": "Admin Operations Permission Groups",
  "สิทธิ์ส่งเมลไฟล์รายงานอัตโนมัติ": "Authorize automated email summaries",
  "สิทธิ์เข้าถึงรายงานสถิติวิเคราะห์": "Authorize analytics and trends",
  "สิทธิ์เข้าถึงหน้าต่างตั้งค่าแบรนด์องค์กร": "Authorize branding configurations",
  "สแกนเช็คอิน เข้า-ออก (Gate)": "Check-In / Out Gate Access",
  "สแกนใบหน้าและบันทึกประวัติ ณ จุดตรวจเข้า-ออก": "Scan faces and log entry/exit timestamp",
  "ส่งออกเมลรายงาน (Email Reports)": "Export Email Reports",
  "หรือ": "or",
  "หัวหน้าฝ่ายความปลอดภัย (Supervisor)": "Supervisor",
  "หากไม่ตรง ระบบความปลอดภัยจะจำกัดสิทธิ์ (Block) และแสดงคำเตือน เพื่อป้องกันการเช็คอินข้ามจุดตรวจที่ไม่มีหน้าที่รับผิดชอบ": "If mismatched, the system will block check-in and issue warning to enforce duty zone discipline.",
  "อยู่ภายนอก": "Outside",
  "อยู่ภายนอกพื้นที่ (OUTSIDE)": "Outside Area (OUTSIDE)",
  "อยู่ภายในพื้นที่ (INSIDE)": "Inside Area (INSIDE)",
  "อยู่ในพื้นที่": "Inside",
  "ออก (CHECK-OUT)": "Check-Out",
  "ออก (OUT)": "Out",
  "ออกใบผ่านโดย": "Issued By",
  "อัปเดตชื่อ อีเมล รูปถ่ายประจำตัว และเปลี่ยนรหัสผ่านเพื่อความปลอดภัย": "Update name, email, profile photo and security password",
  "อีเมลติดต่อ": "Contact Email",
  "เข้า (CHECK-IN)": "Check-In",
  "เข้า (IN)": "In",
  "เข้าสู่ระบบรักษาความปลอดภัย (Security Login)": "Security Portal Access",
  "เจ้าหน้าที่ (Guard)": "Guard Name",
  "เจ้าหน้าที่ความปลอดภัย (Staff)": "Safety Officer (Staff)",
  "เจ้าหน้าที่รักษาความปลอดภัย (Guard)": "Security Guard (Guard)",
  "เชื่อมต่อคลาวด์แล้ว": "Cloud Connection Enabled",
  "เชื่อมต่อสำเร็จ": "Connected Successfully",
  "เช็คอิน": "Check-In",
  "เช็คอิน (เข้าพื้นที่ เท่านั้น)": "Check-In Only",
  "เช็คอิน เข้า-ออก (Gate)": "Gate Control (Gate)",
  "เช็คอินแล้ว": "Checked In",
  "เช็คอินโดย": "Checked-in by",
  "เช็คเอาท์": "Check-Out",
  "เช็คเอาท์ (ออกพื้นที่ เท่านั้น)": "Check-Out Only",
  "เช็คเอาท์โดย": "Checked-out by",
  "เช่น นายอภิชาติ แสนดี": "e.g., John Doe",
  "เดินเท้า": "Walk-in",
  "เท่านั้น": "only",
  "เบอร์โทรศัพท์": "Phone Number",
  "เปลี่ยนรหัสผ่านส่วนตัว (เว้นว่างไว้เพื่อรักษารหัสผ่านเดิม)": "Reset Security Password (leave blank to retain current)",
  "เปลี่ยนรหัสผ่านใหม่ (Password Reset)": "Password Reset",
  "เปิดกล้องสแกน QR Code": "Open QR Scan Camera",
  "เปิดหน้านี้ด้วยเบราว์เซอร์": "Open this page in browser",
  "เมื่อ รปภ. ประจำจุดใดๆ สแกนเช็คอิน/เช็คเอาท์ หรือออกใบผ่านใหม่ ระบบจะตรวจสอบว่าพื้นที่เข้าติดต่อของแขกตรงกับขอบเขตที่ รปภ. ได้รับสิทธิ์ดูแลในวันนั้นหรือไม่": "When scanning, the system ensures the visitor's destination matches the guard's allowed gate scope.",
  "เมื่อวาน": "Yesterday",
  "เมื่อวานนี้": "Yesterday",
  "เลือกตำแหน่ง / บทบาท": "Select System Role",
  "เลือกระหว่างเชื่อมต่อผ่าน Google Web App หรือ Service Account และกำหนดค่า SMTP/Gmail สำหรับส่งอีเมลรายงานเข้าออก": "Choose Google Sheets App Script/Service Account and configure SMTP for reports.",
  "เลือกวันเอง (Custom)": "Custom Range",
  "เลื่อนลงแล้วกดเลือก": "Scroll down and choose",
  "เวลาบันทึก": "Timestamp",
  "เวลาสแกนเข้า": "Check-in Time",
  "แก้ไขข้อมูลบัญชีและสิทธิ์ใช้งาน": "Modify system profile and access role settings",
  "แดชบอร์ดสรุปสถิติ (Dashboard)": "Summary Analytics Dashboard",
  "และ": "and",
  "แสดงผู้ติดต่อทุกประเภท": "Show all visitor types",
  "แสดงผู้เข้าติดต่อทุกประเภท (All Visitors)": "Show all visitor types",
  "ในแท็บใหม่ จะสามารถเข้าสู่ระบบและเชื่อมโยง Google Sheets & Drive ได้ทันที!": "in the new tab. You can authorize Google connection securely there!",
  "ใบผ่านนี้ถูกเช็คเอาท์ออกพื้นที่เรียบร้อยแล้ว ไม่สามารถเช็คอินซ้ำได้อีกตามระบบรักษาความปลอดภัยแบบ 1 ใบผ่านต่อ 1 ครั้ง กรุณาออกใบผ่านใหม่": "This pass has already been checked out. Passcodes are single-use only.",
  "ใบผ่านนี้สิ้นสุดอายุการใช้งาน (PASS EXPIRED)": "ENTRY PASS EXPIRED",
  "ได้รับสิทธิ์เข้าถึงแดชบอร์ดสรุปและระบบรายงานทั้งหมด": "Granted full dashboard access and report exporting capabilities",
  "ได้รับอนุญาตให้ดำเนินงานเฉพาะหน้าด่านเข้า-ออกและจัดทำทะเบียนใหม่เท่านั้น ป้องกันปัญหาข้อมูลรั่วไหลสู่บุคคลภายนอก": "Authorized strictly for gate registration and verification to protect system integrity.",
  "ได้รับอนุญาตให้เป็นผู้บริหารระบบความปลอดภัยระดับสูงและมีสิทธิ์เข้าถึงรายงานและฟังก์ชันของเจ้าหน้าที่ส่วนหน้าได้ทั้งหมด": "Granted root administrator level authorization with access to all front desk metrics.",
  "ไม่พบบัญชีเจ้าหน้าที่รักษาความปลอดภัย": "Security guard profile not found",
  "ไม่พบรายชื่อเจ้าหน้าที่ที่ตรงกับเงื่อนไขค้นหา": "No system user records match search filter",
  "ไม่มีกิจกรรมการเข้าออกที่ถูกบันทึกในวันนี้": "No check-in/out activity recorded today",
  "ไม่มีข้อมูลผู้ใช้สอดคล้องตามเกณฑ์ค้นหา": "No profiles match current query",
  "ไม่ระบุ": "Unspecified",
  "ไม่ระบุสังกัด": "No Company Affiliation",
  "ไม่สามารถถอนสิทธิ์การตั้งค่าสิทธิ์สำหรับแอดมินสูงสุดได้ เพื่อป้องกันปัญหาการเข้าถึงของแอดมิน": "Administrator role constraints cannot be cleared to ensure system access.",
  "ไม่สามารถถอนสิทธิ์เมนูหลัก Administrator สำหรับบัญชีแอดมินสูงสุดได้เพื่อความปลอดภัย": "Administrator permission settings cannot be modified for safety.",
  "ไม่ได้ระบุ": "Unspecified",
  "← กลับหน้าค้นหา / สแกนคิวอาร์ใหม่": "← Back to Search / Scan New QR",
  "➕ ไปลงทะเบียนทำใบผ่านใหม่": "➕ Go to register new pass",
  "🌐 Google Sheets & อีเมล": "Google Sheets & SMTP sync",
  "🌐 ตั้งค่าระบบเชื่อมต่อ Google Sheets & ส่งอีเมล": "Google Sheets synchronization and report email setup",
  "🎨 ตั้งค่ารูปแบบแบรนด์ขององค์กร": "Brand Identity Design Setup",
  "🎨 อัตลักษณ์ & โลโก้": "Identity & Logos",
  "🎫 ดีไซน์บัตรผ่าน": "Card & Ticket Design",
  "🎫 ดีไซน์บัตรผ่านประตูและสลิปความปลอดภัย": "Visitor Pass Layout & Security Slip Designer",
  "💡 วิธีแก้ไขปัญหาอย่างง่าย:": "Quick Troubleshooting Tips:",
  "💾 การจัดการข้อมูลทดสอบ & พื้นที่จัดเก็บประวัติ": "Mock records setup, sheet capacities and database storage settings",
  "💾 ความจุ & ข้อมูลทดสอบ": "Storage Capacity & Mocking",
  "📋 ตั้งค่าฟิลด์ความต้องการในแบบฟอร์มลงทะเบียน": "Registration Form Required Fields Setup",
  "📋 ฟิลด์แบบฟอร์ม": "Registration Form Fields",
  "🔍 ตรวจสอบและค้นหาข้อมูล": "Verify & Query Data",
  "🔴 บันทึกเวลาออกพื้นที่ (CHECK-OUT)": "🔴 CONFIRM CHECK-OUT",
  "🟢 บันทึกเวลาเข้าพื้นที่ (CHECK-IN)": "🟢 CONFIRM CHECK-IN"
}

# Read original App.tsx
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's perform replacement of each Thai text in the content
# We want to replace it inside JSX properly.
# For example, if we have >Thai Text< we replace it with >{tText('Thai Text', 'English Text')}<
# If we have placeholder="Thai Text" we replace it with placeholder={tText('Thai Text', 'English Text')}
# If we have title="Thai Text" we replace it with title={tText('Thai Text', 'English Text')}
# If we have 'Thai Text' in JS expression, e.g. status === 'เช็คอิน' ? 'เช็คอินแล้ว' : '...'
# we can replace 'Thai Text' with tText('Thai Text', 'English Text')

count = 0
for thai, eng in sorted(translations.items(), key=lambda x: len(x[0]), reverse=True):
    # Escape special regex chars
    escaped = re.escape(thai)
    
    # 1. JSX text replacement: >Thai Text< or > Thai Text <
    # We replace with >{tText("Thai Text", "English Text")}<
    pattern_jsx = r'>(\s*)' + escaped + r'(\s*)<'
    def replace_jsx(m):
        return f'>{m.group(1)}{{tText("{thai}", "{eng}")}}{m.group(2)}<'
    content, c1 = re.subn(pattern_jsx, replace_jsx, content)
    count += c1
    
    # 2. JSX text replacement in <li> or other block elements with curly braces:
    # We also look for direct text inside tags that may have been parsed
    pattern_tag = r'([>])(\s*)' + escaped + r'(\s*)([<])'
    def replace_tag(m):
        return f'{m.group(1)}{m.group(2)}{{tText("{thai}", "{eng}")}}{m.group(3)}{m.group(4)}'
    content, c2 = re.subn(pattern_tag, replace_tag, content)
    count += c2

    # 3. Attributes: placeholder="Thai Text"
    pattern_placeholder = r'placeholder=\"' + escaped + r'\"'
    def replace_placeholder(m):
        return f'placeholder={{tText("{thai}", "{eng}")}}'
    content, c3 = re.subn(pattern_placeholder, replace_placeholder, content)
    count += c3

    # 4. Attributes: title="Thai Text"
    pattern_title = r'title=\"' + escaped + r'\"'
    def replace_title(m):
        return f'title={{tText("{thai}", "{eng}")}}'
    content, c4 = re.subn(pattern_title, replace_title, content)
    count += c4

    # 5. String literals in JS expression: 'Thai Text' or "Thai Text"
    pattern_lit_single = r"'" + escaped + r"'"
    def replace_lit_single(m):
        return f'tText("{thai}", "{eng}")'
    content, c5 = re.subn(pattern_lit_single, replace_lit_single, content)
    count += c5

    pattern_lit_double = r'"' + escaped + r'"'
    def replace_lit_double(m):
        return f'tText("{thai}", "{eng}")'
    content, c6 = re.subn(pattern_lit_double, replace_lit_double, content)
    count += c6

# Write back
with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Total replacements performed: {count}')
