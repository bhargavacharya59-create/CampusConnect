// Centralised translations for the parent portal.
// Every user-visible string in the parent section is keyed here.

export const LANGUAGES = ["en", "kn", "hi"] as const;
export type Lang = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Lang, string> = {
  en: "English",
  kn: "ಕನ್ನಡ",
  hi: "हिन्दी",
};

export const DEFAULT_LANG: Lang = "en";

// All translatable strings for the parent portal.
// Interpolation placeholders use {name} syntax and are replaced at runtime.
export type TranslationKey = keyof typeof en;

const en = {
  // Header
  parentOf: "Parent of",
  noStudentLinked: "No student linked",
  noStudentLinkedDesc: "This parent ID is not linked to a student yet. Please contact the college office.",

  // Bottom nav
  home: "Home",
  attendance: "Attendance",
  marks: "Marks",
  fees: "Fees",
  messages: "Messages",

  // Dashboard summary row
  attendanceLabel: "Attendance",
  marksLabel: "Marks",
  feeDue: "Fee due",
  paid: "Paid",

  // Change password banner
  defaultPasswordWarning: "You're using the default password.",
  defaultPasswordAction: "Change it to keep your account safe.",

  // Attendance alert
  attendanceBelowThreshold: "Attendance below {threshold}%",
  needsToAttend: "{name} needs to attend the next {count} without a break to reach {threshold}%.",

  // AI section
  aiProgressSummary: "AI progress summary",
  aiNotSwitchedOn: "AI features will appear here once the college switches them on.",
  askAiAbout: "Ask AI about {name}",
  aiCanMakeMistakes: "AI can make mistakes. Check important details with the proctor.",
  getWeeklySummary: "Get this week's AI summary",
  writingSummary: "Writing summary…",

  // Message preview
  newMessage: "New message",

  // Today section
  today: "Today",
  noClassesToday: "No classes today.",

  // Latest marks
  latestMarks: "Latest marks",
  allMarks: "All marks",
  noMarksPublished: "No marks published yet.",
  absent: "Absent",

  // Fees
  overdueSince: "Overdue since",
  nextDue: "Next due",
  viewFees: "View fees",

  // Proctor
  proctorLabel: "Proctor (class mentor)",
  requestMeeting: "Request meeting",

  // Notices
  notices: "Notices",
  noNotices: "No notices.",
  allNotices: "All notices",

  // Attendance page
  overallAttendance: "Overall attendance",
  classesOf: "{present} of {total} classes",
  minimumThreshold: "Minimum {threshold}%",
  mustAttendToReach: "{name} must attend the next {count} in a row to reach {threshold}%.",
  aboveThresholdCanMiss: "{name} is above {threshold}%. Missing more than {count} would drop below it.",
  exactlyAtLimit: "{name} is exactly at the limit. Missing any class will drop below {threshold}%.",
  subjectWise: "Subject-wise",
  noAttendanceRecorded: "No attendance recorded yet.",
  barMarks: "The small line on each bar marks {threshold}%.",
  recentAbsences: "Recent absences",
  noAbsencesGreat: "No absences. Great!",
  classWord: "class",
  classesWord: "classes",

  // Marks page
  overallPublishedTests: "Overall (published tests)",
  printReportCard: "Print report card",
  reportCard: "Report card",
  semester: "Semester",
  noMarksPublishedDesc: "No marks have been published yet. Marks appear here after the Dean publishes them.",
  subject: "Subject",
  marksCol: "Marks",
  classAvg: "Class avg",
  excellent: "Excellent",
  good: "Good",
  needsWork: "Needs work",
  weak: "Weak",

  // Fees page
  toPay: "To pay",
  paidThisSemester: "Paid this semester",
  feeDetails: "Fee details",
  due: "Due",
  overdue: "Overdue",
  paidOn: "Paid {date}",
  receipt: "Receipt",
  howToPay: "How to pay",
  howToPayDesc: "Pay at the college accounts office (Monday to Friday, 10 am to 4 pm) or by bank transfer. Quote the student ID {id}. Payments show here once the office records them.",

  // Messages page
  messagesWithTeachers: "Messages with teachers",
  noMessagesYet: "No messages yet.",
  you: "You",
  messageProctor: "Message {name}",
  writeYourMessage: "Write your message…",
  send: "Send",
  sending: "Sending…",
  requestMeetingWithProctor: "Request a meeting with the proctor",
  meetingProctorDesc: "{name} will accept or suggest another time.",
  preferredDate: "Preferred date",
  dateConstraint: "Monday to Friday, within the next 30 days.",
  whatToDiscuss: "What would you like to discuss?",
  sendRequest: "Send request",
  yourRequests: "Your requests",
  waiting: "Waiting",
  accepted: "Accepted",
  declined: "Declined",
  noticesFromCollege: "Notices from the college",

  // Account page
  studentDetails: "Student details",
  student: "Student",
  studentId: "Student ID",
  classLabel: "Class",
  department: "Department",
  rollNumber: "Roll number",
  yourDetails: "Your details",
  name: "Name",
  parentId: "Parent ID",
  phone: "Phone",
  changePhoneNote: "To change your phone number, contact the college office.",
  proctor: "Proctor",
  call: "Call",
  changePassword: "Change password",
  signOut: "Sign out",

  // AI Assistant page
  askAiTitle: "Ask AI about {name}",
  aiAnswerSource: "Answers come from {name}'s attendance, marks, fees and notices. English, ಕನ್ನಡ or हिंदी.",
  aiNotSetUp: "The AI assistant is not switched on yet. The college office needs to add the Gemini API key.",
  tryAsking: "Try asking:",
  thinking: "Thinking…",
  askQuestion: "Ask a question…",
  questionsLeftToday: "{count} questions left today.",
  howDoing: "How is {name} doing overall?",
  whichSubjectAttention: "Which subject needs attention?",
  whenNextFee: "When is the next fee due?",
  connectionError: "Couldn't reach the server. Check your internet and try again.",

  // Language selector
  language: "Language",
  selectLanguage: "Select language",

  // Period status
  present: "Present",
  absentStatus: "Absent",
  notMarkedYet: "Not marked yet",
  later: "Later",
} as const;

const kn: Record<keyof typeof en, string> = {
  // Header
  parentOf: "ಇವರ ಪೋಷಕರು",
  noStudentLinked: "ವಿದ್ಯಾರ್ಥಿ ಲಿಂಕ್ ಆಗಿಲ್ಲ",
  noStudentLinkedDesc: "ಈ ಪೋಷಕ ID ಯನ್ನು ಇನ್ನೂ ವಿದ್ಯಾರ್ಥಿಗೆ ಲಿಂಕ್ ಮಾಡಿಲ್ಲ. ದಯವಿಟ್ಟು ಕಾಲೇಜು ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",

  // Bottom nav
  home: "ಮುಖಪುಟ",
  attendance: "ಹಾಜರಾತಿ",
  marks: "ಅಂಕಗಳು",
  fees: "ಶುಲ್ಕ",
  messages: "ಸಂದೇಶಗಳು",

  // Dashboard summary row
  attendanceLabel: "ಹಾಜರಾತಿ",
  marksLabel: "ಅಂಕಗಳು",
  feeDue: "ಬಾಕಿ ಶುಲ್ಕ",
  paid: "ಪಾವತಿಸಲಾಗಿದೆ",

  // Change password banner
  defaultPasswordWarning: "ನೀವು ಡೀಫಾಲ್ಟ್ ಪಾಸ್‌ವರ್ಡ್ ಬಳಸುತ್ತಿದ್ದೀರಿ.",
  defaultPasswordAction: "ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಸುರಕ್ಷಿತವಾಗಿಡಲು ಅದನ್ನು ಬದಲಾಯಿಸಿ.",

  // Attendance alert
  attendanceBelowThreshold: "ಹಾಜರಾತಿ {threshold}% ಕ್ಕಿಂತ ಕಡಿಮೆ",
  needsToAttend: "{name} ಅವರು {threshold}% ತಲುಪಲು ಮುಂದಿನ {count} ತರಗತಿಗಳಿಗೆ ನಿಲ್ಲಿಸದೆ ಹಾಜರಾಗಬೇಕು.",

  // AI section
  aiProgressSummary: "AI ಪ್ರಗತಿ ಸಾರಾಂಶ",
  aiNotSwitchedOn: "ಕಾಲೇಜು ಚಾಲನೆ ಮಾಡಿದ ನಂತರ AI ವೈಶಿಷ್ಟ್ಯಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
  askAiAbout: "{name} ಬಗ್ಗೆ AI ಕೇಳಿ",
  aiCanMakeMistakes: "AI ತಪ್ಪುಗಳನ್ನು ಮಾಡಬಹುದು. ಪ್ರಮುಖ ವಿವರಗಳನ್ನು ಪ್ರಾಕ್ಟರ್ ಬಳಿ ಪರಿಶೀಲಿಸಿ.",
  getWeeklySummary: "ಈ ವಾರದ AI ಸಾರಾಂಶ ಪಡೆಯಿರಿ",
  writingSummary: "ಸಾರಾಂಶ ಬರೆಯಲಾಗುತ್ತಿದೆ…",

  // Message preview
  newMessage: "ಹೊಸ ಸಂದೇಶ",

  // Today section
  today: "ಇಂದು",
  noClassesToday: "ಇಂದು ತರಗತಿಗಳಿಲ್ಲ.",

  // Latest marks
  latestMarks: "ಇತ್ತೀಚಿನ ಅಂಕಗಳು",
  allMarks: "ಎಲ್ಲಾ ಅಂಕಗಳು",
  noMarksPublished: "ಇನ್ನೂ ಯಾವುದೇ ಅಂಕಗಳನ್ನು ಪ್ರಕಟಿಸಿಲ್ಲ.",
  absent: "ಗೈರುಹಾಜರು",

  // Fees
  overdueSince: "ಇಂದಿನಿಂದ ಬಾಕಿ",
  nextDue: "ಮುಂದಿನ ಬಾಕಿ",
  viewFees: "ಶುಲ್ಕ ವೀಕ್ಷಿಸಿ",

  // Proctor
  proctorLabel: "ಪ್ರಾಕ್ಟರ್ (ತರಗತಿ ಮಾರ್ಗದರ್ಶಕ)",
  requestMeeting: "ಸಭೆ ಕೋರಿ",

  // Notices
  notices: "ಸೂಚನೆಗಳು",
  noNotices: "ಸೂಚನೆಗಳಿಲ್ಲ.",
  allNotices: "ಎಲ್ಲಾ ಸೂಚನೆಗಳು",

  // Attendance page
  overallAttendance: "ಒಟ್ಟಾರೆ ಹಾಜರಾತಿ",
  classesOf: "{total} ತರಗತಿಗಳಲ್ಲಿ {present}",
  minimumThreshold: "ಕನಿಷ್ಠ {threshold}%",
  mustAttendToReach: "{threshold}% ತಲುಪಲು {name} ಸತತವಾಗಿ ಮುಂದಿನ {count} ತರಗತಿಗಳಿಗೆ ಹಾಜರಾಗಬೇಕು.",
  aboveThresholdCanMiss: "{name} {threshold}% ಮೇಲಿದ್ದಾರೆ. {count} ಕ್ಕಿಂತ ಹೆಚ್ಚು ತಪ್ಪಿದರೆ ಅದಕ್ಕಿಂತ ಕೆಳಗೆ ಇಳಿಯುತ್ತದೆ.",
  exactlyAtLimit: "{name} ನಿಖರವಾಗಿ ಮಿತಿಯಲ್ಲಿದ್ದಾರೆ. ಯಾವುದೇ ತರಗತಿ ತಪ್ಪಿದರೆ {threshold}% ಕ್ಕಿಂತ ಕೆಳಗೆ ಇಳಿಯುತ್ತದೆ.",
  subjectWise: "ವಿಷಯವಾರು",
  noAttendanceRecorded: "ಇನ್ನೂ ಹಾಜರಾತಿ ದಾಖಲಾಗಿಲ್ಲ.",
  barMarks: "ಪ್ರತಿ ಬಾರ್‌ನಲ್ಲಿನ ಸಣ್ಣ ಗೆರೆ {threshold}% ಅನ್ನು ಸೂಚಿಸುತ್ತದೆ.",
  recentAbsences: "ಇತ್ತೀಚಿನ ಗೈರುಹಾಜರಿ",
  noAbsencesGreat: "ಗೈರುಹಾಜರಿ ಇಲ್ಲ. ಅದ್ಭುತ!",
  classWord: "ತರಗತಿ",
  classesWord: "ತರಗತಿಗಳು",

  // Marks page
  overallPublishedTests: "ಒಟ್ಟಾರೆ (ಪ್ರಕಟಿತ ಪರೀಕ್ಷೆಗಳು)",
  printReportCard: "ವರದಿ ಕಾರ್ಡ್ ಮುದ್ರಿಸಿ",
  reportCard: "ವರದಿ ಕಾರ್ಡ್",
  semester: "ಸೆಮಿಸ್ಟರ್",
  noMarksPublishedDesc: "ಇನ್ನೂ ಯಾವುದೇ ಅಂಕಗಳನ್ನು ಪ್ರಕಟಿಸಿಲ್ಲ. ಡೀನ್ ಪ್ರಕಟಿಸಿದ ನಂತರ ಅಂಕಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
  subject: "ವಿಷಯ",
  marksCol: "ಅಂಕಗಳು",
  classAvg: "ತರಗತಿ ಸರಾಸರಿ",
  excellent: "ಅತ್ಯುತ್ತಮ",
  good: "ಉತ್ತಮ",
  needsWork: "ಸುಧಾರಣೆ ಬೇಕು",
  weak: "ದುರ್ಬಲ",

  // Fees page
  toPay: "ಪಾವತಿಸಬೇಕಾಗಿದೆ",
  paidThisSemester: "ಈ ಸೆಮಿಸ್ಟರ್‌ನಲ್ಲಿ ಪಾವತಿಸಿದ್ದು",
  feeDetails: "ಶುಲ್ಕ ವಿವರಗಳು",
  due: "ಬಾಕಿ",
  overdue: "ಅವಧಿ ಮೀರಿದೆ",
  paidOn: "{date} ರಂದು ಪಾವತಿಸಲಾಗಿದೆ",
  receipt: "ರಸೀದಿ",
  howToPay: "ಪಾವತಿ ಹೇಗೆ ಮಾಡುವುದು",
  howToPayDesc: "ಕಾಲೇಜು ಲೆಕ್ಕ ಕಚೇರಿಯಲ್ಲಿ ಪಾವತಿಸಿ (ಸೋಮವಾರದಿಂದ ಶುಕ್ರವಾರ, ಬೆಳಿಗ್ಗೆ 10 ರಿಂದ ಸಂಜೆ 4) ಅಥವಾ ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ ಮೂಲಕ. ವಿದ್ಯಾರ್ಥಿ ID {id} ಉಲ್ಲೇಖಿಸಿ. ಕಚೇರಿ ದಾಖಲಿಸಿದ ನಂತರ ಪಾವತಿಗಳು ಇಲ್ಲಿ ತೋರಿಸುತ್ತವೆ.",

  // Messages page
  messagesWithTeachers: "ಶಿಕ್ಷಕರ ಜೊತೆ ಸಂದೇಶಗಳು",
  noMessagesYet: "ಇನ್ನೂ ಸಂದೇಶಗಳಿಲ್ಲ.",
  you: "ನೀವು",
  messageProctor: "{name} ಅವರಿಗೆ ಸಂದೇಶ",
  writeYourMessage: "ನಿಮ್ಮ ಸಂದೇಶ ಬರೆಯಿರಿ…",
  send: "ಕಳುಹಿಸಿ",
  sending: "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…",
  requestMeetingWithProctor: "ಪ್ರಾಕ್ಟರ್ ಜೊತೆ ಸಭೆ ಕೋರಿ",
  meetingProctorDesc: "{name} ಒಪ್ಪುತ್ತಾರೆ ಅಥವಾ ಬೇರೆ ಸಮಯ ಸೂಚಿಸುತ್ತಾರೆ.",
  preferredDate: "ಆದ್ಯತೆಯ ದಿನಾಂಕ",
  dateConstraint: "ಸೋಮವಾರದಿಂದ ಶುಕ್ರವಾರ, ಮುಂದಿನ 30 ದಿನಗಳೊಳಗೆ.",
  whatToDiscuss: "ನೀವು ಏನು ಚರ್ಚಿಸಲು ಬಯಸುತ್ತೀರಿ?",
  sendRequest: "ವಿನಂತಿ ಕಳುಹಿಸಿ",
  yourRequests: "ನಿಮ್ಮ ವಿನಂತಿಗಳು",
  waiting: "ಕಾಯುತ್ತಿದೆ",
  accepted: "ಒಪ್ಪಿಕೊಳ್ಳಲಾಗಿದೆ",
  declined: "ನಿರಾಕರಿಸಲಾಗಿದೆ",
  noticesFromCollege: "ಕಾಲೇಜಿನಿಂದ ಸೂಚನೆಗಳು",

  // Account page
  studentDetails: "ವಿದ್ಯಾರ್ಥಿ ವಿವರಗಳು",
  student: "ವಿದ್ಯಾರ್ಥಿ",
  studentId: "ವಿದ್ಯಾರ್ಥಿ ID",
  classLabel: "ತರಗತಿ",
  department: "ವಿಭಾಗ",
  rollNumber: "ರೋಲ್ ನಂಬರ್",
  yourDetails: "ನಿಮ್ಮ ವಿವರಗಳು",
  name: "ಹೆಸರು",
  parentId: "ಪೋಷಕ ID",
  phone: "ಫೋನ್",
  changePhoneNote: "ನಿಮ್ಮ ಫೋನ್ ಸಂಖ್ಯೆ ಬದಲಾಯಿಸಲು, ಕಾಲೇಜು ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
  proctor: "ಪ್ರಾಕ್ಟರ್",
  call: "ಕರೆ ಮಾಡಿ",
  changePassword: "ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ",
  signOut: "ಸೈನ್ ಔಟ್",

  // AI Assistant page
  askAiTitle: "{name} ಬಗ್ಗೆ AI ಕೇಳಿ",
  aiAnswerSource: "{name} ಅವರ ಹಾಜರಾತಿ, ಅಂಕಗಳು, ಶುಲ್ಕ ಮತ್ತು ಸೂಚನೆಗಳಿಂದ ಉತ್ತರಗಳು ಬರುತ್ತವೆ. English, ಕನ್ನಡ ಅಥವಾ हिंदी.",
  aiNotSetUp: "AI ಸಹಾಯಕ ಇನ್ನೂ ಆನ್ ಆಗಿಲ್ಲ. ಕಾಲೇಜು ಕಚೇರಿಯು Gemini API ಕೀಲಿಯನ್ನು ಸೇರಿಸಬೇಕು.",
  tryAsking: "ಇದನ್ನು ಕೇಳಲು ಪ್ರಯತ್ನಿಸಿ:",
  thinking: "ಯೋಚಿಸುತ್ತಿದೆ…",
  askQuestion: "ಪ್ರಶ್ನೆ ಕೇಳಿ…",
  questionsLeftToday: "ಇಂದು {count} ಪ್ರಶ್ನೆಗಳು ಉಳಿದಿವೆ.",
  howDoing: "{name} ಒಟ್ಟಾರೆ ಹೇಗಿದ್ದಾರೆ?",
  whichSubjectAttention: "ಯಾವ ವಿಷಯಕ್ಕೆ ಗಮನ ಬೇಕು?",
  whenNextFee: "ಮುಂದಿನ ಶುಲ್ಕ ಯಾವಾಗ ಬಾಕಿಯಿದೆ?",
  connectionError: "ಸರ್ವರ್ ತಲುಪಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ನಿಮ್ಮ ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",

  // Language selector
  language: "ಭಾಷೆ",
  selectLanguage: "ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ",

  // Period status
  present: "ಹಾಜರು",
  absentStatus: "ಗೈರುಹಾಜರು",
  notMarkedYet: "ಇನ್ನೂ ಗುರುತಿಸಿಲ್ಲ",
  later: "ನಂತರ",
};

const hi: Record<keyof typeof en, string> = {
  // Header
  parentOf: "अभिभावक",
  noStudentLinked: "कोई छात्र लिंक नहीं है",
  noStudentLinkedDesc: "यह पैरेंट ID अभी तक किसी छात्र से लिंक नहीं है। कृपया कॉलेज कार्यालय से संपर्क करें।",

  // Bottom nav
  home: "होम",
  attendance: "उपस्थिति",
  marks: "अंक",
  fees: "शुल्क",
  messages: "संदेश",

  // Dashboard summary row
  attendanceLabel: "उपस्थिति",
  marksLabel: "अंक",
  feeDue: "बकाया शुल्क",
  paid: "भुगतान हो गया",

  // Change password banner
  defaultPasswordWarning: "आप डिफ़ॉल्ट पासवर्ड इस्तेमाल कर रहे हैं।",
  defaultPasswordAction: "अपने खाते को सुरक्षित रखने के लिए इसे बदलें।",

  // Attendance alert
  attendanceBelowThreshold: "उपस्थिति {threshold}% से कम",
  needsToAttend: "{name} को {threshold}% तक पहुँचने के लिए अगली {count} कक्षाओं में लगातार उपस्थित रहना होगा।",

  // AI section
  aiProgressSummary: "AI प्रगति सारांश",
  aiNotSwitchedOn: "कॉलेज द्वारा चालू करने के बाद AI सुविधाएँ यहाँ दिखाई देंगी।",
  askAiAbout: "{name} के बारे में AI से पूछें",
  aiCanMakeMistakes: "AI से गलतियाँ हो सकती हैं। महत्वपूर्ण जानकारी प्रॉक्टर से जाँचें।",
  getWeeklySummary: "इस सप्ताह का AI सारांश प्राप्त करें",
  writingSummary: "सारांश लिखा जा रहा है…",

  // Message preview
  newMessage: "नया संदेश",

  // Today section
  today: "आज",
  noClassesToday: "आज कोई कक्षा नहीं है।",

  // Latest marks
  latestMarks: "नवीनतम अंक",
  allMarks: "सभी अंक",
  noMarksPublished: "अभी तक कोई अंक प्रकाशित नहीं हुए हैं।",
  absent: "अनुपस्थित",

  // Fees
  overdueSince: "इस तारीख से बकाया",
  nextDue: "अगला बकाया",
  viewFees: "शुल्क देखें",

  // Proctor
  proctorLabel: "प्रॉक्टर (कक्षा मार्गदर्शक)",
  requestMeeting: "बैठक का अनुरोध करें",

  // Notices
  notices: "सूचनाएँ",
  noNotices: "कोई सूचना नहीं।",
  allNotices: "सभी सूचनाएँ",

  // Attendance page
  overallAttendance: "कुल उपस्थिति",
  classesOf: "{total} कक्षाओं में से {present}",
  minimumThreshold: "न्यूनतम {threshold}%",
  mustAttendToReach: "{threshold}% तक पहुँचने के लिए {name} को लगातार अगली {count} कक्षाओं में उपस्थित रहना होगा।",
  aboveThresholdCanMiss: "{name} {threshold}% से ऊपर हैं। {count} से अधिक कक्षाएँ छूटने पर नीचे गिर जाएगा।",
  exactlyAtLimit: "{name} बिल्कुल सीमा पर हैं। कोई भी कक्षा छूटने पर {threshold}% से नीचे गिर जाएगा।",
  subjectWise: "विषयवार",
  noAttendanceRecorded: "अभी तक उपस्थिति दर्ज नहीं हुई है।",
  barMarks: "प्रत्येक बार पर छोटी रेखा {threshold}% दर्शाती है।",
  recentAbsences: "हाल की अनुपस्थिति",
  noAbsencesGreat: "कोई अनुपस्थिति नहीं। बहुत अच्छा!",
  classWord: "कक्षा",
  classesWord: "कक्षाएँ",

  // Marks page
  overallPublishedTests: "कुल (प्रकाशित परीक्षाएँ)",
  printReportCard: "रिपोर्ट कार्ड प्रिंट करें",
  reportCard: "रिपोर्ट कार्ड",
  semester: "सेमेस्टर",
  noMarksPublishedDesc: "अभी तक कोई अंक प्रकाशित नहीं हुए हैं। डीन द्वारा प्रकाशित होने पर अंक यहाँ दिखाई देंगे।",
  subject: "विषय",
  marksCol: "अंक",
  classAvg: "कक्षा औसत",
  excellent: "उत्कृष्ट",
  good: "अच्छा",
  needsWork: "सुधार की जरूरत",
  weak: "कमज़ोर",

  // Fees page
  toPay: "भुगतान करना है",
  paidThisSemester: "इस सेमेस्टर में भुगतान किया",
  feeDetails: "शुल्क विवरण",
  due: "बकाया",
  overdue: "अवधि समाप्त",
  paidOn: "{date} को भुगतान किया",
  receipt: "रसीद",
  howToPay: "भुगतान कैसे करें",
  howToPayDesc: "कॉलेज अकाउंट्स ऑफिस में भुगतान करें (सोमवार से शुक्रवार, सुबह 10 से शाम 4 बजे) या बैंक ट्रांसफर से। छात्र ID {id} का उल्लेख करें। कार्यालय द्वारा दर्ज किए जाने पर भुगतान यहाँ दिखाई देगा।",

  // Messages page
  messagesWithTeachers: "शिक्षकों के साथ संदेश",
  noMessagesYet: "अभी तक कोई संदेश नहीं।",
  you: "आप",
  messageProctor: "{name} को संदेश",
  writeYourMessage: "अपना संदेश लिखें…",
  send: "भेजें",
  sending: "भेजा जा रहा है…",
  requestMeetingWithProctor: "प्रॉक्टर के साथ बैठक का अनुरोध करें",
  meetingProctorDesc: "{name} स्वीकार करेंगे या कोई अन्य समय सुझाएंगे।",
  preferredDate: "पसंदीदा तारीख",
  dateConstraint: "सोमवार से शुक्रवार, अगले 30 दिनों के भीतर।",
  whatToDiscuss: "आप क्या चर्चा करना चाहते हैं?",
  sendRequest: "अनुरोध भेजें",
  yourRequests: "आपके अनुरोध",
  waiting: "प्रतीक्षा",
  accepted: "स्वीकृत",
  declined: "अस्वीकृत",
  noticesFromCollege: "कॉलेज की सूचनाएँ",

  // Account page
  studentDetails: "छात्र विवरण",
  student: "छात्र",
  studentId: "छात्र ID",
  classLabel: "कक्षा",
  department: "विभाग",
  rollNumber: "रोल नंबर",
  yourDetails: "आपका विवरण",
  name: "नाम",
  parentId: "पैरेंट ID",
  phone: "फोन",
  changePhoneNote: "अपना फोन नंबर बदलने के लिए, कॉलेज कार्यालय से संपर्क करें।",
  proctor: "प्रॉक्टर",
  call: "कॉल करें",
  changePassword: "पासवर्ड बदलें",
  signOut: "साइन आउट",

  // AI Assistant page
  askAiTitle: "{name} के बारे में AI से पूछें",
  aiAnswerSource: "उत्तर {name} की उपस्थिति, अंक, शुल्क और सूचनाओं से आते हैं। English, ಕನ್ನಡ या हिंदी।",
  aiNotSetUp: "AI सहायक अभी चालू नहीं है। कॉलेज कार्यालय को Gemini API कुंजी जोड़नी होगी।",
  tryAsking: "यह पूछने का प्रयास करें:",
  thinking: "सोच रहा है…",
  askQuestion: "प्रश्न पूछें…",
  questionsLeftToday: "आज {count} प्रश्न शेष हैं।",
  howDoing: "{name} कुल मिलाकर कैसे हैं?",
  whichSubjectAttention: "किस विषय पर ध्यान देने की जरूरत है?",
  whenNextFee: "अगला शुल्क कब बकाया है?",
  connectionError: "सर्वर से कनेक्ट नहीं हो पाया। अपना इंटरनेट जाँचें और फिर से प्रयास करें।",

  // Language selector
  language: "भाषा",
  selectLanguage: "भाषा चुनें",

  // Period status
  present: "उपस्थित",
  absentStatus: "अनुपस्थित",
  notMarkedYet: "अभी तक अंकित नहीं",
  later: "बाद में",
};

export const TRANSLATIONS: Record<Lang, Record<keyof typeof en, string>> = { en, kn, hi };

/** Replace {key} placeholders with provided values. */
export function t(lang: Lang, key: TranslationKey, vars?: Record<string, string | number>): string {
  let str = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}
