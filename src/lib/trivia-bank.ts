export type TriviaSeed = {
  id: string;
  text: string;
  imageUrls: string[];
  options: string[];
  correctIndex: number;
  timeLimitSeconds: number;
};

// Banco del interrogatorio: preguntas sobre JL.
// `correctIndex` es la posición de la alternativa correcta empezando en 0
// (0 = a, 1 = b, 2 = c, 3 = d).
//
// La respuesta correcta se guarda en una colección aparte (triviaKeys) que
// solo el admin puede leer — ver src/lib/trivia.ts y firestore.rules.
export const TRIVIA_BANK: TriviaSeed[] = [
  {
    id: "t01",
    text: "¿Cuál es mi jugador de fútbol favorito de todos los tiempos?",
    imageUrls: [
      "/img/1_1.png",
      "/img/1_20220626_210515.jpg",
      "/img/1_20230813_014711.jpg",
      "/img/1_20230902_181118.jpg",
      "/img/1_20250215_180059.jpg",
      "/img/1_20250301_211444(0).jpg",
      "/img/1_20250806_131308.jpg",
      "/img/1_FB_IMG_1700636865574.jpg",
      "/img/1_screen.jpg",
    ],
    options: ["Lionel Messi", "Eden Hazard", "Didier Drogba", "Paolo Guerrero"],
    correctIndex: 1,
    timeLimitSeconds: 20,
  },
  {
    id: "t02",
    text: "¿Cuál es mi canción favorita de toda la vida?",
    imageUrls: [],
    options: [
      "Tornado of Souls — Megadeth",
      "Break Stuff — Limp Bizkit",
      "Chop Suey — System of a Down",
      "Dear God — Avenged Sevenfold",
    ],
    correctIndex: 3,
    timeLimitSeconds: 25,
  },
  {
    id: "t03",
    text: "¿En qué año me gradué de la universidad?",
    imageUrls: [],
    options: ["2020", "2021", "2022", "2023"],
    correctIndex: 1,
    timeLimitSeconds: 20,
  },
  {
    id: "t04",
    text: "¿Cuántos idiomas sé hablar, incluido el español?",
    imageUrls: [],
    options: ["2", "5", "3", "4"],
    correctIndex: 3,
    timeLimitSeconds: 20,
  },
  {
    id: "t05",
    text: "¿Qué carrera estudié y qué maestría quiero seguir?",
    imageUrls: [],
    options: [
      "Ing. Eléctrica — Máster en Ing. Electrónica",
      "Ing. de Software — Máster en Ing. de Software",
      "Ing. Mecatrónica — Máster en Inteligencia Artificial",
      "Ing. Electrónica — Máster en Ing. de Software",
    ],
    correctIndex: 3,
    timeLimitSeconds: 30,
  },
  {
    id: "t06",
    text: "¿Cuál es mi Top 3 de golosinas favoritas (de más a menos)?",
    imageUrls: [],
    options: [
      "Cua Cua, Doña Pepa, Pokeke",
      "Cua Cua, Pokeke, Chocman",
      "Pokeke, Vizio, Cua Cua",
      "Chocman, Cua Cua, Obsesión",
    ],
    correctIndex: 1,
    timeLimitSeconds: 30,
  },
  {
    id: "t07",
    text: "¿Cuál es el apodo COMPLETO que tengo desde que soy niño?",
    imageUrls: [],
    options: ["Caballito Muñoz", "Pepe Lucho", "Caballo LOOKMAN", "Caballo"],
    correctIndex: 3,
    timeLimitSeconds: 20,
  },
];
