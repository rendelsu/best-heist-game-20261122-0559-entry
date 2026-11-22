# best-heist-game-20261122-0559-entry

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/rendelsu/best-heist-game-20261122-0559-entry/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/rendelsu/best-heist-game-20261122-0559-entry/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

The Velvet Fox — an original top-down stealth heist game for make.fun's "Make the best heist game" bounty. You are Vera "Velvet" Fox, a thief working the Meridian Museum after dark. Cross three rooms — the Marble Gallery, the Gilded Corridor, and the Sapphire Sanctum — past patrolling guards with vision cones and sweeping security cameras, lift each room's artifact (the Moonlight Opal, the Sunken Crown, the Star Sapphire), grab what extra loot you dare, and slip out the green exit before the alarm meter fills. Toss coins to lure guards away, drop smoke to blind cameras, and sneak when the cones sweep your way. Three lives, a timer per room, and a score that pays for loot, speed, and nerve.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network request — the game is plain static files under `game/`, all art drawn on canvas, all sound synthesised with WebAudio.

## How to play

- **WASD / arrow keys** — move
- **Shift** — sneak (slower, harder to spot)
- **Click / C** — toss a coin where you click; guards in earshot go to look
- **X** — smoke bomb; blinds cameras and guards inside the cloud
- **P** — pause, **M** — mute, **R** — restart the room, **Enter** — start

Take the artifact to unlock the exit, then reach it before the timer runs out. Being seen raises the alarm; break line of sight and it cools down. At 100 you are caught and lose a life.

## Screenshots

The four frames in `screenshots/` are real renders of the game (title, mid-heist, the vault, and the getaway), staged deterministically with `?shot=start|play|vault|win&seed=1` and the game's own autopilot playing the real rules.

---

<sub>Entered on [make.fun](https://make.fun/?ref=rkkz4bh8&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
