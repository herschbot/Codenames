//Model
var Model = {
	boardSize: 25,
	user: undefined,
	loggedIn: false,
	gameStarted: false,
	teamOne: undefined
};

//View
var mainTemplate;
var boardTemplate;
var clueTemplate;
var clueForm = '<input name="clue" type="text" placeholder="One-word Clue" /> ' +
				'<input name="number" type="number" placeholder="Number of Agents" /> ' +
				'<input id="giveclue" type="submit" value="Enter Clue" />';
//var scoreTemplate;

function buildTemplates() {
	var mainSource = $('#main-template').html();
	mainTemplate = Handlebars.compile(mainSource);

	var boardSource = $('#board-template').html();
	boardTemplate = Handlebars.compile(boardSource);

	var clueSource = $('#clue-template').html();
	clueTemplate = Handlebars.compile(clueSource);

//	var scoreSource = $('#score-template').html();
//	scoreTemplate = Handlebars.compile(scoreSource);
}

function renderMain() {
	var mainContent = mainTemplate(Model);
	$('#main').html(mainContent);
}

function renderBoard(snapshot) {
	var wordKeys = Object.keys(snapshot.val());

	//passThis is inelegant, but I don't know how to get Handlebars to iterate through var words otherwise
	var passThis = { words: [] };
	$('#wordgrid table').html('');

	for (var i = 0; i < wordKeys.length; i++) {
		var word;
		firebase.database().ref('words').child(wordKeys[i]).on('value',function (snapshot) {
			word = snapshot.val();
			firebase.database().ref('words').child(wordKeys[i]).off('value');
		});
		var color = '';
		if (word.isGuessed) {
			color = word.team;
		} else {
			var userID = firebase.auth().currentUser.uid;
			firebase.database().ref('players').child(userID).child('role').on('value',function (snapshot) {
				var userRole = snapshot.val();
				if (userRole == 'Cluemaster') {
					color = 'hidden' + word.team;
				}
				firebase.database().ref('players').child(userID).child('role').off('value');
			});
		}
		passThis.words.push({
			id: wordKeys[i],
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
		var wordRow = boardTemplate(passThis);
		$('#wordgrid table').append(wordRow);
		passThis.words = [];
	}

	//move to another view function?
	firebase.database().ref('gameStats').child('score').on('value',function (snapshot) {
		var scores = snapshot.val();
		$('#redclues .score').html('Agents Left: ' + scores.Red);
		$('#blueclues .score').html('Agents Left: ' + scores.Blue);
		firebase.database().ref('gameStats').child('score').off('value');
	});
}

function renderClue(snapshot) {
	var clueNum = firebase.database().ref('clues').keys().length;
	var passThis = {
		clue: snapshot.child('clue').val(),
		parity: (clueNum % 4 == 1 || clueNum % 4 == 2) ? 'odd' : 'even',
		checkboxes : []
	};
	var team = snapshot.child('team').val().toLowerCase();
	var color = team.charAt(0);
	for (i = 1; i <= snapshot.child('number').val(); i++) {
		passThis.checkboxes.push({
			checkboxname : color + clueNum + i
		});
	}
	var newClue = clueTemplate(passThis);
	$('#' + team + 'clues').append(newClue);
}

//Controller
function setup () {
	buildTemplates();


	//Sign In Listeners
	$('#main').on('click','#register',handleRegister);
	$('#main').on('click','#login',handleLogin);
	$('#main').on('click','#sign-out',handleSignOut);
	firebase.auth().onAuthStateChanged(handleAuthStateChange);	
}

function signedInSetup() {

	firebase.database().ref('players').on('value',checkGameStart);
	firebase.database().ref('clues').on('child_added',renderClue);

	firebase.database().ref('gameStats').child('turn').on('value',playTurn);
}

function playTurn(snapshot) {
	var userID = firebase.auth().currentUser.uid;
	var player = firebase.database().ref('players').child(userID);

	if (player.turn == snapshot.val()) {
		if (player.role == 'Guesser') {
			$('#wordgrid').on('click','td',revealTeam);
		}
		if (player.role == 'Cluemaster') {
			$('#clueform').html(clueForm);
			$('#clueform').on('click','submit',handleClue);
		}
		
	}
}

function handleClue() {
	var clue = $('input[name="clue"').val();
	var number = $('input[name="number"').val();

	//this seems roundabout. Can we assume that this function only runs for current player?
	var gameStats = firebase.database.ref('gameStats');
	var turn = gameStats.child('turn').val();
	var currentPlayer = gameStats.child('turnOrder').child(turn).val();
	var team = firebase.database().ref('players').child(currentPlayer).child('team').val();

	firebase.database().ref('clues').push({
		clue: clue,
		number: number,
		team: team
	},function() {
		$('#clueform').off('click','submit');
		$('#clueform').html('');
		gameStats.child('turn').update( (turn + 1) % 4);
	});
}

function revealTeam() {
	var wordId = $(this).attr('id');
	var word = firebase.database().ref('words').child(wordId);
	var gameStats = firebase.database.ref('gameStats');
	var guesses = gameStats.child('guesses');
	var score = gameStats.child('score');

	//if has guesses left and the word's not been guessed
	if (guesses.val() && !word.child(isGuessed).val()) {
		//one less guess
		guesses.update(guesses.val() - 1);
		//reveal word in Model
		word.child(isGuessed).update(true);
		//update score
		switch (word.child('team').val()) {
			case 'Red':
				score.update({
					Red: score.Red.val() - 1
				});
				break;
			case 'Blue':
				score.update({
					Blue: score.Blue.val() - 1
				});
				break;
			case 'Assassin':
				if (firebase.database().ref('gameStats').child('turn').val() == 1) {
					score.update({
						Blue: 0
					});				
				} else {
					score.update({
						Red: 0
					});	
				}
		}

		//this seems roundabout. Can we assume that this function only runs for current player?
		var turn = gameStats.child('turn').val();
		var currentPlayer = gameStats.child('turnOrder').child(turn).val();
		var currentPlayerTeam = firebase.database().ref('players').child(currentPlayer).child('team').val();
		//if the current player guessed the wrong color or is out of guesses
		if (word.child(team).val() != currentPlayerTeam || !guesses.val() ) {
			$('#wordgrid').off('click','td');
			gameStats.child('turn').update( (turn + 1) % 4);
		}
	}

	renderBoard();
}

function checkGameStart(snapshot) {
	var players = snapshot.val();
	var userID = firebase.auth().currentUser.uid;
	var playerKeys = Object.keys(players);
	if (playerKeys.length >= 4 && !Model.gameStarted) {

		firebase.database().ref('words').on('value',renderBoard);
		Model.gameStarted = true; //belongs somewhere else?
		var signupNum = playerKeys.indexOf(userID);

		switch (signupNum) {
			case 0:
				firebase.database().ref('players').child(userID).set({
					role: 'Cluemaster',
					team: 'Red',
					turn: signupNum
				});
				console.log('your role is Red Cluemaster');
				break;
			case 1:
				firebase.database().ref('players').child(userID).set({
					role: 'Guesser',
					team: 'Red',
					turn: signupNum
				});
				console.log('your role is Red Guesser');
				break;
			case 2:
				firebase.database().ref('players').child(userID).set({
					role: 'Cluemaster',
					team: 'Blue',
					turn: signupNum
				});
				console.log('your role is Blue Cluemaster');
				break;
			case 3:
				firebase.database().ref('players').child(userID).set({
					role: 'Guesser',
					team: 'Blue',
					turn: signupNum
				});
				console.log('your role is Blue Guesser');
				//Only initGame via one person
				initGame();
				break;
			default:
				//anything?
				firebase.database().ref('players').child(userID).set({
					role: 'Observer',
					team: 'Observer',
					turn: undefined
				});
		}

		//will this work?
		firebase.database().ref('gameStats').child('turnOrder').child(signupNum).set(userID);

	} else if (players.length < 4) {
		//need better hold music
		console.log('waiting for more players. Currently at ' + players.length);
	}
}

//Game setup functions

function initGame () {
	//wipe old data
	firebase.database().ref('gameStats').remove(function () {
		firebase.database().ref('players').on('value',function (snapshot) {
			var players = snapshot.val();
			var playerKeys = Object.keys(players);
			for (var i = 0; i < 4; i++) {
				firebase.database().ref('gameStats').child('turnOrder').child(i).set(playerKeys[i]);
			}
			firebase.database().ref('players').off('value');
		});
	});

	//randomly determine who goes first
	if (Math.random() < 0.5) {
		Model.teamOne = 'Red';
		firebase.database().ref('gameStats').set({
			turn: 0,
			//declare score, or just calculate it for display?
			score: {
				Red: 9,
				Blue: 8
			}
		});
//		Model.teamOne = "Red";
//		Model.turnIndex = 0;
	} else {
		Model.teamOne = 'Blue';
		firebase.database().ref('gameStats').set({
			turn: 2,
			score: {
				Red: 8,
				Blue: 9
			}
		});
//		Model.teamOne = "Blue";
//		Model.turnIndex = 2;
	}
//	Model.score[Model.teamOne] = 1;

	//clear out last game's words, then pick new ones
	firebase.database().ref('words').remove(pickWords);
}

function pickWords() {
	firebase.database().ref('wordBank').on('value',function (snapshot) {
		var wordBank = snapshot.val();
		var wordBankKeys = Object.keys(wordBank);
		var wordIndices = pickItems(wordBankKeys.length, Model.boardSize);

		//Each team gets 1/3 of the non-assassins
		var agentsPerTeam = (Model.boardSize - 1) / 3;

		//Hard coding during init instead of making it generalizable
//		Model.score.Red += agentsPerTeam;
//		Model.score.Blue += agentsPerTeam;

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
				//extra agent goes to starting team
				team = Model.teamOne;
			} else {
				team = "Blue";
			}

			var word = wordBank[wordBankKeys[i]];

			firebase.database().ref('words').push({
				word: word,
				team: team,
				isGuessed: false
			});
		}
	});

}

//Login Functions

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
	var user = firebase.auth().currentUser;
	firebase.database().ref('players').child(user.uid).remove(function () {
		firebase.auth().signOut();
	});
}

function handleAuthStateChange() {
	var user = firebase.auth().currentUser; //undefined if not logged in, object if so
	if (user) {
		Model.loggedIn = true;
		Model.user = user;
		firebase.database().ref('players').child(user.uid).set({
			role: 'placeholder',
			team: 'placeholder',
			turn: 'placeholder'
		});
		signedInSetup();
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


$(document).ready(setup);