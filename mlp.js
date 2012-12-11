function lolPonies() {
	var player;
	var MAX_X = 800, MAX_Y = 500;
	var image = 'images/flutter.png';
	var friends = new SpriteList();
	var anim;
	var id_list = {};
	var MY_ID = "super cool kid"

	this.setup = function() {
		player = new jaws.Sprite({x: 256, y:256, scale: 2, anchor: "center"});
		player.move = function(x,y) {
				this.x += x;
				this.y += y;
		} //end of move

		anim = new jaws.Animation({sprite_sheet: image, frame_size: [32,32], frame_duration: 150});
		player.default = anim.frames[0];
		player.down = anim.slice(0,4); 
		player.up = anim.slice(12,16);
		player.left = anim.slice(4,8);
		player.right = anim.slice(8,12);

		player.setImage(player.default);
		jaws.preventDefaultKeys(["up", "down", "left", "right", "space", "w", "a", "s", "d"]);
	} //end of setup

	this.update = function() {
		var move = 2;
		var cur_x = player.x;
		var cur_y = player.y;
		var action = 'acting like a pony';
		if(jaws.pressed("left") || jaws.pressed("a"))  { player.move(-move,0);  player.setImage(player.left.next()); action = 'left'; }
		else if(jaws.pressed("right") || jaws.pressed("d")) { player.move(move,0);   player.setImage(player.right.next()); action = 'right'; }
		else if(jaws.pressed("up") || jaws.pressed("w"))    { player.move(0, -move); player.setImage(player.up.next()); action = 'up'; }
		else if(jaws.pressed("down") || jaws.pressed("s"))  { player.move(0, move);  player.setImage(player.down.next()); action = 'down'; }

		forceInside(player);

		if (player.x !== cur_x || player.y !== cur_y) socket.emit('player_move', {x: player.x, y: player.y, action: action});
	} //end of update


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
		text();
		player.draw()

		// only draw if the sprite is in the id list
		friends.drawIf(function(sprite) {
			return (sprite.id in id_list);
		});
	} //end of draw

	function forceInside(item) { // stay in the box you naughty pony!
		if(item.x < item.width/2) { item.x = item.width/2 };
		if(item.x + item.width/2 > jaws.width) { item.x = jaws.width - item.width/2 };
		if(item.y < item.height/2) { item.y = item.height/2 };
		if(item.y + item.height/2 > jaws.height) { item.y = jaws.height - item.height/2 };
	}

	// when a new player connects - add them to friends list!
	socket.on('new_player', function (friend) {
		id_list[friend.id] = friend.id; // add new guy to the id list
		//console.log('friends: ', id_list);
		var sprite = new Sprite({image: anim.frames[0], x: friend.x, y: friend.y, scale: 2, anchor: "center"})
		assignShit(sprite,friend);
		friends.push(sprite);
	});

	// when we join - add all the other friends!
	socket.on('add_players', function (friends_list) {
		//console.log('friends list: ', friends_list);
		for(friend in friends_list) { //here friend is the id, index?
			id_list[friend] = friends_list[friend].id; // add the old guys to the id list
			var sprite = new Sprite({image: anim.frames[0], x: friends_list[friend].x, y: friends_list[friend].y, scale: 2, anchor: "center"});
			assignShit(sprite,friends_list[friend]);
			friends.push(sprite);
		}
		//console.log('friends: ', id_list)
	});
	
	// when a friend leaves - delete them from the list
	socket.on('remove_player', function (id) {
		delete id_list[id];
		//console.log('friends:', id_list);
		friends.deleteIf(function(sprite) {
			return !(sprite.id in id_list);
		});
	})

	socket.on('player_move', function (data) {
		//console.log('player_move: ', data);
		friends.forEach(function(sprite) {
			if (sprite.id == data.id) {
				sprite.meow(data);
			}
		});
	});

	socket.on('id', function (myID) {
		MY_ID = myID;
	});

	function text(array) { // shows a list of ids for people connected
		jaws.context.font = "bold 20pt terminal";
		jaws.context.lineWidth = 10;
		jaws.context.fillStyle = "Red";
		jaws.context.strokeStyle = "rgba(200,200,200,0.0)";
		jaws.context.fillText(MY_ID, 10, 25);
		jaws.context.fillStyle = "Black"
		var count = 1;
		for (var i in id_list) {
			jaws.context.fillText(id_list[i], 10, 25+count*25);
			count += 1;
		}
	}

	function assignShit(sprite, data) {
		sprite.id = data.id;
		sprite.default = anim.frames[0];
		sprite.down = anim.slice(0,4); 
		sprite.up = anim.slice(12,16);
		sprite.left = anim.slice(4,8);
		sprite.right = anim.slice(8,12);
		sprite.meow = meow;
		sprite.meow(data);
	}
} //end of lolPonies

