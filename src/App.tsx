import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Copy, Mail, Check, Award, Save, LogOut, User } from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

const defaultItems: ChecklistItem[] = [
  { id: '1', text: 'Ymmärrän webinaarin pääteeman ja tavoitteet.', checked: false },
  { id: '2', text: 'Tunnistan tärkeimmät käsitteet ja termit.', checked: false },
  { id: '3', text: 'Osaan soveltaa oppimaani omassa työssäni tai arjessani.', checked: false },
  { id: '4', text: 'Tiedän, mistä löydän lisämateriaalia ja tukea.', checked: false },
  { id: '5', text: 'Pystyn jakamaan oppimani asiat muille.', checked: false },
];

const STORAGE_KEY = 'webinar_checklist_data';

export default function App() {
  const [userName, setUserName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>(defaultItems);
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.userName) {
          setUserName(parsed.userName);
          setItems(parsed.items || defaultItems);
          setFeedback(parsed.feedback || '');
          setHasStarted(true);
        }
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
  }, []);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setHasStarted(true);
      saveData(userName, items, feedback);
    }
  };

  const saveData = (name: string, currentItems: ChecklistItem[], currentFeedback: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      userName: name,
      items: currentItems,
      feedback: currentFeedback
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSave = () => {
    saveData(userName, items, feedback);
  };

  const confirmLogout = () => {
    setHasStarted(false);
    setUserName('');
    setItems(defaultItems);
    setFeedback('');
    setShowLogoutConfirm(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const checkedCount = items.filter(i => i.checked).length;
  const progress = (checkedCount / items.length) * 100;

  const generateReport = () => {
    const checkedItemsText = items.filter(i => i.checked).map(i => `✅ ${i.text}`).join('\n');
    const uncheckedItemsText = items.filter(i => !i.checked).map(i => `❌ ${i.text}`).join('\n');
    
    return `Osallistuja: ${userName}\n\nWebinaarin oppimispalaute:\n\nOlen oppinut:\n${checkedItemsText || 'Ei merkintöjä'}\n\nKaipaan vielä kertausta:\n${uncheckedItemsText || 'Ei merkintöjä'}\n\nVapaa palaute:\n${feedback || 'Ei vapaata palautetta.'}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Palaute webinaarista - ${userName}`);
    const body = encodeURIComponent(generateReport());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border border-stone-200"
        >
          <div className="bg-emerald-600 px-8 py-10 text-white text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center p-3 bg-emerald-500 rounded-full mb-4 shadow-inner"
            >
              <Award className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Tervetuloa!</h1>
            <p className="text-emerald-100 text-lg">
              Kirjaudu sisään nimelläsi aloittaaksesi webinaarin tarkistuslistan täyttämisen.
            </p>
          </div>
          <div className="p-8">
            <form onSubmit={handleStart} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-2">
                  Nimesi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-stone-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border-2 border-stone-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors outline-none"
                    placeholder="Matti Meikäläinen"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!userName.trim()}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Aloita
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-end mb-4 h-10">
          {showLogoutConfirm ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center bg-white px-4 py-2 rounded-xl shadow-sm border border-stone-200"
            >
              <span className="text-sm text-stone-600 mr-3">Oletko varma?</span>
              <button onClick={confirmLogout} className="text-sm font-medium text-red-600 hover:text-red-700 mr-3 transition-colors">Kyllä</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors">Peruuta</button>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center text-sm text-stone-500 hover:text-stone-800 transition-colors px-4 py-2"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Vaihda käyttäjää
            </button>
          )}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200"
        >
          <div className="bg-emerald-600 px-8 py-10 text-white text-center relative">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center p-3 bg-emerald-500 rounded-full mb-4 shadow-inner"
            >
              <Award className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Hei {userName}!</h1>
            <p className="text-emerald-100 text-lg max-w-xl mx-auto">
              Mitä opit tänään? Käy läpi alla oleva lista ja merkitse asiat, jotka koet oppineesi.
            </p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-stone-500 uppercase tracking-wider">Edistyminen</span>
                <span className="text-2xl font-bold text-emerald-600">{checkedCount}/{items.length}</span>
              </div>
              <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="space-y-3 mb-10">
              {items.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => toggleItem(item.id)}
                  className={`w-full flex items-start text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                    item.checked 
                      ? 'border-emerald-500 bg-emerald-50/50' 
                      : 'border-stone-200 hover:border-emerald-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5 mr-4">
                    {item.checked ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-stone-300" />
                    )}
                  </div>
                  <span className={`text-lg transition-colors duration-200 ${
                    item.checked ? 'text-emerald-900 font-medium' : 'text-stone-600'
                  }`}>
                    {item.text}
                  </span>
                </motion.button>
              ))}
            </div>

            <div className="mb-8">
              <label htmlFor="feedback" className="block text-sm font-medium text-stone-700 mb-2">
                Vapaa palaute järjestäjälle (valinnainen)
              </label>
              <textarea
                id="feedback"
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Mitä muuta haluaisit kertoa webinaarista? Oliko jokin asia erityisen hyödyllinen tai jäikö jokin epäselväksi?"
                className="w-full rounded-2xl border-2 border-stone-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-4 text-stone-700 bg-stone-50 resize-none outline-none transition-colors"
              />
            </div>

            <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-stone-800 uppercase tracking-wider">
                  Toiminnot
                </h3>
                <button
                  onClick={handleSave}
                  className="flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {saved ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Tallennettu!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Tallenna edistyminen
                    </>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center px-6 py-3 border-2 border-emerald-600 text-emerald-700 font-medium rounded-xl hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Kopioitu!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Kopioi teksti
                    </>
                  )}
                </button>
                <button
                  onClick={handleEmail}
                  className="flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Lähetä sähköpostilla
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        
        <p className="text-center text-stone-400 text-sm mt-8">
          Tämä sovellus toimii selaimessasi. Tietojasi ei tallenneta palvelimelle.
        </p>
      </div>
    </div>
  );
}
