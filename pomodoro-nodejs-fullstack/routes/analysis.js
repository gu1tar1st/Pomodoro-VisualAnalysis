var express = require('express');
var router = express.Router();
const { spawn } = require('child_process');
const Study = require('../model/Pomodoro');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('analysis/analysis');
});

router.post('/', async (req, res) => {
    const { timeframe, userId } = req.body;

    if (!timeframe || !userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const studies = await Study.find({ userId }).lean(); // Fetch all study data for the user

        if (!studies.length) {
            return res.json({ error: 'No study data found for this user' });
        }

        // Prepare input for Python
        const inputData = JSON.stringify({ data: studies, timeframe });
        const pyPath = "C:\\Users\\rysho\\AppData\\Local\\Programs\\Python\\Python312\\python.exe" || "python3";

        // Spawn Python process
        const py = spawn(pyPath, ['./public/scripts/analysis.py']);

        let output = '';
        let errorOutput = '';

        py.stdin.write(inputData);
        py.stdin.end();

        py.stdout.on('data', (data) => {
            output += data.toString();
        });

        py.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        py.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python process exited with code ${code}: ${errorOutput}`);
                return res.status(500).json({ error: 'Error processing data' });
            }

            try {
                const result = JSON.parse(output.trim());
                if (result.error) {
                    return res.json({ error: result.error });
                }
                res.json(result);
            } catch (parseError) {
                console.error(`Error parsing Python output: ${parseError}`);
                res.status(500).json({ error: 'Error parsing results' });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;