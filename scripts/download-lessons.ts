import fs from 'fs';
import path from 'path';

// Define our constants directly to avoid TS import mapping issues in this simple script
const PLAYLIST = [
  { id: 'calc-1', subj: 'calc', unit: 1, lesson: 1, title: 'Limits & Continuity', desc: 'The foundation of calculus — what limits mean and how continuity works.' },
  { id: 'chem-1', subj: 'chem', unit: 1, lesson: 1, title: 'Atomic Structure & Electron Configuration', desc: 'Orbitals, quantum numbers, and periodic trends.' },
  { id: 'hist-1', subj: 'hist', unit: 1, lesson: 1, title: 'Pre-Columbian to Early Contact (1491–1607)', desc: 'Pre-Columbian societies, Spanish conquest, and early European contact.' },
  { id: 'phys-1', subj: 'phys', unit: 1, lesson: 1, title: 'Kinematics & Linear Motion', desc: 'Displacement, velocity, acceleration, and the kinematic equations.' },
  { id: 'csp-1',  subj: 'csp',  unit: 1, lesson: 1, title: 'Abstraction & Problem Decomposition', desc: 'Breaking complex problems into solvable pieces — the core CS mindset.' },
  { id: 'calc-2', subj: 'calc', unit: 2, lesson: 1, title: 'Differentiation: Definition & Rules', desc: 'Power rule, product rule, quotient rule, chain rule.' },
  { id: 'chem-2', subj: 'chem', unit: 2, lesson: 1, title: 'Chemical Bonding & Molecular Geometry', desc: 'Ionic vs. covalent bonds, VSEPR theory, and polarity.' },
  { id: 'hist-2', subj: 'hist', unit: 2, lesson: 1, title: 'Colonial America & British Tensions (1607–1754)', desc: 'Jamestown, Puritan settlers, salutary neglect, Navigation Acts.' },
  { id: 'phys-2', subj: 'phys', unit: 2, lesson: 1, title: "Newton's Laws of Motion", desc: 'F=ma, inertia, and action-reaction pairs.' },
  { id: 'csp-2',  subj: 'csp',  unit: 2, lesson: 1, title: 'Algorithms & Pseudocode', desc: 'Writing and evaluating algorithms — the language of computing.' },
  { id: 'calc-3', subj: 'calc', unit: 3, lesson: 1, title: 'Derivative Applications', desc: 'Related rates, optimization, curve sketching.' },
  { id: 'chem-3', subj: 'chem', unit: 3, lesson: 1, title: 'Intermolecular Forces & States of Matter', desc: 'Van der Waals, hydrogen bonding, and phase changes.' },
  { id: 'hist-3', subj: 'hist', unit: 3, lesson: 1, title: 'The American Revolution (1754–1789)', desc: 'Causes, key events, Declaration, constitutional foundations.' },
  { id: 'phys-3', subj: 'phys', unit: 3, lesson: 1, title: 'Work, Energy & Power', desc: 'Conservative forces, kinetic/potential energy, work-energy theorem.' },
  { id: 'csp-3',  subj: 'csp',  unit: 3, lesson: 1, title: 'Variables, Data Types & Expressions', desc: 'How computers store and manipulate data.' },
  { id: 'calc-4', subj: 'calc', unit: 4, lesson: 1, title: 'Integration: Riemann Sums & the FTC', desc: 'Antiderivatives, definite integrals, Fundamental Theorem of Calculus.' },
  { id: 'chem-4', subj: 'chem', unit: 4, lesson: 1, title: 'Stoichiometry & Chemical Reactions', desc: 'Mole ratios, limiting reagents, and percent yield.' },
  { id: 'hist-4', subj: 'hist', unit: 4, lesson: 1, title: 'The Early Republic (1789–1824)', desc: 'Federalists vs Anti-Federalists, Washington, sectional tensions.' },
  { id: 'phys-4', subj: 'phys', unit: 4, lesson: 1, title: 'Momentum & Impulse', desc: 'Conservation of momentum, collisions, impulse-momentum theorem.' },
  { id: 'csp-4',  subj: 'csp',  unit: 4, lesson: 1, title: 'Boolean Logic & Conditionals', desc: 'AND/OR/NOT, truth tables, and if-else decision making.' },
  { id: 'calc-5', subj: 'calc', unit: 5, lesson: 1, title: 'Integration Techniques', desc: 'U-substitution, integration by parts, partial fractions.' },
  { id: 'chem-5', subj: 'chem', unit: 5, lesson: 1, title: 'Thermodynamics & Enthalpy', desc: "Hess's Law, enthalpy of formation, calorimetry." },
  { id: 'hist-5', subj: 'hist', unit: 5, lesson: 1, title: 'Manifest Destiny & Sectional Conflict (1824–1860)', desc: 'Westward expansion, slavery debates, road to Civil War.' },
  { id: 'phys-5', subj: 'phys', unit: 5, lesson: 1, title: 'Simple Harmonic Motion & Waves', desc: 'Springs, pendulums, wave properties, superposition.' },
  { id: 'csp-5',  subj: 'csp',  unit: 5, lesson: 1, title: 'Lists, Loops & Iteration', desc: 'Traversing data structures and repeating operations.' },
  { id: 'calc-6', subj: 'calc', unit: 6, lesson: 1, title: 'Differential Equations & Slope Fields', desc: 'Separable equations, Euler\'s method, exponential models.' },
  { id: 'chem-6', subj: 'chem', unit: 6, lesson: 1, title: "Equilibrium & Le Châtelier's Principle", desc: 'Dynamic equilibrium, Keq expressions, shifting equilibria.' },
  { id: 'hist-6', subj: 'hist', unit: 6, lesson: 1, title: 'Civil War & Reconstruction (1860–1877)', desc: 'Causes, key battles, Emancipation, Reconstruction amendments.' },
  { id: 'phys-6', subj: 'phys', unit: 6, lesson: 1, title: 'Electric Charge, Fields & Potential', desc: "Coulomb's Law, electric field lines, potential energy." },
  { id: 'csp-6',  subj: 'csp',  unit: 6, lesson: 1, title: 'Functions & Procedures', desc: 'Modular programming, parameters, return values, recursion basics.' },
  { id: 'calc-7', subj: 'calc', unit: 7, lesson: 1, title: 'Sequences & Infinite Series', desc: 'Convergence tests, Taylor series, power series.' },
  { id: 'chem-7', subj: 'chem', unit: 7, lesson: 1, title: 'Acids, Bases & Buffers', desc: 'pH, Ka/Kb, buffer calculations, acid-base titrations.' },
  { id: 'hist-7', subj: 'hist', unit: 7, lesson: 1, title: 'Industrialization & the Gilded Age (1877–1900)', desc: 'Big business, labor movements, immigration, Progressive roots.' },
  { id: 'phys-7', subj: 'phys', unit: 7, lesson: 1, title: "DC Circuits & Ohm's Law", desc: "Resistance, series/parallel circuits, Kirchhoff's Laws." },
  { id: 'csp-7',  subj: 'csp',  unit: 7, lesson: 1, title: 'The Internet & How It Works', desc: 'Packets, protocols, IP/TCP, DNS, and network security.' },
  { id: 'calc-8', subj: 'calc', unit: 8, lesson: 1, title: 'Parametric, Polar & Vector Functions', desc: 'Parametric curves, polar coordinates, vector-valued derivatives.' },
  { id: 'chem-8', subj: 'chem', unit: 8, lesson: 1, title: 'Electrochemistry & Redox', desc: 'Oxidation states, galvanic cells, Nernst equation.' },
  { id: 'hist-8', subj: 'hist', unit: 8, lesson: 1, title: 'Imperialism, WWI & the Interwar Years (1898–1939)', desc: 'American expansionism, isolationism, the Great Depression.' },
  { id: 'phys-8', subj: 'phys', unit: 8, lesson: 1, title: 'Magnetism & Electromagnetic Induction', desc: "Magnetic fields, Faraday's Law, Lenz's Law." },
  { id: 'csp-8',  subj: 'csp',  unit: 8, lesson: 1, title: 'Data, Privacy & Cybersecurity', desc: 'Data collection, encryption, digital rights, ethical computing.' },
  { id: 'calc-9', subj: 'calc', unit: 9, lesson: 1, title: 'Calc BC: Exam Strategy & FRQ Practice', desc: 'High-yield strategies and common free-response patterns.' },
  { id: 'chem-9', subj: 'chem', unit: 9, lesson: 1, title: 'Chem: Exam Strategy & Lab Analysis', desc: 'Reading experimental data, error analysis, FRQ tactics.' },
  { id: 'hist-9', subj: 'hist', unit: 9, lesson: 1, title: 'WWII to Modern America (1939–Present)', desc: 'Cold War, Civil Rights, Vietnam, contemporary US history.' },
  { id: 'phys-9', subj: 'phys', unit: 9, lesson: 1, title: 'Physics 1: Exam Review & Key Formulas', desc: 'Most-tested concepts and strategies for the AP Physics 1 exam.' },
  { id: 'csp-9',  subj: 'csp',  unit: 9, lesson: 1, title: 'CSP: Exam Walkthrough & Create Task Tips', desc: 'MCQ strategies, FRQ expectations, Create Performance Task guide.' },
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  const resultData: Record<string, string> = {};
  
  // Try to load existing data
  const OUT_PATH = path.join(process.cwd(), 'lib', 'lesson-data.json');
  if (fs.existsSync(OUT_PATH)) {
    Object.assign(resultData, JSON.parse(fs.readFileSync(OUT_PATH, 'utf8')));
  }

  console.log('Starting parallel offline generation of lessons to', OUT_PATH);

  for (let i = 0; i < PLAYLIST.length; i++) {
    const l = PLAYLIST[i];
    if (resultData[l.id]) {
      console.log(`[${i+1}/${PLAYLIST.length}] ${l.id} - ALREADY EXISTS! Skipping.`);
      continue;
    }

    console.log(`[${i+1}/${PLAYLIST.length}] Fetching ${l.id}...`);
    try {
      const res = await fetch('http://localhost:3000/api/lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lessonId: l.id })
      });

      const json = await res.json();
      if (json.text) {
        resultData[l.id] = json.text;
        fs.writeFileSync(OUT_PATH, JSON.stringify(resultData, null, 2));
        console.log(`  -> SUCCESS! Wrote ${l.id} to disk.`);
      } else {
        console.log(`  -> FAILED! No text block found.`);
      }
    } catch(err: any) {
      console.log(`  -> FAILED: ${err.message}`);
    }

    // sleep slightly to prevent extreme DDOSing yourself/openrouter
    await sleep(2000);
  }

  console.log('Completed.');
}

main();
