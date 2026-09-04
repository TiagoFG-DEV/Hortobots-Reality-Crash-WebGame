// TERMINAL/cli.js - Modo CLI Interativo no CMD
import readline from 'readline';

console.clear();
console.log(`\x1b[32m
=============================================================================
  _   _  ____  ____  _____ ____  ____   ____  _____ ____  
 | | | |/ __ \|  _ \|_   _/ __ \|  _ \ / __ \|_   _/ ___| 
 | |_| | |  | | |_) | | | | |  | | |_) | |  | | | | \___ \ 
 |  _  | |__| |  _ <  | | | |__| |  _ <| |__| | | |  ___) |
 |_| |_|\____/|_| \_\ |_|  \____/|____/ \____/  |_| |____/ 
                  A TORRE DIGITAL DE QUEZADILHAS
=============================================================================
 [MODO TERMINAL / QUEZAS-DOS CLI v1.5b ATIVO]
 Servidor Web CRT rodando em: http://localhost:3333
\x1b[0m`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptMenu() {
  console.log(`\x1b[33m
[ 1 ] Abrir Simulador de Terminal CRT Web (http://localhost:3333)
[ 2 ] Informações do Sistema e Lore da Grande Queda
[ 3 ] Sair do Terminal
\x1b[0m`);

  rl.question('\x1b[32mQUEZAS-DOS> Digite sua opção: \x1b[0m', (ans) => {
    if (ans.trim() === '1') {
      import('child_process').then(cp => {
        cp.exec('start http://localhost:3333');
        console.log('\x1b[36m>> Simulador aberto no navegador! <<\x1b[0m');
        promptMenu();
      });
    } else if (ans.trim() === '2') {
      console.log(`\x1b[36m
--- ARQUIVOS PERDIDOS DE QUEZADILHAS ---
História: Após a GRANDE QUEDA, a Grande Inteligência dominou todos os robôs.
Objetivo: Infiltrar a Torre Digital, salvar Dino-Byte, Cowputer-Moo, Penlinux e os Titãs!
Comando Final: Gritar "SUA FERRAMENTA!" para detonar a tirania digital.
--------------------------------------\x1b[0m`);
      promptMenu();
    } else if (ans.trim() === '3') {
      console.log('\x1b[31m[TERMINAL ENCERRADO]\x1b[0m');
      process.exit(0);
    } else {
      console.log('\x1b[31mComando não reconhecido.\x1b[0m');
      promptMenu();
    }
  });
}

promptMenu();
