const GEMINI_API_KEY = 'AIzaSyB9e5yAyV3EjkS-hS-HdR2F0Yquf0Zr4JI';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

const AUTHORIZED_DOMAINS = [
    'https://devix-cunaaokw6-marwanreyad442-gmailcoms-projects.vercel.app',
    'localhost:3000',
    'localhost:5000'
];

const API_HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GEMINI_API_KEY}`,
};

export { 
    GEMINI_API_KEY, 
    GEMINI_API_URL, 
    AUTHORIZED_DOMAINS,
    API_HEADERS 
};
