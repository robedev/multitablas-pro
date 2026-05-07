/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  Menu, 
  BookOpen, 
  Trophy, 
  History as HistoryIcon, 
  BarChart2, 
  ChevronLeft, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Lightbulb,
  RotateCcw,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppMode, Session, ErrorRecord, TableMastery } from './types';
import { MULTIPLICATION_TIPS, COLORS } from './constants';

// --- Components ---

interface CardProps {
  children: React.ReactNode;
  className?: string;
  key?: React.Key;
}

const Card = ({ children, className = "" }: CardProps) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = "",
  disabled = false 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  className?: string;
  disabled?: boolean;
}) => {
  const baseStyles = "px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200",
    secondary: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-200",
    outline: "border-2 border-slate-200 text-slate-600 hover:bg-slate-50",
    ghost: "text-slate-500 hover:bg-slate-100",
    danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-200",
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// --- Main App ---

export default function App() {
  const [mode, setMode] = useState<AppMode>('HOME');
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [history, setHistory] = useState<Session[]>([]);
  const [mastery, setMastery] = useState<Record<number, TableMastery>>({});
  
  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<{a: number, b: number}[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizErrors, setQuizErrors] = useState<ErrorRecord[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [startTime, setStartTime] = useState(0);

  // Learn State
  const [learnTable, setLearnTable] = useState(1);

  // Persist State
  useEffect(() => {
    const savedHistory = localStorage.getItem('multitablas_history');
    const savedMastery = localStorage.getItem('multitablas_mastery');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedMastery) setMastery(JSON.parse(savedMastery));
  }, []);

  const saveHistory = (newHistory: Session[]) => {
    setHistory(newHistory);
    localStorage.setItem('multitablas_history', JSON.stringify(newHistory));
  };

  const updateMastery = (correctAnswers: {a: number, b: number}[], errors: ErrorRecord[]) => {
    const newMastery = { ...mastery };
    
    // Process correct answers (those not in errors)
    const errorMap = new Set(errors.map(e => `${e.factorA}x${e.factorB}`));
    
    const allAttempts = [...correctAnswers]; 
    // This is simplified: in a real session, we know which ones were correct
    
    allAttempts.forEach(q => {
      const isCorrect = !errorMap.has(`${q.a}x${q.b}`);
      const table = q.a;
      if (!newMastery[table]) {
        newMastery[table] = { table, correct: 0, attempts: 0, lastPracticed: new Date().toISOString() };
      }
      newMastery[table].attempts += 1;
      if (isCorrect) newMastery[table].correct += 1;
      newMastery[table].lastPracticed = new Date().toISOString();
    });

    setMastery(newMastery);
    localStorage.setItem('multitablas_mastery', JSON.stringify(newMastery));
  };

  // --- Handlers ---

  const startQuiz = () => {
    if (selectedTables.length === 0) return;
    
    const questions: {a: number, b: number}[] = [];
    selectedTables.forEach(t => {
      for (let i = 1; i <= 10; i++) {
        questions.push({ a: t, b: i });
      }
    });

    // Shuffle
    const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, 20); // Max 20 questions
    
    setQuizQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setQuizErrors([]);
    setStartTime(Date.now());
    setMode('QUIZ');
  };

  const handleLevelSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const val = parseInt(userAnswer);
    if (isNaN(val)) return;

    const current = quizQuestions[currentQuestionIndex];
    const correct = current.a * current.b;

    if (val === correct) {
      setQuizScore(s => s + 1);
    } else {
      setQuizErrors(prev => [...prev, {
        factorA: current.a,
        factorB: current.b,
        userAnswer: val,
        correctAnswer: correct,
        timestamp: new Date().toISOString()
      }]);
    }

    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex(i => i + 1);
      setUserAnswer("");
    } else {
      // Session End
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const newSession: Session = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        tables: selectedTables,
        score: val === correct ? quizScore + 1 : quizScore,
        total: quizQuestions.length,
        errors: val === correct ? quizErrors : [...quizErrors, {
          factorA: current.a,
          factorB: current.b,
          userAnswer: val,
          correctAnswer: correct,
          timestamp: new Date().toISOString()
        }],
        duration
      };

      setCurrentSession(newSession);
      saveHistory([newSession, ...history]);
      updateMastery(quizQuestions, newSession.errors);
      setMode('RESULTS');
    }
  };

  // --- UI Parts ---

  const Sidebar = () => (
    <div className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col p-6 hidden md:flex">
      <div className="flex items-center gap-3 text-white mb-10">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Menu size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">MultiTablas</h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        <NavButton icon={<Home size={20}/>} label="Inicio" active={mode === 'HOME'} onClick={() => setMode('HOME')} />
        <NavButton icon={<BookOpen size={20}/>} label="Aprender" active={mode === 'LEARN'} onClick={() => setMode('LEARN')} />
        <NavButton icon={<Trophy size={20}/>} label="Practicar" active={mode === 'SELECT_TABLES' || mode === 'QUIZ'} onClick={() => setMode('SELECT_TABLES')} />
        <NavButton icon={<BarChart2 size={20}/>} label="Progreso" active={mode === 'PROGRESS'} onClick={() => setMode('PROGRESS')} />
        <NavButton icon={<HistoryIcon size={20}/>} label="Historial" active={mode === 'HISTORY'} onClick={() => setMode('HISTORY')} />
      </nav>

      <div className="pt-6 border-t border-slate-800">
        <p className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-4">Ayuda Memoria</p>
        <div className="bg-slate-800/50 p-4 rounded-xl text-sm italic">
          "9x7 = 63. Recuerda: las decenas son el número - 1 (9-1=8... wait, 7-1=6!) y las unidades completan 9."
        </div>
      </div>
    </div>
  );

  const NavButton = ({ icon, label, active, onClick }: any) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Menu size={20} className="text-indigo-600" />
            <span className="font-bold text-lg">MultiTablas</span>
          </div>
          <button onClick={() => setMode('HOME')} className="p-2 text-slate-500"><Home size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10">
          <AnimatePresence mode="wait">
            {mode === 'HOME' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Hola, ¡listo para aprender! 🚀</h2>
                    <p className="text-lg text-slate-500 mt-2">Domina las tablas de multiplicar de forma divertida y rápida.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-none">
                    <Star className="mb-4 opacity-80" />
                    <h3 className="text-lg font-bold">Racha Actual</h3>
                    <p className="text-4xl font-black mt-1">0 días</p>
                    <p className="text-sm opacity-80 mt-2">¡Sigue así!</p>
                  </Card>
                  <Card className="p-6">
                    <Trophy className="text-amber-500 mb-4" />
                    <h3 className="text-lg font-bold">Mejor Puntuación</h3>
                    <p className="text-4xl font-black mt-1">{history.length > 0 ? Math.max(...history.map(h => h.score)) : 0}</p>
                    <p className="text-sm text-slate-400 mt-2">Puntos totales</p>
                  </Card>
                  <Card className="p-6">
                    <BarChart2 className="text-emerald-500 mb-4" />
                    <h3 className="text-lg font-bold">Total Práctica</h3>
                    <p className="text-4xl font-black mt-1">{history.length}</p>
                    <p className="text-sm text-slate-400 mt-2">Sesiones completadas</p>
                  </Card>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Play size={20} className="text-indigo-600" />
                      Sesión Rápida
                    </h3>
                    <Card className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
                        <Play size={32} className="text-indigo-600 fill-indigo-600" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold">¡Empieza ahora!</h4>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">Elige tus tablas y pon a prueba tus conocimientos en 20 preguntas.</p>
                      </div>
                      <Button onClick={() => setMode('SELECT_TABLES')} className="w-full">Seleccionar Tablas</Button>
                    </Card>
                  </div>
                  
                  <div className="w-full md:w-80 space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Lightbulb size={20} className="text-amber-500" />
                      Tip del día
                    </h3>
                    <Card className="p-6 bg-amber-50 border-amber-100">
                      <p className="text-amber-900 leading-relaxed italic">
                        "La tabla del 5 siempre termina en 0 o 5. Si multiplicas por un número par, termina en 0. Si es impar, en 5."
                      </p>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}

            {mode === 'SELECT_TABLES' && (
              <motion.div 
                key="select"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="flex items-center gap-4">
                  <button onClick={() => setMode('HOME')} className="p-2 hover:bg-slate-200 rounded-lg"><ChevronLeft /></button>
                  <h2 className="text-3xl font-bold">Elige las tablas para practicar</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button 
                      key={n} 
                      onClick={() => setSelectedTables(prev => prev.includes(n) ? prev.filter(t => t !== n) : [...prev, n])}
                      className={`h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                        selectedTables.includes(n) 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400'
                      }`}
                    >
                      <span className="text-sm opacity-80">Tabla del</span>
                      <span className="text-3xl font-black">{n}</span>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-slate-500 font-medium">{selectedTables.length} tablas seleccionadas</p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setSelectedTables([1,2,3,4,5,6,7,8,9,10])}>Todas</Button>
                    <Button onClick={startQuiz} disabled={selectedTables.length === 0}>¡Empezar Quiz!</Button>
                  </div>
                </div>
              </motion.div>
            )}

            {mode === 'QUIZ' && (
              <motion.div 
                key="quiz"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-2xl mx-auto h-full flex flex-col"
              >
                <div className="flex justify-between items-center mb-8">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">Progreso</span>
                    <span className="text-xl font-bold">{currentQuestionIndex + 1} / {quizQuestions.length}</span>
                  </div>
                  <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-300" 
                      style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                    />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">Puntos</span>
                    <span className="text-xl font-bold text-emerald-600">{quizScore}</span>
                  </div>
                </div>

                <Card className="flex-1 flex flex-col p-8 md:p-16 items-center justify-center bg-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20" />
                  
                  <div className="flex items-center gap-6 text-7xl md:text-9xl font-black text-slate-900 mb-12">
                    <motion.span 
                      key={`a-${currentQuestionIndex}`}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      {quizQuestions[currentQuestionIndex].a}
                    </motion.span>
                    <span className="text-indigo-400">×</span>
                    <motion.span 
                      key={`b-${currentQuestionIndex}`}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {quizQuestions[currentQuestionIndex].b}
                    </motion.span>
                  </div>

                  <form onSubmit={handleLevelSubmit} className="w-full max-w-sm space-y-4">
                    <input 
                      autoFocus
                      type="number"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Respuesta..."
                      className="w-full text-center text-4xl p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold"
                    />
                    <Button className="w-full text-xl py-6 rounded-2xl" variant="primary">Enviar Enter</Button>
                  </form>
                </Card>

                <button 
                  onClick={() => setMode('SELECT_TABLES')} 
                  className="mt-6 self-center text-slate-400 hover:text-rose-500 flex items-center gap-2 transition-colors"
                >
                  <XCircle size={18} />
                  Abandonar práctica
                </button>
              </motion.div>
            )}

            {mode === 'RESULTS' && currentSession && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                    <Trophy size={48} />
                  </div>
                  <h2 className="text-4xl font-extrabold tracking-tight">¡Excelente trabajo! 🎊</h2>
                  <p className="text-xl text-slate-500">Has completado tu sesión de práctica.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 text-center">
                    <p className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-1">Puntuación</p>
                    <p className="text-5xl font-black text-indigo-600">{currentSession.score} / {currentSession.total}</p>
                    <p className="text-sm text-slate-500 mt-2">Respuestas correctas</p>
                  </Card>
                  <Card className="p-6 text-center">
                    <p className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-1">Precisión</p>
                    <p className="text-5xl font-black text-emerald-500">{Math.round((currentSession.score / currentSession.total) * 100)}%</p>
                    <p className="text-sm text-slate-500 mt-2">Dominio del tema</p>
                  </Card>
                  <Card className="p-6 text-center">
                    <p className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-1">Tiempo</p>
                    <p className="text-5xl font-black text-slate-900">{currentSession.duration}s</p>
                    <p className="text-sm text-slate-500 mt-2">Duración total</p>
                  </Card>
                </div>

                {currentSession.errors.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold flex items-center gap-2 text-rose-600">
                      <AlertCircle />
                      Revisar errores
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentSession.errors.map((error, idx) => (
                        <Card key={idx} className="p-4 border-rose-100 bg-rose-50/30 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-black">{error.factorA} × {error.factorB}</span>
                            <span className="text-slate-400">=</span>
                            <span className="text-2xl font-black text-emerald-600">{error.correctAnswer}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-rose-500 font-bold uppercase">Tu respuesta</span>
                            <span className="text-lg font-bold text-rose-600 line-through decoration-2">{error.userAnswer}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button onClick={() => setMode('HOME')} variant="outline" className="flex-1">Ir al inicio</Button>
                  <Button onClick={startQuiz} className="flex-1">Repetir práctica <RotateCcw size={18} /></Button>
                </div>
              </motion.div>
            )}

            {mode === 'LEARN' && (
              <motion.div 
                key="learn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold flex items-center gap-3">
                    <BookOpen className="text-indigo-600" />
                    Biblioteca de Tablas
                  </h2>
                  <div className="flex gap-2">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <button 
                        key={n} 
                        onClick={() => setLearnTable(n)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                          learnTable === n ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="p-0 bg-white">
                    <div className="bg-indigo-600 p-6 text-white text-center">
                      <h3 className="text-2xl font-bold">Resumen Tabla del {learnTable}</h3>
                    </div>
                    <div className="p-6 space-y-2">
                      {[1,2,3,4,5,6,7,8,9,10].map(i => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group border-b border-slate-50 last:border-0">
                          <span className="text-xl font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                            {learnTable} × {i}
                          </span>
                          <span className="text-2xl font-black text-slate-900">= {learnTable * i}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Lightbulb className="text-amber-500" />
                      Tips de Aprendizaje
                    </h3>
                    {MULTIPLICATION_TIPS[learnTable].map((tip, idx) => (
                      <Card key={idx} className="p-6 bg-amber-50 border-amber-200">
                        <p className="text-amber-900 leading-relaxed font-medium">✨ {tip}</p>
                      </Card>
                    ))}
                    
                    <Card className="p-8 flex flex-col items-center justify-center text-center space-y-4 bg-emerald-50 border-emerald-100">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Trophy className="text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-emerald-900">¿Listo para probarte?</h4>
                        <p className="text-emerald-700 mt-1">Intenta un quiz solo de la tabla del {learnTable}.</p>
                      </div>
                      <Button 
                        variant="secondary" 
                        onClick={() => {
                          setSelectedTables([learnTable]);
                          setTimeout(startQuiz, 100);
                        }}
                        className="w-full mt-4"
                      >
                        Empezar Práctica
                      </Button>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}

            {mode === 'PROGRESS' && (
              <motion.div 
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <h2 className="text-3xl font-bold">Tu Nivel de Maestro</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                  {[1,2,3,4,5,6,7,8,9,10].map(t => {
                    const data = mastery[t];
                    const percent = data ? Math.round((data.correct / data.attempts) * 100) : 0;
                    return (
                      <Card key={t} className="p-6 flex flex-col items-center text-center relative overflow-hidden">
                        <span className="text-sm font-bold text-slate-400 mb-4 tracking-widest uppercase">Tabla {t}</span>
                        <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                            <circle 
                              cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                              strokeDasharray="251.2" 
                              strokeDashoffset={251.2 - (251.2 * percent) / 100}
                              className={`transition-all duration-1000 ${percent > 80 ? 'text-emerald-500' : percent > 40 ? 'text-amber-500' : 'text-slate-300'}`} 
                            />
                          </svg>
                          <span className="absolute text-xl font-black">{percent}%</span>
                        </div>
                        <p className="text-xs text-slate-400">{data ? `${data.attempts} intentos` : 'Sin datos'}</p>
                      </Card>
                    );
                  })}
                </div>

                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4">Metas por Alcanzar</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                      <div className={`p-2 rounded-lg ${history.length >= 5 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">Principiante Dedicado</p>
                        <p className="text-sm text-slate-500">Completa 5 sesiones de práctica ({history.length}/5)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                      <div className={`p-2 rounded-lg ${Object.values(mastery).filter((m: TableMastery) => (m.correct/m.attempts) >= 0.9).length >= 10 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">Gran Maestro 🌟</p>
                        <p className="text-sm text-slate-500">Domina todas las tablas al 90% ({Object.values(mastery).filter((m: TableMastery) => (m.correct/m.attempts) >= 0.9).length}/10)</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {mode === 'HISTORY' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold">Historial de Sesiones</h2>
                  <Button variant="outline" onClick={() => { saveHistory([]); setMastery({}); }} className="text-rose-500 border-rose-100 hover:bg-rose-50">Limpiar Todo</Button>
                </div>

                {history.length === 0 ? (
                  <Card className="p-20 flex flex-col items-center justify-center text-center text-slate-400">
                    <HistoryIcon size={64} className="mb-4 opacity-20" />
                    <p className="text-xl">No hay sesiones registradas todavía.</p>
                    <p className="mt-2">¡Haz tu primera práctica para ver tu progreso!</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {history.map((session) => (
                      <Card key={session.id} className="p-6 flex flex-col md:flex-row items-center gap-6 hover:border-indigo-200 transition-colors">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex flex-col items-center justify-center">
                          <span className="text-xs font-bold text-slate-400 uppercase">{new Date(session.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                          <span className="text-2xl font-black">{new Date(session.date).getDate()}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold">Práctica Mix: {session.tables.join(', ')}</h4>
                          <p className="text-slate-500 text-sm">Duración: {session.duration} segundos • {new Date(session.date).toLocaleTimeString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`px-4 py-2 rounded-xl text-lg font-bold ${(session.score/session.total) >= 0.8 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {session.score} / {session.total}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
