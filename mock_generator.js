/* ── MOCK DATA GENERATOR FOR INDIVIDUAL SUPPORT PLANS ── */

const SCHOOLS = [
  "Swinton", "Bebington", "North Manchester", "Hillside", "Portland", "Woodslee", "Rathbone", "Connell",
  "Beckfield", "Broadhurst", "Brownhill", "Clarice Cliff", "Friarswood", "Glebe", "Grove", "Hamilton",
  "Medlock", "New Islington", "Nightingale", "Northwood", "Oakwood", "Parkland", "Penny Oaks", "Princeville",
  "Smithies Moor", "Woodlands", "Belle Vue", "Failsworth", "Florence MacWilliams", "Grange", "Leeds",
  "Manchester", "Priesthorpe", "Stoke-on-Trent", "Walkden", "Brierley", "Delius", "Southfield"
];

const FIRST_NAMES_MALE = ["Liam", "Noah", "Oliver", "Elijah", "James", "William", "Benjamin", "Lucas", "Henry", "Alexander", "Mason", "Michael", "Ethan", "Daniel", "Jacob", "Logan", "Jackson", "Levi", "Sebastian", "Mateo", "Jack", "Owen", "Theodore", "Aiden", "Samuel", "Joseph", "John", "David", "Wyatt", "Carter"];
const FIRST_NAMES_FEMALE = ["Olivia", "Emma", "Charlotte", "Amelia", "Sophia", "Isabella", "Ava", "Mia", "Evelyn", "Harper", "Luna", "Camila", "Gianna", "Elizabeth", "Eleanor", "Ella", "Abigail", "Sofia", "Avery", "Scarlett", "Emily", "Aria", "Penelope", "Chloe", "Layla", "Mila", "Nora", "Hazel", "Madison", "Lily"];
const LAST_NAMES = ["Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Johnson", "Davies", "Robinson", "Wright", "Thompson", "Evans", "Walker", "White", "Roberts", "Green", "Hall", "Wood", "Jackson", "Clarke", "Patel", "Khan", "Singh", "Kumar", "Ali", "Begum", "Ahmed", "Hassan", "Yusuf", "Osei", "Silva", "García", "Rossi", "Ivanov", "Kowalski", "Morales", "Santos", "Costa", "Agyeman", "Tanaka", "Mullins", "Broadbent", "Chowdhury", "Fiddler", "Oakes", "Welborn", "Burchett", "Sowter", "Hendley", "Amery"];

function generateStudent(school, idx, level) {
  // Simple hash or seed based on school and index to make generation deterministic
  const seed = school.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + idx;
  const isMale = seed % 2 === 0;
  const fNames = isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
  const fname = fNames[seed % fNames.length];
  const lname = LAST_NAMES[(seed * 7) % LAST_NAMES.length];
  const fullName = `${fname} ${lname}`;
  
  const sex = isMale ? "Male" : "Female";
  const arborId = 20000 + SCHOOLS.indexOf(school) * 10 + idx;
  const upn = 800000000000 + SCHOOLS.indexOf(school) * 100000 + idx * 10000 + (seed % 10000);
  
  // Year group and form (primary vs secondary vs special vs post-16)
  let yearNum = (seed % 5) + 7; // default secondary Year 7-11
  
  // Customise year groups based on school type context
  if (["Beckfield", "Broadhurst", "Clarice Cliff", "Friarswood", "Glebe", "Grove", "Hamilton", "Medlock", "New Islington", "Nightingale", "Northwood", "Oakwood", "Parkland", "Penny Oaks", "Portland", "Princeville", "Smithies Moor", "Woodlands", "Woodslee", "Hillside"].includes(school)) {
    yearNum = (seed % 4) + 3; // primary Year 3-6
  } else if (school === "Connell") {
    yearNum = (seed % 2) + 12; // Post-16 Year 12-13
  }
  
  const year = `Year ${yearNum}`;
  const form = `${yearNum}T${(seed % 3) + 1}`;
  
  // DOB based on year group
  const birthYear = 2026 - (yearNum + 5); 
  const dob = `${birthYear}-0${(seed % 9) + 1}-1${seed % 9}`;
  
  // FSM and PP
  const fsm = seed % 3 === 0 ? "Yes" : "No";
  const pp = fsm === "Yes" || seed % 4 === 0 ? "Yes" : "No";
  
  // SEN Status mapping
  let senStatus = "";
  if (level.startsWith("E")) senStatus = "Education, Health and Care Plan";
  else if (level === "K+" || level === "K") senStatus = "SEN Support";
  else if (level === "M") senStatus = "Monitoring";
  else senStatus = "No Special Educational Need";
  
  return {
    "Arbor ID": arborId,
    "UPN": upn,
    "School": school,
    "Pupil Name": fullName,
    "NC Year": year,
    "Date of Birth": dob,
    "Form": form,
    "Sex": sex,
    "Key Stage": yearNum >= 12 ? "Post-16" : yearNum >= 10 ? "Key Stage 4" : "Key Stage 3",
    "FSM": fsm,
    "PP": pp,
    "KSS/PKSS": "",
    "SEN Status": senStatus,
    "Ethnicity": "White - British",
    "GRT": "No",
    "EAL": seed % 5 === 0 ? "Yes" : "No",
    "Behaviour Points": seed % 7 === 0 ? -((seed % 4) + 1) * 5 : ((seed % 6) + 1) * 15 + (seed % 20),
    "Attendance This Term": 0.83 + (seed % 16) / 100,
    "Attendance Last Term": 0.81 + (seed % 18) / 100,
    "Suspensions this Year": seed % 7 === 0 ? (seed % 3 === 0 ? 2 : 1) : 0,
    "Suspensions Last Year": seed % 9 === 0 ? 1 : 0,
    "Internal Exclusions this Year": seed % 7 === 0 ? (seed % 2) + 1 : 0,
    "Lead Responsible": level.startsWith("E") ? "SEND Team" : "Pastoral team"
  };
}

function generateISP(student, level) {
  const arborId = String(student["Arbor ID"]);
  const id = `isp-${arborId}`;
  
  let diagnoses = "";
  let summary = "";
  let areas = [];
  let strengths = {};
  let needs = {};
  let advice = {};
  let health = {};
  let targets = [];
  let provisions = {};
  let strategies = {};
  let seating = {};
  let voices = { pupil: "", parent: "" };
  let apdr = [];
  let reviewedDate = "2026-05-15"; // default recently reviewed date
  
  if (level === "E1") {
    // EHCP, Due for review, High Speech & Language need
    reviewedDate = "2026-01-15"; // January 2026 (prior to Apr 2026 boundary, making it due for review)
    diagnoses = "EHCP — Severe Speech, Language and Communication Need (SLCN), global developmental delay";
    summary = `${student["Pupil Name"]} has a statutory EHCP for severe speech, language, and communication needs. They are a cooperative student who works best with direct visual cues and 1:1 adult communication support.`;
    areas = ["slc", "executive"];
    strengths = {
      slc: "Communicates basic needs effectively using visual symbols.",
      executive: "Enjoys visual learning aids, puzzles, and structured physical tasks."
    };
    needs = {
      slc: "Expressive language is limited; struggles to form multi-word sentences.",
      executive: "Struggles to retain multi-step instructions due to global delay."
    };
    advice = {
      slc: "Speech and Language Therapist (SALT) report Dec 2025.",
      executive: "Educational Psychology assessment Jan 2026."
    };
    health = {
      health: "Speech and language delay. Auditory processing checks normal. No medications.",
      social: "Early Help plan in place for family support.",
      ehcp: "EHCP in place",
      links: ""
    };
    targets = [
      { area: "Speech, language and communication", outcome: `For ${student["Pupil Name"]} to construct 3-word sentences using communication boards.`, smart: "By the end of this term, during structured classroom sessions, they will use PECS/communication board to request equipment or help using 3 symbols on 4 out of 5 observed tasks." },
      { area: "Executive function", outcome: `For ${student["Pupil Name"]} to follow 2-step task sequences.`, smart: "Within 6 weeks, using visual task boards, they will independently complete a 2-step sequence (retrieve book -> sit down) with no more than 1 prompting reminder." }
    ];
    provisions = {
      0: { desc: "1:1 Speech Therapy intervention with SALT Assistant.", by: "SALT Assistant / SENCO", freq: "Weekly, 30 min", cost: "£950/term — EHCP Funding" },
      1: { desc: "Dedicated LSA in core classes for visual card instruction and communication scaffolding.", by: "Named LSA", freq: "Daily", cost: "£14,500/year — EHCP funding" }
    };
    strategies = {
      slc: "Use visual communication board. Speak clearly in short sentences. Allow 10 seconds processing time.",
      executive: "Use visual task board on desk. Chunk tasks into single steps. Check for understanding by asking for visual verification."
    };
    seating = { slc: "Seated facing the teacher, near the visual instructions board." };
    voices = {
      pupil: "I like draw. School is good. I like my book.",
      parent: "We are pleased with the support. We want them to develop more speech so they don't get frustrated at home."
    };
    apdr = [
      {
        date: "15 Jan 2026",
        target: 0,
        progress: "some",
        schoolComment: "Speech therapist reports progress using PECS at lunch, but struggles to transfer this to busy classroom environments.",
        parentComment: "They are still quite frustrated at home when trying to express complex thoughts.",
        nextSteps: "Schedule full annual review. Speech Therapist to adjust target sounds.",
        by: "SEND Team — by 15 May 2026"
      }
    ];
  } else if (level === "E2") {
    // EHCP, Recently reviewed, Autism & Sensory Processing
    reviewedDate = "2026-05-12"; // May 2026 (inside current term)
    diagnoses = "EHCP — Autism Spectrum Condition (ASC), severe sensory processing difficulties";
    summary = `${student["Pupil Name"]} has an EHCP for ASC and severe sensory processing needs. They are highly intelligent but experience extreme noise and sensory overload in busy spaces, requiring structured sensory diet interventions.`;
    areas = ["sensory", "social"];
    strengths = {
      sensory: "Able to recognize when they are feeling overwhelmed and self-advocates for a break.",
      social: "Enjoys 1:1 interactions with a small, familiar group of peers."
    };
    needs = {
      sensory: "Hyper-sensitive to noise, bright lights, and sudden transitions.",
      social: "High anxiety during group work or unstructured social times (canteen, corridors)."
    };
    advice = {
      sensory: "Occupational Therapy (OT) report Jan 2026.",
      social: "Autism Outreach Specialist consultation Feb 2026."
    };
    health = {
      health: "Autism spectrum condition. Hyper-reactivity to sensory stimuli. Wears ear defenders in loud spaces.",
      social: "No current social care involvement.",
      ehcp: "EHCP in place",
      links: ""
    };
    targets = [
      { area: "Sensory", outcome: `For ${student["Pupil Name"]} to regulate their sensory arousal state independently using agreed tools.`, smart: "By the end of this term, they will independently use their sensory pass to access the quiet space before reaching high anxiety levels, as logged by the inclusion team." },
      { area: "Social and emotional", outcome: `For ${student["Pupil Name"]} to manage transitions between class periods with low anxiety.`, smart: "Within 6 weeks, using a structured visual timetable and early transition pass, they will move between classes 5 minutes before the bell on all school days with reported anxiety below 4/10." }
    ];
    provisions = {
      0: { desc: "Daily sensory breaks in the sensory integration base.", by: "Inclusion TA", freq: "Daily, 15 min", cost: "£450/term — School budget" },
      1: { desc: "1:1 Key worker check-in and early transition pass.", by: "Named LSA", freq: "Daily", cost: "£16,000/year — EHCP funding" }
    };
    strategies = {
      sensory: "Sensory pass always honored without question. Wear ear defenders during assemblies. Keep desk away from high traffic doors.",
      social: "Provide early transition pass (5 mins before bells). Place in designated quiet lunch room. Avoid unexpected changes to room setups."
    };
    seating = { sensory: "Back corner of room, away from projector fans and doors." };
    voices = {
      pupil: "Noise makes my head hurt. I like the sensory room, it's quiet.",
      parent: "The sensory breaks have really helped stop the after-school meltdowns."
    };
    apdr = [
      {
        date: "12 May 2026",
        target: 0,
        progress: "good",
        schoolComment: "Now accessing the sensory room independently. Corridor noise is still a major trigger but the early pass has helped.",
        parentComment: "Very pleased with school breaks. They seem calmer at home.",
        nextSteps: "Maintain early pass and monitor canteen anxiety.",
        by: "OT assistant — July review"
      }
    ];
  } else if (level === "E3") {
    // EHCP, Recently reviewed, Severe ADHD
    reviewedDate = "2026-05-20"; // May 2026 (inside current term)
    diagnoses = "EHCP — Severe Attention Deficit Hyperactivity Disorder (ADHD), emotional dysregulation";
    summary = `${student["Pupil Name"]} has an EHCP for severe ADHD. They have high academic ability but suffer from extreme hyperactivity and limited task attention, requiring frequent physical breaks and structured rewards.`;
    areas = ["executive", "social"];
    strengths = {
      executive: "Capable of high-quality work when highly interested in the topic.",
      social: "Humorous, energetic, and responds well to immediate positive reinforcement."
    };
    needs = {
      executive: "Extremely short focus span (approx. 5 mins without prompt). Hyperactive.",
      social: "Highly impulsive. Can disrupt lessons or conflict with peers when dysregulated."
    };
    advice = {
      executive: "Paediatrician report Nov 2025.",
      social: "Educational Psychologist report Jan 2026."
    };
    health = {
      health: "ADHD. Prescribed stimulant medication. Monitored monthly by paediatrician.",
      social: "No social care involvement.",
      ehcp: "EHCP in place",
      links: ""
    };
    targets = [
      { area: "Executive function", outcome: `For ${student["Pupil Name"]} to increase independent task focus time.`, smart: "By the end of this term, using visual chunking and direct supervision, they will sustain attention on core tasks for 15 minutes before needing a break on 4 of 5 sessions." },
      { area: "Social and emotional", outcome: `For ${student["Pupil Name"]} to manage impulsivity and use an emotional calm-down strategy.`, smart: "Within 6 weeks, they will use their 'movement card' to signal for a brief structured desk break rather than throwing equipment or shouting, on 80% of identified triggers." }
    ];
    provisions = {
      0: { desc: "1:1 LSA support to redirect attention, chunk work, and manage breaks.", by: "Named LSA", freq: "Full-time", cost: "£13,800/year — EHCP funding" },
      1: { desc: "Laminated dynamic focus chart with immediate reward tokens.", by: "Class Teachers / TA", freq: "All core lessons", cost: "£0 — School resource" }
    };
    strategies = {
      executive: "Visual countdown timers. Work broken into 5-minute chunks. Provide wiggle cushion/dynamic seating. Praise immediately.",
      social: "Ignore minor fidgeting. Provide 'movement card' for regulated breaks (e.g. deliver envelope to office). Calm-down corner ready."
    };
    seating = { executive: "Front desk, away from visual distractions like windows." };
    voices = {
      pupil: "I can't sit still for long. I like getting stars when I do my work.",
      parent: "We are glad he has an LSA. It's the only way he stays on task."
    };
    apdr = [
      {
        date: "20 May 2026",
        target: 0,
        progress: "good",
        schoolComment: "Focus time has doubled. Impulsive outbursts have reduced since implementing the movement breaks.",
        parentComment: "They feel successful at school now, which is a massive change.",
        nextSteps: "Gradually build focus time expectation to 15 mins.",
        by: "Classroom LSA — end of term"
      }
    ];
  } else if (level === "K" || level === "K+") {
    // SEN Support (K)
    diagnoses = "K+ — Moderate learning difficulties, literacy support";
    summary = `${student["Pupil Name"]} is a hard-working student who finds reading and writing challenging. They respond well to praise and small group interventions.`;
    areas = ["executive", "slc"];
    strengths = {
      executive: "Very good attitude to learning. Persistent.",
      slc: "Good verbal comprehension. Enthusiastic in discussions."
    };
    needs = {
      executive: "Struggles with reading comprehension and spelling.",
      slc: "Avoids reading aloud due to low confidence."
    };
    advice = {
      executive: "Reading screening Jan 2026.",
      slc: ""
    };
    health = {
      health: "General literacy difficulties. No medical diagnoses.",
      social: "No social care involvement.",
      ehcp: "No EHCP",
      links: ""
    };
    targets = [
      { area: "Executive function", outcome: `For ${student["Pupil Name"]} to improve reading age.`, smart: "By the end of term, they will complete the literacy intervention program, showing at least 6 months progress in reading age." }
    ];
    provisions = {
      0: { desc: "Small group reading intervention.", by: "Reading Specialist TA", freq: "3x weekly, 20m", cost: "£250 — School" }
    };
    strategies = {
      executive: "Do not ask to read aloud. Provide tinted overlays. Highlight key words.",
      slc: "Pre-teach key vocabulary before new topics."
    };
    voices = {
      pupil: "I like maths. Reading is hard but I want to get better.",
      parent: "We want them to build their reading confidence."
    };
    apdr = [
      { date: "08 Jun 2026", target: 0, progress: "some", schoolComment: "Attending reading sessions regularly.", parentComment: "They are reading more at home.", nextSteps: "Continue intervention.", by: "Literacy Lead" }
    ];
  } else if (level === "M") {
    // Monitoring (M)
    diagnoses = "Monitoring — Mild social anxiety";
    summary = `${student["Pupil Name"]} is a polite and quiet student who is being monitored for mild social anxiety. They perform well academically but can be reluctant to contribute in class.`;
    areas = ["social"];
    strengths = {
      social: "Strong friendships in a small group. Cooperative."
    };
    needs = {
      social: "Anxious in large groups or when put on the spot."
    };
    advice = {
      social: "School counsellor review Feb 2026."
    };
    health = {
      health: "Monitoring for anxiety.",
      social: "None.",
      ehcp: "No EHCP",
      links: ""
    };
    targets = [
      { area: "Social and emotional", outcome: `For ${student["Pupil Name"]} to contribute to group work without significant anxiety.`, smart: "Within 6 weeks, they will participate in a structured small group task (3-4 peers) and share one idea, as observed by teacher." }
    ];
    provisions = {
      0: { desc: "Weekly check-in with form tutor.", by: "Form Tutor", freq: "Weekly, 5m", cost: "£0" }
    };
    strategies = {
      social: "Do not cold-call. Pair with trusted peers for group tasks. Check in discreetly."
    };
    voices = {
      pupil: "School is okay. I don't like speaking in front of the whole class.",
      parent: "They are happy with their friends but get anxious about class presentations."
    };
    apdr = [];
  } else {
    // Universal
    diagnoses = "No Special Educational Need";
    summary = `${student["Pupil Name"]} is a well-regulated and high-achieving student. No special educational needs identified.`;
    areas = [];
    strengths = {};
    needs = {};
    advice = {};
    health = { health: "No medical needs.", social: "None.", ehcp: "No EHCP", links: "" };
    targets = [];
    provisions = {};
    strategies = {};
    voices = { pupil: "I like school.", parent: "No concerns." };
    apdr = [];
  }
  
  return {
    id: id,
    name: student["Pupil Name"],
    arborId: arborId,
    year: student["NC Year"] || "Year 7",
    form: student["Form"] || "7T1",
    school: student["School"],
    gender: student["Sex"],
    dob: student["Date of Birth"],
    level: level.startsWith("E") ? "E" : level === "K+" ? "K+" : level === "K" ? "K" : level === "M" ? "Monitoring" : "Universal",
    staff: "Miss A Jones",
    updated: level === "E1" ? "15 Jan 2026" : "08 Jun 2026",
    lastEdited: level === "E1" ? "2026-01-15T10:00:00.000Z" : "2026-06-08T15:00:00.000Z",
    overview: {
      created: level === "E1" ? "2025-09-10" : level === "E2" ? "2025-10-15" : level === "E3" ? "2025-11-01" : "2026-01-10",
      reviewed: reviewedDate,
      level: level.startsWith("E") ? "E" : level === "K+" ? "K+" : level === "K" ? "K" : level === "M" ? "Monitoring" : "Universal",
      attendance: String(Math.round(student["Attendance this Term"] * 100)),
      diagnoses: diagnoses,
      staff: "Miss A Jones",
      agencies: level.startsWith("E") ? "Speech and Language, Educational Psychology" : "None"
    },
    mis: {
      attThis: String(Math.round(student["Attendance this Term"] * 100)),
      attLast: String(Math.round(student["Attendance Last Term"] * 100)),
      susThis: String(student["Suspensions this Year"]),
      susLast: String(student["Suspensions Last Year"]),
      bp: String(student["Behaviour Points"]),
      intEx: String(student["Internal Exclusions this Year"])
    },
    summary: summary,
    areas: areas,
    strengths: strengths,
    needs: needs,
    advice: advice,
    health: health,
    targets: targets,
    editedTargets: {},
    provisions: provisions,
    strategies: strategies,
    seating: seating,
    voices: voices,
    apdr: apdr
  };
}

function getGeneratedMockData() {
  const students = [];
  const isps = [];
  
  const levels = ["E1", "E2", "E3", "K", "M"];
  
  SCHOOLS.forEach(school => {
    // Generate exactly 5 students for each school
    for (let idx = 0; idx < 5; idx++) {
      const level = levels[idx];
      const student = generateStudent(school, idx, level);
      students.push(student);
      
      const isp = generateISP(student, level);
      isps.push(isp);
    }
  });
  
  // Add 10 more students/ISPs to reach exactly 200 (38 * 5 = 190, so we need 10 more)
  for (let idx = 0; idx < 10; idx++) {
    const school = SCHOOLS[idx];
    const student = generateStudent(school, 5, "");
    students.push(student);
    const isp = generateISP(student, "");
    isps.push(isp);
  }
  
  return { students, isps };
}
