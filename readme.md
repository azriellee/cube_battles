# 🧊 Cube Battles

A web-based Rubik’s Cube battle platform for 3x3x3 cube solvers to compete in real time with synchronized scrambles, live tracking, and competitive leaderboards.

## 🚀 Features

- 🔁 Create or join battle rooms
- 🧩 Synchronized scrambles for fair competition
- ⏱️ Track solve times with automatic Ao5, Ao12, best time, and average calculations
- 📊 Daily & weekly leaderboards based on performance and consistency
- 💾 Solve data stored locally in-browser (like csTimer), with summarized stats synced to backend

## 🌐 Live Demo

[https://cube-battles.web.app/](https://cube-battles.web.app/)

## 🛠️ Tech Stack

- **Frontend**: React + Vite (Hosted On Firebase)
- **Backend**: Node.js + Express (Image Hosted On Google Cloud Run)
- **Database**: PostgreSQL (Hosted On Supabase)
- **CI/CD**: GitHub Actions

## 🎮 How to Play

- Users enter a battle room and receive a synchronized scramble
- Each day, users can complete up to 20 scrambles at their own pace (resets daily at 12:00AM UTC)
- Clicking "Solve" opens the timer; users hold **SPACEBAR** to prepare and release to start
- Pressing any key stops the timer, and the next scramble is automatically loaded
- Solve times are automatically saved in the user's browser
- At the end of the day, each user's best **AO5**, **AO12**, and **best solve** are submitted
- Users compete with others in the same room for daily points and weekly rankings

## 🧭 Planned Features

- 🔢 Allow users to choose the number of solves per day
- 📈 Live leaderboards to track daily progress
- 📲 Progressive Web App

## 💡 Potential Ideas

- ⚔️ Live battles with real-time solving and head-to-head matchups
- 👤 User profiles with stored solve statistics and elo
- 🎯 Random opponent matching based on User profile's elo (similar to chess.com)
- 🪙 Battle with ERC-20 tokens — integrate MetaMask to place token-based bets in competitive rooms

## 🧑‍💻 Author

Built by Azriel  
GitHub: [@azriellee](https://github.com/azriellee)

## 📄 License

This project is licensed under the [MIT License](LICENSE).
