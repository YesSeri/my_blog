const express = require('express')
const basicAuth = require('express-basic-auth')
const app = express()
require('dotenv').config()
if (!process.env.BLOGADMIN || !process.env.PASSWORD) {
	throw new Error("Please setup your .env file correctly. Add BLOGADMIN and PASSWORD")
}
const port = process.env.PORT || 3000;
const path = require('path')

// If you don't assign an IP it will be hosted locally. Use your IP if you want to host on your wifi.
const ip = process.env.IP;

const sqlite3 = require('sqlite3').verbose();
// This creates db if it doesn't exist, if it exists it is opened as read and write.
const db = new sqlite3.Database(path.join(__dirname, 'db', 'my_blog_db.sqlite3'))

db.run(`CREATE TABLE IF NOT EXISTS post (
		id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
		title TEXT NOT NULL,
		content TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`
);

app.use(express.json());

const staticUserAuth = basicAuth({
	users: {
		[process.env.BLOGADMIN]: process.env.PASSWORD
	},
	challenge: true,
})

app.use(staticUserAuth);

app.get('/api/posts', (req, res) => {
	db.all("SELECT * FROM post ORDER BY created_at DESC", (error, result) => {
		if (error) {
			console.log(error)
			return res.status(400).json({
				error: 1,
				msg: "Error occured: " + error
			});
		}
		res.json(result)
	});
});

app.post('/post', (req, res) => {
	const { body: { title, content } } = req;
	try {
		db.run('INSERT INTO post (title, content) VALUES ($1, $2);', title, content);
		res.json({ "Posted": true });
	} catch (error) {
		if (error) return res.status(400).json({
			error: 1,
			msg: "Error occured: " + error
		});
		console.log(error)
	}
});

app.use(express.static('static', { extensions: ['html'] }));

app.listen(port, ip, () => {
	console.log(`Blog app listening at ${ip ? ip : 'localhost'}:${port}`)
});