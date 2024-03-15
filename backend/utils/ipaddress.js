function normalize_ipv6(ip) {
	ip = ip.replace(/^:|:$/g, "");
	ip = ip.split(":");
	
	for(var i = 0; i < ip.length; i++) {
		var seg = ip[i];
		if(seg) {
			ip[i] = seg.padStart(4, "0");
		} else {
			seg = [];
			for(var a = ip.length; a <= 8; a++) {
				seg.push("0000");
			}
			ip[i] = seg.join(":");
		}
	}
	return ip.join(":");
}

function ipv4_to_int(str) {
	str = str.split(".").map(function(e) {
		return parseInt(e, 10);
	});
	return str[0] * 16777216 + str[1] * 65536 + str[2] * 256 + str[3];
}

// ipv6 must be normalized
function ipv6_to_int(str) {
	str = str.split(":").map(function(e) {
		return BigInt(parseInt(e, 16));
	});
	return str[7] | str[6] << 16n | str[5] << 32n | str[4] << 48n | str[3] << 64n | str[2] << 80n | str[1] << 96n | str[0] << 112n;
}

function ipv4_to_range(ip) {
	ip = ip.trim();
	ip = ip.split("/");
	var addr = ip[0];
	var sub = parseInt(ip[1]);
	if(isNaN(sub)) sub = 32;
	var num = ipv4_to_int(addr);
	var ip_start = unsigned_u32_and(num, subnetMask_ipv4(sub));
	var ip_end = unsigned_u32_or(num, subnetOr_ipv4(sub));
	return [ip_start, ip_end];
}

function ipv6_to_range(ip) {
	ip = ip.split("/");
	var addr = ip[0];
	var sub = parseInt(ip[1]);
	if(isNaN(sub)) sub = 128;
	addr = normalize_ipv6(addr);
	var num = ipv6_to_int(addr);
	var ip_start = num & subnetMask_ipv6(sub);
	var ip_end = num | subnetOr_ipv6(sub);
	return [ip_start, ip_end];
}

var u32Byte = new Uint32Array(1);
function unsigned_u32_and(x, y) {
	u32Byte[0] = x;
	u32Byte[0] &= y;
	return u32Byte[0];
}

function unsigned_u32_or(x, y) {
	u32Byte[0] = x;
	u32Byte[0] |= y;
	return u32Byte[0];
}

function subnetMask_ipv4(num) {
	return ((1 << 32) - 2 >>> 0) - (2 ** (32 - num) - 1);
}

function subnetOr_ipv4(num) {
	return 2 ** (32 - num) - 1;
}

function subnetMask_ipv6(num) {
	return ((1n << 128n) - 1n) - (1n << (128n - BigInt(num))) + 1n;
}

function subnetOr_ipv6(num) {
	return ((1n << (128n - BigInt(num))) - 1n);
}

module.exports = {
	normalize_ipv6,
	ipv4_to_int,
	ipv6_to_int,
	ipv4_to_range,
	ipv6_to_range
};