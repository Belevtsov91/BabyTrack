import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = 'ru' | 'en' | 'uk' | 'ro' | 'el';

const langLabels: Record<Lang, string> = {
  ru: 'Русский',
  en: 'English',
  uk: 'Українська',
  ro: 'Română',
  el: 'Ελληνικά',
};

const translations: Record<Lang, Record<string, string>> = {
  ru: {
    home: 'Главная', stats: 'Статистика', chat: 'Чат', settings: 'Настройки',
    quickActions: 'Быстрые действия', sleep: 'Сон', bottle: 'Бутылочка',
    breast: 'Грудное', diaper: 'Подгузник', pump: 'Сцеживание',
    milestones: 'Достижения', doctor: 'Педиатр', photos: 'Фото',
    addEvent: 'Добавить событие', save: 'Сохранить', cancel: 'Отмена',
    today: 'Сегодня', week: 'Неделя', month: 'Месяц',
    messages: 'Сообщения', familyGroups: 'Семья и группы',
    babyProfile: 'Профиль малыша', sleepSettings: 'Настройки сна',
    units: 'Единицы измерения', metric: 'Метрические',
    theme: 'Тема', language: 'Язык', notifications: 'Уведомления',
    exportData: 'Экспорт данных', importData: 'Импорт данных',
    privacy: 'Конфиденциальность', help: 'Помощь', rateApp: 'Оценить приложение',
    logout: 'Выйти из аккаунта', baby: 'Малыш', tools: 'Инструменты',
    app: 'Приложение', data: 'Данные', more: 'Ещё',
    calendar: 'Календарь', medications: 'Лекарства', reminders: 'Напоминания',
    growthWho: 'Кривые роста ВОЗ', yearlyRecap: 'Итоги года',
    search: 'Поиск', feeding: 'Кормление', mood: 'Настроение',
    pdfReport: 'Отчёт для педиатра', photoFolders: 'Папки фото',
    pinChat: 'Закрепить', unpinChat: 'Открепить',
    createFolder: 'Создать папку', allPhotos: 'Все фото',
    amount: 'Количество', duration: 'Длительность', notes: 'Заметки',
    startTimer: 'Запустить таймер', stopTimer: 'Остановить',
    average: 'Среднее', total: 'Всего', best: 'Лучший',
    smartInsights: 'Умные инсайты', weeklySummary: 'Итоги недели',
    temperature: 'Температура', vaccinations: 'Прививки', allergens: 'Аллергены',
    stories: 'Истории', createStory: 'Создать историю',
  },
  en: {
    home: 'Home', stats: 'Statistics', chat: 'Chat', settings: 'Settings',
    quickActions: 'Quick Actions', sleep: 'Sleep', bottle: 'Bottle',
    breast: 'Breastfeed', diaper: 'Diaper', pump: 'Pump',
    milestones: 'Milestones', doctor: 'Pediatrician', photos: 'Photos',
    addEvent: 'Add Event', save: 'Save', cancel: 'Cancel',
    today: 'Today', week: 'Week', month: 'Month',
    messages: 'Messages', familyGroups: 'Family & Groups',
    babyProfile: 'Baby Profile', sleepSettings: 'Sleep Settings',
    units: 'Units', metric: 'Metric',
    theme: 'Theme', language: 'Language', notifications: 'Notifications',
    exportData: 'Export Data', importData: 'Import Data',
    privacy: 'Privacy', help: 'Help', rateApp: 'Rate App',
    logout: 'Log Out', baby: 'Baby', tools: 'Tools',
    app: 'Application', data: 'Data', more: 'More',
    calendar: 'Calendar', medications: 'Medications', reminders: 'Reminders',
    growthWho: 'WHO Growth Charts', yearlyRecap: 'Yearly Recap',
    search: 'Search', feeding: 'Feeding', mood: 'Mood',
    pdfReport: 'Report for Doctor', photoFolders: 'Photo Folders',
    pinChat: 'Pin', unpinChat: 'Unpin',
    createFolder: 'Create Folder', allPhotos: 'All Photos',
    amount: 'Amount', duration: 'Duration', notes: 'Notes',
    startTimer: 'Start Timer', stopTimer: 'Stop',
    average: 'Average', total: 'Total', best: 'Best',
    smartInsights: 'Smart Insights', weeklySummary: 'Weekly Summary',
    temperature: 'Temperature', vaccinations: 'Vaccinations', allergens: 'Allergens',
    stories: 'Stories', createStory: 'Create Story',
  },
  uk: {
    home: 'Головна', stats: 'Статистика', chat: 'Чат', settings: 'Налаштування',
    quickActions: 'Швидкі дії', sleep: 'Сон', bottle: 'Пляшечка',
    breast: 'Грудне', diaper: 'Підгузок', pump: 'Зціджування',
    milestones: 'Досягнення', doctor: 'Педіатр', photos: 'Фото',
    addEvent: 'Додати подію', save: 'Зберегти', cancel: 'Скасувати',
    today: 'Сьогодні', week: 'Тиждень', month: 'Місяць',
    messages: 'Повідомлення', familyGroups: "Сім'я та групи",
    babyProfile: 'Профіль малюка', sleepSettings: 'Налаштування сну',
    units: 'Одиниці виміру', metric: 'Метричні',
    theme: 'Тема', language: 'Мова', notifications: 'Сповіщення',
    exportData: 'Експорт даних', importData: 'Імпорт даних',
    privacy: 'Конфіденційність', help: 'Допомога', rateApp: 'Оцінити додаток',
    logout: 'Вийти з акаунту', baby: 'Малюк', tools: 'Інструменти',
    app: 'Додаток', data: 'Дані', more: 'Ще',
    calendar: 'Календар', medications: 'Ліки', reminders: 'Нагадування',
    growthWho: 'Криві росту ВООЗ', yearlyRecap: 'Підсумки року',
    search: 'Пошук', feeding: 'Годування', mood: 'Настрій',
    pdfReport: 'Звіт для лікаря', photoFolders: 'Папки фото',
    pinChat: 'Закріпити', unpinChat: 'Відкріпити',
    createFolder: 'Створити папку', allPhotos: 'Усі фото',
    amount: 'Кількість', duration: 'Тривалість', notes: 'Нотатки',
    startTimer: 'Запустити таймер', stopTimer: 'Зупинити',
    average: 'Середнє', total: 'Загалом', best: 'Найкращий',
    smartInsights: 'Розумні інсайти', weeklySummary: 'Підсумки тижня',
    temperature: 'Температура', vaccinations: 'Щеплення', allergens: 'Алергени',
    stories: 'Історії', createStory: 'Створити історію',
  },
  ro: {
    home: 'Acasă', stats: 'Statistici', chat: 'Chat', settings: 'Setări',
    quickActions: 'Acțiuni rapide', sleep: 'Somn', bottle: 'Biberon',
    breast: 'Alăptare', diaper: 'Scutec', pump: 'Pompare',
    milestones: 'Realizări', doctor: 'Pediatru', photos: 'Foto',
    addEvent: 'Adaugă eveniment', save: 'Salvează', cancel: 'Anulează',
    today: 'Astăzi', week: 'Săptămâna', month: 'Luna',
    messages: 'Mesaje', familyGroups: 'Familie și grupuri',
    babyProfile: 'Profilul bebelușului', sleepSettings: 'Setări somn',
    units: 'Unități de măsură', metric: 'Metrice',
    theme: 'Temă', language: 'Limbă', notifications: 'Notificări',
    exportData: 'Export date', importData: 'Import date',
    privacy: 'Confidențialitate', help: 'Ajutor', rateApp: 'Evaluează aplicația',
    logout: 'Deconectare', baby: 'Bebeluș', tools: 'Instrumente',
    app: 'Aplicație', data: 'Date', more: 'Mai mult',
    calendar: 'Calendar', medications: 'Medicamente', reminders: 'Memento-uri',
    growthWho: 'Curbe creștere OMS', yearlyRecap: 'Rezumatul anului',
    search: 'Căutare', feeding: 'Hrănire', mood: 'Dispoziție',
    pdfReport: 'Raport pentru medic', photoFolders: 'Foldere foto',
    pinChat: 'Fixează', unpinChat: 'Anulează fixare',
    createFolder: 'Creează folder', allPhotos: 'Toate pozele',
    amount: 'Cantitate', duration: 'Durată', notes: 'Note',
    startTimer: 'Pornește cronometru', stopTimer: 'Oprește',
    average: 'Medie', total: 'Total', best: 'Cel mai bun',
    smartInsights: 'Informații inteligente', weeklySummary: 'Rezumatul săptămânii',
    temperature: 'Temperatură', vaccinations: 'Vaccinări', allergens: 'Alergeni',
    stories: 'Povești', createStory: 'Creează poveste',
  },
  el: {
    home: 'Αρχική', stats: 'Στατιστικά', chat: 'Συνομιλία', settings: 'Ρυθμίσεις',
    quickActions: 'Γρήγορες ενέργειες', sleep: 'Ύπνος', bottle: 'Μπιμπερό',
    breast: 'Θηλασμός', diaper: 'Πάνα', pump: 'Άντληση',
    milestones: 'Ορόσημα', doctor: 'Παιδίατρος', photos: 'Φωτο',
    addEvent: 'Προσθήκη', save: 'Αποθήκευση', cancel: 'Ακύρωση',
    today: 'Σήμερα', week: 'Εβδομάδα', month: 'Μήνας',
    messages: 'Μηνύματα', familyGroups: 'Οικογένεια & Ομάδες',
    babyProfile: 'Προφίλ μωρού', sleepSettings: 'Ρυθμίσεις ύπνου',
    units: 'Μονάδες', metric: 'Μετρικές',
    theme: 'Θέμα', language: 'Γλώσσα', notifications: 'Ειδοποιήσεις',
    exportData: 'Εξαγωγή', importData: 'Εισαγωγή',
    privacy: 'Απόρρητο', help: 'Βοήθεια', rateApp: 'Βαθμολογία',
    logout: 'Αποσύνδεση', baby: 'Μωρό', tools: 'Εργαλεία',
    app: 'Εφαρμογή', data: 'Δεδομένα', more: 'Περισσότερα',
    calendar: 'Ημερολόγιο', medications: 'Φάρμακα', reminders: 'Υπενθυμίσεις',
    growthWho: 'Καμπύλες ΠΟΥ', yearlyRecap: 'Ετήσια ανασκόπηση',
    search: 'Αναζήτηση', feeding: 'Τάισμα', mood: 'Διάθεση',
    pdfReport: 'Αναφορά γιατρού', photoFolders: 'Φάκελοι φωτο',
    pinChat: 'Καρφίτσωμα', unpinChat: 'Ξεκαρφίτσωμα',
    createFolder: 'Νέος φάκελος', allPhotos: 'Όλες οι φωτο',
    amount: 'Ποσότητα', duration: 'Διάρκεια', notes: 'Σημειώσεις',
    startTimer: 'Εκκίνηση', stopTimer: 'Διακοπή',
    average: 'Μέσος', total: 'Σύνολο', best: 'Καλύτερο',
    smartInsights: 'Έξυπνα insights', weeklySummary: 'Εβδομαδιαία σύνοψη',
    temperature: 'Θερμοκρασία', vaccinations: 'Εμβόλια', allergens: 'Αλλεργιογόνα',
    stories: 'Ιστορίες', createStory: 'Δημιουργία ιστορίας',
  },
};

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  langLabels: Record<Lang, string>;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'ru',
  setLang: () => {},
  t: (k) => k,
  langLabels,
});

export const useI18n = () => useContext(I18nContext);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('babytrack_lang') as Lang) || 'ru';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('babytrack_lang', l);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations.ru[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, langLabels }}>
      {children}
    </I18nContext.Provider>
  );
}
