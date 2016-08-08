//Model
var Model = {
	allWords: [
		"africa",
		"agent",
		"air",
		"alien",
		"alps",
		"amazon",
		"ambulance",
		"angel",
		"antarctica",
		"apple",
		"arm",
		"aztec",
		"back",
		"ball",
		"band",
		"bank",
		"bar",
		"bark",
		"battery",
		"beach",
		"bear",
		"beat",
		"bed",
		"beijing",
		"belt",
		"berlin",
		"bermuda",
		"berry",
		"block",
		"board",
		"bolt",
		"bond",
		"boom",
		"boot",
		"bow",
		"box",
		"bridge",
		"buffalo",
		"bug",
		"bugle",
		"button",
		"calf",
		"canada",
		"capital",
		"card",
		"carrot",
		"casino",
		"cell",
		"center",
		"chair",
		"change",
		"check",
		"chick",
		"china",
		"chocolate",
		"church",
		"circle",
		"cloak",
		"club",
		"cold",
		"compound",
		"conductor",
		"copper",
		"cotton",
		"court",
		"cover",
		"crane",
		"crash",
		"cricket",
		"cross",
		"dance",
		"date",
		"day",
		"death",
		"deck",
		"degree",
		"diamond",
		"dice",
		"dinosaur",
		"disease",
		"doctor",
		"dog",
		"draft",
		"dress",
		"drill",
		"drop",
		"dwarf",
		"eagle",
		"egypt",
		"embassy",
		"engine",
		"england",
		"europe",
		"eye",
		"face",
		"fair",
		"fall",
		"fan",
		"field",
		"file",
		"film",
		"fire",
		"fish",
		"flute",
		"fly",
		"force",
		"forest",
		"fork",
		"france",
		"future",
		"gas",
		"germany",
		"ghost",
		"giant",
		"glass",
		"glove",
		"gold",
		"grace",
		"grass",
		"greece",
		"green",
		"ground",
		"ham",
		"hand",
		"hawk",
		"head",
		"heart",
		"himalayas",
		"hole",
		"hollywood",
		"hood",
		"hook",
		"horn",
		"horse",
		"horseshoe",
		"hospital",
		"hotel",
		"ice",
		"ice cream",
		"india",
		"iron",
		"ivory",
		"jam",
		"jet",
		"jupiter",
		"kangaroo",
		"ketchup",
		"kid",
		"king",
		"kiwi",
		"knife",
		"knight",
		"lab",
		"lap",
		"laser",
		"lawyer",
		"lead",
		"lemon",
		"limousine",
		"line",
		"link",
		"lion",
		"litter",
		"lock",
		"log",
		"london",
		"luck",
		"mammoth",
		"maple",
		"marble",
		"march",
		"mass",
		"match",
		"mercury",
		"mexico",
		"microscope",
		"millionaire",
		"mine",
		"mint",
		"missile",
		"model",
		"mole",
		"moon",
		"moscow",
		"mount",
		"mouse",
		"mouth",
		"mug",
		"needle",
		"net",
		"new york",
		"night",
		"note",
		"novel",
		"nurse",
		"nut",
		"octopus",
		"oil",
		"olive",
		"olympus",
		"opera",
		"orange",
		"palm",
		"pan",
		"pants",
		"paper",
		"paris",
		"park",
		"part",
		"paste",
		"penguin",
		"phoenix",
		"piano",
		"pie",
		"pilot",
		"pin",
		"pitch",
		"platypus",
		"plot",
		"point",
		"poison",
		"police",
		"pool",
		"port",
		"pound",
		"press",
		"princess",
		"pupil",
		"queen",
		"rabbit",
		"racket",
		"ray",
		"revolution",
		"ring",
		"robin",
		"robot",
		"rock",
		"rome",
		"root",
		"rose",
		"roulette",
		"round",
		"row",
		"ruler",
		"satellite",
		"saturn",
		"scale",
		"scientist",
		"scorpion",
		"scuba diver",
		"seal",
		"server",
		"shadow",
		"ship",
		"shoe",
		"shot",
		"sink",
		"skyscraper",
		"slip",
		"slug",
		"snow",
		"snowman",
		"sock",
		"soul",
		"sound",
		"space",
		"spell",
		"spider",
		"spike",
		"spot",
		"spring",
		"spy",
		"square",
		"stadium",
		"staff",
		"star",
		"state",
		"stick",
		"straw",
		"string",
		"sub",
		"swing",
		"switch",
		"table",
		"tablet",
		"tail",
		"tap",
		"teacher",
		"telescope",
		"temple",
		"tick",
		"tie",
		"time",
		"tokyo",
		"tooth",
		"torch",
		"tower",
		"track",
		"triangle",
		"trip",
		"turkey",
		"undertaker",
		"unicorn",
		"vacuum",
		"van",
		"vet",
		"wake",
		"wall",
		"war",
		"washer",
		"washington",
		"water",
		"wave",
		"web",
		"well",
		"whale",
		"whip",
		"wind",
		"witch",
		"worm",
		"yard",
		"shakespeare"
	],
	gameWords: [],
	boardSize: 25,
	teamOne: undefined,
	redScore: 0,
	blueScore: 0,
	user: {
		team: "Red",
		role: "Cluemaster"
	}

};

//View
var boardTemplate;
//var scoreTemplate;

function buildTemplates() {
	var boardSource = $('#board-template').html();
	boardTemplate = Handlebars.compile(boardSource);

//	var scoreSource = $('#score-template').html();
//	scoreTemplate = Handlebars.compile(scoreSource);
}

function renderBoard() {
	//passThis is inelegant, but I don't know how to get Handlebars to iterate through var words otherwise
	var passThis = { words: [] };
	$('#wordgrid table').html('');

	for (var i = 0; i < Model.boardSize; i++) {
		var color = (Model.gameWords[i].isGuessed) ? Model.gameWords[i].team :
			((Model.user.role == 'Cluemaster') ? 'hidden' + Model.gameWords[i].team : '');
		passThis.words.push({
			color: color,
			word: Model.gameWords[i].word
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
	}
}

function renderScore() {
	$('#redclues .score').html('Agents Left: ' + Model.redScore);
	$('#blueclues .score').html('Agents Left: ' + Model.blueScore);
}

//Controller
function setup () {
	//randomly determine who goes first
	if (Math.random() < 0.5) {
		Model.teamOne = "Red";
		Model.redScore = 1;
	} else {
		Model.teamOne = "Blue";
		Model.blueScore = 1;
	}
	pickWords();
	buildTemplates();
	renderBoard();
	renderScore();

	$('#wordgrid').on('click','td',revealTeam);
}

function pickWords() {
	var wordIndices = pickItems(Model.allWords.length, Model.boardSize);

	//Each team gets 1/3 of the non-assassins
	var agentsPerTeam = (Model.boardSize - 1) / 3;
	Model.redScore += agentsPerTeam;
	Model.blueScore += agentsPerTeam;
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
		Model.gameWords.push({
			word: Model.allWords[ wordIndices[i] ],
			team: team,
			isGuessed: false
		});
	}
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
				Model.redScore--;
				renderScore();
			} else if (Model.gameWords[i].team == "Blue") {
				Model.blueScore--;
				renderScore();
			}
			break;
		}
	}
	renderBoard();
}

$(document).ready(setup);