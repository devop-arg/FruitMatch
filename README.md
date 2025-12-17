# FruitMatch

A colorful match-3 puzzle game built with vanilla JavaScript, HTML5, and CSS3. Match fruits in lines or squares to score points, complete levels, and climb the leaderboards!

## Features

### Game Modes
- **Classic Mode**: Score as many points as possible before running out of moves
- **Adventure Mode**: Progress through increasingly challenging levels with objectives
- **Zen Mode**: Relaxed gameplay with no time pressure or move limits

### Gameplay Mechanics
- **Match 3+**: Line up 3 or more identical fruits horizontally or vertically
- **2x2 Square Matches**: Form a square of 4 matching fruits for bonus points
- **Recursive Propagation**: Adjacent matching fruits automatically join matches
- **Special Power-ups**: Earn and use power-ups to clear the board strategically
- **Combo System**: Chain matches for multiplied scores

### Additional Features
- **Multi-language Support**: English and Spanish (auto-detects browser language)
- **Global Leaderboards**: Compete with players worldwide
- **Customizable Themes**: Unlock new visual themes as you progress
- **Sound Effects & Music**: Toggle audio on/off in settings
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Offline Support**: Play without an internet connection

## Screenshots

*Coming soon*

## Installation

### Frontend Only (Static Files)

1. Clone the repository:
```bash
git clone https://github.com/weiro2020/FruitMatch.git
cd FruitMatch
```

2. Serve the files using any static file server:
```bash
# Using Python
python -m http.server 8080

# Using Node.js (npx)
npx serve .

# Using PHP
php -S localhost:8080
```

3. Open your browser and navigate to `http://localhost:8080`

### With Score API (Docker)

The game includes an optional backend API for persistent scores and leaderboards.

1. Clone the repository:
```bash
git clone https://github.com/weiro2020/FruitMatch.git
cd FruitMatch
```

2. Start the API server:
```bash
cd api
docker-compose up -d
```

3. The API will be available at `http://localhost:3777`

4. Serve the frontend files (see above) or configure your web server

### Docker Compose Configuration

The `api/docker-compose.yml` includes:
- Node.js Express server
- Persistent data storage in `./data/`
- Health checks
- Auto-restart on failure

```yaml
# Default configuration
Container name: fruitmatch_scores_api
Port: 3777
Data directory: ./data/
```

## Configuration

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/scores` | GET | Get all scores |
| `/api/scores` | POST | Submit a new score |
| `/api/scores/top` | GET | Get top scores |

### Admin Panel

Access the admin panel at `/admin.html` to:
- View and manage scores
- Monitor game statistics
- Configure game settings

**Default credentials:**
- Username: `admin`
- Password: `admin`

> **Important**: Change the default credentials in production!

## Project Structure

```
FruitMatch/
├── api/
│   ├── data/           # Score data (JSON files)
│   ├── Dockerfile      # Docker image definition
│   ├── docker-compose.yml
│   ├── package.json
│   └── server.js       # Express API server
├── sounds/             # Audio files (MP3)
├── .gitignore
├── admin.html          # Admin panel
├── api.js              # Frontend API client
├── index.html          # Main game page
├── lang.js             # Internationalization (i18n)
├── script.js           # Game logic
├── styles.css          # Styling
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers (iOS Safari, Chrome for Android)

## Development

### Prerequisites
- Node.js 18+ (for API development)
- Docker & Docker Compose (for containerized deployment)

### Running in Development

1. Start the API in development mode:
```bash
cd api
npm install
npm run dev
```

2. Serve the frontend with live reload:
```bash
npx serve . -l 8080
```

### Building for Production

The frontend is static and requires no build step. Simply deploy all files to your web server.

For the API:
```bash
cd api
docker build -t fruitmatch-api .
docker run -d -p 3777:3777 -v $(pwd)/data:/app/data fruitmatch-api
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

Developed by **DevCatanzaro**

## Acknowledgments

- Sound effects from various royalty-free sources
- Inspired by classic match-3 puzzle games
- Built with love for casual gaming
