# 🧊 Cube Battles

A web-based Rubik’s Cube battle platform for 3x3x3 cube solvers to compete in real time with synchronized scrambles, live tracking, and competitive leaderboards.

## 🚀 Features

- 🔁 Create or join battle rooms
- 🧩 Synchronized scrambles for fair competition
- ⏱️ Track solve times with automatic Ao5, Ao12, best time, and average calculations
- 📊 Daily & weekly leaderboards based on performance and consistency
- 💾 Solve data stored locally in-browser (like csTimer), with summarized stats synced to backend
- 📈 Live leaderboards to view opponents current day solves
- 📲 Progressive Web App (Mobile Friendly, can be installed as an app on your home screen)
-

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
- At the end of the day, each user's best **AO5**, **AO12**, and **best solve** are saved
- Users will need to manually click submit to submit their stats, this can be done anytime before the 20 solves is complete
- Users compete with others in the same room for daily points and weekly rankings

## 🧭 Planned Features

- 👤 User profiles with stored solve statistics and elo (with google OAuth)
- ⚔️ Live battles with real-time solving and head-to-head matchups

## 💡 Potential Ideas

- 🎯 Random opponent matching based on User profile's elo (similar to chess.com)
- 🪙 Battle with ERC-20 tokens — integrate MetaMask to place token-based bets in competitive rooms

## 🧑‍💻 For Developers

### 🧰 Local Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/azriellee/cube-battles.git
   cd cube-battles
   ```

2. **Install dependencies**

   You'll need [Node.js](https://nodejs.org/) installed. Then run:

   ```bash
   cd frontend
   npm install
   cd ../backend
   npm install
   ```

3. **Environment variables**

   - In the `frontend/` directory, create a `.env` file with:

     ```
     VITE_API_BASE_URL=http://<YOUR_LOCAL_IP>:8080/api
     ```

     > If your backend is running on `0.0.0.0`, you **must** use your actual LAN IP (e.g. `192.168.x.x`) — not `localhost` — for the frontend to communicate with it from the browser.

   - In the `backend/` directory, create a `.env` file with:

     ```
     DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<database>
     ```

     > You will need PostgreSQL installed and running locally. Use credentials that match your local setup.

4. **Set up the database schema (Backend)**

   After configuring your `.env` in `backend/`, run the following commands to generate the Prisma client and apply the schema:

   \```
   cd backend
   npm run db:migrate
   \```

   > You can also run `npm run db:studio` to open Prisma Studio and view your data in a browser.

5. **Run the frontend**

   ```bash
   cd frontend
   npm run dev
   ```

6. **Run the backend**

   ```bash
   cd backend
   npm run dev
   ```

### ✅ Contributing

We welcome contributions from friends and collaborators! To make changes:

1. **Create a new branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Commit your work**

   ```bash
   git commit -m "Add: your message here"
   ```

3. **Push to your fork or remote branch**

   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request** on GitHub.

## 🧑‍💻 Author

Built by Azriel  
GitHub: [@azriellee](https://github.com/azriellee)

## 📄 License

This project is licensed under the [MIT License](LICENSE).
