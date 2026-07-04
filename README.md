# ACT Practice Test — แบบทดสอบ ACT เสมือนจริง

โปรแกรมจำลองการสอบ **ACT (American College Testing)** แบบครบวงจร: ทำข้อสอบ 4 พาร์ทจับเวลาจริง
(English 75 ข้อ/45 นาที, Math 60/60, Reading 40/35, Science 40/35 — รวม 215 ข้อ), วัดผลเป็นคะแนน
scale 1–36 ต่อพาร์ท + คะแนนรวม (Composite), ทบทวนเฉลยพร้อมคำอธิบายทุกข้อ และมีระบบหลังบ้าน
(ภาษาไทย) สำหรับจัดการคลังข้อสอบและดูผลสอบ

หน้าจอเป็นภาษาไทย เนื้อหาข้อสอบเป็นภาษาอังกฤษตามรูปแบบ ACT จริง

---

## ⚠️ Disclaimer / คำชี้แจงลิขสิทธิ์

> **ACT® is a registered trademark of ACT, Inc.** This project is an independent,
> **unofficial** practice tool and is **not** affiliated with, authorized, endorsed,
> or sponsored by ACT, Inc. It only follows the publicly known *format* of the exam.
>
> All passages, questions, answer choices, and explanations in this repository are
> **original works** created for educational practice. They do **not** reproduce,
> copy, or paraphrase any copyrighted ACT test material.

โปรเจกต์นี้จัดทำขึ้นเพื่อเป็น **วิทยาทาน (free educational resource)** สำหรับผู้ที่เตรียมสอบ ACT
เท่านั้น — ไม่ใช่เพื่อการค้า และไม่มีความเกี่ยวข้องกับ ACT, Inc. แต่อย่างใด ข้อสอบทั้งหมดเป็นของ
ต้นฉบับที่สร้างขึ้นใหม่ ไม่ได้คัดลอกข้อสอบจริง หากพบเนื้อหาที่คล้ายข้อสอบจริงโปรดแจ้ง issue เพื่อ
นำออกทันที

---

## เริ่มต้นใช้งาน (Getting Started)

ต้องมี **Node.js 20+** และ npm

```bash
npm install                       # ติดตั้ง dependencies
cp .env.example .env.local        # แล้วแก้ค่าใน .env.local (ดูด้านล่าง)
npm run seed                      # โหลดข้อสอบตัวอย่าง 215 ข้อเข้า SQLite
npm run dev                       # เปิด http://localhost:3000
```

`.env.local` ที่ต้องตั้ง:

| ตัวแปร | ความหมาย |
|---|---|
| `ADMIN_PASSCODE` | รหัสผ่านเข้าระบบหลังบ้าน (`/admin`) |
| `SESSION_SECRET` | คีย์ HMAC สำหรับเซ็น cookie — สร้างด้วย `openssl rand -hex 32` |
| `ACT_DB_PATH` | (ไม่บังคับ) ที่อยู่ไฟล์ SQLite; ค่าเริ่มต้น `~/.act-app/act.db` |
| `ACT_DURATION_OVERRIDE` | (ไม่บังคับ) ย่อเวลาทุกพาร์ทเหลือ N วินาที — ไว้ทดสอบระบบหมดเวลา |

## คำสั่งที่ใช้บ่อย

```bash
npm run dev          # dev server
npm run build        # production build
npm start            # production server
npm test             # unit tests (scoring engine)
npm run validate     # ตรวจไฟล์ข้อสอบใน db/seed/ (ไม่ต้องมี DB) — รันก่อนส่ง PR
npm run seed         # โหลด db/seed/ เข้า DB (--force เพื่อล้างผลสอบเดิมแล้วโหลดใหม่)
```

## สถาปัตยกรรมโดยย่อ

- **Next.js 15 (App Router) + TypeScript + Tailwind** — full-stack
- **SQLite** ผ่าน `better-sqlite3` + thin data-access layer (`src/lib/dal/`)
- **Timer ยึดเวลาจาก server** — refresh/ปิดเครื่อง/back ไม่มีทางได้เวลาเพิ่ม; หมดเวลาแล้ว
  server auto-submit ให้เอง (`src/lib/exam/enforce.ts`)
- **เฉลยไม่รั่วถึง client** — ข้อสอบส่งผ่าน `toClientQuestion()` ที่ตัดเฉลย/คำอธิบายออก;
  เฉลยออกจาก server เฉพาะหน้าผลสอบหลังทำครบแล้ว
- คลังข้อสอบเก็บเป็นไฟล์ JSON ใน `db/seed/` แล้วโหลดเข้า DB ด้วย `npm run seed`

## ร่วมเพิ่มข้อสอบ (Contributing)

ยินดีรับข้อสอบต้นฉบับใหม่ ๆ! วิธีเพิ่มข้อสอบเข้าคลังอยู่ใน **[CONTRIBUTING.md](./CONTRIBUTING.md)**
โดยสรุป: เพิ่ม/แก้ไฟล์ JSON ใน `db/seed/<section>/` ให้ตรงตาม schema → รัน `npm run validate` →
เปิด Pull Request (CI จะตรวจให้อัตโนมัติ)

## License

- **โค้ด**: [MIT](./LICENSE)
- **เนื้อหาข้อสอบ** (`db/seed/`): [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

ดูรายละเอียดในไฟล์ [LICENSE](./LICENSE)
