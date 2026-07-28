export type TriviaSeed = {
  id: string;
  text: string;
  imageUrl: string | null;
  options: string[];
  correctIndex: number;
  timeLimitSeconds: number;
};

// Banco del interrogatorio. Reemplaza estos placeholders por las preguntas
// reales sobre JL: enunciado, hasta 4 alternativas, el índice de la correcta
// (empezando en 0) y opcionalmente una imagen.
//
// La respuesta correcta se guarda en una colección aparte (triviaKeys) que
// solo el admin puede leer — ver src/lib/trivia.ts y firestore.rules.
export const TRIVIA_BANK: TriviaSeed[] = [
  {
    id: "t01",
    text: "¿En qué año nació JL?",
    imageUrl: null,
    options: ["1997", "1998", "1999", "2000"],
    correctIndex: 2,
    timeLimitSeconds: 20,
  },
  {
    id: "t02",
    text: "¿Cuál es el equipo de fútbol de JL?",
    imageUrl: null,
    options: ["Chelsea", "Real Madrid", "Barcelona", "Liverpool"],
    correctIndex: 0,
    timeLimitSeconds: 20,
  },
  {
    id: "t03",
    text: "Pregunta de ejemplo — reemplázala",
    imageUrl: null,
    options: ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
    correctIndex: 0,
    timeLimitSeconds: 20,
  },
];
