import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcrypt";
import { eq, and, sql } from "drizzle-orm";
import { users, decks, flashcards } from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client);

const SYSTEM_EMAIL = "system@versado.app";
const SYSTEM_DISPLAY_NAME = "Versado";

interface StarterDeck {
  name: string;
  description: string;
  tag: string;
  cards: { front: string; back: string }[];
}

const STARTER_DECKS: StarterDeck[] = [
  {
    name: "Language Essentials",
    description: "Fundamental concepts about world languages and linguistics",
    tag: "languages",
    cards: [
      { front: "How many languages are spoken worldwide?", back: "Approximately 7,000 languages are spoken around the world today." },
      { front: "What is the most spoken language by native speakers?", back: "Mandarin Chinese, with over 900 million native speakers." },
      { front: "What is a cognate?", back: "A word that has a similar form and meaning in two languages because they share a common origin (e.g., 'night' in English and 'Nacht' in German)." },
      { front: "What is the difference between syntax and grammar?", back: "Syntax is the set of rules for sentence structure (word order), while grammar encompasses all language rules including syntax, morphology, and phonology." },
      { front: "What are the Romance languages?", back: "Languages derived from Latin: Spanish, Portuguese, French, Italian, and Romanian are the five major ones." },
      { front: "What is an agglutinative language?", back: "A language that forms words by stringing together morphemes (meaningful units), each with a single meaning. Examples: Turkish, Finnish, Japanese." },
      { front: "What is the International Phonetic Alphabet (IPA)?", back: "A standardized system of phonetic notation using symbols to represent each distinct sound in human speech." },
      { front: "What is a tonal language?", back: "A language where the pitch or tone of a syllable changes its meaning. Examples: Mandarin Chinese, Vietnamese, Thai." },
      { front: "What is the most widely spoken language globally (native + second language)?", back: "English, with approximately 1.5 billion speakers worldwide (native + second language)." },
      { front: "What is a lingua franca?", back: "A common language used between people who do not share a native language. Historically Latin, now English serves this role globally." },
    ],
  },
  {
    name: "Science Fundamentals",
    description: "Core scientific concepts every curious mind should know",
    tag: "science",
    cards: [
      { front: "What is the scientific method?", back: "A systematic approach: Observation → Question → Hypothesis → Experiment → Analysis → Conclusion. It's the foundation of modern science." },
      { front: "What is DNA?", back: "Deoxyribonucleic acid — a double-helix molecule that carries genetic instructions for the development and functioning of all known living organisms." },
      { front: "What is the speed of light?", back: "Approximately 299,792,458 meters per second (about 300,000 km/s) in a vacuum." },
      { front: "What are the three states of matter?", back: "Solid, liquid, and gas. A fourth state, plasma, exists at extremely high temperatures." },
      { front: "What is photosynthesis?", back: "The process by which plants convert sunlight, water, and CO₂ into glucose and oxygen: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂" },
      { front: "What is Newton's First Law of Motion?", back: "An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by an external force (Law of Inertia)." },
      { front: "What is the periodic table?", back: "A tabular arrangement of chemical elements organized by atomic number, electron configuration, and recurring chemical properties. Created by Dmitri Mendeleev in 1869." },
      { front: "What is evolution by natural selection?", back: "The process where organisms with traits better suited to their environment tend to survive and reproduce more, passing those traits to offspring. Proposed by Charles Darwin." },
      { front: "What is an atom?", back: "The smallest unit of a chemical element, consisting of a nucleus (protons + neutrons) surrounded by electrons." },
      { front: "What is the Big Bang theory?", back: "The prevailing cosmological model explaining the origin of the universe from an extremely hot, dense state approximately 13.8 billion years ago." },
    ],
  },
  {
    name: "Math Foundations",
    description: "Essential mathematical concepts and formulas",
    tag: "math",
    cards: [
      { front: "What is the Pythagorean theorem?", back: "In a right triangle: a² + b² = c², where c is the hypotenuse and a, b are the other two sides." },
      { front: "What is pi (π)?", back: "The ratio of a circle's circumference to its diameter, approximately 3.14159. It's an irrational number that never terminates or repeats." },
      { front: "What is a prime number?", back: "A natural number greater than 1 that has no positive divisors other than 1 and itself. Examples: 2, 3, 5, 7, 11, 13..." },
      { front: "What is the quadratic formula?", back: "For ax² + bx + c = 0: x = (-b ± √(b² - 4ac)) / 2a" },
      { front: "What is a derivative in calculus?", back: "The rate of change of a function at a given point. It measures how a function's output changes as its input changes. Written as f'(x) or dy/dx." },
      { front: "What is the area of a circle?", back: "A = πr², where r is the radius of the circle." },
      { front: "What is a logarithm?", back: "The inverse of exponentiation. log_b(x) = y means b^y = x. Example: log₂(8) = 3 because 2³ = 8." },
      { front: "What is the Fibonacci sequence?", back: "A sequence where each number is the sum of the two preceding ones: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34..." },
      { front: "What is the difference between mean, median, and mode?", back: "Mean: average of all values. Median: middle value when sorted. Mode: most frequently occurring value." },
      { front: "What is an integral in calculus?", back: "The area under a curve. It's the reverse of differentiation. The definite integral ∫[a,b] f(x)dx gives the accumulated area from a to b." },
    ],
  },
  {
    name: "History Highlights",
    description: "Major events and turning points in world history",
    tag: "history",
    cards: [
      { front: "When did World War II end?", back: "1945 — Germany surrendered in May (V-E Day), Japan surrendered in September (V-J Day) after the atomic bombings of Hiroshima and Nagasaki." },
      { front: "What was the Renaissance?", back: "A cultural movement (14th-17th century) originating in Italy, marked by renewed interest in classical art, science, and philosophy. Key figures: Da Vinci, Michelangelo, Galileo." },
      { front: "When was the French Revolution?", back: "1789-1799. It overthrew the monarchy, established a republic, and led to Napoleon's rise. Key moment: the storming of the Bastille on July 14, 1789." },
      { front: "What was the Industrial Revolution?", back: "A period of major industrialization (late 1700s-1800s) starting in Britain. Shift from agrarian economies to machine manufacturing, powered by steam engines." },
      { front: "When did the Roman Empire fall?", back: "The Western Roman Empire fell in 476 AD when the last emperor, Romulus Augustulus, was deposed. The Eastern (Byzantine) Empire continued until 1453." },
      { front: "What was the Cold War?", back: "A geopolitical rivalry (1947-1991) between the USA and USSR, characterized by nuclear arms race, proxy wars, and ideological conflict (capitalism vs. communism)." },
      { front: "When was the Declaration of Independence signed?", back: "July 4, 1776 — the 13 American colonies declared independence from Britain, written primarily by Thomas Jefferson." },
      { front: "What was the Silk Road?", back: "An ancient network of trade routes (2nd century BC - 15th century AD) connecting China to the Mediterranean, facilitating trade of silk, spices, and ideas." },
      { front: "When did humans first land on the Moon?", back: "July 20, 1969 — Apollo 11 mission. Neil Armstrong and Buzz Aldrin walked on the Moon while Michael Collins orbited above." },
      { front: "What was the Black Death?", back: "A devastating plague pandemic (1347-1351) caused by Yersinia pestis bacteria, killing an estimated 25-50 million people in Europe (30-60% of the population)." },
    ],
  },
  {
    name: "World Geography",
    description: "Essential facts about countries, continents, and physical features",
    tag: "geography",
    cards: [
      { front: "What are the seven continents?", back: "Africa, Antarctica, Asia, Australia/Oceania, Europe, North America, South America." },
      { front: "What is the longest river in the world?", back: "The Nile River at approximately 6,650 km (4,130 miles), flowing through northeastern Africa." },
      { front: "What is the largest country by area?", back: "Russia, at approximately 17.1 million km² — spanning 11 time zones across Europe and Asia." },
      { front: "What is the tallest mountain in the world?", back: "Mount Everest at 8,849 meters (29,032 feet), located on the border of Nepal and Tibet." },
      { front: "What is the largest ocean?", back: "The Pacific Ocean, covering approximately 165.25 million km² — more than all land area combined." },
      { front: "What is the smallest country in the world?", back: "Vatican City at just 0.44 km² (110 acres), located within Rome, Italy." },
      { front: "What is the Sahara Desert?", back: "The world's largest hot desert, covering approximately 9.2 million km² across North Africa — roughly the size of the United States." },
      { front: "What are the five Great Lakes of North America?", back: "Superior, Michigan, Huron, Erie, and Ontario. Together they contain about 21% of the world's surface fresh water." },
      { front: "What is the Ring of Fire?", back: "A horseshoe-shaped zone around the Pacific Ocean where about 75% of the world's volcanoes are found and 90% of earthquakes occur." },
      { front: "What is the most populated country in the world?", back: "India, surpassing China in 2023 with over 1.4 billion people." },
    ],
  },
  {
    name: "Programming Basics",
    description: "Core programming concepts every developer should know",
    tag: "programming",
    cards: [
      { front: "What is a variable?", back: "A named storage location in memory that holds a value. The value can be changed during program execution. Example: let count = 0;" },
      { front: "What is the difference between a compiled and interpreted language?", back: "Compiled: source code is translated entirely to machine code before execution (C, Go). Interpreted: code is executed line by line at runtime (Python, JavaScript)." },
      { front: "What is an algorithm?", back: "A step-by-step procedure or formula for solving a problem. It has a finite number of steps and produces a defined output for a given input." },
      { front: "What is Big O notation?", back: "A mathematical notation describing the upper bound of an algorithm's time or space complexity. Common: O(1) constant, O(n) linear, O(n²) quadratic, O(log n) logarithmic." },
      { front: "What is recursion?", back: "When a function calls itself to solve a problem by breaking it into smaller subproblems. Requires a base case to prevent infinite loops." },
      { front: "What is an API?", back: "Application Programming Interface — a set of rules and protocols that allows different software applications to communicate with each other." },
      { front: "What is version control (Git)?", back: "A system that records changes to files over time. Git tracks every modification, allows branching for parallel work, and enables collaboration via repositories." },
      { front: "What is the difference between a stack and a queue?", back: "Stack: Last-In-First-Out (LIFO) — last element added is first removed. Queue: First-In-First-Out (FIFO) — first element added is first removed." },
      { front: "What is object-oriented programming (OOP)?", back: "A paradigm based on 'objects' that contain data (attributes) and code (methods). Four pillars: Encapsulation, Abstraction, Inheritance, Polymorphism." },
      { front: "What is a database?", back: "An organized collection of structured data stored electronically. Relational databases (SQL) use tables; document databases (NoSQL) use flexible formats like JSON." },
    ],
  },
  {
    name: "Medical Essentials",
    description: "Key medical concepts and human body fundamentals",
    tag: "medicine",
    cards: [
      { front: "What are the four blood types?", back: "A, B, AB, and O. Each can be Rh-positive or Rh-negative. O-negative is the universal donor; AB-positive is the universal recipient." },
      { front: "How many bones are in the adult human body?", back: "206 bones. Babies are born with about 270, but many fuse together during growth." },
      { front: "What is blood pressure?", back: "The force of blood pushing against artery walls. Measured as systolic/diastolic (e.g., 120/80 mmHg). High blood pressure (hypertension) increases heart disease risk." },
      { front: "What is the largest organ of the human body?", back: "The skin, covering about 1.5-2 m² in adults. It protects against pathogens, regulates temperature, and provides sensation." },
      { front: "What is an antibiotic?", back: "A medication that kills or inhibits the growth of bacteria. They do NOT work against viruses. Overuse leads to antibiotic resistance." },
      { front: "What are the chambers of the heart?", back: "Four chambers: right atrium, right ventricle, left atrium, left ventricle. The right side pumps blood to the lungs; the left side pumps to the body." },
      { front: "What is the immune system?", back: "A complex network of cells, tissues, and organs that defends the body against pathogens. Key components: white blood cells, antibodies, lymph nodes." },
      { front: "What is BMI?", back: "Body Mass Index — a measure calculated from weight and height (kg/m²). Categories: <18.5 underweight, 18.5-24.9 normal, 25-29.9 overweight, 30+ obese." },
      { front: "What is the function of red blood cells?", back: "To carry oxygen from the lungs to body tissues and return carbon dioxide to the lungs. They contain hemoglobin, which binds oxygen." },
      { front: "What is a vaccine?", back: "A biological preparation that stimulates the immune system to recognize and fight specific pathogens, providing immunity without causing the disease." },
    ],
  },
  {
    name: "Legal Foundations",
    description: "Fundamental concepts in law and legal systems",
    tag: "law",
    cards: [
      { front: "What is the difference between civil law and criminal law?", back: "Civil law deals with disputes between individuals/organizations (contracts, property). Criminal law deals with offenses against the state/society (theft, assault)." },
      { front: "What does 'habeas corpus' mean?", back: "Latin for 'you shall have the body.' A legal principle requiring that a detained person be brought before a court to determine if their imprisonment is lawful." },
      { front: "What is the presumption of innocence?", back: "A legal principle that every person accused of a crime is considered innocent until proven guilty beyond a reasonable doubt." },
      { front: "What is a constitution?", back: "The supreme law of a nation that establishes the framework of government, defines citizens' rights, and limits government power." },
      { front: "What is the difference between a plaintiff and a defendant?", back: "Plaintiff: the party who initiates a lawsuit. Defendant: the party being sued or accused." },
      { front: "What is intellectual property?", back: "Legal rights protecting creations of the mind: patents (inventions), copyrights (creative works), trademarks (brands), and trade secrets." },
      { front: "What is due process?", back: "The legal requirement that the state must respect all legal rights owed to a person, ensuring fair treatment through the judicial system." },
      { front: "What is a precedent (stare decisis)?", back: "A legal principle where courts follow the rulings of previous similar cases. 'Stare decisis' means 'to stand by things decided.'" },
      { front: "What is the difference between common law and civil law systems?", back: "Common law (UK, US): based on judicial precedents. Civil law (France, Germany): based on comprehensive written legal codes." },
      { front: "What is a contract?", back: "A legally binding agreement between two or more parties. Key elements: offer, acceptance, consideration (exchange of value), and mutual consent." },
    ],
  },
  {
    name: "Music Theory Basics",
    description: "Fundamental concepts in music theory and appreciation",
    tag: "music",
    cards: [
      { front: "What are the seven notes in the musical scale?", back: "C, D, E, F, G, A, B (in the C major scale). These repeat in octaves across different pitches." },
      { front: "What is a chord?", back: "Three or more notes played simultaneously. A major chord (e.g., C major: C-E-G) sounds bright; a minor chord (C minor: C-E♭-G) sounds darker." },
      { front: "What is tempo?", back: "The speed of music, measured in BPM (beats per minute). Common tempos: Adagio (slow, 66-76), Allegro (fast, 120-156), Presto (very fast, 168-200)." },
      { front: "What is an octave?", back: "The interval between one musical pitch and another with double its frequency. Example: Middle C (262 Hz) to the next C above (524 Hz)." },
      { front: "What are the four families of orchestra instruments?", back: "Strings (violin, cello), Woodwinds (flute, clarinet), Brass (trumpet, trombone), Percussion (drums, timpani)." },
      { front: "What is a key signature?", back: "A set of sharps or flats at the beginning of a musical staff that indicates the key of the piece (which notes are consistently raised or lowered)." },
      { front: "What is rhythm?", back: "The pattern of sounds and silences in time. It includes beat (pulse), meter (grouping of beats), and tempo (speed)." },
      { front: "What is a time signature?", back: "A notation (like 4/4 or 3/4) indicating how many beats are in each measure and what note value gets one beat. 4/4 is the most common ('common time')." },
      { front: "What is harmony?", back: "The combination of simultaneously sounded notes to produce chords and chord progressions. It adds depth and richness to melody." },
      { front: "What is the difference between major and minor keys?", back: "Major keys generally sound happy/bright. Minor keys sound sad/dark. The difference lies in the interval pattern between notes in the scale." },
    ],
  },
  {
    name: "Art Appreciation",
    description: "Key concepts in visual arts history and techniques",
    tag: "art",
    cards: [
      { front: "What are the primary colors?", back: "In painting (subtractive): red, yellow, blue. In light (additive): red, green, blue. Primary colors cannot be made by mixing other colors." },
      { front: "Who painted the Mona Lisa?", back: "Leonardo da Vinci, painted between 1503-1519. It hangs in the Louvre Museum in Paris and is famous for its enigmatic smile." },
      { front: "What is perspective in art?", back: "A technique for creating the illusion of depth on a flat surface. Linear perspective uses vanishing points; atmospheric perspective uses color/value changes." },
      { front: "What is Impressionism?", back: "An art movement (1860s-1880s) emphasizing light, color, and everyday subjects. Key artists: Monet, Renoir, Degas. Named after Monet's 'Impression, Sunrise.'" },
      { front: "What is the difference between a portrait and a self-portrait?", back: "A portrait depicts another person. A self-portrait is an artwork of the artist themselves. Famous self-portrait: Van Gogh, Frida Kahlo." },
      { front: "What is chiaroscuro?", back: "An art technique using strong contrasts between light and dark to create a sense of volume and drama. Mastered by Caravaggio and Rembrandt." },
      { front: "What is abstract art?", back: "Art that does not attempt to represent reality. It uses shapes, colors, and forms to achieve its effect. Pioneers: Kandinsky, Mondrian, Malevich." },
      { front: "What is a fresco?", back: "A painting technique where pigments are applied to wet plaster on a wall or ceiling. Famous example: Michelangelo's Sistine Chapel ceiling." },
      { front: "What is the color wheel?", back: "A circular diagram organizing colors by their chromatic relationship. Shows primary, secondary (orange, green, purple), and tertiary colors." },
      { front: "What is Cubism?", back: "An art movement (early 1900s) that depicts objects from multiple viewpoints simultaneously, using geometric shapes. Founded by Pablo Picasso and Georges Braque." },
    ],
  },
  {
    name: "World Literature",
    description: "Classic works and concepts in world literature",
    tag: "literature",
    cards: [
      { front: "Who wrote 'Romeo and Juliet'?", back: "William Shakespeare, written around 1594-1596. A tragedy about two young lovers from feuding families in Verona, Italy." },
      { front: "What is a metaphor?", back: "A figure of speech comparing two unlike things by stating one IS the other (without 'like' or 'as'). Example: 'Time is money.'" },
      { front: "What is the difference between fiction and non-fiction?", back: "Fiction: imaginative, invented narratives (novels, short stories). Non-fiction: factual, real-world content (biographies, essays, journalism)." },
      { front: "Who wrote 'One Hundred Years of Solitude'?", back: "Gabriel García Márquez (1967). A landmark of magical realism following the Buendía family in the fictional town of Macondo." },
      { front: "What is a sonnet?", back: "A 14-line poem with a specific rhyme scheme. Shakespearean sonnets: ABAB CDCD EFEF GG. Petrarchan sonnets: ABBAABBA + CDCDCD or CDECDE." },
      { front: "What is the protagonist vs. antagonist?", back: "Protagonist: the main character driving the story. Antagonist: the character or force opposing the protagonist." },
      { front: "What is magical realism?", back: "A literary style that blends realistic settings with magical or fantastical elements presented as ordinary. Key authors: García Márquez, Isabel Allende, Salman Rushdie." },
      { front: "Who wrote 'The Odyssey'?", back: "Homer, an ancient Greek poet (circa 8th century BC). An epic poem following Odysseus's 10-year journey home after the Trojan War." },
      { front: "What is irony in literature?", back: "A contrast between expectation and reality. Types: verbal (saying the opposite), situational (unexpected outcome), dramatic (audience knows more than characters)." },
      { front: "What is a narrative point of view?", back: "The perspective from which a story is told. First person (I/we), second person (you), third person limited (he/she, one character's thoughts), third person omniscient (all-knowing)." },
    ],
  },
  {
    name: "Philosophy 101",
    description: "Essential philosophical concepts and thinkers",
    tag: "philosophy",
    cards: [
      { front: "What is the Socratic method?", back: "A form of inquiry using questions to stimulate critical thinking and illuminate ideas. Named after Socrates, who used it to expose contradictions in others' beliefs." },
      { front: "What is ethics?", back: "The branch of philosophy concerned with right and wrong, moral principles, and how we should live. Major branches: deontology, consequentialism, virtue ethics." },
      { front: "What is Plato's Allegory of the Cave?", back: "A thought experiment where prisoners in a cave see only shadows on a wall, mistaking them for reality. It illustrates the difference between appearance and true knowledge." },
      { front: "What is existentialism?", back: "A philosophical movement emphasizing individual freedom, choice, and responsibility. Key idea: 'existence precedes essence.' Thinkers: Sartre, Camus, Kierkegaard." },
      { front: "What does 'I think, therefore I am' mean?", back: "Descartes' foundational principle (Cogito ergo sum): the act of thinking proves one's own existence. It's the one thing that cannot be doubted." },
      { front: "What is utilitarianism?", back: "An ethical theory stating the best action is the one that maximizes overall happiness or well-being for the greatest number. Proposed by Jeremy Bentham and John Stuart Mill." },
      { front: "What is epistemology?", back: "The branch of philosophy studying knowledge: What can we know? How do we know it? What is the nature of truth and belief?" },
      { front: "What is the trolley problem?", back: "A thought experiment: a trolley is heading toward 5 people; you can divert it to a track with 1 person. It explores the ethics of action vs. inaction and consequentialism." },
      { front: "What is nihilism?", back: "The philosophical view that life has no inherent meaning, purpose, or value. Often associated with Nietzsche, who sought to overcome it through self-creation." },
      { front: "What is Stoicism?", back: "An ancient Greek philosophy teaching virtue, reason, and emotional resilience. Focus on controlling what you can (your reactions) and accepting what you can't. Key thinkers: Marcus Aurelius, Epictetus, Seneca." },
    ],
  },
  {
    name: "Psychology Essentials",
    description: "Core concepts in psychology and human behavior",
    tag: "psychology",
    cards: [
      { front: "What is classical conditioning?", back: "Learning through association, discovered by Pavlov. A neutral stimulus (bell) is paired with an unconditioned stimulus (food) until it alone produces a response (salivation)." },
      { front: "What are the Big Five personality traits?", back: "Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism (OCEAN). A widely accepted model for describing personality dimensions." },
      { front: "What is cognitive dissonance?", back: "The mental discomfort of holding two contradictory beliefs simultaneously. People are motivated to reduce this by changing beliefs, behaviors, or rationalizing." },
      { front: "What is Maslow's hierarchy of needs?", back: "A motivational theory with 5 levels (bottom to top): Physiological → Safety → Love/Belonging → Esteem → Self-actualization. Lower needs must be met before higher ones." },
      { front: "What is the placebo effect?", back: "A phenomenon where a patient experiences real improvement after receiving an inactive treatment, because they believe it will work." },
      { front: "What is confirmation bias?", back: "The tendency to search for, interpret, and recall information that confirms one's existing beliefs while ignoring contradictory evidence." },
      { front: "What is the difference between short-term and long-term memory?", back: "Short-term (working) memory: holds ~7 items for 20-30 seconds. Long-term memory: unlimited capacity, stores information from minutes to a lifetime." },
      { front: "What is the fight-or-flight response?", back: "An automatic physiological reaction to a perceived threat. The sympathetic nervous system releases adrenaline, increasing heart rate and alertness for survival." },
      { front: "What is operant conditioning?", back: "Learning through consequences, studied by B.F. Skinner. Behavior is strengthened by reinforcement (reward) or weakened by punishment." },
      { front: "What is the Dunning-Kruger effect?", back: "A cognitive bias where people with limited knowledge overestimate their ability, while experts tend to underestimate theirs." },
    ],
  },
  {
    name: "Economics Basics",
    description: "Fundamental concepts in economics and markets",
    tag: "economics",
    cards: [
      { front: "What is supply and demand?", back: "The economic model where price is determined by the relationship between how much of a product is available (supply) and how much people want it (demand)." },
      { front: "What is inflation?", back: "A general increase in prices and fall in the purchasing value of money over time. Moderate inflation (2-3%) is considered healthy for an economy." },
      { front: "What is GDP?", back: "Gross Domestic Product — the total monetary value of all goods and services produced within a country's borders in a specific time period." },
      { front: "What is the difference between microeconomics and macroeconomics?", back: "Microeconomics: studies individual markets, consumers, and firms. Macroeconomics: studies the economy as a whole (GDP, unemployment, inflation)." },
      { front: "What is opportunity cost?", back: "The value of the next best alternative you give up when making a choice. Example: attending college means forgoing 4 years of potential income." },
      { front: "What is a recession?", back: "A significant decline in economic activity lasting more than a few months, typically measured by two consecutive quarters of negative GDP growth." },
      { front: "What is compound interest?", back: "Interest calculated on both the initial principal and accumulated interest. Formula: A = P(1 + r/n)^(nt). It's why 'money makes money' over time." },
      { front: "What is a monopoly?", back: "A market structure where a single company is the sole provider of a product or service, with no competition. It can lead to higher prices for consumers." },
      { front: "What is fiscal policy vs. monetary policy?", back: "Fiscal policy: government spending and taxation decisions (by government). Monetary policy: controlling money supply and interest rates (by central bank)." },
      { front: "What is the law of diminishing returns?", back: "As you increase one input while keeping others fixed, the additional output from each extra unit of input eventually decreases." },
    ],
  },
  {
    name: "Business Fundamentals",
    description: "Key business concepts and strategies",
    tag: "business",
    cards: [
      { front: "What is a business model?", back: "The plan for how a company creates, delivers, and captures value. It defines the product, target market, revenue streams, and cost structure." },
      { front: "What is ROI?", back: "Return on Investment — a measure of profitability. Formula: (Net Profit / Cost of Investment) × 100%. Example: $150 profit on $100 investment = 150% ROI." },
      { front: "What is a SWOT analysis?", back: "A strategic planning tool evaluating: Strengths (internal advantages), Weaknesses (internal disadvantages), Opportunities (external favorable factors), Threats (external risks)." },
      { front: "What is the difference between B2B and B2C?", back: "B2B (Business-to-Business): selling to other companies (e.g., Salesforce). B2C (Business-to-Consumer): selling directly to end users (e.g., Amazon)." },
      { front: "What is a startup?", back: "A young company founded to develop a unique product or service, bring it to market, and scale rapidly. Often venture-capital funded with high growth potential." },
      { front: "What is cash flow?", back: "The net amount of cash moving in and out of a business. Positive cash flow means more money coming in than going out — essential for survival." },
      { front: "What are the 4 P's of Marketing?", back: "Product (what you sell), Price (what you charge), Place (where you sell it), Promotion (how you communicate its value)." },
      { front: "What is an MVP?", back: "Minimum Viable Product — the simplest version of a product that can be released to test a business idea with real users while minimizing development effort." },
      { front: "What is equity vs. debt financing?", back: "Equity: selling ownership shares for capital (investors become part owners). Debt: borrowing money to be repaid with interest (lenders have no ownership)." },
      { front: "What is a KPI?", back: "Key Performance Indicator — a measurable value showing how effectively a company is achieving its objectives. Examples: revenue growth, customer acquisition cost, churn rate." },
    ],
  },
  {
    name: "Cooking Essentials",
    description: "Fundamental cooking techniques and food knowledge",
    tag: "cooking",
    cards: [
      { front: "What are the five basic tastes?", back: "Sweet, sour, salty, bitter, and umami (savory). Umami was identified by Japanese chemist Kikunae Ikeda in 1908." },
      { front: "What is the Maillard reaction?", back: "A chemical reaction between amino acids and sugars that occurs when food is heated above 140°C (280°F), creating browning, flavor, and aroma (e.g., seared steak, toasted bread)." },
      { front: "What is the difference between baking and roasting?", back: "Both use dry oven heat. Baking typically refers to breads/pastries at lower temps. Roasting refers to meats/vegetables, often at higher temps for browning." },
      { front: "What does 'al dente' mean?", back: "Italian for 'to the tooth.' Pasta cooked al dente is firm when bitten, not soft. It has better texture and a lower glycemic index than overcooked pasta." },
      { front: "What is mise en place?", back: "French for 'everything in its place.' The practice of preparing and organizing all ingredients and tools before cooking begins. Essential for efficient cooking." },
      { front: "What are the five French mother sauces?", back: "Béchamel (milk + roux), Velouté (stock + roux), Espagnole (brown stock + roux), Hollandaise (butter + egg yolks), and Tomato sauce." },
      { front: "What is emulsification?", back: "The process of combining two liquids that don't normally mix (like oil and water). Examples: mayonnaise (oil + egg), vinaigrette (oil + vinegar)." },
      { front: "What is blanching?", back: "Briefly boiling food (usually vegetables) then plunging into ice water to stop cooking. It preserves color, texture, and nutrients while partially cooking." },
      { front: "What is gluten?", back: "A group of proteins found in wheat, barley, and rye. It gives dough its elastic texture. Kneading develops gluten, making bread chewy." },
      { front: "What is the danger zone for food safety?", back: "40°F to 140°F (4°C to 60°C) — the temperature range where bacteria multiply rapidly. Perishable food should not stay in this zone for more than 2 hours." },
    ],
  },
];

async function seedStarterDecks() {
  console.log("Seeding starter decks...\n");

  // 1. Upsert system user
  const passwordHash = await bcrypt.hash("SystemUser!2024#Versado", 4);

  await db
    .insert(users)
    .values({
      email: SYSTEM_EMAIL,
      passwordHash,
      displayName: SYSTEM_DISPLAY_NAME,
      emailVerified: true,
      tier: "fluent",
      preferences: {
        darkMode: false,
        themeColor: "sky",
        dailyGoal: 0,
        reminderTimes: [],
        cardSortingLogic: "due_first",
        pushAlerts: false,
        favoriteDeckIds: [],
      },
    })
    .onConflictDoNothing({ target: users.email });

  const [systemUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, SYSTEM_EMAIL))
    .limit(1);

  if (!systemUser) {
    console.error("Failed to create or find system user");
    process.exit(1);
  }

  console.log(`System user: ${SYSTEM_EMAIL} (${systemUser.id})`);

  // 2. Create starter decks
  let created = 0;
  let skipped = 0;

  for (const starter of STARTER_DECKS) {
    // Check if deck already exists for this system user with this tag
    const [existing] = await db
      .select({ id: decks.id })
      .from(decks)
      .where(
        and(
          eq(decks.ownerId, systemUser.id),
          sql`${decks.tags} @> ${JSON.stringify([starter.tag])}::jsonb`,
          eq(decks.tombstone, false),
        ),
      )
      .limit(1);

    if (existing) {
      console.log(`  ⏭ ${starter.name} (${starter.tag}) — already exists`);
      skipped++;
      continue;
    }

    // Create deck
    const [deck] = await db
      .insert(decks)
      .values({
        ownerId: systemUser.id,
        name: starter.name,
        description: starter.description,
        tags: [starter.tag],
        visibility: "marketplace",
        marketplace: {
          listed: true,
          price: 0,
          purchaseCount: 0,
          rating: 0,
          reviewCount: 0,
        },
        stats: {
          totalCards: starter.cards.length,
          newCards: starter.cards.length,
          learningCards: 0,
          reviewCards: 0,
          masteredCards: 0,
        },
      })
      .returning();

    // Create flashcards
    await db.insert(flashcards).values(
      starter.cards.map((c) => ({
        deckId: deck!.id,
        front: c.front,
        back: c.back,
        source: { type: "manual" as const },
      })),
    );

    console.log(`  ✓ ${starter.name} (${starter.tag}) — ${starter.cards.length} cards`);
    created++;
  }

  console.log(`\n========================================`);
  console.log(`  Starter decks seeded!`);
  console.log(`  Created: ${created}, Skipped: ${skipped}`);
  console.log(`  Total: ${STARTER_DECKS.length} decks, ${STARTER_DECKS.length * 10} cards`);
  console.log(`========================================\n`);
}

async function main() {
  await seedStarterDecks();
  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
