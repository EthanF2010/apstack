export type Subject = 'chem' | 'phys' | 'hist' | 'csp' | 'calc'

export interface Lesson {
  id: string
  subj: Subject
  title: string
  desc: string
}

export const SUBJECTS: Record<Subject, { label: string; short: string; color: string; accent: string }> = {
  chem: { label: 'AP Chemistry',    short: 'Chem',  color: 'bg-teal-500/10 text-teal-300 border-teal-500/30',   accent: '#2dd4bf' },
  phys: { label: 'AP Physics 1',    short: 'Phys',  color: 'bg-blue-500/10 text-blue-300 border-blue-500/30',   accent: '#60a5fa' },
  hist: { label: 'APUSH',           short: 'APUSH', color: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30', accent: '#fbbf24' },
  csp:  { label: 'AP CSP',          short: 'CSP',   color: 'bg-green-500/10 text-green-300 border-green-500/30',  accent: '#4ade80' },
  calc: { label: 'AP Calc BC',      short: 'Calc',  color: 'bg-purple-500/10 text-purple-300 border-purple-500/30', accent: '#c084fc' },
}

export const PLAYLIST: Lesson[] = [
  // Block 1 — Foundations
  { id: 'calc-1', subj: 'calc', title: 'Limits & Continuity',                     desc: 'The foundation of calculus — what limits mean and how continuity works.' },
  { id: 'chem-1', subj: 'chem', title: 'Atomic Structure & Electron Configuration',desc: 'Orbitals, quantum numbers, and periodic trends.' },
  { id: 'hist-1', subj: 'hist', title: 'Pre-Columbian to Early Contact (1491–1607)',desc: 'Pre-Columbian societies, Spanish conquest, and early European contact.' },
  { id: 'phys-1', subj: 'phys', title: 'Kinematics & Linear Motion',              desc: 'Displacement, velocity, acceleration, and the kinematic equations.' },
  { id: 'csp-1',  subj: 'csp',  title: 'Abstraction & Problem Decomposition',     desc: 'Breaking complex problems into solvable pieces — the core CS mindset.' },
  // Block 2
  { id: 'calc-2', subj: 'calc', title: 'Differentiation: Definition & Rules',     desc: 'Power rule, product rule, quotient rule, chain rule.' },
  { id: 'chem-2', subj: 'chem', title: 'Chemical Bonding & Molecular Geometry',   desc: 'Ionic vs. covalent bonds, VSEPR theory, and polarity.' },
  { id: 'hist-2', subj: 'hist', title: 'Colonial America & British Tensions (1607–1754)', desc: 'Jamestown, Puritan settlers, salutary neglect, Navigation Acts.' },
  { id: 'phys-2', subj: 'phys', title: "Newton's Laws of Motion",                 desc: 'F=ma, inertia, and action-reaction pairs.' },
  { id: 'csp-2',  subj: 'csp',  title: 'Algorithms & Pseudocode',                 desc: 'Writing and evaluating algorithms — the language of computing.' },
  // Block 3
  { id: 'calc-3', subj: 'calc', title: 'Derivative Applications',                 desc: 'Related rates, optimization, curve sketching.' },
  { id: 'chem-3', subj: 'chem', title: 'Intermolecular Forces & States of Matter',desc: 'Van der Waals, hydrogen bonding, and phase changes.' },
  { id: 'hist-3', subj: 'hist', title: 'The American Revolution (1754–1789)',      desc: 'Causes, key events, Declaration, constitutional foundations.' },
  { id: 'phys-3', subj: 'phys', title: 'Work, Energy & Power',                    desc: 'Conservative forces, kinetic/potential energy, work-energy theorem.' },
  { id: 'csp-3',  subj: 'csp',  title: 'Variables, Data Types & Expressions',     desc: 'How computers store and manipulate data.' },
  // Block 4
  { id: 'calc-4', subj: 'calc', title: 'Integration: Riemann Sums & the FTC',     desc: 'Antiderivatives, definite integrals, Fundamental Theorem of Calculus.' },
  { id: 'chem-4', subj: 'chem', title: 'Stoichiometry & Chemical Reactions',      desc: 'Mole ratios, limiting reagents, and percent yield.' },
  { id: 'hist-4', subj: 'hist', title: 'The Early Republic (1789–1824)',           desc: 'Federalists vs Anti-Federalists, Washington, sectional tensions.' },
  { id: 'phys-4', subj: 'phys', title: 'Momentum & Impulse',                      desc: 'Conservation of momentum, collisions, impulse-momentum theorem.' },
  { id: 'csp-4',  subj: 'csp',  title: 'Boolean Logic & Conditionals',            desc: 'AND/OR/NOT, truth tables, and if-else decision making.' },
  // Block 5
  { id: 'calc-5', subj: 'calc', title: 'Integration Techniques',                  desc: 'U-substitution, integration by parts, partial fractions.' },
  { id: 'chem-5', subj: 'chem', title: 'Thermodynamics & Enthalpy',               desc: "Hess's Law, enthalpy of formation, calorimetry." },
  { id: 'hist-5', subj: 'hist', title: 'Manifest Destiny & Sectional Conflict (1824–1860)', desc: 'Westward expansion, slavery debates, road to Civil War.' },
  { id: 'phys-5', subj: 'phys', title: 'Simple Harmonic Motion & Waves',          desc: 'Springs, pendulums, wave properties, superposition.' },
  { id: 'csp-5',  subj: 'csp',  title: 'Lists, Loops & Iteration',                desc: 'Traversing data structures and repeating operations.' },
  // Block 6
  { id: 'calc-6', subj: 'calc', title: 'Differential Equations & Slope Fields',   desc: 'Separable equations, Euler\'s method, exponential models.' },
  { id: 'chem-6', subj: 'chem', title: "Equilibrium & Le Châtelier's Principle",  desc: 'Dynamic equilibrium, Keq expressions, shifting equilibria.' },
  { id: 'hist-6', subj: 'hist', title: 'Civil War & Reconstruction (1860–1877)',   desc: 'Causes, key battles, Emancipation, Reconstruction amendments.' },
  { id: 'phys-6', subj: 'phys', title: 'Electric Charge, Fields & Potential',     desc: "Coulomb's Law, electric field lines, potential energy." },
  { id: 'csp-6',  subj: 'csp',  title: 'Functions & Procedures',                  desc: 'Modular programming, parameters, return values, recursion basics.' },
  // Block 7
  { id: 'calc-7', subj: 'calc', title: 'Sequences & Infinite Series',             desc: 'Convergence tests, Taylor series, power series.' },
  { id: 'chem-7', subj: 'chem', title: 'Acids, Bases & Buffers',                  desc: 'pH, Ka/Kb, buffer calculations, acid-base titrations.' },
  { id: 'hist-7', subj: 'hist', title: 'Industrialization & the Gilded Age (1877–1900)', desc: 'Big business, labor movements, immigration, Progressive roots.' },
  { id: 'phys-7', subj: 'phys', title: "DC Circuits & Ohm's Law",                 desc: "Resistance, series/parallel circuits, Kirchhoff's Laws." },
  { id: 'csp-7',  subj: 'csp',  title: 'The Internet & How It Works',             desc: 'Packets, protocols, IP/TCP, DNS, and network security.' },
  // Block 8
  { id: 'calc-8', subj: 'calc', title: 'Parametric, Polar & Vector Functions',    desc: 'Parametric curves, polar coordinates, vector-valued derivatives.' },
  { id: 'chem-8', subj: 'chem', title: 'Electrochemistry & Redox',                desc: 'Oxidation states, galvanic cells, Nernst equation.' },
  { id: 'hist-8', subj: 'hist', title: 'Imperialism, WWI & the Interwar Years (1898–1939)', desc: 'American expansionism, isolationism, the Great Depression.' },
  { id: 'phys-8', subj: 'phys', title: 'Magnetism & Electromagnetic Induction',   desc: "Magnetic fields, Faraday's Law, Lenz's Law." },
  { id: 'csp-8',  subj: 'csp',  title: 'Data, Privacy & Cybersecurity',           desc: 'Data collection, encryption, digital rights, ethical computing.' },
  // Block 9 — Exam Prep
  { id: 'calc-9', subj: 'calc', title: 'Calc BC: Exam Strategy & FRQ Practice',   desc: 'High-yield strategies and common free-response patterns.' },
  { id: 'chem-9', subj: 'chem', title: 'Chem: Exam Strategy & Lab Analysis',      desc: 'Reading experimental data, error analysis, FRQ tactics.' },
  { id: 'hist-9', subj: 'hist', title: 'WWII to Modern America (1939–Present)',    desc: 'Cold War, Civil Rights, Vietnam, contemporary US history.' },
  { id: 'phys-9', subj: 'phys', title: 'Physics 1: Exam Review & Key Formulas',   desc: 'Most-tested concepts and strategies for the AP Physics 1 exam.' },
  { id: 'csp-9',  subj: 'csp',  title: 'CSP: Exam Walkthrough & Create Task Tips',desc: 'MCQ strategies, FRQ expectations, Create Performance Task guide.' },
]
