// Estilo compartido de las alternativas: mismo color y símbolo en el celular
// del jugador y en la proyección, para que "toqué el triángulo rojo" sea
// inequívoco aunque el enunciado solo se lea en la TV.
export const OPTION_STYLES = [
  { shape: "▲", bg: "bg-opt-a", border: "border-opt-a", text: "text-opt-a" },
  { shape: "◆", bg: "bg-opt-b", border: "border-opt-b", text: "text-opt-b" },
  { shape: "●", bg: "bg-opt-c", border: "border-opt-c", text: "text-opt-c" },
  { shape: "■", bg: "bg-opt-d", border: "border-opt-d", text: "text-opt-d" },
] as const;

export function optionStyle(index: number) {
  return OPTION_STYLES[index % OPTION_STYLES.length];
}
