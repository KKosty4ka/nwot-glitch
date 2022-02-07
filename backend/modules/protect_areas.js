function isMainPage(name) {
	return name == "" || name.toLowerCase() == "main";
}

module.exports = async function(data, vars, evars) {
	var user = evars.user;
	var channel = evars.channel;
	var world = evars.world;

	var san_nbr = vars.san_nbr;
	var tile_database = vars.tile_database;

	var memkeyAccess = world.opts.memKey && world.opts.memKey == evars.keyQuery;

	var is_owner = user.id == world.ownerId || (user.superuser && isMainPage(world.name));
	var is_member = !!world.members.map[user.id] || memkeyAccess || (user.superuser && isMainPage(world.name));

	var action = data.action;
	var tileX = san_nbr(data.tileX);
	var tileY = san_nbr(data.tileY);
	var charX = san_nbr(data.charX);
	var charY = san_nbr(data.charY);
	var precise = data.precise;
	var type = data.type;

	var no_log_edits = world.opts.noLogEdits;

	var protect_type = void 0;
	if(type == "owner-only") {
		protect_type = 2;
	}
	if(type == "member-only") {
		protect_type = 1;
	}
	if(type == "public") {
		protect_type = 0;
	}
	if(protect_type == void 0 && action != "unprotect") {
		return [true, "PARAM"];
	}
	if(action == "unprotect") {
		protect_type = null;
	}

	// the x position going from 0 - 127 may be used at times
	var charIdx = charY * CONST.tileCols + charX;
	charX = charIdx % CONST.tileCols;
	charY = Math.floor(charIdx / CONST.tileCols);

	if(charIdx < 0 || charIdx >= CONST.tileArea) { // out of range coords
		return [true, "PARAM"];
	}

	var call_id = tile_database.newCallId();
	tile_database.reserveCallId(call_id);

	tile_database.write(call_id, tile_database.types.protect, {
		tileX, tileY, charX, charY,
		user, world, is_member, is_owner,
		type, precise, protect_type,
		channel, no_log_edits,
		no_update: false
	});

	var resp = await tile_database.editResponse(call_id);

	return resp;
}