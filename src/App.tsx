import { useState, useEffect, useRef, useCallback } from "react";

// --- CSS STYLE INJECTION ---
// Standard CSS containing web fonts, custom animations, scrollbar overrides
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@400;500;600;700;800&display=swap');

/* Scrollbar behaviors */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Base custom definitions */
body {
  background-color: #080808;
  color: #f0f0f0;
  font-family: 'Syne', sans-serif;
  overflow-x: hidden;
}

/* Custom micro animations */
@keyframes pulseOrb {
  0%, 100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 20px rgba(232, 66, 26, 0.4); }
  50% { transform: scale(1.06); opacity: 1; box-shadow: 0 0 40px rgba(232, 66, 26, 0.8); }
}
.pulsing-orb {
  animation: pulseOrb 2.5s infinite ease-in-out;
}

@keyframes blinking {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
}
.live-dot {
  animation: blinking 1.5s infinite;
}

@keyframes slideInNext {
  from { transform: translateX(40px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideInPrev {
  from { transform: translateX(-40px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.slide-next {
  animation: slideInNext 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.slide-prev {
  animation: slideInPrev 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
}
.confetti-dot {
  position: absolute;
  top: -20px;
  animation: fall 5s linear forwards;
}
`;

// --- DATA CONSTANTS ---
const RANKS = [
  { level: 1, name: "INITIATE", xpNeeded: 0, color: "#555555", badge: "🔘" },
  { level: 2, name: "FOCUS BUILDER", xpNeeded: 500, color: "#8b7355", badge: "🟤" },
  { level: 3, name: "CONSISTENT OPERATOR", xpNeeded: 1500, color: "#4a9eff", badge: "🔵" },
  { level: 4, name: "DEEP WORKER", xpNeeded: 3500, color: "#9b59b6", badge: "🟣" },
  { level: 5, name: "MONK MODE ELITE", xpNeeded: 7500, color: "#E8421A", badge: "🔴" },
  { level: 6, name: "DISCIPLINE MASTER", xpNeeded: 15000, color: "#C9952A", badge: "🟡" },
];

const CATEGORIES = [
  { id: "CODING", icon: "💻" },
  { id: "WRITING", icon: "✍️" },
  { id: "STUDY", icon: "📚" },
  { id: "RESEARCH", icon: "🔬" },
  { id: "PLANNING", icon: "🗂️" },
  { id: "MEDITATION", icon: "🧘" },
  { id: "CREATIVE", icon: "🎨" },
  { id: "ADMIN", icon: "📋" },
];

const DURATIONS = [15, 25, 45, 50, 60, 90, 120];

const AI_INSIGHTS = [
  "Your cognitive output peaks between 9:00 AM and 11:00 AM. Block off tomorrow morning for Deep Work.",
  "Consistency beats intensity. 3 sessions per day compounds faster than one 5-hour marathon.",
  "Your average session is running short. Extend by 10 minutes each week to push into deeper flow states.",
  "Front-load your hardest task in the first 10 minutes. The brain is sharpest before decision fatigue.",
  "Batch similar tasks. Context switching costs 23 minutes of recovery time. Protect your focus blocks.",
  "Your evening window is underutilised. A 45-minute session at 8 PM can close the day with intent.",
];

const AVATARS = ["🦁", "🐺", "🦅", "🐉", "🦊", "🌙", "⚡", "🔥", "🎯", "💎", "🧠", "🏔", "🎭", "⚔️", "🌊", "👁️"];

const ACHIEVEMENTS_TEMPLATE = [
  { id: "monk_initiate", name: "Monk Initiate", desc: "Complete 5 sessions", icon: "⬡" },
  { id: "deep_diver", name: "Deep Diver", desc: "Complete a 90m+ session", icon: "◈" },
  { id: "unbreakable", name: "Unbreakable", desc: "Reach a 7 day streak", icon: "◆" },
  { id: "flow_master", name: "Flow Master", desc: "10h total deep work", icon: "◉" },
  { id: "iron_will", name: "Iron Will", desc: "Zero distractions in a session", icon: "▲" },
  { id: "dawn_operator", name: "Dawn Operator", desc: "Complete 5 sessions", icon: "◐" },
];

// --- MAIN WRAPPER COMPONENT ---
export default function App() {
  // Navigation phase state: null = Onboarding, object = MainApp
  const [profile, setProfile] = useState<any>(() => {
    const saved = localStorage.getItem("monk_mode_profile");
    return saved ? JSON.parse(saved) : null;
  });

  // Track global app tracking stats
  const [appState, setAppState] = useState<any>(() => {
    const saved = localStorage.getItem("monk_mode_state");
    return saved ? JSON.parse(saved) : {
      xp: 0,
      streak: 0,
      deepWorkHours: 0,
      focusScore: 50,
      totalMins: 0,
      sessions: [],
      achievements: ACHIEVEMENTS_TEMPLATE.map(a => ({ ...a, unlocked: false, unlockDate: "" })),
      weeklyData: [45, 120, 0, 85, 200, 155, 90], // Mon-Sun mins
      insightIdx: 0
    };
  });

  // Persist State Changes
  useEffect(() => {
    if (profile) {
      localStorage.setItem("monk_mode_profile", JSON.stringify(profile));
    } else {
      localStorage.removeItem("monk_mode_profile");
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("monk_mode_state", JSON.stringify(appState));
  }, [appState]);

  // Handle Log Out
  const handleLogOut = () => {
    setProfile(null);
    setAppState({
      xp: 0,
      streak: 0,
      deepWorkHours: 0,
      focusScore: 50,
      totalMins: 0,
      sessions: [],
      achievements: ACHIEVEMENTS_TEMPLATE.map(a => ({ ...a, unlocked: false, unlockDate: "" })),
      weeklyData: [45, 120, 0, 85, 200, 155, 90],
      insightIdx: 0
    });
    localStorage.removeItem("monk_mode_profile");
    localStorage.removeItem("monk_mode_state");
  };

  return (
    <div id="monkmode-root" className="min-h-screen bg-[#080808] text-[#f0f0f0] flex flex-col items-center">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {!profile ? (
        <Onboarding onDone={(p: any) => setProfile(p)} />
      ) : (
        <MainApp profile={profile} appState={appState} setAppState={setAppState} onLogOut={handleLogOut} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// ONBOARDING MODULE (PHASE 1)
// ═══════════════════════════════════════
function Onboarding({ onDone }: { onDone: (profile: any) => void }) {
  const [step, setStep] = useState(0); // 0=Splash, 1=Welcome, 2=Name, 3=Type, 4=Goals, 5=Commitment, 6=Pref, 7=Persona, 8=Sec, 9=Routine, 10=Review, 11=Celebration
  const [slideDir, setSlideDir] = useState<"next" | "prev">("next");

  // Onboarding variables
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [userType, setUserType] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [commitment, setCommitment] = useState("");
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("UTC-5 (EST) / New York");
  const [darkMode, setDarkMode] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [avatar, setAvatar] = useState("🦁");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [biometricLock, setBiometricLock] = useState(false);
  const [pinCode, setPinCode] = useState(false);
  const [wakeTime, setWakeTime] = useState("06:00");
  const [workStartTime, setWorkStartTime] = useState("08:00");
  const [workEndTime, setWorkEndTime] = useState("17:00");
  const [dailyTarget, setDailyTarget] = useState(4);
  const [notifications, setNotifications] = useState({
    dailyReminder: true,
    streakProtection: true,
    weeklyReport: true,
    coachInsights: true,
  });

  // Auto advance Splash Screen (Step 0) after 2.2 seconds
  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => {
        setSlideDir("next");
        setStep(1);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Validation functions
  const isUsernameValid = (val: string) => /^[a-zA-Z0-9]*$/.test(val);
  const isEmailValid = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  // Password evaluator
  const evalPasswordConditions = (pass: string) => {
    const conds = [
      pass.length >= 8,
      pass.length >= 12,
      /[A-Z]/.test(pass),
      /[0-9]/.test(pass),
      /[!@#$%^&*(),.?":{}|<>]/.test(pass),
    ];
    return conds.filter(Boolean).length;
  };

  const passStrength = evalPasswordConditions(password);
  const strengthLabels = ["WEAK", "WEAK", "FAIR", "GOOD", "STRONG", "ELITE"];
  const strengthColors = ["#ff4444", "#ff4444", "#ff9900", "#C9952A", "#1DB954", "#1DB954"];

  // Toggle goal selection
  const handleToggleGoal = (g: string) => {
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  // Nav operators
  const nextStep = () => {
    setSlideDir("next");
    setStep((prev) => prev + 1);
  };
  const prevStep = () => {
    setSlideDir("prev");
    setStep((prev) => prev - 1);
  };
  const skipStep = () => {
    nextStep();
  };

  // Skip options check
  const isOptional = step === 6 || step === 7 || step === 9; // preferences, avatar, routine

  // Requirements checks for Next state
  const isNextDisabled = () => {
    if (step === 2) return firstName.length < 2 || !isUsernameValid(username);
    if (step === 3) return !userType;
    if (step === 4) return goals.length === 0;
    if (step === 5) return !commitment;
    if (step === 8) return !isEmailValid(email) || password.length < 8;
    return false;
  };

  // Onboarding Confirmation Finished
  const finalOnboardSubmit = () => {
    const operatorId = "FRG-" + Math.random().toString(36).substr(2, 8).toUpperCase();
    const finalProfile = {
      firstName,
      lastName,
      username: username || "operator_" + Math.random().toString(36).substr(2, 4),
      userType,
      goals,
      commitment,
      language,
      timezone,
      darkMode,
      hapticFeedback,
      reduceMotion,
      avatar,
      bio,
      email,
      wakeTime,
      workStartTime,
      workEndTime,
      dailyTarget,
      notifications,
      operatorId,
    };
    onDone(finalProfile);
  };

  // Calculate onboarding progress%
  const activePromptStepCount = step >= 2 && step <= 10 ? step - 1 : 0;
  const progressPercent = Math.min(100, Math.round((activePromptStepCount / 9) * 100));

  // --- Step Content Renderers ---
  return (
    <div id="onboarding-viewport" className="w-full max-w-lg min-h-screen flex flex-col justify-between px-6 py-8 relative overflow-hidden bg-[#080808]">
      
      {/* Top Header Navigation Panel for Active Inputs */}
      {step >= 2 && step <= 10 && (
        <div id="onboarding-header-nav" className="w-full flex flex-col gap-4">
          <div className="flex justify-between items-center text-xs text-[#aaaaaa]">
            <span className="font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              SYSTEM CONFIG // STEP {activePromptStepCount < 10 ? "0" + activePromptStepCount : activePromptStepCount}<span>/09</span>
            </span>
            {isOptional && (
              <button
                id="btn-skip-onboarding-step"
                onClick={skipStep}
                className="text-[#E8421A] hover:opacity-8 hover-transition font-medium cursor-pointer"
              >
                SKIP ⟶
              </button>
            )}
          </div>
          {/* Progress Indicator Track */}
          <div className="w-full h-[3px] bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="bg-[#E8421A] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Dot Tracker List */}
          <div className="flex justify-center gap-1.5 mt-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activePromptStepCount === i + 1 ? "w-5 bg-[#E8421A]" : "w-1.5 bg-[#222222]"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Core Slider Space */}
      <div className={`flex-1 flex flex-col justify-center my-6 ${slideDir === "next" ? "slide-next" : "slide-prev"}`}>
        
        {/* Splash View (0) */}
        {step === 0 && (
          <div id="splash-screen-operator" className="flex flex-col items-center justify-center text-center gap-6 py-12">
            <div className="w-24 h-24 bg-[#E8421A20] rounded-full flex items-center justify-center border-2 border-[#E8421A] pulsing-orb">
              <svg viewBox="0 0 24 24" width="40" height="40" stroke="#E8421A" strokeWidth="2.5" fill="none">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2v20M2 12h20" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </div>
            <div className="flex flex-col gap-1 mt-4">
              <h1 className="text-4xl font-extrabold tracking-wider" style={{ fontFamily: "'Syne', sans-serif" }}>
                MONK<span className="text-[#E8421A]">MODE</span>
              </h1>
              <p className="text-sm tracking-[0.2em] font-mono text-[#aaaaaa]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                "Focus is an identity"
              </p>
            </div>
            <div className="w-48 h-[3px] bg-[#111] rounded-full mt-8 overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full bg-[#E8421A] w-full animate-[loading_2.2s_ease-in-out_infinite]" />
            </div>
            <div className="text-[10px] text-[#555555] tracking-widest font-mono mt-12" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              V3.0 · OPERATOR BUILD
            </div>
          </div>
        )}

        {/* Welcome View (1) */}
        {step === 1 && (
          <div id="welcome-screen-operator" className="flex flex-col justify-center gap-6 text-left py-6">
            <div className="self-start flex items-center gap-2 bg-[#141414] border border-[#222222] px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#E8421A] live-dot" />
              <span className="text-[10px] tracking-widest text-[#E8421A] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                NEW OPERATOR PROTOCOL
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight leading-none text-white my-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              Welcome to<br />MonkMode.
            </h1>
            <p className="text-[#aaaaaa] text-base leading-relaxed">
              The focus operating system for operators who build elite discipline, protect attention, and perform at their peak every single day.
            </p>
            <div className="flex flex-col gap-3 mt-8">
              <button
                id="btn-onboarding-start"
                onClick={nextStep}
                className="w-full bg-gradient-to-r from-[#E8421A] to-[#C9952A] text-white py-4 rounded-xl font-bold font-mono text-sm tracking-wider hover:opacity-95 shadow-[0_4px_20px_rgba(232,66,26,0.35)] transition-all cursor-pointer"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ⚡ GET STARTED — FREE
              </button>
              <button
                id="btn-sign-in-existing"
                onClick={nextStep}
                className="w-full bg-transparent border border-[#222222] text-[#f0f0f0] py-4 rounded-xl font-bold font-mono text-sm tracking-wider hover:bg-[#0f0f0f] transition-all cursor-pointer"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                SIGN IN TO EXISTING ACCOUNT
              </button>
            </div>
            <div className="text-[10px] text-[#555555] tracking-normal leading-relaxed text-center font-mono mt-8 font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              NO CREDIT CARD · FREE FOREVER BASE PLAN · PRIVATE BY DEFAULT
            </div>
          </div>
        )}

        {/* Step 1 -- Name Inputs (2) */}
        {step === 2 && (
          <div id="step-name" className="flex flex-col gap-5">
            <div>
              <span className="text-xs text-[#E8421A] font-mono tracking-widest uppercase block mb-1">
                01 // IDENTITY
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                What should we call you?
              </h2>
            </div>
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#aaaaaa] uppercase font-mono tracking-widest">
                  First Name <span className="text-[#E8421A]">*</span>
                </label>
                <input
                  id="onboard-first-name"
                  type="text"
                  placeholder="e.g. Marcus"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`bg-[#0f0f0f] border rounded-xl p-3.5 text-white text-base focus:outline-none focus:ring-1 focus:ring-[#E8421A] font-mono ${
                    firstName.length === 0 ? "border-[#222222]" : firstName.length >= 2 ? "border-[#1DB954]" : "border-[#ff4444]"
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#aaaaaa] uppercase font-mono tracking-widest">
                  Last Name
                </label>
                <input
                  id="onboard-last-name"
                  type="text"
                  placeholder="e.g. Aurelius"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-[#0f0f0f] border border-[#222222] rounded-xl p-3.5 text-white text-base focus:ring-1 focus:ring-[#E8421A] focus:outline-none font-mono"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#aaaaaa] uppercase font-mono tracking-widest">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-[#555555] font-mono font-bold">@</span>
                  <input
                    id="onboard-username"
                    type="text"
                    placeholder="marcus_focus"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`bg-[#0f0f0f] border rounded-xl p-3.5 pl-8 text-white text-base w-full focus:outline-none focus:ring-1 focus:ring-[#E8421A] font-mono ${
                      username.length === 0 ? "border-[#222222]" : isUsernameValid(username) ? "border-[#1DB954]" : "border-[#ff4444]"
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
                {!isUsernameValid(username) && (
                  <span className="text-xs text-[#ff4444] font-mono mt-0.5">Alphanumeric characters only.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 -- User Type Grid (3) */}
        {step === 3 && (
          <div id="step-user-type" className="flex flex-col gap-5">
            <div>
              <span className="text-xs text-[#E8421A] font-mono tracking-widest uppercase block mb-1">
                02 // PROFILE
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Who are you, Operator?
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { id: "Student", label: "Student 🎓", desc: "Studying & learning" },
                { id: "Professional", label: "Professional 💼", desc: "9-5 career focus" },
                { id: "Entrepreneur", label: "Entrepreneur 🚀", desc: "Building assets" },
                { id: "Creator", label: "Creator 🎨", desc: "Content & media" },
                { id: "Researcher", label: "Researcher 🔬", desc: "Deep thinking" },
                { id: "Other", label: "Other ✦", desc: "My own path" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setUserType(item.id)}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between h-[100px] transition-all cursor-pointer relative ${
                    userType === item.id
                      ? "border-[#E8421A] bg-[#E8421A10]"
                      : "border-[#222222] bg-[#0f0f0f] hover:border-[#2e2e2e]"
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-bold text-sm text-[#f0f0f0]">{item.label}</span>
                    {userType === item.id && (
                      <span className="text-[#1DB954] text-xs">●</span>
                    )}
                  </div>
                  <span className="text-xs text-[#aaaaaa] mt-0.5 leading-snug">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 -- Goals Selector (4) */}
        {step === 4 && (
          <div id="step-goals" className="flex flex-col gap-5">
            <div>
              <span className="text-xs text-[#E8421A] font-mono tracking-widest uppercase block mb-1">
                03 // DIRECTION
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                What are your main goals?
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {[
                { id: "Productivity", label: "Productivity ⚡", desc: "More output less noise" },
                { id: "Deep Study", label: "Deep Study 📚", desc: "Learn and retain" },
                { id: "Fitness", label: "Fitness 💪", desc: "Body performance" },
                { id: "Finance", label: "Finance 📈", desc: "Build wealth" },
                { id: "Self-Growth", label: "Self-Growth 🧠", desc: "Habits & mindset" },
                { id: "Stillness", label: "Stillness 🌙", desc: "Calm & clarity" },
                { id: "Creative Work", label: "Creative Work 🎯", desc: "Build & create" },
                { id: "Relationships", label: "Relationships 🤝", desc: "Presence" },
              ].map((item) => {
                const isSelected = goals.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggleGoal(item.id)}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-[90px] transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#E8421A] bg-[#E8421A08]"
                        : "border-[#222222] bg-[#0f0f0f] hover:border-[#2e2e2e]"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-semibold text-sm text-[#f0f0f0]">{item.label}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-[#E8421A] bg-[#E8421A]" : "border-[#222222]"
                      }`}>
                        {isSelected && <span className="text-[10px] text-white">✓</span>}
                      </div>
                    </div>
                    <span className="text-[11px] text-[#aaaaaa]">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4 -- Commitment (5) */}
        {step === 5 && (
          <div id="step-intensity" className="flex flex-col gap-5">
            <div>
              <span className="text-xs text-[#E8421A] font-mono tracking-widest uppercase block mb-1">
                04 // INTENSITY
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                How serious are you?
              </h2>
            </div>
            <div className="flex flex-col gap-3.5 mt-2">
              {[
                {
                  id: "casual",
                  label: "Casual 🌊",
                  badge: "RELAXED",
                  desc: "Build focus gradually. No pressure. Your pace, your rules.",
                  col: "#1DB954",
                  bg: "rgba(29,185,84,0.05)",
                },
                {
                  id: "dedicated",
                  label: "Dedicated ⚡",
                  badge: "FOCUSED",
                  desc: "Consistent daily sessions. Serious about output and discipline.",
                  col: "#C9952A",
                  bg: "rgba(201,149,42,0.05)",
                },
                {
                  id: "all-in",
                  label: "All In 🔥",
                  badge: "ELITE",
                  desc: "Maximum intensity. Peak performance. Monk mode activated. No excuses.",
                  col: "#E8421A",
                  bg: "rgba(232,66,26,0.05)",
                  glow: "shadow-[0_0_15px_rgba(232,66,26,0.3)]",
                },
              ].map((item) => {
                const isSelected = commitment === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCommitment(item.id)}
                    className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? `border-[${item.col}] ${item.glow || ""}`
                        : "border-[#222222] hover:border-[#2e2e2e]"
                    }`}
                    style={{
                      borderColor: isSelected ? item.col : "#222222",
                      backgroundColor: isSelected ? item.bg : "#0f0f0f",
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-base text-white">{item.label}</span>
                      <span
                        className="text-[10px] tracking-widest font-mono font-bold px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: isSelected ? item.col : "#1a1a1a",
                          color: isSelected ? "#080808" : "#888",
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#aaaaaa] leading-relaxed">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5 -- Preferences (Settings) (6) */}
        {step === 6 && (
          <div id="step-settings" className="flex flex-col gap-4">
            <div>
              <span className="text-xs text-[#E8421A] font-mono tracking-widest uppercase block mb-1">
                05 // SETTINGS
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Your preferences.
              </h2>
            </div>
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#aaaaaa] uppercase font-mono tracking-widest">
                  Language Preference
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-[#0f0f0f] border border-[#222222] rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#E8421A] font-mono select-menu"
                >
                  {["English", "Arabic", "French", "Spanish", "German", "Japanese", "Chinese", "Portuguese", "Korean", "Hindi"].map((lang) => (
                    <option key={lang} value={lang} className="bg-[#0f0f0f] text-white">
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#aaaaaa] uppercase font-mono tracking-widest">
                  Timezone Standard
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="bg-[#0f0f0f] border border-[#222222] rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#E8421A] font-mono select-menu"
                >
                  {[
                    "UTC-8 (PST) / Los Angeles",
                    "UTC-5 (EST) / New York",
                    "UTC-3 (BRT) / São Paulo",
                    "UTC+0 (GMT) / London",
                    "UTC+1 (CET) / Paris",
                    "UTC+4 (GST) / Dubai",
                    "UTC+5:30 (IST) / India",
                    "UTC+8 (CST) / Singapore",
                    "UTC+9 (JST) / Tokyo",
                    "UTC+10 (AEST) / Sydney",
                  ].map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle Preference Group Card */}
              <div className="bg-[#0f0f0f] border border-[#222222] rounded-xl p-4 flex flex-col gap-3.5 mt-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-white">Dark Mode</div>
                    <div className="text-xs text-[#aaaaaa]">AMOLED black — pure focus</div>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-all cursor-pointer ${
                      darkMode ? "bg-[#E8421A]" : "bg-[#222]"
                    }`}
                  >
                    <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" style={{ transform: darkMode ? "translateX(20px)" : "translateX(0)" }} />
                  </button>
                </div>

                <div className="flex justify-between items-center border-t border-[#1a1a1a] pt-3">
                  <div>
                    <div className="text-sm font-bold text-white">Haptic Feedback</div>
                    <div className="text-xs text-[#aaaaaa]">Vibration on session events</div>
                  </div>
                  <button
                    onClick={() => setHapticFeedback(!hapticFeedback)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-all cursor-pointer ${
                      hapticFeedback ? "bg-[#E8421A]" : "bg-[#222]"
                    }`}
                  >
                    <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" style={{ transform: hapticFeedback ? "translateX(20px)" : "translateX(0)" }} />
                  </button>
                </div>

                <div className="flex justify-between items-center border-t border-[#1a1a1a] pt-3">
                  <div>
                    <div className="text-sm font-bold text-white">Reduce Motion</div>
                    <div className="text-xs text-[#aaaaaa]">Simpler transition animations</div>
                  </div>
                  <button
                    onClick={() => setReduceMotion(!reduceMotion)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-all cursor-pointer ${
                      reduceMotion ? "bg-[#E8421A]" : "bg-[#222]"
                    }`}
                  >
                    <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" style={{ transform: reduceMotion ? "translateX(20px)" : "translateX(0)" }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6 -- Persona Maker (7) */}
        {step === 7 && (
          <div id="step-persona" className="flex flex-col gap-4">
            <div>
              <span className="text-xs text-[#E8421A] font-mono tracking-widest uppercase block mb-1">
                06 // PERSONA
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Build your operator persona.
              </h2>
            </div>
            <div className="flex flex-col items-center gap-4 mt-1">
              {/* Selected Preview Box */}
              <div className="w-20 h-20 bg-[#141414] border-2 border-[#E8421A] rounded-2xl flex items-center justify-center text-4xl shadow-[0_0_15px_rgba(232,66,26,0.25)]">
                {avatar}
              </div>

              {/* 4x4 Avatar Grid */}
              <div className="grid grid-cols-8 gap-2 w-full mt-2">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setAvatar(emoji)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all cursor-pointer border ${
                      avatar === emoji
                        ? "border-[#E8421A] bg-[#E8421A15]"
                        : "border-[#222222] bg-[#0f0f0f] hover:border-[#2e2e2e]"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Bio block */}
              <div className="w-full flex flex-col gap-1.5 mt-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-[#aaaaaa] uppercase font-mono tracking-widest">
                    Operator Bio / Intent (Optional)
                  </label>
                  <span className="text-[10px] text-[#555] font-mono">
                    {bio.length}<span>/100</span>
                  </span>
                </div>
                <textarea
                  id="onboard-bio"
                  placeholder="I build high performance systems, seek truth, and ignore noise..."
                  maxLength={100}
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-[#0f0f0f] border border-[#222222] rounded-xl p-3.5 text-white text-sm focus:ring-1 focus:ring-[#E8421A] focus:outline-none font-mono"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 7 -- Security Page (8) */}
        {step === 8 && (
          <div id="step-security" className="flex flex-col gap-4">
            <div>
              <span className="text-xs text-[#E8421A] font-mono tracking-widest uppercase block mb-1">
                07 // ACCESS
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Secure your account.
              </h2>
            </div>
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#aaaaaa] uppercase font-mono tracking-widest">
                  Secure Identity Email <span className="text-[#E8421A]">*</span>
                </label>
                <input
                  id="onboard-email"
                  type="email"
                  placeholder="operator@workspace.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`bg-[#0f0f0f] border rounded-xl p-3.5 text-white text-base focus:outline-none focus:ring-1 focus:ring-[#E8421A] font-mono ${
                    email.length === 0 ? "border-[#222222]" : isEmailValid(email) ? "border-[#1DB954]" : "border-[#ff4444]"
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#aaaaaa] uppercase font-mono tracking-widest">
                  Security Access Password <span className="text-[#E8421A]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="onboard-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#0f0f0f] border border-[#222222] rounded-xl p-3.5 pr-12 text-white text-base w-full focus:ring-1 focus:ring-[#E8421A] focus:outline-none font-mono"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-[#aaaaaa] hover:text-white"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>

                {/* Password strength bar */}
                {password.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-[#aaaaaa]">Password Security:</span>
                      <span style={{ color: strengthColors[passStrength] }}>{strengthLabels[passStrength]}</span>
                    </div>
                    {/* Multi step strength bar colored */}
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-1.5 rounded-full flex-1 transition-all"
                          style={{
                            backgroundColor: i < passStrength ? strengthColors[passStrength] : "#1a1a1a",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-[#555555] leading-normal font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      ELITE criteria: min 12 chars, uppercase letter, number, and punctuation.
                    </p>
                  </div>
                )}
              </div>

              {/* Extra Security Settings Switcher Card */}
              <div className="bg-[#0f0f0f] border border-[#222222] rounded-xl p-4 flex flex-col gap-3.5 mt-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-white">Biometric Scan Identification</div>
                    <div className="text-xs text-[#aaaaaa]">Enable TouchID / FaceID access</div>
                  </div>
                  <button
                    onClick={() => setBiometricLock(!biometricLock)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-all cursor-pointer ${
                      biometricLock ? "bg-[#E8421A]" : "bg-[#222]"
                    }`}
                  >
                    <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" style={{ transform: biometricLock ? "translateX(20px)" : "translateX(0)" }} />
                  </button>
                </div>

                <div className="flex justify-between items-center border-t border-[#1a1a1a] pt-3">
                  <div>
                    <div className="text-sm font-bold text-white">Secure PIN Lockdown</div>
                    <div className="text-xs text-[#aaaaaa]">Requires strict 4-digit PIN setup</div>
                  </div>
                  <button
                    onClick={() => setPinCode(!pinCode)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-all cursor-pointer ${
                      pinCode ? "bg-[#E8421A]" : "bg-[#222]"
                    }`}
                  >
                    <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" style={{ transform: pinCode ? "translateX(20px)" : "translateX(0)" }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 8 -- Routine Configuration (9) */}
        {step === 9 && (
          <div id="step-routine" className="flex flex-col gap-4">
            <div>
              <span className="text-xs text-[#E8421A] font-mono tracking-widest uppercase block mb-1">
                08 // ROUTINE
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Build your daily system.
              </h2>
            </div>
            <div className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#aaaaaa] uppercase font-mono tracking-widest">
                    Wake Up Time
                  </label>
                  <input
                    id="routine-wake"
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="bg-[#0f0f0f] border border-[#222222] rounded-xl p-3 text-white text-base focus:outline-none focus:ring-1 focus:ring-[#E8421A] font-mono"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#aaaaaa] uppercase font-mono tracking-widest">
                    Work Starts At
                  </label>
                  <input
                    id="routine-work-start"
                    type="time"
                    value={workStartTime}
                    onChange={(e) => setWorkStartTime(e.target.value)}
                    className="bg-[#0f0f0f] border border-[#222222] rounded-xl p-3 text-white text-base focus:outline-none focus:ring-1 focus:ring-[#E8421A] font-mono"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#aaaaaa] uppercase font-mono tracking-widest">
                    Work Ends At
                  </label>
                  <input
                    id="routine-work-end"
                    type="time"
                    value={workEndTime}
                    onChange={(e) => setWorkEndTime(e.target.value)}
                    className="bg-[#0f0f0f] border border-[#222222] rounded-xl p-3 text-white text-base focus:outline-none focus:ring-1 focus:ring-[#E8421A] font-mono"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#aaaaaa] uppercase font-mono tracking-widest">
                    Daily Focus Hours
                  </label>
                  <input
                    id="routine-hours-target"
                    type="number"
                    min={1}
                    max={16}
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(Number(e.target.value))}
                    className="bg-[#0f0f0f] border border-[#222222] rounded-xl p-3 text-white text-base focus:outline-none focus:ring-1 focus:ring-[#E8421A] font-mono"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
              </div>

              {/* Toggle list */}
              <div className="flex flex-col gap-3 bg-[#0f0f0f] border border-[#222222] rounded-xl p-4 mt-2">
                <span className="text-[10px] text-[#555] uppercase font-mono tracking-widest block mb-1">
                  Alert reminders
                </span>
                {[
                  { id: "dailyReminder", label: "Daily Focus Reminder", desc: "Notify if focus blocks missed" },
                  { id: "streakProtection", label: "Streak Protection Support", desc: "Prevent reset failures" },
                  { id: "weeklyReport", label: "Operator Weekly Analytics", desc: "Performance digest delivery" },
                  { id: "coachInsights", label: "FORGE_AI Insights Feed", desc: "Coaching suggestions" },
                ].map((item) => (
                  <label key={item.id} className="flex justify-between items-center cursor-pointer border-b border-[#141414] last:border-0 pb-2.5 last:pb-0">
                    <div>
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[10px] text-[#aaaaaa]">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={(notifications as any)[item.id]}
                      onChange={(e) =>
                        setNotifications((prev) => ({ ...prev, [item.id]: e.target.checked }))
                      }
                      className="accent-[#E8421A] w-4.5 h-4.5 cursor-pointer rounded"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 9 -- Summary Review Confirm (10) */}
        {step === 10 && (
          <div id="step-confirm-summary" className="flex flex-col gap-4">
            <div>
              <span className="text-xs text-[#E8421A] font-mono tracking-widest uppercase block mb-1">
                09 // CONFIRM
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Profile ready.
              </h2>
            </div>
            
            <div className="bg-[#0f0f0f] border border-[#222222] rounded-2xl p-4 flex flex-col gap-4 mt-2">
              <div className="flex items-center gap-4 border-b border-[#1c1c1c] pb-4">
                <div className="w-14 h-14 bg-[#141414] rounded-xl border border-[#222222] text-3xl flex items-center justify-center">
                  {avatar}
                </div>
                <div>
                  <div className="font-bold text-white text-lg leading-tight uppercase">
                    {firstName} {lastName}
                  </div>
                  <span className="text-xs font-mono text-[#E8421A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    @{username || "operator"}
                  </span>
                </div>
                {commitment && (
                  <span className="ml-auto text-[9px] font-mono tracking-widest bg-[#E8421A15] border border-[#E8421A] text-[#E8421A] px-2 py-0.5 rounded-full font-bold">
                    {commitment.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Data list grid layout */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <div>
                  <div className="text-[#555] text-[10px] uppercase">IDENTITY USER TYPE</div>
                  <div className="text-white font-medium mt-0.5">{userType}</div>
                </div>
                <div>
                  <div className="text-[#555] text-[10px] uppercase">OPERATIONAL GOALS</div>
                  <div className="text-white font-medium mt-0.5 truncate">{goals.slice(0, 2).join(", ")}</div>
                </div>
                <div>
                  <div className="text-[#555] text-[10px] uppercase">COMMUNICATION LANG</div>
                  <div className="text-white font-medium mt-0.5">{language}</div>
                </div>
                <div>
                  <div className="text-[#555] text-[10px] uppercase">DAILY HOUR TARGET</div>
                  <div className="text-white font-medium mt-0.5">{dailyTarget} Hours</div>
                </div>
                <div>
                  <div className="text-[#555] text-[10px] uppercase">WAKE SCHEDULER</div>
                  <div className="text-white font-medium mt-0.5">{wakeTime}</div>
                </div>
                <div>
                  <div className="text-[#555] text-[10px] uppercase">SECURITY SYSTEM</div>
                  <div className="text-white font-medium mt-0.5 flex gap-1 items-center">
                    <span className="text-[#1DB954]">✓ ENCRYPTED</span>
                  </div>
                </div>
              </div>

              {bio && (
                <p className="text-xs text-[#aaaaaa] italic border-l-2 border-[#E8421A] pl-3 leading-relaxed py-1 bg-[#14141430] rounded-r-md">
                  "{bio}"
                </p>
              )}
            </div>

            <button
              id="btn-confirm-onboarding"
              onClick={nextStep}
              className="w-full bg-[#E8421A] hover:bg-opacity-90 text-white font-mono font-bold text-sm tracking-widest py-4 rounded-xl shadow-[0_4px_15px_rgba(232,66,26,0.3)] mt-2 cursor-pointer transition-all"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ENTER MONKMODE ⚡
            </button>
          </div>
        )}

        {/* Celebrate Confirmation View (11) */}
        {step === 11 && (
          <div id="celebrate-screen" className="flex flex-col items-center justify-center text-center gap-6 py-6 position-relative">
            {/* Falling Confetti bits */}
            {Array.from({ length: 20 }).map((_, idx) => {
              const confettiLeft = Math.floor(Math.random() * 95) + "%";
              const confettiDelay = (Math.random() * 2.5).toFixed(1) + "s";
              const confettiDuration = (Math.random() * 2 + 3).toFixed(1) + "s";
              const confettiSize = Math.floor(Math.random() * 6) + 6 + "px";
              const confettiColor = ["#E8421A", "#C9952A", "#1DB954", "#4a9eff", "#ffffff"][Math.floor(Math.random() * 5)];
              return (
                <div
                  key={idx}
                  className="confetti-dot"
                  style={{
                    left: confettiLeft,
                    animationDelay: confettiDelay,
                    animationDuration: confettiDuration,
                    backgroundColor: confettiColor,
                    width: confettiSize,
                    height: confettiSize,
                    borderRadius: idx % 2 === 0 ? "50%" : "2px"
                  }}
                />
              );
            })}

            <div className="w-24 h-24 bg-[#E8421A15] border border-[#E8421A] rounded-3xl flex items-center justify-center text-5xl shadow-[0_0_25px_rgba(232,66,26,0.4)] relative pulsing-orb">
              {avatar}
            </div>

            <div className="flex flex-col gap-1.5">
              <h1 className="text-3xl font-extrabold text-white uppercase">
                Ready, {firstName}.
              </h1>
              <p className="text-sm font-mono tracking-widest text-[#E8421A] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                PROFILE INITIALIZED
              </p>
            </div>

            <p className="text-sm text-[#aaaaaa] leading-relaxed max-w-sm mt-1">
              {commitment === "all-in"
                ? "Monk Mode Elite activated. Expect nothing less than your best."
                : commitment === "dedicated"
                ? "Dedicated operator mode ready. Your system is live."
                : "Your focus system is online. Start where you are."}
            </p>

            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              {goals.slice(0, 4).map((goal) => (
                <span
                  key={goal}
                  className="text-[10px] font-mono tracking-wide bg-[#111] border border-[#222] text-[#aaaaaa] px-2.5 py-1 rounded-full font-semibold"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  #{goal.toUpperCase()}
                </span>
              ))}
            </div>

            <div className="w-full flex flex-col gap-4 mt-8">
              <button
                id="btn-onboarding-complete-forge"
                onClick={finalOnboardSubmit}
                className="w-full bg-[#E8421A] hover:bg-opacity-95 text-white font-mono font-bold text-sm tracking-widest py-4.5 rounded-xl shadow-[0_5px_22px_rgba(232,66,26,0.4)] cursor-pointer transition-all"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ⚡ ENTER THE FORGE
              </button>
              <div className="text-[9px] text-[#555] tracking-widest font-mono font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                IDENTITY FORGED · OPERATOR CLEARED FOR ACCESS
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Onboarding Navigation footer */}
      {step >= 2 && step <= 10 && (
        <div id="onboarding-footer-controls" className="w-full flex gap-3 mt-auto pt-4 border-t border-[#111]">
          <button
            id="btn-onboarding-back"
            onClick={prevStep}
            className="w-13 h-13 rounded-xl border border-[#222] hover:border-[#2e2e2e] bg-[#0f0f0f] flex items-center justify-center transition-all cursor-pointer text-white"
          >
            ←
          </button>
          <button
            id="btn-onboarding-continue"
            disabled={isNextDisabled()}
            onClick={nextStep}
            className={`flex-1 rounded-xl font-bold font-mono text-xs tracking-widest transition-all cursor-pointer ${
              isNextDisabled()
                ? "bg-[#111] border border-[#222] text-[#555] cursor-not-allowed"
                : "bg-gradient-to-r from-[#E8421A] to-[#C9952A] text-white hover:opacity-95 shadow-[0_2px_10px_rgba(232,66,26,0.2)]"
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            CONTINUE // NEXT ⚡
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN APPLICATION (PHASE 2)
// ═══════════════════════════════════════
function MainApp({ profile, appState, setAppState, onLogOut }: { profile: any; appState: any; setAppState: any; onLogOut: any }) {
  const [activeTab, setActiveTab] = useState("forge"); // forge, focus, stats, coach, identity

  // Focus Session Config states
  const [sessionDuration, setSessionDuration] = useState(25);
  const [sessionCategory, setSessionCategory] = useState("CODING");
  const [missionTarget, setMissionTarget] = useState("");
  const [sessionIntention, setSessionIntention] = useState("");
  const [strictMode, setStrictMode] = useState(false);

  // Active Session states
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSessionPaused, setIsSessionPaused] = useState(false);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(0);
  const [sessionDistractions, setSessionDistractions] = useState(0);

  // Completed Session metrics for Review overlay
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [finishedSessionObj, setFinishedSessionObj] = useState<any>(null);
  const [postMood, setPostMood] = useState("🔥");
  const [postComments, setPostComments] = useState("");

  // Coach Chat states
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      role: "assistant",
      content: `Greetings, ${profile.firstName}. I am FORGE_AI, your systems coach. I monitor your commitments under the intense ${profile.commitment.toUpperCase()} protocol. Command me on deep flow setups, beating friction, or habit architecture.`,
    },
  ]);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Achievement unlock notifications
  const [activeToast, setActiveToast] = useState<{ name: string; desc: string; icon: string } | null>(null);

  // Audio state
  const chimeSound = useRef<any>(null);

  // Timer reference
  const timerIntervalRef = useRef<any>(null);

  // Autoscroll chat
  useEffect(() => {
    if (activeTab === "coach" && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  // Handle active countdown logic
  useEffect(() => {
    if (isSessionActive && !isSessionPaused) {
      timerIntervalRef.current = setInterval(() => {
        setSessionSecondsLeft((prev) => {
          if (prev <= 1) {
            handleSessionCompleteAuto();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isSessionActive, isSessionPaused]);

  // --- FOCUS SYSTEM ACTION METHODS ---

  // Start deep focus blocks
  const handleStartSession = () => {
    if (!missionTarget.trim()) return;
    setSessionSecondsLeft(sessionDuration * 60);
    setSessionDistractions(0);
    setIsSessionPaused(false);
    setIsSessionActive(true);
  };

  // Pause event captures distractions
  const handlePauseToggle = () => {
    setIsSessionPaused((prev) => {
      const nextState = !prev;
      if (nextState) {
        // Pausing increments distractions
        setSessionDistractions((d) => d + 1);
      }
      return nextState;
    });
  };

  // Premature user end requests
  const [confirmEndState, setConfirmEndState] = useState(false);
  const handleRequestEndSession = () => {
    if (!confirmEndState) {
      setConfirmEndState(true);
      // Auto clear state check soon
      setTimeout(() => setConfirmEndState(false), 3000);
    } else {
      setConfirmEndState(false);
      handleEarlyTerminatedSession();
    }
  };

  // Successful Auto Completion!
  const handleSessionCompleteAuto = () => {
    setIsSessionActive(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    // Calc metrics
    const durationMins = sessionDuration;
    const earnedXp = durationMins * 2;

    const result = {
      id: "S-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      task: missionTarget,
      category: sessionCategory,
      plannedMins: durationMins,
      actualMins: durationMins,
      distractions: sessionDistractions,
      completed: true,
      xpEarned: earnedXp,
      date: new Date().toLocaleDateString(),
    };

    setFinishedSessionObj(result);
    setSummaryOpen(true);
  };

  // Early terminate session
  const handleEarlyTerminatedSession = () => {
    setIsSessionActive(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const elapsedSeconds = sessionDuration * 60 - sessionSecondsLeft;
    const elapsedMins = Math.max(1, Math.round(elapsedSeconds / 60));
    const earnedXp = Math.round(elapsedMins * 0.5);

    const result = {
      id: "S-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      task: missionTarget,
      category: sessionCategory,
      plannedMins: sessionDuration,
      actualMins: elapsedMins,
      distractions: sessionDistractions,
      completed: false,
      xpEarned: earnedXp,
      date: new Date().toLocaleDateString(),
    };

    setFinishedSessionObj(result);
    setSummaryOpen(true);
  };

  // Save reviewed session metrics and awards stats
  const handleSaveReviewedSession = () => {
    if (!finishedSessionObj) return;

    const updatedWeeklyData = [...appState.weeklyData];
    const todayIndex = new Date().getDay(); // 0-6 (Sun-Sat)
    const adjustedDayIndex = todayIndex === 0 ? 6 : todayIndex - 1; // Align to Mon-Sun
    updatedWeeklyData[adjustedDayIndex] = (updatedWeeklyData[adjustedDayIndex] || 0) + finishedSessionObj.actualMins;

    const currentSessions = [...appState.sessions, { ...finishedSessionObj, mood: postMood, comments: postComments }];
    const addedXp = finishedSessionObj.xpEarned;
    const nextXp = appState.xp + addedXp;
    
    // Streaks calculations
    let currentStreak = appState.streak;
    if (finishedSessionObj.completed) {
      currentStreak += 1;
    }

    const updatedWorkHours = appState.deepWorkHours + (finishedSessionObj.actualMins / 60);
    const updatedTotalMins = appState.totalMins + finishedSessionObj.actualMins;
    const nextFocusScore = Math.min(100, Math.max(0, appState.focusScore + (finishedSessionObj.completed ? 3 : -1)));

    // Achievements verification checks
    let toastToShow: any = null;
    const updatedAchievements = appState.achievements.map((ach: any) => {
      if (ach.unlocked) return ach;
      let flag = false;

      if (ach.id === "monk_initiate" && currentSessions.length >= 5) flag = true;
      if (ach.id === "deep_diver" && finishedSessionObj.actualMins >= 90 && finishedSessionObj.completed) flag = true;
      if (ach.id === "unbreakable" && currentStreak >= 7) flag = true;
      if (ach.id === "flow_master" && updatedTotalMins >= 600) flag = true;
      if (ach.id === "iron_will" && finishedSessionObj.distractions === 0 && finishedSessionObj.completed) flag = true;
      if (ach.id === "dawn_operator" && currentSessions.length >= 5) flag = true;

      if (flag) {
        toastToShow = { name: ach.name, desc: ach.desc, icon: ach.icon };
        return { ...ach, unlocked: true, unlockDate: new Date().toLocaleDateString() };
      }
      return ach;
    });

    setAppState({
      xp: nextXp,
      streak: currentStreak,
      deepWorkHours: updatedWorkHours,
      focusScore: nextFocusScore,
      totalMins: updatedTotalMins,
      sessions: currentSessions,
      achievements: updatedAchievements,
      weeklyData: updatedWeeklyData,
      insightIdx: (appState.insightIdx + 1) % AI_INSIGHTS.length,
    });

    if (toastToShow) {
      setActiveToast(toastToShow);
    }

    // Clean states
    setFinishedSessionObj(null);
    setMissionTarget("");
    setSessionIntention("");
    setSummaryOpen(false);
    setActiveTab("forge");
  };

  // --- COACH INTEGRATIONS & DISPATCHERS ---

  const handleSendCoachMsg = async (forceQuery?: string) => {
    const rawContent = forceQuery || chatInput;
    if (!rawContent.trim() || isCoachLoading) return;

    const userMsg = { role: "user", content: rawContent };
    const nextArr = [...chatMessages, userMsg];

    setChatMessages(nextArr);
    setChatInput("");
    setIsCoachLoading(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextArr,
          commitment: profile.commitment,
        }),
      });

      if (!response.ok) {
        throw new Error("Coach route error code " + response.status);
      }

      const body = await response.json();
      const replyText = body.content?.[0]?.text || "Coach feed silent. Re-engage discipline parameters.";

      setChatMessages((messages) => [...messages, { role: "assistant", content: replyText }]);
    } catch (err) {
      console.error(err);
      setChatMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content: "System connection offline. Your discipline operates regardless of signal metrics. Focus on task alignment.",
        },
      ]);
    } finally {
      setIsCoachLoading(false);
    }
  };

  // Solve rank math
  const { currentRank, nextRank } = (() => {
    let current = RANKS[0];
    let next = RANKS[1];
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (appState.xp >= RANKS[i].xpNeeded) {
        current = RANKS[i];
        next = RANKS[i + 1] || RANKS[i];
        break;
      }
    }
    return { currentRank: current, nextRank: next };
  })();

  const xpProgressPercent = (() => {
    if (currentRank.level === 6) return 100;
    const range = nextRank.xpNeeded - currentRank.xpNeeded;
    const relativeXp = appState.xp - currentRank.xpNeeded;
    return Math.min(100, Math.max(0, Math.round((relativeXp / range) * 100)));
  })();

  // Main UI Renders (conditional by active tab switcher)
  return (
    <div id="operator-main-app-shell" className="w-full max-w-lg min-h-screen flex flex-col justify-between pb-[84px] bg-[#0c0c0c] relative">
      
      {/* Dynamic Floating Achievement Toast Banner */}
      {activeToast && (
        <div id="achievement-unlocked-toast" className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[9999] bg-[#0f0f0f] border-2 border-[#C9952A] rounded-2xl p-4 flex gap-4 shadow-[0_10px_30px_rgba(201,149,42,0.15)] animate-bounce text-left">
          <div className="text-4xl">{activeToast.icon}</div>
          <div className="flex-1">
            <div className="text-[10px] font-mono tracking-widest text-[#C9952A] font-bold">ACHIEVEMENT UNLOCKED</div>
            <h4 className="text-white font-bold font-mono text-sm uppercase mt-0.5">{activeToast.name}</h4>
            <p className="text-xs text-[#aaaaaa] leading-tight mt-0.5">{activeToast.desc}</p>
          </div>
          <button onClick={() => setActiveToast(null)} className="text-white text-xs hover:opacity-8 focus:outline-none self-start cursor-pointer border px-2 py-0.5 rounded font-mono">
            OK
          </button>
        </div>
      )}

      {/* TAB 1: THE FORGE (HOME DASHBOARD) */}
      {activeTab === "forge" && (
        <div id="forge-tab-panel" className="flex flex-col gap-5 p-5">
          {/* Header identity bar */}
          <div className="flex justify-between items-center bg-[#0f0f0f] border border-[#222] rounded-xl p-4">
            <div>
              <span className="text-[10px] text-[#aaaaaa] tracking-widest font-mono uppercase">
                DASHBOARD // OPERATOR
              </span>
              <h1 className="text-2xl font-bold uppercase text-white tracking-widest mt-0.5">
                {profile.firstName}
              </h1>
            </div>
            <div className="text-right flex flex-col">
              <span className="text-[10px] text-[#555] tracking-widest font-mono">OPERATOR EXP</span>
              <span className="text-lg font-bold text-[#C9952A] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {appState.xp}<span> XP</span>
              </span>
            </div>
          </div>

          {/* Ranks strip card panel */}
          <div className="bg-[#0b0b0b] border border-[#222] rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 bg-[#22222220] border-l border-b border-[#222] text-xs font-mono font-bold leading-none select-none rounded-bl-lg">
              LEVEL {currentRank.level}
            </div>
            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentRank.badge}</span>
                <span className="font-bold text-xs uppercase tracking-wide font-mono" style={{ color: currentRank.color }}>
                  {currentRank.name}
                </span>
              </div>
              {currentRank.level < 6 && (
                <span className="text-[10px] font-mono text-[#aaaaaa]">
                  {nextRank.xpNeeded - appState.xp}<span> XP TO NEXT LEVEL</span>
                </span>
              )}
            </div>
            {/* ProgressBar */}
            <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden mt-1.5 flex">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${xpProgressPercent}%`,
                  backgroundColor: currentRank.color,
                }}
              />
            </div>
          </div>

          {/* 2x2 Performance stat metrics grids */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4 flex flex-col justify-between h-24">
              <span className="text-[9px] text-[#aaaaaa] tracking-widest font-mono block">DEEP WORK BLOCK</span>
              <div className="flex items-end justify-between">
                <span className="font-mono text-xl font-bold text-white mb-0.5">
                  {appState.deepWorkHours.toFixed(1)}<span> HRS</span>
                </span>
                <span className="text-2xl opacity-60">⏳</span>
              </div>
            </div>

            <div className="bg-[#0f0f0f] border border-[#E8421A20] rounded-xl p-4 flex flex-col justify-between h-24 shadow-[0_3px_12px_rgba(232,66,26,0.05)]">
              <span className="text-[9px] text-[#E8421A] tracking-widest font-mono block">STREAK SYSTEM</span>
              <div className="flex items-end justify-between">
                <span className="font-mono text-xl font-bold text-[#E8421A] mb-0.5">
                  {appState.streak}<span> DAYS</span>
                </span>
                <span className="text-2xl">🔥</span>
              </div>
            </div>

            <div className="bg-[#0f0f0f] border border-[#C9952A20] rounded-xl p-4 flex flex-col justify-between h-24 shadow-[0_3px_12px_rgba(201,149,42,0.05)]">
              <span className="text-[9px] text-[#C9952A] tracking-widest font-mono block">ATTENTION SCORE</span>
              <div className="flex items-end justify-between">
                <span className="font-mono text-xl font-bold text-[#C9952A] mb-0.5">
                  {appState.focusScore}<span>/100</span>
                </span>
                <span className="text-2xl">🎯</span>
              </div>
            </div>

            <div className="bg-[#0f0f0f] border border-[#1DB95420] rounded-xl p-4 flex flex-col justify-between h-24">
              <span className="text-[9px] text-[#1DB954] tracking-widest font-mono block">WEEK ACTIVITY</span>
              <div className="flex items-end justify-between">
                <span className="font-mono text-xl font-bold text-[#1DB954] mb-0.5">
                  {(appState.weeklyData.reduce((a: any, b: any) => a + b, 0) / 60).toFixed(1)}<span> HRS</span>
                </span>
                <span className="text-2xl">⚡</span>
              </div>
            </div>
          </div>

          {/* Quickstart engine triggers */}
          <button
            id="btn-forge-quickstart-timer"
            onClick={() => setActiveTab("focus")}
            className="w-full bg-[#0f0f0f] border border-[#222] hover:border-[#E8421A20] rounded-2xl p-6 text-left relative overflow-hidden flex justify-between items-center group shadow-[0_4px_25px_rgba(0,0,0,0.5)] cursor-pointer"
          >
            {/* Background avatar watermarkglyph */}
            <span className="absolute right-4 bottom-[-16px] text-[#111] text-[110px] font-mono leading-none pointer-events-none select-none select-item group-hover:scale-110 group-hover:text-[#161616] transition-transform">
              {profile.avatar}
            </span>
            <div className="z-10 relative">
              <div className="text-[10px] text-[#E8421A] font-mono tracking-widest uppercase font-bold">
                FOCUS PROTOCOLS // ACTIVE
              </div>
              <h3 className="text-xl font-bold mt-1 text-white">ENGAGE DEEP WORK</h3>
              <div className="flex gap-2 mt-4 text-[10px] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span className="bg-[#1c1c1c] text-[#aaaaaa] px-2.5 py-1 rounded">50 MIN BLOCK</span>
                <span className="bg-[#C9952A15] text-[#C9952A] px-2.5 py-1 rounded">×2 XP OVERDRIVE</span>
                <span className="bg-[#E8421A15] text-[#E8421A] px-2.5 py-1 rounded uppercase">{profile.commitment}</span>
              </div>
            </div>
            <span className="text-2xl text-[#E8421A] z-10 font-bold group-hover:translate-x-1.5 transition-transform">⟶</span>
          </button>

          {/* FORGE_AI rotation quote highlight indicator */}
          <div className="bg-[#0f0f0f] border-l-4 border-[#E8421A] rounded-r-xl p-4 flex flex-col gap-3">
            <span className="text-[9px] text-[#aaaaaa] tracking-widest font-mono uppercase block font-bold">
              FORGE_AI // CORE FEEDBACK LOGS
            </span>
            <p className="text-xs text-[#aaaaaa] leading-relaxed italic pr-6">
              "{AI_INSIGHTS[appState.insightIdx]}"
            </p>
            <button
              id="forge-link-to-coach"
              onClick={() => setActiveTab("coach")}
              className="text-[10px] font-mono font-bold tracking-widest text-left text-white hover:text-[#E8421A] hover-transition self-start cursor-pointer block mt-1"
            >
              OPEN AI COACH ⟶
            </button>
          </div>

          {/* Goal selection pill lists from onboarding */}
          <div>
            <span className="text-[9px] text-[#555] tracking-widest font-mono uppercase block mb-2 font-semibold">
              TARGET PRIORITY GOALS
            </span>
            <div className="flex flex-wrap gap-1.5">
              {profile.goals.map((g: string) => (
                <span
                  key={g}
                  className="text-[9px] font-mono px-2.5 py-1 rounded-full bg-[#111] border border-[#222] text-[#f0f0f0]"
                >
                  #{g.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FOCUS ENGINE CONFIGURATION & TICK TIMER */}
      {activeTab === "focus" && (
        <div id="focus-tab-panel" className="flex flex-col gap-5 p-5">
          <div id="focus-setup-header">
            <span className="text-[10px] text-[#aaaaaa] tracking-widest font-mono uppercase block mb-1">
              FOCUS ENGINE // CONFIGURE
            </span>
            <h1 className="text-2xl font-bold uppercase text-white tracking-widest">
              ENGAGEMENT
            </h1>
          </div>

          {/* Duration Selector scrolling row */}
          <div id="duration-selector-row" className="flex flex-col gap-2">
            <label className="text-[10px] text-[#555] uppercase font-mono tracking-widest font-bold">
              SESSION BLOCK MINUTES
            </label>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {DURATIONS.map((dur) => (
                <button
                  key={dur}
                  onClick={() => setSessionDuration(dur)}
                  className={`px-4.5 py-3 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer select-none shrink-0 ${
                    sessionDuration === dur
                      ? "border-[#E8421A] bg-[#E8421A10] text-[#f0f0f0]"
                      : "border-[#222] bg-[#0f0f0f] text-[#aaaaaa]"
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {dur} MIN
                </button>
              ))}
            </div>
          </div>

          {/* Session Category grids */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-[#555] uppercase font-mono tracking-widest font-bold">
              OPERATIONAL TYPE
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSessionCategory(cat.id)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    sessionCategory === cat.id
                      ? "border-[#E8421A] bg-[#E8421A08] text-white"
                      : "border-[#222] bg-[#0f0f0f] text-[#aaaaaa]"
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-xs font-bold tracking-wide font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{cat.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Session Inputs details */}
          <div className="flex flex-col gap-4 mt-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#aaaaaa] uppercase font-mono tracking-widest font-bold">
                MISSION TARGET <span className="text-[#E8421A]">*</span>
              </label>
              <input
                id="focus-target-input"
                type="text"
                placeholder="What are you building / solving today?"
                value={missionTarget}
                onChange={(e) => setMissionTarget(e.target.value)}
                className="bg-[#0f0f0f] border border-[#222] rounded-xl p-3.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#E8421A] font-mono"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#aaaaaa] uppercase font-mono tracking-widest font-bold">
                SESSION INTENTION INDICES
              </label>
              <textarea
                id="focus-intention-input"
                rows={2}
                placeholder="e.g. Absolute focus. No tab switching."
                value={sessionIntention}
                onChange={(e) => setSessionIntention(e.target.value)}
                className="bg-[#0f0f0f] border border-[#222] rounded-xl p-3.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#E8421A] font-mono resize-none"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>

            {/* Strict mode lockdown switch */}
            <label className="bg-[#0f0f0f] border border-[#222222] rounded-xl p-4 flex justify-between items-center cursor-pointer mt-1">
              <div>
                <div className="text-xs font-bold text-white uppercase font-mono">STRICT ENCRYPTION LOCK</div>
                <div className="text-[10px] text-[#aaaaaa] mt-0.5 leading-snug">Cannot prematurely abort sessions without penalty</div>
              </div>
              <input
                type="checkbox"
                checked={strictMode}
                onChange={(e) => setStrictMode(e.target.checked)}
                className="accent-[#E8421A] w-4.5 h-4.5 cursor-pointer rounded"
              />
            </label>
          </div>

          {/* Start trigger */}
          <button
            id="btn-focus-session-start"
            disabled={!missionTarget.trim()}
            onClick={handleStartSession}
            className={`w-full py-4.5 rounded-xl font-mono font-bold text-sm tracking-widest mt-4 cursor-pointer transition-all ${
              !missionTarget.trim()
                ? "bg-[#141414] border border-[#222] text-[#555] cursor-not-allowed"
                : "bg-gradient-to-r from-[#E8421A] to-[#C9952A] text-white shadow-[0_5px_22px_rgba(232,66,26,0.35)]"
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            START DEEP WORK BLOCK ⚡
          </button>
        </div>
      )}

      {/* FULLSCREEN ACTIVE TIMER MODAL SCREEN (position fixed, z-index 300) */}
      {isSessionActive && (
        <div id="active-session-fullscreen-modal" className="fixed inset-0 z-[300] bg-[#080808] flex flex-col justify-between p-6 items-center select-none text-left">
          
          {/* Top meta bars */}
          <div className="w-full flex justify-between items-center bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff4444] live-dot animate-ping" />
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-white">
                {sessionCategory} SESSION ACTIVE
              </span>
            </div>
            <div className="bg-[#1a1a1a] px-2 py-0.5 rounded text-[9px] font-mono text-[#aaaaaa] font-bold">
              {profile.commitment.toUpperCase()} PROTOCOL
            </div>
          </div>

          {/* SVG ring timer center */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-6 text-center">
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Circular SVG Rings */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 248 248">
                {/* Background Track Circle */}
                <circle
                  cx="124"
                  cy="124"
                  r="112"
                  fill="none"
                  stroke="#141414"
                  strokeWidth="8"
                />
                {/* Active Colored Progress Indicator */}
                <circle
                  cx="124"
                  cy="124"
                  r="112"
                  fill="none"
                  stroke="#E8421A"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 112}`}
                  strokeDashoffset={`${
                    (2 * Math.PI * 112) *
                    (1 - (sessionSecondsLeft / (sessionDuration * 60)))
                  }`}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>

              {/* Countdown Numbers and label info inside circle */}
              <div className="z-10 flex flex-col items-center">
                <span className="text-5xl font-mono text-white tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {(() => {
                    const m = Math.floor(sessionSecondsLeft / 60);
                    const s = sessionSecondsLeft % 60;
                    return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
                  })()}
                </span>
                <span className="text-[9px] text-[#555] tracking-widest font-mono uppercase mt-2 font-bold select-none">
                  REMAINING BLOCKS
                </span>
                <span className="text-xs text-[#E8421A] font-mono font-bold mt-1">
                  {Math.round((sessionSecondsLeft / (sessionDuration * 60)) * 100)}% COMPLETE
                </span>
              </div>
            </div>

            {/* Task Meta indicators labels */}
            <div className="flex flex-col gap-1 text-center max-w-sm">
              <span className="text-[10px] tracking-widest font-mono text-[#555] font-semibold">MISSION TARGET // ENGAGED</span>
              <h3 className="text-xl font-bold text-white max-w-xs">{missionTarget}</h3>
              {sessionIntention && (
                <p className="text-xs text-[#aaaaaa] mt-1 italic">"{sessionIntention}"</p>
              )}
            </div>
          </div>

          {/* Buttons trigger controls */}
          <div className="w-full flex flex-col gap-4 mt-auto">
            <div className="flex gap-3">
              <button
                id="btn-active-session-pause-resume"
                onClick={handlePauseToggle}
                className={`flex-1 py-4 rounded-xl font-mono font-bold text-xs tracking-widest cursor-pointer ${
                  isSessionPaused ? "bg-[#1DB954] text-white" : "bg-[#1a1a1a] text-[#aaaaaa] border border-[#222]"
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {isSessionPaused ? "RESUME DEEP WORK" : "PAUSE FLOW"}
              </button>
              <button
                id="btn-active-session-end"
                onClick={handleRequestEndSession}
                className="flex-1 py-4 rounded-xl border border-[#ff444450] bg-[#ff444415] text-[#ff4444] font-mono font-bold text-xs tracking-widest cursor-pointer hover:bg-[#ff444425]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {confirmEndState ? "CONFIRM SHUTDOWN?" : "END SESSION"}
              </button>
            </div>

            {/* Distraction logs counter label footer info */}
            <div className="text-center font-mono text-[9px] text-[#555] uppercase pb-2">
              {sessionDistractions > 0 ? (
                <span>DISTRACTIONS DETECTED: {sessionDistractions}</span>
              ) : (
                <span className="text-[#1DB954]">✓ NO DISTRACTIONS DETECTED — UNBREAKABLE CORE</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SESSION SUMMARY OVERLAY REPORT (z-index 400) */}
      {summaryOpen && finishedSessionObj && (
        <div id="session-review-modal" className="fixed inset-0 z-[400] bg-[#080808] flex flex-col justify-between px-6 py-8 text-left select-none scroll-vertical">
          <div id="session-summary-scroll-area" className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-6">
            
            {/* Header Title block */}
            <div className="text-center">
              <span className="text-3xl text-center self-center w-full block mb-2 select-item">🏆</span>
              <h2
                className={`text-2xl font-bold font-mono tracking-tight ${
                  finishedSessionObj.completed ? "text-[#1DB954]" : "text-[#aaaaaa]"
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {finishedSessionObj.completed ? "MISSION ACCOMPLISHED" : "SESSION DISCOVERY ENDED"}
              </h2>
              <span className="text-[10px] text-[#555] tracking-widest font-mono uppercase font-semibold">
                OPERATIONAL REVIEW LOGS
              </span>
            </div>

            {/* XP Award display board */}
            <div className="bg-[#0f0f0f] border border-[#222] rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-1.5 shadow-2xl relative overflow-hidden">
              <span className="text-[10px] text-[#C9952A] font-mono tracking-wider font-bold">SECURITY CLEARANCE REWARDS</span>
              <h3 className="text-4xl font-extrabold font-mono text-[#C9952A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                +{finishedSessionObj.xpEarned}<span> XP</span>
              </h3>
              <span className="text-[9px] text-[#555] tracking-widest font-mono select-none">EARNED FOR COMPLETED EFFORTS</span>
            </div>

            {/* Grid rows details logs */}
            <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4 flex flex-col gap-3 font-mono text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div className="flex justify-between border-b border-[#141414] pb-2 text-white">
                <span className="text-[#555] uppercase">TARGET TASK</span>
                <span className="font-bold max-w-[200px] truncate uppercase">{finishedSessionObj.task}</span>
              </div>
              <div className="flex justify-between border-b border-[#141414] pb-2 text-white">
                <span className="text-[#555] uppercase">CATEGORY TYPE</span>
                <span className="font-bold">{finishedSessionObj.category}</span>
              </div>
              <div className="flex justify-between border-b border-[#141414] pb-2 text-white">
                <span className="text-[#555] uppercase">PLANNED CYCLE</span>
                <span className="font-bold">{finishedSessionObj.plannedMins} Mins</span>
              </div>
              <div className="flex justify-between border-b border-[#141414] pb-2 text-white">
                <span className="text-[#555] uppercase">ACTUAL SYSTEM SPENT</span>
                <span className="font-bold text-[#C9952A]">{finishedSessionObj.actualMins} Mins</span>
              </div>
              <div className="flex justify-between border-b border-[#141414] pb-2 text-white">
                <span className="text-[#555] uppercase">DISTRACTION DETEC</span>
                <span className={`font-bold ${finishedSessionObj.distractions === 0 ? "text-[#1DB954]" : "text-[#ff4444]"}`}>
                  {finishedSessionObj.distractions}
                </span>
              </div>
              <div className="flex justify-between text-white pb-1">
                <span className="text-[#555] uppercase">INTEGRITY STATUS</span>
                <span className={`font-bold uppercase ${finishedSessionObj.completed ? "text-[#1DB954]" : "text-[#aaaaaa]"}`}>
                  {finishedSessionObj.completed ? "COMPLETED SECURE" : "PARTIAL ABORT"}
                </span>
              </div>
            </div>

            {/* Mood selector blocks */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-[#aaaaaa] uppercase font-mono tracking-widest font-bold">
                POST-SESSION FLOW INTENSITY RATING
              </label>
              <div className="flex gap-2 justify-between">
                {["😔", "😐", "🙂", "😊", "🔥"].map((emo) => (
                  <button
                    key={emo}
                    onClick={() => setPostMood(emo)}
                    className={`flex-1 py-3 text-lg rounded-xl border transition-all cursor-pointer ${
                      postMood === emo
                        ? "border-[#E8421A] bg-[#E8421A10]"
                        : "border-[#222] bg-[#0f0f0f]"
                    }`}
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </div>

            {/* Post comment logs block */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#aaaaaa] uppercase font-mono tracking-widest font-bold">
                DIARY PROGRESS NOTES (Optional)
              </label>
              <textarea
                id="post-session-notes-input"
                rows={2}
                placeholder="What went well? Any focus lapses?"
                value={postComments}
                onChange={(e) => setPostComments(e.target.value)}
                className="bg-[#0f0f0f] border border-[#222] rounded-xl p-3 text-white text-xs focus:ring-1 focus:ring-[#E8421A] focus:outline-none font-mono resize-none"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
          </div>

          <button
            id="btn-session-review-save-finalize"
            onClick={handleSaveReviewedSession}
            className="w-full bg-[#E8421A] hover:bg-opacity-95 text-white font-mono font-bold text-sm tracking-widest py-4.5 rounded-xl shadow-[0_5px_15px_rgba(232,66,26,0.25)] mt-4 cursor-pointer transition-all"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            FORGE COMPLETE // SECURE STATE ⚡
          </button>
        </div>
      )}

      {/* TAB 3: ANALYTICS & STATS PERFORMANCE */}
      {activeTab === "stats" && (
        <div id="stats-tab-panel" className="flex flex-col gap-5 p-5">
          <div id="stats-setup-header">
            <span className="text-[10px] text-[#aaaaaa] tracking-widest font-mono uppercase block mb-1">
              PERFORMANCE // ANALYTICS
            </span>
            <h1 className="text-2xl font-bold uppercase text-white tracking-widest">
              STATS
            </h1>
          </div>

          {/* Active Streak colored highlight */}
          {appState.streak > 0 && (
            <div className="bg-gradient-to-r from-[#E8421A] to-[#C9952A] rounded-2xl p-4 flex items-center justify-between text-white shadow-xl">
              <div>
                <h3 className="font-extrabold text-[#080808] text-lg uppercase leading-none">Streak Active 🔥</h3>
                <p className="text-[10px] font-mono text-[#080808] opacity-80 mt-1 font-bold">
                   UNBROKEN DAILY DISCIPLINE FLOW
                </p>
              </div>
              <div className="w-12 h-12 bg-[#08080825] border border-white rounded-full flex items-center justify-center font-mono font-bold text-lg">
                {appState.streak}
              </div>
            </div>
          )}

          {/* 2x2 stats performance matrix */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "SESSIONS COMPLETED", value: appState.sessions.length, icon: "🛡️" },
              {
                label: "COMPLETION RATE",
                value: appState.sessions.length === 0
                  ? "0%"
                  : `${Math.round((appState.sessions.filter((s: any) => s.completed).length / appState.sessions.length) * 100)}%`,
                icon: "📈",
              },
              { label: "TOTAL ATTENTION TIM", value: `${appState.totalMins}<span>M</span>`, icon: "⏱️" },
              { label: "AVERAGE SCORE", value: `${appState.focusScore}<span>%</span>`, icon: "🎯" },
            ].map((st, idx) => (
              <div key={idx} className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4 flex flex-col justify-between h-20 relative">
                <span className="text-[8px] text-[#aaaaaa] tracking-wider font-mono block uppercase">{st.label}</span>
                <div className="flex justify-between items-end">
                  <span
                    className="font-semibold text-lg font-mono text-white leading-none"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    dangerouslySetInnerHTML={{ __html: String(st.value) }}
                  />
                  <span className="text-sm select-none opacity-65">{st.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Weekly custom flex bars list and charts */}
          <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
            <span className="text-[9px] text-[#aaaaaa] tracking-widest font-mono uppercase font-bold block">
              WEEKLY DENSITY COMPOSITION (MINS)
            </span>
            <div className="flex justify-between items-end h-28 pt-4 w-full px-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((day, dIdx) => {
                const dayVal = appState.weeklyData[dIdx] || 0;
                const limitMax = Math.max(...appState.weeklyData, 60);
                const pct = Math.max(8, Math.round((dayVal / limitMax) * 100));
                
                // Highlight today's index in colored bar
                const currentDayIndex = new Date().getDay();
                const adjustedTodayIdx = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
                const isTodayActive = dIdx === adjustedTodayIdx;

                return (
                  <div key={dIdx} className="flex-1 flex flex-col items-center gap-1.5 h-full relative group">
                    <span className="absolute -top-4 opacity-0 group-hover:opacity-100 text-[8px] font-mono text-[#E8421A] transition-all bg-[#141414] px-1 py-0.5 rounded">
                      {dayVal}
                    </span>
                    <div className="flex-1 w-7 bg-[#141414] rounded-sm overflow-hidden flex items-end">
                      <div
                        className="w-full rounded-sm transition-all"
                        style={{
                          height: `${pct}%`,
                          backgroundColor: isTodayActive ? "#E8421A" : "#222222",
                          backgroundImage: isTodayActive
                            ? "linear-gradient(to top, #E8421A, #C9952A)"
                            : "none",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[#555] font-bold mt-1 font-mono">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Focus heatmap 56 visual grid representation cells */}
          <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4 flex flex-col gap-2">
            <span className="text-[9px] text-[#aaaaaa] tracking-widest font-mono uppercase font-bold block">
              MONK SYSTEM HEATMAP CELL HISTORIES
            </span>
            <div className="grid grid-cols-14 gap-1 w-full mt-2">
              {Array.from({ length: 56 }).map((_, cIdx) => {
                // Fake intensities patterns
                let depthLevel = 0;
                if (cIdx % 7 === 0) depthLevel = 1;
                if (cIdx % 9 === 0) depthLevel = 3;
                if (cIdx % 13 === 0) depthLevel = 2;
                if (cIdx % 19 === 0) depthLevel = 4;
                if (cIdx > 48) depthLevel = 0; // future Empty

                // Real sessions completed highlight active cells
                if (cIdx === 45 && appState.sessions.length > 0) depthLevel = 4;
                if (cIdx === 46 && appState.sessions.length > 1) depthLevel = 3;
                if (cIdx === 47 && appState.sessions.length > 2) depthLevel = 2;

                const colorBlocks = ["#121212", "rgba(232, 66, 26, 0.15)", "rgba(232, 66, 26, 0.4)", "rgba(232, 66, 26, 0.7)", "#E8421A"];
                return (
                  <div
                    key={cIdx}
                    className="aspect-square w-full rounded-sm border border-[#080808]"
                    style={{ backgroundColor: colorBlocks[depthLevel] }}
                    title={`Day level: ${depthLevel}`}
                  />
                );
              })}
            </div>
            {/* Heatmap legends info */}
            <div className="flex justify-end gap-1 items-center font-mono text-[8px] text-[#555] mt-2 font-bold select-none">
              <span>LESS</span>
              <div className="w-2 h-2 rounded-sm bg-[#121212] border" />
              <div className="w-2 h-2 rounded-sm bg-rgba-low bg-[#E8421A1a]" />
              <div className="w-2 h-2 rounded-sm bg-[#E8421A5a]" />
              <div className="w-2 h-2 rounded-sm bg-[#E8421Aaa]" />
              <div className="w-2 h-2 rounded-sm bg-[#E8421A]" />
              <span>MORE</span>
            </div>
          </div>

          {/* Focus identity details measurements */}
          <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
            <span className="text-[9px] text-[#aaaaaa] tracking-widest font-mono uppercase font-bold block">
              IDENTITY DIMENSION ATTRIBUTES
            </span>
            {[
              { title: "HABIT CONSISTENCY", score: Math.min(100, Math.max(30, appState.streak * 10 + 20)), col: "#1DB954" },
              { title: "FLOW SESSION DEPTH", score: Math.min(100, Math.max(45, Math.round(appState.deepWorkHours * 4 + 30))), col: "#C9952A" },
              { title: "ATTENTION DISCIPLINE", score: appState.focusScore, col: "#E8421A" },
            ].map((dm, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                  <span className="text-[#aaaaaa]">{dm.title}</span>
                  <span style={{ color: dm.col }}>{dm.score}<span>%</span></span>
                </div>
                <div className="w-full h-1.5 bg-[#171717] rounded-full overflow-hidden flex">
                  <div className="h-full rounded-full transition-all" style={{ width: `${dm.score}%`, backgroundColor: dm.col }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ENCRYPTED COACH DIALOGUES CHATS */}
      {activeTab === "coach" && (
        <div id="coach-tab-panel" className="flex flex-col h-full bg-[#0c0c0c] relative">
          
          {/* Top Panel identity bar */}
          <div className="p-4 bg-[#0f0f0f] border-b border-[#222] flex justify-between items-center z-10 sticky top-0">
            <div>
              <span className="text-[10px] text-[#aaaaaa] tracking-widest font-mono uppercase block">
                COMMS // ENCRYPTED
              </span>
              <h1 className="text-xl font-bold uppercase text-white tracking-widest mt-0.5">
                AI COACH
              </h1>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#22222240] border border-[#222] rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] live-dot" />
              <span className="text-[9px] font-mono font-bold tracking-widest text-white">FORGE_AI ONLINE</span>
            </div>
          </div>

          {/* Dialog bubble lists */}
          <div className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar flex flex-col gap-4 min-h-[400px]">
            {chatMessages.map((msg, mIdx) => {
              const isAi = msg.role === "assistant";
              return (
                <div
                  key={mIdx}
                  className={`flex flex-col max-w-[85%] ${isAi ? "self-start text-left" : "self-end text-right"}`}
                >
                  <span className="text-[8px] font-mono tracking-wider text-[#555] uppercase block mb-1">
                    {isAi ? "FORGE_AI // SENDER" : "OPERATOR // ACTIVE"}
                  </span>
                  <div
                    className={`py-3 px-4 rounded-xl text-xs font-mono border leading-relaxed ${
                      isAi
                        ? "bg-[#0f0f0f] border-[#222] text-[#f0f0f0] rounded-tl-sm shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
                        : "bg-[#E8421A10] border-[#E8421A40] text-[#f0f0f0] rounded-tr-sm"
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {/* Ellipse typing indicator loader */}
            {isCoachLoading && (
              <div className="flex flex-col self-start text-left max-w-[85%]">
                <span className="text-[8px] font-mono tracking-wider text-[#555] uppercase block mb-1">FORGE_AI // THINKING</span>
                <div className="py-2.5 px-4 rounded-xl bg-[#0f0f0f] border border-[#222] rounded-tl-sm">
                  <div className="flex gap-1.5 items-center h-4 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Prompt pills only shown initially */}
          {chatMessages.length === 1 && (
            <div className="px-4 py-3 flex flex-col gap-1.5 pb-6">
              <span className="text-[8px] text-[#555] uppercase font-mono tracking-widest font-bold">SUGGESTED DISPATCH COMMANDS</span>
              <div className="grid grid-cols-2 gap-2 text-left">
                {[
                  { text: "What's my peak focus time?", emoji: "⏱️" },
                  { text: "How do I beat procrastination?", emoji: "⛰️" },
                  { text: "Design my ideal morning", emoji: "🌅" },
                  { text: "I'm burning out — help", emoji: "🔥" },
                ].map((p, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSendCoachMsg(p.text)}
                    className="p-3 bg-[#0f0f0f] border border-[#1e1ea020] hover:border-[#1e1e1e] rounded-xl text-left text-xs font-mono text-white transition-all cursor-pointer shadow-sm select-none"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <span>{p.emoji}</span> {p.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Secure chat control bar (fixed at bottom: 72px) */}
          <div className="p-3.5 bg-[#0f0f0f] border-t border-[#222] absolute bottom-[0px] left-0 right-0 z-50 flex gap-2">
            <input
              id="coach-chat-input"
              type="text"
              placeholder="ASK COACH // ENTER COMMANDS"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendCoachMsg();
              }}
              className="flex-1 bg-[#090909] border border-[#222] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#E8421A] font-mono"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
            <button
              id="btn-coach-chat-send"
              disabled={!chatInput.trim() || isCoachLoading}
              onClick={() => handleSendCoachMsg()}
              className={`px-5 py-3 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                !chatInput.trim() || isCoachLoading
                  ? "bg-[#111] border border-[#222] text-[#555] cursor-not-allowed"
                  : "bg-gradient-to-r from-[#E8421A] to-[#C9952A] text-white"
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              SEND
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: OPERATOR PROFILE IDENTITY */}
      {activeTab === "identity" && (
        <div id="identity-tab-panel" className="flex flex-col gap-6 p-5">
          {/* Profile Identity Card */}
          <div className="flex flex-col items-center gap-2 mt-2 text-center relative">
            <div className="w-20 h-20 bg-[#121212] border-2 border-dashed border-[#E8421A] rounded-[24px] flex items-center justify-center text-4xl hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(232,66,26,0.15)] select-none">
              {profile.avatar}
            </div>
            
            <div className="flex flex-col gap-0.5 mt-2">
              <h2 className="text-xl font-extrabold uppercase text-white tracking-widest">
                {profile.firstName} {profile.lastName}
              </h2>
              <div className="flex gap-1.5 items-center justify-center font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span className="text-xs text-[#E8421A] font-bold">CLASSIFIED OPERATOR ID:</span>
                <span className="text-xs text-white tracking-wider bg-[#141414] px-2 py-0.5 rounded border border-[#222]">{profile.operatorId}</span>
              </div>
            </div>

            {profile.bio && (
              <p className="text-xs text-[#aaaaaa] italic max-w-sm border-l-2 border-[#C9952A] bg-[#0c0c0c] pl-3 py-1 bg-[#14141440] rounded-r text-left w-full mt-2 leading-relaxed">
                "{profile.bio}"
              </p>
            )}
          </div>

          {/* XP progressions levels indicator detailed metadata */}
          <div className="bg-[#0f0f0f] border border-[#222] rounded-2xl p-4 flex flex-col gap-3">
            <span className="text-[9px] text-[#aaaaaa] tracking-widest font-mono uppercase font-bold block">
              OPERANT RANK ENGINE EXP TRANSITIONS
            </span>
            <div className="flex justify-between items-center text-xs font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span className="text-white font-bold">{currentRank.name}</span>
              <span className="text-white font-bold">{nextRank.name}</span>
            </div>
            {/* ProgressBar info */}
            <div className="w-full h-2.5 bg-[#171717] rounded-full overflow-hidden flex">
              <div className="h-full rounded-full transition-all" style={{ width: `${xpProgressPercent}%`, backgroundColor: currentRank.color }} />
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-[#555] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span>CURRENT LEVEL: {currentRank.level}</span>
              <span>{appState.xp}<span> / </span>{nextRank.xpNeeded}<span> XP</span></span>
            </div>
          </div>

          {/* 3x2 Achievements unlocks grids */}
          <div className="flex flex-col gap-3">
            <span className="text-[9px] text-[#aaaaaa] tracking-widest font-mono uppercase font-bold block">
              OPERATIONAL ACHIEVEMENTS SYSTEM
            </span>
            
            <div className="grid grid-cols-2 gap-3">
              {appState.achievements.map((ach: any) => (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all select-none relative ${
                    ach.unlocked
                      ? "border-[#C9952A] bg-[#C9952A05] opacity-100 shadow-[0_3px_12px_rgba(201,149,42,0.06)]"
                      : "border-[#222] bg-[#0c0c0c] opacity-30"
                  }`}
                >
                  <div className="text-3xl filter saturate-150">{ach.icon}</div>
                  <h4 className="text-white font-bold font-mono text-xs uppercase uppercase mt-1 leading-none">{ach.name}</h4>
                  <p className="text-[10px] text-[#aaaaaa] leading-tight font-mono leading-none mt-0.5">{ach.desc}</p>
                  
                  {ach.unlocked && (
                    <span className="absolute top-2 right-2 text-[8px] bg-[#C9952A] text-black px-1 py-0.2 rounded font-mono font-bold">
                       UNLOCKED
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Options System Configuration rows list */}
          <div className="bg-[#0f0f0f] border border-[#222] rounded-xl overflow-hidden flex flex-col font-mono text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <button className="flex justify-between items-center px-4 py-3.5 border-b border-[#1c1c1c] text-left text-white hover:bg-[#121212] transition-colors cursor-pointer select-none">
              <span className="flex items-center gap-3">
                <span>🛡️</span> Privacy & Encryption Lockdown
              </span>
              <span className="text-[#555]">⟶</span>
            </button>
            <button className="flex justify-between items-center px-4 py-3.5 border-b border-[#1c1c1c] text-left text-white hover:bg-[#121212] transition-colors cursor-pointer select-none">
              <span className="flex items-center gap-3">
                <span>⚙️</span> Interactive Haptic Controls
              </span>
              <span className="text-[#555]">⟶</span>
            </button>
            <button className="flex justify-between items-center px-4 py-3.5 text-left text-white hover:bg-[#121212] transition-colors cursor-pointer select-none">
              <span className="flex items-center gap-3">
                <span>💾</span> Export Operator Cloud Identities
              </span>
              <span className="text-[#555]">⟶</span>
            </button>
          </div>

          {/* Secure destructive Log Out action triggers Onboarding Splash */}
          <button
            id="btn-identity-logout-deauth"
            onClick={onLogOut}
            className="w-full bg-transparent border border-[#ff444450] hover:bg-[#ff444415] text-[#ff4444] font-mono font-bold text-xs tracking-widest py-4 rounded-xl cursor-pointer transition-all mt-4 mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            DE-AUTHORIZE OPERATOR IDENTITY // LOG OUT
          </button>
        </div>
      )}

      {/* FOOTER TAB BAR CONTROL ROW (72px height fixed at bottom layout) */}
      <nav id="app-footer-navigation" className="fixed bottom-0 left-0 right-0 h-[72px] bg-[#0c0c0c]/90 border-t border-[#222] flex justify-around items-center z-[100] backdrop-blur-md">
        
        {/* Colorful top-of-nav gradient lines highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-[#E8421A] via-[#C9952A] to-[#E8421A] opacity-60" />

        {[
          { id: "forge", label: "FORGE", icon: "⚒️" },
          { id: "focus", label: "FOCUS", icon: "🎯" },
          { id: "stats", label: "STATS", icon: "📊" },
          { id: "coach", label: "COACH", icon: "🧠" },
          { id: "identity", label: "OPERATOR", icon: "👁️" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center flex-1 h-full relative cursor-pointer group"
            >
              {/* Highlight background dot glow active */}
              {isActive && (
                <div className="absolute top-2 w-7 h-7 bg-[#E8421A33] rounded-full blur-[8px] pointer-events-none" />
              )}
              <span className={`text-[20px] filter saturate-150 transition-transform ${isActive ? "scale-110 translate-y-[-2px]" : "group-hover:scale-105"}`}>
                {tab.icon}
              </span>
              <span
                className={`text-[8px] font-mono tracking-wider font-bold uppercase mt-1 transition-all ${
                  isActive ? "text-[#E8421A]" : "text-[#aaaaaa]"
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
