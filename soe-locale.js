var fs = require("fs"),
    path = require("path");

function parseIndex(data) {

}

function parse(dataFile, indexFile, callback) {
    fs.readFile(dataFile, function(err, data) {
        if (err) {
            callback(err); 
            return;
        }

        fs.readFile(indexFile, function(err, indexData) {
            if (err) {
                callback(err); 
                return;
            }

            var strings = parseFromBuffer(data, indexData);

            callback(null, strings);
        });
    });
}

function parseFromBuffer(data, indexData) {
    var strings = {},
        lines = indexData.toString("utf-8").split("\n");

    for (var i=0;i<lines.length;i++) {
        var line = lines[i];
        if (line.length > 0 && line[0] != "#") {
            var parts = line.split("\t"),
                hash = +parts[0],
                dataStart = +parts[1],
                dataLength = +parts[2],
                stringData = data.slice(dataStart, dataStart+dataLength).toString("utf-8"),
                stringParts = stringData.split("\t"),
                flags = stringParts[1],
                string = stringParts.slice(2).join("\t");
		strings[i] = {
                hash: hash,
                flags: flags,
                string: string
            };
        }
    }

    return strings;
}

function write(strings, dataFile, indexFile, callback) {
    var dataStream = fs.createWriteStream(dataFile),
        indexStream = fs.createWriteStream(indexFile),
        header = new Buffer(3),
        offset = 0,
        string, dataLength;
    
    header.writeUInt8(0xEF, 0);
    header.writeUInt8(0xBB, 1);
    header.writeUInt8(0xBF, 2);

    dataStream.write(header);
    offset += 3;

    indexStream.write("## Count:   " + Object.keys(strings).length + "\r\n");

    for (var i=0;i<Object.keys(strings).length;i++) {
    //for (var i=0;i<100;i++) { //debug loop
        string = strings[Object.keys(strings)[i]];

	process.stdout.write("Writing... " + i + "/" + Object.keys(strings).length + "\r"); //status output

        dataLength = (string.hash+"").length + string.flags.length + string.string.length + 2;

        indexStream.write(string.hash + "\t" + offset + "\t" + dataLength + "\t" + "d\r\n");
        dataStream.write(string.hash + "\t" + string.flags + "\t" + string.string + "\r\n");

        offset += dataLength + 2;
    }

    dataStream.end();
    indexStream.end();
}

exports.parse = parse;
exports.parseFromBuffer = parseFromBuffer;
exports.write = write;
