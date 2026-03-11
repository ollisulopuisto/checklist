import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Copy, Mail, Check, Award, Save, LogOut, User, Settings, Plus, Trash2, ArrowLeft, Link as LinkIcon } from 'lucide-react';
import LZString from 'lz-string';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

const defaultQuestions = [
  'Ymmärrän webinaarin pääteeman ja tavoitteet.',
  'Tunnistan tärkeimmät käsitteet ja termit.',
  'Osaan soveltaa oppimaani omassa työssäni tai arjessani.',
  'Tiedän, mistä löydän lisämateriaalia ja tukea.',
  'Pystyn jakamaan oppimani asiat muille.'
];

const encodeData = (data: string[]) => {
  // Pakataan data lz-stringillä, joka on suunniteltu erityisesti URL-turvalliseen pakkaukseen
  return LZString.compressToEncodedURIComponent(JSON.stringify(data));
};

const decodeData = (encoded: string): string[] | null => {
  try {
    // Yritetään ensin purkaa uudella lz-string -formaatilla
    const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
    if (decompressed) {
      return JSON.parse(decompressed);
    }
  } catch (e) {
    // Ohitetaan virhe ja yritetään vanhaa formaattia
  }
  
  try {
    // Taaksepäin yhteensopivuus: yritetään vanhaa base64-formaattia
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch (e) {
    return null;
  }
};

export default function App() {
  const [userName, setUserName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Admin state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminQuestions, setAdminQuestions] = useState<string[]>(defaultQuestions);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [urlCopied, setUrlCopied] = useState(false);

  const [storageKey, setStorageKey] = useState('webinar_checklist_default');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    
    let initialQuestions = defaultQuestions;
    let currentStorageKey = 'webinar_checklist_default';

    if (q) {
      const decoded = decodeData(q);
      if (decoded && Array.isArray(decoded)) {
        initialQuestions = decoded;
        // Create a unique storage key for this specific questionnaire
        currentStorageKey = 'webinar_checklist_' + q.substring(0, 20);
      }
    }
    
    setStorageKey(currentStorageKey);

    const initialItems = initialQuestions.map((text, index) => ({
      id: index.toString(),
      text,
      checked: false
    }));

    const savedData = localStorage.getItem(currentStorageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.userName) {
          setUserName(parsed.userName);
          // Merge saved checked state with current questions
          const mergedItems = initialItems.map(item => {
            const savedItem = parsed.items?.find((i: ChecklistItem) => i.id === item.id && i.text === item.text);
            return savedItem ? { ...item, checked: savedItem.checked } : item;
          });
          setItems(mergedItems);
          setFeedback(parsed.feedback || '');
          setHasStarted(true);
          return;
        }
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
    
    setItems(initialItems);
  }, []);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setHasStarted(true);
      saveData(userName, items, feedback);
    }
  };

  const saveData = (name: string, currentItems: ChecklistItem[], currentFeedback: string) => {
    localStorage.setItem(storageKey, JSON.stringify({
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
    // Reset items to unchecked
    setItems(items.map(i => ({ ...i, checked: false })));
    setFeedback('');
    setShowLogoutConfirm(false);
    localStorage.removeItem(storageKey);
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const checkedCount = items.filter(i => i.checked).length;
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

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

  // Admin functions
  const addAdminQuestion = () => {
    setAdminQuestions([...adminQuestions, '']);
  };

  const updateAdminQuestion = (index: number, value: string) => {
    const newQs = [...adminQuestions];
    newQs[index] = value;
    setAdminQuestions(newQs);
  };

  const removeAdminQuestion = (index: number) => {
    const newQs = adminQuestions.filter((_, i) => i !== index);
    setAdminQuestions(newQs);
  };

  const generateUrl = () => {
    const validQuestions = adminQuestions.filter(q => q.trim() !== '');
    if (validQuestions.length === 0) return;
    
    const encoded = encodeData(validQuestions);
    const url = `${window.location.origin}${window.location.pathname}?q=${encoded}`;
    setGeneratedUrl(url);
    setUrlCopied(false);
  };

  const copyGeneratedUrl = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL: ', err);
    }
  };

  if (isAdminMode) {
    return (
      <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={() => setIsAdminMode(false)}
            className="flex items-center text-stone-500 hover:text-stone-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Palaa takaisin
          </button>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200"
          >
            <div className="bg-stone-800 px-8 py-8 text-white">
              <div className="flex items-center mb-2">
                <Settings className="w-6 h-6 mr-3 text-stone-300" />
                <h1 className="text-2xl font-bold tracking-tight">Luo räätälöity kysely</h1>
              </div>
              <p className="text-stone-300">
                Määritä omat oppimistavoitteet tai kysymykset. Kun olet valmis, luo linkki ja jaa se osallistujille.
              </p>
            </div>
            
            <div className="p-8">
              <div className="space-y-4 mb-8">
                {adminQuestions.map((q, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={q}
                        onChange={(e) => updateAdminQuestion(index, e.target.value)}
                        placeholder={`Kysymys ${index + 1}`}
                        className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-stone-500 focus:border-stone-500 transition-colors outline-none"
                      />
                    </div>
                    <button
                      onClick={() => removeAdminQuestion(index)}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors border-2 border-transparent hover:border-red-100"
                      title="Poista kysymys"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                onClick={addAdminQuestion}
                className="flex items-center text-stone-600 hover:text-stone-900 font-medium mb-8 transition-colors"
              >
                <Plus className="w-5 h-5 mr-1" />
                Lisää uusi kysymys
              </button>
              
              <div className="border-t border-stone-200 pt-8">
                <button
                  onClick={generateUrl}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-stone-800 hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 transition-colors"
                >
                  <LinkIcon className="w-5 h-5 mr-2" />
                  Luo jaettava linkki
                </button>
                
                {generatedUrl && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 bg-stone-50 p-6 rounded-2xl border border-stone-200"
                  >
                    <p className="text-sm font-medium text-stone-700 mb-2">Kopioi tämä linkki osallistujille:</p>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        readOnly 
                        value={generatedUrl}
                        className="flex-grow px-4 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-600 outline-none"
                        onClick={(e) => e.currentTarget.select()}
                      />
                      <button
                        onClick={copyGeneratedUrl}
                        className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        {urlCopied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                        {urlCopied ? 'Kopioitu' : 'Kopioi'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
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
        
        <button 
          onClick={() => setIsAdminMode(true)}
          className="mt-8 flex items-center text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          <Settings className="w-4 h-4 mr-1" />
          Ylläpitäjä: Luo räätälöity kysely
        </button>
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
