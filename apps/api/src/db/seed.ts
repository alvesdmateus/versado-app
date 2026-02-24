import { sql } from "drizzle-orm";
import { db } from "./index";
import { decks, flashcards } from "./schema";

interface CardData {
  front: string;
  back: string;
  difficulty?: "easy" | "medium" | "hard";
}

interface DeckData {
  name: string;
  description: string;
  tags: string[];
  cards: CardData[];
}

const STARTER_DECKS: DeckData[] = [
  // ─── TOPIC DECKS ────────────────────────────────────────────────────────────

  {
    name: "Programming Fundamentals",
    description: "Core concepts every developer should know, from variables to data structures.",
    tags: ["programming"],
    cards: [
      { front: "What is a variable?", back: "A named storage location that holds a value which can change during program execution.", difficulty: "easy" },
      { front: "What is a function?", back: "A reusable block of code designed to perform a specific task, called by name.", difficulty: "easy" },
      { front: "What is an algorithm?", back: "A step-by-step procedure or formula for solving a problem.", difficulty: "easy" },
      { front: "What is a data structure?", back: "A way of organizing and storing data so it can be accessed and modified efficiently. Examples: arrays, linked lists, trees.", difficulty: "medium" },
      { front: "What is Big O notation?", back: "A mathematical notation describing the limiting behavior of a function — used to classify algorithms by how their runtime or space requirements grow as input size grows.", difficulty: "medium" },
      { front: "What is recursion?", back: "A programming technique where a function calls itself to solve a smaller version of the same problem, with a base case to stop the recursion.", difficulty: "medium" },
      { front: "What is object-oriented programming (OOP)?", back: "A paradigm organizing code around objects (data + behavior) rather than functions and logic. Core concepts: encapsulation, inheritance, polymorphism, abstraction.", difficulty: "medium" },
      { front: "What is a stack?", back: "A LIFO (Last In, First Out) data structure. Elements are added (push) and removed (pop) from the same end (top).", difficulty: "medium" },
      { front: "What is a queue?", back: "A FIFO (First In, First Out) data structure. Elements are added at the rear and removed from the front.", difficulty: "medium" },
      { front: "What is the difference between compiled and interpreted languages?", back: "Compiled languages (C, Rust) are translated to machine code before execution. Interpreted languages (Python, JavaScript) are translated line-by-line at runtime.", difficulty: "hard" },
      { front: "What is a REST API?", back: "Representational State Transfer — an architectural style for building web services using HTTP methods (GET, POST, PUT, DELETE) and stateless communication.", difficulty: "medium" },
      { front: "What is version control?", back: "A system that tracks changes to files over time, allowing you to recall specific versions. Git is the most widely used version control system.", difficulty: "easy" },
    ],
  },

  {
    name: "Medicine Essentials",
    description: "Key medical concepts, terminology, and clinical knowledge for students and professionals.",
    tags: ["medicine"],
    cards: [
      { front: "What is homeostasis?", back: "The body's ability to maintain a stable internal environment (temperature, pH, blood sugar) despite changes in external conditions.", difficulty: "easy" },
      { front: "What is the difference between systolic and diastolic blood pressure?", back: "Systolic: pressure when the heart contracts (pumps). Diastolic: pressure when the heart relaxes between beats. Normal: ~120/80 mmHg.", difficulty: "easy" },
      { front: "What are the four chambers of the heart?", back: "Right atrium, right ventricle, left atrium, left ventricle. The right side receives deoxygenated blood; the left pumps oxygenated blood to the body.", difficulty: "easy" },
      { front: "What is an action potential?", back: "A rapid rise and fall in electrical potential across a cell membrane, allowing neurons to communicate signals along nerve fibers.", difficulty: "medium" },
      { front: "What is the difference between a virus and a bacterium?", back: "Bacteria are single-celled living organisms treated with antibiotics. Viruses are non-living particles that replicate inside host cells; treated with antivirals or vaccines.", difficulty: "easy" },
      { front: "What is the function of the liver?", back: "Detoxification, protein synthesis, production of bile (for fat digestion), glycogen storage, and metabolism of fats, proteins, and carbohydrates.", difficulty: "medium" },
      { front: "What is a differential diagnosis?", back: "A systematic method of identifying a condition by ruling out other conditions that share similar signs and symptoms.", difficulty: "medium" },
      { front: "What is inflammation?", back: "The body's innate immune response to harmful stimuli (pathogens, damaged cells). Characterized by redness, heat, swelling, pain, and loss of function.", difficulty: "easy" },
      { front: "What is DNA replication?", back: "The biological process by which a DNA molecule is copied before cell division. Each strand of the double helix serves as a template for a new complementary strand.", difficulty: "medium" },
      { front: "What does the CNS consist of?", back: "The Central Nervous System consists of the brain and spinal cord. It integrates information from the entire body and coordinates activity.", difficulty: "easy" },
      { front: "What is the purpose of insulin?", back: "Insulin is a hormone produced by the pancreas that regulates blood glucose levels by facilitating uptake of glucose into cells.", difficulty: "easy" },
      { front: "What is sepsis?", back: "A life-threatening organ dysfunction caused by a dysregulated host response to infection. Characterized by fever, tachycardia, tachypnea, and possible organ failure.", difficulty: "hard" },
    ],
  },

  {
    name: "History Milestones",
    description: "Key events, dates, and turning points that shaped human civilization.",
    tags: ["history"],
    cards: [
      { front: "When did World War I begin and end?", back: "Began July 28, 1914 (Austria-Hungary declared war on Serbia) and ended November 11, 1918, with the Armistice.", difficulty: "easy" },
      { front: "What caused the fall of the Roman Empire?", back: "Multiple causes: military overextension, economic troubles, political instability, barbarian invasions, and the rise of Christianity altering civic values. The Western Empire fell in 476 AD.", difficulty: "medium" },
      { front: "What was the Renaissance?", back: "A cultural and intellectual movement (14th–17th century) originating in Italy, marked by renewed interest in classical Greek/Roman culture, humanism, art, and science.", difficulty: "easy" },
      { front: "What was the Magna Carta?", back: "A charter signed by King John of England in 1215, limiting the king's power and establishing that everyone, including the king, was subject to the law.", difficulty: "medium" },
      { front: "When did humans first land on the Moon?", back: "July 20, 1969. Apollo 11 mission — Neil Armstrong and Buzz Aldrin landed on the lunar surface; Michael Collins orbited above.", difficulty: "easy" },
      { front: "What was the Cold War?", back: "A period of geopolitical tension (1947–1991) between the USA and USSR involving arms races, proxy wars, and ideological competition between capitalism and communism.", difficulty: "easy" },
      { front: "What triggered the French Revolution?", back: "Financial crisis, food shortages, social inequality (Estates system), Enlightenment ideas, and weak leadership under Louis XVI. Began in 1789.", difficulty: "medium" },
      { front: "What was the Industrial Revolution?", back: "A period of rapid industrialization (late 18th–19th century) beginning in Britain, marked by mechanized production, steam power, urbanization, and new labor conditions.", difficulty: "easy" },
      { front: "What was the Holocaust?", back: "The systematic, state-sponsored persecution and murder of six million Jews (and millions of others) by the Nazi regime in Germany during World War II (1941–1945).", difficulty: "medium" },
      { front: "What was the Silk Road?", back: "An ancient network of trade routes (200 BC–1450 AD) connecting East Asia, South Asia, the Middle East, and Europe, facilitating trade, culture, and religion exchange.", difficulty: "medium" },
      { front: "When was the Berlin Wall built and when did it fall?", back: "Built in August 1961 by East Germany to prevent emigration to the West. It fell November 9, 1989, symbolizing the end of the Cold War.", difficulty: "easy" },
    ],
  },

  {
    name: "Science Core Concepts",
    description: "Foundational principles across physics, chemistry, and biology.",
    tags: ["science"],
    cards: [
      { front: "What is Newton's First Law of Motion?", back: "An object at rest stays at rest, and an object in motion stays in motion at the same speed and direction, unless acted upon by an unbalanced force (Law of Inertia).", difficulty: "easy" },
      { front: "What is the difference between an atom and a molecule?", back: "An atom is the smallest unit of an element. A molecule is formed when two or more atoms bond together (e.g., H₂O is a molecule of 2 hydrogen + 1 oxygen).", difficulty: "easy" },
      { front: "What is the theory of evolution?", back: "Darwin's theory that species change over time through natural selection: organisms with favorable traits survive and reproduce more, passing traits to offspring.", difficulty: "easy" },
      { front: "What is the speed of light?", back: "Approximately 299,792,458 meters per second (≈3 × 10⁸ m/s) in a vacuum, denoted as 'c'. The universal speed limit per Einstein's Special Relativity.", difficulty: "easy" },
      { front: "What is the periodic table?", back: "A tabular arrangement of chemical elements ordered by atomic number, electron configuration, and recurring chemical properties.", difficulty: "easy" },
      { front: "What is photosynthesis?", back: "The process by which green plants use sunlight, water, and CO₂ to produce glucose and oxygen: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.", difficulty: "easy" },
      { front: "What is entropy?", back: "A measure of disorder or randomness in a system. The second law of thermodynamics states entropy in a closed system always increases over time.", difficulty: "medium" },
      { front: "What is the difference between fission and fusion?", back: "Fission splits heavy atoms (e.g., uranium) releasing energy — used in nuclear reactors. Fusion joins light atoms (e.g., hydrogen) releasing more energy — powers the Sun.", difficulty: "medium" },
      { front: "What is DNA?", back: "Deoxyribonucleic acid — a double-helix molecule that carries genetic instructions for development, functioning, growth, and reproduction of all living organisms.", difficulty: "easy" },
      { front: "What is the electromagnetic spectrum?", back: "The range of all electromagnetic radiation: radio waves, microwaves, infrared, visible light, ultraviolet, X-rays, and gamma rays, ordered by wavelength/frequency.", difficulty: "medium" },
      { front: "What is a chemical bond?", back: "A lasting attraction between atoms that enables formation of chemical compounds. Main types: covalent (shared electrons), ionic (electron transfer), metallic.", difficulty: "medium" },
    ],
  },

  {
    name: "Mathematics Fundamentals",
    description: "Essential math concepts from arithmetic to calculus and statistics.",
    tags: ["math"],
    cards: [
      { front: "What is the Pythagorean theorem?", back: "In a right triangle: a² + b² = c², where c is the hypotenuse (longest side) and a, b are the other two sides.", difficulty: "easy" },
      { front: "What is a prime number?", back: "A natural number greater than 1 that has no positive divisors other than 1 and itself. Examples: 2, 3, 5, 7, 11, 13.", difficulty: "easy" },
      { front: "What is a derivative?", back: "In calculus, the derivative measures the instantaneous rate of change of a function. f'(x) = lim(h→0) [f(x+h) - f(x)] / h.", difficulty: "hard" },
      { front: "What is the difference between mean, median, and mode?", back: "Mean: average (sum/count). Median: middle value when sorted. Mode: most frequent value.", difficulty: "easy" },
      { front: "What is a logarithm?", back: "The inverse of exponentiation. logₐ(b) = c means aᶜ = b. Example: log₁₀(1000) = 3 because 10³ = 1000.", difficulty: "medium" },
      { front: "What is pi (π)?", back: "The ratio of a circle's circumference to its diameter. Approximately 3.14159… It is an irrational number (infinite, non-repeating decimal).", difficulty: "easy" },
      { front: "What is a matrix?", back: "A rectangular array of numbers arranged in rows and columns. Used in linear algebra for transformations, systems of equations, and graphics.", difficulty: "medium" },
      { front: "What is the Fibonacci sequence?", back: "A sequence where each number is the sum of the two preceding ones: 0, 1, 1, 2, 3, 5, 8, 13, 21… F(n) = F(n-1) + F(n-2).", difficulty: "easy" },
      { front: "What is probability?", back: "The measure of how likely an event is to occur, expressed as a number between 0 (impossible) and 1 (certain). P(A) = favorable outcomes / total outcomes.", difficulty: "easy" },
      { front: "What is an integral?", back: "In calculus, the integral represents the area under a curve. The definite integral ∫ₐᵇ f(x)dx gives the net area between f(x) and the x-axis from a to b.", difficulty: "hard" },
      { front: "What is the binomial theorem?", back: "Describes the algebraic expansion of powers of a binomial: (a+b)ⁿ = Σ C(n,k) aⁿ⁻ᵏ bᵏ. Example: (a+b)² = a² + 2ab + b².", difficulty: "hard" },
    ],
  },

  {
    name: "Law & Legal Concepts",
    description: "Fundamental legal principles, terminology, and concepts for students and citizens.",
    tags: ["law"],
    cards: [
      { front: "What is the difference between civil law and criminal law?", back: "Criminal law deals with offenses against the state/society (prosecution by government). Civil law deals with disputes between individuals/organizations (plaintiff vs. defendant).", difficulty: "easy" },
      { front: "What does 'innocent until proven guilty' mean?", back: "The presumption of innocence — a fundamental principle requiring the prosecution to prove the accused's guilt beyond reasonable doubt, rather than the accused proving innocence.", difficulty: "easy" },
      { front: "What is a contract?", back: "A legally binding agreement between two or more parties with: an offer, acceptance, consideration (something of value exchanged), and intention to create legal relations.", difficulty: "easy" },
      { front: "What is habeas corpus?", back: "A legal action requiring a person under arrest to be brought before a judge or court. Protects against unlawful or indefinite imprisonment.", difficulty: "medium" },
      { front: "What is the difference between common law and civil law systems?", back: "Common law (UK, USA) is based on judicial precedents (case law). Civil law systems (France, Germany, Brazil) are based primarily on written codes and statutes.", difficulty: "medium" },
      { front: "What is intellectual property (IP)?", back: "Legal rights protecting creations of the mind: inventions (patents), literary/artistic works (copyright), brands (trademarks), and trade secrets.", difficulty: "easy" },
      { front: "What is due process?", back: "The legal requirement that the government must respect all legal rights owed to a person before depriving them of life, liberty, or property.", difficulty: "medium" },
      { front: "What is the difference between a felony and a misdemeanor?", back: "Felonies are more serious crimes (murder, robbery) typically punishable by over 1 year in prison. Misdemeanors are lesser offenses with lighter penalties.", difficulty: "easy" },
      { front: "What is tort law?", back: "A branch of civil law dealing with civil wrongs (negligence, defamation, trespass) that cause harm to others, allowing victims to claim compensation.", difficulty: "medium" },
      { front: "What is the statute of limitations?", back: "The maximum time after an event within which legal proceedings may be initiated. After the deadline, the claim is legally barred.", difficulty: "medium" },
      { front: "What is judicial review?", back: "The power of courts to examine laws and government actions to determine if they comply with the constitution. Can strike down unconstitutional laws.", difficulty: "hard" },
    ],
  },

  {
    name: "Music Theory Basics",
    description: "Core concepts of music theory: notes, scales, chords, and rhythm.",
    tags: ["music"],
    cards: [
      { front: "What are the 7 natural notes in Western music?", back: "A, B, C, D, E, F, G — which correspond to the white keys on a piano. Sharps (#) and flats (♭) are the black keys.", difficulty: "easy" },
      { front: "What is a major scale?", back: "A sequence of 7 notes following the pattern: Whole, Whole, Half, Whole, Whole, Whole, Half steps. Example: C major = C D E F G A B.", difficulty: "easy" },
      { front: "What is a chord?", back: "Three or more notes played simultaneously. A basic major chord consists of the root, major third, and perfect fifth.", difficulty: "easy" },
      { front: "What is the difference between major and minor?", back: "Major sounds bright/happy; minor sounds dark/sad. The difference is the third note: major has a major third (4 semitones up), minor has a minor third (3 semitones up).", difficulty: "easy" },
      { front: "What is tempo?", back: "The speed of a piece of music, measured in beats per minute (BPM). Common markings: Largo (slow), Andante (walking), Allegro (fast), Presto (very fast).", difficulty: "easy" },
      { front: "What is time signature?", back: "A notation indicating the meter of a musical piece. The top number shows beats per measure; the bottom shows note value per beat. 4/4 is most common.", difficulty: "medium" },
      { front: "What is an interval?", back: "The distance between two pitches measured in semitones or by name (e.g., perfect fifth = 7 semitones). Intervals define the character of chords and melodies.", difficulty: "medium" },
      { front: "What is harmony?", back: "The combination of simultaneously sounded musical notes to produce chords, and the study of how chords relate to each other within a key.", difficulty: "medium" },
      { front: "What is the circle of fifths?", back: "A visual representation of the 12 major and minor keys arranged so each key is a fifth apart from its neighbors. Useful for understanding key relationships and chord progressions.", difficulty: "medium" },
      { front: "What is counterpoint?", back: "The technique of combining two or more melodic lines that are harmonically interdependent yet independent in rhythm and contour. Associated with J.S. Bach.", difficulty: "hard" },
      { front: "What is syncopation?", back: "A rhythmic technique where the emphasis is placed on normally weak beats or off-beats, creating a feeling of forward motion or surprise. Common in jazz and funk.", difficulty: "medium" },
    ],
  },

  {
    name: "Art History & Concepts",
    description: "Key movements, artists, and concepts throughout art history.",
    tags: ["art"],
    cards: [
      { front: "What was the Renaissance?", back: "An artistic and cultural movement (14th–17th c.) celebrating humanism, naturalism, and classical ideals. Key figures: Leonardo da Vinci, Michelangelo, Raphael.", difficulty: "easy" },
      { front: "What is Impressionism?", back: "A 19th-century art movement characterized by small, visible brushstrokes, light effects, and everyday subjects. Key artists: Monet, Renoir, Degas.", difficulty: "easy" },
      { front: "What is the golden ratio?", back: "A mathematical ratio (~1.618) found in nature and used in art and architecture. Objects following this ratio are considered aesthetically pleasing. Also called φ (phi).", difficulty: "medium" },
      { front: "What is Cubism?", back: "An early 20th-century art movement (Picasso, Braque) that represented subjects from multiple viewpoints simultaneously, fragmenting forms into geometric shapes.", difficulty: "easy" },
      { front: "What is chiaroscuro?", back: "An Italian technique using strong contrast between light and dark to give the illusion of depth and three-dimensionality. Masterfully used by Caravaggio and Leonardo.", difficulty: "medium" },
      { front: "What is Surrealism?", back: "An art movement (1920s–) exploring the unconscious mind and dreams, combining realistic imagery with illogical, dreamlike scenes. Key artist: Salvador Dalí.", difficulty: "easy" },
      { front: "What is the difference between hue, saturation, and value?", back: "Hue: the color itself (red, blue). Saturation: intensity/purity of the color. Value: lightness or darkness of the color.", difficulty: "medium" },
      { front: "Who painted the Sistine Chapel ceiling?", back: "Michelangelo, commissioned by Pope Julius II. Painted 1508–1512. The most famous scene is 'The Creation of Adam.'", difficulty: "easy" },
      { front: "What is abstract art?", back: "Art that does not attempt to represent external reality but uses shapes, colors, forms, and gestural marks to achieve its effect. Pioneers: Kandinsky, Mondrian.", difficulty: "easy" },
      { front: "What is the Bauhaus?", back: "A German art school (1919–1933) combining fine arts and design. Its philosophy — 'form follows function' — greatly influenced modern architecture and design.", difficulty: "medium" },
      { front: "What is perspective in art?", back: "A technique to represent three-dimensional space on a flat surface. One-point perspective uses a single vanishing point; two-point uses two.", difficulty: "medium" },
    ],
  },

  {
    name: "World Geography",
    description: "Countries, capitals, continents, and key geographical features of our world.",
    tags: ["geography"],
    cards: [
      { front: "What are the 7 continents?", back: "Africa, Antarctica, Asia, Australia (Oceania), Europe, North America, South America.", difficulty: "easy" },
      { front: "What is the longest river in the world?", back: "The Nile River in Africa, approximately 6,650 km (4,130 miles) long, flowing through Uganda, Sudan, and Egypt to the Mediterranean.", difficulty: "easy" },
      { front: "What is the capital of Australia?", back: "Canberra. (Not Sydney, which is the largest city.)", difficulty: "easy" },
      { front: "What is the largest country by area?", back: "Russia, covering about 17.1 million km² — spanning 11 time zones across Europe and Asia.", difficulty: "easy" },
      { front: "What are the major ocean currents?", back: "Key currents include the Gulf Stream (North Atlantic), Kuroshio (North Pacific), Antarctic Circumpolar Current, and Humboldt (South Pacific). They regulate global climate.", difficulty: "medium" },
      { front: "What is the Ring of Fire?", back: "A major area in the Pacific Ocean basin where many earthquakes and volcanic eruptions occur. About 75% of the world's volcanoes are located here.", difficulty: "medium" },
      { front: "What is the smallest country in the world?", back: "Vatican City, with an area of approximately 0.44 km² (110 acres), located within Rome, Italy.", difficulty: "easy" },
      { front: "What causes seasons?", back: "Earth's axial tilt (23.5°) relative to its orbital plane around the Sun. When a hemisphere tilts toward the Sun, it receives more direct sunlight = summer.", difficulty: "medium" },
      { front: "What is the Tropic of Cancer and Tropic of Capricorn?", back: "The Tropic of Cancer (23.5°N) and Tropic of Capricorn (23.5°S) mark the northernmost and southernmost latitudes where the Sun can be directly overhead.", difficulty: "medium" },
      { front: "What is the most densely populated country?", back: "Monaco (city-state), with ~26,000 people per km². Among large countries, Bangladesh is the most densely populated.", difficulty: "medium" },
      { front: "What are the BRICS nations?", back: "Brazil, Russia, India, China, South Africa — a group of major emerging economies. Expanded in 2024 to include Egypt, Ethiopia, Iran, Saudi Arabia, UAE.", difficulty: "medium" },
    ],
  },

  {
    name: "Psychology Essentials",
    description: "Core theories, concepts, and thinkers in the field of psychology.",
    tags: ["psychology"],
    cards: [
      { front: "What is Maslow's hierarchy of needs?", back: "A motivational theory (5 levels): Physiological → Safety → Love/Belonging → Esteem → Self-actualization. Lower needs must be met before higher needs motivate behavior.", difficulty: "easy" },
      { front: "What is classical conditioning?", back: "Pavlov's discovery that a neutral stimulus can elicit a response by being paired with an unconditioned stimulus. Example: bell + food → bell alone causes salivation.", difficulty: "easy" },
      { front: "What is cognitive dissonance?", back: "The mental discomfort felt when holding conflicting beliefs, values, or attitudes. People are motivated to reduce this dissonance by changing beliefs or rationalizing.", difficulty: "medium" },
      { front: "What is the difference between intrinsic and extrinsic motivation?", back: "Intrinsic: doing something for its own sake (enjoyment, curiosity). Extrinsic: doing something for external rewards (money, grades, praise).", difficulty: "easy" },
      { front: "What is the placebo effect?", back: "A beneficial effect produced by an inactive treatment (sugar pill, saline injection) because the patient believes they are receiving real treatment.", difficulty: "easy" },
      { front: "What is confirmation bias?", back: "The tendency to search for, interpret, and remember information in a way that confirms one's preexisting beliefs or hypotheses.", difficulty: "medium" },
      { front: "What are the Big Five personality traits (OCEAN)?", back: "Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism. The most widely accepted model for describing personality.", difficulty: "medium" },
      { front: "What is operant conditioning?", back: "B.F. Skinner's theory that behavior is shaped by its consequences. Reinforcement increases behavior; punishment decreases it.", difficulty: "medium" },
      { front: "What is the difference between short-term and long-term memory?", back: "Short-term memory holds a small amount of information for a short time (~20-30 seconds, ~7 items). Long-term memory stores information indefinitely with unlimited capacity.", difficulty: "easy" },
      { front: "What is the Dunning-Kruger effect?", back: "A cognitive bias where people with limited knowledge overestimate their own competence, while experts tend to underestimate theirs.", difficulty: "medium" },
      { front: "What is attachment theory?", back: "Bowlby's theory that early bonds with caregivers are crucial for development. Attachment styles (secure, anxious, avoidant, disorganized) persist into adulthood.", difficulty: "medium" },
    ],
  },

  {
    name: "Philosophy Introduction",
    description: "Key ideas, thinkers, and questions in Western and Eastern philosophy.",
    tags: ["philosophy"],
    cards: [
      { front: "What is epistemology?", back: "The branch of philosophy concerned with the nature, origin, and limits of human knowledge. Key question: How do we know what we know?", difficulty: "medium" },
      { front: "What is Plato's Theory of Forms?", back: "The idea that the physical world is a shadow of a higher reality of perfect, abstract Forms (e.g., the Form of Beauty, Justice). Knowledge is recollection of these Forms.", difficulty: "medium" },
      { front: "What is Descartes' 'Cogito ergo sum'?", back: "'I think, therefore I am.' Descartes' foundational statement: even if everything else can be doubted, the act of thinking proves the thinker exists.", difficulty: "easy" },
      { front: "What is utilitarianism?", back: "An ethical theory (Bentham, Mill) holding that the right action is the one that produces the greatest good for the greatest number of people.", difficulty: "easy" },
      { front: "What is Kant's categorical imperative?", back: "A moral principle: 'Act only according to that maxim by which you can at the same time will that it should become a universal law.' A test for ethical universalizability.", difficulty: "hard" },
      { front: "What is existentialism?", back: "A philosophy (Sartre, Camus, Kierkegaard) emphasizing individual freedom, choice, and responsibility. 'Existence precedes essence' — we define ourselves through actions.", difficulty: "medium" },
      { front: "What is the problem of evil?", back: "A philosophical challenge to theism: if God is all-knowing, all-powerful, and all-good, why does evil/suffering exist? Theodicy attempts to reconcile these.", difficulty: "medium" },
      { front: "What is Socratic method?", back: "A form of cooperative dialogue using questioning to stimulate critical thinking and illuminate ideas. Socrates questioned beliefs until contradictions emerged.", difficulty: "easy" },
      { front: "What is determinism?", back: "The philosophical view that all events, including human actions, are completely determined by prior causes and the laws of nature, leaving no room for free will.", difficulty: "medium" },
      { front: "What is the trolley problem?", back: "An ethical thought experiment: would you divert a runaway trolley to kill 1 person instead of 5? Used to explore deontological vs. consequentialist ethics.", difficulty: "medium" },
      { front: "What is Occam's Razor?", back: "A problem-solving principle: among competing hypotheses, the one with the fewest assumptions should be selected. 'Entities should not be multiplied beyond necessity.'", difficulty: "easy" },
    ],
  },

  {
    name: "Business & Management",
    description: "Essential business concepts, strategy, and management principles.",
    tags: ["business"],
    cards: [
      { front: "What is SWOT analysis?", back: "A strategic planning tool that evaluates: Strengths, Weaknesses (internal factors), Opportunities, Threats (external factors).", difficulty: "easy" },
      { front: "What is the difference between revenue and profit?", back: "Revenue is total income from sales. Profit is revenue minus costs. Gross profit = Revenue - COGS. Net profit = Revenue - all expenses.", difficulty: "easy" },
      { front: "What is supply and demand?", back: "The economic model where price is determined by the relationship between product availability (supply) and consumer desire (demand). Price rises when demand > supply.", difficulty: "easy" },
      { front: "What is a value proposition?", back: "A clear statement of the unique benefits a product/service delivers to customers, why they should choose it over alternatives.", difficulty: "easy" },
      { front: "What is the difference between a startup and a small business?", back: "A startup is designed for rapid growth and scalable disruption, typically seeking VC funding. A small business aims for profitability and local/niche markets.", difficulty: "medium" },
      { front: "What is ROI (Return on Investment)?", back: "ROI = (Net Profit / Cost of Investment) × 100%. Measures the efficiency and profitability of an investment.", difficulty: "easy" },
      { front: "What is Porter's Five Forces?", back: "A framework analyzing competitive dynamics: threat of new entrants, bargaining power of suppliers, bargaining power of buyers, threat of substitutes, competitive rivalry.", difficulty: "medium" },
      { front: "What is a KPI?", back: "Key Performance Indicator — a measurable value that demonstrates how effectively a company is achieving key business objectives.", difficulty: "easy" },
      { front: "What is lean methodology?", back: "A management philosophy (from Toyota) focused on maximizing value while minimizing waste. Core cycle: Build → Measure → Learn.", difficulty: "medium" },
      { front: "What is B2B vs B2C?", back: "B2B (Business-to-Business): selling products/services to other businesses. B2C (Business-to-Consumer): selling directly to end consumers.", difficulty: "easy" },
      { front: "What is cash flow?", back: "The net amount of cash moving into and out of a business. Positive cash flow means more money comes in than goes out. Crucial for business survival.", difficulty: "medium" },
    ],
  },

  {
    name: "Economics Principles",
    description: "Core economic theories, concepts, and the forces that drive markets and policy.",
    tags: ["economics"],
    cards: [
      { front: "What is GDP?", back: "Gross Domestic Product — the total monetary value of all goods and services produced in a country during a specific period. The primary measure of economic size.", difficulty: "easy" },
      { front: "What is inflation?", back: "A sustained increase in the general price level of goods and services, eroding purchasing power. Measured by the Consumer Price Index (CPI).", difficulty: "easy" },
      { front: "What is opportunity cost?", back: "The value of the best alternative forgone when making a choice. Example: the opportunity cost of going to college is the salary you could have earned working instead.", difficulty: "easy" },
      { front: "What is the law of diminishing returns?", back: "Adding more of one factor of production (while holding others constant) yields progressively smaller increases in output.", difficulty: "medium" },
      { front: "What is monetary policy?", back: "Actions by a central bank (e.g., Federal Reserve) to manage money supply and interest rates to achieve macroeconomic goals: price stability, full employment, growth.", difficulty: "medium" },
      { front: "What is a market failure?", back: "A situation where the market fails to allocate resources efficiently. Causes: externalities, public goods, information asymmetry, monopoly power.", difficulty: "medium" },
      { front: "What is the multiplier effect?", back: "An economic concept where an initial increase in spending leads to a larger overall increase in national income and output, as money circulates through the economy.", difficulty: "hard" },
      { front: "What is comparative advantage?", back: "Ricardo's theory that countries should specialize in producing goods where they have the lowest opportunity cost, even if another country can produce everything more efficiently.", difficulty: "hard" },
      { front: "What is fiscal policy?", back: "Government decisions about taxation and spending to influence the economy. Expansionary fiscal policy increases spending/cuts taxes; contractionary does the opposite.", difficulty: "medium" },
      { front: "What is an oligopoly?", back: "A market structure with a small number of large firms that dominate an industry. Each firm's decisions significantly affect the others. Examples: airlines, oil companies.", difficulty: "medium" },
      { front: "What is the invisible hand?", back: "Adam Smith's metaphor for how self-interested individuals in free markets unintentionally promote the public good through price signals and competition.", difficulty: "medium" },
    ],
  },

  {
    name: "Literature & Writing",
    description: "Key literary terms, devices, and works across world literature.",
    tags: ["literature"],
    cards: [
      { front: "What is a metaphor?", back: "A figure of speech that directly compares two unlike things without using 'like' or 'as.' Example: 'Life is a journey.'", difficulty: "easy" },
      { front: "What is the difference between theme and plot?", back: "Plot: the sequence of events in a story. Theme: the central idea or underlying message the story explores (e.g., love, redemption, identity).", difficulty: "easy" },
      { front: "What is a protagonist?", back: "The main character in a story, around whom the narrative centers. Often faces conflict with an antagonist.", difficulty: "easy" },
      { front: "What is dramatic irony?", back: "When the audience knows something that a character in the story does not. Creates tension, humor, or pathos.", difficulty: "medium" },
      { front: "What is stream of consciousness?", back: "A narrative technique representing a character's inner thoughts as a continuous, unfiltered flow. Used by Joyce, Woolf, and Faulkner.", difficulty: "medium" },
      { front: "What is the Hero's Journey?", back: "Joseph Campbell's monomyth structure common to many narratives: Ordinary World → Call to Adventure → Trials → Transformation → Return. Found in Star Wars, Lord of the Rings, etc.", difficulty: "medium" },
      { front: "What is alliteration?", back: "The repetition of the same consonant sound at the beginning of closely connected words. Example: 'Peter Piper picked a peck of pickled peppers.'", difficulty: "easy" },
      { front: "What is the difference between fiction and non-fiction?", back: "Fiction is imaginative/invented narrative. Non-fiction is based on real events, people, and facts (biographies, journalism, essays).", difficulty: "easy" },
      { front: "What is a sonnet?", back: "A 14-line poem in iambic pentameter. Shakespearean sonnet: 3 quatrains + 1 couplet (ABAB CDCD EFEF GG). Petrarchan: octave + sestet.", difficulty: "medium" },
      { front: "What is magical realism?", back: "A literary style blending realistic narrative with fantastical elements presented as ordinary. Key authors: Gabriel García Márquez (100 Years of Solitude), Isabel Allende.", difficulty: "medium" },
      { front: "What is an unreliable narrator?", back: "A narrator whose credibility is compromised — through bias, limited knowledge, or deliberate deception. Examples: Humbert Humbert (Lolita), Stevens (The Remains of the Day).", difficulty: "medium" },
    ],
  },

  {
    name: "Engineering Concepts",
    description: "Core principles across mechanical, electrical, civil, and software engineering.",
    tags: ["engineering"],
    cards: [
      { front: "What is Ohm's Law?", back: "V = I × R. Voltage (V) equals Current (I) multiplied by Resistance (R). The fundamental relationship in electrical circuits.", difficulty: "easy" },
      { front: "What is stress and strain in materials?", back: "Stress: force per unit area applied to a material (σ = F/A). Strain: deformation relative to original length (ε = ΔL/L). Hooke's law: σ = Eε (within elastic limit).", difficulty: "medium" },
      { front: "What is the difference between AC and DC?", back: "DC (Direct Current): flows in one direction (batteries). AC (Alternating Current): reverses direction periodically (household power, 50/60 Hz).", difficulty: "easy" },
      { front: "What is a PID controller?", back: "Proportional–Integral–Derivative controller. A control loop mechanism that calculates error between a setpoint and measured value, applying correction. Used in thermostats, cruise control.", difficulty: "hard" },
      { front: "What is the factor of safety?", back: "The ratio of a structure's maximum capacity to the expected load. FoS = Ultimate Load / Working Load. Provides a buffer against uncertainty.", difficulty: "medium" },
      { front: "What is entropy in thermodynamics?", back: "A measure of thermal energy per unit temperature unavailable for work. The second law states entropy of an isolated system always increases.", difficulty: "hard" },
      { front: "What is impedance?", back: "The total opposition to current flow in an AC circuit, combining resistance (R) and reactance (X). Z = √(R² + X²), measured in ohms.", difficulty: "hard" },
      { front: "What is a transistor?", back: "A semiconductor device used to amplify or switch electronic signals. The fundamental building block of modern electronics — billions are in every processor.", difficulty: "medium" },
      { front: "What is Bernoulli's principle?", back: "In fluid flow, an increase in velocity causes a decrease in pressure. Explains how aircraft wings generate lift and how carburetors work.", difficulty: "medium" },
      { front: "What is the difference between serial and parallel circuits?", back: "Serial: components connected end-to-end (same current, voltages add up). Parallel: components connected to same nodes (same voltage, currents add up).", difficulty: "easy" },
      { front: "What is structural loading?", back: "Forces applied to a structure: dead loads (permanent, self-weight), live loads (variable, occupancy), environmental loads (wind, seismic, snow).", difficulty: "medium" },
    ],
  },

  {
    name: "Language Learning Guide",
    description: "Strategies and tips for learning any foreign language effectively.",
    tags: ["languages"],
    cards: [
      { front: "What is spaced repetition?", back: "A learning technique where you review material at increasing intervals over time. More effective than cramming because it exploits the 'spacing effect' in memory formation.", difficulty: "easy" },
      { front: "What are the CEFR language levels?", back: "Common European Framework of Reference: A1 (Beginner), A2 (Elementary), B1 (Intermediate), B2 (Upper-Intermediate), C1 (Advanced), C2 (Mastery).", difficulty: "easy" },
      { front: "What is comprehensible input?", back: "Krashen's theory that language acquisition happens when learners understand messages slightly above their current level (i+1). Key to natural language learning.", difficulty: "medium" },
      { front: "What is a cognate?", back: "A word in one language that shares a common etymological origin with a word in another language, often similar in form and meaning. Example: 'animal' in English/Spanish/French.", difficulty: "easy" },
      { front: "What is the 'silent period' in language learning?", back: "A stage where learners absorb the new language without producing it. Normal and healthy — similar to how children listen for months before speaking.", difficulty: "medium" },
      { front: "What are false friends (false cognates)?", back: "Words in two languages that look/sound similar but have different meanings. Example: 'embarazada' in Spanish means 'pregnant', not 'embarrassed'.", difficulty: "easy" },
      { front: "What is immersion in language learning?", back: "Surrounding yourself with the target language as much as possible: consuming media, thinking, journaling, and conversing exclusively in that language.", difficulty: "easy" },
      { front: "What is shadowing?", back: "A language learning technique where you listen and repeat spoken language simultaneously, mimicking the speaker's intonation, rhythm, and pronunciation.", difficulty: "medium" },
      { front: "How many words do you need to have basic conversations?", back: "Research suggests the 1,000 most common words cover ~85% of everyday speech. 3,000 words covers most conversations; 10,000 for near-native fluency.", difficulty: "medium" },
      { front: "What is language attrition?", back: "The gradual loss of proficiency in a language due to lack of use. Even your native language can show attrition if you don't use it for extended periods.", difficulty: "hard" },
      { front: "What is the best age to learn a language?", back: "Children have a critical period for accent acquisition (before puberty). However, adults learn faster initially due to cognitive skills. Any age is a great time to start.", difficulty: "easy" },
    ],
  },

  // ─── LANGUAGE LEARNING DECKS ────────────────────────────────────────────────

  {
    name: "English Essentials",
    description: "Essential English vocabulary and phrases for everyday communication.",
    tags: ["languages", "english"],
    cards: [
      { front: "Hello / Hi", back: "A greeting used when meeting someone. 'Hello' is more formal; 'Hi' is casual. Example: 'Hi, how are you?'", difficulty: "easy" },
      { front: "What does 'although' mean?", back: "'Although' introduces a contrast: 'Although it was raining, we went for a walk.' Synonyms: even though, despite the fact that.", difficulty: "easy" },
      { front: "Difference between 'its' and 'it's'", back: "'Its' is possessive (the dog wagged its tail). 'It's' is a contraction of 'it is' or 'it has' (It's raining).", difficulty: "medium" },
      { front: "What is the present perfect tense?", back: "Used for actions that happened at an unspecified time or that started in the past and continue now. Form: have/has + past participle. Example: 'I have visited Paris.'", difficulty: "medium" },
      { front: "How do you use 'who' vs 'whom'?", back: "'Who' is a subject (Who called?). 'Whom' is an object (To whom did you speak?). Trick: if you can replace with 'him', use 'whom'.", difficulty: "hard" },
      { front: "What does 'nevertheless' mean?", back: "Despite what has just been said; however. Example: 'The task was difficult. Nevertheless, we completed it on time.'", difficulty: "medium" },
      { front: "What is a phrasal verb?", back: "A verb + preposition/adverb combination with a specific meaning. Examples: 'give up' (stop), 'look after' (take care of), 'run into' (meet by chance).", difficulty: "medium" },
      { front: "Difference between 'affect' and 'effect'", back: "'Affect' is usually a verb (The weather affects my mood). 'Effect' is usually a noun (The effect was immediate). RAVEN: Remember Affect Verb Effect Noun.", difficulty: "medium" },
      { front: "What does 'ambiguous' mean?", back: "Open to more than one interpretation; not having a single clear meaning. Example: 'The message was ambiguous — I couldn't tell if it was serious.'", difficulty: "medium" },
      { front: "How to use articles: a, an, the?", back: "'A' before consonant sounds (a cat). 'An' before vowel sounds (an apple). 'The' for specific/known nouns (the car I bought). No article for general plurals (Dogs are loyal).", difficulty: "medium" },
      { front: "What is passive voice?", back: "Subject receives the action: 'The book was written by Tolkien.' Active: 'Tolkien wrote the book.' Passive emphasizes the receiver or when the doer is unknown.", difficulty: "medium" },
    ],
  },

  {
    name: "Português Essencial",
    description: "Vocabulário e frases essenciais em português para comunicação do dia a dia.",
    tags: ["languages", "portuguese"],
    cards: [
      { front: "How do you say 'thank you' in Portuguese?", back: "'Obrigado' (said by males) / 'Obrigada' (said by females). Informal: 'Valeu!' Very formal: 'Muito obrigado/a.'", difficulty: "easy" },
      { front: "What are the Portuguese personal pronouns?", back: "eu (I), tu/você (you), ele/ela (he/she), nós (we), vós/vocês (you all), eles/elas (they). 'Você' is used instead of 'tu' in Brazil.", difficulty: "easy" },
      { front: "How do you conjugate 'ser' (to be) in present tense?", back: "eu sou, tu és, ele/ela é, nós somos, vós sois, eles/elas são. 'Ser' is used for permanent characteristics.", difficulty: "medium" },
      { front: "What is the difference between 'ser' and 'estar'?", back: "'Ser' = permanent qualities (I am tall, she is Brazilian). 'Estar' = temporary states (I am tired, the coffee is hot).", difficulty: "medium" },
      { front: "What are the nasal vowels in Portuguese?", back: "ã, em, im, om, um, ão — produced with air flowing through the nose. Example: 'pão' (bread), 'irmão' (brother). A distinctive feature of Portuguese.", difficulty: "medium" },
      { front: "How do you say 'I would like...' in Portuguese?", back: "'Eu gostaria de...' (formal) or 'Eu queria...' (informal). Example: 'Eu gostaria de um café, por favor.' (I'd like a coffee, please.)", difficulty: "easy" },
      { front: "What is the difference between European and Brazilian Portuguese?", back: "Different pronunciation (EP sounds more closed/consonant-heavy), vocabulary (autocarro vs. ônibus = bus), and some grammar. Both are mutually intelligible.", difficulty: "medium" },
      { front: "How do you form the past tense (pretérito perfeito) in Portuguese?", back: "For -ar verbs: fal-ei, fal-aste, fal-ou, fal-ámos, fal-aram. Example: 'Eu falei' = 'I spoke'. Irregular: fui (I was/went), tive (I had).", difficulty: "hard" },
      { front: "What are common false friends between Portuguese and English?", back: "borracha (rubber, not brat), polvo (octopus, not powder), exquisito (strange, not exquisite), bordar (to embroider, not to board).", difficulty: "medium" },
      { front: "How do you say the days of the week in Portuguese?", back: "segunda-feira, terça-feira, quarta-feira, quinta-feira, sexta-feira, sábado, domingo. Days named after feiras (markets) except Saturday and Sunday.", difficulty: "easy" },
    ],
  },

  {
    name: "Español para Principiantes",
    description: "Vocabulario esencial y frases de uso diario en español.",
    tags: ["languages", "spanish"],
    cards: [
      { front: "How do you say 'please' and 'thank you' in Spanish?", back: "'Por favor' (please) and 'Gracias' (thank you). 'De nada' = you're welcome. 'Muchas gracias' = many thanks.", difficulty: "easy" },
      { front: "What is the difference between 'ser' and 'estar' in Spanish?", back: "'Ser' for permanent/inherent qualities (Soy alto — I am tall). 'Estar' for temporary states or location (Estoy cansado — I am tired; El libro está en la mesa).", difficulty: "medium" },
      { front: "How do you conjugate regular -ar verbs in present tense?", back: "hablar: hablo, hablas, habla, hablamos, habláis, hablan. Remove -ar, add: -o, -as, -a, -amos, -áis, -an.", difficulty: "medium" },
      { front: "What are the Spanish subject pronouns?", back: "yo, tú, él/ella/usted, nosotros, vosotros, ellos/ellas/ustedes. 'Usted' is formal 'you'. 'Vosotros' is used in Spain; 'ustedes' everywhere.", difficulty: "easy" },
      { front: "What are the numbers 1–10 in Spanish?", back: "uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez.", difficulty: "easy" },
      { front: "How do you say 'Where is...?' in Spanish?", back: "'¿Dónde está...?' Example: '¿Dónde está el baño?' (Where is the bathroom?). '¿Dónde están...?' for plural.", difficulty: "easy" },
      { front: "What is the 'a personal' in Spanish?", back: "When the direct object of a verb is a specific person or pet, you add 'a' before it. Example: 'Veo a María' (I see Maria) but 'Veo la película' (I see the film).", difficulty: "hard" },
      { front: "How do you form the past tense (pretérito) for regular verbs?", back: "-ar verbs: hablé, hablaste, habló, hablamos, hablasteis, hablaron. -er/-ir: comí, comiste, comió, comimos, comisteis, comieron.", difficulty: "hard" },
      { front: "What are the most common irregular verbs in Spanish?", back: "ser/estar (to be), tener (to have), ir (to go), hacer (to do/make), poder (can), querer (to want), venir (to come), saber (to know), decir (to say).", difficulty: "medium" },
      { front: "How do you say 'I don't understand' in Spanish?", back: "'No entiendo.' or 'No comprendo.' Useful phrases: '¿Puede repetir, por favor?' (Can you repeat?) '¿Más despacio, por favor.' (More slowly, please.)", difficulty: "easy" },
    ],
  },

  {
    name: "Français pour Débutants",
    description: "Vocabulaire essentiel et expressions quotidiennes en français.",
    tags: ["languages", "french"],
    cards: [
      { front: "How do you greet someone in French?", back: "Bonjour (Good day/Hello — formal), Salut (Hi — informal), Bonsoir (Good evening). 'Comment allez-vous?' (formal) or 'Comment ça va?' (informal) = How are you?", difficulty: "easy" },
      { front: "What is grammatical gender in French?", back: "All French nouns are masculine (le/un) or feminine (la/une). Must be memorized per word. Adjectives agree in gender/number with the noun they modify.", difficulty: "medium" },
      { front: "How do you conjugate 'être' (to be) in present tense?", back: "je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont.", difficulty: "medium" },
      { front: "What is the difference between 'tu' and 'vous'?", back: "'Tu' is informal singular (friends, family, children). 'Vous' is formal singular OR plural. Always use 'vous' with strangers and in professional settings.", difficulty: "easy" },
      { front: "How do you say 'I would like...' in French?", back: "'Je voudrais...' (polite). Example: 'Je voudrais un café, s'il vous plaît.' (I would like a coffee, please.)", difficulty: "easy" },
      { front: "What are the liaison rules in French?", back: "When a word ending in a normally silent consonant is followed by a word starting with a vowel, the consonant is pronounced. Example: 'les amis' = 'lez amis'.", difficulty: "hard" },
      { front: "How do you form negation in French?", back: "Wrap the verb with 'ne...pas': Je ne parle pas (I don't speak). In spoken French, 'ne' is often dropped: Je parle pas.", difficulty: "medium" },
      { front: "What are the French nasal sounds?", back: "an/en (like in 'enfant'), in/im (like in 'important'), on (like in 'bon'), un/um. Produced by lowering the velum so air passes through the nose.", difficulty: "hard" },
      { front: "How do you say the days of the week in French?", back: "lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche. Days are not capitalized in French.", difficulty: "easy" },
      { front: "What is the passé composé?", back: "The main past tense in spoken French. Formed with avoir/être + past participle. 'J'ai mangé' (I ate). Verbs of motion use être: 'Je suis allé' (I went).", difficulty: "medium" },
    ],
  },

  {
    name: "Deutsch für Anfänger",
    description: "Grundwortschatz und Alltagsphrasen auf Deutsch.",
    tags: ["languages", "german"],
    cards: [
      { front: "How do you say 'please' and 'thank you' in German?", back: "'Bitte' (please / you're welcome) and 'Danke' (thank you). 'Danke schön' = thank you very much. 'Bitte schön' = you're very welcome.", difficulty: "easy" },
      { front: "What are the German grammatical cases?", back: "Nominative (subject), Accusative (direct object), Dative (indirect object), Genitive (possession). Articles change: der/die/das → den/die/das (acc.) → dem/der/dem (dat.).", difficulty: "hard" },
      { front: "What are the German personal pronouns?", back: "ich, du, er/sie/es, wir, ihr, sie/Sie. 'Sie' (capitalized) = formal 'you'. 'ihr' = informal plural you.", difficulty: "easy" },
      { front: "How do you conjugate 'sein' (to be) in present tense?", back: "ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind.", difficulty: "medium" },
      { front: "What are compound nouns in German?", back: "German combines nouns into long words. The last noun determines gender and meaning. Example: Donaudampfschifffahrtsgesellschaft (Danube steamship company). The gender is Gesellschaft (f.) = die.", difficulty: "medium" },
      { front: "What are the modal verbs in German?", back: "können (can), müssen (must), wollen (want), sollen (should), dürfen (may/allowed), mögen (like). They modify main verbs sent to the end: 'Ich kann Deutsch sprechen.'", difficulty: "medium" },
      { front: "What is the difference between 'du' and 'Sie'?", back: "'Du' is informal (friends, family, children, animals). 'Sie' (always capitalized) is formal (strangers, professionals, elders). Use 'Sie' by default with adults you don't know.", difficulty: "easy" },
      { front: "How do separable verbs work in German?", back: "Some verbs have a prefix that separates in main clauses: anrufen (to call) → Ich rufe dich an (I'm calling you). Prefix goes to end; reconnected in infinitive/past.", difficulty: "hard" },
      { front: "What is the Umlaut in German?", back: "Umlauts are modified vowels: ä, ö, ü. They change pronunciation and meaning. Example: Mutter (mother) vs. Mütter (mothers). Never substitute with ae, oe, ue in handwriting.", difficulty: "medium" },
      { front: "How do you form the past tense (Perfekt) in German?", back: "Most common in spoken German: haben/sein + past participle at end. 'Ich habe gegessen' (I ate). Motion/state verbs use sein: 'Ich bin gegangen' (I went).", difficulty: "hard" },
    ],
  },

  {
    name: "日本語 入門 (Japanese for Beginners)",
    description: "Essential Japanese vocabulary, grammar, and writing systems.",
    tags: ["languages", "japanese"],
    cards: [
      { front: "What are the three Japanese writing systems?", back: "Hiragana (phonetic, 46 characters, for Japanese words), Katakana (phonetic, 46 characters, for foreign words), Kanji (Chinese-origin characters, thousands).", difficulty: "easy" },
      { front: "How do you greet in Japanese?", back: "おはようございます (Ohayō gozaimasu) = Good morning. こんにちは (Konnichiwa) = Hello/Good afternoon. こんばんは (Konbanwa) = Good evening.", difficulty: "easy" },
      { front: "What is the basic Japanese sentence structure?", back: "Subject-Object-Verb (SOV). Example: 私は日本語を勉強します (I Japanese study = I study Japanese). The verb always comes last.", difficulty: "medium" },
      { front: "What are Japanese particles?", back: "Grammatical markers that indicate a word's role in the sentence. は (wa) = topic marker, が (ga) = subject, を (wo) = object, に (ni) = direction/location, で (de) = means/place of action.", difficulty: "medium" },
      { front: "What is the polite verb ending in Japanese?", back: "ます (masu) is added to make verbs polite. Dictionary form: 食べる (taberu = to eat) → Polite: 食べます (tabemasu). です (desu) makes nouns/adjectives polite.", difficulty: "medium" },
      { front: "How do you count in Japanese (1-10)?", back: "一(ichi), 二(ni), 三(san), 四(shi/yon), 五(go), 六(roku), 七(shichi/nana), 八(hachi), 九(ku/kyū), 十(jū).", difficulty: "easy" },
      { front: "What are counters in Japanese?", back: "Japanese uses counters (助数詞) with numbers depending on what's counted: 枚 (mai) for flat things, 本 (hon) for long things, 匹 (hiki) for small animals, 人 (nin) for people.", difficulty: "hard" },
      { front: "What is keigo (敬語)?", back: "The system of honorific Japanese used to show respect. Sonkeigo (respectful), Kenjōgo (humble), Teineigo (polite). Essential in business and formal situations.", difficulty: "hard" },
      { front: "How do you say 'I don't understand' in Japanese?", back: "わかりません (Wakarimasen). 'もう一度お願いします' (Mō ichido onegaishimasu) = Please say it once more.", difficulty: "easy" },
      { front: "What is hiragana vs. katakana?", back: "Hiragana: rounded characters for native Japanese words and grammar. Katakana: angular characters for foreign loanwords (コーヒー = kōhī = coffee), emphasis, and scientific terms.", difficulty: "easy" },
    ],
  },

  {
    name: "한국어 기초 (Korean for Beginners)",
    description: "Essential Korean vocabulary, Hangul basics, and everyday expressions.",
    tags: ["languages", "korean"],
    cards: [
      { front: "What is Hangul?", back: "The Korean alphabet, created in 1443 by King Sejong. It has 14 basic consonants and 10 basic vowels, combined into syllable blocks. Considered one of the most scientific writing systems.", difficulty: "easy" },
      { front: "How do you say 'hello' in Korean?", back: "안녕하세요 (Annyeonghaseyo) — formal. 안녕 (Annyeong) — informal. 여보세요 (Yeoboseyo) — on the phone.", difficulty: "easy" },
      { front: "What is the Korean sentence structure?", back: "Subject-Object-Verb (SOV), like Japanese. Example: 나는 한국어를 공부해요 (I Korean study = I study Korean). Verb always last.", difficulty: "medium" },
      { front: "What are Korean speech levels?", back: "Korean has different formality levels: 합쇼체 (very formal), 해요체 (polite), 해체 (informal), 해라체 (plain/commands). 해요체 is the safest for learners.", difficulty: "hard" },
      { front: "How do you count in Korean? (Native numbers 1-5)", back: "하나 (hana), 둘 (dul), 셋 (set), 넷 (net), 다섯 (daseot). Used with counters for objects, age, hours.", difficulty: "medium" },
      { front: "What are Korean topic vs. subject markers?", back: "은/는 (eun/neun) = topic marker. 이/가 (i/ga) = subject marker. Topic introduces or contrasts; subject states new information. Critical distinction in Korean grammar.", difficulty: "hard" },
      { front: "How do you say 'thank you' in Korean?", back: "감사합니다 (Gamsahamnida) — formal. 고마워요 (Gomawoyo) — polite. 고마워 (Gomawo) — informal.", difficulty: "easy" },
      { front: "What are the Korean vowels (모음)?", back: "Basic: ㅏ(a), ㅣ(i), ㅗ(o), ㅜ(u), ㅡ(eu). Compound: ㅐ(ae), ㅔ(e), ㅘ(wa), ㅝ(wo). Combined with consonants into syllable blocks.", difficulty: "medium" },
      { front: "What is 존댓말 (Jondaemal) vs. 반말 (Banmal)?", back: "Jondaemal = formal/polite speech (used with strangers, elders, higher status). Banmal = informal speech (used with close friends, younger people). Using wrong level is rude.", difficulty: "medium" },
      { front: "What does 아/어요 (a/eoyo) do in Korean?", back: "It's the polite present tense ending. Added to verb stems: 먹다 (to eat) → 먹어요 (I/you/he eat). The 'a' or 'eo' depends on the last vowel of the stem (vowel harmony).", difficulty: "hard" },
    ],
  },

  {
    name: "中文基础 (Mandarin Chinese Basics)",
    description: "Essential Mandarin vocabulary, tones, and everyday expressions.",
    tags: ["languages", "chinese"],
    cards: [
      { front: "What are the four tones in Mandarin Chinese?", back: "1st tone: flat/high (mā — mother). 2nd tone: rising (má — hemp). 3rd tone: falling-rising (mǎ — horse). 4th tone: falling (mà — scold). Tone changes meaning entirely.", difficulty: "medium" },
      { front: "What is Pinyin?", back: "The official romanization system for Mandarin Chinese, using the Latin alphabet to represent sounds. Includes tone marks. Essential for beginners and typing Chinese.", difficulty: "easy" },
      { front: "How do you greet in Mandarin?", back: "你好 (Nǐ hǎo) = Hello (informal). 您好 (Nín hǎo) = Hello (formal/respectful). 早上好 (Zǎoshang hǎo) = Good morning. 谢谢 (Xièxie) = Thank you.", difficulty: "easy" },
      { front: "What is the basic Mandarin sentence structure?", back: "Subject-Verb-Object (SVO), similar to English. Example: 我学中文 (Wǒ xué Zhōngwén = I study Chinese). Time expressions come before the verb.", difficulty: "easy" },
      { front: "What are measure words (量词) in Chinese?", back: "Chinese requires measure words between numbers and nouns. 一个人 (yī gè rén = one person), 一本书 (yī běn shū = one book), 一张纸 (yī zhāng zhǐ = one sheet of paper). 个 (gè) is the most versatile.", difficulty: "hard" },
      { front: "How do you say 'I don't understand' in Mandarin?", back: "我听不懂 (Wǒ tīng bù dǒng) = I don't understand (by listening). 我看不懂 (Wǒ kàn bù dǒng) = I don't understand (by reading).", difficulty: "easy" },
      { front: "What is the difference between Traditional and Simplified Chinese?", back: "Simplified: used in mainland China and Singapore, with fewer strokes (我 stays 我). Traditional: used in Taiwan, Hong Kong, Macau (with more complex characters).", difficulty: "easy" },
      { front: "How do you ask 'How much does this cost?' in Mandarin?", back: "这个多少钱？(Zhège duōshǎo qián?) — literally 'This how much money?' Useful in any shopping situation.", difficulty: "easy" },
      { front: "What is the character 的 (de) used for in Chinese?", back: "的 is a structural particle indicating possession or linking adjectives to nouns. 我的书 (wǒ de shū = my book). 红色的苹果 (hóngsè de píngguǒ = red apple).", difficulty: "medium" },
      { front: "What are the numbers 1–10 in Mandarin?", back: "一(yī), 二(èr), 三(sān), 四(sì), 五(wǔ), 六(liù), 七(qī), 八(bā), 九(jiǔ), 十(shí).", difficulty: "easy" },
    ],
  },

  {
    name: "Italiano per Principianti",
    description: "Vocabolario essenziale e frasi quotidiane in italiano.",
    tags: ["languages", "italian"],
    cards: [
      { front: "How do you greet in Italian?", back: "Ciao (hi/bye — informal), Buongiorno (Good morning/day — formal), Buonasera (Good evening), Buonanotte (Good night). Come stai? (How are you? — informal).", difficulty: "easy" },
      { front: "What are the Italian subject pronouns?", back: "io, tu, lui/lei, noi, voi, loro. Note: 'Lei' (capitalized) is also the formal 'you' (like German 'Sie').", difficulty: "easy" },
      { front: "How do you conjugate 'essere' (to be) in present tense?", back: "io sono, tu sei, lui/lei è, noi siamo, voi siete, loro sono.", difficulty: "medium" },
      { front: "What is grammatical gender in Italian?", back: "All nouns are masculine or feminine. Generally: -o endings are masculine (il libro), -a endings are feminine (la casa). Adjectives agree with noun gender and number.", difficulty: "easy" },
      { front: "How do you say 'I would like...' in Italian?", back: "'Vorrei...' (polite, from volere). Example: 'Vorrei un caffè, per favore.' (I would like a coffee, please.)", difficulty: "easy" },
      { front: "What are double consonants in Italian?", back: "Italian has genuine double consonants (geminates) that are pronounced longer and affect word meaning. 'Pala' (shovel) vs. 'Palla' (ball). Critical for correct pronunciation.", difficulty: "medium" },
      { front: "What is the difference between 'c' and 'ch' in Italian?", back: "Before e/i: 'c' = /ch/ sound (cena = chenna). Before a/o/u: 'c' = /k/ (casa). 'Ch' before e/i gives /k/ (che = ke). 'G' follows the same logic.", difficulty: "medium" },
      { front: "How do you form the past tense (passato prossimo) in Italian?", back: "avere/essere + past participle. 'Ho mangiato' (I ate — avere). 'Sono andato' (I went — essere). Motion and reflexive verbs use essere; past participle agrees in gender.", difficulty: "hard" },
      { front: "What is the subjunctive mood (congiuntivo) used for in Italian?", back: "Used after verbs of wanting, thinking, doubt, emotion, and after 'che'. 'Voglio che tu venga' (I want you to come). More common in Italian than in Spanish or English.", difficulty: "hard" },
      { front: "What are some essential Italian phrases for traveling?", back: "Dov'è...? (Where is...?), Quanto costa? (How much?), Non capisco (I don't understand), Parla inglese? (Do you speak English?), Mi può aiutare? (Can you help me?)", difficulty: "easy" },
    ],
  },

  {
    name: "العربية للمبتدئين (Arabic for Beginners)",
    description: "Essential Arabic vocabulary, script basics, and everyday expressions.",
    tags: ["languages", "arabic"],
    cards: [
      { front: "What script does Arabic use?", back: "Arabic script is written right to left, with 28 letters. Most letters connect to others and change shape depending on position (initial, medial, final, isolated).", difficulty: "easy" },
      { front: "How do you greet in Arabic?", back: "السلام عليكم (As-salāmu ʿalaykum = Peace be upon you — universal greeting). مرحبا (Marhaba = Hello). صباح الخير (Sabah al-khayr = Good morning).", difficulty: "easy" },
      { front: "What is Modern Standard Arabic (MSA) vs. dialects?", back: "MSA (الفصحى) is the formal written language used in media, education, and formal speech. Colloquial dialects (Egyptian, Levantine, Gulf, Moroccan) differ significantly in speech.", difficulty: "medium" },
      { front: "What are the Arabic sun and moon letters?", back: "Sun letters (14) assimilate the 'l' in the definite article: al-shams → ash-shams. Moon letters (14) do not: al-qamar stays al-qamar. Affects pronunciation, not writing.", difficulty: "hard" },
      { front: "What is the dual form in Arabic?", back: "Arabic has singular, dual, and plural. Dual is formed by adding ان- (ān) to the noun: كتاب (kitāb = book) → كتابان (kitābān = two books). Distinct from both singular and plural.", difficulty: "hard" },
      { front: "How do you say 'thank you' in Arabic?", back: "شكرا (Shukran = Thank you). شكرا جزيلا (Shukran jazīlan = Thank you very much). عفوا (ʿAfwan = You're welcome).", difficulty: "easy" },
      { front: "What are Arabic root words (جذور)?", back: "Arabic is a root-based language. Most words derive from 3-letter roots. Root ك-ت-ب (k-t-b) relates to writing: كتب (kataba = he wrote), كتاب (kitāb = book), مكتب (maktab = office).", difficulty: "hard" },
      { front: "What are the Arabic vowel marks (Tashkeel)?", back: "Short vowels are shown by diacritics above/below letters: فتحة (fatha = 'a'), كسرة (kasra = 'i'), ضمة (damma = 'u'). Usually omitted in everyday writing — readers infer from context.", difficulty: "hard" },
      { front: "What are the numbers 1–5 in Arabic?", back: "واحد (wāḥid = 1), اثنان (ithnān = 2), ثلاثة (thalātha = 3), أربعة (arbaʿa = 4), خمسة (khamsa = 5). Arabic numerals (١٢٣٤٥) are used in most Arabic-speaking countries.", difficulty: "medium" },
      { front: "What is masculine and feminine in Arabic?", back: "Arabic nouns have grammatical gender. Feminine nouns often end in ة (tā marbūṭa): مدرسة (madrasa = school), طالبة (ṭāliba = female student). Adjectives must agree in gender.", difficulty: "medium" },
    ],
  },

  {
    name: "हिंदी के लिए बुनियाद (Hindi Basics)",
    description: "Essential Hindi vocabulary, Devanagari script introduction, and daily phrases.",
    tags: ["languages", "hindi"],
    cards: [
      { front: "What script does Hindi use?", back: "Devanagari (देवनागरी), written left to right. 11 vowels and 33 consonants. Characters are connected by a horizontal line (मात्रा). Also used for Sanskrit, Marathi, and Nepali.", difficulty: "easy" },
      { front: "How do you greet in Hindi?", back: "नमस्ते (Namaste) — universal greeting with hands pressed together. Also नमस्कार (Namaskar — more formal). आप कैसे हैं? (Āp kaise hain? = How are you? — formal).", difficulty: "easy" },
      { front: "What is the Hindi sentence structure?", back: "Subject-Object-Verb (SOV). Example: मैं हिंदी सीखता हूँ (Main Hindī sīkhtā hūn = I Hindi learn = I learn Hindi). Verb always comes last.", difficulty: "medium" },
      { front: "How do you say the numbers 1–5 in Hindi?", back: "एक (ek = 1), दो (do = 2), तीन (tīn = 3), चार (cār = 4), पाँच (pāñc = 5).", difficulty: "easy" },
      { front: "What are postpositions in Hindi?", back: "Hindi uses postpositions (after nouns) instead of prepositions. में (mein = in), पर (par = on), को (ko = to/for), से (se = from/with), का/की/के (kā/kī/ke = of/possessive).", difficulty: "medium" },
      { front: "How do verbs agree in Hindi?", back: "Hindi verbs agree with the subject in gender (masculine/feminine) and number. 'वह जाता है' (He goes) vs. 'वह जाती है' (She goes). Gender distinction is crucial.", difficulty: "hard" },
      { front: "What are the aspirated vs. unaspirated consonants in Hindi?", back: "Hindi distinguishes aspirated (with a puff of air: ख, घ, थ, ध, छ, झ) and unaspirated (क, ग, त, द, च, ज) consonants. These are separate phonemes changing word meaning.", difficulty: "hard" },
      { front: "How do you say 'please' and 'thank you' in Hindi?", back: "कृपया (Kripyā = please — formal). धन्यवाद (Dhanyavād = thank you — formal). शुक्रिया (Shukriyā = thanks — informal/Urdu-influenced).", difficulty: "easy" },
      { front: "What is the difference between आप, तुम, and तू?", back: "Three levels of 'you': आप (āp) = very formal/respectful. तुम (tum) = informal but polite. तू (tū) = very informal/intimate. Wrong usage can seem rude.", difficulty: "medium" },
      { front: "What is the Schwa deletion rule in Hindi?", back: "The inherent 'a' vowel (schwa) in Devanagari is often deleted in pronunciation, especially at the end of words. 'कमल' (kamal) is pronounced 'kaml'. Essential for natural speech.", difficulty: "hard" },
    ],
  },

  {
    name: "Русский для начинающих (Russian for Beginners)",
    description: "Essential Russian vocabulary, Cyrillic basics, and everyday expressions.",
    tags: ["languages", "russian"],
    cards: [
      { front: "What alphabet does Russian use?", back: "Cyrillic (кириллица), with 33 letters. Some look like Latin letters but sound different (Р = R, not P; Н = N; С = S). Created in the 9th century by Saints Cyril and Methodius.", difficulty: "easy" },
      { front: "How do you greet in Russian?", back: "Привет (Privet = Hi — informal). Здравствуйте (Zdravstvuyte = Hello — formal). Доброе утро (Dobroye utro = Good morning). Как дела? (Kak dela? = How are you?)", difficulty: "easy" },
      { front: "What are the Russian grammatical cases?", back: "6 cases: Nominative (subject), Accusative (direct object), Genitive (possession/negation), Dative (indirect object), Instrumental (means/with), Prepositional (after prepositions). Endings change per case.", difficulty: "hard" },
      { front: "What is grammatical gender in Russian?", back: "Three genders: masculine (ending in consonant or -й/-ь), feminine (ending in -а/-я/-ь), neuter (ending in -о/-е/-мя). Adjectives agree in gender, number, and case.", difficulty: "medium" },
      { front: "What is the difference between perfective and imperfective verbs in Russian?", back: "Imperfective: ongoing/repeated action (читать = to read/be reading). Perfective: completed action (прочитать = to finish reading). Every Russian verb exists in both aspects.", difficulty: "hard" },
      { front: "How do you say 'I don't understand' in Russian?", back: "Я не понимаю (Ya ne ponimayu = I don't understand). Повторите, пожалуйста (Povtorite, pozhaluysta = Please repeat). Говорите медленнее (Govorite medlennee = Speak more slowly).", difficulty: "easy" },
      { front: "What is the soft sign (ь) in Russian?", back: "A non-phonetic letter that softens the preceding consonant (palatalizes it). 'Брат' (brat = brother) vs. 'брать' (brat' = to take). Changes pronunciation and sometimes meaning.", difficulty: "medium" },
      { front: "How do you say 'please' and 'thank you' in Russian?", back: "Пожалуйста (Pozhaluysta = please / you're welcome). Спасибо (Spasibo = thank you). Большое спасибо (Bolshoye spasibo = thank you very much).", difficulty: "easy" },
      { front: "What are the numbers 1–5 in Russian?", back: "один/одна (odin/odna = 1), два/две (dva/dve = 2), три (tri = 3), четыре (chetyre = 4), пять (pyat' = 5). 1 and 2 have gender forms.", difficulty: "medium" },
      { front: "What is vowel reduction in Russian?", back: "Unstressed vowels are pronounced differently. 'О' unstressed → sounds like 'a'. 'Молоко' (milk) = ma-la-KO (the stressed О is clear; others reduce). Critical for natural pronunciation.", difficulty: "hard" },
    ],
  },
];

async function seed() {
  console.log("🌱 Seeding starter decks...");

  let deckCount = 0;
  let cardCount = 0;

  for (const deckData of STARTER_DECKS) {
    // Check if a deck with this name already exists (idempotent)
    const existing = await db
      .select({ id: decks.id })
      .from(decks)
      .where(sql`lower(${decks.name}) = lower(${deckData.name}) and ${decks.ownerId} is null`)
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ⏩ Skipped (already exists): ${deckData.name}`);
      continue;
    }

    const [deck] = await db
      .insert(decks)
      .values({
        ownerId: null,
        name: deckData.name,
        description: deckData.description,
        tags: deckData.tags,
        visibility: "public",
        stats: {
          totalCards: deckData.cards.length,
          newCards: deckData.cards.length,
          learningCards: 0,
          reviewCards: 0,
          masteredCards: 0,
        },
      })
      .returning();

    await db.insert(flashcards).values(
      deckData.cards.map((card) => ({
        deckId: deck!.id,
        front: card.front,
        back: card.back,
        difficulty: card.difficulty ?? "medium",
        source: { type: "manual" as const },
      }))
    );

    deckCount++;
    cardCount += deckData.cards.length;
    console.log(`  ✅ Created: ${deckData.name} (${deckData.cards.length} cards)`);
  }

  console.log(`\n✨ Done! Created ${deckCount} decks with ${cardCount} cards.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
