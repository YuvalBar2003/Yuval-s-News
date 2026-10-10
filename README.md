# Yuval's News Website
## תיאור הפרוייקט

מערכת אינטרנטית מלאה לניהול, עריכה ופרסום חדשות. המערכת תומכת בתפקידי משתמשים שונים, שמירה אוטומטית ברקע, פיד חדשות דינמי וסטטיסטיקות צפייה בזמן אמת.

---

## הוראות התקנה והרצה של המערכת

### דרישות קדם:
1. התקנת  Node.js
2. התקנת כל הסיפריות הדרושות (npm install)
3. הגדרת קובץ משתני סביבה (env.)
    ```bash
    PORT=3000
    MONGO_URI=mongodb+srv://yuvalbar2003_db_user:R0w7xNatgF25WUUg@cluster0.2k87m8z.mongodb.net/daily_web?retryWrites=true&w=majority&appName=Cluster0
4. הזנת נתוני דמה ראשוניים בטרמינל- ע"י הרצת הפקודה
    ```bash
    node seed.js
### שלבי הפעלה:
1. הפעלת השרת ע"י הרצת הפקודה
    ```bash
    node server.js
1. כניסה למערכת
    לאחר עליית השרת - יש לפתוח דפדפן ולגלוש לכתובת
    ```bash
    http://localhost:3000
## מבנה הפרוייקט
```text
daily-web-project/
├── controllers/
│   ├── articleController.js   # ניהול כתבות, טיוטות, אישורי עורך וגרף צפיות
│   ├── authController.js      # התחברות, הרשמה וניהול סשנים
│   └── publicController.js    # עמוד בית, API לגלילה אינסופית, מזג אוויר ותגובות
├── middleware/
│   └── auth.js                # בדיקת הרשאות למשתמש מחובר (עורך / כתב)
├── models/
│   ├── Article.js             # מודל כתבה כולל טיוטה וגרסה מפורסמת
│   ├── Comment.js             # מודל תגובות לכתבה
│   ├── User.js                # מודל משתמשים עם הצפנת סיסמה ב-bcrypt
│   └── ViewStat.js            # מודל סטטיסטיקת צפיות לפי שעה
├── public/
│   └── image.png              # תמונת ברירת מחדל לכתבות
├── routes/
│   ├── authRoutes.js          # ראוטים להתחברות והרשמה
│   ├── editorRoutes.js        # ראוטים לעורך (אישורים ודשבורד)
│   ├── publicRoutes.js        # ראוטים ציבוריים וקריאות API
│   └── reporterRoutes.js      # ראוטים לכתב (יצירה, עריכה ו-auto-save)
├── views/
│   ├── editor/
│   │   └── dashboard.ejs      # דשבורד עורך וגרף צפיות
│   ├── public/
│   │   ├── article.ejs        # עמוד כתבה ומערכת תגובות
│   │   └── home.ejs           # עמוד הבית עם פיד ומזג אוויר
│   ├── reporter/
│   │   ├── dashboard.ejs      # מסך ניהול כתבות של הכתב
│   │   └── edit.ejs           # מסך עריכה עם שמירה אוטומטית
│   ├── login.ejs              # דף התחברות
│   └── register.ejs           # דף הרשמה
├── .env                       # משתני סביבה (פורט ו-MONGO_URI)
├── .gitignore                 # התעלמות מ-node_modules ו-.env
├── package-lock.json          # נעילת גרסאות של החבילות
├── package.json               # תלויות והגדרות פרויקט
├── seed.js                    # סקריפט ליצירת משתמשים ו-500 כתבות לבדיקה
├── server.js                  # שרת ראשי והתחברות ל-DB
└── README.md                  # הוראות התקנה ותיעוד