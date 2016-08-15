//Model
var Model = {
	boardSize: 25,
	gameWords: [],
	teamOne: undefined,
	score: {
		Red: 0,
		Blue: 0
	},
	user: undefined,
	player: undefined,
	loggedIn: false,
	gameStarted: false,
	turnIndex: undefined
};

//View
var mainTemplate;
var boardTemplate;
//var scoreTemplate;

function buildTemplates() {
	var mainSource = $('#main-template').html();
	mainTemplate = Handlebars.compile(mainSource);

	var boardSource = $('#board-template').html();
	boardTemplate = Handlebars.compile(boardSource);

//	var scoreSource = $('#score-template').html();
//	scoreTemplate = Handlebars.compile(scoreSource);
}

function renderMain() {
	var mainContent = mainTemplate(Model);
	$('#main').html(mainContent);
}

function renderGame(snapshot) {
	//passThis is inelegant, but I don't know how to get Handlebars to iterate through var words otherwise
	var passThis = { words: [] };
	$('#wordgrid table').html('');
	Model.score.Red = 0;
	Model.score.Blue = 0;

	for (var i = 0; i < snapshot.keys().length; i++) {
		var word = snapshot[ snapshot.keys()[i] ]; //better way to do this?
		var color = '';
		if (word.isGuessed) {
			color = word.team;
		} else {
			if (word.team == 'Red' || word.team == 'Blue') {
				Model.score[word.team]++;
			}
			if (Model.player.role == 'Cluemaster') { //change to DB lookup
				color = 'hidden' + word.team;
			}
		}
		passThis.words.push({
			color: color,
			word: word.word //oh god
		});
		if (passThis.words.length == 5) {
			var wordRow = boardTemplate(passThis);
			$('#wordgrid table').append(wordRow);
			passThis.words = [];
		}
	}
	if (passThis.words.length) {
		var wordRow = boardTemplate(words);
		$('#wordgrid table').append(wordRow);
		passThis.words = [];
	}

	$('#redclues .score').html('Agents Left: ' + Model.score.Red);
	$('#blueclues .score').html('Agents Left: ' + Model.score.Blue);
}

//Controller
function setup () {
	buildTemplates();

	//Sign In Listeners
	$('#main').on('click','#register',handleRegister);
	$('#main').on('click','#login',handleLogin);
	$('#main').on('click','#sign-out',handleSignOut);
	firebase.auth().onAuthStateChanged(handleAuthStateChange);

	firebase.database().ref('players').on('value',checkGameStart);
	firebase.database().ref('words').on('value',renderGame);

	firebase.database().ref('currentPlayer').on('value',playTurn);

	//Guesser Listeners
	
}

function playTurn(snapshot) {
	if (Model.player.role == 'Guesser') {
		//THIS WON'T WORK, will just apply a bunch of listeners
		while (Model.player.turn == snapshot.val()){
			$('#wordgrid').on('click','td',revealTeam);
		}
	}
}

function checkGameStart(snapshot) {
	var players = snapshot.keys();
	if (players.length >= 4 && !Model.gameStarted) {

		Model.gameStarted = true; //belongs somewhere else?
		var signupNum = players.orderByKey().indexOf(player.playerID);

		switch (signupNum) {
			case 0:
				Model.player.role = 'Cluemaster';
				Model.player.team = 'Red';
				Model.player.turn = signupNum;
				break;
			case 1:
				Model.player.role = 'Guesser';
				Model.player.team = 'Red';
				Model.player.turn = signupNum;
				break;
			case 2:
				Model.player.role = 'Cluemaster';
				Model.player.team = 'Blue';
				Model.player.turn = signupNum;
				break;
			case 3:
				Model.player.role = 'Guesser';
				Model.player.team = 'Blue';
				Model.player.turn = signupNum;
				//Only initGame via one person
				initGame();
				break;
			default:
				//anything?
				Model.player.role = 'Observer';
				Model.player.team = 'Observer';
		}

		firebase.database().ref('players').child(player.playerID).update({
			userID: Model.user.uid,
			role: Model.player.role,
			team: Model.player.team,
			turn: signupNum
		});
	}
	//Should have some sort of hold music page
}

function initGame () {
	//randomly determine who goes first
	if (Math.random() < 0.5) {
		Model.teamOne = "Red";
		Model.turnIndex = 0;
	} else {
		Model.teamOne = "Blue";
		Model.turnIndex = 2;
	}
	Model.score[Model.teamOne] = 1;

	//clear out last game's words, then pick new ones
	firebase.database().ref('words').remove(pickWords);
}

function pickWords() {
	firebase.database().ref('wordBank').on('value',function (snapshot) {
		var wordIndices = pickItems(snapshot.length, Model.boardSize);

		//Each team gets 1/3 of the non-assassins
		var agentsPerTeam = (Model.boardSize - 1) / 3;
		Model.score.Red += agentsPerTeam;
		Model.score.Blue += agentsPerTeam;
		//add 2 for assassin and teamOne's extra person
		var agentCount = (2 * agentsPerTeam) + 2;
		var specialWords = pickItems(Model.boardSize, agentCount);

		var team;
		for (var i = 0; i < wordIndices.length; i++) {
			team = specialWords.indexOf(i);
			if (team == -1) {
				team = "Neutral";
			} else if (team == 0) {
				team = "Assassin";
			} else if (team < (agentCount / 2)) {
				team = "Red";
			} else if (team == agentCount - 1) {
				team = Model.teamOne;
			} else {
				team = "Blue";
			}

			firebase.database().ref('words').push({
				word: snapshot.val(),
				team: team,
				isGuessed: false
			});
		}
	});
}

function handleRegister() {
  var email = $('input[name="email"').val();
  var password = $('input[name="password"').val();

  //we don't need to encrypt the PW before using it here?
  firebase.auth().createUserWithEmailAndPassword(email,password);
}

function handleLogin() {
  var email = $('input[name="email"').val();
  var password = $('input[name="password"').val();

  //we don't need to encrypt the PW before using it here?
  firebase.auth().signInWithEmailAndPassword(email, password);
}

function handleSignOut() {
	//need to set up a callback to ensure key is removed before signout
	firebase.database().ref('players').child(Model.player.playerID).remove();
	firebase.auth().signOut();
}

function handleAuthStateChange() {
	var user = firebase.auth().currentUser; //undefined if not logged in, object if so
	if (user) {
		Model.loggedIn = true;
		Model.user = user;
		var player = firebase.database().ref('players').push({
			userID: user.uid,
			role: undefined,
			team: undefined
		});
		Model.player = {
			playerID: player.key,
			role: undefined,
			team: undefined
		};
	} else {
		Model.loggedIn = false;
		Model.user = undefined;
	}

  //update view accordingly
  renderMain();
 
}

function pickItems (items,picks) {
	//Generate an array of unique indices
	var choice;
	var returnArray = [];
	for (var i = 0; i < picks; i++ ) {
		do {
			choice = Math.floor(Math.random() * items);
		} while (returnArray.indexOf(choice) >= 0);
		returnArray.push(choice);
	}
	return returnArray;
}

function revealTeam() {
	var word = $(this).html();
	for (var i = 0; i < Model.gameWords.length; i++) {
		if (word == Model.gameWords[i].word) {
			Model.gameWords[i].isGuessed = true;
			if (Model.gameWords[i].team == "Red") {
				//Fix to updated score Model
				Model.redScore--;
			} else if (Model.gameWords[i].team == "Blue") {
				Model.blueScore--;
			}
			break;
		}
	}
	renderGame();
}

$(document).ready(setup);