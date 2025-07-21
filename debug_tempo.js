// Simulação do exemplo fornecido
const dataEntrada = "2025-07-21";
const horaEntrada = "23:44";
const duracaoMinutos = 60; // 1 hora
const agora = new Date("2025-07-20T23:46:00"); // Simular data atual

const dataHoraEntrada = new Date(`${dataEntrada}T${horaEntrada}`);
console.log("=== DEBUG TEMPO ===");
console.log("Data/Hora Entrada:", dataHoraEntrada);
console.log("Agora:", agora);

const diferencaMs = agora.getTime() - dataHoraEntrada.getTime();
const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));

console.log("Diferença em minutos:", diferencaMinutos);
console.log("Duração permitida:", duracaoMinutos, "minutos");

if (diferencaMinutos < 0) {
    const minutosRestantes = Math.abs(diferencaMinutos);
    console.log("ENTRADA FUTURA - Inicia em", minutosRestantes, "minutos");
    console.log("Tempo Decorrido: Inicia em", Math.floor(minutosRestantes/60) + "h " + (minutosRestantes%60) + "min");
    console.log("Tempo Excedido: Aguardando início");
} else {
    console.log("Tempo Decorrido:", diferencaMinutos, "minutos");
    const tempoExcedido = diferencaMinutos - duracaoMinutos;
    console.log("Tempo Excedido:", tempoExcedido > 0 ? tempoExcedido + " min" : "Dentro do prazo");
}
