var pony;
jaws.onload = function() {
	jaws.unpack();
	jaws.assets.root = "images/";
	jaws.assets.add(["flutter.png","apple.png","pinkie.png","rainbow.png","twilight.png","rarity.png"]);
	jaws.start(lolMenu, {fps: 30});
}

function lolPonies() {
	var player;
	var friends = new SpriteList();
	var anim = {};
	var id_list = {};
	var MY_ID = "super cool kid"

	this.setup = function() {

		socket.emit('init', pony);
		player = new jaws.Sprite({x: 256, y:256, scale: 2, anchor: "center"});
		player.move = function(x,y) { this.x += x; this.y += y;	} //end of move

		anim["Fluttershy"] = new jaws.Animation({sprite_sheet: "flutter.png", frame_size: [32,32], frame_duration: 150});
		anim["Applejack"] = new jaws.Animation({sprite_sheet: "apple.png", frame_size: [32,32], frame_duration: 150});
		anim["Rainbow Dash"] = new jaws.Animation({sprite_sheet: "rainbow.png", frame_size: [32,32], frame_duration: 150});
		anim["Pinkie Pie"] = new jaws.Animation({sprite_sheet: "pinkie.png", frame_size: [32,32], frame_duration: 150});
		anim["Twilight Sparkle"] = new jaws.Animation({sprite_sheet: "twilight.png", frame_size: [32,32], frame_duration: 150});
		anim["Rarity"] = new jaws.Animation({sprite_sheet: "rarity.png", frame_size: [32,32], frame_duration: 150});

		player.default = anim[pony].frames[0];
		player.down = anim[pony].slice(0,4); 
		player.up = anim[pony].slice(12,16);
		player.left = anim[pony].slice(4,8);
		player.right = anim[pony].slice(8,12);
		player.message = '';

		player.setImage(player.default);
		jaws.preventDefaultKeys(["up", "down", "left", "right", "backspace"]);
	} //end of setup

	var typing = false;
	this.update = function() {
		var move = 120 / jaws.game_loop.fps / (1+1/jaws.game_loop.tick_duration);
		if (move > 20)	return; // stops it being jump initially

	//	document.getElementById("fps").innerHTML = "fps: "+ jaws.game_loop.fps;
	//	document.getElementById("tick").innerHTML = "tick: "+ jaws.game_loop.tick_duration;
	//	document.getElementById("speed").innerHTML = "<br>speed: "+ move;
	//	document.getElementById("speed2").innerHTML = "<br>p/s: "+ (move*jaws.game_loop.fps);
		
		var cur_x = player.x, cur_y = player.y;
		var action = 'acting like a pony';

		jaws.on_keydown("enter", function() {
			if (typing) {
				typing = false;
				socket.emit('message', player.message);
				player.time = (new Date).getTime();
			} else {
				typing = true;
				player.message = '';
			}

		});
		jaws.on_keydown("backspace", function () {
			player.message = player.message.substring(0,player.message.length-1);
		})


		if (!typing) {
			if(jaws.pressed("left") || jaws.pressed("a"))  { player.move(-move,0);  player.setImage(player.left.next()); action = 'left'; }
			else if(jaws.pressed("right") || jaws.pressed("d")) { player.move(move,0);   player.setImage(player.right.next()); action = 'right'; }
			else if(jaws.pressed("up") || jaws.pressed("w"))    { player.move(0, -move); player.setImage(player.up.next()); action = 'up'; }
			else if(jaws.pressed("down") || jaws.pressed("s"))  { player.move(0, move);  player.setImage(player.down.next()); action = 'down'; }
		}
		forceInside(player);

		if (player.x !== cur_x || player.y !== cur_y) socket.emit('player_move', {x: player.x, y: player.y, action: action});
	} //end of update

	$(document).keypress(function(e) {
		if (typing) {
    		var charStr = String.fromCharCode(e.keyCode);
    		player.message = player.message+charStr;
	    }
	});


	function meow(data) {
		this.x = data.x;
		this.y = data.y;
		switch(data.action) {
			case "left": this.setImage(this.left.next()); break;
			case "right": this.setImage(this.right.next()); break;
			case "up": this.setImage(this.up.next()); break;
			case "down": this.setImage(this.down.next()); break;
			default: break;
		} 
	} //end of friends.update

	this.draw = function() {
		jaws.clear()
		player.draw()

		// only draw if the sprite is in the id list
		friends.drawIf(function(sprite) {
			return (sprite.id in id_list);
		});

		text();

		//document.getElementById("players").innerHTML = "<br><br>players: "+ (Object.keys(id_list).length+1);
	} //end of draw

	function forceInside(item) { // stay in the box you naughty pony!
		if(item.x < item.width/2) { item.x = item.width/2 };
		if(item.x + item.width/2 > jaws.width) { item.x = jaws.width - item.width/2 };
		if(item.y < item.height/2) { item.y = item.height/2 };
		if(item.y + item.height/2 > jaws.height) { item.y = jaws.height - item.height/2 };
	}

	// when a new player connects - add them to friends list!
	socket.on('new_player', function (friend) {
		id_list[friend.id] = { id:friend.id }; // add new guy to the id list
		var sprite = new Sprite({image: anim[friend.pony].frames[0], x: friend.x, y: friend.y, scale: 2, anchor: "center"})
		assignShit(sprite,friend);
		friends.push(sprite);
	});

	// when we join - add all the other friends!
	socket.on('add_players', function (friends_list) {
		for(thing in friends_list) { //here friend is the id, index?
			var friend = friends_list[thing];
			id_list[friend.id] = { id:friend.id }; // add the old guys to the id list
			var sprite = new Sprite({image: anim[friend.pony].frames[0], x: friend.x, y: friend.y, scale: 2, anchor: "center"});
			assignShit(sprite,friend);
			friends.push(sprite);
		}
	});
	
	// when a friend leaves - delete them from the list
	socket.on('remove_player', function (id) {
		delete id_list[id];
		friends.deleteIf(function(sprite) {
			return !(sprite.id in id_list);
		});
	})

	socket.on('player_move', function (data) {
		friends.forEach(function(sprite) {
			if (sprite.id == data.id) {
				sprite.meow(data);
			}
		});
	});

	socket.on('id', function (myID) {
		MY_ID = myID;
	});

	socket.on('message', function (message, id) {
		friends.forEach(function(sprite) {
			if (sprite.id == id) {
				id_list[sprite.id].time = (new Date).getTime();
				sprite.message = message;
			}
		})
		//$('div#messages').append(message+'<br>');
	});

	function assignShit(sprite, data) {
		sprite.id = data.id;
		sprite.default = anim[data.pony].frames[0];
		sprite.down = anim[data.pony].slice(0,4); 
		sprite.up = anim[data.pony].slice(12,16);
		sprite.left = anim[data.pony].slice(4,8);
		sprite.right = anim[data.pony].slice(8,12);
		sprite.meow = meow;
		sprite.meow(data);
	} //end of assignShit

	function text() {
		jaws.context.font = "15pt terminal";
		jaws.context.textAlign = 'center';

		jaws.context.fillText(player.message, player.x, player.y-50);
		if (!typing && (((new Date).getTime() - player.time) > 5000)) player.message = '';

		friends.forEach(function(sprite) {
			if (sprite.message) {
				jaws.context.fillText(sprite.message,sprite.x,sprite.y-50);

				if (((new Date).getTime() - id_list[sprite.id].time) > 5000) {
					sprite.message = null;
				}
			}
		});
	}

} //end of lolPonies

function lolMenu() {
		var index = 0;
		var items = ["Applejack", "Pinkie Pie", "Fluttershy", "Rainbow Dash", "Rarity", "Twilight Sparkle"];

		this.setup = function() {
			index = 0;
			jaws.on_keydown(["down", "s"], function() { index++; if(index >= items.length) {index=items.length-1} } );
			jaws.on_keydown(["up","w"], function() { index--; if(index < 0) {index=0} } );
			jaws.on_keydown(["enter","space"], function() { pony=items[index]; jaws.switchGameState(lolPonies) } );
		} //end of setup

		this.draw = function() {

			jaws.clear();
			for(var i=0; items[i]; i++) {
				jaws.context.font = "bold 50pt terminal";
				jaws.context.lineWidth = 10;
				jaws.context.fillStyle = (i==index) ? "Red" : "Black";
				jaws.context.strokeStyle = "rgba(200,200,200,0.0)";
				jaws.context.fillText(items[i], 30, 100+i*65);
			} //end of draw
		}
	} //end of lolMenu


