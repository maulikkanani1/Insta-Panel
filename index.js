var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const fetch = require('node-fetch');
var FormData = require('form-data');
var ig = require('instagram-node').instagram();
var localStorage = require('localStorage');
const MongoClient = require('mongodb').MongoClient;
var config = require('./config/config');
let accessToken = "";
let db;
MongoClient.connect("mongodb://localhost:27017", { useNewUrlParser: true }, function (err, client) {
	if (err) {
		console.log("Error in DB connection: ", err);
	} else {
		db = client.db("instaPanel");
		console.log("Connected successfully to server");
	}
});

//location of our static files(css,js,etc..)
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//set the view engine to use ejs
app.set('view engine', 'ejs');

app.listen(8080, () => {
	console.log("server is runing on: 8080");
});

//the redirect uri we set when registering our application
var redirectUri = 'http://localhost:8080/handleAuth';

app.get('/authorize', function (req, res) {
	// set the scope of our application to be able to access likes and public content
	res.redirect(ig.get_authorization_url(redirectUri, { scope: ['public_content', 'likes'] }));
});

app.get('/handleAuth', function (req, res) {
	//retrieves the code that was passed along as a query to the '/handleAuth' route and uses this code to construct an access token
	var bodyFormData = new FormData();
	bodyFormData.append('client_id', config.client_id);
	bodyFormData.append('client_secret', config.client_secret);
	bodyFormData.append('grant_type', 'authorization_code');
	bodyFormData.append('redirect_uri', redirectUri);
	bodyFormData.append('code', req.query.code);

	fetch('https://api.instagram.com/oauth/access_token', {
		method: 'post',
		body: bodyFormData
	}).then(res => res.json())
		.then(result => {
			db.collection("users").find({ username: result.user.username }).toArray(function (err, docs) {
				if (docs.length > 0) {
					db.collection("users").updateOne({ username: result.user.username }, {
						$set: {
							id: result.user.id,
							username: result.user.username,
							profile_picture: result.user.profile_picture,
							full_name: result.user.full_name,
							bio: result.user.bio,
							website: result.user.website,
							is_business: false,
							access_token: result.access_token
						}
					}, function (err, result) {
						let data = {
							access_token: result.access_token,
							user: result.user
						}
						localStorage.setItem('userData', JSON.stringify(data));
						res.redirect('/');
					});
				} else {
					db.collection("users").insertOne({
						id: result.user.id,
						username: result.user.username,
						profile_picture: result.user.profile_picture,
						full_name: result.user.full_name,
						bio: result.user.bio,
						website: result.user.website,
						is_business: false,
						access_token: result.access_token
					}, function (err, result) {
						if (err) {
							console.log("error in inseer user: ", err);
						} else {
							console.log("record add successfully");
							// After getting the access_token redirect to the '/' route 
							res.redirect('/');
						}
					});
				}
			});
		});
});

app.get('/', function (req, res) {
	db.collection("users").find({}).toArray(function (err, docs) {
		// console.log(docs)
		res.render('pages/userListing', { users: docs });
	});
});

app.get('/user/:id', function (req, res) {
	db.collection("users").find({ id: req.params.id }).toArray(function (err, docs) {
		if (docs.length > 0) {
			// create a new instance of the use method which contains the access token gotten
			ig.use({
				access_token: docs[0].access_token
			});

			ig.user_media_recent(docs[0].id, function (err, result, pagination, remaining, limit) {
				console.log("err: ", err);

				if (err && err.error_message == "The access_token provided is invalid.") {
					res.render('pages/login', { error: "User has change the password please login again with new credential" });
				} else {
					// pass the json file gotten to our ejs template
					res.render('pages/index', { instagram: result });
				}
			});
		} else {
			res.render('pages/login', { error: "Somthing wan't wrong, you need to try again" });
		}
	});
});

app.get('/login', function (req, res) {
	res.render('pages/login', { error: "" });
});

app.post('/login', function (req, res) {
	if (req.body.email === "test@gmail.com" && req.body.password === "test123") {
		// res.render('pages/index');
		db.collection("users").find({}).toArray(function (err, docs) {
			// console.log(docs)
			res.render('pages/userListing', { users: docs });
		});
	} else {
		res.render('pages/login', { error: "You have enter wrong credential" });
	}
});

app.get('/logout', function (req, res) {
	localStorage.clear();
	res.redirect('/login');
});

