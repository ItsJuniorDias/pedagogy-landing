# 🎵 Áudio dos jogos (`_audio`)

Motor de som compartilhado por **Happy Farm** e **Neon Pong**. Toda a trilha
sonora e todos os efeitos são **sintetizados em tempo real** com a Web Audio API
— não há nenhum arquivo de áudio no projeto.

Por que assim:

- **Zero assets** — nada de `.mp3`/`.ogg` engordando o bundle.
- **Sem direitos autorais** — as melodias são originais e geradas por código.
- **Offline e instantâneo** — começa sem download, funciona sem rede.

## Arquivos

| Arquivo            | Papel                                                              |
| ------------------ | ----------------------------------------------------------------- |
| `engine.ts`        | AudioContext, barramentos (master/música/efeitos), mudo, destrave |
| `music.ts`         | Sequenciador da trilha — faixas `farm` (pastoral) e `pong` (synthwave) |
| `sfx.ts`           | Efeitos curtos para cada ação dos jogos                           |
| `useGameAudio.ts`  | Hook React: liga/desliga a trilha + estado de mudo                |
| `SoundButton.tsx`  | Botão 🔊/🔇 da HUD (primitivos react-native)                      |
| `index.ts`         | API pública do módulo                                              |

## Como usar

```tsx
import { sfx, useGameAudio, SoundButton } from "../_audio";

function GameScreen() {
  const { muted, toggle } = useGameAudio("farm"); // toca a trilha enquanto montado
  // ...
  sfx.harvest(); // dispara um efeito em qualquer evento do jogo
  return <SoundButton muted={muted} onToggle={toggle} />;
}
```

## Política de autoplay

Navegadores só permitem áudio após um gesto do usuário. O `engine` instala
ouvintes globais (`pointerdown`/`touchstart`/`keydown`) que destravam o contexto
no primeiro toque — natural nos dois jogos (tocar num tile / apertar começar).
A trilha entra em fase assim que o contexto destrava.

## Preferência de mudo

O estado de mudo é salvo em `localStorage` (`pedagogy.audio.muted.v1`) e vale
para os dois jogos.
