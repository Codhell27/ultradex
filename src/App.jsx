import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Menu, X, ChevronLeft, CheckSquare, Square, 
  Plus, Edit2, Trash2, FileText, ListTodo,
  Volume2, VolumeX, Book, Calendar, Minus
} from 'lucide-react';

// --- Utility Functions ---
const generateId = () => 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

const getTodayDateString = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

// --- Offline Web Audio API Sound System ---
const playClick = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.04);
    
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.04);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {
    console.log('Audio playback error:', e);
  }
};

const withSound = (fn) => (...args) => {
  playClick();
  if (fn) fn(...args);
};

// --- Initial Mock Data ---
const initialData = [
  {
    id: 'm1',
    title: 'The Crimson Crusade',
    type: 'story',
    deadline: '2026-11-20',
    xp: 5000, 
    subQuests: [
      {
        id: 'sq1',
        title: 'Infiltrate the Keep',
        yieldName: 'Fragment Yield',
        tasks: [
          { 
            id: 't1', 
            title: 'Bypass the outer wards', 
            completed: false,
            notes: 'The wards are tied to the lunar cycle. Approach from the eastern shadow.',
            checklist: [
              { id: 'cl1', text: 'Obtain the obsidian key', completed: true },
              { id: 'cl2', text: 'Memorize the dispelling chant', completed: false }
            ],
            trackers: [
              { id: 'tr1', label: 'Wards Disrupted', count: 1 }
            ]
          }
        ]
      }
    ]
  }
];

const initialGrimoireData = [
  {
    id: 'g1',
    date: getTodayDateString(),
    notes: 'The shadows grow longer today. The chronicle advances into uncharted territory...',
    checklist: [
      { id: 'gc1', text: 'Review ancient grimoire texts', completed: true }
    ],
    trackers: [
      { id: 'gtr1', label: 'Elixirs Consumed', count: 3 },
      { id: 'gtr2', label: 'Pages Studied', count: 42 }
    ]
  }
];

export default function UltraDexApp() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('ultradex_serious_gothic_audio_v4');
      return saved ? JSON.parse(saved) : initialData;
    } catch (e) {
      return initialData;
    }
  });

  const [grimoireData, setGrimoireData] = useState(() => {
    try {
      const saved = localStorage.getItem('ultradex_grimoire_v1');
      return saved ? JSON.parse(saved) : initialGrimoireData;
    } catch (e) {
      return initialGrimoireData;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ultradex_serious_gothic_audio_v4', JSON.stringify(data));
    } catch (e) {}
  }, [data]);

  useEffect(() => {
    try {
      localStorage.setItem('ultradex_grimoire_v1', JSON.stringify(grimoireData));
    } catch (e) {}
  }, [grimoireData]);

  const [currentView, setCurrentView] = useState('missions');
  const [selectedMissionId, setSelectedMissionId] = useState(null);
  const [selectedSubQuestId, setSelectedSubQuestId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedGrimoireId, setSelectedGrimoireId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isMuted, setIsMuted] = useState(true);
  const ambientCtxRef = useRef(null);
  const ambientNodesRef = useRef(null);

  useEffect(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      if (!isMuted) {
        if (!ambientCtxRef.current) {
          ambientCtxRef.current = new AudioContext();
        }
        const ctx = ambientCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(55, ctx.currentTime);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(82.41, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, ctx.currentTime);

        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 3);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        ambientNodesRef.current = { osc1, osc2, gain, ctx };
      } else {
        if (ambientNodesRef.current) {
          const { osc1, osc2, gain, ctx } = ambientNodesRef.current;
          try {
            gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1);
            setTimeout(() => {
              osc1.stop();
              osc2.stop();
            }, 1000);
          } catch(e) {}
          ambientNodesRef.current = null;
        }
      }
    } catch (e) {
      console.log('Ambient audio error:', e);
    }
  }, [isMuted]);

  const particles = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 4 + 2}px`,
      fallDuration: `${Math.random() * 10 + 15}s`,
      swayDuration: `${Math.random() * 4 + 3}s`,
      delay: `${Math.random() * -20}s`,
      opacity: Math.random() * 0.5 + 0.3
    }));
  }, []);

  const getSubQuestStats = (mission, subQuest) => {
    if (!mission || !subQuest) return { totalXp: 0, earnedXp: 0, isCompleted: false, taskXp: 0 };
    
    const numSubQuests = mission.subQuests.length || 1;
    const subQuestXp = Math.floor((Number(mission.xp) || 0) / numSubQuests);
    
    const numTasks = subQuest.tasks.length;
    const taskXp = numTasks > 0 ? Math.floor(subQuestXp / numTasks) : 0;
    
    let earnedXp = 0;
    let isCompleted = numTasks > 0;

    subQuest.tasks.forEach(t => {
      if (t.completed) earnedXp += taskXp;
      else isCompleted = false;
    });

    if (isCompleted && numTasks > 0) earnedXp = subQuestXp;

    return { totalXp: subQuestXp, earnedXp, isCompleted, taskXp };
  };

  const getMissionStats = (mission) => {
    if (!mission) return { totalXp: 0, earnedXp: 0, isCompleted: false };
    
    const totalXp = Number(mission.xp) || 0;
    let earnedXp = 0;
    let isCompleted = mission.subQuests.length > 0;
    
    mission.subQuests.forEach(sq => {
      const stats = getSubQuestStats(mission, sq);
      earnedXp += stats.earnedXp;
      if (!stats.isCompleted) isCompleted = false;
    });

    if (isCompleted && mission.subQuests.length > 0) earnedXp = totalXp; 

    return { totalXp, earnedXp, isCompleted };
  };

  const addMission = (type) => {
    const newMission = { id: generateId(), title: 'New Covenant', type, deadline: '', xp: 1000, subQuests: [] };
    setData([...data, newMission]);
    setSelectedMissionId(newMission.id);
    setCurrentView('subquests');
  };
  const updateMission = (id, updates) => setData(data.map(m => m.id === id ? { ...m, ...updates } : m));
  const deleteMission = (id) => {
    setData(data.filter(m => m.id !== id));
    setCurrentView('missions');
  };

  const addSubQuest = (missionId) => {
    const newSubQuest = { id: generateId(), title: 'New Objective', yieldName: 'Fragment Yield', tasks: [] };
    setData(data.map(m => m.id === missionId ? { ...m, subQuests: [...m.subQuests, newSubQuest] } : m));
    setSelectedSubQuestId(newSubQuest.id);
    setCurrentView('tasks');
  };
  const updateSubQuest = (missionId, subQuestId, updates) => {
    setData(data.map(m => m.id === missionId ? {
      ...m, subQuests: m.subQuests.map(sq => sq.id === subQuestId ? { ...sq, ...updates } : sq)
    } : m));
  };
  const deleteSubQuest = (missionId, subQuestId) => {
    setData(data.map(m => m.id === missionId ? {
      ...m, subQuests: m.subQuests.filter(sq => sq.id !== subQuestId)
    } : m));
    setCurrentView('subquests');
  };

  const addTask = (missionId, subQuestId) => {
    const newTask = { id: generateId(), title: 'Execute directive', completed: false, notes: '', checklist: [], trackers: [] };
    setData(data.map(m => m.id === missionId ? {
      ...m, subQuests: m.subQuests.map(sq => sq.id === subQuestId ? { ...sq, tasks: [...sq.tasks, newTask] } : sq)
    } : m));
  };
  const updateTask = (missionId, subQuestId, taskId, updates) => {
    setData(data.map(m => m.id === missionId ? {
      ...m, subQuests: m.subQuests.map(sq => sq.id === subQuestId ? {
        ...sq, tasks: sq.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
      } : sq)
    } : m));
  };
  const deleteTask = (missionId, subQuestId, taskId) => {
    setData(data.map(m => m.id === missionId ? {
      ...m, subQuests: m.subQuests.map(sq => sq.id === subQuestId ? {
        ...sq, tasks: sq.tasks.filter(t => t.id !== taskId)
      } : sq)
    } : m));
  };
  const toggleTask = (missionId, subQuestId, taskId) => {
    setData(data.map(m => m.id === missionId ? {
      ...m, subQuests: m.subQuests.map(sq => sq.id === subQuestId ? {
        ...sq, tasks: sq.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
      } : sq)
    } : m));
  };

  const addChecklistItem = (missionId, subQuestId, taskId, text) => {
    const newItem = { id: generateId(), text, completed: false };
    setData(data.map(m => m.id === missionId ? {
      ...m, subQuests: m.subQuests.map(sq => sq.id === subQuestId ? {
        ...sq, tasks: sq.tasks.map(t => t.id === taskId ? { 
          ...t, checklist: [...(t.checklist || []), newItem] 
        } : t)
      } : sq)
    } : m));
  };
  const toggleChecklistItem = (missionId, subQuestId, taskId, checkId) => {
    setData(data.map(m => m.id === missionId ? {
      ...m, subQuests: m.subQuests.map(sq => sq.id === subQuestId ? {
        ...sq, tasks: sq.tasks.map(t => t.id === taskId ? {
          ...t, checklist: t.checklist.map(cl => cl.id === checkId ? { ...cl, completed: !cl.completed } : cl)
        } : t)
      } : sq)
    } : m));
  };
  const deleteChecklistItem = (missionId, subQuestId, taskId, checkId) => {
    setData(data.map(m => m.id === missionId ? {
      ...m, subQuests: m.subQuests.map(sq => sq.id === subQuestId ? {
        ...sq, tasks: sq.tasks.map(t => t.id === taskId ? {
          ...t, checklist: t.checklist.filter(cl => cl.id !== checkId)
        } : t)
      } : sq)
    } : m));
  };

  const addTaskTracker = (missionId, subQuestId, taskId, label) => {
    const newTracker = { id: generateId(), label, count: 0 };
    setData(data.map(m => m.id === missionId ? {
      ...m, subQuests: m.subQuests.map(sq => sq.id === subQuestId ? {
        ...sq, tasks: sq.tasks.map(t => t.id === taskId ? {
          ...t, trackers: [...(t.trackers || []), newTracker]
        } : t)
      } : sq)
    } : m));
  };
  const updateTaskTrackerCount = (missionId, subQuestId, taskId, trackerId, delta) => {
    setData(data.map(m => m.id === missionId ? {
      ...m, subQuests: m.subQuests.map(sq => sq.id === subQuestId ? {
        ...sq, tasks: sq.tasks.map(t => t.id === taskId ? {
          ...t, trackers: (t.trackers || []).map(tr => tr.id === trackerId ? { ...tr, count: Math.max(0, tr.count + delta) } : tr)
        } : t)
      } : sq)
    } : m));
  };
  const deleteTaskTracker = (missionId, subQuestId, taskId, trackerId) => {
    setData(data.map(m => m.id === missionId ? {
      ...m, subQuests: m.subQuests.map(sq => sq.id === subQuestId ? {
        ...sq, tasks: sq.tasks.map(t => t.id === taskId ? {
          ...t, trackers: (t.trackers || []).filter(tr => tr.id !== trackerId)
        } : t)
      } : sq)
    } : m));
  };

  const handleOpenGrimoireList = () => {
    setCurrentView('grimoire_list');
  };

  const handleOpenOrCreateTodayGrimoire = () => {
    const today = getTodayDateString();
    let existing = grimoireData.find(g => g.date === today);
    if (!existing) {
      existing = {
        id: generateId(),
        date: today,
        notes: '',
        checklist: [],
        trackers: []
      };
      setGrimoireData([existing, ...grimoireData]);
    }
    setSelectedGrimoireId(existing.id);
    setCurrentView('grimoire_entry');
  };

  const updateGrimoireEntry = (entryId, updates) => {
    setGrimoireData(grimoireData.map(g => g.id === entryId ? { ...g, ...updates } : g));
  };

  const addGrimoireTracker = (entryId, label) => {
    const newTr = { id: generateId(), label, count: 0 };
    setGrimoireData(grimoireData.map(g => g.id === entryId ? { ...g, trackers: [...(g.trackers || []), newTr] } : g));
  };

  const updateGrimoireTrackerCount = (entryId, trackerId, delta) => {
    setGrimoireData(grimoireData.map(g => g.id === entryId ? {
      ...g, trackers: (g.trackers || []).map(tr => tr.id === trackerId ? { ...tr, count: Math.max(0, tr.count + delta) } : tr)
    } : g));
  };

  const deleteGrimoireTracker = (entryId, trackerId) => {
    setGrimoireData(grimoireData.map(g => g.id === entryId ? {
      ...g, trackers: (g.trackers || []).filter(tr => tr.id !== trackerId)
    } : g));
  };

  const addGrimoireChecklist = (entryId, text) => {
    const newItem = { id: generateId(), text, completed: false };
    setGrimoireData(grimoireData.map(g => g.id === entryId ? { ...g, checklist: [...(g.checklist || []), newItem] } : g));
  };

  const toggleGrimoireChecklist = (entryId, checkId) => {
    setGrimoireData(grimoireData.map(g => g.id === entryId ? {
      ...g, checklist: (g.checklist || []).map(cl => cl.id === checkId ? { ...cl, completed: !cl.completed } : cl)
    } : g));
  };

  const deleteGrimoireChecklist = (entryId, checkId) => {
    setGrimoireData(grimoireData.map(g => g.id === entryId ? {
      ...g, checklist: (g.checklist || []).filter(cl => cl.id !== checkId)
    } : g));
  };

  const selectedMission = data.find(m => m.id === selectedMissionId);
  const selectedSubQuest = selectedMission?.subQuests.find(sq => sq.id === selectedSubQuestId);
  const selectedTask = selectedSubQuest?.tasks.find(t => t.id === selectedTaskId);
  const selectedGrimoire = grimoireData.find(g => g.id === selectedGrimoireId);

  useEffect(() => {
    if (currentView === 'subquests' && !selectedMission) setCurrentView('missions');
    if (currentView === 'tasks' && (!selectedMission || !selectedSubQuest)) setCurrentView('missions');
    if (currentView === 'notepad' && (!selectedMission || !selectedSubQuest || !selectedTask)) setCurrentView('missions');
    if (currentView === 'grimoire_entry' && !selectedGrimoire) setCurrentView('grimoire_list');
  }, [data, grimoireData, currentView, selectedMission, selectedSubQuest, selectedTask, selectedGrimoire]);

  const ProgressBar = ({ current, total }) => {
    const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
    return (
      <div className="w-full bg-[#050505] h-[3px] border border-[#222] overflow-hidden mt-2 rounded-sm shadow-inner relative">
        <div 
          className="h-full bg-gradient-to-r from-[#3a0000] via-[#7a0000] to-[#b30000] transition-all duration-700 ease-out shadow-[0_0_10px_#7a0000]" 
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#e4e4e7] to-transparent opacity-20"></div>
      </div>
    );
  };

  const Sidebar = () => (
    <>
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm transition-opacity"
          onClick={withSound(() => setIsSidebarOpen(false))}
        />
      )}
      <div className={`fixed top-0 left-0 h-full w-72 abyssal-slate border-r border-[#222] z-50 transform transition-transform duration-500 ease-in-out shadow-[5px_0_40px_rgba(0,0,0,0.9)] silver-border-right ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-10 pb-6 border-b border-[#222] relative z-10">
            <div>
              <h2 className="font-gothic text-3xl text-white tracking-wider flex items-center silver-gradient drop-shadow-md">
                ULTRADEX
              </h2>
              <span className="font-sans text-[#a1a1aa] text-[10px] font-semibold uppercase tracking-[0.3em] block mt-1 opacity-80">Offline OS</span>
            </div>
            <button onClick={withSound(() => setIsSidebarOpen(false))} className="text-[#888] hover:text-[#e4e4e7] transition-colors p-1 hover:bg-[#1a1a1a] rounded border border-transparent hover:border-[#a1a1aa]">
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
          
          <nav className="space-y-3 font-sans text-sm font-medium tracking-wide flex-1 relative z-10">
            <button 
              onClick={withSound(() => { setCurrentView('missions'); setIsSidebarOpen(false); })}
              className={`flex items-center justify-between w-full text-left px-4 py-3 transition-all group ${currentView === 'missions' ? 'bg-[#161616] text-[#e4e4e7] border-l-2 border-[#a1a1aa] shadow-inner' : 'bg-transparent text-[#777] border-l-2 border-transparent hover:bg-[#111] hover:text-[#e4e4e7] hover:border-[#555]'}`}
            >
              <div className="flex items-center">
                <FileText className={`mr-3 ${currentView === 'missions' ? 'text-[#a1a1aa]' : 'text-[#555] group-hover:text-[#a1a1aa]'}`} size={18} strokeWidth={1.5} />
                Chronicles
              </div>
              <span className="breathing-skull text-xl">☠️</span>
            </button>

            <button 
              onClick={withSound(() => { handleOpenGrimoireList(); setIsSidebarOpen(false); })}
              className={`flex items-center justify-between w-full text-left px-4 py-3 transition-all group ${currentView === 'grimoire_list' || currentView === 'grimoire_entry' ? 'bg-[#161616] text-[#e4e4e7] border-l-2 border-[#c5a059] shadow-inner' : 'bg-transparent text-[#777] border-l-2 border-transparent hover:bg-[#111] hover:text-[#e4e4e7] hover:border-[#c5a059]'}`}
            >
              <div className="flex items-center">
                <Book className={`mr-3 ${currentView === 'grimoire_list' || currentView === 'grimoire_entry' ? 'text-[#c5a059]' : 'text-[#555] group-hover:text-[#c5a059]'}`} size={18} strokeWidth={1.5} />
                Grimoire
              </div>
              <span className="text-[#c5a059] text-sm">⟡</span>
            </button>
          </nav>
          
          <div className="mt-auto relative z-10">
             <div className="mb-6 flex justify-center">
                <button 
                  onClick={withSound(() => setIsMuted(!isMuted))}
                  className="flex items-center justify-center space-x-2 text-[#777] hover:text-[#e4e4e7] text-xs font-sans tracking-widest uppercase py-2 px-4 border border-[#222] hover:border-[#a1a1aa] bg-[#0a0a0a] transition-all w-full"
                >
                  {isMuted ? <VolumeX size={16} strokeWidth={1.5}/> : <Volume2 size={16} strokeWidth={1.5}/>}
                  <span>{isMuted ? 'Ambient Muted' : 'Ambient Active'}</span>
                </button>
             </div>

             <div className="ornament-divider mb-4"></div>
             <div className="text-center opacity-40 text-[#a1a1aa] font-gothic text-xl space-x-2">
               <span>⟡</span> <span>✥</span> <span>⟡</span>
             </div>
          </div>
        </div>
      </div>
    </>
  );

  const TopBar = ({ title, showBack, onBack, subtitle }) => (
    <div className="flex items-center justify-between px-8 py-5 bg-[#050505]/95 backdrop-blur-xl border-b border-[#222] silver-border-bottom sticky top-0 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
      <div className="flex items-center w-full">
        {showBack ? (
          <button onClick={withSound(onBack)} className="mr-6 text-[#a1a1aa] hover:text-[#e4e4e7] transition-colors p-1.5 bg-[#0a0a0a] border border-[#333] hover:border-[#a1a1aa] rounded-sm group">
            <ChevronLeft size={22} strokeWidth={1.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
        ) : (
          <button onClick={withSound(() => setIsSidebarOpen(true))} className="mr-6 text-[#a1a1aa] hover:text-[#e4e4e7] transition-colors p-1.5 bg-[#0a0a0a] border border-[#333] hover:border-[#a1a1aa] rounded-sm">
            <Menu size={22} strokeWidth={1.5} />
          </button>
        )}
        <div className="flex flex-col justify-center flex-1">
          <h1 className="font-gothic tracking-widest text-2xl flex items-center">
            <span className="mr-3 opacity-70 text-lg silver-gradient">✥</span>
            <span className="silver-gradient">{title}</span>
            <span className="ml-4 breathing-skull text-xl flex items-center justify-center">☠️</span>
          </h1>
          {subtitle && <span className="font-sans text-[#a1a1aa] font-medium text-xs uppercase tracking-[0.2em] mt-1.5 truncate max-w-md opacity-80">{subtitle}</span>}
        </div>
      </div>
    </div>
  );

  const MissionsView = () => {
    const storyMissions = data.filter(m => m.type === 'story');
    const sideMissions = data.filter(m => m.type === 'side');

    const MissionCard = ({ mission }) => {
      const stats = getMissionStats(mission);
      return (
        <div 
          onClick={withSound(() => { setSelectedMissionId(mission.id); setCurrentView('subquests'); })}
          className="abyssal-slate p-6 mb-5 border border-[#222] cursor-pointer hover:border-[#7a0000] platinum-accent-hover transition-all duration-300 group shadow-[0_8px_20px_rgba(0,0,0,0.8)] relative ornament-corner"
        >
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-start flex-1 pr-4">
              <div className={`mt-0.5 mr-4 transition-colors ${stats.isCompleted ? 'text-[#a1a1aa]' : 'text-[#555] group-hover:text-[#7a0000]'}`}>
                {stats.isCompleted ? <CheckSquare size={22} strokeWidth={1.5} /> : <Square size={22} strokeWidth={1.5} />}
              </div>
              <div className="flex-1">
                <h3 className={`font-gothic text-xl tracking-wide ${stats.isCompleted ? 'text-[#777] line-through decoration-[#7a0000]' : 'text-[#f0f0f0] group-hover:text-[#e4e4e7] transition-colors'}`}>
                  {mission.title}
                </h3>
                {mission.deadline && (
                  <div className="text-[#a1a1aa] text-[11px] mt-2 font-sans flex items-center tracking-wider uppercase opacity-80">
                    <span className="text-[#666] mr-2">Due:</span> {mission.deadline}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="font-gothic text-lg text-[#a1a1aa] tracking-widest">
                {stats.totalXp} <span className="text-xs text-[#777]">XP</span>
              </span>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-[#1a1a1a] relative z-10">
            <div className="flex justify-between text-[10px] font-sans text-[#888] uppercase tracking-[0.2em] mb-2">
              <span>Fulfillment</span>
              <span className="text-[#a1a1aa]">{stats.earnedXp} / {stats.totalXp}</span>
            </div>
            <ProgressBar current={stats.earnedXp} total={stats.totalXp} />
          </div>
        </div>
      );
    };

    return (
      <div className="p-8 pb-24 max-w-4xl mx-auto w-full relative z-10">
        <div className="flex justify-between items-end mb-3 pb-3">
          <h2 className="font-gothic text-2xl text-[#e4e4e7] tracking-[0.15em] flex items-center drop-shadow-md">
             <span className="text-[#a1a1aa] mr-3 text-lg">⟡</span> Primary Edicts
          </h2>
          <button onClick={withSound(() => addMission('story'))} className="text-[#a1a1aa] hover:text-[#e4e4e7] border border-[#333] hover:border-[#a1a1aa] bg-[#050505] px-4 py-1.5 flex items-center text-xs font-sans tracking-widest uppercase transition-all shadow-md group">
            <Plus size={14} strokeWidth={1.5} className="mr-2"/> Decree
          </button>
        </div>
        <div className="ornament-divider mb-6"></div>
        {storyMissions.length === 0 ? <div className="text-center text-[#555] font-sans text-sm p-8 border border-[#222] abyssal-slate ornament-corner">The ledger is empty.</div> : storyMissions.map(m => <MissionCard key={m.id} mission={m} />)}
        
        <div className="flex justify-between items-end mt-16 mb-3 pb-3">
          <h2 className="font-gothic text-2xl text-[#e4e4e7] tracking-[0.15em] flex items-center drop-shadow-md">
             <span className="text-[#a1a1aa] mr-3 text-lg">⟡</span> Secondary Pacts
          </h2>
          <button onClick={withSound(() => addMission('side'))} className="text-[#a1a1aa] hover:text-[#e4e4e7] border border-[#333] hover:border-[#a1a1aa] bg-[#050505] px-4 py-1.5 flex items-center text-xs font-sans tracking-widest uppercase transition-all shadow-md group">
            <Plus size={14} strokeWidth={1.5} className="mr-2"/> Decree
          </button>
        </div>
        <div className="ornament-divider mb-6"></div>
        {sideMissions.length === 0 ? <div className="text-center text-[#555] font-sans text-sm p-8 border border-[#222] abyssal-slate ornament-corner">No ancillary tasks.</div> : sideMissions.map(m => <MissionCard key={m.id} mission={m} />)}
      </div>
    );
  };

  const SubQuestsView = () => {
    if (!selectedMission) return null;
    const stats = getMissionStats(selectedMission);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ 
      title: selectedMission.title, deadline: selectedMission.deadline || '', type: selectedMission.type, xp: selectedMission.xp
    });

    const handleSave = () => {
      updateMission(selectedMission.id, { ...editData, xp: Number(editData.xp) || 0 });
      setIsEditing(false);
    };

    return (
      <div className="p-8 pb-24 max-w-4xl mx-auto w-full relative z-10">
        <div className="mb-14 abyssal-slate p-8 border border-[#333] hover:border-[#444] transition-colors relative shadow-[0_15px_40px_rgba(0,0,0,0.9)] silver-border-full ornament-corner group">
          {!isEditing ? (
            <>
              <button onClick={withSound(() => setIsEditing(true))} className="absolute top-6 right-6 text-[#777] hover:text-[#e4e4e7] transition-colors p-2 bg-[#050505] border border-[#222]">
                <Edit2 size={18} strokeWidth={1.5} />
              </button>
              <h2 className="font-gothic text-3xl text-white mb-4 pr-12 leading-tight tracking-wide">
                {selectedMission.title}
              </h2>
              {selectedMission.deadline && <span className="text-[#a1a1aa] font-sans text-[11px] tracking-widest uppercase border border-[#333] bg-[#050505] px-3 py-1 inline-block mb-8"><span className="text-[#666] mr-2">Due:</span> {selectedMission.deadline}</span>}
              
              <div className="flex justify-between text-xs font-sans text-[#888] uppercase tracking-[0.2em] mb-3">
                <span>Soul Yield</span>
                <span className="text-[#a1a1aa] font-gothic tracking-widest">{stats.earnedXp} / {stats.totalXp}</span>
              </div>
              <ProgressBar current={stats.earnedXp} total={stats.totalXp} />
            </>
          ) : (
            <div className="space-y-6 font-sans text-sm">
              <div>
                <label className="text-[#a1a1aa] uppercase tracking-[0.2em] text-[10px] mb-2 block">Covenant Title</label>
                <input 
                  type="text" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})}
                  className="w-full bg-[#050505] text-[#f0f0f0] p-3 border border-[#444] focus:border-[#7a0000] outline-none font-gothic text-xl"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <label className="text-[#a1a1aa] uppercase tracking-[0.2em] text-[10px] mb-2 block">Deadline</label>
                  <input 
                    type="date" value={editData.deadline} onChange={(e) => setEditData({...editData, deadline: e.target.value})}
                    className="w-full bg-[#050505] text-[#f0f0f0] p-3 border border-[#444] focus:border-[#7a0000] outline-none [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
                <div className="w-full sm:w-1/3">
                  <label className="text-[#a1a1aa] uppercase tracking-[0.2em] text-[10px] mb-2 block">Total XP</label>
                  <input 
                    type="number" value={editData.xp} onChange={(e) => setEditData({...editData, xp: e.target.value})}
                    className="w-full bg-[#050505] text-[#a1a1aa] font-gothic text-xl p-3 border border-[#444] focus:border-[#7a0000] outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-between pt-6 mt-6 border-t border-[#222]">
                <button onClick={withSound(() => deleteMission(selectedMission.id))} className="text-[#777] hover:text-[#7a0000] flex items-center text-xs tracking-widest uppercase">
                  <Trash2 size={16} strokeWidth={1.5} className="mr-2"/> Eradicate
                </button>
                <button onClick={withSound(handleSave)} className="bg-[#050505] border border-[#444] hover:border-[#a1a1aa] text-[#a1a1aa] px-8 py-2 text-xs tracking-[0.2em] uppercase">
                  Inscribe
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-end mb-3 pb-3">
          <h3 className="font-gothic text-2xl text-[#e4e4e7] tracking-[0.15em] flex items-center">
             <span className="text-[#a1a1aa] mr-3 text-lg">✥</span> Fragments
          </h3>
          <button onClick={withSound(() => addSubQuest(selectedMission.id))} className="text-[#a1a1aa] hover:text-[#e4e4e7] border border-[#333] hover:border-[#a1a1aa] bg-[#050505] px-4 py-1.5 flex items-center text-xs font-sans tracking-widest uppercase transition-all shadow-md group">
            <Plus size={14} strokeWidth={1.5} className="mr-2"/> Forge
          </button>
        </div>
        <div className="ornament-divider mb-6"></div>

        {selectedMission.subQuests.length === 0 && (
          <div className="text-center text-[#555] font-sans text-sm p-8 border border-[#222] abyssal-slate ornament-corner">
            No fragments woven yet.
          </div>
        )}

        <div className="space-y-5">
          {selectedMission.subQuests.map(sq => {
            const sqStats = getSubQuestStats(selectedMission, sq);
            return (
              <div 
                key={sq.id} onClick={withSound(() => { setSelectedSubQuestId(sq.id); setCurrentView('tasks'); })}
                className="abyssal-slate p-5 border border-[#222] cursor-pointer hover:border-[#7a0000] platinum-accent-hover transition-all group relative overflow-hidden shadow-[0_5px_15px_rgba(0,0,0,0.6)] ornament-corner-subtle"
              >
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="flex items-start flex-1 pr-4">
                    <div className={`mr-4 transition-colors ${sqStats.isCompleted ? 'text-[#a1a1aa]' : 'text-[#444] group-hover:text-[#7a0000]'}`}>
                      {sqStats.isCompleted ? <CheckSquare size={20} strokeWidth={1.5} /> : <Square size={20} strokeWidth={1.5} />}
                    </div>
                    <span className={`font-gothic text-lg tracking-wide ${sqStats.isCompleted ? 'text-[#777] line-through decoration-[#7a0000]' : 'text-[#e0e0e0] group-hover:text-white'}`}>
                      {sq.title}
                    </span>
                  </div>
                  <span className="font-gothic text-sm text-[#a1a1aa] tracking-widest border border-[#333] bg-[#050505] px-3 py-1">
                    {sqStats.totalXp} XP
                  </span>
                </div>
                <div className="pl-9 pr-1 relative z-10">
                  <ProgressBar current={sqStats.earnedXp} total={sqStats.totalXp} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const TasksView = () => {
    if (!selectedMission || !selectedSubQuest) return null;
    const stats = getSubQuestStats(selectedMission, selectedSubQuest);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ 
      title: selectedSubQuest.title, 
      yieldName: selectedSubQuest.yieldName || 'Fragment Yield' 
    });

    const handleSave = () => {
      updateSubQuest(selectedMission.id, selectedSubQuest.id, { 
        title: editData.title, 
        yieldName: editData.yieldName.trim() || 'Fragment Yield' 
      });
      setIsEditing(false);
    };

    const TaskItem = ({ task }) => {
      const [isTaskEditing, setIsTaskEditing] = useState(false);
      const [taskEdit, setTaskEdit] = useState({ title: task.title });

      if (isTaskEditing) {
        return (
          <div className="p-5 border-b border-[#222] bg-[#1a1a1a] relative z-20 shadow-2xl mb-2">
             <div className="flex flex-col sm:flex-row gap-3 mb-4">
               <input 
                 type="text" value={taskEdit.title} onChange={(e) => setTaskEdit({...taskEdit, title: e.target.value})}
                 className="flex-1 bg-[#050505] text-[#f0f0f0] font-sans text-sm p-3 border border-[#444] focus:border-[#7a0000] outline-none"
                 autoFocus
               />
             </div>
             <div className="flex justify-between items-center">
                <button onClick={withSound(() => deleteTask(selectedMission.id, selectedSubQuest.id, task.id))} className="text-[#777] hover:text-[#7a0000] flex items-center text-xs tracking-widest uppercase">
                  <Trash2 size={14} strokeWidth={1.5} className="mr-2"/> Eradicate
                </button>
                <div className="space-x-3 flex">
                   <button onClick={withSound(() => setIsTaskEditing(false))} className="text-[#888] hover:text-white text-xs tracking-widest uppercase px-4 py-1.5">
                    Cancel
                  </button>
                  <button onClick={withSound(() => { updateTask(selectedMission.id, selectedSubQuest.id, task.id, { title: taskEdit.title }); setIsTaskEditing(false); })} className="bg-[#050505] border border-[#444] text-[#a1a1aa] px-6 py-1.5 text-xs tracking-[0.2em] uppercase">
                    Inscribe
                  </button>
                </div>
             </div>
          </div>
        );
      }

      return (
        <div className="flex items-stretch abyssal-slate border border-[#222] border-l-[3px] border-l-[#8a0303] hover:border-[#c5a059] transition-all duration-300 group min-h-[65px] relative z-10 mb-2 mx-2 mt-2 rounded-r-sm">
          <div 
            className="flex items-center justify-center pl-6 pr-4 cursor-pointer"
            onClick={withSound((e) => { e.stopPropagation(); toggleTask(selectedMission.id, selectedSubQuest.id, task.id); })}
          >
            <div className={`transition-colors ${task.completed ? 'text-[#a1a1aa]' : 'text-[#444] group-hover:text-[#c5a059]'}`}>
              {task.completed ? <CheckSquare size={20} strokeWidth={1.5} /> : <Square size={20} strokeWidth={1.5} />}
            </div>
          </div>
          <div 
            className="flex flex-1 items-center py-4 pr-6 cursor-pointer"
            onClick={withSound(() => { setSelectedTaskId(task.id); setCurrentView('notepad'); })}
          >
            <span className={`font-sans text-sm tracking-wide leading-relaxed ${task.completed ? 'text-[#777] line-through decoration-[#8a0303]' : 'text-[#ccc] group-hover:text-white'} transition-colors flex-1 pr-4`}>
              {task.title}
            </span>
            <div className="flex items-center space-x-4">
              <span className={`font-gothic text-xs tracking-widest ${task.completed ? 'text-[#a1a1aa]' : 'text-[#c5a059]'}`}>
                +{stats.taskXp}XP
              </span>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                <button 
                  onClick={withSound((e) => { e.stopPropagation(); setIsTaskEditing(true); })} 
                  className="text-[#555] hover:text-[#e4e4e7] transition-all p-1.5 border border-transparent hover:border-[#c5a059] bg-[#050505] rounded-sm"
                >
                  <Edit2 size={14} strokeWidth={1.5} />
                </button>
                <button 
                  onClick={withSound((e) => { e.stopPropagation(); deleteTask(selectedMission.id, selectedSubQuest.id, task.id); })} 
                  className="text-[#555] hover:text-[#8a0303] transition-all p-1.5 border border-transparent hover:border-[#8a0303] bg-[#050505] rounded-sm"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="p-8 pb-24 max-w-4xl mx-auto w-full relative z-10">
         <div className="mb-12 abyssal-slate p-8 border border-[#333] relative shadow-[0_15px_40px_rgba(0,0,0,0.9)] silver-border-full ornament-corner">
          {!isEditing ? (
            <>
              <button onClick={withSound(() => setIsEditing(true))} className="absolute top-6 right-6 text-[#777] hover:text-[#e4e4e7] transition-colors p-2 bg-[#050505] border border-[#222]">
                <Edit2 size={18} strokeWidth={1.5} />
              </button>
              <h2 className="font-gothic text-2xl text-white mb-2 pr-12 leading-snug">{selectedSubQuest.title}</h2>
              <p className="text-[#a1a1aa] font-sans text-xs tracking-wider uppercase mb-8 opacity-80"><span className="text-[#666]">Vessel:</span> {selectedMission.title}</p>
              
              <div className="flex justify-between text-xs font-sans text-[#888] uppercase tracking-[0.2em] mb-3">
                <span>{selectedSubQuest.yieldName || 'Fragment Yield'}</span>
                <span className="text-[#a1a1aa] font-gothic tracking-widest">{stats.earnedXp} / {stats.totalXp}</span>
              </div>
              <ProgressBar current={stats.earnedXp} total={stats.totalXp} />
            </>
          ) : (
            <div className="space-y-6 font-sans text-sm">
              <div>
                <label className="text-[#a1a1aa] uppercase tracking-[0.2em] text-[10px] mb-2 block">Fragment Title</label>
                <input 
                  type="text" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})}
                  className="w-full bg-[#050505] text-[#f0f0f0] p-3 border border-[#444] font-gothic text-xl"
                />
              </div>
              <div>
                <label className="text-[#a1a1aa] uppercase tracking-[0.2em] text-[10px] mb-2 block">Yield Label Name</label>
                <input 
                  type="text" value={editData.yieldName} onChange={(e) => setEditData({...editData, yieldName: e.target.value})}
                  className="w-full bg-[#050505] text-[#f0f0f0] p-3 border border-[#444] font-sans text-sm"
                />
              </div>
              <div className="flex justify-between pt-6 mt-6 border-t border-[#222]">
                <button onClick={withSound(() => deleteSubQuest(selectedMission.id, selectedSubQuest.id))} className="text-[#777] hover:text-[#7a0000] flex items-center text-xs tracking-widest uppercase">
                  <Trash2 size={16} strokeWidth={1.5} className="mr-2"/> Eradicate
                </button>
                <button onClick={withSound(handleSave)} className="bg-[#050505] border border-[#444] text-[#a1a1aa] px-8 py-2 text-xs tracking-[0.2em] uppercase">
                  Inscribe
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-end mb-3 pb-3">
          <h3 className="font-gothic text-2xl text-[#e4e4e7] tracking-[0.15em] flex items-center">
             <span className="text-[#a1a1aa] mr-3 text-lg">✥</span> Directives
          </h3>
          <button onClick={withSound(() => addTask(selectedMission.id, selectedSubQuest.id))} className="text-[#a1a1aa] hover:text-[#e4e4e7] border border-[#333] hover:border-[#a1a1aa] bg-[#050505] px-4 py-1.5 flex items-center text-xs font-sans tracking-widest uppercase shadow-md group">
            <Plus size={14} strokeWidth={1.5} className="mr-2"/> Appoint
          </button>
        </div>
        <div className="ornament-divider mb-6"></div>

        <div className="border border-[#222] abyssal-slate shadow-[0_10px_30px_rgba(0,0,0,0.8)] ornament-corner-subtle pb-2 pt-2">
          {selectedSubQuest.tasks.length === 0 ? (
             <div className="p-8 text-center text-[#555] font-sans text-sm">No directives assigned.</div>
          ) : (
            selectedSubQuest.tasks.map(task => <TaskItem key={task.id} task={task} />)
          )}
        </div>
      </div>
    );
  };

  const TaskNotepadView = () => {
    if (!selectedMission || !selectedSubQuest || !selectedTask) return null;
    
    const [noteText, setNoteText] = useState(selectedTask.notes || '');
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [newTrackerLabel, setNewTrackerLabel] = useState('');

    const handleNotesBlur = () => {
      updateTask(selectedMission.id, selectedSubQuest.id, selectedTask.id, { notes: noteText });
    };

    const handleAddChecklist = (e) => {
      e.preventDefault();
      if (!newChecklistItem.trim()) return;
      playClick();
      addChecklistItem(selectedMission.id, selectedSubQuest.id, selectedTask.id, newChecklistItem.trim());
      setNewChecklistItem('');
    };

    const handleAddTracker = (e) => {
      e.preventDefault();
      if (!newTrackerLabel.trim()) return;
      playClick();
      addTaskTracker(selectedMission.id, selectedSubQuest.id, selectedTask.id, newTrackerLabel.trim());
      setNewTrackerLabel('');
    };

    return (
      <div className="p-8 pb-24 max-w-4xl mx-auto w-full font-sans relative z-10">
        <div className="mb-2 pb-6">
          <h2 className="text-3xl font-gothic tracking-wide text-white mb-4 leading-tight">{selectedTask.title}</h2>
          <div className="flex items-center text-[10px] font-semibold tracking-[0.2em] uppercase text-[#888]">
            <span className={`${selectedTask.completed ? 'text-[#a1a1aa] border-[#a1a1aa]' : 'text-[#666] border-[#333]'} mr-4 border px-2 py-1 bg-[#050505]`}>
               State: {selectedTask.completed ? 'Fulfilled' : 'Pending'}
            </span>
            <span className="opacity-80 text-[#a1a1aa]">Fragment: {selectedSubQuest.title}</span>
          </div>
        </div>
        <div className="ornament-divider mb-10"></div>

        <div className="mb-10">
          <label className="flex items-center text-xs text-[#c5a059] tracking-[0.2em] uppercase mb-4 font-gothic">
             <Book size={16} strokeWidth={1.5} className="mr-3 text-[#c5a059]" /> Numerology (Task Trackers)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {(selectedTask.trackers || []).length === 0 ? (
              <div className="col-span-full p-6 text-center text-[#555] text-sm abyssal-slate border border-[#333]">No count trackers active for this directive.</div>
            ) : (
              (selectedTask.trackers || []).map(tr => (
                <div key={tr.id} className="abyssal-slate p-4 border border-[#333] flex items-center justify-between ornament-corner-subtle">
                  <div>
                    <span className="text-xs text-[#a1a1aa] font-sans tracking-widest uppercase block mb-1">{tr.label}</span>
                    <span className="font-gothic text-2xl text-white tracking-widest">{tr.count}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={withSound(() => updateTaskTrackerCount(selectedMission.id, selectedSubQuest.id, selectedTask.id, tr.id, -1))} className="w-8 h-8 flex items-center justify-center bg-[#050505] border border-[#444] text-[#a1a1aa]">
                      <Minus size={14} strokeWidth={1.5}/>
                    </button>
                    <button onClick={withSound(() => updateTaskTrackerCount(selectedMission.id, selectedSubQuest.id, selectedTask.id, tr.id, 1))} className="w-8 h-8 flex items-center justify-center bg-[#050505] border border-[#444] text-[#a1a1aa]">
                      <Plus size={14} strokeWidth={1.5}/>
                    </button>
                    <button onClick={withSound(() => deleteTaskTracker(selectedMission.id, selectedSubQuest.id, selectedTask.id, tr.id))} className="w-8 h-8 flex items-center justify-center text-[#555] hover:text-[#7a0000] ml-1">
                      <Trash2 size={14} strokeWidth={1.5}/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleAddTracker} className="flex gap-3">
            <input 
              type="text" value={newTrackerLabel} onChange={(e) => setNewTrackerLabel(e.target.value)}
              placeholder="Designate new metric label..."
              className="flex-1 abyssal-slate text-[#ddd] text-sm p-3 border border-[#333] focus:border-[#c5a059] outline-none"
            />
            <button type="submit" disabled={!newTrackerLabel.trim()} className="bg-[#050505] text-[#c5a059] border border-[#444] px-6 py-3 text-xs tracking-[0.2em] uppercase disabled:opacity-50">
              Track
            </button>
          </form>
        </div>

        <div className="mb-10">
          <label className="flex items-center text-xs text-[#a1a1aa] tracking-[0.2em] uppercase mb-4">
             <FileText size={16} strokeWidth={1.5} className="mr-3 text-[#a1a1aa]" /> Inscriptions
          </label>
          <div className="ornament-corner-subtle">
            <textarea
              value={noteText} onChange={(e) => setNoteText(e.target.value)} onBlur={handleNotesBlur}
              placeholder="Etch your thoughts..."
              className="w-full min-h-[300px] abyssal-slate text-[#ddd] font-sans text-sm p-6 border border-[#333] focus:border-[#7a0000] outline-none resize-y leading-relaxed"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center text-xs text-[#a1a1aa] tracking-[0.2em] uppercase mb-4">
             <ListTodo size={16} strokeWidth={1.5} className="mr-3 text-[#a1a1aa]" /> Rites (Ancillary)
          </label>
          <div className="abyssal-slate border border-[#333] mb-6 shadow-md ornament-corner-subtle">
            {(selectedTask.checklist || []).length === 0 ? (
              <div className="p-6 text-center text-[#555] text-sm">No rites established.</div>
            ) : (
              (selectedTask.checklist || []).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border-b border-[#222] last:border-b-0 hover:bg-[#1a1a1a] group">
                  <div className="flex items-center flex-1 cursor-pointer" onClick={withSound(() => toggleChecklistItem(selectedMission.id, selectedSubQuest.id, selectedTask.id, item.id))}>
                     <div className={`mr-4 ${item.completed ? 'text-[#a1a1aa]' : 'text-[#444]'}`}>
                        {item.completed ? <CheckSquare size={18} strokeWidth={1.5} /> : <Square size={18} strokeWidth={1.5} />}
                     </div>
                     <span className={`text-sm tracking-wide ${item.completed ? 'text-[#777] line-through decoration-[#7a0000]' : 'text-[#ccc]'}`}>{item.text}</span>
                  </div>
                  <button onClick={withSound(() => deleteChecklistItem(selectedMission.id, selectedSubQuest.id, selectedTask.id, item.id))} className="text-[#555] hover:text-[#7a0000] opacity-0 group-hover:opacity-100 p-1">
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleAddChecklist} className="flex gap-3">
            <input 
              type="text" value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)}
              placeholder="Designate new rite..."
              className="flex-1 abyssal-slate text-[#ddd] text-sm p-4 border border-[#333] focus:border-[#7a0000] outline-none"
            />
            <button type="submit" disabled={!newChecklistItem.trim()} className="bg-[#050505] text-[#a1a1aa] border border-[#444] px-8 py-4 text-xs tracking-[0.2em] uppercase disabled:opacity-50">
              Add
            </button>
          </form>
        </div>
      </div>
    );
  };

  const GrimoireListView = () => {
    return (
      <div className="p-8 pb-24 max-w-4xl mx-auto w-full relative z-10">
        <div className="flex justify-between items-end mb-3 pb-3">
          <h2 className="font-gothic text-2xl text-[#e4e4e7] tracking-[0.15em] flex items-center drop-shadow-md">
             <span className="text-[#c5a059] mr-3 text-lg">⟡</span> Grimoire Archives
          </h2>
          <button onClick={withSound(handleOpenOrCreateTodayGrimoire)} className="text-[#c5a059] hover:text-white border border-[#c5a059]/40 hover:border-[#c5a059] bg-[#050505] px-4 py-1.5 flex items-center text-xs font-sans tracking-widest uppercase shadow-md group">
            <Plus size={14} strokeWidth={1.5} className="mr-2"/> Today's Log
          </button>
        </div>
        <div className="ornament-divider mb-6"></div>

        {grimoireData.length === 0 ? (
          <div className="text-center text-[#555] font-sans text-sm p-8 border border-[#222] abyssal-slate ornament-corner">
            No archives recorded in the Grimoire.
          </div>
        ) : (
          <div className="space-y-4">
            {grimoireData.map(entry => {
              const trackerCount = (entry.trackers || []).length;
              const checklistCount = (entry.checklist || []).length;
              return (
                <div 
                  key={entry.id} onClick={withSound(() => { setSelectedGrimoireId(entry.id); setCurrentView('grimoire_entry'); })}
                  className="abyssal-slate p-6 border border-[#222] cursor-pointer hover:border-[#c5a059] transition-all group relative ornament-corner flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4 min-w-0 flex-1 pr-4">
                    <div className="p-3 bg-[#050505] border border-[#333] text-[#c5a059]">
                      <Calendar size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-gothic text-xl text-[#f0f0f0] tracking-wide">{entry.date}</h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-xs font-sans tracking-widest uppercase text-[#a1a1aa]">
                    <span className="hidden sm:inline border border-[#333] px-3 py-1 bg-[#050505]">Trackers: {trackerCount}</span>
                    <span className="hidden sm:inline border border-[#333] px-3 py-1 bg-[#050505]">Rites: {checklistCount}</span>
                    <span className="font-gothic text-[#c5a059] text-sm">View ⟡</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const GrimoireEntryView = () => {
    if (!selectedGrimoire) return null;

    const [noteText, setNoteText] = useState(selectedGrimoire.notes || '');
    const [newTrackerLabel, setNewTrackerLabel] = useState('');
    const [newChecklistItem, setNewChecklistItem] = useState('');

    const handleNotesBlur = () => {
      updateGrimoireEntry(selectedGrimoire.id, { notes: noteText });
    };

    const handleAddTracker = (e) => {
      e.preventDefault();
      if (!newTrackerLabel.trim()) return;
      playClick();
      addGrimoireTracker(selectedGrimoire.id, newTrackerLabel.trim());
      setNewTrackerLabel('');
    };

    const handleAddChecklist = (e) => {
      e.preventDefault();
      if (!newChecklistItem.trim()) return;
      playClick();
      addGrimoireChecklist(selectedGrimoire.id, newChecklistItem.trim());
      setNewChecklistItem('');
    };

    return (
      <div className="p-8 pb-24 max-w-4xl mx-auto w-full font-sans relative z-10">
        <div className="mb-6 pb-6 border-b border-[#222] flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-gothic tracking-wide text-white mb-2 leading-tight">Archive Log: {selectedGrimoire.date}</h2>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#c5a059]">Daily Numerology & Chronology</span>
          </div>
          <button onClick={withSound(() => { setGrimoireData(grimoireData.filter(g => g.id !== selectedGrimoire.id)); setCurrentView('grimoire_list'); })} className="text-[#777] hover:text-[#7a0000] text-xs uppercase tracking-widest flex items-center">
            <Trash2 size={14} strokeWidth={1.5} className="mr-1.5"/> Eradicate Entry
          </button>
        </div>

        <div className="mb-12">
          <label className="flex items-center text-xs text-[#c5a059] tracking-[0.2em] uppercase mb-4 font-gothic">
             <Book size={16} strokeWidth={1.5} className="mr-3 text-[#c5a059]" /> Numerology (Daily Trackers)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {(selectedGrimoire.trackers || []).length === 0 ? (
              <div className="col-span-full p-6 text-center text-[#555] text-sm abyssal-slate border border-[#333]">No daily metrics active for this date.</div>
            ) : (
              (selectedGrimoire.trackers || []).map(tr => (
                <div key={tr.id} className="abyssal-slate p-4 border border-[#333] flex items-center justify-between ornament-corner-subtle">
                  <div>
                    <span className="text-xs text-[#a1a1aa] font-sans tracking-widest uppercase block mb-1">{tr.label}</span>
                    <span className="font-gothic text-2xl text-white tracking-widest">{tr.count}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={withSound(() => updateGrimoireTrackerCount(selectedGrimoire.id, tr.id, -1))} className="w-8 h-8 flex items-center justify-center bg-[#050505] border border-[#444] text-[#a1a1aa]">
                      <Minus size={14} strokeWidth={1.5}/>
                    </button>
                    <button onClick={withSound(() => updateGrimoireTrackerCount(selectedGrimoire.id, tr.id, 1))} className="w-8 h-8 flex items-center justify-center bg-[#050505] border border-[#444] text-[#a1a1aa]">
                      <Plus size={14} strokeWidth={1.5}/>
                    </button>
                    <button onClick={withSound(() => deleteGrimoireTracker(selectedGrimoire.id, tr.id))} className="w-8 h-8 flex items-center justify-center text-[#555] hover:text-[#7a0000] ml-1">
                      <Trash2 size={14} strokeWidth={1.5}/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleAddTracker} className="flex gap-3">
            <input 
              type="text" value={newTrackerLabel} onChange={(e) => setNewTrackerLabel(e.target.value)}
              placeholder="Designate new metric label..."
              className="flex-1 abyssal-slate text-[#ddd] text-sm p-3 border border-[#333] focus:border-[#c5a059] outline-none"
            />
            <button type="submit" disabled={!newTrackerLabel.trim()} className="bg-[#050505] text-[#c5a059] border border-[#444] px-6 py-3 text-xs tracking-[0.2em] uppercase disabled:opacity-50">
              Track
            </button>
          </form>
        </div>

        <div className="mb-12">
          <label className="flex items-center text-xs text-[#a1a1aa] tracking-[0.2em] uppercase mb-4">
             <FileText size={16} strokeWidth={1.5} className="mr-3 text-[#a1a1aa]" /> Chronicles (Daily Journal)
          </label>
          <div className="ornament-corner-subtle">
            <textarea
              value={noteText} onChange={(e) => setNoteText(e.target.value)} onBlur={handleNotesBlur}
              placeholder="Etch the day's chronicles..."
              className="w-full min-h-[250px] abyssal-slate text-[#ddd] font-sans text-sm p-6 border border-[#333] focus:border-[#c5a059] outline-none resize-y"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center text-xs text-[#a1a1aa] tracking-[0.2em] uppercase mb-4">
             <ListTodo size={16} strokeWidth={1.5} className="mr-3 text-[#a1a1aa]" /> Ancillary Rites (Checklist)
          </label>
          <div className="abyssal-slate border border-[#333] mb-6 shadow-md ornament-corner-subtle">
            {(selectedGrimoire.checklist || []).length === 0 ? (
              <div className="p-6 text-center text-[#555] text-sm">No rites established for this date.</div>
            ) : (
              (selectedGrimoire.checklist || []).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border-b border-[#222] last:border-b-0 hover:bg-[#1a1a1a] group">
                  <div className="flex items-center flex-1 cursor-pointer" onClick={withSound(() => toggleGrimoireChecklist(selectedGrimoire.id, item.id))}>
                     <div className={`mr-4 ${item.completed ? 'text-[#c5a059]' : 'text-[#444]'}`}>
                        {item.completed ? <CheckSquare size={18} strokeWidth={1.5} /> : <Square size={18} strokeWidth={1.5} />}
                     </div>
                     <span className={`text-sm tracking-wide ${item.completed ? 'text-[#777] line-through decoration-[#c5a059]' : 'text-[#ccc]'}`}>{item.text}</span>
                  </div>
                  <button onClick={withSound(() => deleteGrimoireChecklist(selectedGrimoire.id, item.id))} className="text-[#555] hover:text-[#7a0000] opacity-0 group-hover:opacity-100 p-1">
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleAddChecklist} className="flex gap-3">
            <input 
              type="text" value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)}
              placeholder="Designate new ancillary rite..."
              className="flex-1 abyssal-slate text-[#ddd] text-sm p-4 border border-[#333] focus:border-[#c5a059] outline-none"
            />
            <button type="submit" disabled={!newChecklistItem.trim()} className="bg-[#050505] text-[#c5a059] border border-[#444] px-8 py-4 text-xs tracking-[0.2em] uppercase disabled:opacity-50">
              Add
            </button>
          </form>
        </div>
      </div>
    );
  };

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');

    .font-gothic { font-family: 'Cinzel Decorative', serif; }
    .font-sans { font-family: 'Inter', sans-serif; }
    
    .abyssal-slate {
      background: linear-gradient(135deg, #1a1515 0%, #0a0a0a 100%);
      box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 5px 15px rgba(0,0,0,0.9);
    }
    
    .silver-gradient {
      background: linear-gradient(to right, #a1a1aa, #e4e4e7, #71717a, #f4f4f5, #52525b);
      -webkit-background-clip: text;
      color: transparent;
    }
    
    .ornament-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(161, 161, 170, 0.4), transparent);
      width: 100%;
    }
    
    .silver-border-bottom {
      border-bottom: 1px solid transparent;
      border-image: linear-gradient(to right, transparent, rgba(161,161,170,0.3), rgba(228,228,231,0.5), rgba(161,161,170,0.3), transparent) 1;
    }
    .silver-border-right {
      border-right: 1px solid transparent;
      border-image: linear-gradient(to bottom, transparent, rgba(161,161,170,0.2), rgba(228,228,231,0.4), rgba(161,161,170,0.2), transparent) 1;
    }
    .silver-border-full {
      border: 1px solid transparent;
      border-image: linear-gradient(45deg, #333, rgba(161,161,170,0.4), #a1a1aa, rgba(161,161,170,0.4), #333) 1;
    }

    .ornament-corner { position: relative; }
    .ornament-corner::before, .ornament-corner::after {
      content: ''; position: absolute; width: 20px; height: 20px; 
      border: 1px solid #a1a1aa; transition: all 0.4s ease; opacity: 0.6; pointer-events: none;
    }
    .ornament-corner::before { top: -3px; left: -3px; border-right: none; border-bottom: none; }
    .ornament-corner::after { bottom: -3px; right: -3px; border-left: none; border-top: none; }
    .ornament-corner:hover::before, .ornament-corner:hover::after { 
      width: 30px; height: 30px; border-color: #7a0000; opacity: 1; 
    }

    .ornament-corner-subtle { position: relative; }
    .ornament-corner-subtle::before, .ornament-corner-subtle::after {
      content: ''; position: absolute; width: 10px; height: 10px; 
      border: 1px solid #666; transition: all 0.3s ease; pointer-events: none;
    }
    .ornament-corner-subtle::before { top: 0; left: 0; border-right: none; border-bottom: none; }
    .ornament-corner-subtle::after { bottom: 0; right: 0; border-left: none; border-top: none; }

    @keyframes breathingSkull {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(197, 160, 89, 0.5)); }
      50% { transform: scale(1.12); filter: drop-shadow(0 0 15px rgba(197, 160, 89, 0.9)); }
    }
    .breathing-skull { display: inline-block; animation: breathingSkull 3.5s ease-in-out infinite; }

    @keyframes ash-fall {
      0% { transform: translateY(-10vh); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(110vh); opacity: 0; }
    }
    @keyframes ash-sway {
      0%, 100% { margin-left: 0px; }
      50% { margin-left: 60px; }
    }
    .particle {
      position: absolute;
      background: #2a2a2a; 
      filter: blur(1px); 
      border-radius: 50%;
      pointer-events: none;
      animation-name: ash-fall, ash-sway;
      animation-timing-function: linear, ease-in-out;
      animation-iteration-count: infinite, infinite;
      animation-direction: normal, alternate;
    }
  `;

  return (
    <div 
      className="min-h-screen text-[#e0e0e0] selection:bg-[#7a0000] selection:text-[#fff] flex flex-col w-full overflow-hidden relative bg-[#050505]"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 20%, rgba(35, 10, 10, 0.4) 0%, rgba(5, 5, 5, 0.95) 80%),
          linear-gradient(to bottom, #050505 0%, #110d0d 100%)
        `,
        backgroundAttachment: 'fixed'
      }}
    >
      <style dangerouslySetInnerHTML={{__html: globalStyles}} />
      
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {particles.map(p => (
          <div 
            key={p.id} className="particle"
            style={{
              left: p.left, width: p.size, height: p.size,
              animationDuration: `${p.fallDuration}, ${p.swayDuration}`,
              animationDelay: `${p.delay}, ${p.delay}`, opacity: p.opacity
            }}
          />
        ))}
      </div>

      <Sidebar />
      
      {currentView === 'missions' && <TopBar title="UltraDex" showBack={false} subtitle="Offline Personal Ledger" />}
      {currentView === 'subquests' && <TopBar title="Covenant" showBack={true} onBack={() => setCurrentView('missions')} subtitle={selectedMission?.title} />}
      {currentView === 'tasks' && <TopBar title="Fragment" showBack={true} onBack={() => setCurrentView('subquests')} subtitle={selectedSubQuest?.title} />}
      {currentView === 'notepad' && <TopBar title="Inscriptions" showBack={true} onBack={() => setCurrentView('tasks')} subtitle={selectedTask?.title} />}
      {currentView === 'grimoire_list' && <TopBar title="Archives" showBack={false} subtitle="Grimoire Journal" />}
      {currentView === 'grimoire_entry' && <TopBar title="Grimoire" showBack={true} onBack={handleOpenGrimoireList} subtitle={selectedGrimoire?.date} />}

      <div className="flex-1 overflow-y-auto w-full relative z-10">
        <div className="relative z-10">
          {currentView === 'missions' && <MissionsView />}
          {currentView === 'subquests' && <SubQuestsView />}
          {currentView === 'tasks' && <TasksView />}
          {currentView === 'notepad' && <TaskNotepadView />}
          {currentView === 'grimoire_list' && <GrimoireListView />}
          {currentView === 'grimoire_entry' && <GrimoireEntryView />}
        </div>
      </div>
    </div>
  );
}
