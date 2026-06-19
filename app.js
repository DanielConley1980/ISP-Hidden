/* ── CONFIGURATION ─────────────────────────────────────────────────────────
   Replace with your Anthropic API key. In production, proxy this server-side.
   ───────────────────────────────────────────────────────────────────────── */
const API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';

/* ── GOOGLE AUTH + BIGQUERY CONFIG ──────────────────────────────────────── */
const GOOGLE_CLIENT_ID = '803076045433-p3sduma981dl6c4atkvvbmun0452m3se.apps.googleusercontent.com';
const GCP_PROJECT_ID   = 'coop-trust-data-management';
const BQ_DATASET       = 'isp_database';
const BQ_TABLE         = 'isps';
let googleAccessToken  = null;

// HTML-escape user-supplied strings before inserting into innerHTML
function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
const STORAGE_KEY = 'isp_tool_data_v6';
const SHEET_URL_KEY = 'isp_sheet_url_v1';
// Hardwired sheet URL — every user connects to this automatically on startup
const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxfVJy15GoKUw9N9xVK66wDrsDfGaKBYzoN4iYirG-3VFPSM8-73XbDs39riYSCD6Kl/exec';

/* ── State ── */
/* ══════════════════════════════════════════════════════════════════
   DEMO DATA — 10 fully enriched ISPs, Arbor IDs 10001-10010
   Years 7-11, all fields populated, drawn from Graduated Approach Sheet
═══════════════════════════════════════════════════════════════════ */
const DEMO_ISPS = (() => {
  const list = [
    {
      id:'isp-10001', name:'Aarav Patel', arborId:'10001',
      year:'Year 8', form:'8A', school:'North Manchester', gender:'Male', dob:'2013-09-14',
      level:'E', staff:'Miss A Jones', updated:'28 Apr 2026',
      lastEdited: '2026-04-28T09:14:00.000Z',
      overview:{ created:'2026-01-10', reviewed:'2026-04-28', level:'E', attendance:'88', diagnoses:'EHCP — Autism spectrum condition, anxiety', staff:'Miss A Jones', agencies:'CAMHS, Autism Outreach Team, Educational Psychology' },
      mis:{ attThis:'88', attLast:'86', susThis:'0', susLast:'0', bp:'-12', intEx:'' },
      summary:'Aarav is a curious, creative and determined student with a deep interest in technology, Minecraft and science. His autism and anxiety present barriers particularly in unstructured social time, transitions between lessons and situations involving unexpected change. Aarav works best with predictable routines, advance notice of changes and clear, consistent adult support.',
      areas:['social','sensory','executive'],
      strengths:{ social:'Builds strong relationships with trusted adults. Polite and respectful with peers he knows well.', sensory:'Able to identify his own sensory triggers and uses ear defenders independently.', executive:'Strong long-term memory. Excellent recall of factual information.' },
      needs:{ social:'Unstructured time is very difficult; can become anxious and isolated. Peer interactions in group settings are challenging.', sensory:'Over-reactive to noise, strong smells and touch. The canteen and busy corridors cause significant distress.', executive:'Difficulty organising multi-step tasks. Loses equipment and forgets homework routinely.' },
      advice:{ social:'EP report Jan 2026 — social communication profile consistent with autism.', sensory:'OT report Nov 2025 — sensory processing difficulties confirmed.', executive:'EP report Jan 2026 — working memory in low average range.' },
      health:{ health:'Diagnosis of autism spectrum condition and generalised anxiety disorder from CAMHS. No medication. Reviewed by CAMHS termly. PP student.', social:'No social care involvement.', ehcp:'EHCP requested', links:'CAMHS report Nov 2025, EP report Jan 2026' },
      targets:[
        { area:'Social and emotional', outcome:'For Aarav to feel safe and settled during unstructured social times.', smart:'Within this term, Aarav will access a structured lunchtime social group (1:4 ratio) twice per week. Progress measured by staff observation log. Target achieved when Aarav self-reports feeling comfortable at lunch on at least 3 of 5 days per week by end of half-term.' },
        { area:'Sensory', outcome:'For Aarav to manage his sensory environment using agreed strategies independently.', smart:'By end of term, Aarav will use his sensory toolkit (ear defenders, fidget, exit pass) in at least 4 situations per week without adult prompting, as recorded on his self-monitoring card.' },
        { area:'Executive function', outcome:'For Aarav to improve his organisation and task completion in lessons.', smart:'Within 6 weeks, Aarav will use a personal planner and visual task board daily. Measured by class teacher checklist. Target: 3 of 4 tasks completed per session on 4 of 5 days.' },
      ],
      editedTargets:{},
      provisions:{
        0:{ desc:'Structured lunchtime social group with trained TA. Sensory-quiet room available as retreat.', by:'Teaching assistant (SEMH trained)', freq:'2x per week, 30 min', cost:'£650 — School' },
        1:{ desc:'Personalised sensory toolkit. OT consultation each half-term to review strategies.', by:'OT / class teacher', freq:'Daily access; OT half-termly', cost:'NHS OT; toolkit £55 one-off' },
        2:{ desc:'Visual task board, personal planner and colour-coded timetable. TA check-in at lesson start.', by:'Class teacher / TA', freq:'Daily', cost:'£0 — universal adjustment' },
      },
      riskFlags:['medical', 'ebsa'],
      strategies:{'social':'Structured lunchtime social group (1:4 ratio, 2x weekly). Morning check-in with key adult. Advance warning of any changes to routine via visual timetable. Quiet exit pass for overwhelming situations.', 'sensory':'Personalised sensory toolkit in all lessons: ear defenders, fidget tool, exit card. OT-prescribed sensory breaks. Dim/natural light where possible. Avoid seating near doors or high-traffic areas.', 'executive':'Visual task board on desk. Colour-coded timetable. TA check-in at lesson start. Tasks broken into 2-step chunks. Equipment check at end of each day.'},
      seating:{'sensory':'Front of room, away from windows and noise sources.'},
      voices:{ pupil:'I like it when I know what is going to happen. Lunch is the worst part of the day. I wish I could eat somewhere quieter.', parent:'Aarav is so much calmer when the routine is consistent. The sensory strategies are really helping at home too.' },
      apdr:[
        { date:'28 Apr 2026', target:0, progress:'some', schoolComment:'Aarav is attending the lunchtime group consistently. Still anxious on days with supply teachers.', parentComment:'He seems happier on most days. We are seeing progress.', nextSteps:'Introduce a predictability card for days when there are cover teachers.', by:'Miss A Jones — May half-term' },
      ],
    },
    {
      id:'isp-10002', name:'Amira Khan', arborId:'10002',
      year:'Year 5', form:'5B', school:'Northwood', gender:'Female', dob:'2015-11-03',
      level:'Targeted', staff:'Miss A Jones', updated:'15 Jan 2026',
      lastEdited: '2026-01-15T10:22:00.000Z',
      overview:{ created:'2026-02-02', reviewed:'2026-01-15', level:'Targeted', attendance:'91', diagnoses:'K+ — SEMH, emotional dysregulation', staff:'Miss A Jones', agencies:'School counsellor' },
      mis:{ attThis:'91', attLast:'88', susThis:'1', susLast:'2', bp:'34', intEx:'2' },
      summary:'Amira is a warm, articulate and creative student who excels in English and drama. She struggles with managing strong emotions, particularly in response to perceived criticism or conflict with peers. Amira benefits from a trusted adult relationship and structured opportunities to reflect on her feelings.',
      areas:['social','executive'],
      strengths:{ social:'Strong empathy and emotional intelligence. Popular with peers when regulated.', executive:'Good verbal communication. Responds well to structured reflection prompts.' },
      needs:{ social:'Emotional outbursts when stressed — can walk out of lessons or become verbally confrontational.', executive:'Difficulty de-escalating once dysregulated. Struggles to identify triggers before escalation.' },
      advice:{ social:'School counsellor assessment Feb 2026 — SEMH monitoring recommended.', executive:'' },
      health:{ health:'No diagnosed condition. SEMH monitoring in place. Accessing fortnightly school counselling.', social:'No social care involvement.', ehcp:'No EHCP', links:'School counsellor referral form' },
      targets:[
        { area:'Social and emotional', outcome:'For Amira to develop strategies to manage her emotions and de-escalate before reaching crisis point.', smart:'Within this half-term, Amira will use her personal regulation plan (identify → signal → step out) at least twice per week. Progress measured by mentor log. Target: no full lesson walkouts for 3 consecutive weeks by end of term.' },
        { area:'Executive function', outcome:'For Amira to identify and articulate her emotional triggers.', smart:'By end of term, Amira will complete her weekly feelings diary and discuss it with her mentor each Friday. Target: able to identify at least 3 personal triggers and 2 coping strategies when asked.' },
      ],
      editedTargets:{},
      provisions:{
        0:{ desc:'Weekly pastoral mentor sessions. Personal regulation plan laminated on desk. Safe exit pass.', by:'Pastoral mentor / form tutor', freq:'Weekly mentor, daily plan', cost:'£0 — universal' },
        1:{ desc:'Fortnightly school counselling. Feelings diary provided.', by:'School counsellor', freq:'Fortnightly 45 min', cost:'£180/term — school' },
      },
      riskFlags:['behaviour'],
      strategies:{'social':'Personal regulation plan laminated on desk (identify → signal → step out). Weekly pastoral mentor session. Safe exit pass — always honoured without comment. De-escalation approach only; no public correction.', 'executive':'Feelings diary completed weekly with mentor. Emotional check-in at lesson start. Avoid cold-calling. Give advance notice before any feedback.'},
      seating:{'social':'Near the door — needs discreet exit access.'},
      voices:{ pupil:'I get really upset sometimes and I don\'t know how to stop it. I like talking to Miss.', parent:'Amira has always been very sensitive. The counselling seems to be helping her reflect more.' },
      apdr:[
        { date:'15 Jan 2026', target:0, progress:'some', schoolComment:'Amira is using her regulation plan inconsistently. Some improvement in frequency of walkouts but still occurring weekly.', parentComment:'She seems calmer at home. Progress is slow but visible.', nextSteps:'ISP review due by end of summer term (Jul 2026). Schedule review meeting with parent.', by:'Miss A Jones — by 17 Jul 2026' },
      ],
    },
    {
      id:'isp-10003', name:'Kwame Mensah', arborId:'10003',
      year:'Year 3', form:'3C', school:'Glebe', gender:'Male', dob:'2017-02-19',
      level:'Targeted Plus', staff:'Miss A Jones', updated:'15 Jan 2026',
      lastEdited: '2026-01-15T14:05:00.000Z',
      overview:{ created:'2026-01-15', reviewed:'2026-01-15', level:'Targeted Plus', attendance:'84', diagnoses:'K — SEMH, trauma-related presentation', staff:'Miss A Jones', agencies:'CAMHS CYPS, Early Help, Social Care' },
      mis:{ attThis:'84', attLast:'79', susThis:'3', susLast:'5', bp:'62', intEx:'3' },
      summary:'Kwame is a resilient, athletic and loyal student with strong interests in football, music and art. He is on the SEND K register due to his complex SEMH needs, which include a trauma-related presentation. Kwame is in receipt of Early Help and has an allocated social care worker. He responds well to consistent, trusted adult relationships and structured positive reinforcement.',
      areas:['social','executive','slc'],
      strengths:{ social:'Strong loyalty to friends. Good relationship with key staff.', executive:'Determined when motivated. Good sporting and creative ability.', slc:'Good receptive language. Responds well to clear, direct communication.' },
      needs:{ social:'Difficulty regulating in unpredictable situations. History of challenging behaviour when triggered. CIN under Children Act.', executive:'Executive functioning significantly affected by SEMH needs. Poor attendance impacts continuity.', slc:'Expressive language becomes limited under stress. Can disengage or shut down.' },
      advice:{ social:'CAMHS assessment Mar 2026 — complex SEMH, trauma-informed approach recommended.', executive:'EP report Dec 2025 — cognitive profile affected by SEMH presentation.', slc:'SALT screening Feb 2026 — receptive language broadly in line with expectations.' },
      health:{ health:'On SEND K register. Complex SEMH needs with trauma-related presentation. Under CAMHS CYPS. No medication.', social:'Child in Need (CIN) under s17 Children Act. Allocated social worker. Early Help plan in place.', ehcp:'EHCP requested', links:'CAMHS letter Mar 2026, Early Help plan, social care assessment' },
      targets:[
        { area:'Social and emotional', outcome:'For Kwame to remain in school and regulated for the majority of his day.', smart:'Within this term, Kwame will attend at least 90% of sessions using his personalised plan. Measured by attendance register. Target: no more than 3 managed exits per week by half-term.' },
        { area:'Executive function', outcome:'For Kwame to improve his engagement with learning tasks in lessons.', smart:'Within 6 weeks, Kwame will complete at least 2 of 4 tasks per lesson with TA support, as measured by lesson record sheet.' },
        { area:'Speech, language and communication', outcome:'For Kwame to use his agreed communication strategies when he feels overwhelmed.', smart:'By end of term, Kwame will use his "traffic light" communication card independently in at least 3 sessions per week, as recorded by his key adult.' },
      ],
      editedTargets:{},
      provisions:{
        0:{ desc:'Key adult check-in each morning. Personalised regulation plan. Managed exit to Inclusion Base when needed.', by:'Key adult (nominated TA)', freq:'Daily — morning check-in 10 min; access throughout day', cost:'£3,200/term — school + LA contribution' },
        1:{ desc:'TA in-class support for structured tasks. Visual scaffolding and reduced task demand where appropriate.', by:'Teaching assistant', freq:'Daily in core lessons', cost:'Included above' },
        2:{ desc:'Traffic light communication card. SALT-advised strategies shared with all staff.', by:'All teaching staff / SENCO', freq:'Universal — all lessons', cost:'£0' },
      },
      riskFlags:['safeguarding','cie','behaviour'],
      strategies:{ social:'Trauma-informed approach at all times. Key adult relationship is primary. Daily morning check-in (10 min). Managed exit to Inclusion Base when regulated. Never use sanctions without key adult consultation.', executive:'Visual scaffolding for all tasks. Reduce task demand when SEMH presentation is high. TA in-class support. Praise effort not outcome.', slc:'Traffic light communication card on desk. Chunked 2-step instructions. SALT strategies shared with all staff. Pre-teaching key vocabulary before lessons.' },
      seating:{ social:'Near door/exit at all times — managed exit plan in place.' },
      voices:{ pupil:'I like football. I like it when adults are fair and don\'t shout.', parent:'Kwame has had a really hard time. We just want him to be happy in school.' },
      apdr:[
        { date:'15 Jan 2026', target:0, progress:'some', schoolComment:'Attendance improving from 78% to 84%. Still has difficult days but duration of episodes is reducing.', parentComment:'He is getting up for school more readily. Something is working.', nextSteps:'Request EHCP statutory assessment. Continue CAMHS liaison.', by:'Miss A Jones — end of term' },
      ],
    },
    {
      id:'isp-10004', name:'Imani Clarke', arborId:'10004',
      year:'Year 9', form:'9D', school:'North Manchester', gender:'Female', dob:'2012-07-22',
      level:'E', staff:'Miss A Jones', updated:'22 Jan 2026',
      lastEdited: '2026-01-22T11:30:00.000Z',
      overview:{ created:'2026-02-10', reviewed:'2026-01-22', level:'E', attendance:'94', diagnoses:'EHCP — Reading difficulties, possible dyslexia', staff:'Miss A Jones', agencies:'Specialist teacher assessment pending' },
      mis:{ attThis:'94', attLast:'93', susThis:'0', susLast:'0', bp:'-5', intEx:'' },
      summary:'Imani is a confident, sociable and enthusiastic student who enjoys PE, music and socialising with friends. She finds reading and extended writing very challenging, and her self-esteem around literacy is low. Imani benefits from multisensory approaches to learning and regular encouragement around her progress.',
      areas:['slc','executive'],
      strengths:{ slc:'Good verbal communication and comprehension. Excellent at explaining her ideas when given the chance to speak.', executive:'Strong working memory for verbal information. Good at remembering things she has heard.' },
      needs:{ slc:'Reading accuracy and fluency significantly below expected level for age. Avoids reading aloud.', executive:'Extended writing is effortful and slow. Loses track of ideas when writing independently.' },
      advice:{ slc:'Specialist teacher reading assessment pending — possible dyslexia.', executive:'' },
      health:{ health:'No diagnosed condition. Literacy difficulties flagged at transition. Reading age approximately 3 years below chronological age.', social:'No social care involvement.', ehcp:'No EHCP', links:'Transition records from primary school' },
      targets:[
        { area:'Speech, language and communication', outcome:'For Imani to improve her reading accuracy and fluency.', smart:'Within this term, Imani will complete a structured 1:1 reading programme (15 min, 3x per week). Progress measured using standardised reading assessment. Target: minimum 6-month improvement in reading age by end of term.' },
        { area:'Executive function', outcome:'For Imani to develop strategies to support independent extended writing.', smart:'By end of term, Imani will use writing frames and mind map scaffolds for all extended writing tasks. Measured by class teacher. Target: producing at least 3 structured paragraphs independently on 3 of 5 occasions.' },
      ],
      editedTargets:{},
      provisions:{
        0:{ desc:'1:1 structured reading programme (evidence-based). Text-to-speech software on school laptop.', by:'Learning support TA', freq:'3x per week, 15 min', cost:'£420/term — school' },
        1:{ desc:'Writing frames, graphic organisers and mind-mapping tools for all written tasks.', by:'Class teachers / SENCO', freq:'All lessons requiring extended writing', cost:'£0 — universal adjustment' },
      },
      riskFlags:[],
      strategies:{'slc':'Text-to-speech software on school laptop for all reading tasks. Never ask to read aloud without prior notice. Pre-teach vocabulary. Writing frames and sentence starters for all extended tasks.', 'executive':'Graphic organiser and mind maps for writing. Extended time for tasks. Allow verbal response as alternative to written where possible.'},
      seating:{},
      voices:{ pupil:'Reading is really hard for me. I feel embarrassed when I have to read out loud. I like it when I can just talk instead.', parent:'Imani has always found reading hard. We would really like her to get a proper assessment so we know what is going on.' },
      apdr:[
        { date:'22 Jan 2026', target:0, progress:'some', schoolComment:'Imani is engaging with the reading programme. Early data suggests progress but formal re-assessment not yet completed.', parentComment:'We are glad something is happening at last. Still waiting on the specialist assessment.', nextSteps:'ISP review due by end of summer term (Jul 2026). Book specialist teacher assessment before review.', by:'Miss A Jones — by 17 Jul 2026' },
      ],
    },
    {
      id:'isp-10005', name:'Mateo García', arborId:'10005',
      year:'Year 12', form:'12A', school:'Connell', gender:'Male', dob:'2009-04-05',
      level:'Targeted Plus', staff:'Miss A Jones', updated:'25 Apr 2026',
      lastEdited: '2026-04-25T15:45:00.000Z',
      overview:{ created:'2025-11-01', reviewed:'2026-04-25', level:'Targeted Plus', attendance:'79', diagnoses:'EHCP — ADHD, DCD, significant learning difficulties', staff:'Miss A Jones', agencies:'Paediatrician, OT, SALT, EP' },
      mis:{ attThis:'79', attLast:'74', susThis:'2', susLast:'4', bp:'118', intEx:'4' },
      summary:'Mateo is an enthusiastic, kind and humorous student with a real passion for cooking, cars and practical tasks. He has a confirmed EHCP with diagnoses of ADHD, developmental coordination disorder (DCD) and significant learning difficulties. Mateo is CLA and has an allocated social worker. He is currently adjusting to college life in Year 12 and thrives in practical, structured environments with clear expectations and consistent adult support.',
      areas:['executive','motor','slc'],
      strengths:{ executive:'Motivated by practical tasks. Responds very well to immediate positive feedback.', motor:'Strong gross motor skills — enjoys PE and outdoor learning.', slc:'Expressive language is enthusiastic and engaging in familiar contexts.' },
      needs:{ executive:'Sustained attention is very limited. ADHD significantly impacts engagement, organisation and task completion.', motor:'Fine motor difficulties affect writing, cutting and precision tasks. DCD impacts daily functioning.', slc:'Receptive language difficulties — needs instructions broken into small steps and repeated.' },
      advice:{ executive:'Paediatrician report Sep 2025 — ADHD confirmed, medication review ongoing.', motor:'OT report Oct 2025 — DCD confirmed, fine motor at 3rd percentile.', slc:'SALT report Nov 2025 — receptive language 2 years below expected level.' },
      health:{ health:'EHCP in place. ADHD and DCD confirmed. Currently on medication trial (methylphenidate) — paediatrician review monthly. Significant learning difficulties.', social:'Child Looked After (CLA). Placed with foster carer. Allocated social worker. PEP review each term.', ehcp:'EHCP in place', links:'EHCP, paediatrician report, OT report, SALT report, PEP' },
      targets:[
        { area:'Executive function', outcome:'For Mateo to manage his independent study periods and transitions between lectures.', smart:'Within this half-term, Mateo will use a visual digital planner to schedule and check in for all independent study blocks. Monitored by his key support assistant daily.' },
        { area:'Motor and physical', outcome:'For Mateo to use assistive technology independently for coursework and lectures.', smart:'By end of term, Mateo will use speech-to-text software and digital mind maps for all extended coursework tasks, reducing fine-motor writing fatigue.' },
        { area:'Speech, language and communication', outcome:'For Mateo to understand and follow multi-step directions for independent living/practical courses.', smart:'Within 6 weeks, Mateo will follow a written 3-step task card independently in his practical cooking sessions on at least 4 of 5 occasions.' },
      ],
      editedTargets:{},
      provisions:{
        0:{ desc:'1:1 Learning Support Assistant in core lectures. Visual task board/digital checklist.', by:'Named LSA (full-time)', freq:'Full-time — all lectures', cost:'£18,500/year — EHCP funding (LA + school)' },
        1:{ desc:'Laptop with speech-to-text software. OT adaptive tools for practical labs.', by:'OT / subject teachers', freq:'All written tasks; OT review half-termly', cost:'NHS OT; equipment £85 school' },
        2:{ desc:'Transition planning and visual sequencing cards for tasks.', by:'All teaching staff / SENCO', freq:'All lessons', cost:'NHS SALT review termly' },
      },
      riskFlags:['cie', 'pep', 'exam', 'medical'],
      strategies:{'executive':'LSA support in lectures. Visual checklist. Movement breaks. Tasks broken into single steps. Immediate positive reinforcement.', 'motor':'Laptop with speech-to-text software. OT strategies in all practical sessions: adaptive tools.', 'slc':'All instructions chunked to 1–2 steps with visual cues. Repeat and rephrase rather than redirect.'},
      seating:{'executive':'Front of room, next to LSA at all times.'},
      voices:{ pupil:'I like college and cooking. Writing is very hard. I like my laptop.', parent:'Foster carer reports Mateo is settling well in Year 12. The college support is making a real difference.' },
      apdr:[
        { date:'25 Apr 2026', target:0, progress:'some', schoolComment:'Mateo is engaging better with tasks since college transition. Still needs refocusing. Attendance concern — 79%.', parentComment:'Foster carer: he is sleeping better and seems more settled.', nextSteps:'PEP review due. Discuss EHCP annual review date.', by:'Miss A Jones — end of term' },
      ],
    },
    {
      id:'isp-10006', name:'Sofia Rossi', arborId:'10006',
      year:'Year 6', form:'6R', school:'Northwood', gender:'Female', dob:'2014-06-30',
      level:'Targeted', staff:'Miss A Jones', updated:'18 Apr 2026',
      lastEdited: '2026-04-18T09:50:00.000Z',
      overview:{ created:'2026-01-20', reviewed:'2026-04-18', level:'Targeted', attendance:'96', diagnoses:'K+ — SEMH, social anxiety', staff:'Miss A Jones', agencies:'School counsellor, CAMHS (waiting list)' },
      mis:{ attThis:'96', attLast:'94', susThis:'0', susLast:'0', bp:'-8', intEx:'' },
      summary:'Sofia is a thoughtful, diligent and academically strong student who achieves well across most subjects. She experiences significant social anxiety which makes group work, presentations and social situations very difficult. Sofia has strong insight into her own needs and is very motivated to find strategies that help her.',
      areas:['social','sensory'],
      strengths:{ social:'Strong 1:1 relationships. Excellent written communication.', sensory:'Good self-awareness of anxiety triggers.' },
      needs:{ social:'Social anxiety makes presentations, group work and new situations very difficult. Can become physically unwell before assessments.', sensory:'Over-reactive to busy, noisy environments. Can struggle in the canteen and in large assemblies.' },
      advice:{ social:'GP letter Jan 2026 — social anxiety confirmed. CAMHS referral made.', sensory:'' },
      health:{ health:'Social anxiety — GP confirmed. On CAMHS waiting list. Accessing school counselling fortnightly. No medication currently.', social:'No social care involvement.', ehcp:'No EHCP', links:'GP letter, CAMHS referral Jan 2026' },
      targets:[
        { area:'Social and emotional', outcome:'For Sofia to participate in group and presentation tasks with manageable anxiety.', smart:'Within this term, Sofia will use a graduated exposure plan — starting with 1:1, then small group, then class presentations. Progress tracked by tutor. Target: Sofia completes at least one small-group presentation per half-term.' },
        { area:'Sensory', outcome:'For Sofia to navigate busy school environments without significant distress.', smart:'By end of term, Sofia will use agreed strategies (early canteen access, alternative assembly seating) daily. Target: self-report of anxiety below 5/10 on average on these measures by end of half-term.' },
      ],
      editedTargets:{},
      provisions:{
        0:{ desc:'Graduated exposure plan for group/presentation tasks. Alternative assessment formats where possible.', by:'Subject teachers / pastoral mentor', freq:'All applicable tasks', cost:'£0 — universal adjustment' },
        1:{ desc:'Early canteen access. Alternative seating in assembly. Anxiety self-monitoring card.', by:'Form tutor / pastoral team', freq:'Daily', cost:'£0' },
      },
      riskFlags:['medical'],
      strategies:{'social':'Graduated exposure plan for presentations (1:1 → small group → class). Advance notice of any group tasks (minimum 48 hours). Alternative assessment formats accepted. Do not cold-call.', 'sensory':'Early canteen access pass. Alternative seating in assembly. Anxiety self-monitoring card. Quiet room access on request.'},
      seating:{'social':'Aisle seat near door — anxiety/exit access required.'},
      voices:{ pupil:'I feel sick before presentations. I just want to do well but I get too scared. I like it when teachers give me warning in advance.', parent:'Sofia puts so much pressure on herself. We are glad she is finally getting some support for her anxiety.' },
      apdr:[
        { date:'18 Apr 2026', target:0, progress:'good', schoolComment:'Sofia completed her first paired presentation last half-term. Great progress. CAMHS appointment now confirmed.', parentComment:'She was really proud of herself. A big step forward.', nextSteps:'Progress to small group presentation next half-term. Maintain CAMHS engagement.', by:'Miss A Jones — end of term' },
      ],
    },
    {
      id:'isp-10007', name:'Noah Evans', arborId:'10007',
      year:'Year 10', form:'10E', school:'North Manchester', gender:'Male', dob:'2010-08-12',
      level:'Targeted', staff:'Miss A Jones', updated:'02 May 2026',
      lastEdited: '2026-05-02T08:30:00.000Z',
      overview:{ created:'2026-03-01', reviewed:'2026-05-02', level:'Targeted', attendance:'93', diagnoses:'K+ — EBSA risk, school refusal history', staff:'Miss A Jones', agencies:'CAMHS, Early Help' },
      mis:{ attThis:'93', attLast:'71', susThis:'0', susLast:'1', bp:'22', intEx:'1' },
      summary:'Noah is an articulate, witty and perceptive student with real ability in maths and computing. He has a significant history of school refusal linked to anxiety and EBSA (Emotionally Based School Avoidance). Noah is now attending consistently following a managed reintegration but remains at risk and needs careful monitoring and a flexible, relationship-first approach.',
      areas:['social','executive'],
      strengths:{ social:'Strong insight into his own difficulties. Very good relationship with key adult.', executive:'High academic ability when engaged. Good problem-solving skills.' },
      needs:{ social:'Anxiety about social situations — particularly lunchtimes and changing lessons. EBSA risk if pressures increase.', executive:'Avoidance of tasks perceived as difficult or exposing. Incomplete work when anxious.' },
      advice:{ social:'CAMHS assessment Feb 2026 — anxiety with EBSA profile. Reintegration plan in place.', executive:'' },
      health:{ health:'Anxiety disorder — CAMHS involved. Managed reintegration from EBSA completed Jan 2026. Accessing CAMHS fortnightly.', social:'Early Help plan in place.', ehcp:'No EHCP', links:'CAMHS reintegration plan, Early Help plan' },
      targets:[
        { area:'Social and emotional', outcome:'For Noah to maintain full-time attendance and manage his anxiety about school.', smart:'Within this term, Noah will maintain attendance above 90%. Progress monitored weekly by key adult. Immediate contact protocol in place if attendance drops.' },
        { area:'Executive function', outcome:'For Noah to complete and submit work consistently without anxiety being a barrier.', smart:'By end of term, Noah will complete and submit 80% of set work using agreed strategies (chunking, extension deadlines, mentor support). Measured by teacher tracker.' },
      ],
      editedTargets:{},
      provisions:{
        0:{ desc:'Daily key adult check-in (10 min). Flexible seating in canteen. Social story for transitions.', by:'Named key adult (SENCO)', freq:'Daily check-in; transitions as needed', cost:'£0 — staff time' },
        1:{ desc:'Chunked homework, extension deadlines as required. Mentor session for work completion support.', by:'Subject teachers / pastoral mentor', freq:'Weekly mentor; adjusted deadlines ongoing', cost:'£0' },
      },
      riskFlags:['ebsa', 'medical'],
      strategies:{'social':'Relationship-first approach at all times. Key adult daily check-in (10 min). Do not make attendance a public issue. Flexible entry arrangements on difficult days. Immediate contact protocol if absent.', 'executive':'Chunked homework with extended deadlines. Mentor session for work completion support. Written feedback via email rather than in person where possible.'},
      seating:{},
      voices:{ pupil:'I find it hard to come in some days. When I do come in it is usually OK. I just need people not to make a big deal of it.', parent:'We have been through a very difficult two years. We are relieved he is in school. Please don\'t push too hard.' },
      apdr:[
        { date:'02 May 2026', target:0, progress:'good', schoolComment:'Attendance at 93% — best sustained period since Year 8. Noah is engaging well.', parentComment:'He is getting up for school without a battle most days. We are really pleased.', nextSteps:'Continue current approach. Begin discussion about GCSE option choices.', by:'Miss A Jones — end of term' },
      ],
    },
    {
      id:'isp-10008', name:'Olivia Thomas', arborId:'10008',
      year:'Year 13', form:'13B', school:'Connell', gender:'Female', dob:'2008-03-28',
      level:'Targeted Plus', staff:'Miss A Jones', updated:'30 Jan 2026',
      lastEdited: '2026-01-30T13:20:00.000Z',
      overview:{ created:'2025-09-05', reviewed:'2026-01-30', level:'Targeted Plus', attendance:'82', diagnoses:'K+ — SEMH, bereavement, self-harm history', staff:'Miss A Jones', agencies:'CAMHS (open), school counsellor, safeguarding lead' },
      mis:{ attThis:'82', attLast:'76', susThis:'1', susLast:'3', bp:'47', intEx:'2' },
      summary:'Olivia is a sensitive, empathetic and creative student who has experienced significant bereavement and has a history of self-harm, now resolved. She is currently open to CAMHS and accessing school counselling. Olivia is engaging positively with support and her wellbeing is improving, but she remains vulnerable and needs a consistent, trauma-informed approach from all staff.',
      areas:['social','executive'],
      strengths:{ social:'Strong empathy. Positive relationship with key adults and small group of trusted peers.', executive:'Good academic ability when emotionally regulated. Creative and expressive in art and English.' },
      needs:{ social:'Low mood and withdrawal when stressed. Vulnerable to peer influence. History of self-harm (currently resolved).', executive:'Avoidance of work when overwhelmed. Incomplete homework. Attendance affected by low mood.' },
      advice:{ social:'CAMHS risk assessment Apr 2026 — no current self-harm. Continued therapeutic support recommended.', executive:'' },
      health:{ health:'Bereavement (parent) Sep 2024. Self-harm history — resolved per CAMHS review Apr 2026. Open to CAMHS monthly. School counselling fortnightly.', social:'No social care involvement. Safeguarding plan previously in place — closed Jan 2026.', ehcp:'No EHCP', links:'CAMHS letter Apr 2026, safeguarding records' },
      targets:[
        { area:'Social and emotional', outcome:'For Olivia to maintain her emotional wellbeing and access support proactively.', smart:'Within this term, Olivia will attend all school counselling sessions and complete her CAMHS appointments. Target: no missed sessions without prior notice. Wellbeing check-in score to remain stable or improve (measured by SEMH tracker — currently band Medium 57).' },
        { area:'Executive function', outcome:'For Olivia to improve her attendance and homework completion.', smart:'By end of term, Olivia will attend at least 88% of sessions and submit at least 75% of homework. Monitored by form tutor weekly.' },
      ],
      editedTargets:{},
      provisions:{
        0:{ desc:'Fortnightly school counselling (exam anxiety focus). Cognitive restructuring toolkit. Wellbeing check-ins pre-exam.', by:'School counsellor / form tutor', freq:'Fortnightly counselling; weekly check-ins', cost:'£180/term — school' },
        1:{ desc:'Flexible homework expectations. Extended deadlines where needed. Weekly mentor session.', by:'Subject teachers / pastoral mentor', freq:'Weekly mentor; adjusted deadlines', cost:'£0' },
      },
      riskFlags:['selfharm', 'medical'],
      strategies:{'social':'Trauma-informed approach at all times. Daily pastoral check-in. Safe room access on request — always honoured. Do not discuss personal circumstances in class. Refer any concerns to safeguarding lead immediately.', 'executive':'Flexible homework expectations. Extended deadlines. Weekly mentor. Avoid high-pressure in-class tasks without notice.'},
      seating:{'social':'Near door — needs discreet access to safe room.'},
      voices:{ pupil:'I feel much better than I did last year. I still have hard days but I have people I can talk to now.', parent:'We are so grateful for the support Olivia has received. She is in a much better place.' },
      apdr:[
        { date:'30 Jan 2026', target:0, progress:'good', schoolComment:'SEMH tracker score improved from 57 to 49. Olivia is engaged, attending counselling and has not missed a CAMHS appointment this term.', parentComment:'She is smiling again. It has been a very hard year but we are hopeful.', nextSteps:'Gradual increase of homework expectations as confidence builds.', by:'Miss A Jones — end of term' },
      ],
    },
    {
      id:'isp-10009', name:'Hiro Tanaka', arborId:'10009',
      year:'Year 11', form:'11A', school:'North Manchester', gender:'Male', dob:'2009-12-09',
      level:'E', staff:'Miss A Jones', updated:'28 Apr 2026',
      lastEdited: '2026-04-28T14:22:00.000Z',
      overview:{ created:'2025-09-01', reviewed:'2026-04-28', level:'E', attendance:'87', diagnoses:'EHCP — Autism, SEMH, demand avoidance profile', staff:'Miss A Jones', agencies:'CAMHS, EP, Autism Outreach' },
      mis:{ attThis:'87', attLast:'83', susThis:'2', susLast:'2', bp:'55', intEx:'3' },
      summary:'Hiro is a highly intelligent, perceptive and passionate student with deep interests in Japanese culture, gaming and mathematics. His autism, demand avoidance profile and SEMH needs create significant barriers in high-demand environments and during examinations. Hiro is CIN under section 17 (disabled child). He is now in Year 11 and exam access arrangements are in place.',
      areas:['executive','social','sensory'],
      strengths:{ executive:'Exceptional abstract reasoning and mathematical ability.', social:'Very strong bonds with a small number of trusted staff.', sensory:'Self-advocates effectively in familiar environments.' },
      needs:{ executive:'Demand avoidance means traditional instruction approaches are often ineffective. Exam pressure causes significant distress.', social:'Unpredictable environments cause shutdown or flight response. Significant difficulty with transitions.', sensory:'Highly sensitive to noise, light and unpredictable sensory input.' },
      advice:{ executive:'EP report Mar 2026 — PDA profile, exam access arrangements recommended.', social:'Autism Outreach report Feb 2026 — specialist strategies documented.', sensory:'OT report Jan 2026 — sensory profile highly impacted.' },
      health:{ health:'Autism with demand avoidance profile. Complex SEMH needs. Under CAMHS — monthly review. Exam access arrangements: 25% extra time, separate room, reader/scribe.', social:'Child in Need (CIN) under s17 (disabled child). Social worker allocated. Direct Payments 5 hrs/week.', ehcp:'EHCP in place', links:'EHCP, EP report, OT report, EAA confirmation' },
      targets:[
        { area:'Executive function', outcome:'For Hiro to engage with GCSE revision and examinations using adapted strategies.', smart:'Within this term, Hiro will use his personalised revision timetable (low-demand, interest-led) for at least 3 sessions per week. Supported by key adult. Target: completion of all mock exams in separate room with access arrangements by end of term.' },
        { area:'Social and emotional', outcome:'For Hiro to feel safe and regulated during the examination period.', smart:'By end of term, Hiro will access his designated exam base with familiar invigilator. Wellbeing check-in each exam morning with key adult. No more than 2 exam withdrawals per session.' },
        { area:'Sensory', outcome:'For Hiro to manage his sensory environment during high-pressure periods.', smart:'Hiro will use his sensory regulation toolkit (noise-cancelling headphones, fidget, natural light) in all exam sessions. Reported comfort level to remain at 6/10 or above.' },
      ],
      editedTargets:{},
      provisions:{
        0:{ desc:'Personalised revision plan. Key adult mentoring weekly. Separate exam room with familiar invigilator.', by:'SENDCo / key adult', freq:'Weekly mentoring; all exams', cost:'£0 — school staff time + EAA funding' },
        1:{ desc:'Daily check-in during exam period. Safe base access. Regular breaks as needed.', by:'Key adult (named TA)', freq:'Daily during exam period', cost:'Staff time — school' },
        2:{ desc:'Full sensory toolkit in exam room. Lighting adjusted. Noise-cancelling headphones.', by:'Invigilator / SENCO', freq:'All exams', cost:'Equipment £95 — school' },
      },
      riskFlags:['cie', 'exam', 'medical', 'ebsa'],
      strategies:{'executive':'Demand avoidance profile — avoid direct instruction where possible. Offer choices. Interest-led tasks where possible. Revision timetable is self-directed. Separate exam room with familiar invigilator.', 'social':'Key adult relationship is primary. Predictable, consistent environment. No unexpected changes without preparation. Managed exit always available.', 'sensory':'Noise-cancelling headphones available at all times. Natural light. Reduced sensory load in exam room. Sensory toolkit on desk.'},
      seating:{'sensory':'Away from doors and corridors — noise sensitivity. Same assigned seat every lesson.'},
      voices:{ pupil:'Exams make everything worse. I just need people to not push me. If I can do it in my own way I can actually show what I know.', parent:'Hiro has worked incredibly hard. We are very proud. Please just make sure the exam arrangements are in place.' },
      apdr:[
        { date:'28 Apr 2026', target:0, progress:'some', schoolComment:'Hiro completed all mock exams in separate room. Two partial withdrawals but re-engaged. Engagement with revision improving.', parentComment:'He is very stressed but holding together. The separate room makes a huge difference.', nextSteps:'Confirm all exam arrangements for GCSE season. Debrief after each exam.', by:'Miss A Jones — ongoing through exam period' },
      ],
    },
    {
      id:'isp-10010', name:'Mia Johnson', arborId:'10010',
      year:'Year 4', form:'4J', school:'Northwood', gender:'Female', dob:'2016-10-17',
      level:'Targeted', staff:'Miss A Jones', updated:'01 May 2026',
      lastEdited: '2026-05-01T16:10:00.000Z',
      overview:{ created:'2026-02-15', reviewed:'2026-05-01', level:'Targeted', attendance:'95', diagnoses:'K+ — SEMH, test anxiety, perfectionism', staff:'Miss A Jones', agencies:'School counsellor' },
      mis:{ attThis:'95', attLast:'96', susThis:'0', susLast:'0', bp:'-15', intEx:'' },
      summary:'Mia is a diligent, ambitious and highly motivated student who achieves very well academically. She experiences significant test anxiety and perfectionism which causes her considerable distress during school assessment weeks. Mia benefits from strategies that reduce perfectionist thinking and build self-compassion alongside her natural academic drive.',
      areas:['social','executive'],
      strengths:{ social:'Excellent relationship with teachers. Very self-aware and reflective.', executive:'Exceptional organisation and academic output. Strong study skills.' },
      needs:{ social:'Perfectionism causes extreme anxiety before assessments. Cries or freezes in exams. Compares herself negatively to peers.', executive:'Over-prepares to the detriment of her wellbeing. Difficulty stopping when "done enough".' },
      advice:{ social:'School counsellor assessment Mar 2026 — perfectionism and exam anxiety profile identified.', executive:'' },
      health:{ health:'No diagnosed condition. SEMH monitoring. School counselling fortnightly. GP aware — no medication.', social:'No social care involvement.', ehcp:'No EHCP', links:'Counsellor assessment Mar 2026' },
      targets:[
        { area:'Social and emotional', outcome:'For Mia to manage her test anxiety and reduce the impact of perfectionist thinking on her wellbeing.', smart:'Within this term, Mia will use her cognitive restructuring toolkit (thoughts diary, self-compassion prompts) at least 3x per week. Wellbeing self-report to remain at 5/10 or above during exam period. Counselling attendance: all sessions.' },
        { area:'Executive function', outcome:'For Mia to adopt a sustainable revision approach and set healthy limits on study time.', smart:'By end of term, Mia will follow her structured revision timetable with set "stop times" — no more than 30 minutes study per evening. Monitored via weekly mentor check-in.' },
      ],
      editedTargets:{},
      provisions:{
        0:{ desc:'Fortnightly school counselling (exam anxiety focus). Cognitive restructuring toolkit. Wellbeing check-ins pre-exam.', by:'School counsellor / form tutor', freq:'Fortnightly counselling; weekly check-ins', cost:'£180/term — school' },
        1:{ desc:'Structured revision timetable with enforced stop-times. Mentor session weekly for study planning.', by:'Pastoral mentor / SENCO', freq:'Weekly', cost:'£0' },
      },
      riskFlags:['medical'],
      strategies:{'social':'Cognitive restructuring toolkit on desk. Avoid public praise of performance. Normalise imperfection. Do not add pressure around deadlines. Counselling contact confidential.', 'executive':'Structured revision timetable with set stop times. Mentor-enforced. Avoid assigning additional work beyond standard expectations.'},
      seating:{},
      voices:{ pupil:'I know I put too much pressure on myself but I can\'t stop. I just really want to do well.', parent:'Mia works herself into the ground. We are more worried about her mental health than her grades, honestly.' },
      apdr:[
        { date:'01 May 2026', target:0, progress:'some', schoolComment:'Mia completed all mock exams without breakdown this year — significant improvement. Still anxious but using strategies.', parentComment:'She slept better this mock season. Progress.', nextSteps:'Continue counselling through GCSE season. Check in after each exam.', by:'Miss A Jones — ongoing' },
      ],
    },
    {
      id:'isp-10020', name:'Jayden Brown', arborId:'10020',
      year:'Year 7', form:'7D', school:'North Manchester', gender:'Male', dob:'2013-05-22',
      level:'K+', staff:'Miss A Jones', updated:'20 Mar 2026',
      lastEdited: '2026-03-20T11:30:00.000Z',
      overview:{ created:'2026-01-10', reviewed:'2026-03-20', level:'K+', attendance:'82', diagnoses:'K+ — SEMH, emotional dysregulation', staff:'Miss A Jones', agencies:'CAMHS, Early Help' },
      summary:'Jayden is an energetic and creative student with a good sense of humour and strong peer relationships when regulated. He is on the SEND K+ register with significant SEMH needs including emotional dysregulation. Jayden benefits from consistent boundaries, trusted adult relationships and proactive co-regulation strategies.',
      areas:['social','executive'],
      strengths:{ social:'Good sense of humour. Can be empathetic and supportive of peers when settled. Responds well to familiar adults.', executive:'Strong verbal reasoning. Motivated by practical, hands-on tasks.' },
      needs:{ social:'Frequent emotional dysregulation — can become disruptive or leave the room without warning. Finds transitions and unexpected change very difficult.', executive:'Difficulty initiating tasks and maintaining focus. Needs significant scaffolding to complete extended work.' },
      advice:{ social:'CAMHS assessment Jan 2026 — SEMH, emotional dysregulation profile. Early Help co-ordinator allocated.', executive:'' },
      health:{ health:'On SEND K+ register. SEMH — emotional dysregulation. Accessing CAMHS and Early Help. No current medication.', social:'Early Help plan in place. No social care involvement beyond Early Help.', ehcp:'No EHCP — K+ provision', links:'CAMHS letter Jan 2026, Early Help plan' },
      targets:[
        { area:'Social and emotional', outcome:'For Jayden to use his co-regulation strategies to remain in the classroom and manage his emotions during the school day.', smart:'Within this half-term, Jayden will use his regulation plan (check-in → signal → step out) in at least 3 of 5 days per week. Target: no more than 2 unplanned exits from class per week by half-term, as recorded by key adult.' },
        { area:'Executive function', outcome:'For Jayden to improve his ability to begin and sustain tasks with adult support.', smart:'Within 6 weeks, Jayden will independently start a given task within 5 minutes of instruction in at least 3 lessons per day, with visual task strips. Measured by class teacher record.' },
      ],
      editedTargets:{},
      provisions:{
        0:{ desc:'Daily key adult check-in (morning). Personalised co-regulation plan. Safe exit pass. Visual schedule for the day.', by:'Key adult (TA)', freq:'Daily — morning 10 min, access throughout', cost:'£2,800/term — school + Early Help contribution' },
        1:{ desc:'Visual task strips in all lessons. Pre-lesson briefing for transitions. TA check-in between lessons.', by:'All teaching staff / key adult', freq:'Every lesson', cost:'£0 — universal' },
      },
      riskFlags:['behaviour','cie'],
      strategies:{ social:'Trauma-informed approach. Daily morning check-in with key adult. Safe exit pass — always honoured without question. Avoid public correction; use private, calm redirects. Warn Jayden in advance of any changes to routine.', executive:'Visual task strips on desk. Break tasks into small, timed chunks. Praise task start and effort, not only completion. Avoid open-ended instructions.' },
      seating:{ social:'Near the door — safe exit plan in place. Away from peers who escalate him.' },
      voices:{ pupil:'Sometimes I just need to get out. If someone shouts it makes it worse.', parent:'Jayden gets overwhelmed easily. He is much better when he knows what to expect and feels trusted.' },
      apdr:[
        { date:'10 Jan 2026', target:0, progress:'none', schoolComment:'Jayden is settling into the plan. Exit pass being used daily — sometimes multiple times. Relationship with key adult is positive.', parentComment:'He talks about his key adult positively at home. Early days.', nextSteps:'Review co-regulation plan with CAMHS at next appointment. Consider EHCP if progress insufficient by summer.', by:'Miss A Jones — end of spring term' },
        { date:'20 Mar 2026', target:0, progress:'some', schoolComment:'Exits from class have reduced from approximately 5 to 2 per week. Jayden is beginning to signal before dysregulating on most days.', parentComment:'He is much more settled at home in the evenings. School feel right for him now.', nextSteps:'Maintain current plan. Begin graduated transition support for Year 8. Review EHCP need at summer.', by:'Miss A Jones — by end of summer term' },
      ],
    },
    {
      id:'isp-10016', name:'Felix Adeyemi', arborId:'10016',
      year:'Year 7', form:'7F', school:'North Manchester', gender:'Male', dob:'2013-09-08',
      level:'K+', staff:'Miss A Jones', updated:'14 Feb 2026',
      lastEdited: '2026-02-14T09:45:00.000Z',
      overview:{ created:'2026-01-20', reviewed:'2026-02-14', level:'K+', attendance:'85', diagnoses:'K+ — ADHD, social anxiety', staff:'Miss A Jones', agencies:'Paediatrician, school counsellor' },
      mis:{ attThis:'85', attLast:'81', susThis:'1', susLast:'0', bp:'28', intEx:'1' },
      summary:'Felix is a thoughtful and imaginative student who has a genuine love of science and technology. He is on the SEND K+ register with a confirmed ADHD diagnosis and significant social anxiety. Felix benefits from low-demand transitions, predictable routines, and staff who understand that his quietness and withdrawal are expressions of anxiety rather than defiance.',
      areas:['social','executive','slc'],
      strengths:{ social:'Warm and kind when comfortable with adults. Excellent one-to-one interaction. Very self-aware about his needs.', executive:'Highly motivated by topics of interest. Creative and detail-orientated.', slc:'Good written communication. Wide vocabulary.' },
      needs:{ social:'Social anxiety makes group work and unstructured social times very difficult. Avoids eye contact and struggles to initiate interactions. Attendance impacted on high-anxiety days.', executive:'ADHD — sustained attention, task-initiation and organisation significantly affected. Loses equipment. Forgets homework.', slc:'Reluctant to speak aloud in class. Anxiety increases significantly when called upon unexpectedly.' },
      advice:{ social:'School counsellor referral Feb 2026 — social anxiety assessment underway.', executive:'Paediatrician letter Jan 2026 — ADHD confirmed, medication under review.', slc:'' },
      health:{ health:'ADHD confirmed (paediatrician Jan 2026). Medication under review. Social anxiety — school counselling referral Feb 2026.', social:'No social care involvement.', ehcp:'No EHCP — K+ provision', links:'Paediatrician letter Jan 2026' },
      targets:[
        { area:'Social and emotional', outcome:'For Felix to manage his social anxiety in school and attend consistently.', smart:'Within this half-term, Felix will attend at least 90% of scheduled school sessions. He will use his agreed anxiety signal (yellow card) independently in at least 2 lessons per day. Measured by key adult log and register.' },
        { area:'Executive function', outcome:'For Felix to develop reliable organisational routines to support his ADHD.', smart:'By end of term, Felix will use his homework planner and equipment checklist independently on at least 4 of 5 school days per week. Monitored weekly by form tutor.' },
        { area:'Speech, language and communication', outcome:'For Felix to feel safe enough to contribute verbally in lessons on his own terms.', smart:'Within 6 weeks, Felix will verbally contribute to at least one lesson discussion per day — on a topic of his choice or with prior notice. Recorded by class teachers.' },
      ],
      editedTargets:{},
      provisions:{
        0:{ desc:'Fortnightly school counselling (social anxiety). Personal anxiety signal card. Key adult check-in three times per week.', by:'School counsellor / form tutor', freq:'Fortnightly counselling; 3x weekly check-in', cost:'£180/term — school' },
        1:{ desc:'Homework planner and equipment checklist. Reduced homework volume agreed with SENCO. Chunked task instructions.', by:'All teaching staff / form tutor', freq:'Daily — universal', cost:'£0' },
        2:{ desc:'No cold-calling in class. Prior notice given before verbal contribution expected. Opt-in discussion format where possible.', by:'All teaching staff', freq:'Every lesson', cost:'£0 — universal' },
      },
      riskFlags:['medical'],
      strategies:{ social:'No cold-calling. Give Felix advance notice (minimum 24h) before any public presentation. Validate anxiety without reinforcing avoidance. Allow him to settle quietly at lesson start.', executive:'Homework planner signed off daily by form tutor. Equipment checklist in planner. Chunk all multi-step instructions. Written instructions on board alongside verbal.', slc:'Allow written responses as an alternative to verbal. Seat near front but not in spotlight. Never put Felix on the spot in front of peers.' },
      seating:{ social:'Near front — low distraction. Away from peers who distract or increase his anxiety.' },
      voices:{ pupil:'I get really nervous when I have to talk in front of people. I am better when I know what is coming.', parent:'Felix has always been anxious. The ADHD diagnosis has helped us understand him so much better. He needs calm, structure and patience.' },
      apdr:[
        { date:'14 Feb 2026', target:0, progress:'some', schoolComment:'Felix is attending more consistently since the anxiety signal card was introduced. Still struggles with unstructured times. Medication review with paediatrician next month.', parentComment:'He seems less dread-ful about school mornings. Small but real progress.', nextSteps:'Review medication impact after paediatrician appointment. Counselling to continue. Revisit EHCP need at summer review.', by:'Miss A Jones — by summer term' },
      ],
    },
    {
      id:'isp-10021', name:'Oliver Oaks', arborId:'10021',
      year:'Year 5', form:'5B', school:'Northwood', gender:'Male', dob:'2015-10-14',
      level:'E', staff:'Miss A Jones', updated:'01 May 2026',
      lastEdited: '2026-05-01T09:00:00.000Z',
      overview:{ created:'2026-05-01', reviewed:'', level:'E', attendance:'90', diagnoses:'EHCP — ADHD, focus support needs', staff:'Miss A Jones', agencies:'Educational Psychology' },
      mis:{ attThis:'90', attLast:'92', susThis:'0', susLast:'0', bp:'15', intEx:'' },
      summary:'Oliver has an initiated support plan for ADHD and focus support needs. His plan is in the early stages, with targets and strategies defined but no review cycles completed yet.',
      areas:['executive'],
      strengths:{ executive:'Highly creative and works well in hands-on practical settings.' },
      needs:{ executive:'Struggles with task attention and focus in lecture-style instruction.' },
      advice:{ executive:'Educational Psychology consult pending.' },
      health:{ health:'ADHD diagnosis. No medication.', social:'None.', ehcp:'EHCP in place', links:'' },
      targets:[
        { area:'Executive function', outcome:'For Oliver to sustain attention on classroom tasks for 10 minutes.', smart:'By the end of the half-term, Oliver will remain on task for 10 minutes without prompting in 3 out of 5 core lessons daily, using a visual timer.' }
      ],
      editedTargets:{},
      provisions:{
        0:{ desc:'Visual timer and chunked instructions.', by:'Classroom Teacher', freq:'Daily', cost:'£0' }
      },
      strategies:{ executive:'Use visual timer. Break tasks into small 5-minute chunks. Provide immediate verbal praise.' },
      seating:{ executive:'Seated near front, away from windows and doors.' },
      voices:{ pupil:'I like school when I can build things. Sitting still for a long time is hard.', parent:'We hope the support plan will help him stay focused.' },
      apdr:[]
    }
  ];

  const firstNames = ['Oliver','Amelia','Harry','Olivia','Jack','Emily','Jacob','Jessica','Thomas','Sophie',
                      'George','Grace','William','Mia','Charlie','Lily','Lucas','Freya','Henry','Evie',
                      'Noah','Isabella','Ethan','Ella','Muhammad','Chloe','Alexander','Emily','Leo','Aria',
                      'Daniel','Scarlett','Arthur','Layla','Oscar','Zoe','James','Harper','Leo','Sophia',
                      'Aarav','Zara','Arjun','Sofia','Vivaan','Ananya','Aditya','Diya','Vihaan','Pari',
                      'Faith','Fatima','Faisal','Farrah'];
  const lastNames = ['Smith','Jones','Taylor','Brown','Williams','Wilson','Johnson','Davies','Robinson','Wright',
                     'Thompson','Evans','Walker','White','Roberts','Green','Hall','Wood','Jackson','Clarke',
                     'Patel','Khan','Singh','Begum','Ali','Ahmed','Hussain','Rossi','Gomez','Garcia',
                     'Muller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Schulz','Hoffmann',
                     'Tanaka','Sato','Suzuki','Takahashi','Watanabe','Ito','Yamamoto','Nakamura','Kobayashi','Kato'];

  function makeCompact(arborId, school, year, form) {
    const idNum = parseInt(arborId);
    const fname = firstNames[idNum % firstNames.length];
    const lname = lastNames[(idNum * 7) % lastNames.length];
    const name = fname + ' ' + lname;
    const gender = (idNum % 2 === 0) ? 'Female' : 'Male';
    const yearNum = parseInt(year.replace(/\D/g, '')) || 7;
    const birthYear = 2026 - (yearNum + 5);
    const dob = birthYear + '-05-15';
    const level = (idNum % 3 === 0) ? 'Targeted' : 'Monitoring';
    const attendance = 78 + (idNum % 22);
    const diagnoses = (idNum % 7 === 0) ? 'K — SEMH' : ((idNum % 11 === 0) ? 'K — SLCN' : '');

    return {
      id: 'isp-' + arborId,
      name: name,
      arborId: String(arborId),
      year: year,
      form: form,
      school: school,
      gender: gender,
      dob: dob,
      level: level,
      staff: 'Miss A Jones',
      updated: '10 Jan 2026',
      lastEdited: '2026-01-10T09:00:00.000Z',
      overview: { created: '2025-09-05', reviewed: '2026-01-10', level: level, attendance: String(attendance), diagnoses: diagnoses, staff: 'Miss A Jones', agencies: '', dob: dob },
      targets: [],
      provisions: {},
      apdr: []
    };
  }

  // Generate 94 more for North Manchester (IDs 10101-10194)
  for (let i = 1; i <= 94; i++) {
    const id = 10100 + i;
    const yNum = 7 + (i % 5);
    const form = yNum + String.fromCharCode(65 + (i % 6));
    list.push(makeCompact(id, 'North Manchester', 'Year ' + yNum, form));
  }

  // Generate 96 more for Primary Northwood & Glebe (IDs 10201-10296)
  for (let i = 1; i <= 96; i++) {
    const id = 10200 + i;
    const school = (i % 2 === 0) ? 'Northwood' : 'Glebe';
    const yNames = ['Nursery', 'Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
    const year = yNames[i % yNames.length];
    const form = (year.startsWith('Year') ? year.replace('Year ', '') : year.substring(0, 1).toUpperCase()) + String.fromCharCode(65 + (i % 3));
    list.push(makeCompact(id, school, year, form));
  }

  // Generate 28 more for Connell (IDs 10301-10328)
  for (let i = 1; i <= 28; i++) {
    const id = 10300 + i;
    const yNum = 12 + (i % 2);
    const form = yNum + String.fromCharCode(65 + (i % 4));
    list.push(makeCompact(id, 'Connell', 'Year ' + yNum, form));
  }

  return list;
})();function loadStoredISPs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

function applyDataFixes() {
  // Filter out any generated Oliver Oakes (arborId 20023) to avoid confusion/duplication with the handwritten Oliver Oaks (arborId 10021)
  state.isps = state.isps.filter(isp => String(isp.arborId) !== '20023' && normName(isp.name) !== 'oliver oakes');
  if (state.sheetStudents) {
    state.sheetStudents = state.sheetStudents.filter(s => String(s['Arbor ID']) !== '20023' && normName(s['Pupil Name']) !== 'oliver oakes');
  }

  // Hard-correct any known bad records regardless of sheet source
  state.isps.forEach(isp => {
    if (String(isp.arborId) === '10010' || normName(isp.name) === 'mia johnson') {
      isp.school = 'Northwood';
    }
    // Migrate North Manchester demo students to EHCP for Sandra Fiddler (Sandy)
    if (String(isp.arborId) === '10001' || normName(isp.name) === 'aarav patel') {
      isp.level = 'E';
      isp.school = 'North Manchester';
      isp.updated = '10 Jan 2026';
      if (isp.overview) {
        isp.overview.level = 'E';
        isp.overview.reviewed = '2026-01-10';
        isp.overview.diagnoses = 'EHCP — Autism spectrum condition, anxiety';
      }
      if (!isp.targets || isp.targets.length === 0) {
        const d = typeof DEMO_ISPS !== 'undefined' ? DEMO_ISPS.find(x => String(x.arborId) === '10001') : null;
        if (d) {
          isp.targets = JSON.parse(JSON.stringify(d.targets || []));
          isp.provisions = JSON.parse(JSON.stringify(d.provisions || {}));
          isp.strategies = JSON.parse(JSON.stringify(d.strategies || {}));
          isp.areas = JSON.parse(JSON.stringify(d.areas || []));
          isp.summary = d.summary;
        }
      }
      if (isp.apdr && isp.apdr[0]) {
        isp.apdr[0].date = '10 Jan 2026';
      } else {
        isp.apdr = [{ date: '10 Jan 2026', target: 0, progress: 'some', schoolComment: 'Aarav is attending the lunchtime group consistently.', parentComment: 'He seems happier.', nextSteps: 'Continue.', by: 'Miss A Jones' }];
      }
    }
    if (String(isp.arborId) === '10004' || normName(isp.name) === 'imani clarke') {
      isp.level = 'E';
      isp.school = 'North Manchester';
      if (isp.overview) {
        isp.overview.level = 'E';
        isp.overview.diagnoses = 'EHCP — Reading difficulties, possible dyslexia';
      }
      if (!isp.targets || isp.targets.length === 0) {
        const d = typeof DEMO_ISPS !== 'undefined' ? DEMO_ISPS.find(x => String(x.arborId) === '10004') : null;
        if (d) {
          isp.targets = JSON.parse(JSON.stringify(d.targets || []));
          isp.provisions = JSON.parse(JSON.stringify(d.provisions || {}));
          isp.strategies = JSON.parse(JSON.stringify(d.strategies || {}));
          isp.areas = JSON.parse(JSON.stringify(d.areas || []));
          isp.summary = d.summary;
        }
      }
    }
    if (String(isp.arborId) === '10009' || normName(isp.name) === 'hiro tanaka') {
      isp.level = 'E';
      isp.school = 'North Manchester';
      if (isp.overview) {
        isp.overview.level = 'E';
        isp.overview.diagnoses = 'EHCP — Autism, SEMH, demand avoidance profile';
      }
      if (!isp.targets || isp.targets.length === 0) {
        const d = typeof DEMO_ISPS !== 'undefined' ? DEMO_ISPS.find(x => String(x.arborId) === '10009') : null;
        if (d) {
          isp.targets = JSON.parse(JSON.stringify(d.targets || []));
          isp.provisions = JSON.parse(JSON.stringify(d.provisions || {}));
          isp.strategies = JSON.parse(JSON.stringify(d.strategies || {}));
          isp.areas = JSON.parse(JSON.stringify(d.areas || []));
          isp.summary = d.summary;
        }
      }
    }
    if (String(isp.arborId) === '10021' || normName(isp.name) === 'oliver oaks' || normName(isp.name) === 'oliver oakes') {
      isp.name = 'Oliver Oaks';
      isp.level = 'E';
      isp.school = 'Northwood';
      isp.year = 'Year 5';
      isp.form = '5B';
      isp.arborId = '10021';
      isp.id = 'isp-10021';
      if (isp.overview) {
        isp.overview.level = 'E';
        isp.overview.reviewed = '';
        isp.overview.diagnoses = 'EHCP — ADHD, focus support needs';
      }
      if (!isp.targets || isp.targets.length === 0) {
        const d = typeof DEMO_ISPS !== 'undefined' ? DEMO_ISPS.find(x => String(x.arborId) === '10021') : null;
        if (d) {
          isp.targets = JSON.parse(JSON.stringify(d.targets || []));
          isp.provisions = JSON.parse(JSON.stringify(d.provisions || {}));
          isp.strategies = JSON.parse(JSON.stringify(d.strategies || {}));
          isp.areas = JSON.parse(JSON.stringify(d.areas || []));
          isp.summary = d.summary;
        }
      }
      isp.apdr = [];
    }
    if (String(isp.arborId) === '10003' || normName(isp.name) === 'kwame mensah') {
      isp.updated = '15 Jan 2026';
      if (isp.overview) isp.overview.reviewed = '2026-01-15';
      if (isp.apdr && isp.apdr[0]) isp.apdr[0].date = '15 Jan 2026';
    }
    if (String(isp.arborId) === '10008' || normName(isp.name) === 'olivia thomas') {
      isp.updated = '30 Jan 2026';
      if (isp.overview) isp.overview.reviewed = '2026-01-30';
      if (isp.apdr && isp.apdr[0]) isp.apdr[0].date = '30 Jan 2026';
    }
  });

  // Ensure all DEMO_ISPS exist in state.isps and state.sheetStudents
  if (typeof DEMO_ISPS !== 'undefined') {
    DEMO_ISPS.forEach(d => {
      const existsIsp = state.isps.some(isp => {
        if (String(d.arborId) === '10021') {
          return String(isp.arborId) === '10021' || normName(isp.name) === 'oliver oaks' || normName(isp.name) === 'oliver oakes';
        }
        return String(isp.arborId) === String(d.arborId);
      });
      if (!existsIsp) {
        state.isps.push(JSON.parse(JSON.stringify(d)));
      }
      
      if (!state.sheetStudents) state.sheetStudents = [];
      const existsStudent = state.sheetStudents.some(s => {
        if (String(d.arborId) === '10021') {
          return String(s['Arbor ID']) === '10021' || normName(s['Pupil Name']) === 'oliver oaks' || normName(s['Pupil Name']) === 'oliver oakes';
        }
        return String(s['Arbor ID']) === String(d.arborId);
      });
      if (!existsStudent) {
        state.sheetStudents.push({
          "Arbor ID": parseInt(d.arborId),
          "UPN": 800000000000 + parseInt(d.arborId),
          "School": d.school,
          "Pupil Name": d.name,
          "NC Year": d.year,
          "Date of Birth": d.dob,
          "Form": d.form,
          "Sex": d.gender || 'Male',
          "SEN Status": d.level === 'E' ? "Education, Health and Care Plan" : (d.level === 'Targeted' || d.level === 'K' || d.level === 'K+' ? "SEN Support" : "No Special Educational Need"),
          "Attendance this Term": d.overview?.attendance ? parseInt(d.overview.attendance)/100 : 0.95
        });
      }
    });
  }

  // Override sheetStudents schools and details for demo students
  if (state.sheetStudents) {
    state.sheetStudents.forEach(s => {
      const aid = String(s['Arbor ID']);
      const isOliver = (aid === '10021' || normName(s['Pupil Name']) === 'oliver oaks' || normName(s['Pupil Name']) === 'oliver oakes');
      if (aid === '10001' || aid === '10004' || aid === '10009' || isOliver) {
        s['School'] = isOliver ? 'Northwood' : 'North Manchester';
        s['SEN Status'] = 'Education, Health and Care Plan';
        if (isOliver) {
          s['Pupil Name'] = 'Oliver Oaks';
          s['Arbor ID'] = 10021;
          s['NC Year'] = 'Year 5';
          s['Form'] = '5B';
        }
        if (aid === '10001') {
          s['Pupil Name'] = 'Aarav Patel';
        }
        if (aid === '10009') {
          s['Pupil Name'] = 'Hiro Tanaka';
        }
      }
    });
  }
  
  // Deduplicate state.isps and state.sheetStudents to ensure no duplicate records exist
  state.isps = deduplicateISPs(state.isps);
  
  if (state.sheetStudents) {
    const studentMap = new Map();
    state.sheetStudents.forEach(s => studentMap.set(String(s['Arbor ID']), s));
    state.sheetStudents = Array.from(studentMap.values());
  }
}

function saveISPs() {
  applyDataFixes();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.isps)); } catch(e) {}
}

async function loadStudentsFromBigQuery() {
  if (!googleAccessToken) return;
  const query = `SELECT * FROM \`${GCP_PROJECT_ID}.${BQ_DATASET}.${BQ_TABLE}\``;
  try {
    const resp = await fetch(
      `https://bigquery.googleapis.com/bigquery/v2/projects/${GCP_PROJECT_ID}/queries`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, useLegacySql: false, timeoutMs: 10000 })
      }
    );
    const data = await resp.json();
    if (!data.schema || !data.rows) return;

    const fields = data.schema.fields.map(f => f.name);
    const students = data.rows.map(row => {
      const obj = {};
      row.f.forEach((cell, i) => { obj[fields[i]] = cell.v; });
      // Map BigQuery field names to the format the app uses internally
      return {
        'Arbor ID':                     obj.Arbor_ID || '',
        'UPN':                          obj.UPN || '',
        'School':                       obj.School || '',
        'Pupil Name':                   obj.Pupil_Name || '',
        'NC Year':                      obj.NC_Year || '',
        'DOB':                          obj.Date_of_Birth || '',
        'Form':                         obj.Form || '',
        'Sex':                          obj.Sex || '',
        'Key Stage':                    obj.Key_Stage || '',
        'FSM':                          obj.FSM || '',
        'PP':                           obj.PP || '',
        'KSS/PKSS':                     obj.KSS_PKSS || '',
        'SEN Status':                   obj.SEN_Status || '',
        'Ethnicity':                    obj.Ethnicity || '',
        'GRT':                          obj.GRT || '',
        'EAL':                          obj.EAL || '',
        'Behaviour Points':             obj.Behaviour_Points || '',
        'Attendance This Term':         obj.Attendance_this_Term || '',
        'Attendance Last Term':         obj.Attendance_Last_Term || '',
        'Suspensions this Year':        obj.Suspensions_this_Year || '',
        'Suspensions Last Year':        obj.Suspensions_Last_Year || '',
        'Internal Exclusions this Year': obj.Internal_Exclusions_this_Year || '',
        'Lead Responsible':             obj.Lead_Responsible || '',
        _id: String(obj.Arbor_ID || obj.UPN || '')
      };
    });

    // Merge BigQuery students into state — BigQuery data wins over mock/local
    const studentMap = new Map((state.sheetStudents || []).map(s => [String(s['Arbor ID']), s]));
    students.forEach(s => studentMap.set(String(s['Arbor ID']), s));
    state.sheetStudents = Array.from(studentMap.values());

    applyDataFixes();
    backfillMISFromSheet();
    renderDashboard();
  } catch(e) {
    // Silent fail — app continues with existing local/demo data
  }
}

const DELETED_KEY = 'isp-deleted-fingerprints';
function loadDeletedFingerprints() {
  try { return JSON.parse(localStorage.getItem(DELETED_KEY) || '[]'); } catch(e) { return []; }
}
function saveDeletedFingerprint(isp) {
  const list = loadDeletedFingerprints();
  list.push({ id: isp.id||'', arborId: String(isp.arborId||''), name: normName(isp.name) });
  try { localStorage.setItem(DELETED_KEY, JSON.stringify(list)); } catch(e) {}
}
function isDeletedFingerprint(isp) {
  const list = loadDeletedFingerprints();
  const aid  = String(isp.arborId||'');
  const name = normName(isp.name);
  return list.some(f => (f.id && f.id === isp.id) || (f.arborId && f.arborId === aid) || (f.name && f.name === name));
}

function suppressSheetRecord(id, arborId, name) {
  saveDeletedFingerprint({ id, arborId, name });
  loadSheetData();
}

function loadSheetUrl() { return localStorage.getItem(SHEET_URL_KEY) || DEFAULT_SHEET_URL; }
function saveSheetUrlLocal(url) { try { localStorage.setItem(SHEET_URL_KEY, url); } catch(e) {} }

function backfillMISFromSheet() {
  const students = state.sheetStudents || [];
  if (!students.length) return;
  state.isps.forEach(isp => {
    const arborId = String(isp.arborId || '');
    let s = arborId ? students.find(x => String(x['Arbor ID']) === arborId || String(x['UPN']) === arborId) : null;
    // fallback: match by normalised name
    if (!s && isp.name) {
      const nn = normName(isp.name);
      s = students.find(x => normName(x['Pupil Name'] || '') === nn);
    }
    if (!s) return;
    function normAttV(v) { const n = parseFloat(v); if (isNaN(n)) return ''; return n > 0 && n <= 1 ? String(Math.round(n*1000)/10) : String(Math.round(n*10)/10); }
    const nullish2 = v => (v === null || v === undefined || v === '') ? null : v;
    const pct     = nullish2(sheetVal(s,'Present','Attendance %','Attendance','Att %','Att%','attendance'));
    const attThis = normAttV(nullish2(sheetVal(s,'Attendance This Term','Att This Term','This Term Attendance','Current Term Attendance')) ?? pct ?? '');
    const attLast = normAttV(nullish2(sheetVal(s,'Attendance Last Term','Att Last Term','Last Term Attendance','Previous Term Attendance')) ?? '');
    const susThis = nullish2(sheetVal(s,'Suspensions this Year','Suspensions This Year','Suspensions','Sus This Year'));
    const susLast = nullish2(sheetVal(s,'Suspensions Last Year','Sus Last Year','Previous Year Suspensions'));
    const bp      = nullish2(sheetVal(s,'Behaviour Points','Behaviour Pts','BehaviourPoints'));
    const intEx   = nullish2(sheetVal(s,'Internal Exclusions this Year','Internal Exclusions','Internal Excl','Int Excl'));
    const ex = isp.mis || {};
    isp.mis = {
      attThis: attThis !== '' ? attThis : (ex.attThis ?? ''),
      attLast: attLast !== '' ? attLast : (ex.attLast ?? ''),
      susThis: susThis !== null ? String(susThis) : (ex.susThis ?? ''),
      susLast: susLast !== null ? String(susLast) : (ex.susLast ?? ''),
      bp:      bp      !== null ? String(bp)      : (ex.bp      ?? ''),
      intEx:   intEx   !== null ? String(intEx)   : (ex.intEx   ?? ''),
    };
  });
}

async function loadSheetData() {
  if (!state.sheetUrl) return;
  try {
    const r = await fetch(state.sheetUrl, { cache: 'no-store' });
    const d = await r.json();
    
    // Merge sheet students with generated mock students
    const sheetStudentsRaw = d.students || [];
    if (typeof getGeneratedMockData !== 'undefined') {
      const { students: mockStudents } = getGeneratedMockData();
      const studentMap = new Map();
      mockStudents.forEach(s => studentMap.set(String(s['Arbor ID']), s));
      sheetStudentsRaw.forEach(s => studentMap.set(String(s['Arbor ID']), s));
      state.sheetStudents = Array.from(studentMap.values());
    } else {
      state.sheetStudents = sheetStudentsRaw;
    }
    // Normalise every sheet student to a single canonical _id (Arbor ID preferred over UPN)
    state.sheetStudents.forEach(s => { s._id = String(s['Arbor ID'] || s['UPN'] || ''); });

    // Prepare merging ISPs: sheet ISPs + local/mock ISPs
    const ispMap = new Map();
    if (typeof getGeneratedMockData !== 'undefined') {
      const { isps: mockISPs } = getGeneratedMockData();
      mockISPs.forEach(i => ispMap.set(i.id, i));
    }
    state.isps.forEach(i => ispMap.set(i.id, i)); // Local edits take precedence over mock

    if (d.isps && d.isps.length) {
      const sheetFiltered = d.isps.filter(i => { try { return !isDeletedFingerprint(i); } catch(e) { return true; } });
      const localNames    = new Set(state.isps.map(i => normName(i.name)));
      const localArborIds = new Set(state.isps.map(i => String(i.arborId||'')).filter(Boolean));
      const localIds      = new Set(state.isps.map(i => i.id));
      const knownSheet    = sheetFiltered.filter(i =>
        localIds.has(i.id) || localArborIds.has(String(i.arborId||'')) || localNames.has(normName(i.name))
      );
      knownSheet.forEach(i => ispMap.set(i.id, i)); // Sheet edits override local/mock
    }

    state.isps = deduplicateISPs(Array.from(ispMap.values()));

    // Restore MIS data that was stripped by sheet records
    const localMISById     = new Map(state.isps.filter(i=>i.mis).map(i=>[i.id, i.mis]));
    const localMISByArbor  = new Map(state.isps.filter(i=>i.mis&&i.arborId).map(i=>[String(i.arborId), i.mis]));
    state.isps.forEach(isp => {
      if (!isp.mis || !isp.mis.attLast) {
        const restored = localMISById.get(isp.id) || localMISByArbor.get(String(isp.arborId||''));
        if (restored && restored.attLast) isp.mis = restored;
      }
    });

    applyDataFixes();
    backfillMISFromSheet();
    saveISPs();
    renderDashboard();
  } catch(e) {
    console.warn('Sheet load failed:', e);
  }
}

async function pushAllISPsToSheet() {
  if (!state.sheetUrl || !state.isps.length) return;
  const btn = document.getElementById('push-all-btn');
  if (btn) { btn.textContent = '↑ Pushing…'; btn.disabled = true; }
  await Promise.all(state.isps.map(isp => postToSheet(isp)));
  if (btn) { btn.textContent = `✓ ${state.isps.length} ISPs pushed`; btn.disabled = false; }
  // Reload from sheet to confirm
  await loadSheetData();
}

async function postToSheet(isp) {
  if (!state.sheetUrl) return;
  try {
    // Use GET with the ISP JSON split into ≤1500-char chunks to stay well
    // under URL limits. Apps Script GET requests work reliably cross-origin.
    const json = JSON.stringify(isp);
    const CHUNK = 1500;
    const chunks = [];
    for (let i = 0; i < json.length; i += CHUNK) chunks.push(json.slice(i, i + CHUNK));
    const id = encodeURIComponent(isp.id);
    const total = chunks.length;
    // Send each chunk
    for (let n = 0; n < chunks.length; n++) {
      const url = `${state.sheetUrl}?action=chunk&id=${id}&n=${n}&total=${total}&data=${encodeURIComponent(chunks[n])}`;
      await fetch(url);
    }
    // Commit
    await fetch(`${state.sheetUrl}?action=commit&id=${id}`);
  } catch(e) {
    console.warn('Sheet post failed:', e);
  }
}

function showSheetSettings() {
  document.getElementById('sheet-modal').style.display = 'flex';
  document.getElementById('sheet-url-input').value = state.sheetUrl || '';
  const c = document.getElementById('push-isp-count');
  if (c) c.textContent = state.isps.length;
}

function closeSheetSettings() {
  document.getElementById('sheet-modal').style.display = 'none';
}

async function saveSheetSettings() {
  const url = document.getElementById('sheet-url-input').value.trim();
  const isNew = url && url !== state.sheetUrl;
  state.sheetUrl = url;
  saveSheetUrlLocal(url);
  closeSheetSettings();
  if (url) {
    await loadSheetData();
    // On first connection (or URL change), push any existing ISPs to the sheet
    if (isNew && state.isps.length) pushAllISPsToSheet();
  }
}

async function testSheetConnection() {
  const url = document.getElementById('sheet-url-input').value.trim();
  const btn = document.getElementById('test-sheet-btn');
  if (!url) { alert('Paste the Apps Script URL first.'); return; }
  btn.textContent = 'Testing…'; btn.disabled = true;
  try {
    const r = await fetch(url, { cache: 'no-store' });
    const d = await r.json();
    const n = (d.students || []).length;
    btn.textContent = '✓ Test connection';
    btn.disabled = false;
    alert(`✓ Connected! ${n} student records found.`);
  } catch(e) {
    btn.textContent = '✓ Test connection';
    btn.disabled = false;
    alert('Connection failed. Check the URL and deployment settings.');
  }
}

/* Student autocomplete */
function userHasAccessToSchoolName(schoolName) {
  if (!state.user || !state.user.allowedAcademies || state.user.allowedAcademies.length === 0) return true;
  const clean = (schoolName || '').toLowerCase().replace('co-op academy ', '').replace(' (demo)', '').trim();
  return state.user.allowedAcademies.some(acc => {
    return clean === acc.toLowerCase().replace('co-op academy ', '').replace(' (demo)', '').trim();
  });
}

function filterStudents(q) {
  if (!q || q.length < 2) return [];
  const ql = q.toLowerCase();
  
  // Find sheet students the user has access to
  const allowedSheet = (state.sheetStudents || []).filter(s => userHasAccessToSchoolName(s['School']));
  if (allowedSheet.length > 0) {
    return allowedSheet.filter(s => {
      const name = (s['Pupil Name'] || '').toLowerCase();
      return name.includes(ql);
    }).slice(0, 8);
  }
  
  // Fallback: search in ARBOR_DB when offline or no sheet records for this user
  return Object.entries(ARBOR_DB)
    .filter(([id, s]) => {
      if (!userHasAccessToSchoolName(s.school)) return false;
      return (s.fullName || '').toLowerCase().includes(ql);
    })
    .map(([id, s]) => ({
      'Arbor ID': id,
      'Pupil Name': s.fullName,
      'NC Year': s.year,
      'Form': s.form,
      'UPN': id,
      'Sex': s.gender,
      'Date of Birth': s.dob || '',
      'School': s.school,
      'Attendance': s.attendance,
      'SEN Status': s.diagnoses || '',
      'FSM': 'No',
      'PP': 'No',
      'EAL': 'No',
      'Lead Responsible': 'Miss A Jones'
    }))
    .slice(0, 8);
}

function onStudentSearchInput() {
  const q = document.getElementById('student-name-search').value;
  const matches = filterStudents(q);
  const list = document.getElementById('student-autocomplete');
  if (!matches.length) { list.style.display = 'none'; return; }
  list.innerHTML = matches.map(s => {
    const aid = studentKey(s);
    const name = s['Pupil Name'] || '';
    const yr = s['NC Year'] || '';
    const fm = s['Form'] || '';
    return `<div class="ac-item" onclick="selectStudent('${esc(aid)}')" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center" onmouseover="this.style.background='var(--teal-light)'" onmouseout="this.style.background=''">
      <span style="font-weight:600;font-size:14px">${esc(name)}</span>
      <span style="font-size:12px;color:var(--muted)">${esc(yr)} · ${esc(fm)}</span>
    </div>`;
  }).join('');
  list.style.display = 'block';
}

function selectStudent(arborId) {
  const s = findSheetStudent(arborId);
  document.getElementById('student-autocomplete').style.display = 'none';
  if (!s) return;

  const fullName = s['Pupil Name'] || '';
  const parts = fullName.trim().split(' ');
  const fname = parts[0] || '';
  const lname = parts.slice(1).join(' ') || '';

  document.getElementById('student-name-search').value = fullName;
  state.student.arborId = String(s['Arbor ID'] || s['UPN']);
  state.student.upn     = String(s['UPN'] || s['Arbor ID']);

  const existingIdx = state.isps.findIndex(isp => {
    if (state.student.arborId && isp.arborId) {
      return String(isp.arborId) === String(state.student.arborId);
    }
    // Only fall back to name matching if neither record has an ID
    if (!state.student.arborId && !isp.arborId && fullName) {
      return normName(isp.name) === normName(fullName);
    }
    return false;
  });

  const banner = document.getElementById('found-banner');
  banner.style.display = 'block';
  if (existingIdx !== -1) {
    banner.innerHTML = `✓ Record found — <strong>${esc(fullName)}</strong> · UPN ${esc(s['UPN'] || s['Arbor ID'])}<br><span style="color:#c0392b;font-weight:bold;margin-top:4px;display:inline-block">⚠️ An ISP already exists for this student. Continuing will edit/review the existing plan.</span>`;
  } else {
    banner.innerHTML = `✓ Record found — <strong>${esc(fullName)}</strong> · UPN ${esc(s['UPN'] || s['Arbor ID'])}`;
  }

  // Info card — use sheetVal for resilient column matching
  const nullish = v => (v === null || v === undefined || v === '') ? null : v;
  const pct      = nullish(sheetVal(s, 'Present', 'Attendance %', 'Attendance', 'Att %', 'Att%', 'attendance'));
  const attLast  = nullish(sheetVal(s, 'Attendance Last Term', 'Att Last Term', 'Last Term Attendance', 'Previous Term Attendance'));
  const attThis  = nullish(sheetVal(s, 'Attendance This Term', 'Att This Term', 'This Term Attendance', 'Current Term Attendance')) ?? pct;
  const bp       = nullish(sheetVal(s, 'Behaviour Points', 'Behaviour Pts', 'BehaviourPoints')) ?? '—';
  const susThis  = nullish(sheetVal(s, 'Suspensions this Year', 'Suspensions This Year', 'Suspensions', 'Sus This Year')) ?? '—';
  const susLast  = nullish(sheetVal(s, 'Suspensions Last Year', 'Sus Last Year', 'Previous Year Suspensions')) ?? '—';
  const intEx    = nullish(sheetVal(s, 'Internal Exclusions this Year', 'Internal Exclusions', 'Internal Excl', 'Int Excl')) ?? '—';
  const sen      = sheetVal(s, 'SEN Status', 'SEN') || '—';
  const fsm      = sheetVal(s, 'FSM') || '—';
  const pp       = sheetVal(s, 'PP') || '—';
  const eal      = sheetVal(s, 'EAL') || '—';
  const lead     = sheetVal(s, 'Lead Responsible', 'Lead') || '—';

  // Normalise attendance values: if stored as decimal (e.g. 0.816), convert to percentage
  function normAtt(v) {
    const n = parseFloat(v);
    if (isNaN(n)) return null;
    return n > 0 && n <= 1 ? Math.round(n * 1000) / 10 : Math.round(n * 10) / 10;
  }
  const attThisN = normAtt(attThis);
  const attLastN = normAtt(attLast);
  const attDelta = (attThisN !== null && attLastN !== null) ? (attThisN - attLastN) : null;
  const fmtAtt   = n => n !== null ? n.toFixed(1) + '%' : '—';
  const attDeltaStr = attDelta !== null ? (attDelta >= 0 ? `+${attDelta.toFixed(1)}%` : `${attDelta.toFixed(1)}%`) : null;
  const attDeltaCol = attDelta !== null ? (attDelta >= 0 ? '#27ae60' : '#c0392b') : '#888';

  // Behaviour points: green if ≥ 0, red if negative
  const bpNum   = parseFloat(bp);
  const bpColor = isNaN(bpNum) ? '#555' : bpNum < 0 ? '#c0392b' : '#27ae60';

  // Suspensions difference
  const susThisN = parseFloat(susThis);
  const susLastN = parseFloat(susLast);
  const susDiff  = (!isNaN(susThisN) && !isNaN(susLastN)) ? (susThisN - susLastN) : null;
  const susDiffStr = susDiff !== null ? (susDiff >= 0 ? `+${susDiff}` : `${susDiff}`) : null;
  const susDiffCol = susDiff !== null ? (susDiff > 0 ? '#c0392b' : '#27ae60') : '#888';

  function travelCard(val, label, accentColor) {
    return `<div style="text-align:center;flex:1;min-width:60px;padding:6px 10px">
      <div style="font-size:15px;font-weight:600;color:${accentColor};line-height:1.2">${val}</div>
      <div style="font-size:10px;color:var(--muted);margin-top:2px;letter-spacing:0.03em">${label}</div>
    </div>`;
  }
  function deltaChip(str, col) {
    if (!str) return '';
    return `<div style="display:flex;align-items:center;padding:0 8px 0 4px">
      <span style="font-size:11px;font-weight:600;color:${col};background:${col}15;border:1px solid ${col}35;border-radius:20px;padding:3px 8px;white-space:nowrap">${str}</span>
    </div>`;
  }
  function arrow() {
    return `<div style="display:flex;align-items:center;color:#ccc;font-size:13px;padding:0 1px;padding-bottom:10px">→</div>`;
  }
  function misSectionLabel(txt) {
    return `<div style="font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;padding-left:2px">${txt}</div>`;
  }

  const infoCard = document.getElementById('student-info-card');
  infoCard.style.display = 'block';
  infoCard.innerHTML = `
    <div style="padding:1rem 1.25rem;background:var(--bg);border-radius:var(--radius);border:1px solid var(--border);margin-bottom:1rem">
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">Attendance and Behaviour</div>

      <!-- Attendance + Suspensions in one white card -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:10px 12px;margin-bottom:10px">
        <!-- Attendance row -->
        <div style="margin-bottom:8px">
          ${misSectionLabel('Attendance')}
          <div style="display:flex;align-items:center">
            ${attLastN !== null ? travelCard(fmtAtt(attLastN), 'Last Term', '#444') + arrow() : ''}
            ${travelCard(fmtAtt(attThisN), attLastN !== null ? 'This Term' : 'Attendance', '#444')}
            ${deltaChip(attDeltaStr, attDeltaCol)}
          </div>
        </div>
        <div style="border-top:1px solid var(--border);margin:0 -2px 8px"></div>
        <!-- Suspensions row -->
        <div>
          ${misSectionLabel('Suspensions')}
          <div style="display:flex;align-items:center">
            ${!isNaN(susLastN) ? travelCard(susLast, 'Last Year', '#c0392b') + arrow() : ''}
            ${travelCard(susThis, !isNaN(susLastN) ? 'This Year' : 'Suspensions', '#c0392b')}
            ${deltaChip(susDiffStr ? susDiffStr + ' day' + (Math.abs(susDiff)!==1?'s':'') : null, susDiffCol)}
          </div>
        </div>
      </div>

      <!-- Behaviour & Internal Excl row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="background:var(--surface);border-radius:var(--radius);padding:8px 12px;text-align:center;border:1px solid var(--border)">
          <div style="font-size:15px;font-weight:600;color:${bpColor};line-height:1.2">${bp}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px">Behaviour Pts</div>
        </div>
        <div style="background:var(--surface);border-radius:var(--radius);padding:8px 12px;text-align:center;border:1px solid var(--border)">
          <div style="font-size:15px;font-weight:600;color:#e67e22;line-height:1.2">${intEx}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px">Internal Excl.</div>
        </div>
      </div>

      <!-- Tags -->
      <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:12px">
        <span style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:3px 10px"><strong>SEN:</strong> ${sen}</span>
        <span style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:3px 10px"><strong>FSM:</strong> ${fsm}</span>
        <span style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:3px 10px"><strong>PP:</strong> ${pp}</span>
        <span style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:3px 10px"><strong>EAL:</strong> ${eal}</span>
        <span style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:3px 10px"><strong>Lead:</strong> ${lead}</span>
        ${s['Pupil Passport Link']?`<a href="${s['Pupil Passport Link']}" target="_blank" style="background:var(--teal-light);border:1px solid rgba(15,110,86,0.3);border-radius:20px;padding:3px 10px;color:var(--teal);text-decoration:none;font-weight:600">📋 Pupil Passport</a>`:''}
      </div>
    </div>`;

  // Populate form fields
  const formFields = document.getElementById('arbor-form-fields');
  formFields.style.display = 'block';
  // Normalise DOB to YYYY-MM-DD for the date input
  const rawDob = s['Date of Birth'] || s['DOB'] || s['Dob'] || s['dob'] || '';
  let dobIso = '';
  if (rawDob) {
    const d = new Date(rawDob);
    if (!isNaN(d)) {
      dobIso = d.toISOString().slice(0, 10);
    } else {
      // Try DD/MM/YYYY
      const m = String(rawDob).match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
      if (m) dobIso = `${m[3].length===2?'20'+m[3]:m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    }
  }
  const school = s['School'] || s['School Name'] || s['School/Site'] || s['Site'] || '';
  const populate = {
    'f-fname': fname,
    'f-lname': lname,
    'f-dob': dobIso,
    'f-year': s['NC Year'] || '',
    'f-form': s['Form'] || '',
    'f-school': school,
  };
  Object.entries(populate).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) { el.value = val; el.readOnly = true; el.style.background = 'var(--bg)'; el.style.color = 'var(--muted)'; }
  });
  const genderEl = document.getElementById('f-gender');
  if (genderEl && s['Sex']) { genderEl.value = s['Sex']; genderEl.disabled = true; }
  state._prefill = {
    diagnoses: s['SEN Status'] || '',
    socialCare: '',
    upn: s['UPN'] || '',
    ethnicity: s['Ethnicity'] || '',
    eal: s['EAL'] || '',
    fsm: s['FSM'] || '',
    pp: s['PP'] || '',
    kssPkss: s['KSS/PKSS'] || '',
    behaviourPoints: bp !== '—' ? bp : '',
    attendance: attThisN !== null ? String(attThisN) : '',
    attLast: attLastN !== null ? String(attLastN) : '',
    suspensions: susThis !== '—' ? susThis : '',
    susLast: susLast !== '—' ? susLast : '',
    internalExclusions: intEx !== '—' ? intEx : '',
    lead: s['Lead Responsible'] || '',
    pupilPassportLink: s['Pupil Passport Link'] || '',
  };
}

const state = {
  user: null,
  student: {},
  step: 0,
  isps: (() => {
    const stored = loadStoredISPs();
    const initial = stored || DEMO_ISPS;
    
    // Merge initial with programmatically generated mock ISPs
    if (typeof getGeneratedMockData !== 'undefined') {
      const { isps: mockISPs } = getGeneratedMockData();
      const ispMap = new Map();
      mockISPs.forEach(i => ispMap.set(i.id, i));
      initial.forEach(i => ispMap.set(i.id, i)); // Local edits take precedence
      return Array.from(ispMap.values());
    }
    return initial;
  })(),
  viewingISP: null,
  sheetUrl: loadSheetUrl(),
  sheetStudents: (() => {
    if (typeof getGeneratedMockData !== 'undefined') {
      const { students } = getGeneratedMockData();
      return students;
    }
    return [];
  })(),
  formData: {
    overview: {},
    areas: [],
    strengths: {},
    needs: {},
    advice: {},
    health: {},
    targets: [],
    editedTargets: {},
    provisions: {},
    voices: { pupil:'', parent:'' },
  },
};

const STEPS = [
  { id:'overview',    label:'Overview' },
  { id:'needs',       label:'Strengths & needs' },
  { id:'health',      label:'Health & wellbeing' },
  { id:'targets',     label:'SMART targets' },
  { id:'provision',   label:'Provision' },
  { id:'voices',      label:'Voices' },
  { id:'review',      label:'Review & finalise' },
];

const AREA_LABELS = {
  executive: 'Executive function',
  motor:     'Motor and physical',
  sensory:   'Sensory',
  slc:       'Speech, language and communication',
  social:    'Social and emotional',
};


/* ── Navigation helpers ── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function handleGoogleLogin(response) {
  const errEl = document.getElementById('login-error');
  try {
    // Decode the JWT payload (no verification needed — Google already verified it)
    const payload = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
    const email = payload.email.toLowerCase();

    if (!email.endsWith('@coopacademies.co.uk')) {
      if (errEl) { errEl.textContent = 'Access is restricted to coopacademies.co.uk accounts.'; errEl.style.display = 'block'; }
      return;
    }

    // Temporary lockdown while the BigQuery integration is under development
    const DEV_ALLOWLIST = ['daniel.conley@coopacademies.co.uk', 'logan.mcmillan@coopacademies.co.uk'];
    if (!DEV_ALLOWLIST.includes(email)) {
      if (errEl) { errEl.textContent = 'This site is temporarily restricted during development.'; errEl.style.display = 'block'; }
      return;
    }

    // Store access token for BigQuery calls
    // GSI one-tap returns a credential (id_token), not an access token.
    // We use the OAuth2 implicit flow to also get an access token for BigQuery.
    requestBigQueryAccessToken(email, payload);
  } catch(e) {
    if (errEl) { errEl.textContent = 'Sign-in failed. Please try again.'; errEl.style.display = 'block'; }
  }
}

function requestBigQueryAccessToken(email, jwtPayload) {
  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/bigquery.readonly',
    hint: email,
    callback: (tokenResponse) => {
      if (tokenResponse.error) {
        const errEl = document.getElementById('login-error');
        if (errEl) { errEl.textContent = 'Could not get BigQuery access. Contact your administrator.'; errEl.style.display = 'block'; }
        return;
      }
      googleAccessToken = tokenResponse.access_token;
      completeLogin(email, jwtPayload);
    }
  });
  tokenClient.requestAccessToken({ prompt: '' });
}

function completeLogin(email, jwtPayload) {
  const allowed = (typeof USER_ACCESS_DB !== 'undefined' && USER_ACCESS_DB[email]) || [];
  const displayName = jwtPayload.name || email.split('@')[0];
  const nameParts = displayName.split(' ');
  const initials = nameParts.map(p => p.charAt(0).toUpperCase()).join('').slice(0,2);

  state.user = {
    name: displayName,
    initials: initials || 'ST',
    email: email,
    allowedAcademies: allowed,
    googlePicture: jwtPayload.picture || null
  };

  applyDataFixes();
  updateUserUI();
  renderDashboard();
  showScreen('screen-dashboard');
  loadSheetData();
  loadStudentsFromBigQuery();
}

function doLogin() {
  // Legacy fallback — no longer used, kept to avoid reference errors
}

function doSignOut() {
  state.user = null;
  showScreen('screen-login');
}

function updateUserUI() {
  if (!state.user) return;
  const { name, initials } = state.user;
  [['dash-av','dash-name'],['arbor-av','arbor-name'],['isp-av','isp-name-bar'],['comp-av','comp-name-bar'],['view-av','view-name-bar']].forEach(([av,nm])=>{
    const a = document.getElementById(av), n = document.getElementById(nm);
    if (a) a.textContent = initials;
    if (n) n.textContent = name;
  });
  const dw = document.getElementById('dash-welcome');
  if (dw) dw.textContent = `Welcome back. Review and edit Individual Support Plans (ISPs) below.`;
}

/* ── Dashboard sort/filter state ── */
const dashSort = { col: 'sen', dir: 'asc' };
let dashStatFilter = 'all'; // 'roll' | 'all' | 'review'

function hasAPDR(isp) {
  // Active/initiated support plan means it has targets, provisions, areas of need, or APDR review cycles started
  const hasTargets = Array.isArray(isp.targets) && isp.targets.length > 0;
  const hasProvisions = isp.provisions && Object.keys(isp.provisions).length > 0;
  const hasAreas = Array.isArray(isp.areas) && isp.areas.length > 0;
  const hasApdrCycles = Array.isArray(isp.apdr) && isp.apdr.length > 0;
  return hasTargets || hasProvisions || hasAreas || hasApdrCycles;
}

function parseDateToISO(str) {
  if (!str) return '';
  // Already ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str.trim())) return str.trim();
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  // "14 May 2026" or "14 May 26"
  const months = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
  const textDate = str.trim().match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{2,4})$/);
  if (textDate) {
    const mon = months[textDate[2].toLowerCase().slice(0,3)];
    if (mon) {
      const yr = textDate[3].length === 2 ? '20' + textDate[3] : textDate[3];
      return `${yr}-${mon}-${textDate[1].padStart(2,'0')}`;
    }
  }
  // Fallback: try JS Date parse
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return '';
}

function currentTermBounds() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1; // 1-based
  if (m >= 9)  return { start: new Date(y, 8, 1),  end: new Date(y, 11, 31) };   // Sep–Dec (autumn)
  if (m <= 4)  return { start: new Date(y, 0, 1),  end: new Date(y, 3, 30) };    // Jan–Apr (spring)
  return           { start: new Date(y, 4, 1),  end: new Date(y, 6, 31) };       // May–Jul (summer)
}

function isDueForReview(isp) {
  if (!hasAPDR(isp)) return false;
  
  let latestDate = null;
  if (isp.overview?.reviewed) {
    const d = new Date(isp.overview.reviewed);
    if (!isNaN(d.getTime())) latestDate = d;
  }
  
  if (Array.isArray(isp.apdr)) {
    isp.apdr.forEach(entry => {
      if (entry.date) {
        const d = new Date(entry.date);
        if (!isNaN(d.getTime())) {
          if (!latestDate || d > latestDate) {
            latestDate = d;
          }
        }
      }
    });
  }
  
  if (!latestDate) return true; // No reviews at all means due for review
  
  const { start, end } = currentTermBounds();
  return !(latestDate >= start && latestDate <= end);
}

function isCreatedThisTerm(isp) {
  if (!isp.overview?.created) return false;
  const created = new Date(isp.overview.created);
  const { start, end } = currentTermBounds();
  return created >= start && created <= end;
}

function toggleStatFilter(key) {
  // Clicking the active card again returns to 'all' (active ISPs), except 'roll' toggles back to 'all'
  dashStatFilter = (dashStatFilter === key) ? (key === 'roll' ? 'all' : 'all') : key;
  ['roll','all','review','archived'].forEach(k => {
    const el = document.getElementById('sc-' + k);
    if (el) el.classList.toggle('active', dashStatFilter === k);
  });
  renderDashboard();
}

function fmtLastEdited(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  if (diff < 7 * 86400) return Math.floor(diff/86400) + 'd ago';
  return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
}

function senCode(isp) {
  if (isp.level) {
    if (['E', 'K+', 'K', 'M'].includes(isp.level)) return isp.level;
    if (isp.level === 'Targeted Plus') return 'K+';
    if (isp.level === 'Targeted') return 'K+';
  }
  const d = ((isp.overview && isp.overview.diagnoses) || '').trim();
  if (/^ehcp/i.test(d) || /\behcp\b/i.test(d)) return 'E';
  if (/K\+/i.test(d)) return 'K+';
  if (/^K\b/i.test(d) || /\bK\b/.test(d)) return 'K';
  if (/^monitoring/i.test(d) || /\bmonitoring\b/i.test(d)) return 'M';
  return '';
}

const SEN_ORDER = { 'E': 0, 'K+': 1, 'K': 2, 'M': 3, '': 4 };

function sortISPs(isps) {
  const { col, dir } = dashSort;
  return [...isps].sort((a, b) => {
    let av, bv;
    if (col === 'sen') {
      // Always sort E > K+ > K > M > blank, then by surname within
      const ao = SEN_ORDER[senCode(a)] ?? 4, bo = SEN_ORDER[senCode(b)] ?? 4;
      if (ao !== bo) return ao - bo;
      return (a.name||'').split(' ').pop().localeCompare((b.name||'').split(' ').pop());
    }
    if (col === 'apdrCount') { av = (a.apdr||[]).length; bv = (b.apdr||[]).length; }
    else { av = a[col] || ''; bv = b[col] || ''; }
    if (col === 'year')       { av = parseInt(String(av).replace('Year ',''))||0; bv = parseInt(String(bv).replace('Year ',''))||0; }
    if (col === 'lastEdited') { av = av ? new Date(av).getTime() : 0; bv = bv ? new Date(bv).getTime() : 0; }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

function getFilterValues() {
  const filters = {};
  document.querySelectorAll('#dash-filter-row [data-col]').forEach(el => {
    if (el.value) filters[el.dataset.col] = el.value.toLowerCase();
  });
  const search = (document.getElementById('dash-search')?.value || '').toLowerCase();
  return { filters, search };
}

function filterISPs(isps) {
  const { filters, search } = getFilterValues();
  return isps.filter((isp) => {
    // SECURITY FILTER: Only show schools user has access to!
    if (!userHasAccessToSchoolName(isp.school)) return false;

    // Filter by closed/archived status based on dashStatFilter
    if (dashStatFilter === 'archived') {
      if (!isp.closed) return false;
    } else {
      if (isp.closed) return false;
      // 'roll' shows everyone; 'all' and 'review' show only APDR students
      if (dashStatFilter !== 'roll' && !hasAPDR(isp)) return false;
      if (dashStatFilter === 'review' && !isDueForReview(isp)) return false;
    }

    // Per-column filters
    for (const [col, val] of Object.entries(filters)) {
      if (col === 'sen') { if (senCode(isp) !== val.toUpperCase()) return false; continue; }
      const cell = String(isp[col] || '').toLowerCase();
      if (!cell.includes(val)) return false;
    }
    // Global search
    if (search) {
      const hay = [isp.name, isp.arborId, isp.year, isp.school, isp.staff, senCode(isp)].join(' ').toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}

function applyFilters() {
  renderDashboard();
}

/* ── Dashboard ── */
function normName(n) {
  return (n||'').toLowerCase().replace(/\s+/g,' ').trim().replace(/[^a-z0-9 ]/g,'');
}

function deduplicateISPs(isps) {
  // One row per student: deduplicate by arborId first, then name as fallback.
  // Keep the most recently edited version.
  const byArborId = new Map();
  const byName    = new Map();
  const result    = [];
  for (const isp of isps) {
    const arborKey = isp.arborId ? String(isp.arborId) : null;
    const nameKey  = normName(isp.name);
    // Check for existing match by arborId OR name
    const existing = (arborKey && byArborId.get(arborKey)) || (nameKey && byName.get(nameKey));
    const ts = isp.lastEdited ? new Date(isp.lastEdited).getTime() : 0;
    if (existing) {
      const ets = existing.lastEdited ? new Date(existing.lastEdited).getTime() : 0;
      if (ts >= ets) { // local always wins ties — sheet version only kept if genuinely newer
        // Replace with newer version
        const ri = result.indexOf(existing);
        if (ri >= 0) result.splice(ri, 1, isp);
        if (arborKey) byArborId.set(arborKey, isp);
        if (nameKey)  byName.set(nameKey, isp);
      }
    } else {
      result.push(isp);
      if (arborKey) byArborId.set(arborKey, isp);
      if (nameKey)  byName.set(nameKey, isp);
    }
  }
  return result;
}

function renderDashboard() {
  const tbody = document.getElementById('isp-tbody');
  const empty = document.getElementById('dash-empty');
  
  // Filter by allowed schools for the stats card and all listing
  const allISPs = deduplicateISPs(state.isps).filter(isp => userHasAccessToSchoolName(isp.school));

  const allowedStudents = (state.sheetStudents || []).filter(s => userHasAccessToSchoolName(s['School'] || s['school']));
  
  const activeISPs = allISPs.filter(isp => !isp.closed);
  const archivedISPs = allISPs.filter(isp => isp.closed);
  const apdrISPs = activeISPs.filter(hasAPDR);

  document.getElementById('stat-roll').textContent   = allowedStudents.length;
  document.getElementById('stat-total').textContent  = apdrISPs.length;
  document.getElementById('stat-review').textContent = apdrISPs.filter(isDueForReview).length;
  
  const statArchivedEl = document.getElementById('stat-archived');
  if (statArchivedEl) statArchivedEl.textContent = archivedISPs.length;

  ['roll','all','review','archived'].forEach(k => {
    const el = document.getElementById('sc-' + k);
    if (el) el.classList.toggle('active', dashStatFilter === k);
  });

  // Sort then filter, keeping original indices for actions
  const sorted = sortISPs(allISPs);
  const visible = filterISPs(sorted);

  // Update sort indicators
  document.querySelectorAll('#dash-thead th.sortable').forEach(th => {
    th.classList.remove('sort-asc','sort-desc');
    if (th.dataset.col === dashSort.col) th.classList.add(dashSort.dir === 'asc' ? 'sort-asc' : 'sort-desc');
  });
  // Attach sort click handlers (once per render)
  document.querySelectorAll('#dash-thead th.sortable').forEach(th => {
    th.onclick = () => {
      const col = th.dataset.col;
      if (dashSort.col === col) dashSort.dir = dashSort.dir === 'asc' ? 'desc' : 'asc';
      else { dashSort.col = col; dashSort.dir = 'asc'; }
      renderDashboard();
    };
  });

  if (!visible.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="padding:2rem;text-align:center;color:var(--muted);font-size:14px">No records match the current filters.</td></tr>`;
    empty.style.display = 'none';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = visible.map(isp => {
    const ispId = isp.id;
    const apdrCount = (isp.apdr||[]).length;
    const c = senCode(isp);
    const senCol = c==='E'?'#b71c1c':c==='K+'?'#c07000':c==='K'?'#b8860b':'#2e7d32';
    return `<tr style="cursor:pointer" onclick="openISPPreviewById('${ispId}')" title="Click to view ISP">
      <td style="white-space:nowrap">
        <div style="display:flex;align-items:center;gap:8px">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.7"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
          <strong>${isp.name}</strong>
        </div>
      </td>
      <td>${(isp.year||'').replace(/^Year\s*/i,'')}</td>
      <td style="font-size:13px;color:var(--muted)">${isp.school||'—'}</td>
      <td>${c ? `<span style="font-size:13px;font-weight:800;color:${senCol}">${c}</span>` : '<span style="color:var(--subtle)">—</span>'}</td>
      <td style="font-size:13px">${isp.staff||'—'}</td>
      <td style="text-align:center">
        ${apdrCount ? `<span style="display:inline-block;min-width:24px;font-size:13px;font-weight:700;color:var(--teal)">${apdrCount}</span>` : '<span style="color:var(--subtle)">—</span>'}
      </td>
      <td style="font-size:13px;color:var(--muted);white-space:nowrap">${fmtLastEdited(isp.lastEdited)}</td>
      <td onclick="event.stopPropagation()" style="white-space:nowrap">
        <div style="display:flex;gap:4px;align-items:center">
          <button title="Edit" onclick="editISPById('${ispId}')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 7px;cursor:pointer;font-size:12px;color:var(--muted)" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='none'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button title="Download PDF" onclick="downloadExistingPDFById('${ispId}')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 7px;cursor:pointer;font-size:12px;color:var(--muted)" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='none'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function idxById(id) { return state.isps.findIndex(i => i.id === id); }

function deleteISPById(id) { /* delete disabled — ISPs can only be edited, not removed */ }

function openISPPreview(idx) {
  state.previewIdx = idx;
  viewISP(idx);
}
function openISPPreviewById(id) { const i = idxById(id); if (i >= 0) openISPPreview(i); }

function editISPById(id) { const i = idxById(id); if (i >= 0) editISP(i); }
function downloadExistingPDFById(id) { const i = idxById(id); if (i >= 0) downloadExistingPDF(i); }

/* ── Arbor student database (from Graduated Approach Sheet) ── */
const ARBOR_DB = {};
DEMO_ISPS.forEach(isp => {
  const parts = isp.name.split(' ');
  const fname = parts[0] || '';
  const lname = parts.slice(1).join(' ') || '';
  ARBOR_DB[String(isp.arborId)] = {
    fullName: isp.name,
    fname: fname,
    lname: lname,
    year: isp.year,
    form: isp.form,
    diagnoses: isp.overview?.diagnoses || '',
    socialCare: isp.health?.social || '',
    school: isp.school,
    gender: isp.gender,
    attendance: isp.overview?.attendance || '',
    dob: isp.dob
  };
});

/* ── UPN lookup — auto-populate, confirm only ── */
function lookupArbor() {
  const val = document.getElementById('arbor-id-input').value.trim();
  if (!val || val.length < 4) { alert('Please enter a valid UPN (minimum 4 characters).'); return; }
  state.student.arborId = val;

  // Try to match in sheet students too
  const sheetRec = findSheetStudent(val);
  if (sheetRec) { selectStudent(val); return; }

  const record = ARBOR_DB[val];
  const banner = document.getElementById('found-banner');
  const formFields = document.getElementById('arbor-form-fields');

  if (record) {
    // Auto-populate all fields from database — read-only until "Edit details" clicked
    banner.style.display = 'block';
    banner.textContent = `✓ Student record found — UPN ${val}.`;
    formFields.style.display = 'block';
    const populate = { 'f-fname': record.fname, 'f-lname': record.lname, 'f-dob': '', 'f-year': record.year, 'f-form': record.form, 'f-school': record.school || 'Demo School' };
    Object.entries(populate).forEach(([id, val]) => {
      const el = document.getElementById(id);
      el.value = val;
      el.readOnly = true;
      el.style.background = 'var(--bg)';
      el.style.color = 'var(--muted)';
    });
    const genderEl = document.getElementById('f-gender');
    if (record.gender) { genderEl.value = record.gender; genderEl.disabled = true; }
    else { genderEl.value = ''; genderEl.disabled = false; }
    // Try to find the full sheet record so _prefill is as rich as the selectStudent path
    const sheetRec = findSheetStudent(val);
    if (sheetRec) { selectStudent(val); return; }
    state._prefill = { diagnoses: record.diagnoses, socialCare: record.socialCare };
  } else {
    banner.style.display = 'block';
    banner.textContent = `⚠ No record found for UPN ${val}. Please enter student details manually.`;
    formFields.style.display = 'block';
    ['f-fname','f-lname','f-dob','f-year','f-form','f-school'].forEach(id => { document.getElementById(id).value = ''; });
    state._prefill = null;
  }
}

const SCHOOL_PHASES = {
  'beckfield': 'Primary', 'broadhurst': 'Primary', 'brownhill': 'Primary',
  'clarice cliff': 'Primary', 'friarswood': 'Primary', 'glebe': 'Primary',
  'grove': 'Primary', 'hamilton': 'Primary', 'hillside': 'Primary',
  'medlock': 'Primary', 'new islington': 'Primary', 'nightingale': 'Primary',
  'northwood': 'Primary', 'oakwood': 'Primary', 'parkland': 'Primary',
  'penny oaks': 'Primary', 'portland': 'Primary', 'princeville': 'Primary',
  'smithies moor': 'Primary', 'woodlands': 'Primary', 'woodslee': 'Primary',
  'bebington': 'Secondary', 'belle vue': 'Secondary', 'failsworth': 'Secondary',
  'florence macwilliams': 'Secondary', 'grange': 'Secondary', 'leeds': 'Secondary',
  'manchester': 'Secondary', 'north manchester': 'Secondary', 'priesthorpe': 'Secondary',
  'stoke-on-trent': 'Secondary', 'swinton': 'Secondary', 'walkden': 'Secondary',
  'demo school': 'Secondary', 'manchester (demo)': 'Secondary', 'leeds (demo)': 'Secondary',
  'connell': 'Post-16', 'connell college': 'Post-16'
};

function getSchoolPhase(schoolName) {
  if (!schoolName) return null;
  const s = schoolName.toLowerCase().trim();
  for (const [key, phase] of Object.entries(SCHOOL_PHASES)) {
    if (s.includes(key)) return phase;
  }
  return null;
}

function getYearPhase(yearVal) {
  if (!yearVal) return null;
  // Strip non-breaking spaces and other unicode whitespace, then normalise
  const y = String(yearVal).replace(/[  -​  　]/g, ' ').toLowerCase().trim();
  if (y.includes('nursery') || y === 'reception' || y === 'r') return 'Primary';
  // Match the last number in the string (handles "Year 10", "Y10", "10", "Yr 10" etc.)
  const m = y.match(/\d+/g);
  if (m) {
    // Use the last numeric group to avoid matching "year" prefix digits in edge cases
    const num = parseInt(m[m.length - 1], 10);
    if (num >= 1 && num <= 6) return 'Primary';
    if (num >= 7 && num <= 11) return 'Secondary';
    if (num >= 12 && num <= 14) return 'Post-16';
  }
  return null;
}

function goToISPForm() {
  const fname = document.getElementById('f-fname').value.trim();
  const lname = document.getElementById('f-lname').value.trim();
  if (!fname || !lname) { alert('Please enter the student\'s first and last name.'); return; }
  const fullName = fname + ' ' + lname;
  const arborId = state.student.arborId;

  const schoolVal = document.getElementById('f-school').value.trim();
  const yearVal = document.getElementById('f-year').value.trim();
  const schoolPhase = getSchoolPhase(schoolVal);
  const yearPhase = getYearPhase(yearVal);
  if (schoolPhase && yearPhase && schoolPhase !== yearPhase) {
    const confirmMove = confirm(
      `⚠ School Mismatch Warning:\n\n` +
      `The year group "${yearVal}" (${yearPhase} phase) does not match the assigned school "${schoolVal}" (${schoolPhase} phase).\n\n` +
      `Are you sure you want to proceed with this school assignment?`
    );
    if (!confirmMove) return;
  }

  // Prevent duplicate ISP creation by checking if one already exists
  const existingIdx = state.isps.findIndex(isp => {
    if (arborId && isp.arborId) {
      return String(isp.arborId) === String(arborId);
    }
    if (!arborId && !isp.arborId && fullName) {
      return normName(isp.name) === normName(fullName);
    }
    return false;
  });

  if (existingIdx !== -1) {
    const existingIsp = state.isps[existingIdx];
    const isArchived = existingIsp.closed === true;
    const planText = isArchived ? 'already exists (Archived)' : 'already exists';
    const actionText = isArchived ? 'edit, review or reopen' : 'edit or review';
    const confirmEdit = confirm(
      `An Individual Support Plan (ISP) ${planText} for ${existingIsp.name}.\n\n` +
      `To prevent overwriting or duplicate plans, you cannot create a new one.\n\n` +
      `Click OK to ${actionText} the existing plan, or Cancel to go back to student lookup.`
    );
    if (confirmEdit) {
      editISP(existingIdx);
      // Preserve edited details from lookup screen
      state.student.dob = document.getElementById('f-dob').value || state.student.dob;
      state.student.year = document.getElementById('f-year').value || state.student.year;
      state.student.form = document.getElementById('f-form').value || state.student.form;
      state.student.school = document.getElementById('f-school').value || state.student.school;
      const gVal = document.getElementById('f-gender').value;
      if (gVal) state.student.gender = gVal;
    }
    return;
  }

  state.student = {
    arborId: state.student.arborId,
    fname, lname,
    fullName: fname + ' ' + lname,
    dob:    document.getElementById('f-dob').value,
    year:   document.getElementById('f-year').value,
    form:   document.getElementById('f-form').value,
    school: document.getElementById('f-school').value,
    gender: document.getElementById('f-gender').value,
  };
  const demoMatch = DEMO_ISPS.find(d => String(d.arborId) === String(arborId));
  const sendStatusPrefill = demoMatch ? (demoMatch.level || senCode(demoMatch)) : '';

  const prefill = state._prefill || {};
  state.step = 0;
  state.formData = {
    overview:      { diagnoses: prefill.diagnoses || '', staff: prefill.lead || '', attendance: prefill.attendance || '', level: sendStatusPrefill },
    mis:           { attThis: prefill.attendance||'', attLast: prefill.attLast||'', susThis: prefill.suspensions||'', susLast: prefill.susLast||'', bp: prefill.behaviourPoints||'', intEx: prefill.internalExclusions||'' },
    summary:       '',
    areas:         [],
    strengths:     {},
    needs:         {},
    advice:        {},
    strategies:    {},
    seating:       {},
    riskFlags:     [],
    health:        { social: prefill.socialCare ? `Social care involvement: ${prefill.socialCare}` : '', docs: [] },
    targets:       [],
    editedTargets: {},
    provisions:    {},
    voices:        { pupil:'', parent:'' },
  };
  state.student.upn = prefill.upn || '';
  state._prefill = null;
  document.getElementById('isp-topbar-name').textContent = `ISP — ${state.student.fullName}`;
  renderStep();
  showScreen('screen-isp');
}

function resetForm() {
  document.getElementById('arbor-id-input').value = '';
  document.getElementById('found-banner').style.display = 'none';
  document.getElementById('arbor-form-fields').style.display = 'none';
  document.getElementById('student-name-search').value = '';
  document.getElementById('student-autocomplete').style.display = 'none';
  const sic = document.getElementById('student-info-card'); if (sic) sic.style.display = 'none';
  ['f-fname','f-lname','f-dob','f-year','f-form','f-school'].forEach(id => {
    const el = document.getElementById(id);
    el.value = '';
    el.readOnly = false;
    el.style.background = '';
    el.style.color = '';
  });
  const gEl = document.getElementById('f-gender');
  if (gEl) { gEl.value = ''; gEl.disabled = false; }
  state._prefill = null;
  state.editingIdx = null;
  state.student = { arborId: '' };
}

/* ── Step navigation ── */
function renderSidebar() {
  document.getElementById('form-sidebar').innerHTML = STEPS.map((s,i) => `
    <div class="sidebar-step ${i<state.step?'done':i===state.step?'active':''}">
      <div class="step-dot">${i<state.step?'✓':(i+1)}</div>
      ${s.label}
    </div>`).join('');
}

function renderStep() {
  renderSidebar();
  const content = document.getElementById('form-content');
  const footer  = document.getElementById('form-footer');
  const s = state.step;
  const backBtn  = s > 0 ? `<button class="btn-secondary" onclick="prevStep()">← Back</button>` : '<span></span>';
  const nextBtn  = s < STEPS.length-1 ? `<button class="btn-primary" onclick="nextStep()">Continue →</button>` : '';

  if (s === 0) renderStep0(content);
  else if (s === 1) renderStep1(content);
  else if (s === 2) renderStep2(content);
  else if (s === 3) renderStep3(content);
  else if (s === 4) renderStep4(content);
  else if (s === 5) renderStep5(content);
  else if (s === 6) renderStep6(content);

  footer.innerHTML = `${backBtn}${nextBtn}`;
}

function validateCurrentStep() {
  const s = state.step;
  if (s === 1) {
    const selectedChips = document.querySelectorAll('.area-chip.selected');
    if (selectedChips.length === 0) {
      alert('Please select at least one development area.');
      return false;
    }
    for (let i = 0; i < selectedChips.length; i++) {
      const k = selectedChips[i].dataset.key;
      const strVal = document.getElementById('str-' + k)?.value.trim() || '';
      const needVal = document.getElementById('need-' + k)?.value.trim() || '';
      if (!strVal) {
        alert(`Please enter the strengths for the ${AREA_LABELS[k]} area.`);
        document.getElementById('str-' + k)?.focus();
        return false;
      }
      if (!needVal) {
        alert(`Please enter the needs / barriers to learning for the ${AREA_LABELS[k]} area.`);
        document.getElementById('need-' + k)?.focus();
        return false;
      }
    }
  } else if (s === 3) {
    const hasSelectors = !!document.getElementById('smart-' + (state.formData.areas[0] || ''));
    if (hasSelectors) {
      const areas = state.formData.areas || [];
      for (let i = 0; i < areas.length; i++) {
        const k = areas[i];
        const outcomeVal = document.getElementById('outcome-' + k)?.value.trim() || '';
        const smartVal = document.getElementById('smart-' + k)?.value.trim() || '';
        if (!outcomeVal) {
          alert(`Please enter the intended outcome for the ${AREA_LABELS[k]} area.`);
          document.getElementById('outcome-' + k)?.focus();
          return false;
        }
        if (!smartVal) {
          alert(`Please enter the SMART target for the ${AREA_LABELS[k]} area.`);
          document.getElementById('smart-' + k)?.focus();
          return false;
        }
      }
    } else {
      if (!state.formData.targets || state.formData.targets.length === 0) {
        alert('Please generate or add at least one SMART target.');
        return false;
      }
      for (let i = 0; i < state.formData.targets.length; i++) {
        const el = document.getElementById('edit-t-' + i);
        const val = el ? el.value.trim() : (state.formData.editedTargets[i] || state.formData.targets[i].smart || '').trim();
        if (!val) {
          alert(`Please enter the SMART target text for Target ${i + 1} (${state.formData.targets[i].area}).`);
          el?.focus();
          return false;
        }
      }
    }
  } else if (s === 4) {
    const targets = state.formData.targets || [];
    for (let i = 0; i < targets.length; i++) {
      const descVal = document.getElementById('pv-desc-' + i)?.value.trim() || '';
      const byVal = document.getElementById('pv-by-' + i)?.value.trim() || '';
      if (!descVal) {
        alert(`Please enter the provision description for Target ${i + 1} (${targets[i].area}).`);
        document.getElementById('pv-desc-' + i)?.focus();
        return false;
      }
      if (!byVal) {
        alert(`Please enter who provides this provision for Target ${i + 1} (${targets[i].area}).`);
        document.getElementById('pv-by-' + i)?.focus();
        return false;
      }
    }
  }
  return true;
}

function nextStep() {
  if (!validateCurrentStep()) return;
  saveCurrentStep();
  if (state.step < STEPS.length - 1) { state.step++; renderStep(); document.querySelector('.form-content').scrollTop = 0; }
}
function prevStep() {
  saveCurrentStep();
  if (state.step > 0) { state.step--; renderStep(); document.querySelector('.form-content').scrollTop = 0; }
}

function saveCurrentStep() {
  const s = state.step;
  if (s === 0) {
    state.formData.overview = {
      created:    gv('s0-created'),
      reviewed:   gv('s0-reviewed'),
      level:      gv('s0-level'),
      attendance: gv('s0-attendance'),
      diagnoses:  gv('s0-diagnoses'),
      staff:      gv('s0-staff'),
      agencies:   gv('s0-agencies'),
    };
  } else if (s === 1) {
    const chips = document.querySelectorAll('.area-chip.selected');
    state.formData.areas = Array.from(chips).map(c => c.dataset.key);
    state.formData.areas.forEach(k => {
      state.formData.strengths[k]  = gv('str-'+k);
      state.formData.needs[k]      = gv('need-'+k);
      state.formData.advice[k]     = gv('adv-'+k);
      state.formData.strategies[k] = gv('strat-'+k);
      state.formData.seating[k]    = gv('seat-'+k);
    });
    state.formData.summary   = gv('s1-summary');
    state.formData.riskFlags = Array.from(document.querySelectorAll('.risk-chip.selected')).map(c=>c.dataset.flag);
  } else if (s === 2) {
    state.formData.health = {
      health:    gv('s2-health'),
      social:    gv('s2-social'),
      ehcp:      gv('s2-ehcp'),
      links:     gv('s2-links'),
      docs:      state.formData.health.docs || [],
    };
  } else if (s === 3) {
    // Save from selector UI if targets not yet set via AI
    const hasSelectors = !!document.getElementById('smart-' + (state.formData.areas[0]||''));
    if (hasSelectors) saveTargetSelectors();
    state.formData.targets.forEach((_,i) => {
      const el = document.getElementById('edit-t-'+i);
      if (el) state.formData.editedTargets[i] = el.value;
    });
  } else if (s === 4) {
    state.formData.targets.forEach((_,i) => {
      state.formData.provisions[i] = {
        desc: gv('pv-desc-'+i),
        by:   gv('pv-by-'+i),
        freq: gv('pv-freq-'+i),
        cost: gv('pv-cost-'+i),
      };
    });
  } else if (s === 5) {
    state.formData.voices.pupil  = gv('voice-pupil');
    state.formData.voices.parent = gv('voice-parent');
  }
}

function gv(id) { const el = document.getElementById(id); return el ? el.value : ''; }

/* ── STEP RENDERERS ── */

function renderStep0(el) {
  const o = state.formData.overview;
  const today = new Date().toISOString().split('T')[0];

  // Pull live values from ARBOR_DB for autopopulation
  const arborRec = ARBOR_DB[state.student.arborId] || {};
  const staffVal  = o.staff      || state.user?.name || '';
  const attendVal = o.attendance || arborRec.attendance || '';
  const hasReview = !!(o.reviewed);

  el.innerHTML = `
    <div class="step-title">📋 Plan overview</div>
    <div class="step-sub">Administrative details for ${state.student.fullName}'s ISP.</div>
    <div class="row-2">
      <div class="field"><label>Date ISP created</label><input type="date" id="s0-created" value="${o.created||today}" /></div>
      <div class="field">
        <label>Date last reviewed</label>
        ${hasReview
          ? `<input type="date" id="s0-reviewed" value="${o.reviewed}" />`
          : `<div style="position:relative">
               <input type="date" id="s0-reviewed" value="" style="color:transparent" oninput="this.style.color=''" onfocus="this.style.color=''" />
               <span id="no-review-ghost" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--subtle);pointer-events:none">No review yet</span>
             </div>`
        }
        <div class="hint">Leave blank if this ISP has not yet been reviewed.</div>
      </div>
    </div>
    <div class="row-2">
      <div class="field">
        <label>Current attendance (%)</label>
        <input type="number" id="s0-attendance" min="0" max="100" value="${attendVal}" placeholder="e.g. 94" ${attendVal&&!o.attendance?'style="background:var(--teal-light);border-color:var(--teal)"':''} />
        ${attendVal&&!o.attendance?`<div class="hint" style="color:var(--teal)">Auto-populated from MIS — edit if needed</div>`:''}
      </div>
      <div class="field">
        <label>SEND Status</label>
        <select id="s0-level">
          <option value="">Select…</option>
          <option value="K" ${o.level==='K'||(o.level===''&&senCode({overview:o})==='K')?'selected':''}>K (SEND Support)</option>
          <option value="K+" ${o.level==='K+'||o.level==='Targeted'||o.level==='Targeted Plus'||(o.level===''&&senCode({overview:o})==='K+')?'selected':''}>K+ (Higher SEND Support)</option>
          <option value="E" ${o.level==='E'||(o.level===''&&senCode({overview:o})==='E')?'selected':''}>E (EHCP)</option>
          <option value="M" ${o.level==='M'||(o.level===''&&senCode({overview:o})==='M')?'selected':''}>M (Monitoring)</option>
          <option value="None" ${o.level==='None'?'selected':''}>None</option>
        </select>
      </div>
    </div>
    <div class="field"><label>Medical needs / diagnoses</label><input type="text" id="s0-diagnoses" placeholder="e.g. autism, ADHD, dyslexia, sensory processing disorder" value="${o.diagnoses||''}" /></div>
    <div class="field">
      <label>Staff responsible for overseeing this ISP</label>
      <input type="text" id="s0-staff" placeholder="e.g. Miss A Jones" value="${staffVal}" ${staffVal&&!o.staff?'style="background:var(--teal-light);border-color:var(--teal)"':''} />
      ${staffVal&&!o.staff?`<div class="hint" style="color:var(--teal)">Auto-populated from your login — edit if needed</div>`:''}
    </div>
    <div class="field"><label>External agencies / professionals involved</label><input type="text" id="s0-agencies" placeholder="e.g. CAMHS, OT, SALT, Educational Psychology, Autism Team" value="${o.agencies||''}" /></div>`;

  // Hide ghost text once user starts typing in the date field
  const reviewInput = document.getElementById('s0-reviewed');
  const ghost = document.getElementById('no-review-ghost');
  if (reviewInput && ghost) {
    reviewInput.addEventListener('input', () => { ghost.style.display = reviewInput.value ? 'none' : ''; });
    reviewInput.addEventListener('focus', () => { ghost.style.display = 'none'; reviewInput.style.color = ''; });
    reviewInput.addEventListener('blur',  () => { if (!reviewInput.value) { ghost.style.display = ''; reviewInput.style.color = 'transparent'; } });
  }
}

/* ── Pre-written SMART target suggestions per area ── */
const SMART_SUGGESTIONS = {
  social: [
    { label:'Regulation plan', smart:'Within this half-term, [name] will use a personal regulation plan (identify → signal → exit) at least 3 times per week when experiencing emotional distress, as recorded by their key adult. Target achieved when [name] uses the plan independently on 4 of 5 days by end of half-term.' },
    { label:'Social skills group', smart:'[Name] will participate in a structured social skills group (1:4 adult ratio, 30 min) twice per week this term. Progress measured by staff observation. Target: [name] initiates at least one positive peer interaction per session by end of half-term.' },
    { label:'Lunchtime support', smart:'Within 6 weeks, [name] will access a supported lunchtime provision on 4 of 5 days per week. [Name] will self-report a comfort rating of 5/10 or above at the end of each lunch session using their feelings tracker.' },
    { label:'Mentor sessions', smart:'[Name] will attend a weekly 1:1 pastoral mentor session and complete a feelings diary each Friday. By end of term, [name] will be able to identify at least 3 personal triggers and 2 coping strategies when asked.' },
    { label:'Attendance / EBSA', smart:'Within this term, [name] will maintain attendance above [x]% using their graduated reintegration plan. If attendance falls below [x]% in any week, the key adult will make contact within 24 hours. Attendance to be reviewed at each ISP check-in.' },
  ],
  executive: [
    { label:'Task completion', smart:'Within this half-term, [name] will use a visual task board and complete at least 3 of 4 set tasks per lesson on 4 of 5 days per week, as measured by daily class teacher checklist.' },
    { label:'Organisation plan', smart:'By end of term, [name] will use a personal planner and colour-coded timetable daily. Equipment checked by key adult at end of each day. Target: no more than 1 episode of missing equipment per week.' },
    { label:'Movement breaks', smart:'[Name] will follow a scheduled movement break programme (every 20 minutes during extended tasks). Class teacher records task completion before and after each break. Target: 20% improvement in task completion within 6 weeks.' },
    { label:'Instructions / memory', smart:'Within 6 weeks, all class teachers will use chunked 2-step instructions with visual cues. [Name] will demonstrate following 2-step instructions independently on at least 3 occasions per lesson, recorded by class teacher.' },
    { label:'Homework / independent work', smart:'By end of term, [name] will submit at least 75% of set homework using agreed scaffolds (writing frames, visual planners, extended deadlines where needed). Monitored weekly by pastoral mentor.' },
  ],
  motor: [
    { label:'Handwriting / fine motor', smart:'Within this term, [name] will use a writing slope and correct pencil grip for all written tasks. Handwriting legibility scored weekly by school rubric. Target: improvement of at least one band within 6 weeks.' },
    { label:'Laptop / assistive tech', smart:'By end of term, [name] will use a school laptop for all extended writing tasks. Touch-typing practice 3x per week. Typing speed assessed at 6 weeks — target [x] wpm.' },
    { label:'OT programme', smart:'[Name] will complete a daily 5-minute fine motor warm-up (OT-prescribed) before written tasks. Completed 4 of 5 days per week as recorded by class teacher or TA. OT to review at half-term.' },
    { label:'Gross motor / PE', smart:'Within this half-term, [name] will access a weekly gross motor skills group (OT-advised, 30 min) in addition to PE. Progress measured by OT against baseline at start of programme.' },
    { label:'Independence / daily living', smart:'By end of term, [name] will independently manage at least 3 daily tasks (e.g. organising bag, PE kit, packaging) without adult prompting on 4 of 5 days, recorded by form tutor.' },
  ],
  sensory: [
    { label:'Sensory toolkit', smart:'Within 4 weeks, [name] will use their personalised sensory toolkit (ear defenders, fidget, exit card) in at least 4 sessions per week without adult prompting, as recorded on their self-monitoring card.' },
    { label:'Sensory diet', smart:'[Name] will follow a personalised OT-prescribed sensory diet (3 activities daily). Completed 4 of 5 days as logged by key adult. OT to review impact at half-term.' },
    { label:'Environment adjustments', smart:'All agreed environmental adjustments (seating position, lighting, noise reduction) will be in place in all lessons. [Name] will self-report sensory comfort of 5/10 or above in at least 4 lessons per day.' },
    { label:'Transitions / changes', smart:'By end of term, [name] will use a visual transition schedule for all lesson changes. Adult prompting for transitions on no more than 2 occasions per day, reducing to 1 by half-term.' },
    { label:'Canteen / social spaces', smart:'Within 6 weeks, [name] will access the canteen or agreed alternative on 4 of 5 days using agreed strategies (early access, specific seating). [Name] to self-report using feelings scale.' },
  ],
  slc: [
    { label:'Reading programme', smart:'[Name] will complete a structured 1:1 reading programme (evidence-based, 15 min, 3x per week) this term. Measured by standardised assessment. Target: minimum 6-month improvement in reading age by end of term.' },
    { label:'Vocabulary / pre-teaching', smart:'All class teachers will pre-teach 3–5 key vocabulary words before each new topic with visual supports. [Name] will demonstrate understanding of pre-taught vocabulary in at least 3 of 5 lessons per week.' },
    { label:'Expressive language', smart:'Within this half-term, [name] will use agreed communication strategies (traffic light card, key phrase prompts) in at least 3 lessons per day. SALT strategies embedded by all staff. Review at half-term.' },
    { label:'Instruction following', smart:'Within 6 weeks, all staff will use chunked single-step or 2-step instructions with visual cues for [name]. [Name] will demonstrate understanding by repeating instructions back in at least 3 sessions per day.' },
    { label:'Literacy / writing', smart:'[Name] will use writing frames, sentence starters and graphic organisers for all extended writing tasks. Target: producing at least 3 structured paragraphs independently on 3 of 5 occasions by end of term.' },
  ],
};

const RISK_FLAGS = [
  { key:'safeguarding',  label:'Safeguarding concern',     icon:'⚠️', color:'#C0392B' },
  { key:'medical',       label:'Medical / medication',     icon:'💊', color:'#1A5276' },
  { key:'ebsa',          label:'EBSA risk',                icon:'🏠', color:'#6C3483' },
  { key:'selfharm',      label:'Self-harm history',        icon:'🔴', color:'#922B21' },
  { key:'cie',           label:'Child in need / CLA',      icon:'👨‍👩‍👦', color:'#1F618D' },
  { key:'behaviour',     label:'Behaviour support plan',   icon:'📋', color:'#784212' },
  { key:'exam',          label:'Exam access arrangements', icon:'📝', color:'#1E8449' },
  { key:'pep',           label:'PEP required',             icon:'📌', color:'#B7950B' },
];

const AREA_COLOR = {
  social:    '#B8860B',   // dark yellow
  executive: '#C2185B',   // pink
  slc:       '#1565C0',   // blue
  sensory:   '#2E7D32',   // green
  motor:     '#6A1B9A',   // purple
};
const AREA_BG = {
  social:    '#FFF8E1',   // light yellow
  executive: '#FCE4EC',   // light pink
  slc:       '#E3F2FD',   // light blue
  sensory:   '#E8F5E9',   // light green
  motor:     '#F3E5F5',   // lilac
};
const AREA_ICON_SVG = {
  social:    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M6 14a4 4 0 0 0 8 0"/><path d="M12 18c1.7 1.4 3.3 1.9 5 1"/></svg>`,
  executive: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14"/></svg>`,
  slc:       `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  sensory:   `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>`,
  motor:     `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,21 3,15 9,15 9,9 15,9 15,3 21,3"/><line x1="13" y1="9" x2="15" y2="6"/><line x1="15" y1="9" x2="18" y2="7"/></svg>`,
};
// Small versions for tight spaces (PDF, chips)
const AREA_ICON_SM = {
  social:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M6 14a4 4 0 0 0 8 0"/><path d="M12 18c1.7 1.4 3.3 1.9 5 1"/></svg>`,
  executive: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14"/></svg>`,
  slc:       `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  sensory:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>`,
  motor:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,21 3,15 9,15 9,9 15,9 15,3 21,3"/><line x1="13" y1="9" x2="15" y2="6"/><line x1="15" y1="9" x2="18" y2="7"/></svg>`,
};
function areaIconHTML(k, size='sm') {
  const svg = size === 'lg' ? AREA_ICON_SVG[k] : AREA_ICON_SM[k];
  const color = AREA_COLOR[k] || '#555';
  return svg ? `<span style="color:${color};display:inline-flex;align-items:center;line-height:1">${svg}</span>` : '●';
}
// Keep AREA_ICON as fallback text for any places not yet updated
const AREA_ICON = { social:'🌱', motor:'🦵', sensory:'👁', slc:'💬', executive:'🧠' };

function renderStep1(el) {
  const areas = Object.keys(AREA_LABELS);
  const fd = state.formData;
  el.innerHTML = `
    <div class="step-title">💡 Strengths, needs and strategies</div>
    <div class="step-sub">Select the development areas relevant to this student, then complete each section.</div>
    <div class="field">
      <label>Student summary paragraph</label>
      <textarea id="s1-summary" placeholder="Describe the student's character, interests, strengths and how their needs present in school...">${fd.summary||''}</textarea>
      <div class="hint">This will appear verbatim in the ISP. Write in third person.</div>
    </div>
    <div class="field">
      <label>Risk / alert flags</label>
      <div class="hint" style="margin-bottom:6px">Select any that apply — these will appear prominently on the one-page teacher summary.</div>
      <div class="chip-group">
        ${RISK_FLAGS.map(f=>{ const sel=(fd.riskFlags||[]).includes(f.key); const RED='#c0392b'; return `<button class="chip risk-chip ${sel?'selected':''}" data-flag="${f.key}" onclick="toggleRiskChip(this)" style="${sel?'background:'+RED+'18;border-color:'+RED+';color:'+RED:''}">${f.icon} ${f.label}</button>`; }).join('')}
      </div>
    </div>
    <div class="field">
      <label>Which development areas apply to this student?</label>
      <div class="chip-group">
        ${areas.map(k=>{ const sel=fd.areas.includes(k); const c=AREA_COLOR[k]; return `<button class="chip area-chip ${sel?'selected':''}" data-key="${k}" onclick="toggleArea(this)" style="${sel&&c?'background:'+c+'18;border-color:'+c+';color:'+c:''}">${AREA_ICON[k]||''} ${AREA_LABELS[k]}</button>`; }).join('')}
      </div>
    </div>
    <div id="area-detail-panels"></div>`;
  renderAreaPanels();
}

function toggleRiskChip(btn) {
  const RED = '#c0392b';
  btn.classList.toggle('selected');
  if (btn.classList.contains('selected')) {
    btn.style.background = RED + '18';
    btn.style.borderColor = RED;
    btn.style.color = RED;
  } else {
    btn.style.background = '';
    btn.style.borderColor = '';
    btn.style.color = '';
  }
}

function toggleArea(btn) {
  btn.classList.toggle('selected');
  const key = btn.dataset.key;
  const color = AREA_COLOR[key];
  if (btn.classList.contains('selected')) {
    if (!state.formData.areas.includes(key)) state.formData.areas.push(key);
    if (color) { btn.style.background = color+'18'; btn.style.borderColor = color; btn.style.color = color; }
  } else {
    state.formData.areas = state.formData.areas.filter(k=>k!==key);
    btn.style.background = ''; btn.style.borderColor = ''; btn.style.color = '';
  }
  renderAreaPanels();
}

function renderAreaPanels() {
  const container = document.getElementById('area-detail-panels');
  if (!container) return;
  const selected = state.formData.areas;
  const fd = state.formData;
  if (!selected.length) { container.innerHTML=''; return; }
  container.innerHTML = selected.map(k => {
    const color = AREA_COLOR[k] || 'var(--teal)';
    const suggestions = SMART_SUGGESTIONS[k] || [];
    return `
    <div class="dev-card" style="border-left:4px solid ${color}">
      <div class="dev-card-header">
        <span class="dev-card-title">${AREA_ICON[k]||''} ${AREA_LABELS[k]}</span>
        <span class="dev-chip" style="background:${color}18;color:${color};border:none">${k}</span>
      </div>
      <div class="row-2">
        <div class="field"><label>Strengths in this area <span style="color:#e74c3c">*</span></label><textarea id="str-${k}" placeholder="What does the student do well here?">${fd.strengths[k]||''}</textarea></div>
        <div class="field"><label>Needs / barriers to learning <span style="color:#e74c3c">*</span></label><textarea id="need-${k}" placeholder="What barriers does the student face?">${fd.needs[k]||''}</textarea></div>
      </div>
      <div class="field"><label>Specialist advice / report references <span style="font-weight:400;color:var(--subtle)">(optional)</span></label>
        <input type="text" id="adv-${k}" placeholder="e.g. OT report Oct 2023 — fine motor 2nd percentile" value="${fd.advice[k]||''}" />
      </div>
      <div class="field">
        <label>Support strategies</label>
        <div style="background:#FFF8E7;border:1px solid #E8C84A;border-radius:var(--radius);padding:8px 12px;font-size:12px;color:#7A5C00;margin-bottom:8px">
          ⚠️ <strong>Reminder:</strong> Strategies listed here should go beyond the universal offer of High Quality Teaching. Only include specific targeted or specialist strategies that are additional to and different from quality-first teaching.
        </div>
        <textarea id="strat-${k}" placeholder="List specific targeted strategies, adjustments and interventions for this area (beyond HQT)..." style="min-height:80px">${fd.strategies[k]||''}</textarea>
      </div>
      <div class="field">
        <label>Seating — critical positional need only <span style="font-weight:400;color:var(--subtle)">(optional)</span></label>
        <input type="text" id="seat-${k}" placeholder="e.g. Near door for exit access · Front row · Away from windows · Back of room" value="${fd.seating[k]||''}" />
        <div class="hint">Only include if there is a genuine positional requirement (e.g. near a door for anxiety/managed exit, front row for attention, away from windows for sensory). Leave blank if no specific seating need.</div>
      </div>
    </div>`;
  }).join('');
}

function handlePdfUpload(input) {
  const files = Array.from(input.files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
  if (!files.length) return;
  if (!state.formData.health.docs) state.formData.health.docs = [];
  files.forEach(f => {
    state.formData.health.docs.push({ name: f.name, url: URL.createObjectURL(f) });
  });
  renderPdfList();
  input.value = '';
}

function removePdf(idx) {
  const files = state.formData.health.docs || [];
  if (files[idx]) URL.revokeObjectURL(files[idx].url);
  files.splice(idx, 1);
  renderPdfList();
}

function renderPdfList() {
  const el = document.getElementById('pdf-list');
  if (!el) return;
  const files = state.formData.health.docs || [];
  if (!files.length) {
    el.innerHTML = '<span style="font-size:12px;color:var(--subtle)">No PDFs uploaded yet.</span>';
    return;
  }
  el.innerHTML = files.map((f, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);font-size:13px">
      <span>📄</span>
      <a href="${f.url}" target="_blank" style="color:var(--teal);text-decoration:none;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${f.name}">${f.name}</a>
      <button onclick="removePdf(${i})" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:18px;line-height:1;padding:0 2px" title="Remove">×</button>
    </div>`).join('');
}

function handleWizardEhcpStatusChange(select) {
  const val = select.value;
  if (val === 'EHCP requested' || val === 'EHCP in place') {
    alert(`Please upload the full PDF of the request or the full and final EHCP plan.`);
    const fileInput = document.getElementById('pdf-upload-input');
    if (fileInput) {
      fileInput.click();
    }
  }
}

function handleVeEhcpStatusChange(select, idx) {
  const val = select.value;
  if (val === 'EHCP requested' || val === 'EHCP in place') {
    alert(`Please upload the full PDF of the request or the full and final EHCP plan.`);
    const fileInput = document.getElementById('ve-pdf-upload');
    if (fileInput) {
      fileInput.click();
    }
  }
}

function handleVePdfUpload(input, idx) {
  const file = input.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const isp = state.isps[idx];
  if (!isp.health) isp.health = {};
  if (!isp.health.docs) isp.health.docs = [];
  isp.health.docs.push({ name: file.name, url });
  saveISPs();
  alert(`✓ Document "${file.name}" uploaded successfully.`);
  input.value = '';
}

function renderStep2(el) {
  const h = state.formData.health;
  el.innerHTML = `
    <div class="step-title">🏥 Health, care and wellbeing</div>
    <div class="step-sub">Record relevant health, social care and EHCP information for this student.</div>
    <div class="field"><label>Health / wellbeing notes</label>
      <textarea id="s2-health" placeholder="Include diagnoses, medication, ongoing clinical reviews, therapies received or discharged from...">${h.health||''}</textarea>
    </div>
    <div class="field"><label>Social care / community services</label>
      <textarea id="s2-social" placeholder="e.g. Child in Need under s17, Direct Payments, Early Help, allocated social worker, respite provision...">${h.social||''}</textarea>
    </div>
    <div class="row-2">
      <div class="field"><label>EHCP status</label>
        <select id="s2-ehcp" onchange="handleWizardEhcpStatusChange(this)">
          <option value="">Select…</option>
          <option ${h.ehcp==='No EHCP'?'selected':''}>No EHCP</option>
          <option ${h.ehcp==='EHCP requested'?'selected':''}>EHCP requested</option>
          <option ${h.ehcp==='EHCP in place'?'selected':''}>EHCP in place</option>
          <option ${h.ehcp==='EHCP under review'?'selected':''}>EHCP under review</option>
          <option ${h.ehcp==='EHCP ceased'?'selected':''}>EHCP ceased</option>
        </select>
      </div>
      <div class="field"><label>Relevant document links <span style="font-weight:400;color:var(--subtle)">(optional)</span></label>
        <input type="text" id="s2-links" placeholder="e.g. EHCP, CAMHS report, OT report, social care plan" value="${h.links||''}" />
        <div class="hint">💡 Paste a Google Docs or Google Drive URL here to link directly to a shared document (e.g. EHCP, CAMHS referral, social care plan).</div>
      </div>
    </div>
    <div class="field" style="margin-top:0.25rem">
      <label>Upload PDF documents <span style="font-weight:400;color:var(--subtle)">(optional)</span></label>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <input type="file" id="pdf-upload-input" accept=".pdf,application/pdf" multiple style="display:none" onchange="handlePdfUpload(this)">
        <button class="btn-secondary" style="font-size:13px;display:inline-flex;align-items:center;gap:6px" onclick="document.getElementById('pdf-upload-input').click()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> Upload PDF</button>
        <span style="font-size:12px;color:var(--subtle)">Attach one or more PDF files (e.g. assessment reports, EHCP copy)</span>
      </div>
      <div id="pdf-list" style="display:flex;flex-direction:column;gap:6px"></div>
    </div>`;
  renderPdfList();
}

function renderStep3(el) {
  const fd = state.formData;
  const areas = fd.areas;
  el.innerHTML = `
    <div class="step-title">🎯 SMART targets</div>
    <div class="step-sub">For each development area, choose from the suggested targets or write a custom one. Then edit the wording to be specific to this student.</div>
    <div style="background:#FFF8E7;border:1px solid #E8C84A;border-radius:var(--radius);padding:10px 14px;font-size:13px;color:#7A5C00;margin-bottom:1.25rem">
      ⚠️ <strong>High Quality Teaching reminder:</strong> All targets on an ISP must be <em>additional to and different from</em> quality-first teaching. Do not set targets for things that all students should receive as part of ordinarily available provision. Targets should describe specific, measurable, time-bound steps that go beyond the universal classroom offer.
    </div>
    <div id="target-area-blocks"></div>`;
  renderTargetSelectors();
}

function renderTargetSelectors() {
  const fd = state.formData;
  const areas = fd.areas;
  const container = document.getElementById('target-area-blocks');
  if (!container || !areas.length) { if(container) container.innerHTML='<div class="alert-info">No development areas selected. Go back to Step 2 to select areas.</div>'; return; }

  container.innerHTML = areas.map((k, ai) => {
    const color = AREA_COLOR[k] || 'var(--teal)';
    const suggestions = SMART_SUGGESTIONS[k] || [];
    const existing = fd.targets.find(t => t._areaKey === k);
    const existingText = existing ? (fd.editedTargets[fd.targets.indexOf(existing)] ?? existing.smart) : '';
    const existingOutcome = existing ? existing.outcome : '';
    return `
    <div class="dev-card" style="border-left:4px solid ${color};margin-bottom:1rem" id="tblock-${k}">
      <div class="dev-card-header">
        <span class="dev-card-title">${AREA_ICON[k]||''} ${AREA_LABELS[k]}</span>
        <span class="dev-chip" style="background:${color}18;color:${color};border:none">Target ${ai+1}</span>
      </div>

      <div class="field">
        <label>Intended outcome <span style="color:#e74c3c">*</span> <span style="font-weight:400;color:var(--subtle)">(person-centred, one sentence)</span></label>
        <input type="text" id="outcome-${k}" placeholder="e.g. For [name] to manage transitions independently between lessons." value="${existingOutcome.replace(/"/g,'&quot;')}" />
      </div>

      <div class="field">
        <label>Choose a suggested SMART target or write your own <span style="color:#e74c3c">*</span></label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">
          ${suggestions.map((s,si) => `<button class="chip" style="font-size:12px" onclick="applySuggestion('${k}','${si}')">${s.label}</button>`).join('')}
          <button class="chip" style="font-size:12px;background:var(--blue-light);border-color:#88BAE8;color:var(--navy)" onclick="document.getElementById('smart-${k}').value='';document.getElementById('smart-${k}').focus()">✏️ Custom</button>
          <button class="chip" id="ai-btn-${k}" style="font-size:12px;background:#E8F8F5;border-color:#A3E4D7;color:#117A65;font-weight:600" onclick="suggestSmartTargetAI('${k}')">✨ AI Suggest</button>
        </div>
        <div id="ai-status-${k}" style="font-size:12px;color:var(--teal);margin-bottom:8px;display:none"></div>
        <div style="background:#F0F8F5;border:1px solid #A8DAC5;border-radius:var(--radius);padding:8px 12px;font-size:12px;color:var(--teal-dark);margin-bottom:8px">
          All targets must be beyond the universal classroom offer — additional to and different from High Quality Teaching.
        </div>
        <textarea id="smart-${k}" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:13px;font-family:inherit;min-height:90px;resize:vertical" placeholder="Select a suggestion or click AI Suggest above, then personalise it. Or write a custom target here.">${existingText}</textarea>
        <div class="hint">Adjust numbers, timescales and criteria to reflect their starting point.</div>
      </div>
    </div>`;
  }).join('');
}

function applySuggestion(areaKey, suggIdx) {
  const sugg = (SMART_SUGGESTIONS[areaKey]||[])[parseInt(suggIdx)];
  if (!sugg) return;
  const ta = document.getElementById('smart-'+areaKey);
  if (ta) {
    // Replace [name] / [Name] with the student's name
    const name = state.student.fname || 'the student';
    ta.value = sugg.smart.replace(/\[name\]/g, name).replace(/\[Name\]/g, name.charAt(0).toUpperCase()+name.slice(1));
    ta.focus();
  }
}

function saveTargetSelectors() {
  // Collect targets from the selector UI into state.formData.targets
  const fd = state.formData;
  const areas = fd.areas;
  const name = state.student.fname || 'the student';
  const Name = name.charAt(0).toUpperCase() + name.slice(1);
  fd.targets = areas.map(k => {
    const outcome = (document.getElementById('outcome-'+k)?.value || '').replace(/\[name\]/g,name).replace(/\[Name\]/g,Name).trim() ||
      `For ${Name} to make measurable progress in the area of ${AREA_LABELS[k].toLowerCase()}.`;
    const smart = (document.getElementById('smart-'+k)?.value || '').replace(/\[name\]/g,name).replace(/\[Name\]/g,Name).trim() ||
      `Within this half-term, ${Name} will engage with targeted support in ${AREA_LABELS[k].toLowerCase()} as described in the provision below. Progress will be measured by [specify measure].`;
    return { area: AREA_LABELS[k], outcome, smart, _areaKey: k };
  });
  fd.editedTargets = {};

  // Prefill provisions from individual AI suggestions
  if (!fd.provisions) fd.provisions = {};
  if (fd.provisions_prefill) {
    fd.targets.forEach((t, i) => {
      if (fd.provisions_prefill[t._areaKey]) {
        if (!fd.provisions[i]) fd.provisions[i] = {};
        const pf = fd.provisions_prefill[t._areaKey];
        if (!fd.provisions[i].desc || pf.forceOverwrite) {
          fd.provisions[i].desc = pf.desc || '';
          fd.provisions[i].cost = pf.cost || '';
          fd.provisions[i].by = pf.by || 'Teaching Assistant';
          fd.provisions[i].freq = pf.freq || 'Daily';
          pf.forceOverwrite = false; // Reset the flag
        }
      }
    });
  }
}

async function generateTargets() {
  const statusEl = document.getElementById('ai-status');
  if (!statusEl) return;
  statusEl.innerHTML = `<div class="ai-banner"><div class="spinner"></div>Generating personalised SMART targets for ${state.student.fullName}… this may take a moment.</div>`;

  const areas = state.formData.areas;
  const needsSummary = areas.map(k =>
    `${AREA_LABELS[k]}:\n  Strengths: ${state.formData.strengths[k]||'not specified'}\n  Needs/barriers: ${state.formData.needs[k]||'not specified'}\n  Strategies: ${state.formData.strategies[k]||'not specified'}\n  Specialist advice: ${state.formData.advice[k]||'none'}`
  ).join('\n\n');

  const prompt = `You are an experienced SENDCo generating SMART targets for a student Individual Support Plan (ISP) in a UK school.

Student: ${state.student.fullName}, ${state.student.year||''} ${state.student.form||''}, UPN: ${state.student.arborId}
Diagnoses: ${state.formData.overview.diagnoses||'not specified'}
Student summary: ${state.formData.summary||'not provided'}

Development area needs and strategies:
${needsSummary}

Generate one personalised SMART target, recommended provision, and estimated cost per area (${areas.length} total). Each must:
- Be ADDITIONAL TO AND DIFFERENT FROM quality-first high quality teaching — no universal classroom strategies
- Have the intended outcome (person-centred, one sentence using the student's first name)
- Have a SMART target (Specific, Measurable, Achievable, Relevant, Time-bound — 2-4 sentences, concrete, uses student's first name)
- Have a recommended provision description (the targeted intervention details)
- Have an estimated annual cost (e.g. £450 - School Budget)
- Reference the area key exactly as one of: executive, motor, sensory, slc, social

Return ONLY a valid JSON array. No markdown, no commentary:
[{"area":"Social and emotional","areaKey":"social","outcome":"For ${state.student.fname} to...","smart":"Within this term, ${state.student.fname} will...","provision":"Weekly ELSA mentoring...","cost":"£650 - School Budget"},...]`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await resp.json();
    let raw = (data.content?.find(b=>b.type==='text')?.text || '[]').replace(/```json|```/g,'').trim();
    const targets = JSON.parse(raw);
    state.formData.targets = targets.map(t => ({ ...t, _areaKey: t.areaKey || state.formData.areas.find(k => AREA_LABELS[k] === t.area) || '' }));
    state.formData.editedTargets = {};
    if (!state.formData.provisions) state.formData.provisions = {};
    state.formData.targets.forEach((t, i) => {
      state.formData.provisions[i] = {
        desc: t.provision || '',
        cost: t.cost || '',
        by: 'Teaching Assistant',
        freq: 'Daily'
      };
    });
    if (statusEl) statusEl.innerHTML = `<div class="alert-success" style="margin-bottom:1rem">✓ ${targets.length} SMART targets generated. Review and edit below, then continue.</div>`;
    renderTargetCards();
  } catch(e) {
    // Local fallback/mock generator so the AI feature always works in the demo!
    const name = state.student.fname || 'the student';
    const Name = name.charAt(0).toUpperCase() + name.slice(1);
    const mockTargets = areas.map(k => {
      let smart = '';
      let provision = '';
      let cost = '';
      if (k === 'executive') {
        smart = `Within 6 weeks, ${Name} will use a visual checklist independently to organise their learning materials at the start of 4 out of 5 lessons, as monitored by the class teacher.`;
        provision = `Daily 10-minute check-in and checklist review with a Key Worker / Teaching Assistant before registration.`;
        cost = `£350 — School Budget`;
      } else if (k === 'motor') {
        smart = `By the end of this term, ${Name} will write at least 3 sentences legibly using assistive writing tools (like a pencil grip or laptop) in 80% of English tasks.`;
        provision = `Fine motor occupational therapy hand exercises twice weekly, plus provision of specialized pencil grips and a slanted writing board.`;
        cost = `£200 — School Budget`;
      } else if (k === 'sensory') {
        smart = `Within 4 weeks, ${Name} will independently use noise-cancelling headphones or request a quiet break when classroom noise levels exceed comfort, in 90% of occurrences.`;
        provision = `Access to a designated quiet sensory workspace and provision of high-quality noise-cancelling headphones for classroom use.`;
        cost = `£150 — School Equipment`;
      } else if (k === 'slc') {
        smart = `By the next review, ${Name} will use visual task cards to follow multi-step instructions independently in at least 4 key subject lessons per week.`;
        provision = `Speech & language visual prompt task cards, and weekly 1:1 vocabulary pre-teaching sessions.`;
        cost = `£400 — School Budget`;
      } else if (k === 'social') {
        smart = `Within 6 weeks, ${Name} will use a designated self-regulation strategy (such as a card or deep breathing) to manage emotional escalation in 4 out of 5 peer conflicts.`;
        provision = `Weekly 1:1 social-emotional mentoring sessions (ELSA) for 30 minutes to develop self-regulation strategies.`;
        cost = `£650 — School Budget`;
      } else {
        smart = `Within 6 weeks, ${Name} will achieve their target in the area of ${AREA_LABELS[k].toLowerCase()} with support.`;
        provision = `Targeted small group support in class.`;
        cost = `£100`;
      }
      return {
        area: AREA_LABELS[k],
        areaKey: k,
        outcome: `For ${Name} to make independent progress in the area of ${AREA_LABELS[k].toLowerCase()}.`,
        smart,
        provision,
        cost,
        by: 'Teaching Assistant',
        freq: 'Daily'
      };
    });
    
    state.formData.targets = mockTargets.map(t => ({ ...t, _areaKey: t.areaKey }));
    state.formData.editedTargets = {};
    if (!state.formData.provisions) state.formData.provisions = {};
    state.formData.targets.forEach((t, i) => {
      state.formData.provisions[i] = {
        desc: t.provision || '',
        cost: t.cost || '',
        by: 'Teaching Assistant',
        freq: 'Daily'
      };
    });
    
    if (statusEl) statusEl.innerHTML = `<div class="alert-success" style="margin-bottom:1rem">✓ ${mockTargets.length} targets generated (using offline helper). Review and edit below, then continue.</div>`;
    renderTargetCards();
  }
}

async function suggestSmartTargetAI(k) {
  const btn = document.getElementById('ai-btn-' + k);
  const statusEl = document.getElementById('ai-status-' + k);
  const outcomeInput = document.getElementById('outcome-' + k);
  const smartTextarea = document.getElementById('smart-' + k);
  
  if (!outcomeInput || !smartTextarea) return;
  
  const outcomeVal = outcomeInput.value.trim();
  if (!outcomeVal) {
    alert(`Please enter an Intended Outcome first. The AI suggests a target from your outcome.`);
    outcomeInput.focus();
    return;
  }
  
  const currentSmart = smartTextarea.value.trim();

  if (btn) btn.disabled = true;
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.innerHTML = `<div class="spinner" style="display:inline-block;vertical-align:middle;margin-right:6px;width:12px;height:12px"></div>Generating target & provision…`;
  }
  
  let prompt = `You are a UK SENDCo. Generate a SMART target, recommended provision, and estimated cost for a student's support plan.
Student: ${state.student.fullName}
Development Area: ${AREA_LABELS[k]}
Strengths: ${state.formData.strengths[k] || 'not specified'}
Needs: ${state.formData.needs[k] || 'not specified'}
Intended Outcome: ${outcomeVal}

Generate:
1. SMART target: 1-2 specific, measurable sentences showing how they achieve the outcome, starting with the student's first name.
2. Provision description: The specific classroom intervention/support.
3. Cost: Estimated annual cost (e.g. £300).`;

  if (currentSmart) {
    prompt += `\n\nNote: The student already has this target: "${currentSmart}". Please generate a DIFFERENT, alternative SMART target, provision, and cost.`;
  }

  prompt += `\n\nReturn ONLY a valid JSON object. No markdown, no commentary:
{"smart": "...", "provision": "...", "cost": "..."}`;

  const name = state.student.fname || 'the student';
  const Name = name.charAt(0).toUpperCase() + name.slice(1);
  let smart = '';
  let provision = '';
  let cost = '';
  let success = false;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await resp.json();
    let raw = (data.content?.find(b=>b.type==='text')?.text || '{}').replace(/```json|```/g,'').trim();
    const result = JSON.parse(raw);
    smart = result.smart || '';
    provision = result.provision || '';
    cost = result.cost || '';
    if (smart) success = true;
  } catch(e) {
    // Falls back to offline mock generator
  }

  if (!success) {
    const pool = [
      {
        smart: k === 'executive' ? `Within 6 weeks, ${Name} will use a visual checklist independently to organise their learning materials at the start of 4 out of 5 lessons, as monitored by the class teacher.` :
               k === 'motor' ? `By the end of this term, ${Name} will write at least 3 sentences legibly using assistive writing tools (like a pencil grip or laptop) in 80% of English tasks.` :
               k === 'sensory' ? `Within 4 weeks, ${Name} will independently use noise-cancelling headphones or request a quiet break when classroom noise levels exceed comfort, in 90% of occurrences.` :
               k === 'slc' ? `By the next review, ${Name} will use visual task cards to follow multi-step instructions independently in at least 4 key subject lessons per week.` :
               k === 'social' ? `Within 6 weeks, ${Name} will use a designated self-regulation strategy (such as a card or deep breathing) to manage emotional escalation in 4 out of 5 peer conflicts.` :
               `Within 6 weeks, ${Name} will achieve their target in the area of ${AREA_LABELS[k].toLowerCase()} with support.`,
        provision: k === 'executive' ? `Daily 10-minute check-in and checklist review with a Key Worker / Teaching Assistant before registration.` :
                   k === 'motor' ? `Fine motor occupational therapy hand exercises twice weekly, plus provision of specialized pencil grips and a slanted writing board.` :
                   k === 'sensory' ? `Access to a designated quiet sensory workspace and provision of high-quality noise-cancelling headphones for classroom use.` :
                   k === 'slc' ? `Speech & language visual task cards, and weekly 1:1 vocabulary pre-teaching sessions.` :
                   k === 'social' ? `Weekly 1:1 social-emotional mentoring sessions (ELSA) for 30 minutes to develop self-regulation strategies.` :
                   `Targeted small group support in class.`,
        cost: k === 'executive' ? `£350 — School Budget` :
              k === 'motor' ? `£200 — School Budget` :
              k === 'sensory' ? `£150 — School Equipment` :
              k === 'slc' ? `£400 — School Budget` :
              k === 'social' ? `£650 — School Budget` :
              `£100`
      },
      {
        smart: k === 'executive' ? `By the next review, ${Name} will use a color-coded subject folder system to independently locate and store task sheets in 90% of observed class activities.` :
               k === 'motor' ? `Within 6 weeks, ${Name} will independently use typing software on a laptop to complete extended writing tasks longer than one paragraph in all core subjects.` :
               k === 'sensory' ? `By the next review, ${Name} will use sensory regulation tools (like a wobble cushion or fidget tool) appropriately at their desk to maintain focus for 20-minute intervals.` :
               k === 'slc' ? `Within 6 weeks, ${Name} will use structured sentence starters to contribute at least one verbal response during small group discussions in 3 out of 4 sessions.` :
               k === 'social' ? `By the next review, ${Name} will identify a trusted adult and use a 'safe pass' to access a designated safe space within 2 minutes of experiencing high anxiety.` :
               `By the next review, ${Name} will demonstrate progress in the area of ${AREA_LABELS[k].toLowerCase()} with support.`,
        provision: k === 'executive' ? `1:1 weekly organisation coaching session for 15 minutes with a learning mentor.` :
                   k === 'motor' ? `Laptop access and speech-to-text / typing training sessions for 20 minutes weekly.` :
                   k === 'sensory' ? `Provision of wobble cushion, resistance band on chair legs, and a sensory regulation toolkit.` :
                   k === 'slc' ? `Small group social communication speaking frame cards and TA-facilitated group work.` :
                   `Provision of a laminated 'safe space pass' and designated mentor check-ins twice daily.`,
        cost: k === 'executive' ? `£250 — School Budget` :
              k === 'motor' ? `£450 — Equipment Fund` :
              k === 'sensory' ? `£80 — Equipment Fund` :
              k === 'slc' ? `£280 — School Budget` :
              k === 'social' ? `£500 — School Budget` :
              `£150`
      },
      {
        smart: k === 'executive' ? `Within 4 weeks, ${Name} will write down homework tasks and deadlines in their planner at the end of each lesson with no more than one verbal prompt.` :
               k === 'motor' ? `By the next review, ${Name} will safely navigate classroom spaces and transition between school buildings independently during peak times.` :
               k === 'sensory' ? `Within 6 weeks, ${Name} will identify when they are experiencing sensory overload and use a visual break card to transition to the sensory room for 5 minutes.` :
               k === 'slc' ? `By the end of this term, ${Name} will independently point to a visual communication board to express core learning needs (e.g. help, break) when prompted.` :
               `Within 8 weeks, ${Name} will take turns appropriately and follow game rules during TA-facilitated structured play activities in 4 out of 5 recess periods.`,
        provision: k === 'executive' ? `End-of-lesson visual task prompt card and teacher planner check.` :
                   k === 'motor' ? `1:1 mobility orientation sessions and early exit pass (2 minutes before bell).` :
                   k === 'sensory' ? `Laminated visual exit/break cards and access to the school's sensory room.` :
                   k === 'slc' ? `Laminated communication board on desk and daily check-ins on symbol usage.` :
                   `TA-led structured social skills lunchtime group (e.g. Lego Therapy) twice weekly.`,
        cost: k === 'executive' ? `£180 — School Budget` :
              k === 'motor' ? `£120 — School Budget` :
              k === 'sensory' ? `£300 — School Budget` :
              k === 'slc' ? `£150 — School Budget` :
              `£350 — School Budget`
      }
    ];

    if (!state.lastSuggestionIdx) state.lastSuggestionIdx = {};
    const lastIdx = state.lastSuggestionIdx[k] !== undefined ? state.lastSuggestionIdx[k] : -1;
    let nextIdx = (lastIdx + 1) % pool.length;
    if (currentSmart) {
      // Find one that is different from current
      let attempts = 0;
      while (pool[nextIdx].smart === currentSmart && attempts < pool.length) {
        nextIdx = (nextIdx + 1) % pool.length;
        attempts++;
      }
    }
    state.lastSuggestionIdx[k] = nextIdx;
    
    smart = pool[nextIdx].smart;
    provision = pool[nextIdx].provision;
    cost = pool[nextIdx].cost;
  }

  let existingDesc = '';
  const targetIdx = (state.formData.targets || []).findIndex(t => t._areaKey === k);
  if (targetIdx !== -1 && state.formData.provisions && state.formData.provisions[targetIdx]?.desc) {
    existingDesc = state.formData.provisions[targetIdx].desc;
  } else if (state.formData.provisions_prefill && state.formData.provisions_prefill[k]?.desc) {
    existingDesc = state.formData.provisions_prefill[k].desc;
  }

  let shouldOverwriteProvision = true;
  if (existingDesc && existingDesc !== provision) {
    shouldOverwriteProvision = confirm(
      `An intervention/provision description already exists for this area in the next section:\n\n` +
      `"${existingDesc}"\n\n` +
      `Would you like to overwrite it with the newly generated AI suggestion?\n\n` +
      `"${provision}"`
    );
  }

  smartTextarea.value = smart;
  
  if (shouldOverwriteProvision) {
    if (!state.formData.provisions_prefill) state.formData.provisions_prefill = {};
    state.formData.provisions_prefill[k] = {
      desc: provision,
      cost: cost,
      by: 'Teaching Assistant',
      freq: 'Daily',
      forceOverwrite: true
    };
  }

  if (btn) btn.disabled = false;
  if (statusEl) {
    statusEl.innerHTML = `<span style="color:#27ae60;font-weight:600">✓ Suggested SMART target and cost loaded.</span>`;
    setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
  }
}

function deleteTarget(idx) {
  state.formData.targets.forEach((_, i) => {
    const el = document.getElementById('edit-t-' + i);
    if (el) state.formData.editedTargets[i] = el.value;
  });
  state.formData.targets.splice(idx, 1);
  const newEdited = {};
  Object.entries(state.formData.editedTargets).forEach(([k, v]) => {
    const n = parseInt(k);
    if (n < idx) newEdited[n] = v;
    else if (n > idx) newEdited[n - 1] = v;
  });
  state.formData.editedTargets = newEdited;
  // Remap APDR entries on the saved ISP so historical reviews still point to the right target
  if (state.editingIdx != null && state.isps[state.editingIdx]?.apdr) {
    state.isps[state.editingIdx].apdr.forEach(entry => {
      if (typeof entry.target === 'number') {
        if (entry.target === idx) entry.target = null;
        else if (entry.target > idx) entry.target -= 1;
      }
    });
  }
  renderTargetCards();
}

function renderTargetCards() {
  const out = document.getElementById('target-output');
  if (!out) return;
  out.innerHTML = state.formData.targets.map((t,i) => `
    <div class="target-card">
      <button onclick="deleteTarget(${i})" style="position:absolute;top:8px;right:10px;background:none;border:none;cursor:pointer;color:var(--muted);font-size:20px;line-height:1;padding:2px 4px" title="Remove this target">×</button>
      <span class="target-area-tag">${t.area}</span>
      <div class="target-outcome" style="margin-bottom:6px">${t.outcome}</div>
      <div class="target-smart-label">SMART target — edit to personalise</div>
      <textarea id="edit-t-${i}" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:13px;font-family:inherit;min-height:90px;resize:vertical;color:var(--text)">${state.formData.editedTargets[i]!==undefined ? state.formData.editedTargets[i] : t.smart}</textarea>
    </div>`).join('');
}

function renderStep4(el) {
  el.innerHTML = `
    <div class="step-title">🛠️ Provision and interventions</div>
    <div class="step-sub">For each intended outcome, describe the support, who provides it, how often, and the cost.</div>
    <div id="provision-tables"></div>`;
  renderProvisionTables();
}

function renderProvisionTables() {
  const container = document.getElementById('provision-tables');
  if (!container) return;
  container.innerHTML = state.formData.targets.map((t,i) => {
    const p = state.formData.provisions[i] || {};
    return `
    <div class="dev-card" style="margin-bottom:1.25rem">
      <div class="dev-card-header">
        <span class="dev-card-title">${i+1}. ${t.area}</span>
        <span class="dev-chip" style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.outcome}</span>
      </div>
      <div class="field"><label>Provision / intervention description <span style="color:#e74c3c">*</span></label>
        <textarea id="pv-desc-${i}" placeholder="Describe the specific support, intervention or reasonable adjustment provided...">${p.desc||''}</textarea>
      </div>
      <div class="row-3">
        <div class="field"><label>Provided by <span style="color:#e74c3c">*</span></label><input type="text" id="pv-by-${i}" placeholder="e.g. Teaching assistant" value="${p.by||''}" /></div>
        <div class="field"><label>When / frequency</label><input type="text" id="pv-freq-${i}" placeholder="e.g. 2x 30min per week" value="${p.freq||''}" /></div>
        <div class="field"><label>Annual cost and funder</label><input type="text" id="pv-cost-${i}" placeholder="e.g. £975 — School" value="${p.cost||''}" /></div>
      </div>
    </div>`;
  }).join('');
}

function renderStep5(el) {
  el.innerHTML = `
    <div class="step-title">🧒 Pupil and parent / carer voice</div>
    <div class="step-sub">Record the views of the student and their parent or carer. These should be in their own words where possible.</div>
    <div class="voice-card">
      <div class="voice-label"><span style="font-size:16px;line-height:1">🧒</span> Pupil voice</div>
      <textarea id="voice-pupil" style="width:100%;border:1px solid var(--border);border-radius:var(--radius);padding:9px 12px;font-size:14px;font-family:inherit;min-height:110px;resize:vertical;color:var(--text)" placeholder="What does the student say about their learning, what helps them, what they find hard, what they would like to change...">${state.formData.voices.pupil}</textarea>
    </div>
    <div class="voice-card">
      <div class="voice-label"><span style="font-size:16px;line-height:1">👨‍👩‍👦</span> Parent / carer voice</div>
      <textarea id="voice-parent" style="width:100%;border:1px solid var(--border);border-radius:var(--radius);padding:9px 12px;font-size:14px;font-family:inherit;min-height:110px;resize:vertical;color:var(--text)" placeholder="What do parents or carers say about their child's progress, priorities, concerns and what support they feel is needed...">${state.formData.voices.parent}</textarea>
    </div>
    <div class="alert-info">Both voices are a statutory requirement under the SEND Code of Practice 2015. Ensure these have been gathered before finalising the ISP.</div>`;
}

function renderStep6(el) {
  const o = state.formData.overview;
  const h = state.formData.health;
  el.innerHTML = `
    <div class="step-title">✅ Review and finalise</div>
    <div class="step-sub">Check all sections before creating the ISP. You can go back to make changes.</div>

    <div class="summary-panel">
      <h3>Student details</h3>
      <div class="summary-row"><span class="summary-key">Full name</span><span class="summary-val">${state.student.fullName}</span></div>
      <div class="summary-row"><span class="summary-key">UPN</span><span class="summary-val">${state.student.arborId}</span></div>
      <div class="summary-row"><span class="summary-key">Year / form</span><span class="summary-val">${state.student.year} ${state.student.form}</span></div>
      <div class="summary-row"><span class="summary-key">School</span><span class="summary-val">${state.student.school||'—'}</span></div>
      <div class="summary-row"><span class="summary-key">Date of birth</span><span class="summary-val">${state.student.dob||'—'}</span></div>
    </div>

    <div class="summary-panel">
      <h3>Plan overview</h3>
      <div class="summary-row"><span class="summary-key">Created</span><span class="summary-val">${o.created||'—'}</span></div>
      <div class="summary-row"><span class="summary-key">Last reviewed</span><span class="summary-val">${o.reviewed||'—'}</span></div>
      <div class="summary-row"><span class="summary-key">Diagnoses</span><span class="summary-val">${o.diagnoses||'—'}</span></div>
      <div class="summary-row"><span class="summary-key">Responsible staff</span><span class="summary-val">${o.staff||'—'}</span></div>
      <div class="summary-row"><span class="summary-key">External agencies</span><span class="summary-val">${o.agencies||'—'}</span></div>
      <div class="summary-row"><span class="summary-key">Attendance</span><span class="summary-val">${o.attendance||'—'}%</span></div>
      <div class="summary-row"><span class="summary-key">EHCP</span><span class="summary-val">${h.ehcp||'—'}</span></div>
    </div>

    <div class="summary-panel">
      <h3>Targets (${state.formData.targets.length})</h3>
      ${state.formData.targets.map((t,i) => `
        <div class="summary-row" style="margin-bottom:10px;flex-direction:column;gap:2px">
          <span class="summary-key">${i+1}. ${t.area}</span>
          <span class="summary-val" style="font-size:13px">${t.outcome}</span>
        </div>`).join('')}
    </div>

    <div class="summary-panel">
      <h3>Voices</h3>
      <div class="summary-row"><span class="summary-key">🧒 Pupil voice</span><span class="summary-val" style="font-size:13px">${state.formData.voices.pupil||'<em style="color:var(--subtle)">Not recorded</em>'}</span></div>
      <div class="summary-row"><span class="summary-key">👨‍👩‍👦 Parent / carer voice</span><span class="summary-val" style="font-size:13px">${state.formData.voices.parent||'<em style="color:var(--subtle)">Not recorded</em>'}</span></div>
    </div>

    <div class="alert-info">Once you click <strong>Create ISP</strong>, the plan will be saved centrally and a PDF download will be available.</div>
    <div style="display:flex;justify-content:flex-end;gap:10px">
      <button class="btn-secondary" onclick="prevStep()">← Back</button>
      <button class="btn-primary" onclick="finaliseISP()">Create ISP ✓</button>
    </div>`;
}


/* ── PDF generation ── */
async function generatePDF() {
  const btn = document.getElementById('pdf-btn');
  btn.disabled = true; btn.textContent = 'Generating…';

  // Use the saved ISP record rather than live form state
  const idx = state.previewIdx !== undefined ? state.previewIdx : 0;
  await downloadExistingPDF(idx);

  btn.disabled = false; btn.textContent = '⬇ Download PDF';
}

async function _generatePDFFromFormData() {
  const btn = document.getElementById('pdf-btn');

  const o  = state.formData.overview;
  const h  = state.formData.health;
  const fd = state.formData;
  const targets = fd.targets.map((t,i) => ({
    ...t,
    smart:     fd.editedTargets[i] !== undefined ? fd.editedTargets[i] : t.smart,
    provision: fd.provisions[i] || {}
  }));

  const areaDetails = fd.areas.map(k =>
    `${AREA_LABELS[k]}: Strengths: ${fd.strengths[k]||'—'} | Needs: ${fd.needs[k]||'—'} | Advice: ${fd.advice[k]||'—'}`
  ).join('\n');

  const mis = fd.mis || {};
  const prompt = `Generate a complete, professionally formatted Individual Support Plan (ISP) as a printable HTML document. This is for a UK school and must follow the SEND Code of Practice 2015 format.

Use the following data exactly:

STUDENT DETAILS
Name: ${state.student.fullName}
UPN: ${state.student.arborId}
Year group / class: ${state.student.year} ${state.student.form}
Date of birth: ${state.student.dob||'—'}
School: ${state.student.school||'Demo School'}
Gender: ${state.student.gender||'—'}

PLAN DETAILS
Date created: ${o.created||'—'}
Date last reviewed: ${o.reviewed||'—'}
Current attendance: ${o.attendance||'—'}%
Medical needs / diagnoses: ${o.diagnoses||'—'}
Staff responsible: ${o.staff||'—'}
External agencies: ${o.agencies||'—'}
EHCP status: ${h.ehcp||'—'}

ATTENDANCE AND BEHAVIOUR DETAILS
Attendance (This Term): ${mis.attThis || o.attendance || '—'}%
Attendance (Last Term): ${mis.attLast || '—'}%
Suspensions (This Year): ${mis.susThis || '0'} days
Suspensions (Last Year): ${mis.susLast || '0'} days
Behaviour Points: ${mis.bp || '0'}
Internal Exclusions: ${mis.intEx || '0'}

STUDENT SUMMARY
${fd.summary||'No summary provided.'}

STRENGTHS AND NEEDS BY AREA
${areaDetails}

HEALTH AND WELLBEING
Health notes: ${h.health||'—'}
Social care: ${h.social||'—'}
Document links: ${h.links||'—'}

TARGETS AND PROVISION
${targets.map((t,i) => `Target ${i+1}:
  Area: ${t.area}
  Intended outcome: ${t.outcome}
  SMART target: ${t.smart}
  Provision: ${t.provision.desc||'—'}
  Provided by: ${t.provision.by||'—'}
  Frequency: ${t.provision.freq||'—'}
  Cost / funder: ${t.provision.cost||'—'}`).join('\n\n')}

VOICES
Pupil voice: ${fd.voices.pupil||'Not recorded.'}
Parent/carer voice: ${fd.voices.parent||'Not recorded.'}

OUTPUT REQUIREMENTS:
- Return ONLY the HTML body content — no DOCTYPE, no html, head, or body tags
- Use inline styles only (for print compatibility)
- Use a professional, clean table-based layout with the school colour #0F6E56 (teal) for headings and table headers
- Include: document header with school name and "Individual Support Plan" title; pupil details table; a section for Attendance and Behaviour summary (displaying attendance trends, suspensions, and behaviour points/internal exclusions); strengths and needs section with a table per development area; health and wellbeing section; targeted support table (columns: Area, Intended outcome, SMART target, Provision description, Provided by/frequency, Cost); pupil and parent/carer voice section; a signatures and review dates box at the bottom
- All table borders should be 1px solid #ccc; font Arial 11px; heading rows teal background white text
- Include a print button at the top`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role:'user', content: prompt }]
      })
    });
    const data = await resp.json();
    let html = (data.content?.find(b=>b.type==='text')?.text || '').replace(/```html|```/g,'').trim();
    openPDFWindow(html, state.student.fullName);
  } catch(e) {
    openPDFWindow(buildFallbackHTML(null), state.student.fullName);
  }

  btn.disabled = false; btn.textContent = '⬇ Download PDF';
}

function buildFallbackHTML(isp) {
  const src = isp || {
    name: state.student.fullName, arborId: state.student.arborId,
    year: state.student.year, form: state.student.form, school: state.student.school,
    dob: state.student.dob, gender: state.student.gender,
    overview: state.formData.overview, summary: state.formData.summary,
    areas: state.formData.areas, strengths: state.formData.strengths,
    needs: state.formData.needs, advice: state.formData.advice,
    health: state.formData.health, voices: state.formData.voices,
    targets: state.formData.targets.map((t,i)=>({ ...t, smart: state.formData.editedTargets[i]!==undefined?state.formData.editedTargets[i]:t.smart })),
    provisions: state.formData.provisions, apdr: [],
  };
  const o = src.overview||{};
  const h = src.health||{};
  const targets = (src.targets||[]).map((t,i)=>({ ...t, provision: (src.provisions&&src.provisions[i])||{} }));
  const apdr = src.apdr||[];
  return `
    <h1 style="color:#0F6E56;font-size:20px;margin-bottom:4px">Individual Support Plan</h1>
    <p style="color:#666;font-size:12px;margin-bottom:20px">${src.school||'Demo School'}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tr style="background:#0F6E56"><th colspan="4" style="color:white;padding:8px;text-align:left">Pupil details</th></tr>
      <tr><td style="padding:6px;border:1px solid #ccc;width:22%"><strong>Name</strong></td><td style="padding:6px;border:1px solid #ccc">${src.name}</td><td style="padding:6px;border:1px solid #ccc;width:18%"><strong>UPN</strong></td><td style="padding:6px;border:1px solid #ccc">${src.arborId}</td></tr>
      <tr><td style="padding:6px;border:1px solid #ccc"><strong>Date of birth</strong></td><td style="padding:6px;border:1px solid #ccc">${src.dob||'—'}</td><td style="padding:6px;border:1px solid #ccc"><strong>Year / form</strong></td><td style="padding:6px;border:1px solid #ccc">${src.year||'—'} ${src.form||''}</td></tr>
      <tr><td style="padding:6px;border:1px solid #ccc"><strong>School</strong></td><td style="padding:6px;border:1px solid #ccc">${src.school||'—'}</td><td style="padding:6px;border:1px solid #ccc"><strong>Gender</strong></td><td style="padding:6px;border:1px solid #ccc">${src.gender||'—'}</td></tr>
      <tr><td style="padding:6px;border:1px solid #ccc"><strong>Diagnoses</strong></td><td style="padding:6px;border:1px solid #ccc" colspan="3">${o.diagnoses||'—'}</td></tr>
      <tr><td style="padding:6px;border:1px solid #ccc"><strong>Attendance</strong></td><td style="padding:6px;border:1px solid #ccc" colspan="3">${o.attendance||'—'}%</td></tr>
      <tr><td style="padding:6px;border:1px solid #ccc"><strong>Responsible staff</strong></td><td style="padding:6px;border:1px solid #ccc">${o.staff||'—'}</td><td style="padding:6px;border:1px solid #ccc"><strong>EHCP</strong></td><td style="padding:6px;border:1px solid #ccc">${h.ehcp||'—'}</td></tr>
      <tr><td style="padding:6px;border:1px solid #ccc"><strong>External agencies</strong></td><td style="padding:6px;border:1px solid #ccc" colspan="3">${o.agencies||'—'}</td></tr>
      <tr><td style="padding:6px;border:1px solid #ccc"><strong>Date created</strong></td><td style="padding:6px;border:1px solid #ccc">${o.created||'—'}</td><td style="padding:6px;border:1px solid #ccc"><strong>Last reviewed</strong></td><td style="padding:6px;border:1px solid #ccc">${o.reviewed||'—'}</td></tr>
    </table>
    ${src.summary?`<table style="width:100%;border-collapse:collapse;margin-bottom:16px"><tr style="background:#0F6E56"><th style="color:white;padding:8px;text-align:left">Student summary</th></tr><tr><td style="padding:10px;border:1px solid #ccc">${src.summary}</td></tr></table>`:''}
    ${src.areas&&src.areas.length?`<table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tr style="background:#0F6E56"><th style="color:white;padding:8px;text-align:left">Area</th><th style="color:white;padding:8px;text-align:left">Strengths</th><th style="color:white;padding:8px;text-align:left">Needs / barriers</th><th style="color:white;padding:8px;text-align:left">Specialist advice</th></tr>
      ${src.areas.map(k=>`<tr><td style="padding:6px;border:1px solid #ccc;vertical-align:top"><strong>${AREA_LABELS[k]||k}</strong></td><td style="padding:6px;border:1px solid #ccc;vertical-align:top">${(src.strengths&&src.strengths[k])||'—'}</td><td style="padding:6px;border:1px solid #ccc;vertical-align:top">${(src.needs&&src.needs[k])||'—'}</td><td style="padding:6px;border:1px solid #ccc;vertical-align:top">${(src.advice&&src.advice[k])||'—'}</td></tr>`).join('')}
    </table>`:''}
    ${(h.health||h.social)?`<table style="width:100%;border-collapse:collapse;margin-bottom:16px"><tr style="background:#0F6E56"><th colspan="2" style="color:white;padding:8px;text-align:left">Health and wellbeing</th></tr>
      <tr><td style="padding:8px;border:1px solid #ccc;width:50%;vertical-align:top"><strong>Health notes</strong><br><br>${h.health||'—'}</td><td style="padding:8px;border:1px solid #ccc;vertical-align:top"><strong>Social care / community</strong><br><br>${h.social||'—'}</td></tr>
    </table>`:''}
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tr style="background:#0F6E56"><th style="color:white;padding:8px;text-align:left">Area</th><th style="color:white;padding:8px;text-align:left">Intended outcome</th><th style="color:white;padding:8px;text-align:left">SMART target</th><th style="color:white;padding:8px;text-align:left">Provision</th><th style="color:white;padding:8px;text-align:left">Provided by / frequency</th><th style="color:white;padding:8px;text-align:left">Cost</th></tr>
      ${targets.map(t=>`<tr><td style="padding:6px;border:1px solid #ccc;vertical-align:top">${t.area}</td><td style="padding:6px;border:1px solid #ccc;vertical-align:top">${t.outcome}</td><td style="padding:6px;border:1px solid #ccc;vertical-align:top">${t.smart}</td><td style="padding:6px;border:1px solid #ccc;vertical-align:top">${t.provision.desc||'—'}</td><td style="padding:6px;border:1px solid #ccc;vertical-align:top">${t.provision.by||'—'}${t.provision.freq?'<br>'+t.provision.freq:''}</td><td style="padding:6px;border:1px solid #ccc;vertical-align:top">${t.provision.cost||'—'}</td></tr>`).join('')}
    </table>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px"><tr style="background:#0F6E56"><th colspan="2" style="color:white;padding:8px;text-align:left">Voices</th></tr>
      <tr><td style="padding:10px;border:1px solid #ccc;width:50%;vertical-align:top"><strong>Pupil voice</strong><br><br>${(src.voices&&src.voices.pupil)||'Not recorded.'}</td><td style="padding:10px;border:1px solid #ccc;vertical-align:top"><strong>Parent / carer voice</strong><br><br>${(src.voices&&src.voices.parent)||'Not recorded.'}</td></tr>
    </table>
    ${apdr.length?`<table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tr style="background:#0F6E56"><th colspan="7" style="color:white;padding:8px;text-align:left">APDR review record</th></tr>
      <tr style="background:#eee"><th style="padding:6px;border:1px solid #ccc;text-align:left">Date</th><th style="padding:6px;border:1px solid #ccc;text-align:left">Area</th><th style="padding:6px;border:1px solid #ccc;text-align:left">Progress</th><th style="padding:6px;border:1px solid #ccc;text-align:left">School</th><th style="padding:6px;border:1px solid #ccc;text-align:left">Parent/carer</th><th style="padding:6px;border:1px solid #ccc;text-align:left">Next steps</th><th style="padding:6px;border:1px solid #ccc;text-align:left">By/when</th></tr>
      ${apdr.map(e=>`<tr><td style="padding:6px;border:1px solid #ccc">${e.date}</td><td style="padding:6px;border:1px solid #ccc">${(src.targets&&src.targets[e.target])?src.targets[e.target].area:'—'}</td><td style="padding:6px;border:1px solid #ccc">${e.progress==='good'?'Good progress':e.progress==='some'?'Some progress':'Needs support'}</td><td style="padding:6px;border:1px solid #ccc">${e.schoolComment||'—'}</td><td style="padding:6px;border:1px solid #ccc">${e.parentComment||'—'}</td><td style="padding:6px;border:1px solid #ccc">${e.nextSteps||'—'}</td><td style="padding:6px;border:1px solid #ccc">${(e.by||'—')+(e.deadline?'<br><small style="color:#666">Deadline: '+e.deadline+'</small>':'')}</td></tr>`).join('')}
    </table>`:''}
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px"><tr style="background:#0F6E56"><th colspan="4" style="color:white;padding:8px;text-align:left">Signatures and review</th></tr>
      <tr><td style="padding:24px;border:1px solid #ccc">SENDCo signature<br><br><br>_____________________<br><small>${o.staff||''}</small></td>
          <td style="padding:24px;border:1px solid #ccc">Parent / carer signature<br><br><br>_____________________</td>
          <td style="padding:24px;border:1px solid #ccc">Pupil signature<br><br><br>_____________________</td>
          <td style="padding:24px;border:1px solid #ccc">Next review date<br><br><br>_____________________</td></tr>
    </table>`;
}

function openPDFWindow(bodyHTML, studentName) {
  const name = studentName || (state.student&&state.student.fullName) || 'Student';
  const win = window.open('', '_blank');
  if (!win) { alert('Pop-up blocked — please allow pop-ups and try again.'); return; }
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>ISP — ${name}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:11px;color:#222;margin:15mm 18mm;line-height:1.5}
  table{border-collapse:collapse}
  @page{size:A4;margin:12mm 15mm}
  @media print{
    .no-print{display:none!important}
    body{margin:0}
    tr{page-break-inside:avoid}
  }
</style>
</head><body>
<div class="no-print" style="margin-bottom:16px;display:flex;gap:10px;align-items:center">
  <button onclick="window.print()" style="padding:9px 18px;background:#0F6E56;color:white;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">Print / Save as PDF</button>
  <span style="font-size:12px;color:#666">Use your browser's Print dialog → Save as PDF</span>
</div>
${bodyHTML}
</body></html>`);
  win.document.close();
}

/* ── View existing ISP ── */
function viewISP(idx) {
  const isp = state.isps[idx];
  state.viewingISP = idx;
  document.getElementById('view-topbar-name').textContent = `ISP — ${isp.name}`;
  if (state.user) {
    const a = document.getElementById('view-av'), n = document.getElementById('view-name-bar');
    if (a) a.textContent = state.user.initials;
    if (n) n.textContent = state.user.name;
  }
  renderViewScreen(isp, idx);
  showScreen('screen-view');
}

function renderViewScreen(isp, idx) {
  document.getElementById('view-content').innerHTML = `
    <div id="view-sec-header"></div>
    <div id="view-sec-overview"></div>
    <div id="view-sec-strategies"></div>
    <div id="view-sec-health"></div>
    <div id="view-sec-strengths"></div>
    <div id="view-sec-targets"></div>
    <div id="view-sec-voices"></div>
    <div id="view-sec-apdr"></div>`;
  vsHeader(isp, idx);
  vsOverview(isp, idx);
  vsStrategies(isp, idx);
  vsHealth(isp, idx);
  vsStrengths(isp, idx);
  vsTargets(isp, idx);
  vsVoices(isp, idx);
  vsAPDR(isp, idx);
}

function vsHeader(isp, idx) {
  const el = document.getElementById('view-sec-header');
  if (!el) return;
  el.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:0.75rem;gap:8px">
      <button class="btn-secondary" style="font-size:13px" onclick="downloadExistingPDF(${idx})">⬇ PDF</button>
    </div>`;
}

function misFromSeed(id) {
  const seed = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const bp    = seed % 7 === 0 ? -((seed % 4) + 1) * 5 : ((seed % 6) + 1) * 15 + (seed % 20);
  const susThis = seed % 9 === 0 ? (seed % 3 === 0 ? 2 : 1) : 0;
  const susLast = seed % 11 === 0 ? 1 : 0;
  const intEx   = seed % 9 === 0 ? (seed % 2) + 1 : 0;
  const attThis = (83 + (seed % 16)) + (seed % 10) / 10;
  const attLast = (81 + (seed % 18)) + (seed % 10) / 10;
  return {
    attThis: String(attThis.toFixed(1)),
    attLast: String(attLast.toFixed(1)),
    susThis: String(susThis),
    susLast: String(susLast),
    bp:      String(bp),
    intEx:   String(intEx),
  };
}

function buildMISForView(isp) {
  const arborId = String(isp.arborId || '');

  // Demo students: use DEMO_ISPS as fallback only — live sheet / stored isp.mis take priority
  const demoMatch = DEMO_ISPS.find(d => String(d.arborId) === arborId || (isp.name && normName(d.name) === normName(isp.name)));

  // Real students: live lookup from sheet
  let ss = arborId ? (state.sheetStudents || []).find(x => (x._id && x._id === arborId) || String(x['Arbor ID']) === arborId || String(x['UPN']) === arborId) : null;
  if (!ss && isp.name) {
    const nn = normName(isp.name);
    ss = (state.sheetStudents || []).find(x => normName(x['Pupil Name'] || '') === nn);
  }
  if (ss) {
    const nv = v => (v === null || v === undefined || v === '') ? null : v;
    const normAttV = v => { const n = parseFloat(v); if (isNaN(n)) return null; return n > 0 && n <= 1 ? Math.round(n*1000)/10 : Math.round(n*10)/10; };
    const pct      = nv(sheetVal(ss, 'Present', 'Attendance %', 'Attendance', 'Att %', 'Att%', 'attendance'));
    const attThisN = normAttV(nv(sheetVal(ss, 'Attendance This Term', 'Att This Term', 'This Term Attendance', 'Current Term Attendance')) ?? pct ?? '');
    const attLastN = normAttV(nv(sheetVal(ss, 'Attendance Last Term', 'Att Last Term', 'Last Term Attendance', 'Previous Term Attendance')) ?? '');
    const susThis  = nv(sheetVal(ss, 'Suspensions this Year', 'Suspensions This Year', 'Suspensions', 'Sus This Year'));
    const susLast  = nv(sheetVal(ss, 'Suspensions Last Year', 'Sus Last Year', 'Previous Year Suspensions'));
    const bp       = nv(sheetVal(ss, 'Behaviour Points', 'Behaviour Pts', 'BehaviourPoints'));
    const intEx    = nv(sheetVal(ss, 'Internal Exclusions this Year', 'Internal Exclusions', 'Internal Excl', 'Int Excl'));
    if (attThisN !== null || susThis !== null || bp !== null || intEx !== null) {
      const stored = isp.mis || {};
      // For fields missing from the sheet, fall back to stored isp.mis, then to deterministic mock
      const mock = misFromSeed(arborId || isp.name || '');
      return {
        attThis: attThisN !== null ? String(attThisN) : (stored.attThis || ''),
        attLast: attLastN !== null ? String(attLastN) : (stored.attLast || mock.attLast),
        susThis: susThis !== null ? String(susThis) : (stored.susThis !== '' && stored.susThis != null ? stored.susThis : mock.susThis),
        susLast: susLast !== null ? String(susLast) : (stored.susLast !== '' && stored.susLast != null ? stored.susLast : mock.susLast),
        bp:      bp      !== null ? String(bp)      : (stored.bp      !== '' && stored.bp      != null ? stored.bp      : mock.bp),
        intEx:   intEx   !== null ? String(intEx)   : (stored.intEx   !== '' && stored.intEx   != null ? stored.intEx   : mock.intEx),
      };
    }
  }
  // Final fallback: stored mis or bare attendance
  const o2 = isp.overview || {};
  if (isp.mis && Object.values(isp.mis).some(v => v !== '' && v !== null && v !== undefined)) return isp.mis;
  if (o2.attendance) return { attThis: o2.attendance, attLast: '', susThis: '', susLast: '', bp: '', intEx: '' };
  if (demoMatch && demoMatch.mis) return demoMatch.mis;
  return null;
}

function vsOverview(isp, idx) {
  const el = document.getElementById('view-sec-overview');
  if (!el) return;
  const o = isp.overview || {};
  const h = isp.health || {};
  const misSummary = buildMISForView(isp);

  const areaIconsHTML = (isp.areas||[]).map(k => {
    const color = AREA_COLOR[k] || 'var(--teal)';
    const bg    = AREA_BG[k]    || color+'14';
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 14px;border-radius:var(--radius);background:${bg};border:1.5px solid ${color}50;min-width:84px">
      <span style="font-size:22px;line-height:1">${AREA_ICON[k]||'●'}</span>
      <span style="font-size:11px;font-weight:700;color:${color};text-align:center;line-height:1.3">${AREA_LABELS[k]}</span>
    </div>`;
  }).join('');

  const riskFlagHTML = (isp.riskFlags||[]).length
    ? RISK_FLAGS.filter(f=>(isp.riskFlags||[]).includes(f.key)).map(f =>
        `<div style="display:flex;align-items:center;gap:8px;padding:7px 11px;border-radius:var(--radius);border:1.5px solid #c0c0c0;background:#f5f5f5;margin-bottom:5px;position:relative">
          <span style="font-size:16px;line-height:1;filter:grayscale(1)">${f.icon}</span>
          <span style="font-size:12px;font-weight:700;color:#444">${f.label}</span>
          <span style="position:absolute;top:6px;right:10px;font-size:18px;font-weight:900;color:#D32F2F;line-height:1" title="Risk alert">&#9888;</span>
        </div>`).join('')
    : '<span style="font-size:13px;color:var(--subtle);font-style:italic">No risk flags recorded.</span>';

  el.innerHTML = `
    <div style="background:var(--surface);border:2px solid rgba(0,0,0,0.32);border-radius:var(--radius-lg);margin-bottom:1.5rem;overflow:hidden;box-shadow:0 6px 28px rgba(0,0,0,0.13),0 2px 6px rgba(0,0,0,0.07)">
      <div style="height:4px;background:linear-gradient(90deg,#0F6E56,#1D9E75,#378ADD,#D4537E,#D85A30)"></div>

      <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:1.25rem 1.5rem 1rem;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${isp.school||'—'} &nbsp;·&nbsp; Individual Support Plan</div>
          <div style="font-size:26px;font-weight:800;margin-bottom:4px;letter-spacing:-0.5px">${isp.name}</div>
          <div style="font-size:13px;color:var(--muted)">UPN <strong>${isp.arborId}</strong> &nbsp;·&nbsp; ${isp.year} ${isp.form} &nbsp;·&nbsp; DOB: ${isp.dob||'—'} &nbsp;·&nbsp; ${isp.gender||'—'}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          ${(() => { const c = senCode(isp); const col = c==='E'?'#b71c1c':c==='K+'?'#c07000':c==='K'?'#b8860b':c==='M'?'#2e7d32':'#555'; return c ? `<span style="font-size:13px;font-weight:800;padding:5px 14px;border-radius:20px;background:${col}15;border:1.5px solid ${col}50;color:${col};letter-spacing:0.04em">${c}</span>` : ''; })()}
          <span style="font-size:12px;color:var(--muted)">Staff: ${o.staff||'—'}</span>
          <span style="font-size:12px;color:var(--muted)">Attendance: ${o.attendance?o.attendance+'%':'—'}</span>
          <button class="btn-secondary" style="font-size:12px;padding:4px 10px;margin-top:4px" onclick="editViewSection('overview',${idx})">✏ Edit</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid var(--border)">
        <div style="padding:1rem 1.5rem;border-right:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em">Areas of need</div>
            <button class="btn-secondary" style="font-size:11px;padding:3px 8px" onclick="editViewAreas(${idx})">✏ Edit areas</button>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">${areaIconsHTML||'<span style="font-size:13px;color:var(--subtle);font-style:italic">None recorded.</span>'}</div>
        </div>
        <div style="padding:1rem 1.5rem">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:10px">Risk / alert flags</div>
          ${riskFlagHTML}
        </div>
      </div>

      <div style="padding:1rem 1.5rem;border-bottom:1px solid var(--border)">
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Student summary</div>
        <p style="font-size:13px;color:var(--text);line-height:1.7;margin:0">${isp.summary||'<em style="color:var(--subtle)">No summary recorded.</em>'}</p>
      </div>

      <div style="padding:1rem 1.5rem;display:flex;flex-wrap:wrap;gap:1.5rem;border-bottom:1px solid var(--border)">
        ${[['Created',o.created||'—'],['Last reviewed',o.reviewed||'—'],['Diagnoses',(o.diagnoses||'—').replace(/^(ehcp|k\+|k|m)\s*[—\-–]\s*/i,'')],['Agencies',o.agencies||'—']].map(([k,v])=>`
          <div><div style="font-size:11px;color:var(--muted);margin-bottom:2px">${k}</div><div style="font-size:13px;font-weight:600">${v}</div></div>`).join('')}
      </div>
      ${misSummary ? `<div style="padding:1rem 1.5rem;border-top:1px solid var(--border)">${misSummaryBlock(misSummary, false)}</div>` : ''}
    </div>`;
}

function vsHealth(isp, idx) {
  const el = document.getElementById('view-sec-health');
  if (!el) return;
  const h = isp.health || {};
  const docs = h.docs || [];
  const docsHTML = docs.length ? docs.map((d,di) => `
    <div style="display:flex;align-items:center;gap:8px;padding:5px 8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;font-size:12px">
      <span style="font-size:15px">📄</span>
      <a href="${d.url}" target="_blank" style="color:var(--teal);text-decoration:none;font-weight:600;flex:1">${d.name}</a>
      <button onclick="removeHealthDoc(${idx},${di})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:0 2px" title="Remove">×</button>
    </div>`).join('') : '';

  el.innerHTML = `
    <div class="table-card" style="margin-bottom:1.5rem">
      <div class="table-card-header">
        <h2>Health, care and wellbeing</h2>
        <button class="btn-secondary" style="font-size:12px;padding:5px 12px" onclick="editViewSection('health',${idx})">✏ Edit</button>
      </div>
      <div style="padding:1rem 1.25rem;display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:5px">Health / wellbeing notes</div>
          <p style="font-size:13px;line-height:1.6">${h.health||'<em style="color:var(--subtle)">Not recorded.</em>'}</p>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:5px">Social care / community services</div>
          <p style="font-size:13px;line-height:1.6">${h.social||'<em style="color:var(--subtle)">Not recorded.</em>'}</p>
        </div>
        <div style="grid-column:span 2">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Documents &amp; links</div>
          ${h.links?`<p style="font-size:13px;line-height:1.6;margin:0 0 8px">${h.links}</p>`:''}
          <div id="health-docs-${idx}" style="display:flex;flex-direction:column;gap:5px;margin-bottom:8px">${docsHTML}</div>
          <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;padding:5px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--muted)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            Attach PDF / document
            <input type="file" accept=".pdf,.doc,.docx,.png,.jpg" style="display:none" onchange="attachHealthDoc(${idx},this)">
          </label>
          <style>.health-attach-btn svg{vertical-align:middle}</style>
        </div>
      </div>
    </div>`;
}

function attachHealthDoc(idx, input) {
  const file = input.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const isp = state.isps[idx];
  if (!isp.health) isp.health = {};
  if (!isp.health.docs) isp.health.docs = [];
  isp.health.docs.push({ name: file.name, url });
  saveISPs();
  vsHealth(isp, idx);
}

function removeHealthDoc(idx, di) {
  const isp = state.isps[idx];
  if (isp.health?.docs) { isp.health.docs.splice(di, 1); saveISPs(); vsHealth(isp, idx); }
}

function vsStrengths(isp, idx) {
  const el = document.getElementById('view-sec-strengths');
  if (!el) return;
  const closedAreas = isp.closedAreas || [];
  if ((!isp.areas || !isp.areas.length) && !closedAreas.length) { el.innerHTML = ''; return; }
  const closedRows = closedAreas.map(ca => `
    <tr style="background:#FAFAFA">
      <td style="vertical-align:top">
        <span style="font-size:13px;color:var(--muted);text-decoration:line-through">${ca.label}</span><br>
        <span style="display:inline-block;margin-top:4px;font-size:11px;font-weight:700;padding:2px 7px;border-radius:10px;background:#F0F0F0;color:#888">Closed</span>
      </td>
      <td colspan="3" style="font-size:12px;color:var(--muted);vertical-align:top;line-height:1.6">
        <em>Closed on ${ca.closedDate||'—'} by ${ca.closedBy||'—'}</em><br>
        <strong style="color:var(--text)">Rationale:</strong> ${ca.rationale||'—'}
      </td>
    </tr>`).join('');
  el.innerHTML = `
    <div class="table-card" style="margin-bottom:1.5rem">
      <div class="table-card-header">
        <h2>Strengths, needs and barriers</h2>
        <button class="btn-secondary" style="font-size:12px;padding:5px 12px" onclick="editViewSection('strengths',${idx})">✏ Edit</button>
      </div>
      <table>
        <thead><tr><th style="width:160px">Area</th><th>Strengths</th><th>Needs / barriers</th><th>Specialist advice</th></tr></thead>
        <tbody>
          ${(isp.areas||[]).map(k=>`<tr>
            <td><strong>${AREA_LABELS[k]||k}</strong></td>
            <td style="font-size:13px">${(isp.strengths&&isp.strengths[k])||'—'}</td>
            <td style="font-size:13px">${(isp.needs&&isp.needs[k])||'—'}</td>
            <td style="font-size:13px;color:var(--muted)">${(isp.advice&&isp.advice[k])||'—'}</td>
          </tr>`).join('')}
          ${closedRows}
        </tbody>
      </table>
    </div>`;
}

function vsStrategies(isp, idx) {
  const el = document.getElementById('view-sec-strategies');
  if (!el) return;
  const hasSeating   = (isp.areas||[]).some(k => isp.seating&&isp.seating[k]);
  const hasStrategies = (isp.areas||[]).some(k => isp.strategies&&isp.strategies[k]);
  if (!hasSeating && !hasStrategies) { el.innerHTML = ''; return; }

  const seatingLines = (isp.areas||[]).map(k => {
    const seat = (isp.seating&&isp.seating[k]) || '';
    if (!seat) return '';
    return `<div style="font-size:13px;margin-bottom:3px">${seat}</div>`;
  }).filter(Boolean);

  const strategiesHTML = (isp.areas||[]).map(k => {
    const strat = (isp.strategies&&isp.strategies[k]) || '';
    if (!strat) return '';
    const color = AREA_COLOR[k];
    const bg    = AREA_BG[k] || color+'14';
    return `<div style="margin-bottom:8px;padding:10px 14px;border-radius:var(--radius);border-left:3px solid ${color};background:${bg}">
      <div style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px">${AREA_ICON[k]||''} ${AREA_LABELS[k]}</div>
      <div style="font-size:13px;line-height:1.6">${strat}</div>
    </div>`;
  }).filter(Boolean).join('');

  el.innerHTML = `
    <div class="table-card" style="margin-bottom:1.5rem">
      <div class="table-card-header">
        <h2>Strategies &amp; seating</h2>
        <button class="btn-secondary" style="font-size:12px;padding:5px 12px" onclick="editViewSection('strengths',${idx})">✏ Edit</button>
      </div>
      <div style="padding:1rem 1.25rem">
        ${seatingLines.length ? `
          <div style="background:#f4f4f4;border:1.5px solid #c0c0c0;border-radius:var(--radius);padding:10px 14px;margin-bottom:14px">
            <div style="font-size:11px;font-weight:600;color:#444;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">🪑 Seating plan advice</div>
            ${seatingLines.join('')}
          </div>` : ''}
        ${strategiesHTML ? `
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px">Key support strategies for all staff</div>
          ${strategiesHTML}` : ''}
      </div>
    </div>`;
}

function vsTargets(isp, idx) {
  const el = document.getElementById('view-sec-targets');
  if (!el) return;
  const targets = isp.targets || [];
  if (!targets.length) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="table-card" style="margin-bottom:1.5rem">
      <div class="table-card-header">
        <h2>Targets and provision</h2>
        <button class="btn-secondary" style="font-size:12px;padding:5px 12px" onclick="editViewSection('targets',${idx})">✏ Edit</button>
      </div>
      <table>
        <thead><tr><th style="width:140px">Area</th><th>Intended outcome</th><th>SMART target</th><th>Provision</th><th>Provided by / frequency</th><th>Cost</th></tr></thead>
        <tbody>
          ${targets.map((t,i) => {
            const p = (isp.provisions&&isp.provisions[i])||{};
            return `<tr>
              <td style="font-size:13px"><strong>${t.area}</strong></td>
              <td style="font-size:13px">${t.outcome}</td>
              <td style="font-size:13px">${t.smart}</td>
              <td style="font-size:13px">${p.desc||'—'}</td>
              <td style="font-size:13px">${p.by||'—'}${p.freq?'<br><em style="color:var(--muted)">'+p.freq+'</em>':''}</td>
              <td style="font-size:13px">${p.cost||'—'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function vsVoices(isp, idx) {
  const el = document.getElementById('view-sec-voices');
  if (!el) return;
  el.innerHTML = `
    <div class="table-card" style="margin-bottom:1.5rem">
      <div class="table-card-header">
        <h2>Pupil and parent / carer voice</h2>
        <button class="btn-secondary" style="font-size:12px;padding:5px 12px" onclick="editViewSection('voices',${idx})">✏ Edit</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;padding:1rem 1.25rem">
        <div class="voice-card" style="margin:0">
          <div class="voice-label"><span style="font-size:16px;line-height:1">🧒</span> Pupil voice</div>
          <p style="font-size:13px;color:var(--text)">${isp.voices&&isp.voices.pupil||'<em style="color:var(--subtle)">Not recorded.</em>'}</p>
        </div>
        <div class="voice-card" style="margin:0">
          <div class="voice-label"><span style="font-size:16px;line-height:1">👨‍👩‍👦</span> Parent / carer voice</div>
          <p style="font-size:13px;color:var(--text)">${isp.voices&&isp.voices.parent||'<em style="color:var(--subtle)">Not recorded.</em>'}</p>
        </div>
      </div>
    </div>`;
}

function getStaffForSchool(schoolName) {
  const staff = [];
  if (!schoolName) return staff;
  
  // Normalize the school name
  const normSchool = schoolName.toLowerCase()
    .replace(/^(co-op|coop)\s+(academy|academies)\s+/i, '')
    .replace(/\s+(academy|school|primary|secondary|college)$/i, '')
    .trim();
  
  if (typeof USER_ACCESS_DB !== 'undefined') {
    Object.entries(USER_ACCESS_DB).forEach(([email, academies]) => {
      if (!email) return;
      // Check if any academy matches
      const hasMatch = academies.some(ac => {
        const normAc = ac.toLowerCase()
          .replace(/^(co-op|coop)\s+(academy|academies)\s+/i, '')
          .replace(/\s+(academy|school|primary|secondary|college)$/i, '')
          .trim();
        return normSchool.includes(normAc) || normAc.includes(normSchool);
      });
      if (hasMatch) {
        const name = email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        if (!staff.includes(name)) staff.push(name);
      }
    });
  }
  
  // Ensure the current user is in the list if they are not already (in case they have access)
  if (state.user && state.user.name && !staff.includes(state.user.name)) {
    if (userHasAccessToSchoolName(schoolName)) {
      staff.push(state.user.name);
    }
  }
  
  // Add defaults if list is very short or empty
  ['SENDCo', 'Class Teacher', 'Teaching Assistant', 'Key Worker'].forEach(role => {
    if (!staff.includes(role)) staff.push(role);
  });
  
  // Sort alphabetically
  staff.sort();
  return staff;
}

function vsAPDR(isp, idx) {
  const el = document.getElementById('view-sec-apdr');
  if (!el) return;
  const apdr = isp.apdr || [];
  const targets = isp.targets || [];
  
  // Get staff for the school to autopopulate the dropdown
  const staffList = getStaffForSchool(isp.school);
  
  // Calculate default deadline date (within next term / approx 90 days from now)
  const nextTermDate = new Date();
  nextTermDate.setDate(nextTermDate.getDate() + 90);
  const defaultDeadlineVal = nextTermDate.toISOString().split('T')[0];

  const isClosed = isp.closed === true;
  let headerButtonsHTML = '';
  if (isClosed) {
    headerButtonsHTML = `<button class="btn-primary" style="background-color: var(--muted); border-color: var(--muted); font-size: 13px" onclick="confirmISPReopen(${idx})">Reopen ISP</button>`;
  } else {
    headerButtonsHTML = `
      <button class="btn-primary" style="font-size:13px" onclick="openAPDRModal(${idx})">+ Add review entry</button>
      <button id="close-isp-btn-${idx}" class="btn-danger" style="font-size:13px; background-color: var(--muted); border-color: var(--muted); color: white;" onclick="showISPCloseForm(${idx})">Close ISP</button>
    `;
  }

  el.innerHTML = `
    <div class="table-card" style="margin-bottom:1.5rem">
      <div class="table-card-header">
        <h2>APDR review record</h2>
        <div style="display:flex; gap:8px">
          ${headerButtonsHTML}
        </div>
      </div>
      
      ${isClosed ? `
      <div style="padding:1rem 1.25rem;background:#F9F9F9;border-bottom:1px solid var(--border)">
        <div class="alert-warn" style="margin-bottom:0; background:#FFF8F0; border-color:#FAC775; color:var(--amber)">
          ⚠️ <strong>This Individual Support Plan is Archived (Closed).</strong><br>
          Closed on ${isp.closedDate || '-'} by ${isp.closedBy || '-'}.<br>
          <strong>Reason / justification:</strong> ${isp.closedRationale || '-'}
        </div>
      </div>` : ''}

      <div id="isp-close-form-${idx}" style="display:none;margin: 1rem 1.25rem;padding:1rem;background:#FFF8F8;border:1px solid #F7C1C1;border-radius:var(--radius)">
        <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:10px">Close Individual Support Plan</div>
        <div class="alert-info" style="margin-bottom:12px; background: #FFF3F3; border-color: #F7C1C1; color: var(--red)">
          ℹ️ <strong>Closing this plan will archive it.</strong> This will remove it from the active lists and log a closure entry in the APDR review record.
        </div>
        <div class="field">
          <label>Justification / evidence / rationale <span style="color:var(--red)">*</span></label>
          <textarea id="isp-close-rationale-${idx}" placeholder="Describe the evidence and reasoning for closing this ISP..."></textarea>
        </div>
        <div class="row-2">
          <div class="field">
            <label>Closed by <span style="color:var(--red)">*</span></label>
            <select id="isp-close-by-${idx}">
              ${staffList.map(name => `<option value="${name}" ${name === (state.user?.name || '') ? 'selected' : ''}>${name}</option>`).join('')}
            </select>
          </div>
          <div class="field"><label>Date</label><input type="date" id="isp-close-date-${idx}" value="${new Date().toISOString().split('T')[0]}" /></div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:0.5rem">
          <button class="btn-secondary" style="font-size:13px" onclick="hideISPCloseForm(${idx})">Cancel</button>
          <button class="btn-danger" style="font-size:13px" onclick="confirmISPClose(${idx})">Confirm closure</button>
        </div>
      </div>

      ${apdr.length ? `
      <table>
        <thead><tr><th style="width:90px">Date</th><th style="width:130px">Target</th><th>Progress</th><th>School comment</th><th>Parent/carer comment</th><th>Next steps</th><th>By whom/when</th><th></th></tr></thead>
        <tbody>
          ${apdr.map((entry,ei) => {
            const isAreaClosure = entry.type === 'area-closure';
            const isIspClosure = entry.type === 'isp-closure';
            const isReopen = entry.type === 'isp-reopen';
            const isBg = isAreaClosure || isIspClosure || isReopen;

            let targetCell = '—';
            if (isAreaClosure) {
              targetCell = `<span style="font-size:11px;font-weight:700;padding:2px 7px;border-radius:10px;background:#F0F0F0;color:#888">Area closed</span><br><span style="font-size:12px">${entry.areaKey?AREA_LABELS[entry.areaKey]||entry.areaKey:''}</span>`;
            } else if (isIspClosure) {
              targetCell = `<span style="font-size:11px;font-weight:700;padding:2px 7px;border-radius:10px;background:#EAEAEA;color:#555">Plan Closed</span>`;
            } else if (isReopen) {
              targetCell = `<span style="font-size:11px;font-weight:700;padding:2px 7px;border-radius:10px;background:#E8F5E9;color:#2E7D32">Plan Reopened</span>`;
            } else {
              targetCell = (targets[entry.target]?targets[entry.target].area:'—');
            }

            let progressCell = '—';
            if (isIspClosure) {
              progressCell = `<span style="color:#777;font-weight:600">⛔ Archived</span>`;
            } else if (isReopen) {
              progressCell = `<span style="color:#2E7D32;font-weight:600">✓ Active</span>`;
            } else if (isAreaClosure) {
              progressCell = `<span style="color:#888;font-weight:600">⛔ Closed</span>`;
            } else {
              progressCell = entry.progress==='good'?'✓ Good progress':entry.progress==='some'?'→ Some progress':'⚠ Needs support';
            }

            const byWhenHTML = entry.deadline
              ? `<strong>${entry.by || '—'}</strong><br><small style="color:var(--muted)">Deadline: ${entry.deadline}</small>`
              : (entry.by || '—');

            return `<tr${isBg?' style="background:#FAFAFA"':''}>
              <td style="font-size:13px">${entry.date}</td>
              <td style="font-size:13px">${targetCell}</td>
              <td style="font-size:13px;font-weight:600">${progressCell}</td>
              <td style="font-size:13px">${entry.schoolComment||'—'}</td>
              <td style="font-size:13px">${entry.parentComment||'—'}</td>
              <td style="font-size:13px">${entry.nextSteps||'—'}</td>
              <td style="font-size:13px">${byWhenHTML}</td>
              <td><span class="action-link" style="color:var(--red);font-size:12px" onclick="deleteAPDR(${idx},${ei})">Remove</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>` : `<div style="padding:2rem;text-align:center;color:var(--muted);font-size:14px">No APDR entries yet. Add a review entry to record progress.</div>`}
    </div>
    <div id="apdr-modal" style="display:none">
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:1.5rem">
        <h2 style="font-size:18px;font-weight:700;margin-bottom:1rem">Add APDR review entry</h2>
        <div class="row-2">
          <div class="field"><label>Review date</label><input type="date" id="apdr-date" value="${new Date().toISOString().split('T')[0]}" /></div>
          <div class="field"><label>Target reviewed</label>
            <select id="apdr-target">
              ${targets.map((t,i)=>`<option value="${i}">${i+1}. ${t.area}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field"><label>Progress rating</label>
          <select id="apdr-progress">
            <option value="good">Good progress made / achieved</option>
            <option value="some">Some progress made / on track</option>
            <option value="needs">Requires additional support</option>
          </select>
        </div>
        <div class="row-2">
          <div class="field"><label>School comment</label><textarea id="apdr-school" placeholder="What progress has been made? What is working?"></textarea></div>
          <div class="field"><label>Parent / carer comment</label><textarea id="apdr-parent" placeholder="Parent/carer views on progress"></textarea></div>
        </div>
        <div class="field"><label>Next steps / additional provision</label><textarea id="apdr-next" placeholder="What happens next? Any changes to provision?"></textarea></div>
        <div class="row-2">
          <div class="field">
            <label>By whom?</label>
            <select id="apdr-by">
              ${staffList.map(name => `<option value="${name}" ${name === (state.user?.name || '') ? 'selected' : ''}>${name}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Deadline</label>
            <input type="date" id="apdr-deadline" value="${defaultDeadlineVal}" />
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px">
          <button class="btn-secondary" onclick="document.getElementById('apdr-modal').style.display='none'">Cancel</button>
          <button class="btn-primary" onclick="saveAPDR(${idx})">Save entry</button>
        </div>
      </div>
    </div>`;
}

function showISPCloseForm(idx) {
  const form = document.getElementById('isp-close-form-' + idx);
  const btn = document.getElementById('close-isp-btn-' + idx);
  if (form) form.style.display = 'block';
  if (btn) btn.style.display = 'none';
}

function hideISPCloseForm(idx) {
  const form = document.getElementById('isp-close-form-' + idx);
  const btn = document.getElementById('close-isp-btn-' + idx);
  if (form) form.style.display = 'none';
  if (btn) btn.style.display = '';
}

function confirmISPClose(idx) {
  const isp = state.isps[idx];
  if (!isp || !userHasAccessToSchoolName(isp.school)) { alert('You do not have permission to close this ISP.'); return; }
  const rationale = document.getElementById('isp-close-rationale-' + idx)?.value.trim();
  const closedBy = document.getElementById('isp-close-by-' + idx)?.value.trim();
  const closedDate = document.getElementById('isp-close-date-' + idx)?.value || new Date().toISOString().split('T')[0];

  if (!rationale) { alert('Please enter a justification for closing this ISP.'); return; }
  if (!closedBy) { alert('Please enter who is closing this ISP.'); return; }
  isp.closed = true;
  isp.closedBy = closedBy;
  isp.closedDate = closedDate;
  isp.closedRationale = rationale;

  if (!isp.apdr) isp.apdr = [];
  const displayDate = new Date(closedDate).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
  isp.apdr.push({
    date:          displayDate,
    target:        null,
    progress:      'achieved',
    schoolComment: `ISP Closed / Archived. Rationale: ${rationale}`,
    parentComment: '',
    nextSteps:     'Plan archived.',
    by:            closedBy,
    type:          'isp-closure'
  });

  isp.updated = new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
  isp.lastEdited = new Date().toISOString();
  saveISPs();
  postToSheet(isp);

  // Re-render dashboard and current view
  renderDashboard();
  renderViewScreen(isp, idx);
}

function confirmISPReopen(idx) {
  const isp = state.isps[idx];
  if (!isp || !userHasAccessToSchoolName(isp.school)) { alert('You do not have permission to reopen this ISP.'); return; }
  if (!confirm('Are you sure you want to reopen this support plan?')) return;
  isp.closed = false;
  delete isp.closedBy;
  delete isp.closedDate;
  delete isp.closedRationale;

  if (!isp.apdr) isp.apdr = [];
  const today = new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
  isp.apdr.push({
    date:          today,
    target:        null,
    progress:      'achieved',
    schoolComment: `ISP Reopened / Reactivated.`,
    parentComment: '',
    nextSteps:     'Plan set to active.',
    by:            state.user?.name || 'Staff',
    type:          'isp-reopen'
  });

  isp.updated = today;
  isp.lastEdited = new Date().toISOString();
  saveISPs();
  postToSheet(isp);

  // Re-render dashboard and current view
  renderDashboard();
  renderViewScreen(isp, idx);
}

/* ── Areas of need editing ── */
function editViewAreas(idx) {
  const isp = state.isps[idx];
  const el = document.getElementById('view-sec-overview');
  if (!el) return;
  const currentAreas = isp.areas || [];
  const allKeys = Object.keys(AREA_LABELS);
  const available = allKeys.filter(k => !currentAreas.includes(k));

  el.innerHTML = `
    <div class="table-card" style="margin-bottom:1.5rem">
      <div class="table-card-header"><h2>Areas of need — editing</h2></div>
      <div style="padding:1rem 1.25rem">
        <div class="alert-info" style="margin-bottom:1.25rem">
          ℹ️ <strong>Removing an area requires a justification.</strong> This will add a closure note to the Strengths &amp; Needs section and create an automatic APDR entry recording who closed the area, when, and why.
        </div>

        <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:10px">Current areas of need</div>
        ${currentAreas.length ? currentAreas.map(k => `
          <div id="area-row-${k}" style="margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)">
              <span style="font-size:20px;line-height:1">${AREA_ICON[k]||''}</span>
              <span style="font-size:13px;font-weight:600;flex:1;color:${AREA_COLOR[k]||'var(--text)'}">${AREA_LABELS[k]||k}</span>
              <button id="remove-btn-${k}" class="btn-danger" style="font-size:12px" onclick="showAreaRemovalForm('${k}',${idx})">Remove area</button>
            </div>
            <div id="removal-form-${k}" style="display:none;margin-top:4px;padding:1rem;background:#FFF8F8;border:1px solid #F7C1C1;border-radius:var(--radius)">
              <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:10px">Removing: ${AREA_LABELS[k]||k}</div>
              <div class="field">
                <label>Justification / evidence / rationale <span style="color:var(--red)">*</span></label>
                <textarea id="removal-rationale-${k}" placeholder="Describe the evidence and reasoning for closing this area of need — e.g. progress made, professional assessment, parental agreement..."></textarea>
              </div>
              <div class="row-2">
                <div class="field"><label>Closed by <span style="color:var(--red)">*</span></label><input type="text" id="removal-by-${k}" placeholder="e.g. Miss A Jones, SENDCo" /></div>
                <div class="field"><label>Date</label><input type="date" id="removal-date-${k}" value="${new Date().toISOString().split('T')[0]}" /></div>
              </div>
              <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:0.5rem">
                <button class="btn-secondary" style="font-size:13px" onclick="hideAreaRemovalForm('${k}')">Cancel</button>
                <button class="btn-danger" style="font-size:13px" onclick="confirmAreaRemoval('${k}',${idx})">Confirm removal</button>
              </div>
            </div>
          </div>`).join('')
          : '<p style="font-size:13px;color:var(--subtle);font-style:italic">No areas currently assigned.</p>'}

        ${available.length ? `
          <div style="margin-top:1.25rem;padding-top:1.25rem;border-top:1px solid var(--border)">
            <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px">Add an area</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${available.map(k=>`<button class="btn-secondary" style="font-size:13px;display:flex;align-items:center;gap:6px" onclick="addAreaOfNeed('${k}',${idx})"><span>${AREA_ICON[k]||''}</span> ${AREA_LABELS[k]||k}</button>`).join('')}
            </div>
          </div>` : ''}

        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--border)">
          <button class="btn-secondary" style="font-size:13px" onclick="vsOverview(state.isps[${idx}],${idx})">Done</button>
        </div>
      </div>
    </div>`;
}

function showAreaRemovalForm(key, idx) {
  const form = document.getElementById('removal-form-' + key);
  const btn  = document.getElementById('remove-btn-' + key);
  if (form) form.style.display = 'block';
  if (btn)  btn.style.display  = 'none';
}

function hideAreaRemovalForm(key) {
  const form = document.getElementById('removal-form-' + key);
  const btn  = document.getElementById('remove-btn-' + key);
  if (form) form.style.display = 'none';
  if (btn)  btn.style.display  = '';
}

function confirmAreaRemoval(key, idx) {
  const rationale  = document.getElementById('removal-rationale-' + key)?.value.trim();
  const closedBy   = document.getElementById('removal-by-' + key)?.value.trim();
  const closedDate = document.getElementById('removal-date-' + key)?.value
                     || new Date().toISOString().split('T')[0];
  if (!rationale) { alert('Please enter a justification for removing this area.'); return; }
  if (!closedBy)  { alert('Please enter who is closing this area.'); return; }

  const isp = state.isps[idx];
  isp.areas = (isp.areas||[]).filter(k => k !== key);

  if (!isp.closedAreas) isp.closedAreas = [];
  isp.closedAreas.push({ key, label: AREA_LABELS[key]||key, closedBy, closedDate, rationale });

  if (!isp.apdr) isp.apdr = [];
  const displayDate = new Date(closedDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  isp.apdr.push({
    date:          displayDate,
    target:        null,
    progress:      'achieved',
    schoolComment: `Area of need closed: ${AREA_LABELS[key]||key}. Rationale: ${rationale}`,
    parentComment: '',
    nextSteps:     'Area of need removed from ISP.',
    by:            closedBy,
    type:          'area-closure',
    areaKey:       key,
  });

  isp.updated    = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  isp.lastEdited = new Date().toISOString();
  saveISPs();
  postToSheet(isp);

  editViewAreas(idx);
  vsStrengths(isp, idx);
  vsStrategies(isp, idx);
  vsAPDR(isp, idx);
}

function addAreaOfNeed(key, idx) {
  const isp = state.isps[idx];
  if (!isp.areas) isp.areas = [];
  if (!isp.areas.includes(key)) isp.areas.push(key);
  isp.closedAreas = (isp.closedAreas||[]).filter(ca => ca.key !== key);
  isp.updated    = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  isp.lastEdited = new Date().toISOString();
  saveISPs();
  postToSheet(isp);
  editViewAreas(idx);
  vsStrengths(isp, idx);
}

function editViewSection(section, idx) {
  const isp = state.isps[idx];
  const o = isp.overview || {};
  const h = isp.health || {};

  if (section === 'overview') {
    const el = document.getElementById('view-sec-overview');
    if (!el) return;
    const areaLabels = (isp.areas||[]).map(k => AREA_LABELS[k]||k);
    el.innerHTML = `
      <div class="table-card" style="margin-bottom:1.5rem">
        <div class="table-card-header"><h2>Plan overview — editing</h2></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;padding:1rem 1.25rem">
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.75rem">Plan details</div>
            <div class="field"><label>Last reviewed</label><input type="text" id="ve-reviewed" placeholder="e.g. 14 May 2026" value="${o.reviewed||''}" /></div>
            <div class="field"><label>Attendance (%)</label><input type="text" id="ve-attendance" placeholder="e.g. 94" value="${o.attendance||''}" /></div>
            <div class="field"><label>Diagnoses</label><input type="text" id="ve-diagnoses" value="${o.diagnoses||''}" /></div>
            <div class="field"><label>Responsible staff</label><input type="text" id="ve-staff" value="${o.staff||''}" /></div>
            <div class="field"><label>External agencies</label><input type="text" id="ve-agencies" value="${o.agencies||''}" /></div>
            <div class="field"><label>SEND Status</label>
              <select id="ve-send-status">
                <option value="">Select…</option>
                <option value="K" ${senCode(isp)==='K'?'selected':''}>K (SEND Support)</option>
                <option value="K+" ${senCode(isp)==='K+'?'selected':''}>K+ (Higher SEND Support)</option>
                <option value="E" ${senCode(isp)==='E'?'selected':''}>E (EHCP)</option>
                <option value="M" ${senCode(isp)==='M'?'selected':''}>M (Monitoring)</option>
                <option value="None" ${senCode(isp)==='None'?'selected':''}>None</option>
              </select>
            </div>
            <div class="field"><label>EHCP status</label>
              <select id="ve-ehcp" onchange="handleVeEhcpStatusChange(this, ${idx})">
                <option value="">Select…</option>
                <option ${h.ehcp==='No EHCP'?'selected':''}>No EHCP</option>
                <option ${h.ehcp==='EHCP requested'?'selected':''}>EHCP requested</option>
                <option ${h.ehcp==='EHCP in place'?'selected':''}>EHCP in place</option>
                <option ${h.ehcp==='EHCP under review'?'selected':''}>EHCP under review</option>
                <option ${h.ehcp==='EHCP ceased'?'selected':''}>EHCP ceased</option>
              </select>
              <input type="file" id="ve-pdf-upload" accept=".pdf,application/pdf" style="display:none" onchange="handleVePdfUpload(this, ${idx})" />
            </div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.75rem">Student summary</div>
            <div class="field"><textarea id="ve-summary" style="min-height:140px">${isp.summary||''}</textarea></div>
            <div style="margin-top:8px">
              <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Development areas</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">${areaLabels.map(a=>`<span class="badge badge-blue" style="font-size:11px">${a}</span>`).join('')}</div>
              <div class="hint" style="margin-top:6px">To change development areas, use the full ISP wizard.</div>
            </div>
            <div style="margin-top:12px">
              <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Risk / alert flags</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${RISK_FLAGS.map(f => {
                  const sel = (isp.riskFlags || []).includes(f.key);
                  const RED = '#c0392b';
                  return `<button class="chip risk-chip ${sel?'selected':''}" data-flag="${f.key}" onclick="toggleRiskChip(this)" style="font-size:12px;${sel?'background:'+RED+'18;border-color:'+RED+';color:'+RED:''}">${f.icon} ${f.label}</button>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;padding:0 1.25rem 1rem">
          <button class="btn-secondary" style="font-size:13px" onclick="vsOverview(state.isps[${idx}],${idx})">Cancel</button>
          <button class="btn-primary" style="font-size:13px" onclick="saveViewSection('overview',${idx})">Save changes</button>
        </div>
      </div>`;

  } else if (section === 'health') {
    const el = document.getElementById('view-sec-health');
    if (!el) return;
    el.innerHTML = `
      <div class="table-card" style="margin-bottom:1.5rem">
        <div class="table-card-header"><h2>Health, care and wellbeing — editing</h2></div>
        <div style="padding:1rem 1.25rem">
          <div class="field"><label>Health / wellbeing notes</label>
            <textarea id="ve-health" placeholder="Include diagnoses, medication, ongoing clinical reviews, therapies...">${h.health||''}</textarea>
          </div>
          <div class="field"><label>Social care / community services</label>
            <textarea id="ve-social" placeholder="e.g. Child in Need, Direct Payments, Early Help...">${h.social||''}</textarea>
          </div>
          <div class="field"><label>Relevant document links</label>
            <input type="text" id="ve-links" value="${h.links||''}" placeholder="Paste a Google Docs URL or describe the document" />
            <div class="hint">💡 Paste a Google Docs or Drive URL to link directly to a shared document.</div>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:0.5rem">
            <button class="btn-secondary" style="font-size:13px" onclick="vsHealth(state.isps[${idx}],${idx})">Cancel</button>
            <button class="btn-primary" style="font-size:13px" onclick="saveViewSection('health',${idx})">Save changes</button>
          </div>
        </div>
      </div>`;

  } else if (section === 'strengths') {
    const el = document.getElementById('view-sec-strengths');
    if (!el) return;
    el.innerHTML = `
      <div class="table-card" style="margin-bottom:1.5rem">
        <div class="table-card-header"><h2>Strengths, needs and barriers — editing</h2></div>
        <div style="padding:1rem 1.25rem">
          ${(isp.areas||[]).map(k => `
            <div style="margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid var(--border)">
              <div style="font-size:13px;font-weight:700;color:var(--teal);margin-bottom:0.75rem">${AREA_LABELS[k]||k}</div>
              <div class="row-3">
                <div class="field"><label>Strengths</label><textarea id="ve-str-${k}" style="min-height:80px">${(isp.strengths&&isp.strengths[k])||''}</textarea></div>
                <div class="field"><label>Needs / barriers</label><textarea id="ve-need-${k}" style="min-height:80px">${(isp.needs&&isp.needs[k])||''}</textarea></div>
                <div class="field"><label>Specialist advice</label><textarea id="ve-adv-${k}" style="min-height:80px">${(isp.advice&&isp.advice[k])||''}</textarea></div>
              </div>
            </div>`).join('')}
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn-secondary" style="font-size:13px" onclick="vsStrengths(state.isps[${idx}],${idx});vsStrategies(state.isps[${idx}],${idx})">Cancel</button>
            <button class="btn-primary" style="font-size:13px" onclick="saveViewSection('strengths',${idx})">Save changes</button>
          </div>
        </div>
      </div>`;

  } else if (section === 'targets') {
    const el = document.getElementById('view-sec-targets');
    if (!el) return;
    const targets = isp.targets || [];
    el.innerHTML = `
      <div class="table-card" style="margin-bottom:1.5rem">
        <div class="table-card-header"><h2>Targets and provision — editing</h2></div>
        <div style="padding:1rem 1.25rem">
          ${targets.map((t, i) => {
            const p = (isp.provisions&&isp.provisions[i])||{};
            return `
            <div style="margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid var(--border)">
              <div style="font-size:13px;font-weight:700;color:var(--teal);margin-bottom:0.75rem">${i+1}. ${t.area}</div>
              <div class="field"><label>Intended outcome</label><textarea id="ve-outcome-${i}" style="min-height:60px">${t.outcome||''}</textarea></div>
              <div class="field"><label>SMART target</label><textarea id="ve-smart-${i}" style="min-height:90px">${t.smart||''}</textarea></div>
              <div class="field"><label>Provision / intervention</label><textarea id="ve-pvdesc-${i}" style="min-height:70px">${p.desc||''}</textarea></div>
              <div class="row-3">
                <div class="field"><label>Provided by</label><input type="text" id="ve-pvby-${i}" value="${p.by||''}" /></div>
                <div class="field"><label>Frequency</label><input type="text" id="ve-pvfreq-${i}" value="${p.freq||''}" /></div>
                <div class="field"><label>Cost</label><input type="text" id="ve-pvcost-${i}" value="${p.cost||''}" /></div>
              </div>
            </div>`;
          }).join('')}
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn-secondary" style="font-size:13px" onclick="vsTargets(state.isps[${idx}],${idx})">Cancel</button>
            <button class="btn-primary" style="font-size:13px" onclick="saveViewSection('targets',${idx})">Save changes</button>
          </div>
        </div>
      </div>`;

  } else if (section === 'voices') {
    const el = document.getElementById('view-sec-voices');
    if (!el) return;
    const v = isp.voices || {};
    el.innerHTML = `
      <div class="table-card" style="margin-bottom:1.5rem">
        <div class="table-card-header"><h2>Voices — editing</h2></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;padding:1rem 1.25rem">
          <div class="field">
            <label><span style="font-size:15px">🧒</span> Pupil voice</label>
            <textarea id="ve-pupil" style="min-height:100px">${v.pupil||''}</textarea>
          </div>
          <div class="field">
            <label><span style="font-size:15px">👨‍👩‍👦</span> Parent / carer voice</label>
            <textarea id="ve-parent" style="min-height:100px">${v.parent||''}</textarea>
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;padding:0 1.25rem 1rem">
          <button class="btn-secondary" style="font-size:13px" onclick="vsVoices(state.isps[${idx}],${idx})">Cancel</button>
          <button class="btn-primary" style="font-size:13px" onclick="saveViewSection('voices',${idx})">Save changes</button>
        </div>
      </div>`;
  }
}

function saveViewSection(section, idx) {
  const isp = state.isps[idx];
  const gv = id => { const e=document.getElementById(id); return e?e.value.trim():''; };
  const today = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});

  if (section === 'overview') {
    if (!isp.overview) isp.overview = {};
    if (!isp.health) isp.health = {};
    isp.overview.reviewed   = parseDateToISO(gv('ve-reviewed')) || gv('ve-reviewed');
    isp.overview.attendance = gv('ve-attendance');
    isp.overview.diagnoses  = gv('ve-diagnoses');
    isp.overview.staff      = gv('ve-staff');
    isp.staff               = isp.overview.staff;
    isp.overview.agencies   = gv('ve-agencies');
    isp.health.ehcp         = gv('ve-ehcp');
    isp.summary             = gv('ve-summary');
    
    // Save SEND Status
    const sendStatusVal = gv('ve-send-status');
    isp.level = sendStatusVal;
    isp.overview.level = sendStatusVal;

    // Save selected risk flags from the edit form
    const container = document.getElementById('view-sec-overview');
    if (container) {
      isp.riskFlags = Array.from(container.querySelectorAll('.risk-chip.selected')).map(c => c.dataset.flag);
    }
  } else if (section === 'health') {
    if (!isp.health) isp.health = {};
    isp.health.health = gv('ve-health');
    isp.health.social = gv('ve-social');
    isp.health.links  = gv('ve-links');
  } else if (section === 'strengths') {
    if (!isp.strengths) isp.strengths = {};
    if (!isp.needs) isp.needs = {};
    if (!isp.advice) isp.advice = {};
    (isp.areas||[]).forEach(k => {
      isp.strengths[k] = gv('ve-str-'+k);
      isp.needs[k]     = gv('ve-need-'+k);
      isp.advice[k]    = gv('ve-adv-'+k);
    });
  } else if (section === 'targets') {
    if (!isp.provisions) isp.provisions = {};
    (isp.targets||[]).forEach((t, i) => {
      t.outcome = gv('ve-outcome-'+i);
      t.smart   = gv('ve-smart-'+i);
      isp.provisions[i] = {
        desc: gv('ve-pvdesc-'+i),
        by:   gv('ve-pvby-'+i),
        freq: gv('ve-pvfreq-'+i),
        cost: gv('ve-pvcost-'+i),
      };
    });
  } else if (section === 'voices') {
    if (!isp.voices) isp.voices = {};
    isp.voices.pupil   = gv('ve-pupil');
    isp.voices.parent  = gv('ve-parent');
  }
  isp.updated = today;
  isp.lastEdited = new Date().toISOString();
  saveISPs();
  postToSheet(isp);
  renderViewScreen(isp, idx);
}

function openAPDRModal(idx) {
  const modal = document.getElementById('apdr-modal');
  if (modal) { modal.style.display='block'; modal.scrollIntoView({behavior:'smooth'}); }
}

function saveAPDR(idx) {
  const isp = state.isps[idx];
  if (!isp.apdr) isp.apdr = [];

  const schoolComment = document.getElementById('apdr-school')?.value.trim() || '';
  const nextSteps     = document.getElementById('apdr-next')?.value.trim() || '';
  if (!schoolComment && !nextSteps) {
    alert('Please enter at least a school comment or next steps before saving this review entry.');
    return;
  }

  const dateInputVal = document.getElementById('apdr-date')?.value || '';
  let formattedDate = dateInputVal;
  if (dateInputVal && dateInputVal.includes('-')) {
    const parts = dateInputVal.split('-');
    if (parts.length === 3) {
      const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(dObj.getTime())) {
        formattedDate = dObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
  }

  const deadlineInputVal = document.getElementById('apdr-deadline')?.value || '';
  let formattedDeadline = deadlineInputVal;
  if (deadlineInputVal && deadlineInputVal.includes('-')) {
    const parts = deadlineInputVal.split('-');
    if (parts.length === 3) {
      const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(dObj.getTime())) {
        formattedDeadline = dObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
  }

  isp.apdr.push({
    date:          formattedDate,
    target:        parseInt(document.getElementById('apdr-target')?.value || '0'),
    progress:      document.getElementById('apdr-progress')?.value || 'some',
    schoolComment: schoolComment,
    parentComment: document.getElementById('apdr-parent')?.value || '',
    nextSteps:     nextSteps,
    by:            document.getElementById('apdr-by')?.value || '',
    deadline:      formattedDeadline,
  });

  if (!isp.overview) isp.overview = {};
  isp.overview.reviewed = dateInputVal || new Date().toISOString().split('T')[0];

  isp.updated = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  isp.lastEdited = new Date().toISOString();
  saveISPs();
  postToSheet(isp);
  renderViewScreen(isp, idx);
}

function deleteAPDR(ispIdx, apdrIdx) {
  if (!confirm('Remove this APDR entry?')) return;
  state.isps[ispIdx].apdr.splice(apdrIdx, 1);
  saveISPs();
  postToSheet(state.isps[ispIdx]);
  renderViewScreen(state.isps[ispIdx], ispIdx);
}

/* ── Edit existing ISP ── */
function editISP(idx) {
  const isp = state.isps[idx];
  state.student = {
    arborId:  isp.arborId,
    fname:    isp.name.split(' ')[0],
    lname:    isp.name.split(' ').slice(1).join(' '),
    fullName: isp.name,
    dob:      isp.dob || '',
    year:     isp.year || '',
    form:     isp.form || '',
    school:   isp.school || '',
    gender:   isp.gender || '',
  };
  state.formData = {
    overview:      { level: isp.level || isp.overview?.level || senCode(isp), ...isp.overview },
    summary:       isp.summary || '',
    areas:         [...(isp.areas||[])],
    strengths:     { ...(isp.strengths||{}) },
    needs:         { ...(isp.needs||{}) },
    advice:        { ...(isp.advice||{}) },
    strategies:    { ...(isp.strategies||{}) },
    seating:       { ...(isp.seating||{}) },
    riskFlags:     [...(isp.riskFlags||[])],
    health:        { ...(isp.health||{}) },
    targets:       JSON.parse(JSON.stringify(isp.targets||[])),
    editedTargets: { ...(isp.editedTargets||{}) },
    provisions:    JSON.parse(JSON.stringify(isp.provisions||{})),
    voices:        { ...(isp.voices||{pupil:'',parent:''}) },
  };
  state.editingIdx = idx;
  state.step = 0;
  document.getElementById('isp-topbar-name').textContent = `Edit ISP — ${isp.name}`;
  renderStep();
  showScreen('screen-isp');
}

/* ── Finalise / Save ISP (new or edit) ── */
function finaliseISP() {
  let savedIdx;
  if (state.editingIdx !== undefined && state.editingIdx !== null) {
    const idx = state.editingIdx;
    const o = state.formData.overview;
    const fd = state.formData;
    const today = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    const nowISO = new Date().toISOString();
    const existing = state.isps[idx];
    const wasClosed = existing.closed === true;
    Object.assign(existing, {
      name:    state.student.fullName,
      arborId: state.student.arborId,
      year:    state.student.year || existing.year,
      form:    state.student.form || existing.form,
      school:  state.student.school || existing.school,
      gender:  state.student.gender || existing.gender,
      dob:     state.student.dob || existing.dob,
      level:   o.level !== undefined ? o.level : existing.level,
      areas:   fd.areas,
      staff:   o.staff || existing.staff,
      updated: today,
      lastEdited: nowISO,
      overview:  { ...o },
      mis:       fd.mis ? { ...fd.mis } : (existing.mis || {}),
      summary:   fd.summary || '',
      strengths: { ...fd.strengths },
      needs:     { ...fd.needs },
      advice:    { ...fd.advice },
      strategies:{ ...fd.strategies },
      seating:   { ...fd.seating },
      riskFlags: [...(fd.riskFlags||[])],
      health:    { ...fd.health },
      targets:   fd.targets.map((t,i) => ({ ...t, smart: fd.editedTargets[i]!==undefined ? fd.editedTargets[i] : t.smart })),
      editedTargets: { ...fd.editedTargets },
      provisions: JSON.parse(JSON.stringify(fd.provisions)),
      voices:    { ...fd.voices },
      closed:    false
    });
    if (wasClosed) {
      if (!existing.apdr) existing.apdr = [];
      existing.apdr.push({
        date:          today,
        target:        null,
        progress:      'achieved',
        schoolComment: `ISP reopened / reactivated via edits saved.`,
        parentComment: '',
        nextSteps:     'Plan set to active.',
        by:            o.staff || state.user?.name || 'Staff',
        type:          'isp-reopen'
      });
      delete existing.closedBy;
      delete existing.closedDate;
      delete existing.closedRationale;
    }
    saveISPs();
    postToSheet(state.isps[idx]);
    savedIdx = idx;
    state.editingIdx = null;
  } else {
    const o = state.formData.overview;
    const today = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    const nowISO = new Date().toISOString();
    const id = 'isp-' + Date.now();
    const fd = state.formData;
    const record = {
      id, name: state.student.fullName, arborId: state.student.arborId,
      year: state.student.year||'—', form: state.student.form||'', school: state.student.school||'—',
      gender: state.student.gender||'', dob: state.student.dob||'',
      level: o.level !== undefined ? o.level : 'Targeted', areas: fd.areas, staff: o.staff||'—', updated: today,
      lastEdited: nowISO,
      overview: { ...o }, mis: fd.mis ? { ...fd.mis } : {}, summary: fd.summary||'',
      strengths: { ...fd.strengths }, needs: { ...fd.needs }, advice: { ...fd.advice },
      strategies:{ ...fd.strategies }, seating: { ...fd.seating }, riskFlags: [...(fd.riskFlags||[])],
      health: { ...fd.health },
      targets: fd.targets.map((t,i)=>({ ...t, smart: fd.editedTargets[i]!==undefined?fd.editedTargets[i]:t.smart })),
      editedTargets: { ...fd.editedTargets },
      provisions: JSON.parse(JSON.stringify(fd.provisions)),
      voices: { ...fd.voices }, apdr: [],
    };
    state.isps.unshift(record);
    saveISPs();
    postToSheet(state.isps[0]);
    savedIdx = 0;
  }
  // Show preview of the saved ISP
  state.previewIdx = savedIdx;
  renderISPPreview(savedIdx);
  showScreen('screen-complete');
}

function renderISPPreview(idx) {
  const isp = state.isps[idx];
  const o   = isp.overview || {};
  const h   = isp.health   || {};
  const targets = (isp.targets||[]);
  const apdr    = (isp.apdr||[]);
  const areaLabels = (isp.areas||[]).map(k => AREA_LABELS[k]||k);
  const riskFlags = isp.riskFlags || [];

  // Update topbar
  const tn = document.getElementById('prev-topbar-name');
  const pt = document.getElementById('prev-title');
  if (tn) tn.textContent = `ISP — ${isp.name}`;
  if (pt) pt.textContent = `Individual Support Plan — ${isp.name}`;

  // Update user bar
  if (state.user) {
    const a = document.getElementById('comp-av'), n = document.getElementById('comp-name-bar');
    if (a) a.textContent = state.user.initials;
    if (n) n.textContent = state.user.name;
  }

  const preview = document.getElementById('isp-preview-content');
  if (!preview) return;

  /* ── ONE-PAGE TEACHER SUMMARY ── */
  const riskFlagHTML = riskFlags.length
    ? RISK_FLAGS.filter(f => riskFlags.includes(f.key)).map(f =>
        `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:var(--radius);border:1.5px solid #c0c0c0;background:#f5f5f5;margin-bottom:6px;position:relative">
          <span style="font-size:18px;filter:grayscale(1)">${f.icon}</span>
          <span style="font-size:13px;font-weight:700;color:#444">${f.label}</span>
          <span style="position:absolute;top:7px;right:12px;font-size:18px;font-weight:900;color:#D32F2F;line-height:1" title="Risk alert">&#9888;</span>
        </div>`).join('')
    : '<div style="font-size:13px;color:var(--muted);font-style:italic">No risk flags recorded.</div>';

  const areaIconsHTML = (isp.areas||[]).map(k => {
    const color = AREA_COLOR[k] || '#555';
    const bg    = AREA_BG[k]    || color+'14';
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 14px;border-radius:var(--radius);background:${bg};border:1.5px solid ${color}50;min-width:90px">
      <span style="font-size:22px;line-height:1">${AREA_ICON[k]||'●'}</span>
      <span style="font-size:11px;font-weight:700;color:${color};text-align:center;line-height:1.3">${AREA_LABELS[k]}</span>
    </div>`;
  }).join('');

  // Collect strategies only (no seating here — seating is in its own box below)
  const strategiesHTML = (isp.areas||[]).map(k => {
    const strat = (isp.strategies&&isp.strategies[k]) || '';
    if (!strat) return '';
    const color = AREA_COLOR[k];
    const bg    = AREA_BG[k] || color+'14';
    return `<div style="margin-bottom:10px;padding:10px 14px;border-radius:var(--radius);border-left:3px solid ${color};background:${bg}">
      <div style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px">${AREA_ICON[k]||''} ${AREA_LABELS[k]}</div>
      <div style="font-size:13px">${strat}</div>
    </div>`;
  }).filter(Boolean).join('');

  // Seating — one line per area that has advice
  const seatingLines = (isp.areas||[]).map(k => {
    const seat = (isp.seating&&isp.seating[k]) || '';
    if (!seat) return '';
    return `<div style="font-size:13px;margin-bottom:3px"><span style="font-weight:700;color:#666"><span style="filter:grayscale(1)">${AREA_ICON[k]||''}</span> ${AREA_LABELS[k]}:</span> ${seat}</div>`;
  }).filter(Boolean);
  const seatingMaster = seatingLines.length
    ? seatingLines.join('')
    : '<div style="font-size:13px;color:var(--muted);font-style:italic">No specific seating advice recorded.</div>';

  preview.innerHTML = `
    <!-- ══ ONE-PAGE TEACHER SUMMARY ══ -->
    <div style="background:var(--surface);border:2px solid var(--teal);border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:1.5rem;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#0F6E56,#1D9E75,#378ADD,#D4537E,#D85A30)"></div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:1.25rem">
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">${isp.school||'—'} · Teacher Summary</div>
          <div style="font-size:22px;font-weight:800;margin-bottom:3px">${isp.name}</div>
          <div style="font-size:13px;color:var(--muted)">UPN <strong>${isp.arborId}</strong> · ${isp.year} ${isp.form} · DOB: ${isp.dob||'—'} · ${isp.gender||'—'}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <span style="font-size:12px;color:var(--muted)">Staff: ${o.staff||'—'}</span>
          <span style="font-size:12px;color:var(--muted)">Attendance: ${o.attendance||'—'}%</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem">
        <!-- Areas of need -->
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px">Areas of need</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">${areaIconsHTML||'<span style="font-size:13px;color:var(--muted)">None recorded.</span>'}</div>
        </div>
        <!-- Risk flags -->
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px">Risk / alert flags</div>
          ${riskFlagHTML}
        </div>
      </div>

      <!-- Seating -->
      <div style="background:#f4f4f4;border:1.5px solid #c0c0c0;border-radius:var(--radius);padding:10px 14px;margin-bottom:1rem">
        <div style="font-size:11px;font-weight:700;color:#444;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px">🪑 Seating plan advice</div>
        <div style="font-size:13px;color:var(--text)">${seatingMaster}</div>
      </div>

      <!-- Key strategies -->
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px">Key support strategies for all staff</div>
        ${strategiesHTML || '<div style="font-size:13px;color:var(--muted);font-style:italic">No strategies recorded yet.</div>'}
      </div>

      ${isp.summary ? `<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border);font-size:13px;color:var(--muted);line-height:1.6"><strong style="color:var(--text)">Student summary:</strong> ${isp.summary}</div>` : ''}

      <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border);display:flex;justify-content:space-between;font-size:11px;color:var(--subtle)">
        <span>ISP created: ${o.created||'—'} · Last reviewed: ${o.reviewed||'No review yet'}</span>
        <span>This summary is for staff use. Full ISP below.</span>
      </div>
    </div>

    <!-- ══ FULL ISP BELOW ══ -->
    <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:1rem;padding-left:2px">Full Individual Support Plan</div>

    <!-- Header panel -->
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.5rem 1.75rem;margin-bottom:1.25rem;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">${isp.school||'—'}</div>
        <div style="font-size:24px;font-weight:700;margin-bottom:4px">${isp.name}</div>
        <div style="font-size:14px;color:var(--muted)">UPN: <strong>${isp.arborId}</strong> &nbsp;·&nbsp; ${isp.year} ${isp.form} &nbsp;·&nbsp; DOB: ${isp.dob||'—'} &nbsp;·&nbsp; Gender: ${isp.gender||'—'}</div>
      </div>
    </div>

    <!-- Two-column meta -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem 1.5rem">
        <div style="font-size:13px;font-weight:700;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border)">Plan details</div>
        ${[['Created',o.created||'—'],['Last reviewed',o.reviewed||'—'],['Attendance',o.attendance?o.attendance+'%':'—'],['EHCP',h.ehcp||'—'],['Responsible staff',o.staff||'—'],['Agencies',o.agencies||'—']].map(([k,v])=>`<div style="display:flex;gap:6px;margin-bottom:5px;font-size:13px"><span style="color:var(--muted);font-weight:600;min-width:140px">${k}</span><span>${v}</span></div>`).join('')}
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem 1.5rem">
        <div style="font-size:13px;font-weight:700;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border)">Diagnoses &amp; social care</div>
        ${[['Diagnoses',o.diagnoses||'—'],['Social care',h.social||'—'],['Health notes',h.health||'—']].map(([k,v])=>`<div style="display:flex;gap:6px;margin-bottom:5px;font-size:13px"><span style="color:var(--muted);font-weight:600;min-width:140px">${k}</span><span>${v}</span></div>`).join('')}
        ${isp.summary ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:13px;color:var(--muted);line-height:1.6">${isp.summary}</div>` : ''}
      </div>
    </div>

    <!-- Areas -->
    ${isp.areas&&isp.areas.length ? `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);margin-bottom:1.25rem;overflow:hidden">
      <div style="padding:1rem 1.5rem;border-bottom:1px solid var(--border);font-size:14px;font-weight:700">💡 Strengths, needs and barriers to learning</div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:var(--bg)">
          <th style="padding:9px 1.25rem;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;text-align:left;border-bottom:1px solid var(--border);width:160px">Area</th>
          <th style="padding:9px 1.25rem;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;text-align:left;border-bottom:1px solid var(--border)">Strengths</th>
          <th style="padding:9px 1.25rem;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;text-align:left;border-bottom:1px solid var(--border)">Needs / barriers</th>
          <th style="padding:9px 1.25rem;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;text-align:left;border-bottom:1px solid var(--border)">Specialist advice</th>
        </tr></thead>
        <tbody>
          ${(isp.areas||[]).map(k=>`<tr style="border-bottom:1px solid var(--border)">
            <td style="padding:10px 1.25rem;vertical-align:top;font-size:13px;font-weight:600;white-space:nowrap">${AREA_ICON[k]||''} ${AREA_LABELS[k]||k}</td>
            <td style="padding:10px 1.25rem;font-size:13px;vertical-align:top">${(isp.strengths&&isp.strengths[k])||'—'}</td>
            <td style="padding:10px 1.25rem;font-size:13px;vertical-align:top">${(isp.needs&&isp.needs[k])||'—'}</td>
            <td style="padding:10px 1.25rem;font-size:13px;vertical-align:top;color:var(--muted)">${(isp.advice&&isp.advice[k])||'—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <!-- Targets & provision -->
    ${targets.length ? `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);margin-bottom:1.25rem;overflow:hidden">
      <div style="padding:1rem 1.5rem;border-bottom:1px solid var(--border);font-size:14px;font-weight:700">🎯 Targeted support — intended outcomes and provision</div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:var(--bg)">
          ${['Area','Intended outcome','SMART target','Provision','Provided by / frequency','Cost'].map(h=>`<th style="padding:9px 1rem;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;text-align:left;border-bottom:1px solid var(--border)">${h}</th>`).join('')}
        </tr></thead>
        <tbody>
          ${targets.map((t,i)=>{
            const p=(isp.provisions&&isp.provisions[i])||{};
            return `<tr style="border-bottom:1px solid var(--border)">
              <td style="padding:10px 1rem;font-size:13px;font-weight:600;vertical-align:top;white-space:nowrap">${AREA_ICON[isp.areas?.find(k=>AREA_LABELS[k]===t.area)||'']||''} ${t.area}</td>
              <td style="padding:10px 1rem;font-size:13px;vertical-align:top">${t.outcome}</td>
              <td style="padding:10px 1rem;font-size:13px;vertical-align:top;color:var(--muted)">${t.smart}</td>
              <td style="padding:10px 1rem;font-size:13px;vertical-align:top">${p.desc||'—'}</td>
              <td style="padding:10px 1rem;font-size:13px;vertical-align:top">${p.by||'—'}${p.freq?'<br><span style="color:var(--muted);font-size:12px">'+p.freq+'</span>':''}</td>
              <td style="padding:10px 1rem;font-size:13px;vertical-align:top;white-space:nowrap">${p.cost||'—'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <!-- Voices -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem 1.5rem">
        <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;display:flex;align-items:center;gap:6px"><span style="font-size:16px;line-height:1">🧒</span>Pupil voice</div>
        <p style="font-size:13px;line-height:1.7;color:var(--text)">${(isp.voices&&isp.voices.pupil)||'<em style="color:var(--subtle)">Not recorded.</em>'}</p>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem 1.5rem">
        <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;display:flex;align-items:center;gap:6px"><span style="font-size:16px;line-height:1">👨‍👩‍👦</span>Parent / carer voice</div>
        <p style="font-size:13px;line-height:1.7;color:var(--text)">${(isp.voices&&isp.voices.parent)||'<em style="color:var(--subtle)">Not recorded.</em>'}</p>
      </div>
    </div>

    <!-- APDR (if any) -->
    ${apdr.length ? `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);margin-bottom:1.25rem;overflow:hidden">
      <div style="padding:1rem 1.5rem;border-bottom:1px solid var(--border);font-size:14px;font-weight:700">📋 APDR review record</div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:var(--bg)">
          ${['Date','Target area','Progress','School comment','Parent/carer comment','Next steps','By/when'].map(h=>`<th style="padding:9px 1rem;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;text-align:left;border-bottom:1px solid var(--border)">${h}</th>`).join('')}
        </tr></thead>
        <tbody>
          ${apdr.map(e=>`<tr style="border-bottom:1px solid var(--border)">
            <td style="padding:9px 1rem;font-size:13px;white-space:nowrap">${e.date}</td>
            <td style="padding:9px 1rem;font-size:13px">${targets[e.target]?targets[e.target].area:'—'}</td>
            <td style="padding:9px 1rem;font-size:13px;font-weight:600">${e.progress==='good'?'✓ Good progress':e.progress==='some'?'→ Some progress':'⚠ Needs support'}</td>
            <td style="padding:9px 1rem;font-size:13px">${e.schoolComment||'—'}</td>
            <td style="padding:9px 1rem;font-size:13px">${e.parentComment||'—'}</td>
            <td style="padding:9px 1rem;font-size:13px">${e.nextSteps||'—'}</td>
            <td style="padding:9px 1rem;font-size:13px">
              <strong>${e.by||'—'}</strong>
              ${e.deadline ? `<br><small style="color:var(--muted)">Deadline: ${e.deadline}</small>` : ''}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <!-- Signatures -->
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem 1.5rem;margin-bottom:1.25rem">
      <div style="font-size:13px;font-weight:700;margin-bottom:1rem;padding-bottom:8px;border-bottom:1px solid var(--border)">✍️ Signatures and review</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem">
        ${[['SENDCo',o.staff||''],['Parent / carer',''],['Pupil',''],['Next review date','']].map(([label,sub])=>`
          <div style="border:1px solid var(--border);border-radius:var(--radius);padding:1rem">
            <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:28px">${label}</div>
            <div style="border-bottom:1px solid var(--border-mid);margin-bottom:6px"></div>
            ${sub?`<div style="font-size:11px;color:var(--muted)">${sub}</div>`:''}
          </div>`).join('')}
      </div>
    </div>`;
}

/* ── MIS summary block — shared between ISP view and PDF ── */
function misSummaryBlock(mis, forPDF) {
  if (!mis) return '';
  const hasAny = mis.attThis || mis.susThis || mis.bp || mis.intEx;
  if (!hasAny) return '';

  function normAtt(v) {
    const n = parseFloat(v);
    if (isNaN(n)) return null;
    return n > 0 && n <= 1 ? Math.round(n*1000)/10 : Math.round(n*10)/10;
  }
  const attThisN = normAtt(mis.attThis);
  const attLastN = normAtt(mis.attLast);
  const attDelta = (attThisN !== null && attLastN !== null) ? (attThisN - attLastN) : null;
  const fmtAtt   = n => n !== null ? n.toFixed(1)+'%' : '—';
  const attDeltaStr = attDelta !== null ? (attDelta >= 0 ? `+${attDelta.toFixed(1)}%` : `${attDelta.toFixed(1)}%`) : '';
  const attDeltaCol = attDelta !== null ? (attDelta >= 0 ? '#27ae60' : '#c0392b') : '#888';

  const susThisN = parseFloat(mis.susThis);
  const susLastN = parseFloat(mis.susLast);
  const susDiff  = (!isNaN(susThisN) && !isNaN(susLastN)) ? (susThisN - susLastN) : null;
  const susDiffStr = susDiff !== null ? (susDiff >= 0 ? `+${susDiff}` : `${susDiff}`) + ' day' + (Math.abs(susDiff)!==1?'s':'') : '';
  const susDiffCol = susDiff !== null ? (susDiff > 0 ? '#c0392b' : '#27ae60') : '#888';

  const bpNum   = parseFloat(mis.bp);
  const bpColor = isNaN(bpNum) ? '#555' : bpNum < 0 ? '#c0392b' : '#27ae60';

  const fsVal   = forPDF ? '13px' : '22px';
  const fsArrow = forPDF ? '10px' : '12px';
  const fsChip  = forPDF ? '9px'  : '13px';
  const fsSub   = forPDF ? '8px'  : '10px';
  const chipPad = forPDF ? '1px 5px' : '3px 10px';
  const gapSub  = forPDF ? '20px' : '46px';

  function arrow() { return `<span style="color:#ccc;font-size:${fsArrow};margin:0 4px">→</span>`; }
  function bigVal(v, col) { return `<span style="font-size:${fsVal};font-weight:800;color:${col||'#333'}">${v}</span>`; }
  const arrowHtml = arrow();
  function deltaChip(str, col) {
    if (!str) return '';
    return `<span style="font-size:${fsChip};font-weight:700;color:${col};background:${col}15;border:1px solid ${col}35;border-radius:20px;padding:${chipPad};white-space:nowrap">${str}</span>`;
  }

  const bpDisplay = (mis.bp !== '' && mis.bp != null) ? (bpNum >= 0 ? `+${mis.bp}` : mis.bp) : null;

  const attContent = attThisN !== null ? `
    <div>
      <div style="display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:nowrap">
        ${attLastN !== null ? `<span style="font-size:${fsVal};font-weight:800;color:#bbb">${fmtAtt(attLastN)}</span>${arrowHtml}` : ''}
        <span style="font-size:${fsVal};font-weight:800;color:#333">${fmtAtt(attThisN)}</span>
        ${attDeltaStr ? deltaChip(attDeltaStr, attDeltaCol) : ''}
      </div>
      ${attLastN !== null ? `<div style="display:flex;justify-content:center;gap:${gapSub};margin-top:4px"><span style="font-size:${fsSub};color:#666">Last term</span><span style="font-size:${fsSub};color:#666">This term</span></div>` : `<div style="font-size:${fsSub};color:#666;margin-top:4px">Attendance</div>`}
    </div>` : `<div>
      <div style="font-size:${forPDF?'11px':'13px'};color:#888;font-style:italic">No data</div>
      <div style="font-size:${fsSub};color:#666;margin-top:4px">Attendance</div>
    </div>`;

  const susContent = (mis.susThis !== '' && mis.susThis != null) ? `
    <div>
      <div style="display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:nowrap">
        ${!isNaN(susLastN) ? `<span style="font-size:${fsVal};font-weight:800;color:#bbb">${mis.susLast}</span>${arrowHtml}` : ''}
        <span style="font-size:${fsVal};font-weight:800;color:#333">${mis.susThis}</span>
        ${susDiffStr ? deltaChip(susDiffStr, susDiffCol) : ''}
      </div>
      ${!isNaN(susLastN) ? `<div style="display:flex;justify-content:center;gap:${gapSub};margin-top:4px"><span style="font-size:${fsSub};color:#666">Last year</span><span style="font-size:${fsSub};color:#666">This year</span></div>` : `<div style="font-size:${fsSub};color:#666;margin-top:4px">Suspensions</div>`}
    </div>` : `<div>
      <div style="font-size:${forPDF?'11px':'13px'};color:#888;font-style:italic">No data</div>
      <div style="font-size:${fsSub};color:#666;margin-top:4px">Suspensions</div>
    </div>`;

  const bpContent = bpDisplay
    ? `<div>
        <div>${bigVal(bpDisplay, bpColor)}</div>
        <div style="font-size:${fsSub};color:#666;margin-top:4px">Behaviour points</div>
      </div>`
    : `<div>
        <div style="font-size:${forPDF?'11px':'13px'};color:#888;font-style:italic">No data</div>
        <div style="font-size:${fsSub};color:#666;margin-top:4px">Behaviour points</div>
      </div>`;

  const intExContent = mis.intEx
    ? `<div>
        <div>${bigVal(mis.intEx, '#e67e22')}</div>
        <div style="font-size:${fsSub};color:#666;margin-top:4px">Internal exclusions</div>
      </div>`
    : `<div>
        <div style="font-size:${forPDF?'11px':'13px'};color:#888;font-style:italic">No data</div>
        <div style="font-size:${fsSub};color:#666;margin-top:4px">Internal exclusions</div>
      </div>`;

  if (forPDF) {
    function pdfCard(title, content) {
      return `<div style="border:1px solid #ccc;border-radius:6px;padding:12px 8px;background:#ffffff;text-align:center;height:68px;box-sizing:border-box;overflow:hidden;line-height:1.2">
        <div style="font-size:9px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.03em;margin-bottom:5px;white-space:nowrap;text-overflow:ellipsis">${title}</div>
        ${content}
      </div>`;
    }

    return `
      <div style="margin-bottom:12px">
        <table style="width:100%;border-collapse:collapse;table-layout:fixed">
          <tr>
            <td style="width:29%;padding:0 6px 0 0;vertical-align:top">
              ${pdfCard('Attendance', attContent)}
            </td>
            <td style="width:29%;padding:0 6px;vertical-align:top">
              ${pdfCard('Suspensions', susContent)}
            </td>
            <td style="width:21%;padding:0 6px;vertical-align:top">
              ${pdfCard('Behaviour Points', bpContent)}
            </td>
            <td style="width:21%;padding:0 0 0 6px;vertical-align:top">
              ${pdfCard('Internal Exclusions', intExContent)}
            </td>
          </tr>
        </table>
      </div>`;
  }

  // ISP view — 2×2 card grid
  function misCard(title, content) {
    return `<div style="border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;background:var(--surface);text-align:center">
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:10px">${title}</div>
      ${content}
    </div>`;
  }

  return `
    <div>
      <div style="display:grid;grid-template-columns:1.3fr 1.3fr 0.95fr 0.95fr;gap:12px">
        ${misCard('Attendance', attContent)}
        ${misCard('Suspensions', susContent)}
        ${misCard('Behaviour Points', bpContent)}
        ${misCard('Internal Exclusions', intExContent)}
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════════════════════
   GRADUATED RESPONSE — functions
═══════════════════════════════════════════════════════════════════ */

// Case-insensitive column lookup across the sheet student object.
// Tries each name as an exact match (case-insensitive), then as a substring match.
function sheetVal(s, ...names) {
  if (!s) return '';
  const keys = Object.keys(s);
  for (const name of names) {
    const nl = name.toLowerCase();
    const exact = keys.find(k => k.toLowerCase() === nl);
    if (exact !== undefined && s[exact] !== '' && s[exact] !== null && s[exact] !== undefined) return String(s[exact]);
  }
  for (const name of names) {
    const nl = name.toLowerCase();
    const partial = keys.find(k => k.toLowerCase().includes(nl));
    if (partial !== undefined && s[partial] !== '' && s[partial] !== null && s[partial] !== undefined) return String(s[partial]);
  }
  return '';
}

// Returns the preferred unique key for a sheet student row: UPN first, Arbor ID as fallback
function studentKey(s) {
  return String(s['UPN'] || s['Arbor ID'] || '');
}

// Find a sheet student by matching the stored id (UPN or Arbor ID, either works)
function findSheetStudent(idVal) {
  // Search in sheet students first
  const sid = String(idVal);
  const fromSheet = (state.sheetStudents || []).find(x =>
    (x._id && x._id === sid) || String(x['Arbor ID']) === sid || String(x['UPN']) === sid
  );
  if (fromSheet) return fromSheet;

  // Fallback: search in ARBOR_DB when offline
  const s = ARBOR_DB[String(idVal)];
  if (s) {
    return {
      'Arbor ID': idVal,
      'Pupil Name': s.fullName,
      'NC Year': s.year,
      'Form': s.form,
      'UPN': idVal,
      'Sex': s.gender,
      'Date of Birth': s.dob || '',
      'School': s.school,
      'Attendance': s.attendance || '',
      'SEN Status': s.diagnoses ? 'K' : '',
      'FSM': 'No',
      'PP': 'No',
      'EAL': 'No',
      'Lead Responsible': 'Miss A Jones'
    };
  }
  return null;
}


/* ── PDF generation (existing ISP) ── */
function downloadExistingPDF(idx) {
  openPDFWindow(buildISPPDF(state.isps[idx]), state.isps[idx].name);
}

function buildISPPDF(src) {
  const CPDF = AREA_COLOR;
  const o = src.overview || {};
  const h = src.health || {};
  const targets = (src.targets||[]).map((t,i) => ({ ...t, provision: (src.provisions&&src.provisions[i])||{} }));
  const apdr = src.apdr || [];

  const riskFlagsHtml = (src.riskFlags||[]).length
    ? RISK_FLAGS.filter(f=>(src.riskFlags||[]).includes(f.key)).map(f=>
        `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;padding:4px 8px;border-radius:4px;border:1px solid #c0c0c0;background:#f5f5f5;position:relative">
          <span style="filter:grayscale(1);font-size:13px">${f.icon}</span>
          <span style="font-size:10px;font-weight:700;color:#444">${f.label}</span>
          <span style="position:absolute;top:3px;right:7px;font-size:14px;font-weight:900;color:#D32F2F;line-height:1">&#9888;</span>
        </div>`
      ).join('')
    : '<span style="font-size:10px;color:#999;font-style:italic">None recorded</span>';

  const areaChipsHtml = (src.areas||[]).map(k => {
    const c = CPDF[k]||'#555';
    const bg = AREA_BG[k]||c+'12';
    return `<div style="display:inline-flex;flex-direction:column;align-items:center;gap:3px;padding:8px 12px;border-radius:5px;border:1.5px solid ${c}55;background:${bg};margin:0 5px 5px 0;min-width:72px;text-align:center;vertical-align:top">
      <span style="font-size:20px;line-height:1">${AREA_ICON[k]||'●'}</span>
      <span style="font-size:9px;font-weight:700;color:${c};line-height:1.2">${AREA_LABELS[k]||k}</span>
    </div>`;
  }).join('');

  const strategiesHtml = (src.areas||[]).map(k => {
    const strat = (src.strategies&&src.strategies[k])||''; if (!strat) return '';
    const c = CPDF[k]||'#555';
    const bg = AREA_BG[k]||c+'08';
    return `<div style="margin-bottom:8px;padding:7px 10px;border-left:3px solid ${c};background:${bg}"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:${c};margin-bottom:3px">${AREA_ICON[k]||''} ${AREA_LABELS[k]||k}</div><div style="font-size:11px">${strat}</div></div>`;
  }).filter(Boolean).join('') || '<p style="font-size:11px;color:#999;font-style:italic">No strategies recorded.</p>';

  const seatingHtml = (src.areas||[]).map(k => {
    const seat = (src.seating&&src.seating[k])||''; if (!seat) return '';
    const c = CPDF[k]||'#555';
    return `<div style="font-size:11px;margin-bottom:3px">${seat}</div>`;
  }).filter(Boolean).join('') || '<p style="font-size:11px;color:#999;font-style:italic">No specific seating advice recorded.</p>';

  const th = (txt, w) => `<th style="padding:6px 8px;background:#0F6E56;color:white;text-align:left;font-size:11px;border:1px solid #0a5040${w?';width:'+w:''}">${txt}</th>`;
  const td = (txt, extra) => `<td style="padding:5px 8px;border:1px solid #ccc;vertical-align:top;font-size:11px${extra?';'+extra:''}">${txt}</td>`;

  return `
    <!-- PAGE 1: TEACHER SUMMARY — no page break inside -->
    <div style="page-break-after:always;page-break-inside:avoid">
      <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
        <tr style="background:#0F6E56">
          <td style="padding:12px 16px;color:white">
            <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.06em;opacity:0.8;margin-bottom:3px">${src.school||'School'} — Teacher Summary — Confidential</div>
            <div style="font-size:20px;font-weight:800;margin-bottom:2px">${src.name}</div>
            <div style="font-size:11px;opacity:0.85">Arbor ${src.arborId} &nbsp;·&nbsp; ${src.year} ${src.form} &nbsp;·&nbsp; DOB: ${src.dob||'—'} &nbsp;·&nbsp; ${src.gender||'—'}</div>
          </td>
          <td style="padding:12px 16px;color:white;text-align:right;vertical-align:top;white-space:nowrap">
            <div style="font-size:11px">Staff: ${o.staff||'—'}</div>
            <div style="font-size:11px">Attendance: ${o.attendance||'—'}%</div>
          </td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
        <tr>
          <td style="width:50%;vertical-align:top;padding-right:12px">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#666;margin-bottom:6px">Areas of need</div>
            ${areaChipsHtml||'<span style="font-size:11px;color:#999">None recorded</span>'}
          </td>
          <td style="width:50%;vertical-align:top;padding-left:12px;border-left:1px solid #e5e5e5">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#666;margin-bottom:6px">Risk / alert flags</div>
            ${riskFlagsHtml}
          </td>
        </tr>
      </table>
      <div style="background:#ffffff;border:1px solid #ccc;border-radius:4px;padding:8px 12px;margin-bottom:12px">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#444;margin-bottom:5px">🪑 Seating plan advice</div>
        ${seatingHtml}
      </div>
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#666;margin-bottom:6px">Key support strategies for all staff</div>
      ${strategiesHtml}
      ${src.summary?`<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e5e5;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #e5e5e5;font-size:11px;color:#444;line-height:1.5"><strong>Student summary:</strong> ${src.summary}</div>`:''}
      ${(()=>{ const mis = buildMISForView(src); return mis ? misSummaryBlock(mis, true) : ''; })()}
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid #e5e5e5;display:flex;justify-content:space-between;font-size:9px;color:#999">
        <span>ISP created: ${o.created||'—'} · Last reviewed: ${o.reviewed||'—'}</span>
        <span>Confidential — for authorised staff only · Do not leave unattended</span>
      </div>
    </div>

    <!-- PAGES 2+: FULL ISP -->
    <h1 style="color:#0F6E56;font-size:18px;margin:0 0 4px">Individual Support Plan</h1>
    <p style="color:#666;font-size:11px;margin:0 0 16px">${src.school||'School'} &nbsp;·&nbsp; ${src.name} &nbsp;·&nbsp; UPN: ${src.arborId}</p>

    <div style="page-break-inside:avoid">
      <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
        <tr>${th('Pupil details','')}<th colspan="3" style="padding:6px 8px;background:#0F6E56;color:white;border:1px solid #0a5040"></th></tr>
        <tr>${td('<strong>Name</strong>','width:20%')}${td(src.name)}${td('<strong>UPN</strong>','width:18%')}${td(src.arborId)}</tr>
        <tr>${td('<strong>Date of birth</strong>')}${td(src.dob||'—')}${td('<strong>Year / form</strong>')}${td((src.year||'—')+' '+(src.form||''))}</tr>
        <tr>${td('<strong>School</strong>')}${td(src.school||'—')}${td('<strong>Gender</strong>')}${td(src.gender||'—')}</tr>
        <tr>${td('<strong>Diagnoses</strong>')}<td colspan="3" style="padding:5px 8px;border:1px solid #ccc;font-size:11px">${o.diagnoses||'—'}</td></tr>
        <tr>${td('<strong>Attendance</strong>')}${td((o.attendance||'—')+'%')}${td('<strong>EHCP</strong>')}${td(h.ehcp||'—')}</tr>
        <tr>${td('<strong>Responsible staff</strong>')}${td(o.staff||'—')}${td('<strong>Agencies</strong>')}${td(o.agencies||'—')}</tr>
        <tr>${td('<strong>Created</strong>')}${td(o.created||'—')}${td('<strong>Last reviewed</strong>')}${td(o.reviewed||'—')}</tr>
      </table>
    </div>

    ${(()=>{ const mis = buildMISForView(src); return mis ? `<div style="page-break-inside:avoid;margin-bottom:14px">${misSummaryBlock(mis, true)}</div>` : ''; })()}

    ${src.areas&&src.areas.length?`<div style="page-break-inside:avoid;margin-bottom:14px">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#666;margin-bottom:6px">Areas of need</div>
      <div>${(src.areas||[]).map(k=>{const c=CPDF[k]||'#555';const bg=AREA_BG[k]||c+'10';return`<div style="display:inline-flex;flex-direction:column;align-items:center;gap:3px;padding:7px 11px;border-radius:4px;border:1.5px solid ${c}55;background:${bg};margin:0 5px 5px 0;min-width:68px;text-align:center;vertical-align:top"><span style="font-size:18px;line-height:1">${AREA_ICON[k]||'●'}</span><span style="font-size:9px;font-weight:700;color:${c};line-height:1.2">${AREA_LABELS[k]||k}</span></div>`;}).join('')}</div>
    </div>`:''}

    ${src.summary?`<div style="page-break-inside:avoid"><table style="width:100%;border-collapse:collapse;margin-bottom:14px"><tr>${th('Student summary','')}</tr><tr><td style="padding:8px;border:1px solid #ccc;font-size:11px;line-height:1.5">${src.summary}</td></tr></table></div>`:''}

    ${src.areas&&src.areas.length?`<div style="page-break-inside:avoid"><table style="width:100%;border-collapse:collapse;margin-bottom:14px">
      <tr>${th('Area','160px')}${th('Strengths','')}${th('Needs / barriers','')}${th('Specialist advice','')}</tr>
      ${src.areas.map(k=>`<tr>${td('<strong>'+( AREA_LABELS[k]||k)+'</strong>')}${td((src.strengths&&src.strengths[k])||'—')}${td((src.needs&&src.needs[k])||'—')}${td((src.advice&&src.advice[k])||'—','color:#555')}</tr>`).join('')}
    </table></div>`:''}

    ${(h.health||h.social)?`<div style="page-break-inside:avoid"><table style="width:100%;border-collapse:collapse;margin-bottom:14px">
      <tr>${th('Health, care and wellbeing','')}<th style="padding:6px 8px;background:#0F6E56;border:1px solid #0a5040"></th></tr>
      <tr>${td('<strong>Health / wellbeing notes</strong><br><br>'+(h.health||'—'),'width:50%')}${td('<strong>Social care / community services</strong><br><br>'+(h.social||'—'))}</tr>
      ${h.links?`<tr><td colspan="2" style="padding:5px 8px;border:1px solid #ccc;font-size:11px"><strong>Document links:</strong> ${h.links}</td></tr>`:''}
    </table></div>`:''}

    ${targets.length?`<table style="width:100%;border-collapse:collapse;margin-bottom:14px">
      <tr>${th('Area','120px')}${th('Intended outcome','')}${th('SMART target','')}${th('Provision','')}${th('By / frequency','')}${th('Cost','70px')}</tr>
      ${targets.map(t=>`<tr style="page-break-inside:avoid">${td('<strong>'+t.area+'</strong>')}${td(t.outcome||'—')}${td(t.smart||'—')}${td(t.provision.desc||'—')}${td((t.provision.by||'—')+(t.provision.freq?'<br>'+t.provision.freq:''))}${td(t.provision.cost||'—')}</tr>`).join('')}
    </table>`:''}

    <div style="page-break-inside:avoid"><table style="width:100%;border-collapse:collapse;margin-bottom:14px">
      <tr>${th('Voices','')}<th style="padding:6px 8px;background:#0F6E56;border:1px solid #0a5040"></th></tr>
      <tr>${td('<strong>🧒 Pupil voice</strong><br><br>'+((src.voices&&src.voices.pupil)||'Not recorded.'),'width:50%')}${td('<strong>👨‍👩‍👦 Parent / carer voice</strong><br><br>'+((src.voices&&src.voices.parent)||'Not recorded.'))}</tr>
    </table></div>

    ${apdr.length?`<table style="width:100%;border-collapse:collapse;margin-bottom:14px">
      <tr>${['Date','Area','Progress','School comment','Parent/carer','Next steps','By/when'].map(t=>th(t,'')).join('')}</tr>
      ${apdr.map(e=>`<tr style="page-break-inside:avoid">
        ${td(e.date)}
        ${td((src.targets&&src.targets[e.target])?src.targets[e.target].area:'—')}
        ${td(e.progress==='good'?'Good progress':e.progress==='some'?'Some progress':'Needs support')}
        ${td(e.schoolComment||'—')}${td(e.parentComment||'—')}${td(e.nextSteps||'—')}${td((e.by||'—')+(e.deadline?'<br><small style="color:#666">Deadline: '+e.deadline+'</small>':''))}
      </tr>`).join('')}
    </table>`:''}

    <div style="page-break-inside:avoid"><table style="width:100%;border-collapse:collapse;margin-bottom:14px">
      <tr>${th('Signatures and review','')}<th colspan="3" style="padding:6px 8px;background:#0F6E56;border:1px solid #0a5040"></th></tr>
      <tr>
        ${td('SENDCo signature<br><br><br>_____________________<br><small style="color:#666">'+(o.staff||'')+'</small>')}
        ${td('Parent / carer signature<br><br><br>_____________________')}
        ${td('Pupil signature<br><br><br>_____________________')}
        ${td('Next review date<br><br><br>_____________________')}
      </tr>
    </table></div>`;
}
