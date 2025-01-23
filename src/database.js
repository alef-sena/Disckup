const dbName = process.env.DISCKUP_SQLITE_DATABASE;

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbFile = path.resolve(__dirname, `../database/${dbName}.db`);
const sqlSchema = path.resolve(__dirname, '../database/schema.sql');

/**
 * Function to open a connection to the SQLite database.
 * @param {string} dbPath - Path to database file.
 * @returns {Promise<sqlite3.Database>} - Returns a promise that resolves with the database connection.
 */
function openConnection(dbPath) {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
			if (err) {
				console.error(`\n[database.js] Error opening database "${dbPath}" connection:`, err.message);
				return reject(err);
			}
			// console.log(`\n[database.js] Opening connection to database "${dbPath}" completed successfully.`);
			resolve(db);
		});
	});
}

/**
 * Function to close a connection to the SQLite database.
 * @param {sqlite3.Database} db - Database connection instance.
 * @returns {Promise<void>} - Returns a promise that resolves when the connection is closed.
 */
function closeConnection(db) {
	return new Promise((resolve, reject) => {
		db.close((err) => {
			if (err) {
				console.error('\n[database.js] Error while closing database "${dbPath}" connection:', err.message);
				return reject(err);
			}
			// console.log('[database.js] Database connection closed successfully.');
			resolve();
		});
	});
}

async function initializeDatabase() {
	const dbExists = fs.existsSync(dbFile);

	let db;

	try {
		db = await openConnection(dbFile);

		if (!dbExists) {
			// console.log('[database.js] Database file not found. Creating a new database...');
		}
		else {
			// console.log('[database.js] Database file exists. Checking for tables...');
		}

		await createTablesFromSQLFile(db, sqlSchema);

		// console.log('[database.js] Database initialization completed.');
		return db;
	}
	catch (err) {
		console.error('\n[database.js] Error during database initialization:', err.message);
		throw err;
	}
	finally {
		if (!dbExists) {
			// console.log('[database.js] Closing connection after creating database...');
			await closeConnection(db);
		}
	}
}

/**
 * Function to close a connection to the SQLite database.
 * @param {sqlite3.Database} database - Database connection instance.
 * @param {string} sqlCreateFilePath - File path for creating SQLite tables
 * @returns {Promise<void>} - Returns a promise that resolves when the connection is closed.
 */
function createTablesFromSQLFile(database, sqlCreateFilePath) {
	return new Promise((resolve, reject) => {
		if (!fs.existsSync(sqlCreateFilePath)) {
			console.error(`\n[database.js] SQL file not found: '${sqlCreateFilePath}'`);
			return reject(new Error(`SQL file not found: '${sqlCreateFilePath}'`));
		}

		const schema = fs.readFileSync(sqlCreateFilePath, 'utf8');

		database.exec(schema, (err) => {
			if (err) {
				console.error('\n[database.js] Error creating tables:', err.message);
				return reject(err);
			}

			// console.log('[database.js] Tables created successfully.');
			resolve();
		});
	});
}

module.exports = {
	openConnection,
	closeConnection,
	initializeDatabase,
};