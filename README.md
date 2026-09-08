# Friendly Extension SUAP UEPB

Extensão de Chrome que deixa as tabelas do [SUAP UEPB](https://suap.uepb.edu.br)
mais fáceis de ler.

## O que ela faz

- **Traduz os horários.** `2M12` vira `Segunda 07h às 09h`. Aulas seguidas são
  juntadas num intervalo só.
- **Mostra o nome da disciplina.** Na tabela de disciplinas solicitadas, o
  código `GRAD.1234` é trocado pelo nome que aparece no título da página.
- **Esconde a coluna "Descrição"**, que ocupa espaço e raramente é útil.

Funciona também nas tabelas que o SUAP carrega depois, sem recarregar a página.

## Como instalar

1. Baixe o repositório:
   ```
   git clone https://github.com/TarcioDiniz/friendly-extension-suap-uepb.git
   ```
2. Abra `chrome://extensions` no Chrome.
3. Ligue o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e escolha a pasta do repositório.

A extensão só roda em `https://suap.uepb.edu.br/*` e não pede nenhuma
permissão além disso. Ela não envia dado nenhum para fora do seu navegador.

## Como o código está organizado

| Arquivo | O que faz |
| --- | --- |
| `src/schedule.js` | Converte os códigos de horário. Não toca no DOM. |
| `src/content.js` | Acha as tabelas na página e aplica as mudanças. |
| `tests/` | Testes automatizados das duas camadas. |
| `tools/make-icons.js` | Gera os PNGs de `icons/`. |

## Códigos de horário do SUAP

O código tem três partes: dia da semana, turno e números das aulas.

`4N34` = dia **4** (quarta) + turno **N** (noturno) + aulas **3** e **4**.

| Turno | Letra | Aulas |
| --- | --- | --- |
| Matutino | `M` | 1 a 6 (07h às 13h) |
| Tarde | `T` | 1 a 6 (13h às 19h) |
| Vespertino | `V` | igual ao turno da tarde |
| Noturno | `N` | 1 a 4 (19h às 22h20min) |

Dias vão de `2` (segunda) a `7` (sábado).

Se um código não encaixar nessa tabela, a extensão deixa o texto original na
tela em vez de mostrar algo errado.

## Rodando os testes

```
npm install
npm test
```

## Licença

MIT — veja [LICENSE](LICENSE).
