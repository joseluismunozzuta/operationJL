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
// Las imágenes viven en public/img/ (servidas desde el propio sitio, no
// enlazadas a servidores ajenos) y muestran el CONTEXTO de la pregunta —
// varias alternativas cuando aplica — para no delatar la respuesta correcta.
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
      "/img/t01_1.jpg",
      "/img/t01_2.jpg",
      "/img/t01_3.jpg",
      "/img/t01_4.jpg",
      "/img/t01_5.jpg",
    ],
    options: [
      "Lionel Messi",
      "Eden Hazard",
      "Didier Drogba",
      "Paolo Guerrero",
    ],
    correctIndex: 1,
    timeLimitSeconds: 20,
  },
  {
    id: "t02",
    text: "¿Cuál es mi canción favorita de toda la vida?",
    imageUrls: [
      "/img/t02_1.jpg",
      "/img/t02_2.jpg",
      "/img/t02_3.png",
      "/img/t02_4.jpg",
      "/img/t02_5.jpg",
    ],
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
    imageUrls: [
      "/img/t03_1.jpg",
      "/img/t03_2.jpg",
      "/img/t03_3.jpg",
      "/img/t03_4.jpg",
      "/img/t03_5.jpg",
    ],
    options: [
      "2020",
      "2021",
      "2022",
      "2023",
    ],
    correctIndex: 1,
    timeLimitSeconds: 20,
  },
  {
    id: "t04",
    text: "¿Cuántos idiomas sé hablar, incluido el español?",
    imageUrls: [
      "/img/t04_1.png",
      "/img/t04_2.png",
      "/img/t04_5.jpg",
    ],
    options: [
      "2",
      "5",
      "3",
      "4",
    ],
    correctIndex: 3,
    timeLimitSeconds: 20,
  },
  {
    id: "t05",
    text: "¿Qué carrera estudié y qué maestría quiero seguir?",
    imageUrls: [
      "/img/t05_2.jpg",
      "/img/t05_3.jpg",
      "/img/t05_4.jpg",
      "/img/t05_5.jpg",
    ],
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
    imageUrls: [
      "/img/t06_1.jpg",
      "/img/t06_2.jpg",
      "/img/t06_3.jpg",
      "/img/t06_4.jpg",
      "/img/t06_5.jpg",
    ],
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
    imageUrls: [
      "/img/t07_1.jpg",
      "/img/t07_2.jpg",
      "/img/t07_3.jpg",
      "/img/t07_4.jpg",
      "/img/t07_5.jpg",
    ],
    options: [
      "Caballito Muñoz",
      "Pepe Lucho",
      "Caballo LOOKMAN",
      "Caballo",
    ],
    correctIndex: 3,
    timeLimitSeconds: 20,
  },
  {
    id: "t08",
    text: "¿A qué hora nací?",
    imageUrls: [
      "/img/t08_1.jpg",
      "/img/t08_2.jpg",
      "/img/t08_3.jpg",
      "/img/t08_4.jpg",
      "/img/t08_5.jpg",
    ],
    options: [
      "10 AM",
      "1 PM",
      "10 PM",
      "1 AM",
    ],
    correctIndex: 0,
    timeLimitSeconds: 20,
  },
  {
    id: "t09",
    text: "¿Cuál es mi videojuego favorito de todos los tiempos?",
    imageUrls: [
      "/img/t09_1.jpg",
      "/img/t09_2.jpg",
      "/img/t09_3.png",
      "/img/t09_4.jpg",
      "/img/t09_5.jpg",
    ],
    options: [
      "The Last of Us",
      "God of War",
      "PES",
      "Guitar Hero",
    ],
    correctIndex: 0,
    timeLimitSeconds: 20,
  },
  {
    id: "t10",
    text: "¿En qué empresa trabajo actualmente?",
    imageUrls: [
      "/img/t10_1.jpg",
      "/img/t10_2.jpg",
      "/img/t10_3.jpg",
      "/img/t10_4.jpg",
      "/img/t10_5.jpg",
    ],
    options: [
      "Novatronic",
      "FIS",
      "NTT Data",
      "Oktana",
    ],
    correctIndex: 1,
    timeLimitSeconds: 20,
  },
  {
    id: "t11",
    text: "¿Cuál es mi top de bandas favoritas (de más a menos)?",
    imageUrls: [
      "/img/t11_1.jpg",
      "/img/t11_2.jpg",
      "/img/t11_3.jpg",
      "/img/t11_4.png",
      "/img/t11_5.jpg",
    ],
    options: [
      "Megadeth, Slipknot, Limp Bizkit, SOAD, Avenged",
      "SOAD, Avenged, Megadeth, Limp Bizkit, Slipknot",
      "Avenged, Megadeth, SOAD, Slipknot, Limp Bizkit",
      "Avenged, SOAD, Megadeth, Limp Bizkit, Slipknot",
    ],
    correctIndex: 2,
    timeLimitSeconds: 35,
  },
  {
    id: "t12",
    text: "¿En qué ciudad viví cuando me fui de intercambio estudiantil en el 2019?",
    imageUrls: [
      "/img/t12_1.jpg",
      "/img/t12_2.jpg",
      "/img/t12_3.jpg",
      "/img/t12_4.jpg",
      "/img/t12_5.jpg",
    ],
    options: [
      "Bordeaux",
      "Laval",
      "Rennes",
      "Montreal",
    ],
    correctIndex: 3,
    timeLimitSeconds: 20,
  },
  {
    id: "t13",
    text: "¿A qué animal le tengo mayor temor?",
    imageUrls: [
      "/img/t13_1.jpg",
      "/img/t13_2.jpg",
      "/img/t13_3.jpg",
      "/img/t13_4.jpg",
      "/img/t13_5.jpg",
    ],
    options: [
      "Araña",
      "Serpiente",
      "Caballo",
      "Rata",
    ],
    correctIndex: 0,
    timeLimitSeconds: 20,
  },
  {
    id: "t14",
    text: "¿Qué día es mi aniversario con Mar?",
    imageUrls: [
      "/img/t14_1.jpg",
      "/img/t14_2.jpg",
      "/img/t14_3.jpg",
      "/img/t14_5.jpg",
    ],
    options: [
      "13",
      "14",
      "15",
      "20",
    ],
    correctIndex: 2,
    timeLimitSeconds: 20,
  },
  {
    id: "t15",
    text: "¿En qué hospital nací?",
    imageUrls: [
      "/img/t15_1.jpg",
      "/img/t15_2.jpg",
      "/img/t15_3.jpg",
      "/img/t15_4.jpg",
      "/img/t15_5.jpg",
    ],
    options: [
      "Hospital Municipal de Los Olivos",
      "Hospital Eduardo Rebagliati",
      "Hospital Carrión",
      "Hospital Mariano Molina",
    ],
    correctIndex: 1,
    timeLimitSeconds: 25,
  },
  {
    id: "t16",
    text: "¿En qué año fue mi primer concierto y con qué banda?",
    imageUrls: [
      "/img/t16_1.jpg",
      "/img/t16_2.jpg",
      "/img/t16_3.jpg",
      "/img/t16_4.jpg",
      "/img/t16_5.jpg",
    ],
    options: [
      "Slipknot — 2016",
      "Vivo X El Rock — 2017",
      "Día del Rock Peruano — 2018",
      "Linkin Park — 2017",
    ],
    correctIndex: 0,
    timeLimitSeconds: 25,
  },
  {
    id: "t17",
    text: "¿Cuál es mi color favorito?",
    imageUrls: [
      "/img/t17_1.jpg",
      "/img/t17_2.jpg",
      "/img/t17_3.jpg",
      "/img/t17_4.jpg",
      "/img/t17_5.jpg",
    ],
    options: [
      "Rojo",
      "Azul",
      "Negro",
      "Blanco",
    ],
    correctIndex: 1,
    timeLimitSeconds: 15,
  },
  {
    id: "t18",
    text: "¿Cuál es mi comida favorita?",
    imageUrls: [
      "/img/t18_1.jpg",
      "/img/t18_2.jpg",
      "/img/t18_3.jpg",
      "/img/t18_4.jpg",
      "/img/t18_5.jpg",
    ],
    options: [
      "Pollo a la brasa",
      "Tallarines rojos",
      "Ceviche mixto",
      "Ají de gallina",
    ],
    correctIndex: 1,
    timeLimitSeconds: 20,
  },
  {
    id: "t19",
    text: "¿Cuál es el primer país que conocí en el extranjero?",
    imageUrls: [
      "/img/t19_2.jpg",
      "/img/t19_3.jpg",
      "/img/t19_4.jpg",
      "/img/t19_5.jpg",
    ],
    options: [
      "Canadá",
      "EEUU",
      "Francia",
      "República Dominicana",
    ],
    correctIndex: 0,
    timeLimitSeconds: 20,
  },
  {
    id: "t20",
    text: "¿Cómo se llama lo que tengo tatuado y dónde lo tengo?",
    imageUrls: [
      "/img/t20_1.jpg",
      "/img/t20_2.jpg",
      "/img/t20_3.jpg",
      "/img/t20_4.jpg",
      "/img/t20_5.jpg",
    ],
    options: [
      "DeathSkull — hombro derecho",
      "Deathbat — hombro derecho",
      "Avenged Skull — hombro izquierdo",
      "Avenged Rattle — hombro derecho",
    ],
    correctIndex: 1,
    timeLimitSeconds: 30,
  },
];
