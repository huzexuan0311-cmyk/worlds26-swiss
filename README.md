# Worlds 26 · Swiss Predictor

2026 League of Legends Worlds Swiss Stage prediction page.

- Static single-file page.
- 16 teams, Swiss 5 rounds, knockout bracket, Monte Carlo.
- Default model: per-map Bradley-Terry + league-level top-opponent correction.
- R1 2026 Polymarket pre-match snapshot is shown as `MKT %`.
- The market is display-only; it does not change model probabilities.
- A scheduled GitHub Action refreshes the snapshot every 10 minutes until the first match starts, then freezes the final pre-match values.

Data sources: LoL Esports GPR, lolesports, Leaguepedia/GPTilt map data, Polymarket.
