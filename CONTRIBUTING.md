# การร่วมเพิ่มข้อสอบ (Contributing Questions)

ขอบคุณที่สนใจร่วมสร้างคลังข้อสอบ ACT แบบเปิด! เอกสารนี้อธิบายวิธีเพิ่มหรือแก้ไขข้อสอบ

## กติกาสำคัญเรื่องลิขสิทธิ์ (อ่านก่อน)

- ข้อสอบที่ส่งเข้ามา **ต้องเป็นของต้นฉบับที่คุณเขียนเอง 100%**
- **ห้าม**คัดลอก ดัดแปลง หรือถอดความข้อสอบ ACT จริง หรือข้อสอบที่มีลิขสิทธิ์ของผู้อื่น
- เมื่อส่ง Pull Request ถือว่าคุณยืนยันว่าเนื้อหาเป็นงานต้นฉบับ และยินยอมให้เผยแพร่ภายใต้
  **CC BY-SA 4.0** (ดู [LICENSE](./LICENSE))

## โครงสร้างคลังข้อสอบ

ข้อสอบเก็บเป็นไฟล์ JSON ใน `db/seed/<section>/` โดย `<section>` คือ `english`, `math`,
`reading`, หรือ `science` — หนึ่งไฟล์ต่อหนึ่ง passage (หรือหนึ่งชุดสำหรับ Math ที่ไม่มี passage)

จำนวนข้อรวมของแต่ละพาร์ทต้องครบตามจริง: **English 75 · Math 60 · Reading 40 · Science 40**
และเลขข้อ (`position`) ต้องเรียงต่อเนื่องไม่ซ้ำกันทั้งพาร์ท (เช่น English passage แรกใช้ข้อ 1–15,
passage ที่สองใช้ 16–30 เป็นต้น)

## รูปแบบไฟล์ (Schema)

```jsonc
{
  "section": "reading",                    // english | math | reading | science
  "passage": {                             // ต้องเป็น null สำหรับ math
    "position": 1,
    "title": "An Original Title",
    "kind": "prose_fiction",               // ประเภท (ไม่บังคับ) — ดูด้านล่าง
    "body_md": "เนื้อเรื่อง... รองรับ Markdown"
  },
  "questions": [
    {
      "position": 1,                       // เลขข้อทั่วทั้งพาร์ท (ต่อเนื่อง)
      "stem_md": "What does the author suggest...?",
      "choices": ["...", "...", "...", "..."],   // English/Reading/Science = 4 ตัว, Math = 5 ตัว
      "correct_index": 2,                  // index เริ่มที่ 0 (0 = ตัวแรก)
      "explanation_md": "อธิบายว่าทำไมข้อนี้ถูก และตัวลวงผิดเพราะอะไร",
      "difficulty": "medium",              // easy | medium | hard
      "topic": "author's purpose"          // แท็กหัวข้อสั้น ๆ
    }
  ]
}
```

ข้อกำหนดที่ตัวตรวจ (Zod) จะบังคับ:

- `choices` ต้องมี **4 ตัวสำหรับ English/Reading/Science** และ **5 ตัวสำหรับ Math**
- `correct_index` ต้องอยู่ในช่วงของ choices
- `position` ต่อเนื่องเรียงขึ้น ไม่ซ้ำ และไม่เกินจำนวนข้อของพาร์ท
- Math ต้อง `"passage": null`; พาร์ทอื่นต้องมี passage
- ทุก field ห้ามว่าง และ **ห้ามอ้างเลขบรรทัด** เช่น "line 12" (ระบบไม่มีเลขบรรทัดตายตัว — ให้ยกคำพูดมาแทน)

### หมายเหตุเฉพาะพาร์ท

- **English**: ใน`body_md` ให้ครอบส่วนที่ข้อนั้นถามด้วย `<u data-q="N">...</u>` โดย `N` = เลขข้อ
  ระบบจะไฮไลต์ให้อัตโนมัติ; ข้อแบบแก้ไขข้อความให้ใช้ `choices[0]` = `"NO CHANGE"`
- **Math**: ตัวเลือก 5 ตัว, ไม่มี passage; ใช้ HTML พื้นฐานแทนสูตร (`<sup>2</sup>`, เศษส่วน `3/4`, `π`, `√`)
- **Science**: `kind` = `data_representation` | `research_summary` | `conflicting_viewpoints`;
  passage แบบข้อมูลให้ใส่ตาราง Markdown พร้อมหน่วย, แบบ conflicting viewpoints ให้มีหัวข้อ
  `**Scientist 1**` / `**Scientist 2**`
- **Reading**: `kind` = `prose_fiction` | `social_science` | `humanities` | `natural_science`

ป้ายตัวเลือก (A–D/E สำหรับข้อคี่, F–J/K สำหรับข้อคู่) ระบบสร้างให้เองจากเลขข้อ — เก็บแค่ `correct_index`

## ขั้นตอนส่ง Pull Request

1. Fork แล้ว clone repo
2. `npm install`
3. เพิ่ม/แก้ไฟล์ JSON ใน `db/seed/<section>/`
4. **`npm run validate`** — ตรวจ schema และความต่อเนื่องของเลขข้อ (ไม่ต้องมี DB) ต้องผ่านก่อน
5. (แนะนำ) `npm run seed && npm run dev` แล้วลองทำข้อที่เพิ่มในเบราว์เซอร์ว่าแสดงถูกและเฉลยถูก
6. เปิด Pull Request — CI จะรัน `validate` + `test` ให้อัตโนมัติ

การส่งข้อสอบเป็นชุดครบ passage (เช่น Reading 10 ข้อ/passage) จะรีวิวและ merge ได้ง่ายที่สุด

## ตรวจทานคุณภาพ

ก่อนส่ง ช่วยเช็ก: โจทย์ชัดเจนไม่กำกวม, มีคำตอบที่ถูกเพียงข้อเดียว, ตัวลวงดูสมเหตุสมผลแต่ผิดจริง,
คำอธิบายอ้างหลักฐานในโจทย์/passage และเนื้อหาเป็นภาษาอังกฤษระดับ ACT
