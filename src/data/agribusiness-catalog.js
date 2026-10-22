// Ported from the original AREAdvising index.html (var declarations converted to named
// exports; values are unchanged — this is graduation-requirement data, treat any edit
// as a curriculum change that needs advisor sign-off, not a code-style change).

// Display categories used for the color-coded course chips.
export const CATEGORIES = {
  orientation: { label: "Orientation", color: "#7C2D12" },
  comm: { label: "Comm & Tech", color: "#0369A1" },
  math: { label: "Math Sciences", color: "#6D28D9" },
  natsci: { label: "Natural Sciences", color: "#4D7C0F" },
  dept: { label: "Dept Core", color: "#CC0000" },
  restricted: { label: "Tech / Dept Elec", color: "#0F766E" },
  gep: { label: "GEP", color: "#1D4ED8" },
  free: { label: "Free Elective", color: "#57534E" }
};

// Degree-audit section number -> default category (fallback when a course has no more
// specific mapping). Audit section context beats a generic code lookup.
export const AUDIT_SECTION_TO_CAT = {
  '1': 'orientation', '2': 'comm', '3': 'math', '4': 'natsci',
  '5': 'dept', '6': 'restricted', '8': 'gep', '20': 'free', '99': 'free'
};

// Degree-audit section numbers that count as "in the degree" for classification purposes
// (used by classifyAuditItems in the audit-core module).
export const DEGREE_SECTIONS = { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '8': 1, '20': 1 };

// section -> subHeader -> display tag, for section 8 (GEP) and section 6 (electives) rows.
export function sectionSubHeaderTag(section, subHeader) {
  var s = String(section || ''), sh = String(subHeader || '');
  if (s === '8') {
    if (sh === '10') return 'ENG 101 / Writing GEP';
    if (sh === '20') return 'Humanities GEP';
    if (sh === '30') return 'Social Science GEP';
    if (sh === '40') return 'HES Fitness GEP';
    if (sh === '50') return 'HES Activity GEP';
    if (sh === '60') return 'Interdisciplinary GEP';
    if (sh === '70') return 'GEP Elective';
    if (sh === '80') return 'GEP Global Knowledge (verify)';
    if (sh === '90') return 'American Democracy (verify)';
    if (sh === '100') return 'World Language (verify)';
    return 'GEP';
  }
  if (s === '6') {
    if (sh === '10') return 'Technical Elective';
    if (sh === '20') return 'Dept/Tech Elective';
    return 'Restricted Elective';
  }
  if (s === '20') return 'Free Elective';
  return '';
}

// Hard prerequisites: course -> list of prerequisite course-codes (alt-form strings, see
// PREREQ_ALT below for the equivalence groups these strings belong to).
export const PREREQS = {
  "ARE 336": ["ARE 201", "EC/ARE 301"],
  "EC/ARE 301": ["ARE 201", "MA 121/131/141"],
  "ARE 433": ["ARE 201", "EC/ARE 301"],
  "ARE 303/304": ["ARE 201"],
  "ARE 311/312": ["ARE 201"],
  "ARE 321/323/BUS 320": ["ARE 201"],
  "ARE 306/309": ["ARE 201"],
  "MA 114": ["MA 121/131/141"],
  "MA 114, 231 or 241": ["MA 121/131/141"],
  "ARE Elective (ARE 3XX or ARE 4XX)": ["ARE 201"],
  "ARE 4XX": ["ARE 201"]
};

// Soft (recommended-ordering) prerequisites. A violation still allows the move but shows a
// friendlier "take this early" message instead of "advisor review needed".
export const SOFT_PREREQS = {
  "MA 114": ["MA 121/131/141"],
  "MA 114, 231 or 241": ["MA 121/131/141"]
};

// Equivalence groups: every one of these code-strings is considered "the same slot" when
// checking prerequisite satisfaction (e.g. a student who took ARE 301 satisfies a
// EC/ARE 301 prerequisite).
export const PREREQ_ALT = {
  "ARE 201": ["ARE 201", "EC 201", "ARE 201 or EC 201"],
  "EC/ARE 301": ["EC/ARE 301", "EC 301", "ARE 301", "ARE 301 or EC 301"],
  "MA 121/131/141": ["MA 121/131/141", "MA 121", "MA 131", "MA 141"],
  "ARE 303/304": ["ARE 303/304", "ARE 303", "ARE 304"],
  "ARE 311/312": ["ARE 311/312", "ARE 311", "ARE 312"],
  "ARE 321/323/BUS 320": ["ARE 321/323/BUS 320", "ARE 321", "ARE 323", "BUS 320"],
  "ARE 306/309": ["ARE 306/309", "ARE 306", "ARE 309"]
};

// DEFAULT_PLAN-slot-id -> the "combined" label used only by the prereq checker's altForms()
// lookup (so a slot like {id:"MA121", code:"MA 121/131/141"} resolves correctly against
// PREREQS/PREREQ_ALT keyed by the long combined string).
export const SLOT_ID_TO_COMBINED_LABEL = {
  "MA121": "MA 121/131/141", "MATH2": "MA 114 or ST 311", "ST311": "ST 311 or MA 114",
  "COM112": "COM 112/211/226 or ENG 332", "ARE306": "ARE 306/309", "ARE303": "ARE 303/304",
  "ARE312": "ARE 311/312", "ARE321": "ARE 321/323/BUS 320", "BIO": "BIO 105/106/181 or PB 200",
  "MEA": "Natural Science Elective (4 cr)", "NATSCI1": "Natural Science Elective (3 cr)",
  "IDS201": "Interdisc Perspectives"
};

// Direct course-code -> internal "slot id" used to match an audit row straight to a
// DEFAULT_PLAN slot without going through the picker lists below.
export const CODE_TO_SLOT = {
  'USC 101': 'ALS103', 'ARE 290': 'ALS103', 'ALS 103': 'ALS103', 'ALS 303': 'ALS103',
  'COM 110': 'COM110', 'COM 112': 'COM112', 'COM 211': 'COM112', 'COM 226': 'COM112', 'ENG 332': 'COM112',
  'AEE 226': 'AEE226', 'CSC 200': 'AEE226',
  'MA 121': 'MA121', 'MA 131': 'MA121', 'MA 141': 'MA121',
  'MA 114': 'MATH2', 'MA 231': 'MATH2', 'MA 241': 'MATH2',
  'ST 311': 'ST311', 'ST 350': 'ST311', 'BUS 350': 'ST311',
  'BIO 105': 'BIO', 'BIO 106': 'BIO', 'BIO 181': 'BIO', 'BIO 183': 'BIO', 'PB 200': 'BIO',
  'MEA 100': 'MEA', 'CH 100': 'MEA', 'PY 131': 'MEA', 'PY 205': 'MEA', 'PY 211': 'MEA',
  'MEA 101': 'MEA', 'MEA 110': 'MEA', 'CH 101': 'NATSCI1', 'CH 201': 'NATSCI1', 'MEA 130': 'NATSCI1', 'MEA 200': 'NATSCI1',
  'CH 102': 'NATSCI1', 'CH 202': 'NATSCI1', 'PY 206': 'MEA',
  'ARE 201': 'ARE201', 'EC 201': 'ARE201',
  'EC 202': 'EC202', 'ACC 210': 'ACC210',
  'ARE 303': 'ARE303', 'ARE 304': 'ARE303',
  'ARE 306': 'ARE306', 'ARE 309': 'ARE306',
  'ARE 311': 'ARE312', 'ARE 312': 'ARE312',
  'ARE 321': 'ARE321', 'ARE 323': 'ARE321', 'BUS 320': 'ARE321',
  'EC 301': 'EC301', 'ARE 301': 'EC301',
  'ARE 433': 'ARE433', 'ARE 490': 'ARE490', 'ARE 336': 'ARE336',
  'ENG 101': 'ENG101', 'SIP 112': 'IDS201',
  'HESF 101': 'HESF1', 'HESF 102': 'HESF1', 'HESF 103': 'HESF1', 'HESF 104': 'HESF1',
  'HEST 269': 'HESF1', 'HEST 267': 'HESF2', 'HESO 257': 'HESF2', 'HESS 245': 'HESF2',
  'HESF 201': 'HESF2', 'HESF 202': 'HESF2', 'HESF 203': 'HESF2',
  'USC 102': 'ALS103', 'E 101': 'ALS103'
};

// Credit hours for courses whose credit count isn't the department default (3). Anything
// not listed here defaults to 3 via getCourseCredits() below.
export const COURSE_CREDITS = {
  'ENG 101': 4, 'MEA 100': 4, 'MEA 135': 1, 'CH 102': 1, 'PY 212': 1,
  'USC 101': 1, 'USC 102': 1, 'E 115': 1, 'E 101': 1, 'E 102': 2, 'ALS 103': 1, 'ALS 303': 1, 'ARE 490': 1,
  'CS 214': 1, 'ANS 151': 1, 'SIP 112': 2, 'AGI 101': 1, 'ST 308': 1, 'MEA 110': 1,
  'BIO 181': 4, 'BIO 183': 4, 'PB 200': 4, 'CH 101': 3, 'CH 201': 4, 'MA 141': 4, 'MA 241': 4,
  'MEA 101': 3, 'MEA 130': 3, 'PY 131': 4, 'PY 205': 3, 'PY 206': 1, 'PY 211': 4,
  'BIO 105': 4, 'BIO 106': 4, 'DSA 295': 1, 'AS 122': 1, 'AS 201': 1,
  'HESF 101': 1, 'HEST 269': 1, 'HEST 267': 1, 'HESO 257': 1, 'HESS 245': 1,
  'FLS 100': 0, 'WLSP 100': 0, 'LAT 100': 0
};

export function getCourseCredits(code) {
  return COURSE_CREDITS[code] || 3;
}

// Credit-load planning thresholds used when auto-placing a picked/unplaced course into a
// semester (target 15, allow up to 17 without warning, hard-allow up to 18).
export const TARGET_LOAD = 15;
export const SOFT_MAX = 17;
export const HARD_MAX = 18;

// Total credits required to graduate (used by "What-If" scenario planning and the natural
// science credit-gap reconciliation).
export const TOTAL_DEGREE_CREDITS = 120;

// Natural Sciences (audit section 4) total credits required — see
// calculateNaturalScienceCreditGap in the audit-core module.
export const NATURAL_SCIENCE_CREDITS_REQUIRED = 11;

// ---- "Pickable" course lists (the dashed-border chips let a student choose any course from
// the matching group below). Keyed by the `picker` id used on a DEFAULT_PLAN slot. ----

export const HUM_COURSES = [
  { g: "AFS", courses: [{ c: "AFS 240", n: "African Civilization" }, { c: "AFS 241", n: "Intro to African American Studies" }, { c: "AFS 248", n: "Survey of African-American Lit" }, { c: "AFS 275", n: "Intro History South & East Africa" }, { c: "AFS 276", n: "Intro History West Africa" }, { c: "AFS 342", n: "Intro to the African Diaspora" }, { c: "AFS 343", n: "African American Religions" }, { c: "AFS 346", n: "Black Popular Culture" }, { c: "AFS 372", n: "African-American Hist Through Civil War" }, { c: "AFS 373", n: "African-American Hist Since 1865" }, { c: "AFS 442", n: "Issues in the African Diaspora" }, { c: "AFS 448", n: "African-American Literature" }, { c: "AFS 455", n: "History of the Civil Rights Movement" }, { c: "AFS 470", n: "The Red Record & Birth of a Nation" }] },
  { g: "COM", courses: [{ c: "COM 211", n: "Argumentation and Advocacy" }, { c: "COM 289", n: "Science Communication" }, { c: "COM 371", n: "Great Speakers & Speeches" }, { c: "COM 395", n: "Studies in Rhetoric & Digital Media" }] },
  { g: "ENG", courses: [{ c: "ENG 206", n: "Studies In Drama" }, { c: "ENG 207", n: "Studies in Poetry" }, { c: "ENG 208", n: "Studies In Fiction" }, { c: "ENG 209", n: "Intro to Shakespeare" }, { c: "ENG 219", n: "Great Works Non-Western Lit" }, { c: "ENG 220", n: "Great Works Western Lit" }, { c: "ENG 221", n: "Lit of the Western World I" }, { c: "ENG 222", n: "Lit of the Western World II" }, { c: "ENG 232", n: "Literature and Medicine" }, { c: "ENG 246", n: "Literature of the Holocaust" }, { c: "ENG 248", n: "Survey of African-American Lit" }, { c: "ENG 249", n: "Native American Literature" }, { c: "ENG 251", n: "Major British Writers" }, { c: "ENG 252", n: "Major American Writers" }, { c: "ENG 261", n: "English Literature I" }, { c: "ENG 262", n: "English Literature II" }, { c: "ENG 265", n: "American Literature I" }, { c: "ENG 266", n: "American Literature II" }, { c: "ENG 282", n: "Introduction to Film" }, { c: "ENG 305", n: "Women and Literature" }, { c: "ENG 326", n: "History of the English Language" }, { c: "ENG 339", n: "Literature and Technology" }, { c: "ENG 340", n: "Literature, Art, and Society" }, { c: "ENG 341", n: "Literature and Science" }, { c: "ENG 370", n: "American Fiction 20th C" }, { c: "ENG 377", n: "Fantasy" }, { c: "ENG 380", n: "Modern Drama" }, { c: "ENG 392", n: "Major World Author" }, { c: "ENG 399", n: "Contemporary Literature" }, { c: "ENG 420", n: "Major American Authors" }, { c: "ENG 448", n: "African-American Literature" }, { c: "ENG 476", n: "Southern Literature" }] },
  { g: "HI", courses: [{ c: "HI 207", n: "Ancient Mediterranean World" }, { c: "HI 208", n: "The Middle Ages" }, { c: "HI 209", n: "Renaissance to Revolution" }, { c: "HI 210", n: "Modern Europe 1815-Present" }, { c: "HI 253", n: "Early U.S. History" }, { c: "HI 254", n: "Modern U.S. History" }, { c: "HI 263", n: "Asian Civilizations to 1800" }, { c: "HI 264", n: "Modern Asia 1800-Present" }, { c: "HI 270", n: "Modern Middle East" }, { c: "HI 305", n: "Frauds & Mysteries of the Past" }, { c: "HI 320", n: "Religion in American History" }, { c: "HI 324", n: "History of Common Law" }, { c: "HI 332", n: "Germany and the World Wars" }, { c: "HI 335", n: "The World at War" }, { c: "HI 340", n: "History of Agriculture" }, { c: "HI 342", n: "Global Environmental History" }, { c: "HI 345", n: "American Popular Culture" }, { c: "HI 350", n: "American Military History" }, { c: "HI 354", n: "Rise of the American Empire" }, { c: "HI 360", n: "U.S. Agricultural History" }, { c: "HI 361", n: "Global History American Food" }, { c: "HI 364", n: "History of North Carolina" }, { c: "HI 365", n: "The American West" }, { c: "HI 366", n: "Native American History" }, { c: "HI 372", n: "African-American Hist Through Civil War" }, { c: "HI 373", n: "African-American Hist Since 1865" }, { c: "HI 382", n: "History of Capitalism in America" }, { c: "HI 455", n: "History Civil Rights Movement" }] },
  { g: "PHI", courses: [{ c: "PHI 205", n: "Introduction to Philosophy" }, { c: "PHI 210", n: "Puzzles and Paradoxes" }, { c: "PHI 212", n: "Ethical Problems in the Law" }, { c: "PHI 214", n: "Issues in Business Ethics" }, { c: "PHI 221", n: "Contemporary Moral Issues" }, { c: "PHI 227", n: "Data Ethics" }, { c: "PHI 300", n: "Ancient Philosophy" }, { c: "PHI 305", n: "Philosophy of Religion" }, { c: "PHI 309", n: "Political Philosophy" }, { c: "PHI 310", n: "Existentialism" }, { c: "PHI 312", n: "Philosophy of Law" }, { c: "PHI 325", n: "Bio-Medical Ethics" }, { c: "PHI 340", n: "Philosophy of Science" }, { c: "PHI 375", n: "Ethics" }, { c: "PHI 425", n: "Intro to Cognitive Science" }] },
  { g: "REL", courses: [{ c: "REL 200", n: "Intro to the Study of Religion" }, { c: "REL 210", n: "Religious Traditions of the World" }, { c: "REL 220", n: "Religion in the Contemporary World" }, { c: "REL 230", n: "Asian Religions" }, { c: "REL 240", n: "Religion and Popular Culture" }, { c: "REL 311", n: "Intro to the Old Testament" }, { c: "REL 312", n: "Intro to the New Testament" }, { c: "REL 317", n: "Christianity" }, { c: "REL 320", n: "Religion in American History" }, { c: "REL 331", n: "The Hindu Tradition" }, { c: "REL 332", n: "The Buddhist Traditions" }, { c: "REL 340", n: "Islam" }, { c: "REL 350", n: "Judaism" }] },
  { g: "PS", courses: [{ c: "PS 361", n: "Intro to Political Theory" }, { c: "PS 362", n: "American Political Thought" }] },
  { g: "WGS", courses: [{ c: "WGS 200", n: "Intro to Women's & Gender Studies" }, { c: "WGS 305", n: "Women and Literature" }, { c: "WGS 390", n: "Queer Theory" }] },
  { g: "FL/WL", courses: [{ c: "WL 210", n: "Global Literature and Culture" }, { c: "WL 219", n: "Great Works Non-Western Lit" }, { c: "WL 220", n: "Great Works Western Lit" }, { c: "WLCL 210", n: "Classical Mythology" }, { c: "WLCL 222", n: "Ancient Roots of American Democracy" }, { c: "WLSP 340", n: "Intro Hispanic Lit & Cultures" }] },
  { g: "Other", courses: [{ c: "HA 201", n: "History of Art: Caves to Renaissance" }, { c: "HA 202", n: "History of Art: Renaissance to 20th C" }, { c: "MUS 105", n: "Intro to Music in Western Society" }, { c: "MUS 206", n: "America's Music" }, { c: "MUS 260", n: "History of Jazz" }, { c: "THE 103", n: "Introduction to the Theatre" }, { c: "ID 244", n: "History of Industrial Design" }, { c: "HSS 201", n: "Critical Thinking in American Life" }, { c: "HUM 295", n: "Humanities Special Topics" }] }
];

export const SOCSCI_COURSES = [
  { g: "PSY", courses: [{ c: "PSY 200", n: "Introduction to Psychology" }, { c: "PSY 208", n: "Psychobiology of Success" }, { c: "PSY 311", n: "Social Psychology" }, { c: "PSY 376", n: "Developmental Psychology" }, { c: "PSY 406", n: "Psychology of Gender" }, { c: "PSY 441", n: "Environmental Psychology" }, { c: "PSY 442", n: "Psychology and Law" }] },
  { g: "SOC", courses: [{ c: "SOC 202", n: "Principles of Sociology" }, { c: "SOC 203", n: "Current Social Problems" }, { c: "SOC 204", n: "Sociology of Family" }, { c: "SOC 205", n: "Jobs and Work" }, { c: "SOC 206", n: "Social Deviance" }, { c: "SOC 212", n: "Race in America" }, { c: "SOC 241", n: "Sociology of Ag & Rural Society" }, { c: "SOC 304", n: "Gender and Society" }, { c: "SOC 305", n: "Racial and Ethnic Relations" }, { c: "SOC 306", n: "Criminology" }, { c: "SOC 350", n: "Food and Society" }] },
  { g: "PS", courses: [{ c: "PS 201", n: "American Politics and Government" }, { c: "PS 202", n: "State and Local Government" }, { c: "PS 231", n: "Intro to International Relations" }, { c: "PS 236", n: "Issues in Global Politics" }, { c: "PS 301", n: "The Presidency and Congress" }, { c: "PS 302", n: "Campaigns and Elections" }, { c: "PS 310", n: "Public Policy" }, { c: "PS 314", n: "Science, Tech & Public Policy" }, { c: "PS 320", n: "U.S. Environmental Law & Politics" }, { c: "PS 331", n: "U.S. Foreign Policy" }, { c: "PS 336", n: "Global Environmental Politics" }] },
  { g: "ANT", courses: [{ c: "ANT 251", n: "Intro to Biological Anthropology" }, { c: "ANT 252", n: "Intro to Cultural Anthropology" }, { c: "ANT 253", n: "Introduction to Archaeology" }, { c: "ANT 261", n: "Technology in Society & Culture" }, { c: "ANT 310", n: "Native Peoples of North America" }, { c: "ANT 370", n: "Intro to Forensic Anthropology" }] },
  { g: "COM", courses: [{ c: "COM 112", n: "Interpersonal Communication" }, { c: "COM 289", n: "Science Communication" }, { c: "COM 292", n: "Language, Communication, & Culture" }] },
  { g: "EC/ARE", courses: [{ c: "EC 202", n: "Principles of Macroeconomics" }, { c: "ARE 309", n: "Environmental Law & Econ Policy" }, { c: "ARE 311", n: "Agricultural Markets" }, { c: "ARE 433", n: "U.S. Agricultural Policy" }] },
  { g: "GEO", courses: [{ c: "GEO 200", n: "Principles of Geography" }, { c: "GEO 220", n: "Cultural Geography" }] },
  { g: "EDP", courses: [{ c: "EDP 304", n: "Educational Psychology" }, { c: "EDP 370", n: "Applied Child Development" }] },
  { g: "Other", courses: [{ c: "AEE 323", n: "Leadership Development in Ag" }, { c: "MIE 209", n: "Survey of Entrepreneurship" }, { c: "NR 219", n: "Natural Resource Markets" }, { c: "PRT 152", n: "Intro to Parks & Recreation" }, { c: "SW 300", n: "Research Methods in Social Work" }, { c: "ENG 210", n: "Intro to Language & Linguistics" }] }
];

export const GEP_ELEC_COURSES = [
  { g: "Sciences", courses: [{ c: "BIO 105", n: "Biology in the Modern World" }, { c: "BIO 181", n: "Intro Biology: Ecology & Evolution" }, { c: "BIO 183", n: "Intro Biology: Cellular & Molecular" }, { c: "CH 100", n: "Chemistry and Society" }, { c: "ES 100", n: "Intro to Environmental Sciences" }, { c: "ES 200", n: "Climate Change & Sustainability" }, { c: "ES 300", n: "Energy and Environment" }, { c: "GN 301", n: "Genetics in Human Affairs" }, { c: "MEA 100", n: "Earth System Science" }, { c: "MEA 130", n: "Intro to Weather & Climate" }, { c: "MEA 200", n: "Intro to Oceanography" }, { c: "PB 200", n: "Plant Life" }, { c: "PY 131", n: "Conceptual Physics" }, { c: "TOX 201", n: "Poisons, People & Environment" }] },
  { g: "Social Sciences", courses: [{ c: "PSY 200", n: "Introduction to Psychology" }, { c: "PSY 311", n: "Social Psychology" }, { c: "PSY 376", n: "Developmental Psychology" }, { c: "SOC 202", n: "Principles of Sociology" }, { c: "SOC 203", n: "Current Social Problems" }, { c: "SOC 241", n: "Sociology of Ag & Rural Society" }, { c: "SOC 350", n: "Food and Society" }, { c: "PS 201", n: "American Politics & Government" }, { c: "PS 231", n: "Intro to International Relations" }, { c: "ANT 252", n: "Intro to Cultural Anthropology" }, { c: "GEO 200", n: "Principles of Geography" }, { c: "EC 201", n: "Principles of Microeconomics" }, { c: "EC 202", n: "Principles of Macroeconomics" }] },
  { g: "Humanities", courses: [{ c: "ENG 208", n: "Studies In Fiction" }, { c: "ENG 252", n: "Major American Writers" }, { c: "ENG 282", n: "Introduction to Film" }, { c: "HI 253", n: "Early U.S. History" }, { c: "HI 254", n: "Modern U.S. History" }, { c: "HI 340", n: "History of Agriculture" }, { c: "HI 360", n: "U.S. Agricultural History" }, { c: "PHI 205", n: "Introduction to Philosophy" }, { c: "PHI 214", n: "Issues in Business Ethics" }, { c: "PHI 221", n: "Contemporary Moral Issues" }, { c: "PHI 375", n: "Ethics" }, { c: "REL 200", n: "Intro to Study of Religion" }, { c: "REL 210", n: "Religious Traditions of the World" }] },
  { g: "Arts", courses: [{ c: "ARC 140", n: "Experiencing Architecture" }, { c: "ARS 351", n: "Arts, Ideas and Values" }, { c: "DAN 122", n: "Dance and Society" }, { c: "ENG 282", n: "Introduction to Film" }, { c: "GD 203", n: "History of Graphic Design" }, { c: "HA 201", n: "History of Art: Caves to Renaissance" }, { c: "HA 202", n: "History of Art: Renaissance to 20th C" }, { c: "MUS 105", n: "Intro to Music in Western Society" }, { c: "MUS 206", n: "America's Music" }, { c: "MUS 260", n: "History of Jazz" }, { c: "THE 103", n: "Introduction to the Theatre" }] },
  { g: "Agriculture & Life Sci", courses: [{ c: "AEC 203", n: "Intro to Honey Bee & Beekeeping" }, { c: "AEE 208", n: "Agricultural Biotechnology" }, { c: "ANS 105", n: "Intro to Companion Animal Science" }, { c: "CS 213", n: "Crop Science" }, { c: "CS 230", n: "Intro to Agroecology" }, { c: "ENT 201", n: "Insects and People" }, { c: "FOR 248", n: "Forest History, Tech & Society" }, { c: "FS 201", n: "Introduction to Food Science" }, { c: "FS 221", n: "Discover: Chocolate, Coffee & Tea" }, { c: "FS 301", n: "Intro to Human Nutrition" }, { c: "FW 221", n: "Conservation of Natural Resources" }, { c: "HS 200", n: "Home Horticulture" }, { c: "HS 201", n: "World of Horticulture" }, { c: "PB 205", n: "Our Green World" }, { c: "PO 212", n: "Poultry & People" }, { c: "SSC 200", n: "Soil Science" }] },
  { g: "Business & Econ", courses: [{ c: "ARE 201", n: "Intro to AG & Resource Econ" }, { c: "ARE 336", n: "Intro Resource & Enviro Econ" }, { c: "MIE 201", n: "Introduction to Business" }, { c: "MIE 209", n: "Survey of Entrepreneurship" }, { c: "MIE 309", n: "Entrepreneurship Skills for Non-Majors" }, { c: "M 380", n: "Doing Business Globally" }] },
  { g: "Math & Stats", courses: [{ c: "MA 103", n: "Topics in Contemporary Math" }, { c: "MA 105", n: "Mathematics of Finance" }, { c: "MA 114", n: "Intro to Finite Math" }, { c: "MA 121", n: "Elements of Calculus" }, { c: "MA 141", n: "Calculus I" }, { c: "ST 101", n: "Statistics by Example" }, { c: "ST 311", n: "Introduction to Statistics" }, { c: "LOG 201", n: "Logic" }] },
  { g: "Interdisciplinary", courses: [{ c: "IDS 201", n: "Environmental Ethics" }, { c: "IDS 203", n: "Humans and the Environment" }, { c: "IDS 220", n: "Science & Art of Happiness" }, { c: "IS 200", n: "Intro to International Studies" }, { c: "STS 214", n: "Intro to Science, Tech & Society" }, { c: "STS 301", n: "Science and Civilization" }, { c: "STS 322", n: "Technological Catastrophes" }, { c: "STS 323", n: "World Population & Food" }] },
  { g: "Health & PE", courses: [{ c: "HESF 101", n: "Fitness and Wellness" }, { c: "HESF 102", n: "Fitness Walking" }, { c: "HESF 104", n: "Swim Conditioning" }, { c: "HESF 105", n: "Aerobics & Body Conditioning" }, { c: "HESS 237", n: "Weight Training" }, { c: "HESS 245", n: "Golf" }, { c: "HEST 261", n: "Basketball" }, { c: "HEST 266", n: "Ultimate Frisbee" }, { c: "PRT 200", n: "Health, Wellness & Happiness" }] }
];

export const IDS_COURSES = [
  { g: "IDS / Environment", courses: [{ c: "IDS 201", n: "Environmental Ethics (3 cr)" }, { c: "IDS 203", n: "Humans and the Environment (3 cr)" }, { c: "IDS 220", n: "Science & Art of Happiness (3 cr)" }, { c: "IDS 310", n: "Animals in Global Community (3 cr)" }, { c: "ES 100", n: "Intro to Environmental Sciences (3 cr)" }, { c: "ES 150", n: "Water and the Environment (3 cr)" }, { c: "ES 200", n: "Climate Change & Sustainability (3 cr)" }, { c: "ES 300", n: "Energy and Environment (3 cr)" }, { c: "ENV 101", n: "Exploring the Environment (2 cr)" }, { c: "ENV 250", n: "Diversity & Environmental Justice (3 cr)" }] },
  { g: "Science & Tech Studies", courses: [{ c: "STS 214", n: "Intro to Science, Tech & Society (3 cr)" }, { c: "STS 257", n: "Technology in the Arts (3 cr)" }, { c: "STS 301", n: "Science and Civilization (3 cr)" }, { c: "STS 302", n: "Contemporary Science, Tech & Human Values (3 cr)" }, { c: "STS 304", n: "Ethical Dimensions of Progress (3 cr)" }, { c: "STS 310", n: "Science, Psi, Sasquatch & Spirits (3 cr)" }, { c: "STS 315", n: "Feminist Futures (3 cr)" }, { c: "STS 320", n: "Cycling Cities (3 cr)" }, { c: "STS 322", n: "Technological Catastrophes (3 cr)" }, { c: "STS 323", n: "World Population & Food Prospects (3 cr)" }, { c: "STS 325", n: "Bio-Medical Ethics (3 cr)" }, { c: "STS 402", n: "Peace & War in the Nuclear Age (3 cr)" }, { c: "STS 405", n: "Technology & American Culture (3 cr)" }, { c: "STS 471", n: "Darwinism & Christianity (3 cr)" }] },
  { g: "History / Humanities", courses: [{ c: "HI 240", n: "Intro to Visual Culture (3 cr)" }, { c: "HI 305", n: "Frauds & Mysteries of the Past (3 cr)" }, { c: "HI 321", n: "Scientific Revolution (3 cr)" }, { c: "HI 322", n: "Rise of Modern Science (3 cr)" }, { c: "HI 341", n: "Technology in History (3 cr)" }, { c: "HI 342", n: "Global Environmental History (3 cr)" }, { c: "HI 361", n: "Global History American Food (3 cr)" }, { c: "HI 382", n: "History of Capitalism (3 cr)" }, { c: "HI 440", n: "American Environmental History (3 cr)" }, { c: "HI 481", n: "History of the Life Sciences (3 cr)" }, { c: "HI 485", n: "History of American Technology (3 cr)" }, { c: "PHI 210", n: "Puzzles and Paradoxes (3 cr)" }, { c: "PHI 212", n: "Ethical Problems in the Law (3 cr)" }, { c: "PHI 227", n: "Data Ethics (3 cr)" }, { c: "PHI 325", n: "Bio-Medical Ethics (3 cr)" }, { c: "PHI 340", n: "Philosophy of Science (3 cr)" }, { c: "PHI 425", n: "Intro to Cognitive Science (3 cr)" }, { c: "PHI 440", n: "The Scientific Method (3 cr)" }] },
  { g: "Agriculture & Life Sci", courses: [{ c: "AEC 203", n: "Intro Honey Bee & Beekeeping (3 cr)" }, { c: "AEC 245", n: "Practicing Conservation Ecology (3 cr)" }, { c: "AEC 260", n: "Global Change Ecology (3 cr)" }, { c: "AEE 208", n: "Agricultural Biotechnology (3 cr)" }, { c: "ARE 336", n: "Intro Resource & Enviro Econ (3 cr)" }, { c: "CS 230", n: "Intro to Agroecology (3 cr)" }, { c: "ENT 201", n: "Insects and People (3 cr)" }, { c: "FOR 248", n: "Forest History, Tech & Society (3 cr)" }, { c: "FW 221", n: "Conservation of Natural Resources (3 cr)" }, { c: "NTR 210", n: "Intro Community Food Security (3 cr)" }, { c: "NTR 211", n: "Eating through American History (3 cr)" }, { c: "PB 213", n: "Plants and Civilization (3 cr)" }, { c: "PB 219", n: "Plants in Folklore, Myth & Religion (3 cr)" }, { c: "PO 325", n: "Aspects of Animal Welfare (3 cr)" }, { c: "SSC 185", n: "Land and Life (3 cr)" }, { c: "ZO 233", n: "Human-Animal Interactions (3 cr)" }] },
  { g: "Other / Interdisciplinary", courses: [{ c: "ANT 261", n: "Technology in Society & Culture (3 cr)" }, { c: "BAE 210", n: "Leadership & Ethics in Sci, Tech & Ag (3 cr)" }, { c: "BIT 214", n: "Biotechnology & Sustainability (3 cr)" }, { c: "COM 215", n: "Free Press: Fake News & Conspiracies (3 cr)" }, { c: "COM 289", n: "Science Communication (3 cr)" }, { c: "CSC 281", n: "Foundations Interactive Game Design (3 cr)" }, { c: "DSA 201", n: "Intro to R/Python for Data Science (1 cr)" }, { c: "GIS 205", n: "Spatial Thinking with GIS (3 cr)" }, { c: "IS 200", n: "Intro to International Studies (3 cr)" }, { c: "MB 200", n: "Plagues that Changed the World (3 cr)" }, { c: "MIE 201", n: "Intro to Business (3 cr)" }, { c: "PCC 274", n: "Intro to Forensic Science (3 cr)" }, { c: "PSY 208", n: "Psychobiology of Success (3 cr)" }, { c: "PSY 441", n: "Environmental Psychology (3 cr)" }, { c: "REL 471", n: "Darwinism & Christianity (3 cr)" }, { c: "SW 260", n: "Intro to Gerontology (3 cr)" }] },
  { g: "IDS Perspectives 2", courses: [{ c: "BCH 220", n: "Role of Biotechnology in Society (3 cr)" }, { c: "CSC 110", n: "Computer Science Principles (3 cr)" }, { c: "GN 301", n: "Genetics in Human Affairs (3 cr)" }, { c: "GOH 201", n: "Foundations Global One Health (3 cr)" }, { c: "GOH 302", n: "Global One Health Applications (3 cr)" }, { c: "ID 244", n: "History of Industrial Design (3 cr)" }, { c: "IDS 210", n: "Intro to American Studies (3 cr)" }, { c: "M 380", n: "Doing Business Globally (3 cr)" }, { c: "MEA 260", n: "Human Dimensions of Climate Change (3 cr)" }, { c: "MIE 309", n: "Entrepreneurship Skills (3 cr)" }, { c: "MUS 200", n: "Understanding Music: Global Perspectives (3 cr)" }, { c: "PO 212", n: "Poultry & People (3 cr)" }, { c: "PP 232", n: "Big Data in Your Pocket (3 cr)" }, { c: "SLC 350", n: "Leadership & Negotiation (3 cr)" }, { c: "SOC 207", n: "Language and Society (3 cr)" }] }
];

export const SLASH_COURSES = {
  "are306": [{ c: "ARE 306", n: "Agricultural Law" }, { c: "ARE 309", n: "Environmental Law & Econ Policy" }],
  "are303": [{ c: "ARE 303", n: "Farm Business Management" }, { c: "ARE 304", n: "Agricultural Management" }],
  "are312": [{ c: "ARE 311", n: "Agricultural Markets" }, { c: "ARE 312", n: "Agribusiness Marketing" }],
  "are321": [{ c: "ARE 321", n: "AG Financial Management" }, { c: "ARE 323", n: "AG Financial Analysis" }, { c: "BUS 320", n: "Principles of Finance" }],
  "com112": [{ c: "COM 112", n: "Interpersonal Communication" }, { c: "COM 211", n: "Argumentation and Advocacy" }, { c: "COM 226", n: "Communication course" }, { c: "ENG 332", n: "Communication for Engineering & Technology" }],
  "bio": [{ c: "BIO 105 + BIO 106", n: "Biology in the Modern World + Lab (3+1 cr)" }, { c: "BIO 181", n: "Intro Biology: Ecology & Evolution (4 cr)" }, { c: "PB 200", n: "Plant Life (4 cr)" }],
  "math1": [{ c: "MA 121", n: "Elements of Calculus" }, { c: "MA 131", n: "Calculus for Life & Mgmt Sci A" }, { c: "MA 141", n: "Calculus I" }],
  "math2": [{ c: "MA 114", n: "Intro to Finite Mathematics" }, { c: "MA 231", n: "Calculus for Life & Mgmt Sci B" }, { c: "MA 241", n: "Calculus II" }, { c: "ST 311", n: "Introduction to Statistics" }, { c: "ST 350", n: "Statistics" }, { c: "BUS 350", n: "Business Statistics" }],
  "st311": [{ c: "ST 311", n: "Introduction to Statistics" }, { c: "ST 350", n: "Statistics" }, { c: "BUS 350", n: "Business Statistics" }, { c: "MA 114", n: "Intro to Finite Mathematics" }, { c: "MA 231", n: "Calculus for Life & Mgmt Sci B" }, { c: "MA 241", n: "Calculus II" }],
  "natsci4": [{ c: "CH 100", n: "Chemistry and Society (4 cr)" }, { c: "CH 101 + CH 102", n: "Chemistry + Gen Chem Lab (3+1 = 4 cr)" }, { c: "CH 201 + CH 202", n: "Quantitative Chemistry + Lab (3+1 = 4 cr)" }, { c: "MEA 100", n: "Earth System Science (4 cr)" }, { c: "MEA 101 + MEA 110", n: "Geology I + Lab (3+1 = 4 cr)" }, { c: "MEA 130 + MEA 135", n: "Weather & Climate + Lab (3+1 = 4 cr)" }, { c: "MEA 150", n: "Environmental Issues in Water Resources (4 cr)" }, { c: "PY 131", n: "Conceptual Physics (4 cr)" }, { c: "PY 205", n: "Physics for Engineers & Scientists I (4 cr)" }, { c: "PY 208", n: "Physics for Engineers & Scientists II (4 cr)" }, { c: "PY 211", n: "College Physics I (4 cr)" }, { c: "PY 212", n: "College Physics II (4 cr)" }],
  "natsci3": [{ c: "CH 101", n: "Chemistry - A Molecular Science (3 cr)" }, { c: "CH 201", n: "Chemistry - A Quantitative Science (3 cr)" }, { c: "CH 220", n: "Introductory Organic Chemistry (3 cr)" }, { c: "CH 221", n: "Organic Chemistry I (3 cr)" }, { c: "MEA 101", n: "Geology I: Physical (3 cr)" }, { c: "MEA 130", n: "Intro to Weather & Climate (3 cr)" }, { c: "MEA 200", n: "Intro to Oceanography (3 cr)" }],
  "hesf1": [{ c: "HESF 100", n: "Cross Training (2 cr)" }, { c: "HESF 101", n: "Fitness and Wellness (1 cr)" }, { c: "HESF 102", n: "Fitness Walking (1 cr)" }, { c: "HESF 103", n: "Water Aerobics (1 cr)" }, { c: "HESF 104", n: "Swim Conditioning (1 cr)" }, { c: "HESF 105", n: "Aerobics & Body Conditioning (1 cr)" }, { c: "HESF 106", n: "Triathlon (1 cr)" }, { c: "HESF 107", n: "Run Conditioning (1 cr)" }, { c: "HESF 108", n: "Water Step Aerobics (1 cr)" }, { c: "HESF 109", n: "Step Aerobics (1 cr)" }, { c: "HESF 110", n: "Adapted Fitness & Wellness (1 cr)" }, { c: "HESF 111", n: "Indoor Group Cycling (1 cr)" }, { c: "HESF 112", n: "Fitness Kickboxing (1 cr)" }, { c: "HESF 113", n: "High Intensity Conditioning (1 cr)" }, { c: "HESF 114", n: "Functional Training (1 cr)" }, { c: "HESF 115", n: "Wellness and Resilience (2 cr)" }],
  "hesf2": [{ c: "HESF 100", n: "Cross Training (2 cr)" }, { c: "HESF 101", n: "Fitness and Wellness (1 cr)" }, { c: "HESF 102", n: "Fitness Walking (1 cr)" }, { c: "HESF 103", n: "Water Aerobics (1 cr)" }, { c: "HESF 104", n: "Swim Conditioning (1 cr)" }, { c: "HESF 105", n: "Aerobics & Body Conditioning (1 cr)" }, { c: "HESF 107", n: "Run Conditioning (1 cr)" }, { c: "HESF 108", n: "Water Step Aerobics (1 cr)" }, { c: "HESF 109", n: "Step Aerobics (1 cr)" }, { c: "HESF 110", n: "Adapted Fitness & Wellness (1 cr)" }, { c: "HESF 111", n: "Indoor Group Cycling (1 cr)" }, { c: "HESF 112", n: "Fitness Kickboxing (1 cr)" }, { c: "HESF 113", n: "High Intensity Conditioning (1 cr)" }, { c: "HESF 114", n: "Functional Training (1 cr)" }, { c: "HESF 115", n: "Wellness and Resilience (2 cr)" }, { c: "DAN 202", n: "Introduction to Hula Hooping (1 cr)" }, { c: "DAN 227", n: "African Dance I (1 cr)" }, { c: "DAN 228", n: "African Dance II (1 cr)" }, { c: "DAN 240", n: "Social Dance (1 cr)" }, { c: "DAN 241", n: "Social Dance II (1 cr)" }, { c: "DAN 260", n: "Hip-hop Dance (1 cr)" }, { c: "DAN 261", n: "Hip-hop Dance II (1 cr)" }, { c: "DAN 263", n: "Tap Dance (1 cr)" }, { c: "DAN 264", n: "Ballet I (1 cr)" }, { c: "DAN 265", n: "Ballet II (1 cr)" }, { c: "DAN 273", n: "Jazz Dance I (1 cr)" }, { c: "DAN 274", n: "Modern Dance I (1 cr)" }, { c: "DAN 275", n: "Modern Dance II (1 cr)" }, { c: "DAN 276", n: "Jazz Dance II (1 cr)" }, { c: "DAN 279", n: "Yoga I (1 cr)" }, { c: "DAN 280", n: "Yoga II (2 cr)" }, { c: "DAN 281", n: "Pilates (1 cr)" }, { c: "DAN 285", n: "Advanced Dance Techniques (1 cr)" }, { c: "HES 195", n: "Special Topics in HES (1 cr)" }, { c: "HES 279", n: "Yoga I (1 cr)" }, { c: "HES 295", n: "HES Special Topics GEP (3 cr)" }, { c: "HESA 214", n: "Beginning Swimming (1 cr)" }, { c: "HESA 215", n: "Advanced Beginning Swimming (1 cr)" }, { c: "HESA 221", n: "Intermediate Swimming (1 cr)" }, { c: "HESA 226", n: "Skin and Scuba Diving I (2 cr)" }, { c: "HESA 227", n: "Skin & Scuba Diving II (2 cr)" }, { c: "HESA 229", n: "Scuba Leadership (2 cr)" }, { c: "HESA 231", n: "Scientific Diving (3 cr)" }, { c: "HESO 255", n: "Canoeing (1 cr)" }, { c: "HESO 257", n: "Backpacking (1 cr)" }, { c: "HESO 258", n: "Rock Climbing 1 (1 cr)" }, { c: "HESO 259", n: "Rock Climbing 2 (1 cr)" }, { c: "HESO 262", n: "Whitewater Canoeing (1 cr)" }, { c: "HESO 263", n: "Whitewater Kayaking (1 cr)" }, { c: "HESO 276", n: "Whitewater Rafting (1 cr)" }, { c: "HESO 277", n: "Mountain Biking (1 cr)" }, { c: "HESO 278", n: "Fly-Fishing (1 cr)" }, { c: "HESO 283", n: "Mountaineering (2 cr)" }, { c: "HESO 284", n: "Sea Kayaking (1 cr)" }, { c: "HESR 242", n: "Badminton (1 cr)" }, { c: "HESR 249", n: "Tennis I (1 cr)" }, { c: "HESR 250", n: "Tennis II (1 cr)" }, { c: "HESR 255", n: "Pickleball (1 cr)" }, { c: "HESR 256", n: "Racquetball (1 cr)" }, { c: "HESS 237", n: "Weight Training (1 cr)" }, { c: "HESS 239", n: "Self Defense (1 cr)" }, { c: "HESS 243", n: "Bowling (1 cr)" }, { c: "HESS 245", n: "Golf (1 cr)" }, { c: "HESS 251", n: "Target Archery (1 cr)" }, { c: "HESS 253", n: "Target Archery II (1 cr)" }, { c: "HEST 216", n: "Soccer (1 cr)" }, { c: "HEST 261", n: "Basketball (1 cr)" }, { c: "HEST 266", n: "Ultimate Frisbee (1 cr)" }, { c: "HEST 267", n: "Flag Football (1 cr)" }, { c: "HEST 269", n: "Volleyball I (1 cr)" }, { c: "HEST 270", n: "Volleyball II (1 cr)" }],
  "are4xx": [{ c: "ARE 404", n: "Advanced Agribusiness Management" }, { c: "ARE 412", n: "Advanced Agribusiness Marketing" }, { c: "ARE 413", n: "Applied Agribusiness Marketing" }, { c: "ARE 415", n: "Intro to Commodity Futures Markets" }, { c: "ARE 420", n: "Taxation in Ag, Production & Agribusiness" }, { c: "ARE 425", n: "Contracts & Organizations in Agriculture" }, { c: "ARE 444", n: "Ethics in Agribusiness" }, { c: "ARE 448", n: "International Agricultural Trade" }, { c: "ARE 455", n: "Agribusiness Analytics" }, { c: "ARE 470", n: "Agribusiness Entrepreneurship Clinical Skills" }, { c: "ARE 475", n: "Food Policy" }, { c: "ARE 494", n: "Agribusiness Study Abroad (1-6 cr)" }, { c: "ARE 495", n: "Special Topics in ARE (1-6 cr)" }, { c: "ARE 515", n: "Intro to Commodity Futures Markets" }],
  "are3xx": [{ c: "ARE 301", n: "Intermediate Microeconomics" }, { c: "ARE 303", n: "Farm Management" }, { c: "ARE 304", n: "Agribusiness Management" }, { c: "ARE 306", n: "Agricultural Law" }, { c: "ARE 309", n: "Environmental Law & Econ Policy" }, { c: "ARE 311", n: "Agricultural Markets" }, { c: "ARE 312", n: "Agribusiness Marketing" }, { c: "ARE 321", n: "Agricultural Financial Management" }, { c: "ARE 323", n: "Agribusiness Finance" }, { c: "ARE 332", n: "Human Resource Mgmt for Agribusiness" }, { c: "ARE 336", n: "Intro to Resource & Environmental Econ" }, { c: "ARE 345", n: "Global Agribusiness Management" }, { c: "ARE 370", n: "Agribusiness New Venture Development" }, { c: "ARE 395", n: "Special Topics in ARE 300-level (1-6 cr)" }, { c: "ARE 404", n: "Advanced Agribusiness Management" }, { c: "ARE 412", n: "Advanced Agribusiness Marketing" }, { c: "ARE 413", n: "Applied Agribusiness Marketing" }, { c: "ARE 415", n: "Intro to Commodity Futures Markets" }, { c: "ARE 420", n: "Taxation in Ag, Production & Agribusiness" }, { c: "ARE 425", n: "Contracts & Organizations in Agriculture" }, { c: "ARE 444", n: "Ethics in Agribusiness" }, { c: "ARE 448", n: "International Agricultural Trade" }, { c: "ARE 455", n: "Agribusiness Analytics" }, { c: "ARE 470", n: "Agribusiness Entrepreneurship Clinical Skills" }, { c: "ARE 475", n: "Food Policy" }, { c: "ARE 494", n: "Agribusiness Study Abroad (1-6 cr)" }, { c: "ARE 495", n: "Special Topics in ARE (1-6 cr)" }, { c: "ARE 515", n: "Intro to Commodity Futures Markets" }, { c: "EC 301", n: "Intermediate Microeconomics" }, { c: "EC 336", n: "Intro to Resource & Environmental Econ" }]
};

// Free-elective picker excludes these codes (they're already required elsewhere in the
// degree, so picking them again as a "free elective" would double count).
export const FREE_EXCLUDED = ["ARE 201", "ARE 201A", "BIO 105", "BIO 106", "BIO 181", "BIO 183", "EC 201", "EC 205", "ENG 101", "MA 101", "MA 103", "MA 103A", "MA 121", "MA 131", "MA 132", "MA 141", "WLCH 101", "WLFR 101", "WLGE 101", "WLGR 101", "WLHU 101", "WLIT 101", "WLJA 101", "WLLA 101", "WLPO 101", "WLRU 101", "WLSP 101", "WLSP 105"];

// Course-prefix allowlists for the Technical Elective / Dept-or-Technical Elective pickers.
export const TECH_PREFIXES = ["AEC", "AEE", "AEHS", "ANS", "BAE", "BAET", "BBS", "BCH", "BEC", "BIO", "BIT", "BMA", "BME", "BSC", "CE", "CH", "CHE", "CS", "CSSC", "ECE", "ECG", "ENT", "ES", "ET", "FM", "FOR", "FS", "FSA", "FW", "GES", "GIS", "GN", "HS", "IDS", "MA", "MB", "MEA", "MSE", "NE", "NR", "NTR", "PB", "PHY", "PO", "PP", "PRT", "PSC", "PSE", "PY", "SMT", "SSC", "ST", "TE", "TOX", "USC", "VMP", "ZO"];
export const DEPT_PREFIXES = ["ACC", "ARE", "BUS", "EC", "M", "MA", "MBA", "MIE", "MSE", "PRT", "ST", "TTM"];
export const DEPT_OR_TECH_PREFIXES = TECH_PREFIXES.concat(DEPT_PREFIXES);

// Exact-match departmental-elective course codes (used alongside DEPT_PREFIXES).
export const DEPT_VALID_CODES = ["ACC 200", "ACC 210", "ACC 220", "ACC 230", "ACC 280", "ACC 295", "ACC 310", "ACC 311", "ACC 330", "ACC 340", "ACC 411", "ACC 420", "ACC 440", "ACC 450", "ACC 451", "ACC 452", "ACC 453", "ACC 458", "ACC 459", "ACC 460", "ACC 495", "ACC 498", "ACC 499", "ACC 508", "ACC 510", "ACC 519", "ACC 520", "ACC 530", "ACC 533", "ACC 534", "ACC 535", "ACC 538", "ACC 540", "ACC 544", "ACC 545", "ACC 550", "ACC 571", "ACC 572", "ACC 580", "ACC 588", "ACC 590", "ARE 215", "ARE 260", "ARE 270", "ARE 290", "ARE 295", "ARE 301", "ARE 303", "ARE 304", "ARE 306", "ARE 309", "ARE 311", "ARE 312", "ARE 321", "ARE 323", "ARE 332", "ARE 336", "ARE 345", "ARE 370", "ARE 395", "ARE 404", "ARE 412", "ARE 413", "ARE 415", "ARE 420", "ARE 425", "ARE 433", "ARE 444", "ARE 448", "ARE 455", "ARE 470", "ARE 475", "ARE 490", "ARE 492", "ARE 493", "ARE 494", "ARE 495", "ARE 515", "ARE 590", "BUS 225", "BUS 295", "BUS 320", "BUS 340", "BUS 350", "BUS 351", "BUS 360", "BUS 370", "BUS 420", "BUS 422", "BUS 423", "BUS 425", "BUS 426", "BUS 427", "BUS 428", "BUS 429", "BUS 440", "BUS 441", "BUS 442", "BUS 443", "BUS 444", "BUS 449", "BUS 458", "BUS 459", "BUS 460", "BUS 461", "BUS 462", "BUS 463", "BUS 464", "BUS 465", "BUS 466", "BUS 467", "BUS 468", "BUS 469", "BUS 470", "BUS 472", "BUS 473", "BUS 474", "BUS 475", "BUS 476", "BUS 479", "BUS 480", "BUS 495", "BUS 498", "BUS 541", "BUS 542", "BUS 543", "BUS 554", "BUS 558", "BUS 571", "BUS 590", "EC 202", "EC 301", "EC 302", "EC 305", "EC 336", "EC 348", "EC 351", "EC 404", "EC 410", "EC 413", "EC 431", "EC 437", "EC 448", "EC 449", "EC 451", "EC 468", "EC 474", "EC 490", "EC 495", "EC 498", "M 100", "MA 105", "MBA 501", "MBA 502", "MBA 512", "MBA 515", "MBA 516", "MBA 518", "MBA 525", "MBA 530", "MBA 531", "MBA 532", "MBA 533", "MBA 534", "MBA 539", "MBA 572", "MBA 578", "MBA 579", "MBA 580", "MBA 584", "MBA 585", "MBA 586", "MBA 589", "MIE 201", "MIE 209", "MIE 295", "MIE 305", "MIE 306", "MIE 309", "MIE 310", "MIE 330", "MIE 335", "MIE 410", "MIE 411", "MIE 412", "MIE 413", "MIE 416", "MIE 418", "MIE 419", "MIE 430", "MIE 432", "MIE 434", "MIE 435", "MIE 436", "MIE 437", "MIE 438", "MIE 439", "MIE 480", "MIE 495", "MIE 498", "MIE 501", "MIE 510", "MIE 511", "MIE 516", "MIE 517", "MIE 522", "MIE 535", "MIE 536", "MIE 570", "MIE 573", "MIE 574", "MIE 576", "MIE 577", "MIE 581", "MIE 590", "MSE 576", "MSE 577", "PRT 406", "ST 350", "TTM 585"];

// GEP "verify" overlay lists: a course already on the student's audit that appears in one of
// these lists satisfies that GEP verify requirement without needing extra credit hours.
export const VERIFY_GLOBAL_KNOWLEDGE = ["AEC 245", "AEC 260", "AEC 380", "ADN 275", "AFS 240", "AFS 275", "AFS 276", "AFS 342", "AFS 475", "AFS 476", "AFS 479", "AFS 575", "AFS 576", "AFS 579", "ALS 494", "ANS 395", "ANT 252", "ANT 253", "ANT 261", "ANT 315", "ANT 325", "ANT 330", "ANT 345", "ANT 360", "ANT 371", "ANT 461", "ANT 471", "ANT 561", "ANT 571", "ARC 141", "ARE 345", "ARE 494", "ARS 251", "ARS 252", "ARS 353", "ARS 354", "ARS 410", "CE 489", "CE 589", "COM 215", "COM 364", "COM 374", "COM 392", "COM 447", "CS 224", "CS 230", "DAN 122", "DAN 227", "DAN 228", "E 480", "EC 449", "ECD 225", "ENG 215", "ENG 219", "ENG 220", "ENG 221", "ENG 222", "ENG 223", "ENG 224", "ENG 246", "ENG 255", "ENG 275", "ENG 282", "ENG 326", "ENG 329", "ENG 364", "ENG 374", "ENG 378", "ENG 380", "ENG 382", "ENG 385", "ENG 390", "ENG 392", "ENG 393", "ENG 394", "ENG 399", "ENG 406", "ENG 407", "ENG 439", "ENG 451", "ENG 464", "ENG 465", "ENG 551", "ENT 207", "ES 100", "ES 113", "ES 150", "ES 200", "ES 300", "ES 449", "ES 450", "FOR 414", "FW 221", "FW 465", "FW 565", "GEO 220", "GOH 201", "GOH 302", "HA 240", "HI 207", "HI 208", "HI 209", "HI 210", "HI 214", "HI 215", "HI 216", "HI 217", "HI 221", "HI 222", "HI 232", "HI 233", "HI 240", "HI 263", "HI 264", "HI 270", "HI 275", "HI 276", "HI 307", "HI 317", "HI 321", "HI 324", "HI 325", "HI 332", "HI 335", "HI 338", "HI 340", "HI 342", "HI 361", "HI 370", "HI 371", "HI 374", "HI 375", "HI 376", "HI 377", "HI 378", "HI 402", "HI 407", "HI 408", "HI 410", "HI 411", "HI 412", "HI 414", "HI 415", "HI 418", "HI 419", "HI 421", "HI 422", "HI 423", "HI 425", "HI 429", "HI 430", "HI 465", "HI 466", "HI 467", "HI 468", "HI 469", "HI 470", "HI 471", "HI 472", "HI 473", "HI 474", "HI 475", "HI 476", "HI 477", "HI 478", "HI 479", "HI 483", "HI 484", "HI 486", "HI 511", "HI 512", "HI 514", "HI 515", "HI 518", "HI 519", "HI 521", "HI 522", "HI 523", "HI 525", "HI 530", "HI 568", "HI 569", "HI 570", "HI 571", "HI 573", "HI 575", "HI 576", "HI 577", "HI 579", "HI 583", "HI 584", "HI 586", "HON 293", "HON 311", "HON 353", "HON 355", "HON 356", "HON 358", "HON 359", "HON 360", "HON 370", "HON 390", "HUMG 295", "IDS 201", "IDS 220", "IDS 310", "IPGK 295", "IS 200", "IS 471", "IS 571", "MEA 100", "MUS 105", "MUS 200", "MUS 202", "MUS 215", "MUS 320", "MUS 330", "MUS 350", "NSGK 295", "NTR 220", "PRT 449", "PRT 450", "PS 231", "PS 236", "PS 335", "PS 336", "PS 339", "PS 341", "PS 342", "PS 345", "PS 431", "PS 433", "PS 441", "REL 200", "REL 210", "REL 220", "REL 230", "REL 311", "REL 312", "REL 314", "REL 317", "REL 327", "REL 331", "REL 332", "REL 333", "REL 334", "REL 340", "REL 350", "REL 383", "REL 402", "REL 407", "REL 408", "REL 412", "REL 413", "REL 424", "REL 482", "REL 489", "SOC 220", "SOC 261", "SOC 342", "SOC 351", "STS 302", "STS 320", "STS 323", "SW 440", "SW 540", "WL 210", "WL 211", "WL 216", "WL 218", "WL 219", "WL 220", "WL 221", "WL 222", "WL 223", "WL 224", "WL 246", "WL 250", "WL 275", "WL 320", "WL 355", "WL 357", "WL 392", "WL 393", "WL 394", "WL 406", "WL 407", "WL 451", "WLAR 318", "WLAR 320", "WLAR 351", "WLCH 202", "WLCH 351", "WLCH 402", "WLCL 200", "WLCL 210", "WLCL 215", "WLCL 225", "WLCL 320", "WLCL 325", "WLFR 202", "WLFR 212", "WLFR 301", "WLFR 302", "WLFR 315", "WLFR 318", "WLFR 320", "WLFR 425", "WLFR 525", "WLGE 202", "WLGE 212", "WLGE 315", "WLGE 318", "WLGE 320", "WLGE 323", "WLGE 325", "WLGE 420", "WLGE 440", "WLGR 202", "WLHU 202", "WLHU 301", "WLHU 302", "WLHU 351", "WLHU 401", "WLIT 202", "WLIT 315", "WLIT 318", "WLJA 202", "WLJA 342", "WLJA 344", "WLJA 345", "WLRU 202", "WLRU 303", "WLRU 304", "WLRU 318", "WLSP 202", "WLSP 212", "WLSP 335", "WLSP 338", "WLSP 340", "WLSP 341", "WLSP 342", "WLSP 343", "WLSP 351", "WLSP 352", "WLSP 353", "WLSP 360"];
export const VERIFY_AMER_DEMOCRACY = ["AFS 248", "COM 371", "ENG 248", "ENG 265", "FAD 295", "HI 253", "HI 254", "HI 345", "HI 382", "HSS 201", "PHI 212", "PS 201", "PS 208", "PS 362", "REL 250", "SOC 212", "WLCL 222"];

// Technical Elective picker course list, grouped by department (source lines 881-932).
export const TECH_ELECTIVE_LIST = [
  { g: "AEC - Applied Ecology", courses: [
    { c: "AEC 203", n: "Intro to Honey Bee & Beekeeping (3)" }, { c: "AEC 360", n: "Ecology (4)" }, { c: "AEC 380", n: "Water Resources (3)" }, { c: "AEC 409", n: "Ecology & Conservation Freshwater Invertebrates (4)" }, { c: "AEC 419", n: "Freshwater Ecology (4)" }, { c: "AEC 420", n: "Intro Fisheries Science (3)" }, { c: "AEC 423", n: "Intro Fisheries Sciences Lab (1)" }, { c: "AEC 441", n: "Biology of Fishes (3)" }, { c: "AEC 442", n: "Biology of Fishes Lab (1)" }, { c: "AEC 460", n: "Field Ecology & Methods (4)" }, { c: "AEC 509", n: "Ecology & Conservation Freshwater Invertebrates (4)" }, { c: "AEC 515", n: "Fish Physiology (3)" }, { c: "AEC 519", n: "Freshwater Ecology (4)" }, { c: "AEC 761", n: "Conservation & Climate Science (3)" }] },
  { g: "AEE - Ag & Extension Education", courses: [
    { c: "AEE 101", n: "Intro Career & Technical Ed (1)" }, { c: "AEE 103", n: "Fundamentals of Ag & Extension Ed (1)" }, { c: "AEE 208", n: "Ag Biotechnology Issues (3)" }, { c: "AEE 226", n: "Computer Applications in Ag (3)" }, { c: "AEE 230", n: "Intro to Cooperative Extension (3)" }, { c: "AEE 303", n: "Admin & Supervision Student Orgs (3)" }, { c: "AEE 311", n: "Communication Methods & Media (3)" }, { c: "AEE 322", n: "Experiential Learning in Ag (3)" }, { c: "AEE 323", n: "Leadership Development (3)" }, { c: "AEE 325", n: "Planning & Delivering Non-Formal Ed (3)" }, { c: "AEE 326", n: "Teaching Diverse Learners (3)" }, { c: "AEE 327", n: "Conducting Summer Programs (1)" }, { c: "AEE 350", n: "Personal Leadership Development (3)" }, { c: "AEE 360", n: "Developing Team Leadership (3)" }, { c: "AEE 423", n: "Practicum in Ag Extension (8)" }, { c: "AEE 424", n: "Planning Ag Ed Programs (3)" }, { c: "AEE 426", n: "Methods of Teaching Ag (3)" }, { c: "AEE 427", n: "Student Teaching in Ag (8)" }, { c: "AEE 433", n: "Leadership & Mgmt of Volunteers (3)" }, { c: "AEE 435", n: "Professional Presentations (3)" }, { c: "AEE 460", n: "Organizational Leadership (3)" }, { c: "AEE 478", n: "Advanced Issues Extension Ed (3)" }, { c: "AEE 490", n: "Seminar in Ag & Extension Ed (3)" }, { c: "AEE 491", n: "Seminar in Ag Ed (1)" }, { c: "AEE 492", n: "External Learning Experience (1-6)" }, { c: "AEE 493", n: "Special Problems (1-6)" }, { c: "AEE 495", n: "Special Topics (1-3)" }, { c: "AEE 501", n: "Foundations of Ag & Extension Ed (3)" }, { c: "AEE 507", n: "Comparative Ag & Extension Ed (3)" }, { c: "AEE 526", n: "Info Technologies (3)" }, { c: "AEE 533", n: "Leadership & Mgmt Volunteers (3)" }] },
  { g: "ANS - Animal Science", courses: [
    { c: "ANS 105", n: "Intro Companion Animal Science (3)" }, { c: "ANS 108", n: "Small Ruminant Production (3)" }, { c: "ANS 110", n: "Intro Equine Science (3)" }, { c: "ANS 150", n: "Intro Animal Science (3)" }, { c: "ANS 151", n: "Intro Animal Science Lab (1)" }, { c: "ANS 201", n: "Techniques of Animal Care (2)" }, { c: "ANS 205", n: "Physiology of Domestic Animals (3)" }, { c: "ANS 206", n: "Anatomy Domestic Animals Lab (1)" }, { c: "ANS 208", n: "Ag Biotechnology Issues (3)" }, { c: "ANS 211", n: "Safety & Ethics Animal Science (2)" }, { c: "ANS 215", n: "Agricultural Genetics (3)" }, { c: "ANS 220", n: "Reproductive Physiology (3)" }, { c: "ANS 221", n: "Reproductive Physiology Lab (1)" }, { c: "ANS 225", n: "Principles Animal Nutrition (3)" }, { c: "ANS 230", n: "Animal Nutrition (3)" }, { c: "ANS 231", n: "Animal Nutrition Lab (1)" }, { c: "ANS 240", n: "Livestock Merchandising (3)" }, { c: "ANS 241", n: "Intro Meat & Poultry Processing (3)" }, { c: "ANS 242", n: "Value Added Meat Processing (3)" }, { c: "ANS 243", n: "Meat Safety & Quality Systems (3)" }, { c: "ANS 309", n: "Livestock Evaluation (3)" }, { c: "ANS 322", n: "Muscle Foods & Eggs (3)" }, { c: "ANS 324", n: "Milk & Dairy Products (3)" }, { c: "ANS 330", n: "Laboratory Animal Science (3)" }, { c: "ANS 395", n: "Study Abroad (1-6)" }, { c: "ANS 400", n: "Companion Animal Mgmt (3)" }, { c: "ANS 402", n: "Beef Cattle Mgmt (3)" }, { c: "ANS 403", n: "Swine Mgmt (3)" }, { c: "ANS 404", n: "Dairy Cattle Mgmt (3)" }, { c: "ANS 407", n: "Livestock Grazing Mgmt (3)" }, { c: "ANS 410", n: "Equine Breeding Farm Mgmt (3)" }, { c: "ANS 411", n: "Growing & Performance Horses (3)" }, { c: "ANS 415", n: "Comparative Nutrition (3)" }, { c: "ANS 425", n: "Feed Manufacturing Technology (3)" }, { c: "ANS 435", n: "Stress Physiology Animals (3)" }, { c: "ANS 437", n: "Precision Livestock Farming (3)" }, { c: "ANS 440", n: "Animal Genetic Improvement (3)" }, { c: "ANS 452", n: "Comparative Reproductive Physiology (3)" }, { c: "ANS 453", n: "Physiology & Genetics Growth (3)" }, { c: "ANS 454", n: "Lactation, Milk & Nutrition (3)" }, { c: "ANS 492", n: "Professional Internship (1-3)" }, { c: "ANS 493", n: "Research Experience (1-3)" }, { c: "ANS 495", n: "Special Topics (1-3)" }] },
  { g: "BAE - Biological & Ag Engineering", courses: [
    { c: "BAE 200", n: "Computer Methods (2)" }, { c: "BAE 202", n: "Intro BAE Methods (4)" }, { c: "BAE 210", n: "Leadership & Ethics (3)" }, { c: "BAE 322", n: "Intro Food Process Engineering (3)" }, { c: "BAE 325", n: "Introductory Geomatics (3)" }, { c: "BAE 376", n: "Watershed Assessment (3)" }, { c: "BAE 401", n: "Sensors & Controls (3)" }, { c: "BAE 435", n: "Precision Ag Technology (3)" }, { c: "BAE 455", n: "R Coding Data Mgmt (3)" }, { c: "BAE 472", n: "Irrigation & Drainage (3)" }, { c: "BAE 473", n: "Hydrologic & Water Quality Modeling (3)" }, { c: "BAE 474", n: "Ecological Engineering (3)" }, { c: "BAE 478", n: "Circular Manure Management (3)" }, { c: "BAE 481", n: "Structures & Environment (3)" }, { c: "BAE 486", n: "Aquacultural Engineering (3)" }, { c: "BAE 488", n: "Postharvest Engineering (3)" }, { c: "BAE 495", n: "Special Topics (1-3)" }] },
  { g: "BIO - Biology", courses: [
    { c: "BIO 105", n: "Biology in Modern World (3)" }, { c: "BIO 106", n: "Biology Modern World Lab (1)" }, { c: "BIO 181", n: "Introductory Biology (4)" }, { c: "BIO 183", n: "Cellular & Molecular Biology (4)" }, { c: "BIO 214", n: "Cellular & Molecular Biology (3)" }, { c: "BIO 230", n: "Science of Studying Dinosaurs (3)" }, { c: "BIO 240", n: "Human Anatomy & Physiology A (3)" }, { c: "BIO 245", n: "Human Anatomy & Physiology B (3)" }, { c: "BIO 270", n: "Intro to Evolution (3)" }, { c: "BIO 310", n: "Quantitative Approaches (3)" }, { c: "BIO 315", n: "General Parasitology (3)" }, { c: "BIO 330", n: "Evolutionary Biology (3)" }, { c: "BIO 361", n: "Developmental Biology (3)" }, { c: "BIO 404", n: "Epidemiology & Statistics (3)" }, { c: "BIO 405", n: "Functional Histology (3)" }, { c: "BIO 414", n: "Cell Biology (3)" }, { c: "BIO 416", n: "Cancer Cell Biology (3)" }, { c: "BIO 424", n: "Endocrinology (3)" }, { c: "BIO 432", n: "Evolutionary Medicine (3)" }, { c: "BIO 440", n: "Human Animal: Evolutionary Perspective (3)" }, { c: "BIO 488", n: "Neurobiology (3)" }] },
  { g: "CH - Chemistry", courses: [
    { c: "CH 100", n: "Chemistry & Society (4)" }, { c: "CH 101", n: "Chemistry - A Molecular Science (3)" }, { c: "CH 102", n: "General Chemistry Lab (1)" }, { c: "CH 201", n: "Chemistry - A Quantitative Science (3)" }, { c: "CH 202", n: "Quantitative Chemistry Lab (1)" }, { c: "CH 220", n: "Introductory Organic Chemistry (3)" }, { c: "CH 221", n: "Organic Chemistry I (3)" }, { c: "CH 222", n: "Organic Chemistry I Lab (1)" }, { c: "CH 223", n: "Organic Chemistry II (3)" }, { c: "CH 224", n: "Organic Chemistry II Lab (1)" }, { c: "CH 315", n: "Quantitative Analysis (3)" }, { c: "CH 331", n: "Introductory Physical Chemistry (4)" }, { c: "CH 345", n: "Chemistry & War (3)" }, { c: "CH 401", n: "Systematic Inorganic Chemistry I (3)" }, { c: "CH 431", n: "Physical Chemistry I (3)" }, { c: "CH 441", n: "Forensic Chemistry (3)" }] },
  { g: "CS - Crop Science", courses: [
    { c: "CS 200", n: "Intro Turfgrass Management (4)" }, { c: "CS 211", n: "Plant Genetics (3)" }, { c: "CS 213", n: "Crop Science (3)" }, { c: "CS 224", n: "Seeds, Biotechnology & Societies (3)" }, { c: "CS 230", n: "Intro to Agroecology (3)" }, { c: "CS 400", n: "Turf Cultural Systems (3)" }, { c: "CS 410", n: "Community Food Systems (3)" }, { c: "CS 413", n: "Plant Breeding (3)" }, { c: "CS 414", n: "Weed Science (4)" }, { c: "CS 415", n: "Integrated Pest Management (3)" }, { c: "CS 430", n: "Advanced Agroecology (4)" }] },
  { g: "ENT - Entomology", courses: [
    { c: "ENT 201", n: "Insects & People (3)" }, { c: "ENT 207", n: "Insects & Human Disease (3)" }, { c: "ENT 305", n: "Intro Forensic Entomology (3)" }, { c: "ENT 401", n: "Honey Bee Biology & Mgmt (3)" }, { c: "ENT 425", n: "General Entomology (3)" }, { c: "ENT 495", n: "Special Topics (1-3)" }, { c: "ENT 502", n: "Insect Diversity (4)" }, { c: "ENT 520", n: "Insect Behavior (3)" }, { c: "ENT 550", n: "Fundamentals Arthropod Mgmt (3)" }] },
  { g: "ES - Environmental Sciences", courses: [
    { c: "ES 100", n: "Intro Environmental Sciences (3)" }, { c: "ES 113", n: "Earth from Space (3)" }, { c: "ES 150", n: "Water & the Environment (3)" }, { c: "ES 200", n: "Climate Change & Sustainability (3)" }, { c: "ES 300", n: "Energy & Environment (3)" }, { c: "ES 400", n: "Analysis Environmental Issues (3)" }, { c: "ES 425", n: "Water Quality & Health (3)" }, { c: "ES 433", n: "GMOs for Conservation (3)" }, { c: "ES 495", n: "Special Topics (1-6)" }] },
  { g: "FOR - Forestry", courses: [
    { c: "FOR 248", n: "Forest History, Technology & Society (3)" }, { c: "FOR 252", n: "Intro Forest Science (3)" }, { c: "FOR 260", n: "Forest Ecology (4)" }, { c: "FOR 318", n: "Forest Pathology (3)" }, { c: "FOR 319", n: "Forest Economics (3)" }, { c: "FOR 353", n: "GIS & Remote Sensing (3)" }, { c: "FOR 401", n: "Dendrology (4)" }, { c: "FOR 404", n: "Theory of Silviculture (4)" }, { c: "FOR 414", n: "World Forestry (3)" }, { c: "FOR 420", n: "Watershed & Wetlands Hydrology (4)" }, { c: "FOR 472", n: "Forest Soils (4)" }] },
  { g: "FS - Food Science", courses: [
    { c: "FS 201", n: "Intro Food Science (3)" }, { c: "FS 221", n: "Chocolate, Coffee & Tea (3)" }, { c: "FS 250", n: "Basics Food Safety & Quality (3)" }, { c: "FS 301", n: "Intro Human Nutrition (3)" }, { c: "FS 322", n: "Muscle Foods & Eggs (3)" }, { c: "FS 324", n: "Milk & Dairy Products (3)" }, { c: "FS 330", n: "Science of Food Preparation (3)" }, { c: "FS 352", n: "Intro Microbiological Food Safety (3)" }, { c: "FS 401", n: "Advanced Nutrition & Metabolism (3)" }, { c: "FS 402", n: "Chemistry of Food (4)" }, { c: "FS 405", n: "Food Microbiology (3)" }, { c: "FS 416", n: "Quality Control (3)" }, { c: "FS 421", n: "Food Preservation (3)" }, { c: "FS 444", n: "Food Ingredient Functionality (3)" }, { c: "FS 445", n: "Food Product Development (4)" }, { c: "FS 453", n: "Food Laws & Regulations (3)" }] },
  { g: "FW - Fisheries & Wildlife", courses: [
    { c: "FW 221", n: "Conservation Natural Resources (3)" }, { c: "FW 311", n: "Piedmont Wildlife Ecology (3)" }, { c: "FW 333", n: "Conservation Biology in Practice (3)" }, { c: "FW 353", n: "Wildlife Management (3)" }, { c: "FW 373", n: "Vertebrate Natural History (3)" }, { c: "FW 402", n: "Genetics Wildlife Mgmt (3)" }, { c: "FW 403", n: "Urban Wildlife Mgmt (3)" }, { c: "FW 404", n: "Wildlife Habitat Mgmt (3)" }, { c: "FW 413", n: "Herpetology (4)" }, { c: "FW 444", n: "Mammalogy (3)" }, { c: "FW 453", n: "Principles Wildlife Science (4)" }, { c: "FW 465", n: "African Ecology & Conservation (4)" }] },
  { g: "GN - Genetics", courses: [
    { c: "GN 301", n: "Genetics in Human Affairs (3)" }, { c: "GN 311", n: "Principles of Genetics (4)" }, { c: "GN 421", n: "Molecular Genetics (3)" }, { c: "GN 423", n: "Population & Evolutionary Genetics (3)" }, { c: "GN 427", n: "Introductory Bioinformatics (3)" }, { c: "GN 428", n: "Intro Machine Learning Biology (3)" }, { c: "GN 441", n: "Human & Biomedical Genetics (3)" }, { c: "GN 450", n: "Conservation Genetics (3)" }, { c: "GN 451", n: "Genome Science (3)" }, { c: "GN 453", n: "Personal Genomics (3)" }] },
  { g: "HS - Horticultural Science", courses: [
    { c: "HS 200", n: "Home Horticulture (3)" }, { c: "HS 201", n: "World of Horticulture (3)" }, { c: "HS 242", n: "Landscape Design Intro (3)" }, { c: "HS 275", n: "Floral Design (3)" }, { c: "HS 301", n: "Plant Propagation (4)" }, { c: "HS 400", n: "Residential Landscaping (4)" }, { c: "HS 410", n: "Community Food Systems (3)" }, { c: "HS 431", n: "Vegetable Production (4)" }, { c: "HS 432", n: "Intro Permaculture (3)" }, { c: "HS 440", n: "Greenhouse Management (3)" }, { c: "HS 451", n: "Plant Nutrition (3)" }, { c: "HS 462", n: "Postharvest Physiology (3)" }, { c: "HS 495", n: "Special Topics (1-6)" }] },
  { g: "MB - Microbiology", courses: [
    { c: "MB 200", n: "Plagues that Changed the World (3)" }, { c: "MB 251", n: "General Microbiology (3)" }, { c: "MB 252", n: "General Microbiology Lab (1)" }, { c: "MB 311", n: "Medical Microbiology (3)" }, { c: "MB 405", n: "Food Microbiology (3)" }, { c: "MB 414", n: "Microbial Metabolic Regulation (3)" }, { c: "MB 435", n: "Bacterial Pathogenesis (3)" }, { c: "MB 441", n: "Immunology (3)" }, { c: "MB 451", n: "Microbial Diversity (3)" }, { c: "MB 455", n: "Microbial Biotechnology (3)" }, { c: "MB 461", n: "Molecular Virology (3)" }, { c: "MB 470", n: "Emerging Infectious Diseases (3)" }, { c: "MB 479", n: "Microbial Symbiosis & Microbiomes (3)" }] },
  { g: "MEA - Marine, Earth & Atmospheric", courses: [
    { c: "MEA 100", n: "Earth System Science (4)" }, { c: "MEA 101", n: "Geology I: Physical (3)" }, { c: "MEA 130", n: "Intro Weather & Climate (3)" }, { c: "MEA 200", n: "Intro Oceanography (3)" }, { c: "MEA 215", n: "Intro Atmospheric Sciences (4)" }, { c: "MEA 220", n: "Marine Biology (3)" }, { c: "MEA 240", n: "Planets of Our Solar System (3)" }, { c: "MEA 250", n: "Intro Coastal Environments (3)" }, { c: "MEA 252", n: "Biology of Marine Mammals (3)" }, { c: "MEA 260", n: "Human Dimensions Climate Change (3)" }, { c: "MEA 300", n: "Environmental Geology (4)" }, { c: "MEA 305", n: "Catastrophic Earth (3)" }, { c: "MEA 350", n: "Marine Conservation Biology (3)" }, { c: "MEA 412", n: "Atmospheric Physics (3)" }, { c: "MEA 415", n: "Climate Dynamics (3)" }, { c: "MEA 443", n: "Synoptic Weather Analysis (4)" }, { c: "MEA 449", n: "Biological Oceanography (3)" }, { c: "MEA 460", n: "Physical Oceanography (3)" }] },
  { g: "NR - Natural Resources", courses: [
    { c: "NR 203", n: "Humans & the Environment (3)" }, { c: "NR 219", n: "Natural Resource Markets (3)" }, { c: "NR 300", n: "Natural Resource Measurements (4)" }, { c: "NR 400", n: "Natural Resource Management (4)" }, { c: "NR 406", n: "Conservation Biological Diversity (3)" }, { c: "NR 414", n: "Geospatial Analytics (3)" }, { c: "NR 420", n: "Watershed & Wetlands Hydrology (4)" }, { c: "NR 421", n: "Wetland Science & Mgmt (3)" }, { c: "NR 425", n: "Water Quality & Health (3)" }, { c: "NR 460", n: "Renewable Natural Resource Mgmt (3)" }, { c: "NR 484", n: "Environmental Impact Assessment (4)" }] },
  { g: "NTR - Nutrition", courses: [
    { c: "NTR 210", n: "Intro Community Food Security (3)" }, { c: "NTR 211", n: "Eating through American History (3)" }, { c: "NTR 220", n: "Food & Culture (3)" }, { c: "NTR 301", n: "Intro Human Nutrition (3)" }, { c: "NTR 302", n: "Intro Nutrition Research (3)" }, { c: "NTR 310", n: "Food Insecurity & Federal Programs (3)" }, { c: "NTR 330", n: "Public Health Nutrition (3)" }, { c: "NTR 401", n: "Advanced Nutrition & Metabolism (3)" }, { c: "NTR 419", n: "Human Nutrition & Chronic Disease (3)" }, { c: "NTR 425", n: "Feed Manufacturing Technology (3)" }, { c: "NTR 440", n: "Child & Adolescent Nutrition (3)" }, { c: "NTR 460", n: "Nutrition for the Older Adult (3)" }, { c: "NTR 490", n: "Senior Capstone Nutrition (4)" }] },
  { g: "PB - Plant Biology", courses: [
    { c: "PB 200", n: "Plant Life (4)" }, { c: "PB 205", n: "Our Green World (3)" }, { c: "PB 208", n: "Ag Biotechnology Issues (3)" }, { c: "PB 213", n: "Plants & Civilization (3)" }, { c: "PB 215", n: "Medicinal Plants (3)" }, { c: "PB 219", n: "Plants in Folklore, Myth & Religion (3)" }, { c: "PB 250", n: "Plant Biology (4)" }, { c: "PB 277", n: "Space Biology (3)" }, { c: "PB 321", n: "Whole Plant Physiology (3)" }, { c: "PB 345", n: "Economic Botany (3)" }, { c: "PB 360", n: "Ecology (4)" }, { c: "PB 400", n: "Plant Diversity & Evolution (4)" }, { c: "PB 403", n: "Systematic Botany (4)" }, { c: "PB 421", n: "Plant Physiology (3)" }, { c: "PB 450", n: "Plant Ecology (3)" }, { c: "PB 480", n: "Intro Plant Biotechnology (3)" }] },
  { g: "PO - Poultry Science", courses: [
    { c: "PO 201", n: "Poultry Science & Production (3)" }, { c: "PO 212", n: "Poultry & People (3)" }, { c: "PO 215", n: "Applied Avian Nutrition (3)" }, { c: "PO 322", n: "Muscle Foods & Eggs (3)" }, { c: "PO 325", n: "Aspects of Animal Welfare (3)" }, { c: "PO 401", n: "Poultry Diseases (4)" }, { c: "PO 404", n: "Avian Anatomy & Physiology (4)" }, { c: "PO 415", n: "Comparative Nutrition (3)" }, { c: "PO 425", n: "Feed Manufacturing Technology (3)" }, { c: "PO 433", n: "Poultry Processing & Products (3)" }] },
  { g: "PY - Physics", courses: [
    { c: "PY 123", n: "Stellar & Galactic Astronomy (3)" }, { c: "PY 124", n: "Solar System Astronomy (3)" }, { c: "PY 131", n: "Conceptual Physics (4)" }, { c: "PY 201", n: "University Physics I (4)" }, { c: "PY 202", n: "University Physics II (4)" }, { c: "PY 205", n: "Physics for Engineers I (4)" }, { c: "PY 208", n: "Physics for Engineers II (4)" }, { c: "PY 211", n: "College Physics I (4)" }, { c: "PY 212", n: "College Physics II (4)" }, { c: "PY 301", n: "Intro Quantum Mechanics (3)" }, { c: "PY 407", n: "Intro Modern Physics (3)" }] },
  { g: "SSC - Soil Science", courses: [
    { c: "SSC 185", n: "Land & Life (3)" }, { c: "SSC 200", n: "Soil Science (3)" }, { c: "SSC 201", n: "Soil Science Lab (1)" }, { c: "SSC 332", n: "Environmental Soil Microbiology (3)" }, { c: "SSC 341", n: "Soil Fertility & Nutrient Mgmt (3)" }, { c: "SSC 427", n: "Biological Approaches Sustainable Soil (3)" }, { c: "SSC 440", n: "GIS in Soil Science & Ag (3)" }, { c: "SSC 442", n: "Soil & Environmental Biogeochemistry (3)" }, { c: "SSC 452", n: "Soil Classification (4)" }, { c: "SSC 455", n: "Soils, Environmental Quality (3)" }, { c: "SSC 461", n: "Soil Physical Properties (3)" }, { c: "SSC 470", n: "Wetland Soils (3)" }] },
  { g: "TOX - Toxicology", courses: [
    { c: "TOX 201", n: "Poisons, People & Environment (3)" }, { c: "TOX 400", n: "Undergraduate Seminar (1)" }, { c: "TOX 401", n: "Principles of Toxicology (4)" }, { c: "TOX 415", n: "Environmental Toxicology & Chemistry (4)" }] },
  { g: "ZO - Zoology", courses: [
    { c: "ZO 233", n: "Human-Animal Interactions (3)" }, { c: "ZO 250", n: "Animal Anatomy & Physiology (4)" }, { c: "ZO 317", n: "Primate Ecology & Evolution (3)" }, { c: "ZO 333", n: "Captive Animal Biology (3)" }, { c: "ZO 350", n: "Animal Phylogeny & Diversity (4)" }, { c: "ZO 402", n: "Invertebrate Biology (4)" }, { c: "ZO 410", n: "Intro Animal Behavior (3)" }, { c: "ZO 486", n: "Capstone in Zoology (3)" }] },
  { g: "Other", courses: [
    { c: "IDS 203", n: "Humans & the Environment (3)" }, { c: "MA 315", n: "Math Methods Atmospheric Sciences (4)" }, { c: "ST 404", n: "Epidemiology & Statistics (3)" }, { c: "PRT 203", n: "Humans & the Environment (3)" }, { c: "PRT 449", n: "Human Dimensions Natural Resources (3)" }, { c: "PRT 450", n: "Sustaining Natural Resources (3)" }] }
];

// Degree requirement template: one entry per semester slot, in canonical order. Each course
// either has a fixed `code`/`name` or is a `picker` slot ("Click to choose") that pulls its
// options from one of the lists above (SLASH_COURSES[picker], or the matching *_COURSES /
// *_LIST for "hum"/"socsci"/"gepelec"/"ids"/"tech"/"depttech"/"free"). This is also the
// template DEFAULT_PLAN / "Reset" restores and the base the sample/demo plan is built from.
export const DEFAULT_PLAN = [
  { term: "Fall — Year 1", courses: [
    { id: "ALS103", code: "ALS 103/303 or ARE 290", name: "Orientation to CALS / ARE", units: 1, cat: "orientation" },
    { id: "ARE201", code: "ARE 201", name: "Principles of Microeconomics", units: 3, cat: "dept" },
    { id: "MA121", code: "MA 121/131/141", name: "Click to choose", units: 3, cat: "math", picker: "math1" },
    { id: "ENG101", code: "ENG 101", name: "Academic Writing & Research", units: 4, cat: "gep", tag: "Writing GEP" },
    { id: "SOCSCI", code: "Social Science Elective", name: "Click to select course", units: 3, cat: "gep", tag: "Social Science GEP", picker: "socsci" }
  ] },
  { term: "Spring — Year 1", courses: [
    { id: "COM110", code: "COM 110", name: "Public Speaking", units: 3, cat: "comm" },
    { id: "ARE306", code: "ARE 306/309", name: "Click to choose", units: 3, cat: "dept", picker: "are306" },
    { id: "MATH2", code: "MA 114, 231 or 241", name: "Click to choose", units: 3, cat: "math", picker: "math2" },
    { id: "ARE303", code: "ARE 303/304", name: "Click to choose", units: 3, cat: "dept", picker: "are303" },
    { id: "NATSCI1", code: "Natural Science Elective (3 cr)", name: "Click to choose", units: 3, cat: "natsci", picker: "natsci3" },
    { id: "HESF1", code: "HESF 1XX", name: "Click to choose (100-level)", units: 1, cat: "gep", tag: "Health GEP", picker: "hesf1" }
  ] },
  { term: "Fall — Year 2", courses: [
    { id: "EC202", code: "EC 202", name: "Principles of Macroeconomics", units: 3, cat: "dept" },
    { id: "EC301", code: "EC/ARE 301", name: "Intermediate Microeconomics", units: 3, cat: "dept" },
    { id: "ACC210", code: "ACC 210", name: "Accounting", units: 3, cat: "dept" },
    { id: "MEA", code: "Natural Science Elective (4 cr)", name: "Click to choose", units: 4, cat: "natsci", picker: "natsci4" },
    { id: "RSTD1", code: "Technical Elective", name: "Click to choose", units: 3, cat: "restricted", picker: "tech" }
  ] },
  { term: "Spring — Year 2", courses: [
    { id: "ARE336", code: "ARE 336", name: "Resource & Environmental Econ", units: 3, cat: "dept" },
    { id: "ARE321", code: "ARE 321/323/BUS 320", name: "Click to choose", units: 3, cat: "dept", picker: "are321" },
    { id: "ARE433", code: "ARE 433", name: "U.S. Agricultural Policy", units: 3, cat: "dept" },
    { id: "ARE312", code: "ARE 311/312", name: "Click to choose", units: 3, cat: "dept", picker: "are312" },
    { id: "ST311", code: "ST 311, BUS 350 or ST 350", name: "Click to choose", units: 3, cat: "math", picker: "st311" }
  ] },
  { term: "Fall — Year 3", courses: [
    { id: "ARE4A", code: "ARE 4XX", name: "Click to choose", units: 3, cat: "dept", picker: "are4xx" },
    { id: "ARE3A", code: "ARE Elective (ARE 3XX or ARE 4XX)", name: "Click to choose", units: 3, cat: "dept", picker: "are3xx" },
    { id: "COM112", code: "COM 112/211/226 or ENG 332", name: "Click to choose", units: 3, cat: "comm", picker: "com112" },
    { id: "AEE226", code: "AEE 226", name: "Computer Applications in AG", units: 3, cat: "comm" },
    { id: "BIO", code: "BIO 105/106/181 or PB 200", name: "Click to choose", units: 4, cat: "natsci", picker: "bio" }
  ] },
  { term: "Spring — Year 3", courses: [
    { id: "ARE4B", code: "ARE 4XX", name: "Click to choose", units: 3, cat: "dept", picker: "are4xx" },
    { id: "ARE3B", code: "ARE Elective (ARE 3XX or ARE 4XX)", name: "Click to choose", units: 3, cat: "dept", picker: "are3xx" },
    { id: "HUMGEP", code: "GEP Humanities 2", name: "Click to select course", units: 3, cat: "gep", tag: "Humanities GEP", picker: "hum" },
    { id: "GEPHUMANITIES", code: "GEP Humanities", name: "Click to select course", units: 3, cat: "gep", tag: "Humanities GEP", picker: "hum" },
    { id: "RSTD2", code: "Technical Elective", name: "Click to choose", units: 3, cat: "restricted", picker: "tech" }
  ] },
  { term: "Fall — Year 4", courses: [
    { id: "ARE490", code: "ARE 490", name: "Career Seminar in ARE", units: 1, cat: "dept" },
    { id: "RSTD3", code: "Technical Elective", name: "Click to choose", units: 3, cat: "restricted", picker: "tech" },
    { id: "RSTD4", code: "Dept or Technical Elective", name: "Click to choose", units: 3, cat: "restricted", picker: "depttech" },
    { id: "IDS201", code: "Interdisc Perspectives", name: "Click to choose", units: 2, cat: "gep", tag: "IDS GEP", picker: "ids" },
    { id: "GEPELEC", code: "GEP Elective", name: "Click to select course", units: 3, cat: "gep", tag: "GEP Elective", picker: "gepelec" },
    { id: "FREE1", code: "Free Elective", name: "Click to choose", units: 3, cat: "free", picker: "free" }
  ] },
  { term: "Spring — Year 4", courses: [
    { id: "RSTD5", code: "Dept or Technical Elective", name: "Click to choose", units: 3, cat: "restricted", picker: "depttech" },
    { id: "RSTD6", code: "Dept or Technical Elective", name: "Click to choose", units: 3, cat: "restricted", picker: "depttech" },
    { id: "HESF2", code: "HES 100/200", name: "Click to choose (100 or 200-level)", units: 1, cat: "gep", tag: "Health GEP", picker: "hesf2" },
    { id: "FREE2", code: "Free Elective", name: "Click to choose", units: 3, cat: "free", picker: "free" },
    { id: "FREE3", code: "Free Elective", name: "Click to choose", units: 3, cat: "free", picker: "free" }
  ] },
  { term: "Summer I & II — Year 1", courses: [] },
  { term: "Summer I & II — Year 2", courses: [] },
  { term: "Summer I & II — Year 3", courses: [] },
  { term: "Summer I & II — Year 4", courses: [] },
  { term: "Taken / Transferred", courses: [] },
  { term: "In Progress (current term)", courses: [] }
];

// Fixed (non-schedulable) plan sections that hold courses from the audit rather than
// future plans. Term labels must not contain a season + year/"Year N", or the prereq
// engine would treat them as schedulable semesters.
export const TAKEN_TERM = "Taken / Transferred";
export const IN_PROGRESS_TERM = "In Progress (current term)";
// Bucket names used by earlier builds; kept so older autosaves/save files still render.
export const LEGACY_BUCKET_TERMS = ["Completed NC State Courses", "Transfer / Test / Prior Credit", "In Progress / Planned from Audit"];
export const BUCKET_TERMS = [TAKEN_TERM, IN_PROGRESS_TERM, ...LEGACY_BUCKET_TERMS];

// Minors surfaced by the Minor Explorer. Note: the original toolbar button/site copy only
// advertises "Minor Explorer (Economics)", but the underlying data actually covers THREE
// minors — Economics, Business Administration, and Environmental Science. Each requirement
// row's `status` is "major" (already satisfied by a required AgBus course — 0 extra
// credits) or "extra" (a genuinely additional course). `options`, when present, is the list
// of courses that satisfy an elective slot.
export const MINORS = {
  "Economics": {
    totalCr: 15,
    description: "Develop understanding of micro/macroeconomic theory, markets, government policy, and analytical skills. Only 9 extra credits needed since ARE 201 and EC/ARE 301 already count from your major.",
    requirements: [
      { code: "EC 201 or ARE 201", cr: 3, note: "Principles of Microeconomics", alts: ["ARE 201", "EC 201", "EC 205"], status: "major", majorNote: "Already required by AgBus major" },
      { code: "EC/ARE 301", cr: 3, note: "Intermediate Microeconomics", alts: ["EC 301", "ARE 301", "EC/ARE 301"], status: "major", majorNote: "Already required by AgBus major" },
      { code: "EC 302", cr: 3, note: "Intermediate Macroeconomics", alts: ["EC 302"], status: "extra", majorNote: "Extra course — could use a Dept/Tech Elective slot" },
      { code: "EC 300-500 Elective #1", cr: 3, note: "Any 300/400/500 level EC or ECG course", alts: [], status: "extra", majorNote: "Extra course — could use a Dept/Tech or Free Elective slot",
        options: ["EC 305", "EC 336", "EC 348", "EC 351", "EC 404", "EC 410", "EC 413", "EC 431", "EC 437", "EC 448", "EC 449", "EC 451", "EC 468", "EC 474", "EC 490", "EC 495"] },
      { code: "EC 300-500 Elective #2", cr: 3, note: "Any 300/400/500 level EC or ECG course", alts: [], status: "extra", majorNote: "Extra course — could use a Dept/Tech or Free Elective slot",
        options: ["EC 305", "EC 336", "EC 348", "EC 351", "EC 404", "EC 410", "EC 413", "EC 431", "EC 437", "EC 448", "EC 449", "EC 451", "EC 468", "EC 474", "EC 490", "EC 495"] }
    ],
    extraCr: 9,
    gpaReq: "2.0 GPA in all EC, ECG, and ARE courses",
    notes: "Courses cannot be taken pass/fail. Up to 6 transfer credits allowed with approval."
  },
  "Business Administration": {
    totalCr: 18,
    description: "Gain understanding of business language, economics fundamentals, financial accounting, and core business concepts. Designed primarily as a summer program — Poole recommends taking courses in summer terms. Requires 3.0 cumulative GPA to declare.",
    requirements: [
      { code: "MIE 201", cr: 3, note: "Introduction to Business Processes", alts: ["MIE 201"], status: "extra", majorNote: "Extra course — use a Dept/Tech or Free Elective slot" },
      { code: "EC 201 or ARE 201", cr: 3, note: "Fundamentals of Economics (C- or better)", alts: ["ARE 201", "EC 201", "EC 205"], status: "major", majorNote: "Already required by AgBus major" },
      { code: "ACC 210 or 220 or 280", cr: 3, note: "Accounting course (C- or better)", alts: ["ACC 210", "ACC 220", "ACC 280"], status: "major", majorNote: "ACC 210 already required by AgBus major" },
      { code: "BUS/MIE Elective #1", cr: 3, note: "Choose from: BUS 320, 340, 360, 370, M 380, MIE 305, 310, 330", alts: [], status: "extra", majorNote: "Extra course — use a Dept/Tech or Free Elective slot",
        options: ["BUS 320", "BUS 340", "BUS 360", "BUS 370", "M 380", "MIE 305", "MIE 310", "MIE 330"] },
      { code: "BUS/MIE Elective #2", cr: 3, note: "Choose from: BUS 320, 340, 360, 370, M 380, MIE 305, 310, 330", alts: [], status: "extra", majorNote: "Extra course — use a Dept/Tech or Free Elective slot",
        options: ["BUS 320", "BUS 340", "BUS 360", "BUS 370", "M 380", "MIE 305", "MIE 310", "MIE 330"] },
      { code: "BUS/MIE Elective #3", cr: 3, note: "Choose from: BUS 320, 340, 360, 370, M 380, MIE 305, 310, 330", alts: [], status: "extra", majorNote: "Extra course — use a Dept/Tech or Free Elective slot",
        options: ["BUS 320", "BUS 340", "BUS 360", "BUS 370", "M 380", "MIE 305", "MIE 310", "MIE 330"] }
    ],
    extraCr: 12,
    gpaReq: "3.0 cumulative GPA to declare; 2.0 GPA in minor coursework",
    notes: "Must have 30+ hours completed (15 at NC State) to declare. Designed as a summer program — strongly encouraged to take courses in summer. No more than 6 transfer credits. Note: BUS 320 requires ACC 210 (not ACC 280) as prereq."
  },
  "Environmental Science": {
    totalCr: 15,
    description: "Connect your major to contemporary environmental issues. Three ES core courses plus two electives from biological, physical, social science, or advanced course groups.",
    requirements: [
      { code: "ES Core #1", cr: 3, note: "Choose 3 of: ES 100, ES 113, ES 200, ES 300", alts: [], status: "extra", majorNote: "Extra course — could count as Tech Elective",
        options: ["ES 100", "ES 113", "ES 200", "ES 300"] },
      { code: "ES Core #2", cr: 3, note: "Choose 3 of: ES 100, ES 113, ES 200, ES 300", alts: [], status: "extra", majorNote: "Extra course — could count as Tech Elective",
        options: ["ES 100", "ES 113", "ES 200", "ES 300"] },
      { code: "ES Core #3", cr: 3, note: "Choose 3 of: ES 100, ES 113, ES 200, ES 300", alts: [], status: "extra", majorNote: "Extra course — could count as Tech Elective",
        options: ["ES 100", "ES 113", "ES 200", "ES 300"] },
      { code: "ES Elective #1", cr: 3, note: "Bio: MEA 220, FW 221, PB 360, FOR 252 | Phys: MEA 101, SSC 200, MEA 200 | Soc: IDS 201, PS 320, PS 336 | Adv: MEA 300, NR 460, NR 406", alts: [], status: "extra", majorNote: "May overlap with NatSci or Tech Elective slots",
        options: ["MEA 220", "FW 221", "PB 360", "FOR 252", "MEA 101", "SSC 200", "MEA 200", "IDS 201", "NR 303", "STS 322", "PS 320", "PS 336", "LAR 221", "MEA 300", "NR 460", "NR 406", "HI 440", "SOC 450"] },
      { code: "ES Elective #2", cr: 3, note: "Same options as Elective #1", alts: [], status: "extra", majorNote: "May overlap with NatSci or Tech Elective slots",
        options: ["MEA 220", "FW 221", "PB 360", "FOR 252", "MEA 101", "SSC 200", "MEA 200", "IDS 201", "NR 303", "STS 322", "PS 320", "PS 336", "LAR 221", "MEA 300", "NR 460", "NR 406", "HI 440", "SOC 450"] }
    ],
    extraCr: 15,
    gpaReq: "2.0 cumulative GPA; C- or better in each course",
    notes: "Cannot major and minor in Environmental Science. Course substitutions may be made with minor advisor approval. Contact: Erin Champion, eachampi@ncsu.edu, 919.513.2520."
  }
};

// localStorage key for autosave (unchanged so any student's existing autosaved plan from the
// live site keeps working after the rebuild ships).
export const AUTOSAVE_KEY = 'pawplan-autosave-v1';
export const AUTOSAVE_SCHEMA_VERSION = 2;
