const { google } = require('googleapis')
const path = require('path')
const fs = require('fs').promises

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json')
const TOKEN_PATH = path.join(__dirname, 'token.json')

async function authorize() {
	const content = await fs.readFile(CREDENTIALS_PATH)
	const credentials = JSON.parse(content)
	const { client_secret, client_id, redirect_uris } = credentials.web
	const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
	const token = await fs.readFile(TOKEN_PATH)
	oAuth2Client.setCredentials(JSON.parse(token))
	return oAuth2Client
}

async function readSheet(spreadsheetId, range) {
	const auth = await authorize()
	const sheets = google.sheets({ version: 'v4', auth })
	const res = await sheets.spreadsheets.values.get({ spreadsheetId, range })
	return res.data.values
}

module.exports = { readSheet }
