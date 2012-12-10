function lolPonies() {
	var player;
	var MAX_X = 800, MAX_Y = 500;
	var image = 'images/flutter.png';
	var friends = new SpriteList();
	var anim;

	this.setup = function() {
		player = new jaws.Sprite({x: 256, y:256, scale: 2, anchor: "center"});
		player.move = function(x,y) {
			//if (this.x + x > 16 && this.x + x < MAX_X-16)
				this.x += x
			//if (this.y + y > 0 && this.y + y < MAX_Y)
				this.y += y
		} //end of move

		anim = new jaws.Animation({sprite_sheet: image, frame_size: [32,32], frame_duration: 150});
		player.anim_default = anim.frames[0];
		player.anim_down = anim.slice(0,4); 
		player.anim_up = anim.slice(12,16);
		player.anim_left = anim.slice(4,8);
		player.anim_right = anim.slice(8,12);

		player.setImage(player.anim_default);
		jaws.preventDefaultKeys(["up", "down", "left", "right", "space", "w", "a", "s", "d"]);
	} //end of setup

	this.update = function() {
		var move = 2;
		var cur_x = player.x;
		var cur_y = player.y;
		if(jaws.pressed("left") || jaws.pressed("a"))  { player.move(-move,0);  player.setImage(player.anim_left.next()) }
		else if(jaws.pressed("right") || jaws.pressed("d")) { player.move(move,0);   player.setImage(player.anim_right.next()) }
		else if(jaws.pressed("up") || jaws.pressed("w"))    { player.move(0, -move); player.setImage(player.anim_up.next()) }
		else if(jaws.pressed("down") || jaws.pressed("s"))  { player.move(0, move);  player.setImage(player.anim_down.next()) }
		if (player.x !== cur_x || player.y !== cur_y) socket.emit('player_move', {x: player.x, y: player.y})
	} //end of update

	this.draw = function() {
		jaws.clear()
		player.draw()
		friends.draw()
	} //end of draw

	socket.on('updateplayers', function (friend) {
		console.log(friend)
		console.log("wdwd")
		friends.push(new Sprite({image: anim.frames[0], x: friend.x, y: friend.y, scale: 2, anchor: "center"}));
	});
	
	socket.on('player_move', function (data) {
		console.log('player_move: ', data);
	});
} //end of lolPonies

