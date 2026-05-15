const express = require('express');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: 'pridesolos-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Path to projects JSON file
const projectsFile = path.join(__dirname, 'projects.json');

// Helper: read projects from file (handles empty/corrupted files)
function readProjects() {
    if (!fs.existsSync(projectsFile)) {
        writeProjects([]); // create file with empty array
        return [];
    }
    const data = fs.readFileSync(projectsFile, 'utf8');
    if (!data.trim()) {
        // file is empty – initialize with empty array
        writeProjects([]);
        return [];
    }
    try {
        return JSON.parse(data);
    } catch (err) {
        console.error('Error parsing projects.json, resetting...');
        writeProjects([]);
        return [];
    }
}

// Helper: write projects to file
function writeProjects(projects) {
    fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
}

// ---------- PUBLIC ROUTES ----------
app.get('/api/projects', (req, res) => {
    const projects = readProjects();
    res.json(projects);
});

// ---------- ADMIN ROUTES ----------
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === 'pridesolos123') {
        req.session.isAdmin = true;
        res.json({ success: true, message: 'Logged in' });
    } else {
        res.status(401).json({ success: false, message: 'Wrong password' });
    }
});

app.post('/api/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out' });
});

app.get('/api/admin/check', (req, res) => {
    res.json({ isAdmin: !!req.session.isAdmin });
});

app.post('/api/admin/projects', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const projects = readProjects();
    const newProject = {
        id: Date.now(),
        title: req.body.title,
        description: req.body.description,
        techStack: req.body.techStack || [],
        imageUrl: req.body.imageUrl || '',
        liveUrl: req.body.liveUrl || '#',
        githubUrl: req.body.githubUrl || '#',
        createdAt: new Date().toISOString()
    };
    projects.push(newProject);
    writeProjects(projects);
    res.json(newProject);
});

app.delete('/api/admin/projects/:id', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    let projects = readProjects();
    const id = parseInt(req.params.id);
    projects = projects.filter(p => p.id !== id);
    writeProjects(projects);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});